/* eslint-disable no-underscore-dangle */
const express = require('express');

const router = new express.Router();

const User = require('../models/user');
const authCheck = require('../middleware/auth');
const Recipe = require('../models/recipe');

// Create recipe for specified user
router.post('/recipe', authCheck, async (req, res) => {
  // Get the user who sent the request
  const user = await User.findOne({ firebaseUUID: req.user.sub });

  console.log(user);
  console.log(req.body);

  const recipe = new Recipe({
    ...req.body,
    // eslint-disable-next-line no-underscore-dangle
    user: user._id,
  });

  try {
    await recipe.save();
    res.status(201).send();
  } catch (err) {
    res.status(500).send(err);
  }
});

// Get all recipes for specified user
router.get('/recipe', authCheck, async (req, res) => {
  // Get the user who sent the request
  const user = await User.findOne({ firebaseUUID: req.user.sub });

  if (user) {
    // TODO: Pagination options?
    await user.populate('recipes').execPopulate();
    console.log(user.recipes);
    res.status(200).json(user.recipes);
  }
});

// Get recipe by id, only if the person is the owner or the recipe is public
router.get('/recipe/:id', authCheck, async (req, res) => {
  // Get the user who sent the request
  const user = await User.findOne({ firebaseUUID: req.user.sub });

  // Find the specific recipe
  const recipe = await Recipe.findOne({ _id: req.params.id });

  if (recipe) {
  // Send data if user is owner or recipe is public
    console.log(recipe);
    if (recipe.user.toString() === user._id.toString() || recipe.public === true) {
      res.status(200).json(recipe);
    } else {
      res.status(401).send('rip'); // User does not have permission to view
    }
  } else {
    res.status(404).send(); // No recipe found
  }
});

// Update existing recipe, only if user is recipe owner
router.patch('/recipe/:id', authCheck, async (req, res) => {
  // The user who send the request
  const user = await User.findOne({ firebaseUUID: req.user.sub });

  // Ensure only valid properties are specified
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'ingredients', 'method', 'public'];
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

module.exports = router;
