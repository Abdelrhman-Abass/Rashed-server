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
  'http://localhost:3000', // Local development (Next.js default port)
  'http://localhost:5173', // Another local development port (e.g., Vite)
  'https://your-frontend.vercel.app', // Replace with your actual frontend domain
  // Add other allowed origins as needed
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