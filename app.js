// import express from 'express';
// import cookieParser from 'cookie-parser';
// import cors from 'cors';

// import authRoutes from './routes/authRoutes.js';
// import userRoutes from './routes/userRoutes.js';
// import messageRoutes from './routes/messageRoutes.js'; // Add this

// import { errorHandler } from './middleware/errorMiddleware.js';


// import Redis from 'redis';

// const app = express();

// const redisClient = Redis.createClient();
// // redisClient.on('error', (err) => console.log('Redis Client Error', err));
// // await redisClient.connect();

// // Catch JSON parsing errors
// app.use((err, req, res, next) => {
//   if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
//     return res.status(400).json({ message: 'Invalid JSON in request body' });
//   }
//   next();
// });



// app.use(cookieParser());
// app.use(express.json());

// // Routes
// app.use('/auth', authRoutes);
// app.use('/user', userRoutes);
// app.use('/messages', messageRoutes); 

// // Error handling
// app.use(errorHandler);

// export { app, redisClient };



import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Catch JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  next();
});

// Middleware
app.use(cookieParser());
app.use(express.json());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  '*', // Be cautious with '*' in production
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cache-Control',
      'Expires',
      'Pragma',
    ],
    credentials: false,
  })
);

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/messages', messageRoutes);

// Error handling
app.use(errorHandler);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Hello from Express on Vercel!');
});

// Export app
export { app };