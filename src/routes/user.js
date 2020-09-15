const express = require('express');

const router = new express.Router();

const User = require('../models/user');
const { authCheck } = require('../middleware/auth');
const Recipe = require('../models/recipe');

router.get('', (req, res) => {
  res.send('hello!');
});

// Persist user in database. This will try to create the user if
// they dont exist and then return the user object
router.post('/user', authCheck, async (req, res) => {
  console.log(req.user);
  const {
    name, picture, email, sub,
  } = req.user;

  // Check if user already exists based on sub
  const existingUser = await User.findOne({ firebaseUUID: sub });

  if (existingUser) {
    res.status(200).json(existingUser);
  } else {
    const user = new User({
      name,
      profileUrl: picture,
      email,
      firebaseUUID: sub,
    });

    try {
      await user.save();
      res.status(201).json(user);
    } catch (err) {
      res.status(500).send(err);
    }
  }
});

// Fetch the authenticated user
router.get('/user', authCheck, async (req, res) => {
  const { email } = req.user;
  console.log(email);
  try {
    const foundUser = await User.findOne({ email });
    res.status(200).json(foundUser);
  } catch (err) {
    res.status(404).send(err);
  }
});

// Fetch the user with the given id (_id not firebase id)
router.get('/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const foundUser = await User.findOne({ _id: id });

    if (foundUser) {
      // Populate the users public recipes
      await foundUser.populate({ path: 'recipes', select: '_id name prepTime servings', match: { isPublic: true } }).execPopulate();
      console.log(foundUser.recipes);
      res.status(200).json({ user: foundUser, recipes: foundUser.recipes });
    } else {
      res.status(404).send();
    }
  } catch (err) {
    res.status(404).send(err);
  }
});

// Update existing user
router.patch('/user', authCheck, async (req, res) => {
  const user = await User.findOne({
    firebaseUUID: req.user.sub,
  });

  if (user) {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates' });
    }

    try {
      // eslint-disable-next-line no-return-assign
      updates.forEach((update) => user[update] = req.body[update]);
      await user.save();

      res.status(200).send(user);
    } catch (error) {
      res.status(500).send(error);
    }
  } else {
    res.status(404).send();
  }
});

// Delete existing user
router.delete('/user', authCheck, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUUID: req.user.sub });

    user.remove();
    res.status(200).send();
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

module.exports = router;
