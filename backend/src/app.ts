import express, {Application, Request, Response} from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import corsOptions from './config/cors.js';
import { authLimiter } from './config/rateLimit.js';
import { securityMiddleware } from './config/security.js';
import { httpLogger } from './config/logger.js';
import Health from './models/Health.js';
import userRouter from './routes/userRouter.js';
import authRouter from './routes/authRouter.js';
import setupSwagger from './config/swagger.js'; // Import the Swagger setup function
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file
// Update the path if the file is named differently or located elsewhere
import { authenticate, optionalAuth } from './middleware/authMiddleware.js';
const app:Application = express();

app.use(express.json());
app.use(cors(corsOptions));
app.use('/api/auth', authLimiter);
app.use(securityMiddleware);
app.use(httpLogger);
setupSwagger(app); // Assuming you have a function to set up Swagger documentation
app.use(userRouter);
app.use(authRouter);
app.use('/api-docs', express.static('public/swagger')); // Serve Swagger UI from public folder

// Health check route
app.get('/health-server', (_req: Request, res: Response) => {
  // This route is used to check if the server is running
  // It can be used by load balancers or monitoring tools to verify the server's health
  // You can add more checks here if needed, like checking database connection, etc.  
  // For now, it just returns a simple message
  res.send('API is running 🚀');
});
app.get('/health/db', (_req: Request, res: Response) => {
  const readyState = mongoose.connection.readyState;
  /* 0 = disconnected 1 = connected 2 = connecting 3 = disconnecting*/
  if (readyState === 1) res.status(200).json({ status: 'UP', message: 'MongoDB connected' });
  else res.status(503).json({ status: 'DOWN', message: 'MongoDB not connected', state: readyState });
});
app.get('/health-db', async (_req: Request, res: Response) => {
  const health = await Health.findById('683fe54b3aeba7d5de0d8853');
  res.send(health?.health);
});
app.get("/", optionalAuth, (req:Request, res:Response) => { 
  if(req.user) res.redirect("/feed");
  res.send(`
    <form action="/api/auth/login" method="post">
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  `) 
});
app.get("/feed", authenticate, (req:Request, res:Response) => {
  res.send(`Welcome to the feed, ${req.user}!`);
});

export default app;