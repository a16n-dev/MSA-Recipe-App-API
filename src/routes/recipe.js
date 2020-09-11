/* eslint-disable no-underscore-dangle */
const express = require('express');

const router = new express.Router();

const sharp = require('sharp');
const User = require('../models/user');
const authCheck = require('../middleware/auth');
const Recipe = require('../models/recipe');
const upload = require('../util/multer');

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
    authorName: user.name,
  });

  try {
    await recipe.save();
    console.log(recipe);
    res.status(201).json({ id: recipe._id });
  } catch (err) {
    res.status(500).send(err);
  }
});

// Get all recipes for specified user
router.get('/recipe', authCheck, async (req, res) => {
  // Get the user who sent the request
  console.log(req.user.sub);
  const user = await User.findOne({ firebaseUUID: req.user.sub });
  console.log(user);
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
      res.status(401).send('Unauthorized'); // User does not have permission to view
    }
  } else {
    res.status(404).send(); // No recipe found
  }
});

// Delete recipe by id, only if the person is the owner or the recipe is public
router.delete('/recipe/:id', authCheck, async (req, res) => {
  // Get the user who sent the request
  const user = await User.findOne({ firebaseUUID: req.user.sub });

  // Find the specific recipe
  const recipe = await Recipe.findOne({ _id: req.params.id });

  if (recipe) {
    if (recipe.user.toString() === user._id.toString()) {
      recipe.remove();
      res.status(200).send();
    } else {
      res.status(401).send('Unauthorized'); // User does not have permission to view
    }
  } else {
    res.status(404).send(); // No recipe found
  }
});

// Update existing recipe, only if user is recipe owner
router.patch('/recipe/:id', authCheck, async (req, res) => {
  // The user who send the request
  const user = await User.findOne({ firebaseUUID: req.user.sub });

  const recipe = await Recipe.findOne({ _id: req.params.id });

  if (recipe) {
    // If user owns recipe
    if (recipe.user.toString() === user._id.toString()) {
      const updates = Object.keys(req.body);
      const allowedUpdates = ['name', 'ingredients', 'method', 'notes', 'public'];
      const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

      if (!isValidOperation) {
        res.status(400).send({ error: 'Invalid updates' });
      } else {
        try {
          // eslint-disable-next-line no-return-assign
          updates.forEach((update) => recipe[update] = req.body[update]);
          await recipe.save();

          res.send(recipe);
        } catch (error) {
          res.status(500).send(error);
        }
      }
    } else {
      res.status(401).send('Unauthorized'); // User does not have permission to view
    }
  } else {
    res.status(404).send('Recipe not found');
  }
});

// Set the image for a recipe
router.post('/recipe/:id/image', authCheck, upload.single('image'), async (req, res) => {
  // Get relevant db entries

  const user = await User.findOne({ firebaseUUID: req.user.sub });
  const recipe = await Recipe.findOne({ _id: req.params.id });

  // Process image
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
  recipe.image = buffer;
  await recipe.save();
  res.status(201).send();
}, (error, req, res, next) => {
  console.log(error.message);
  res.status(400).send({ error: error.message });
});

// serve the image for a recipe

// Get a profile picture for a user
router.get('/recipe/:id/image', async (req, res) => {
  const recipe = await Recipe.findOne({ _id: req.params.id });

  try {
    if (!recipe || !recipe.image) {
      throw new Error();
    }

    res.set('Content-Type', 'image/png');
    res.send(recipe.image);
  } catch (e) {
    res.status(404).send();
  }
});
module.exports = router;
