const express = require('express');

const router = new express.Router();

const User = require('../models/user');
const authCheck = require('../middleware/auth');

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
// Fetch the authenticated user
router.get('/user/:id', authCheck, async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const foundUser = await User.findOne({ _id: id });
    if (foundUser) {
      res.status(200).json(foundUser);
    } else {
      res.status(404).send();
    }
  } catch (err) {
    res.status(404).send(err);
  }
});

// Update existing user
router.patch('/users/me', authCheck, async (req, res) => {
  // Ensure only valid properties are specified
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates' });
  }

  try {
    updates.forEach((update) => req.user[update] = req.body[update]);
    await req.user.save();

    res.send(req.user);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete existing user
router.delete('/user', authCheck, async (req, res) => {
  try {
    await User.deleteOne({ firebaseUUID: req.user.sub });
    res.status(200).send();
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

module.exports = router;
