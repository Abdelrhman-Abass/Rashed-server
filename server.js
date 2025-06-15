import express from 'express';
import cors from 'cors';
import {app} from './app.js';

const PORT = process.env.PORT || 5000;
// List of allowed origins
const allowedOrigins = [
  'https://rashed-five.vercel.app/', // Production
  'http://localhost:3000', // Local development
  'http://localhost:5173', // Another allowed domain
  "*"
];

app.use(
  cors({
    origin: '*', // Allow all origins for testing
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

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



// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import { app } from './app.js';
// // import  setupSocket  from './socket/index.js';
// // import { setupSocket } from './socket/index.js';

// const PORT = process.env.PORT || 5000;

// // const server = createServer(app);

// // const io = new Server(server, {
// //   cors: {
// //     origin: [
// //       'http://localhost:3000',
// //       'http://localhost:5173',
// //       '*',
// //     ],
// //     methods: ['GET', 'POST'],
// //     allowedHeaders: ['Content-Type', 'Authorization'],
// //     credentials: false,
// //   },
// // });

// // export { io };

// // // Set up Socket.IO handlers
// // setupSocket();

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });