import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import listRoutes from './routes/listRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import session from 'express-session';
import passport from './config/passport.js';

const app = express();

// Catch JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  next();
});


const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rashed API',
      version: '1.0.0',
      description: 'API documentation for your Express application',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Local server' },
      { url: 'https://rashed-server.vercel.app', description: 'Production server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'Bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI static files explicitly
// app.use('/swagger-ui-dist', express.static(path.join(__dirname, 'node_modules', 'swagger-ui-dist')));

// Serve Swagger UI with custom static file paths
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs, {
    customCssUrl: 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css',
    customJs: [
      'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js',
      'https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
    ],
  })
);

// Expose Swagger JSON for debugging
app.get('/swagger.json', (req, res) => {
  res.json(swaggerDocs);
});

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());


// CORS configuration
const allowedOrigins = [
  'https://rashed-five.vercel.app', // Replace with your actual frontend domain
  'https://rashed-five.vercel.app/', // Replace with your actual frontend domain
  'https://rashed-server.vercel.app/',
  'http://localhost:3000', // Local development (Next.js default port)
  'http://localhost:5173', // Another local development port (e.g., Vite)
  'http://localhost:5000', // Another local development port (e.g., Vite)

  // Add other allowed origins as needed
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., non-browser clients like Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, origin); // Return the specific origin, not true
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Expires', 'Pragma'],
    credentials: true, // Enable credentials for cookies or Authorization headers
    optionsSuccessStatus: 204, // Ensure preflight requests return 204
  })
);

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/messages', messageRoutes);
app.use('/list', listRoutes);

// Error handling
app.use(errorHandler);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Hello from Express on Vercel!');
});

// Export app
export { app };