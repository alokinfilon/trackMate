const swaggerJSDoc = require('swagger-jsdoc');
const dotenv = require('dotenv')
const path = require('path');
require('dotenv').config();
const PORT = process.env.PORT || 3000
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TrackMate API',
      version: '1.0.0',
      description: 'TrackMate backend API — auth, locations, trips, and gallery',
    },
    components: {
      securitySchemes: {
        basicAuth: {
          type: "http",
          scheme: "basic",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        }
      },
    },
    security: [
      {
        basicAuth: [],
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: 'https://trackmate-x7ue.onrender.com',
        description: 'Production Server (Render)',
      },
      
      {
        url: `http://localhost:${PORT}`,
        description: 'LocalHost Server',
      },
    ],
  },
  apis: [
    path.resolve(__dirname, '../docs/auth.swagger.js'),
    path.resolve(__dirname, '../docs/location.swagger.js'),
    path.resolve(__dirname, '../docs/gallery.swagger.js'),
  ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec;
