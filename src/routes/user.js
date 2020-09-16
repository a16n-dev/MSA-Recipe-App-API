const express = require('express');

const router = new express.Router();
const path = require('path');
const sharp = require('sharp');
const User = require('../models/user');
const { authCheck } = require('../middleware/auth');
const upload = require('../util/multer');

/**
 * @swagger
 *
 * /user:
 *   post:
 *     description: Creates the user in the database if they dont already exist
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *          description: Success, user already exists
 *       201:
 *         description: Success, user created
 *       500:
 *          description: Internal server error
 *     tags:
 *          - Users
 */
router.post('/user', authCheck, async (req, res) => {
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

    await user.save();
    res.status(201).json(user);
  }
});

/**
 * @swagger
 *
 * /user:
 *   get:
 *     description: Get the currently authenticated user
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *          description: Success
 *       404:
 *          description: User not found
 *     tags:
 *          - Users
 */
router.get('/user', authCheck, async (req, res) => {
  try {
    const { email } = req.user;
    const foundUser = await User.findOne({ email });
    res.status(200).json(foundUser);
  } catch (err) {
    res.status(404).send(err);
  }
});

/**
 * @swagger
 *
 * /user/{id}:
 *   get:
 *     description: Get a user by their id
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *          description: Success
 *       404:
 *          description: User not found
 *     tags:
 *          - Users
 */
router.get('/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const foundUser = await User.findOne({ _id: id });

    // Populate the users public recipes
    await foundUser.populate({ path: 'recipes', select: '_id name prepTime servings', match: { isPublic: true } }).execPopulate();
    res.status(200).json({ user: foundUser, recipes: foundUser.recipes });
  } catch (err) {
    res.status(404).send(err);
  }
});

/**
 * @swagger
 *
 * /user:
 *   patch:
 *     description: Update the currently authenticated user
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *          description: Success
 *       400:
 *          description: Invalid updates
 *       404:
 *          description: User not found
 *       500:
 *          description: Internal server error
 *     tags:
 *          - Users
 */
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

    // eslint-disable-next-line no-return-assign
    updates.forEach((update) => user[update] = req.body[update]);
    await user.save();

    res.status(200).send(user);
  } else {
    res.status(404).send();
  }
});

/**
 * @swagger
 *
 * /user:
 *   delete:
 *     description: Deletes the currently authenticated user
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *          description: Success
 *       500:
 *          description: Internal server error
 *     tags:
 *          - Users
 */
router.delete('/user', authCheck, async (req, res) => {
  const user = await User.findOne({ firebaseUUID: req.user.sub });
  if (user) {
    user.remove();
    res.status(200).send(user);
  } else {
    res.status(404).send();
  }
});

/**
 * @swagger
 *
 * /user/image:
 *   post:
 *     description: Sets the profile image for the authenticated user
 *     produces:
 *       - application/json
 *     responses:
 *       201:
 *          description: Success
 *       400:
 *          description: An error occured
 *     tags:
 *          - Users
 */
router.post('/user/image', authCheck, upload.single('image'), async (req, res) => {
  // Get relevant db entries

  const user = await User.findOne({
    firebaseUUID: req.user.sub,
  });

  // Process image
  const buffer = await sharp(req.file.buffer).resize({
    width: 250,
    height: 250,
  }).png().toBuffer();
  user.image = buffer;
  // eslint-disable-next-line no-underscore-dangle
  user.profileUrl = `https://recipe-app-api.azurewebsites.net/user/${user._id}/image`;
  await user.save();
  res.status(201).json({ url: user.profileUrl });
}, (error, req, res, next) => {
  res.status(400).send({
    error: error.message,
  });
});

/**
 * @swagger
 *
 * /user/{id}/image:
 *   get:
 *     description: Get the profile image for the user with the specified id
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *          description: Success
 *       404:
 *          description: Image not found
 *     tags:
 *          - Users
 */
router.get('/user/:id/image', async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
  });

  if (!user) {
    res.status(404).send();
  } else {
    res.set('Content-Type', 'image/png');

    if (user.image) {
      res.send(user.image);
    } else {
      res.status(404).send();
    }
  }
});

/**
 * @swagger
 *
 * /user/image:
 *   delete:
 *     description: Delete the profile picture for the currently authenticated user.
 *                  This will reset the picture to their social photo
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *          description: Success
 *       404:
 *          description: User not found
 *     tags:
 *          - Users
 */
router.delete('/user/image', authCheck, async (req, res) => {
  // Get relevant db entries

  const user = await User.findOne({
    firebaseUUID: req.user.sub,
  });

  if (user) {
    user.image = null;
    user.profileUrl = req.user.picture;
    await user.save();
    res.status(200).json({ url: user.profileUrl });
  } else {
    res.status(404).send();
  }
});

module.exports = router;
