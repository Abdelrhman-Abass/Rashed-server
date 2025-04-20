import express from 'express';
import cors from 'cors';
import {app} from './app.js';

const PORT = process.env.PORT || 5000;
// List of allowed origins
const allowedOrigins = [
  // 'http://localhost:3000', // Local development
  // // 'https://art-market-fbss.vercel.app', // Production
  // 'http://localhost:5173', // Another allowed domain
  "*"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // If the origin is in the list of allowed origins or no origin (like in Postman requests), allow it
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
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



app.get('/', (req, res) => {
  res.send('Hello from Express on Vercel!');
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});