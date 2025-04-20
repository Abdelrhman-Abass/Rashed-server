import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js'; // Add this

import { errorHandler } from './middleware/errorMiddleware.js';


import Redis from 'redis';

const app = express();

const redisClient = Redis.createClient();
// redisClient.on('error', (err) => console.log('Redis Client Error', err));
// await redisClient.connect();

// Catch JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  next();
});



app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/messages', messageRoutes); 

// Error handling
app.use(errorHandler);

export { app, redisClient };