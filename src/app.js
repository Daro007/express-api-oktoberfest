const express = require("express");
const dispenserRoutes = require("./routes/dispenserRoutes");
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');


const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Oktoberfest API docs',
    version: '1.0.0',
  },
  host: "localhost:3000",
  basePath: "/",
  servers: [
    {
      url: 'http://localhost:3000/api/',
      description: 'Development server',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [path.join(__dirname, './routes/*.js')],
};

const swaggerSpec = swaggerJSDoc(options);

const app = express();

app.use("/api", dispenserRoutes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

if (process.env.NODE_ENV !== "test") {
  const port = 3000;
  app.listen(port, () => {
    console.log(`API is running on port ${port}`);
  });
}

module.exports = app