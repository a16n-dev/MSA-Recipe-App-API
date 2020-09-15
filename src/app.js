// Imports
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
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
  apis: ['./src/routes/*.js'],
};

const app = express();

// Parse incoming JSON
app.use(express.json());
app.use(cors());

// Swagger endpoint
const swaggerDoc = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Routers
app.use(userRoute);
app.use(recipeRoute);

module.exports = app;
