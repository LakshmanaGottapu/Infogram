// config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth API',
      version: '1.0.0',
      description: 'JWT Authentication API'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    servers: [
      {
        url: 'http://localhost:8080/api' // Adjust the URL as needed
      }
    ]
  },
  apis: ['./src/routes/*.ts'] // Scan for JSDoc comments
};
const specs = swaggerJsdoc(options);

export default function swaggerSetup(app: Application){
  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  // Serve Swagger JSON
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  // Serve Swagger UI static files    
  app.use('/public/swagger', swaggerUi.serve, swaggerUi.setup(specs));
  // Serve Swagger UI from public folder
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs));
};

