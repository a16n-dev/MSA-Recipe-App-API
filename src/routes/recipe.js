/* eslint-disable no-underscore-dangle */
const express = require('express');

const router = new express.Router();
const path = require('path');
const sharp = require('sharp');
const User = require('../models/user');
const { authCheck, authObserve } = require('../middleware/auth');
const Recipe = require('../models/recipe');
const upload = require('../util/multer');

/**
 * @swagger
 *
 * /recipe:
 *   post:
 *     description: Creates a recipe for the authenticated user
 *     produces:
 *       - application/json
 *     responses:
 *       201:
 *          description: Recipe created successfully
 *       500:
 *          description: Internal server error
 *     tags:
 *          - Recipes
 */
router.post('/recipe', authCheck, async (req, res) => {
  // Get the user who sent the request
  const user = await User.findOne({
    firebaseUUID: req.user.sub,
  });

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
    res.status(201).json({
      id: recipe._id,
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

/**
 * @swagger
 *
 * /recipe:
 *   get:
 *     description: Returns an array of all recipes created by the authenticated user
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *          description: Success
 *     tags:
 *          - Recipes
 */
router.get('/recipe', authCheck, async (req, res) => {
  // Get the user who sent the request
  console.log(req.user.sub);
  const user = await User.findOne({
    firebaseUUID: req.user.sub,
  });
  console.log(user);
  if (user) {
    // TODO: Pagination options?
    try {
      await user.populate('recipes', '_id name prepTime servings createdAt updatedAt').execPopulate();
      res.status(200).json(user.recipes);
    } catch (error) {
      console.log('bruh');
      res.status(400).send(error);
    }
  } else {
    res.status(404).send();
  }
});

/**
 * @swagger
 *
 * /recipe/{id}:
 *   get:
 *     description: Get a recipe by its id, only if the user is the owner or the recipe is public
 *     produces:
 *       - application/json
 *     responses:
 *        200:
 *          description: Success
 *        401:
 *          description: You are not authorized to view the recipe
 *        404:
 *          description: No recipe exists with the specified id
 *     tags:
 *          - Recipes
 */
router.get('/recipe/:id', authCheck, async (req, res) => {
  // Get the user who sent the request
  const user = await User.findOne({
    firebaseUUID: req.user.sub,
  });

  // Find the specific recipe
  const recipe = await Recipe.findOne({
    _id: req.params.id,
  });

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

router.get('/recipe/public/:id', authObserve, async (req, res) => {
  // Get the user who sent the request

  // Find the specific recipe
  const recipe = await Recipe.findOne({
    _id: req.params.id,
    isPublic: true,
  });

  if (recipe) {
    const data = recipe.toObject();
    delete data.notes;
    // Send data if user is owner or recipe is public
    res.status(200).json(data);
  } else {
    res.status(404).send(); // No recipe found
  }
});

// Delete recipe by id, only if the person is the owner or the recipe is public
router.delete('/recipe/:id', authCheck, async (req, res) => {
  // Get the user who sent the request
  const user = await User.findOne({
    firebaseUUID: req.user.sub,
  });

  // Find the specific recipe
  const recipe = await Recipe.findOne({
    _id: req.params.id,
  });

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
  const user = await User.findOne({
    firebaseUUID: req.user.sub,
  });

  const recipe = await Recipe.findOne({
    _id: req.params.id,
  });

  if (recipe) {
    // If user owns recipe
    if (recipe.user.toString() === user._id.toString()) {
      const updates = Object.keys(req.body);
      const allowedUpdates = ['name', 'ingredients', 'method', 'notes', 'isPublic', 'prepTime', 'servings'];
      const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

      if (!isValidOperation) {
        res.status(400).send({
          error: 'Invalid updates',
        });
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

  const user = await User.findOne({
    firebaseUUID: req.user.sub,
  });
  const recipe = await Recipe.findOne({
    _id: req.params.id,
  });

  // Process image
  const buffer = await sharp(req.file.buffer).resize({
    width: 250,
    height: 250,
  }).png().toBuffer();
  recipe.image = buffer;
  await recipe.save();
  res.status(201).send();
}, (error, req, res, next) => {
  console.log(error.message);
  res.status(400).send({
    error: error.message,
  });
});

// serve the image for a recipe

// Get the image for a recipe
router.get('/recipe/:id/image', async (req, res) => {
  const recipe = await Recipe.findOne({
    _id: req.params.id,
  });

  try {
    if (!recipe) {
      throw new Error();
    }

    res.set('Content-Type', 'image/png');

    if (recipe.image) {
      res.send(recipe.image);
    } else {
      res.sendFile(path.join(__dirname, '../assets/default.png'));
    }
  } catch (e) {
    console.log(e);
    res.status(404).send();
  }
});
module.exports = router;
