// Imports
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');
const userRoute = require('./routes/user');
const recipeRoute = require('./routes/recipe');
require('./util/mongoose');

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Braize API Docs',
      description: 'Documentation for Braize. Go to http://braize.azurewebsites.net/ to see it in action',
    },
  },
  apis: [path.join(__dirname, '/routes/*.js')],
};

const app = express();

console.log(path.join(__dirname, '/routes/*.js'));

// Parse incoming JSON
app.use(express.json());
app.use(cors());

// Swagger endpoint

// Routers
app.use(userRoute);
app.use(recipeRoute);

const swaggerDoc = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

module.exports = app;
