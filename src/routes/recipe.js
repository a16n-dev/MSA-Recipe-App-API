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

  const recipe = new Recipe({
    ...req.body,
    // eslint-disable-next-line no-underscore-dangle
    user: user._id,
    authorName: user.name,
  });

  await recipe.save();
  res.status(201).json({
    id: recipe._id,
  });
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
  const user = await User.findOne({
    firebaseUUID: req.user.sub,
  });
  if (user) {
    // TODO: Pagination options?

    await user.populate('recipes', '_id name prepTime servings createdAt updatedAt isPublic ingredients method').execPopulate();
    res.status(200).json(user.recipes);
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
    if (recipe.user.toString() === user._id.toString()) {
      res.status(200).json(recipe);
    } else {
      res.status(401).send('Unauthorized'); // User does not have permission to view
    }
  } else {
    res.status(404).send(); // No recipe found
  }
});

/**
 * @swagger
 *
 * /recipe/public/{id}:
 *   get:
 *     description: Returns the publicly available information for a public recipe
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *          description: Success
 *       404:
 *          description: Recipe not found
 *     tags:
 *          - Recipes
 */
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
    delete data.subscribers;
    delete data.image;

    if (req.user) {
      const user = await User.findOne({
        firebaseUUID: req.user.sub,
      });
      if (recipe.subscribers.find((v, i) => v.toString() === user._id.toString())) {
        data.subscribed = true;
      } else {
        data.subscribed = false;
      }
    }

    // Send data if user is owner or recipe is public
    res.status(200).json(data);
  } else {
    res.status(404).send(); // No recipe found
  }
});

/**
 * @swagger
 *
 * /recipe/{id}:
 *   delete:
 *     description: Deletes the recipe with the specified id
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *          description: Success
 *       401:
 *          description: User is not authorized to do this
 *       404:
 *          description: Recipe not found
 *     tags:
 *          - Recipes
 */
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

/**
 * @swagger
 *
 * /recipe/{id}:
 *   patch:
 *     description: Updates the recipe with the specified id
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *          description: Success
 *       400:
 *          description: Invalid updates were specified
 *       401:
 *          description: User is not authorized to do this
 *       500:
 *          description: Internal server error
 *     tags:
 *          - Recipes
 */
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
        // eslint-disable-next-line no-return-assign
        updates.forEach((update) => recipe[update] = req.body[update]);
        await recipe.save();

        res.status(200).send(recipe);
      }
    } else {
      res.status(401).send('Unauthorized'); // User does not have permission to view
    }
  } else {
    res.status(404).send('Recipe not found');
  }
});

/**
 * @swagger
 *
 * /recipe/{id}/image:
 *   post:
 *     description: Sets the display image for a recipe
 *     produces:
 *       - application/json
 *     responses:
 *       201:
 *          description: Success
 *       400:
 *          description: An error occured
 *       401:
 *          description: User is not authorized to do this
 *     tags:
 *          - Recipes
 */
router.post('/recipe/:id/image', authCheck, upload.single('image'), async (req, res) => {
  // Get relevant db entries

  const user = await User.findOne({
    firebaseUUID: req.user.sub,
  });
  const recipe = await Recipe.findOne({
    _id: req.params.id,
  });

  if (recipe.user.toString() === user._id.toString()) {
    // Process image
    const buffer = await sharp(req.file.buffer).resize({
      width: 250,
      height: 250,
    }).png().toBuffer();

    recipe.image = buffer;
    await recipe.save();
    res.status(201).send();
  } else {
    res.status(401).send();
  }
}, (error, req, res, next) => {
  res.status(400).send({
    error: error.message,
  });
});

/**
 * @swagger
 *
 * /recipe/{id}/image:
 *   get:
 *     description: Returns the image to display for a recipe
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *          description: Success
 *       404:
 *          description: Image not found
 *     tags:
 *          - Recipes
 */
router.get('/recipe/:id/image', async (req, res) => {
  const recipe = await Recipe.findOne({
    _id: req.params.id,
  });

  if (!recipe) {
    res.status(404).send();
  } else {
    res.set('Content-Type', 'image/png');

    if (recipe.image) {
      res.send(recipe.image);
    } else {
      res.sendFile(path.join(__dirname, '../assets/default.png'));
    }
  }
});

/**
* @swagger
*
* /recipe/public/{id}/subscribe:
*   post:
*     description: Subscribes the authenticated user to the specified recipe
*     produces:
*       - application/json
*     responses:
*       200:
*          description: Success
*       404:
*          description: Recipe not found
*     tags:
*          - Recipes
*/
router.post('/recipe/public/:id/subscribe', authCheck, async (req, res) => {
  // Get the user who sent the request
  const user = await User.findOne({
    firebaseUUID: req.user.sub,
  });

  // Find the specific recipe
  const recipe = await Recipe.findOne({
    _id: req.params.id,
    isPublic: true,
  });

  if (recipe) {
    recipe.subscribers.push(user._id);
    recipe.save();
    res.status(200).send();
  } else {
    res.status(404).send(); // No recipe found
  }
});

/**
* @swagger
*
* /recipe/public/{id}/unsubscribe:
*   post:
*     description: Unsubscribes the authenticated user to the specified recipe
*     produces:
*       - application/json
*     responses:
*       200:
*          description: Success
*       404:
*          description: Recipe not found
*     tags:
*          - Recipes
*/
router.post('/recipe/public/:id/unsubscribe', authCheck, async (req, res) => {
  // Get the user who sent the request
  const user = await User.findOne({
    firebaseUUID: req.user.sub,
  });

  // Find the specific recipe
  const recipe = await Recipe.findOne({
    _id: req.params.id,
    isPublic: true,
  });

  if (recipe) {
    recipe.subscribers.splice(recipe.subscribers.indexOf(user._id.toString()), 1);
    recipe.save();
    res.status(200).send();
  } else {
    res.status(404).send(); // No recipe found
  }
});

/**
* @swagger
*
* /subscriptions:
*   post:
*     description: Returns all recipes the authenticated user is subscribed to
*     produces:
*       - application/json
*     responses:
*       200:
*          description: Success
*       400:
*          description: An error occured
*       404:
*          description: Recipe not found
*     tags:
*          - Recipes
*/
router.get('/subscriptions', authCheck, async (req, res) => {
  // Get the user who sent the request
  const user = await User.findOne({
    firebaseUUID: req.user.sub,
  });

  if (user) {
    await user.populate('savedRecipes', '_id name prepTime servings createdAt updatedAt isPublic authorName ingredients method').execPopulate();
    await user.savedRecipes.forEach((v, i) => v.populate('user').execPopulate());
    res.status(200).json(user.savedRecipes);
  } else {
    res.status(404).send();
  }
});
module.exports = router;
