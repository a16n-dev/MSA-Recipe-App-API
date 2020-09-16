const mongoose = require('mongoose');
const User = require('../../src/models/user');
const Recipe = require('../../src/models/recipe');

// Create test users

// Test data
const userOneId = new mongoose.Types.ObjectId();
const userOne = {
  _id: userOneId,
  name: 'User 1',
  email: 'user_1@test.com',
  firebaseUUID: 'fb_id_user_1',
  image: 'this is an image!',
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
  _id: userTwoId,
  name: 'user 2',
  email: 'user_2@test.com',
  firebaseUUID: 'fb_id_user_2',
};

const userThreeId = new mongoose.Types.ObjectId();

// Create mock recipes
const recipeOneId = new mongoose.Types.ObjectId();
const recipeOne = {
  _id: recipeOneId,
  name: 'public recipe for user 1',
  ingredients: ['test ingredient'],
  method: ['test method step'],
  prepTime: '10 mins',
  servings: 1,
  isPublic: true,
  authorName: userOne.name,
  // eslint-disable-next-line no-underscore-dangle
  user: userOne._id,
};

// Setup database
const setupDatabase = async () => {
  // Delete all users
  await User.deleteMany();
  await Recipe.deleteMany();

  // Add in test users
  await new User(userOne).save();
  await new User(userTwo).save();

  await new Recipe(recipeOne).save();
};

module.exports = {
  userOneId,
  userTwoId,
  userThreeId,
  userOne,
  userTwo,
  userTwoId,
  setupDatabase,
};
