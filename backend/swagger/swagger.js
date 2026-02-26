const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SEMS - نظام إدارة الامتحانات المدرسية',
      version: '1.0.0',
      description: 'واجهة برمجة التطبيقات لنظام إدارة الامتحانات المدرسية',
    },
    servers: [{ url: 'http://localhost:5000', description: 'خادم التطوير' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);

const swaggerDocs = (app) => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      customCss: 'body { direction: ltr; }',
      customSiteTitle: 'SEMS API Docs',
    }),
  );
};

module.exports = { swaggerDocs };
