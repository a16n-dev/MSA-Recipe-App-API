// Imports
const express = require('express');

// const swaggerUi = require('swagger-ui-express');
// const swaggerDocument = require('./swagger/swagger.json');
const userRoute = require('./routes/user');
const recipeRoute = require('./routes/recipe');
require('./util/mongoose');

// Load routers

// const taskRouter = require('./routers/task');

const app = express();

// Parse incoming JSON
app.use(express.json());

// Swagger endpoint
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routers
app.use(userRoute);
app.use(recipeRoute);

module.exports = app;
