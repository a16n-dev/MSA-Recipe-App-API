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
  notes: [
    'this is a note!',
  ],
  image: 'this is an image',
  isPublic: true,
  authorName: userOne.name,
  // eslint-disable-next-line no-underscore-dangle
  user: userOne._id,
};

const recipeTwoId = new mongoose.Types.ObjectId();
const recipeTwo = {
  _id: recipeTwoId,
  name: 'private recipe for user 1',
  ingredients: ['test ingredient'],
  method: ['test method step'],
  prepTime: '10 mins',
  servings: 1,
  isPublic: false,
  authorName: userOne.name,
  // eslint-disable-next-line no-underscore-dangle
  user: userOne._id,
};

const recipeThreeId = new mongoose.Types.ObjectId();
const recipeThree = {
  _id: recipeThreeId,
  name: 'public recipe for user 2',
  ingredients: ['test ingredient'],
  method: ['test method step'],
  prepTime: '10 mins',
  servings: 1,
  isPublic: true,
  subscribers: [userTwoId],
  authorName: userTwo.name,
  // eslint-disable-next-line no-underscore-dangle
  user: userTwo._id,
};

const recipeFourId = new mongoose.Types.ObjectId();
const recipeFour = {
  _id: recipeFourId,
  name: 'private recipe for user 2',
  ingredients: ['test ingredient'],
  method: ['test method step'],
  prepTime: '10 mins',
  servings: 1,
  isPublic: false,
  authorName: userTwo.name,
  // eslint-disable-next-line no-underscore-dangle
  user: userTwo._id,
};

const recipeFiveId = new mongoose.Types.ObjectId();
const recipeFive = {
  _id: recipeFiveId,
  name: 'private recipe for user 2',
  ingredients: ['test ingredient'],
  method: ['test method step'],
  prepTime: '10 mins',
  servings: 1,
  isPublic: false,
  authorName: userTwo.name,
  // eslint-disable-next-line no-underscore-dangle
  user: userTwo._id,
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
  await new Recipe(recipeTwo).save();
  await new Recipe(recipeThree).save();
  await new Recipe(recipeFour).save();
};

module.exports = {
  userOneId,
  userTwoId,
  userThreeId,
  userOne,
  userTwo,
  recipeOneId,
  recipeOne,
  recipeTwoId,
  recipeTwo,
  recipeThreeId,
  recipeThree,
  recipeFiveId,
  setupDatabase,
};
