const request = require('supertest');
const Sinon = require('sinon');
const fs = require('fs');
const User = require('../src/models/user');
const { setupDatabase, userOneId, userThreeId } = require('./fixtures/db');

const { authCheck, authObserve } = require('../src/middleware/auth');

jest.mock('../src/middleware/auth');

const app = require('../src/app');
const { fbUser1, fbUser2, fbUser3 } = require('./fixtures/firebase');
const { Mongoose } = require('mongoose');

// Code to run before each test
beforeEach(setupDatabase);

test('Test create user in database', async () => {
  const response = await request(app).post('/user').set('authToken', 'fb_token_3').send()
    .expect(201);

  // Assert that the database was changed
  const user = await User.findById(response.body._id);
  expect(user).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    name: fbUser3.name,
    email: fbUser3.email,
  });
});

test('Test create user that already exists in database', async () => {
  const response = await request(app).post('/user').set('authToken', 'fb_token_1').send()
    .expect(200);

  // Assert that the database was changed
  const user = await User.findById(response.body._id);
  expect(user).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    name: fbUser1.name,
    email: fbUser1.email,
  });
});

test('Test retrieve data for authenticated user', async () => {
  const response = await request(app).get('/user').set('authToken', 'fb_token_1').send()
    .expect(200);

  // Assert that the correct user was returned
  const user = await User.findById(response.body._id);
  expect(response.body).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    name: fbUser1.name,
    email: fbUser1.email,
  });
});

test('Test retrieve data for authenticated user that doesnt exist in database', async () => {
  const response = await request(app).get('/user').set('authToken', 'randomToken').send()
    .expect(404);
});

test('Test retrieve public data for user with specified id', async () => {
  const response = await request(app).get(`/user/${userOneId}`).set('authToken', 'fb_token_1').send()
    .expect(200);

  // Assert that a user was returned
  expect(response.body.user).not.toBeNull();
  expect(response.body.recipes).not.toBeNull();

  // Assertions about the response
  expect(response.body.user).toMatchObject({
    name: fbUser1.name,
    email: fbUser1.email,
  });
});

test('Test retrieve public data for user with specified id that doesnt exist', async () => {
  const response = await request(app).get('/user/123').send()
    .expect(404);
});

test('Test update username', async () => {
  const newName = 'new name!';

  const response = await request(app).patch('/user').set('authToken', 'fb_token_1').send({
    name: newName,
  })
    .expect(200);

  // Assert that the correct user was returned and the database was successfully updated
  const user = await User.findById(response.body._id);
  expect(response.body).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    name: newName,
  });
});

test('Test invalid updates to user', async () => {
  const response = await request(app).patch('/user').set('authToken', 'fb_token_1').send({
    email: 'bad@mail.com',
  })
    .expect(400);
});

test('Test update user who doesnt exist', async () => {
  const newName = 'new name!';

  const response = await request(app).patch('/user').set('authToken', 'fb_token_3').send({
    name: newName,
  })
    .expect(404);
});

test('Test delete user', async () => {
  const response = await request(app).delete('/user').set('authToken', 'fb_token_1').send()
    .expect(200);
});

test('Test delete user that doesnt exist', async () => {
  const response = await request(app).delete('/user').set('authToken', 'fb_token_3').send()
    .expect(404);
});

test('Test get image for user', async () => {
  const response = await request(app).get(`/user/${userOneId}/image`).send()
    .expect(200);
});

test('Test set image for user', async () => {
  const response = await request(app).post('/user/image').set('authToken', 'fb_token_1').set('Content-Type', 'multipart/form-data')
    .attach('image', './tests/fixtures/pic.png')
    .expect(201);
});

test('Test set image for user with incorrect file type', async () => {
  const response = await request(app).post('/user/image').set('authToken', 'fb_token_1').set('Content-Type', 'multipart/form-data')
    .attach('image', './tests/fixtures/testFile.txt')
    .expect(400);
});

test('Test get image for user that doesnt exist', async () => {
  const response = await request(app).get(`/user/${userThreeId}/image`).send()
    .expect(404);
});

test('Test delete image for user', async () => {
  const response = await request(app).delete('/user/image').set('authToken', 'fb_token_1').send()
    .expect(200);
});
