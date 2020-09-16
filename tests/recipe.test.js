const request = require('supertest');
const Sinon = require('sinon');
const fs = require('fs');
const { send } = require('process');
const { Mongoose } = require('mongoose');
const User = require('../src/models/user');
const {
  setupDatabase, recipeOne, recipeOneId, userOne, userOneId, recipeTwoId, recipeFiveId, recipeThreeId, userTwoId, recipeThree,
} = require('./fixtures/db');

const { authCheck, authObserve } = require('../src/middleware/auth');

jest.mock('../src/middleware/auth');

const app = require('../src/app');
const { } = require('./fixtures/firebase');
const Recipe = require('../src/models/recipe');

// Code to run before each test
beforeEach(setupDatabase);

afterAll(async () => {
  await User.deleteMany();
  await Recipe.deleteMany();
});

test('Test create recipe for user', async () => {
  const data = {
    name: 'test recipe for user 1',
    ingredients: ['test ingredient'],
    method: ['test method step'],
    prepTime: '30 mins',
    servings: 4,
    isPublic: true,
  };
  const response = await request(app).post('/recipe').set('authToken', 'fb_token_1')
    .send(data)
    .expect(201);

  // Assert that the recipe was created in the database
  const recipe = await Recipe.findById(response.body.id);
  expect(recipe).not.toBeNull();

  // assert that things were set correctly
  expect(recipe).toMatchObject({
    authorName: userOne.name,
  });
});

test('Test get all recipes for authenticated user', async () => {
  const response = await request(app).get('/recipe').set('authToken', 'fb_token_1')
    .expect(200);

  expect(response.body).toHaveLength(2);
});

test('Test get all recipes for user that doesnt exist', async () => {
  const response = await request(app).get('/recipe').set('authToken', 'fb_token_3')
    .expect(404);
});

test('Test get recipe by id when user is owner', async () => {
  const response = await request(app).get(`/recipe/${recipeOneId}`).set('authToken', 'fb_token_1')
    .expect(200);

  expect(response.body).toStrictEqual(expect.objectContaining(
    {
      _id: recipeOneId.toString(),
      user: userOneId.toString(),
    },
  ));
});

test('Test get recipe by id when user is not owner', async () => {
  const response = await request(app).get(`/recipe/${recipeOneId}`).set('authToken', 'fb_token_2')
    .expect(401);

  expect(response.text).toBe('Unauthorized');
});

test('Test get recipe by id that doesnt exist', async () => {
  const response = await request(app).get(`/recipe/${recipeFiveId}`).set('authToken', 'fb_token_1')
    .expect(404);
});

test('Test get public recipe by id, and that no private data is returned', async () => {
  const response = await request(app).get(`/recipe/public/${recipeOneId}`)
    .expect(200);

  expect(response.body).not.toBe(expect.objectContaining({
    notes: recipeOne.notes,
    subscribed: false,
  }));
});

test('Test get public recipe by id, where the recipe isnt public', async () => {
  const response = await request(app).get(`/recipe/public/${recipeTwoId}`)
    .expect(404);

  expect(response.body).toStrictEqual({});
});

test('Test get public recipe by id should contain subscribed key if user is authenticated', async () => {
  const response = await request(app).get(`/recipe/public/${recipeOneId}`).set('authToken', 'fb_token_2')
    .expect(200);

  expect(response.body).toStrictEqual(expect.objectContaining({
    subscribed: false,
  }));
});

test('Test get public recipe by id should contain subscribed equal to true', async () => {
  const response = await request(app).get(`/recipe/public/${recipeThreeId}`).set('authToken', 'fb_token_2')
    .expect(200);

  expect(response.body).toStrictEqual(expect.objectContaining({
    subscribed: true,
  }));
});

test('Test get public recipe by id, where the recipe isnt public', async () => {
  const response = await request(app).get(`/recipe/public/${recipeTwoId}`)
    .expect(404);

  expect(response.body).toStrictEqual({});
});

test('Test delete recipe by id', async () => {
  const response = await request(app).delete(`/recipe/${recipeOneId}`).set('authToken', 'fb_token_1')
    .expect(200);

  const recipe = await Recipe.findOne({ _id: recipeOneId });
  expect(recipe).toBe(null);
});

test('Test delete recipe by id when doesnt exist', async () => {
  const response = await request(app).delete(`/recipe/${recipeFiveId}`).set('authToken', 'fb_token_1')
    .expect(404);
});

test('Test delete recipe by id when user is not owner', async () => {
  const response = await request(app).delete(`/recipe/${recipeOneId}`).set('authToken', 'fb_token_2')
    .expect(401);

  // Ensure recipe wasnt deleted
  const recipe = await Recipe.findOne({ _id: recipeOneId });
  expect(recipe).not.toBe(null);
});

test('Test update recipe by id with valid updates', async () => {
  const updates = {
    isPublic: true,
    name: 'new name',
    prepTime: '30 mins',
  };

  const response = await request(app).patch(`/recipe/${recipeOneId}`).set('authToken', 'fb_token_1')
    .send(updates)
    .expect(200);

  // Ensure updates were applied
  const recipe = await Recipe.findOne({ _id: recipeOneId });
  expect(recipe).toStrictEqual(expect.objectContaining(updates));
});

test('Test update recipe by id with invalid updates', async () => {
  const updates = {
    authorName: 'new author name',
  };

  const response = await request(app).patch(`/recipe/${recipeOneId}`).set('authToken', 'fb_token_1')
    .send(updates)
    .expect(400);

  // Ensure updates were applied
  const recipe = await Recipe.findOne({ _id: recipeOneId });
  expect(recipe).not.toStrictEqual(expect.objectContaining(updates));
});

test('Test update recipe by id when user is not owner', async () => {
  const updates = {
    isPublic: true,
    name: 'new name',
    prepTime: '30 mins',
  };

  const response = await request(app).patch(`/recipe/${recipeOneId}`).set('authToken', 'fb_token_2')
    .send(updates)
    .expect(401);
});

test('Test update recipe by id when recipe doesnt exist', async () => {
  const updates = {
    isPublic: true,
    name: 'new name',
    prepTime: '30 mins',
  };

  const response = await request(app).patch(`/recipe/${recipeFiveId}`).set('authToken', 'fb_token_2')
    .send(updates)
    .expect(404);
});

test('Test upload image for recipe', async () => {
  const response = await request(app).post(`/recipe/${recipeOneId}/image`)
    .set('authToken', 'fb_token_1')
    .attach('image', './tests/fixtures/pic.png')
    .expect(201);

  // Assert that the image was saved
  const recipe = await Recipe.findOne({ _id: recipeOneId });
  expect(recipe.image).not.toBeNull();
});

test('Test upload image for recipe with wrong file type', async () => {
  const response = await request(app).post(`/recipe/${recipeTwoId}/image`)
    .set('authToken', 'fb_token_1')
    .attach('image', './tests/fixtures/testFile.txt')
    .expect(400);

  // Assert that the image was not saved
  const recipe = await Recipe.findOne({ _id: recipeTwoId });
  expect(recipe.image).toBeUndefined();
});

test('Test upload image for recipe when not authorised', async () => {
  const response = await request(app).post(`/recipe/${recipeTwoId}/image`)
    .set('authToken', 'fb_token_2')
    .attach('image', './tests/fixtures/pic.png')
    .expect(401);

  // Assert that the image was not saved
  const recipe = await Recipe.findOne({ _id: recipeTwoId });
  expect(recipe.image).toBeUndefined();
});

test('Test get image for recipe', async () => {
  const response = await request(app).get(`/recipe/${recipeOneId}/image`)
    .expect(200);

  // Assert that response is an image
  expect(response.header['content-type']).toBe('image/png');
});

test('Test get image for recipe that doesnt have set image', async () => {
  const response = await request(app).get(`/recipe/${recipeTwoId}/image`)
    .expect(200);

  // Assert that response is an image
  expect(response.header['content-type']).toBe('image/png');
});

test('Test get image for recipe that doesnt exist', async () => {
  const response = await request(app).get(`/recipe/${recipeFiveId}/image`)
    .expect(404);
});

test('Test subscribe to recipe', async () => {
  const response = await request(app)
    .post(`/recipe/public/${recipeOneId}/subscribe`)
    .set('authToken', 'fb_token_1')
    .expect(200);

  // Assert recipe now has user id in subscriptions
  const recipe = await Recipe.findOne({ _id: recipeOneId });
  expect(recipe.subscribers).toStrictEqual(expect.arrayContaining([userOneId]));
});

test('Test subscribe to recipe that doesnt exist', async () => {
  const response = await request(app)
    .post(`/recipe/public/${recipeFiveId}/subscribe`)
    .set('authToken', 'fb_token_1')
    .expect(404);
});

test('Test unsubscribe to recipe', async () => {
  const response = await request(app)
    .post(`/recipe/public/${recipeThreeId}/unsubscribe`)
    .set('authToken', 'fb_token_2')
    .expect(200);

  // Assert recipe no longer has user id in subscriptions
  const recipe = await Recipe.findOne({ _id: recipeThreeId });
  expect(recipe.subscribers).not.toStrictEqual(expect.arrayContaining([userOneId]));
});

test('Test unsubscribe to recipe that doesnt exist', async () => {
  const response = await request(app)
    .post(`/recipe/public/${recipeFiveId}/unsubscribe`)
    .set('authToken', 'fb_token_2')
    .expect(404);

  // Assert recipe still has user id in subscriptions
  const recipe = await Recipe.findOne({ _id: recipeThreeId });
  expect(recipe.subscribers).toStrictEqual(expect.arrayContaining([userTwoId]));
});

test('Test get subscribed recipes', async () => {
  const response = await request(app)
    .get('/subscriptions')
    .set('authToken', 'fb_token_2')
    .expect(200);

  // Assert recipe still has user id in subscriptions
  expect(response.body)
    .toStrictEqual(expect
      .arrayContaining([expect
        .objectContaining({
        // eslint-disable-next-line no-underscore-dangle
          _id: recipeThree._id.toString(),
          name: recipeThree.name,
        })]));
});

test('Test get no subscribed recipes', async () => {
  const response = await request(app)
    .get('/subscriptions')
    .set('authToken', 'fb_token_1')
    .expect(200);
});

test('Test get subscribed recipes for user that doesnt exist', async () => {
  const response = await request(app)
    .get('/subscriptions')
    .set('authToken', 'fb_token_3')
    .expect(404);
});
