// import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
// import {
//   startChatSession,
//   sendMessage,
//   getMessages,
//   endChatSession,
//   getChatSessions,
// } from '../controllers/messageController.js';

// const router = express.Router();

// // Start a new chat session
// router.post('/session', authenticateToken, startChatSession);

// // Send a message in a chat session (user message + bot response)
// router.post('/:sessionId', authenticateToken, sendMessage);

// // Get all messages in a chat session
// router.get('/:sessionId', authenticateToken, getMessages);

// // End a chat session
// router.patch('/session/:sessionId/end', authenticateToken, endChatSession);
// router.get('/', authenticateToken, getChatSessions); // Add this

import { Router } from 'express';
import { startChatSession, sendMessage, getMessages, endChatSession, getChatSessions, deleteMessage } from '../controllers/messageController.js';
import multer from 'multer';

const router = Router();
// const upload = multer({ dest: 'uploads/' }); // Configure multer for file uploads

router.post('/session', authenticateToken, startChatSession);
router.post('/:sessionId', authenticateToken, sendMessage);
router.get('/:sessionId', authenticateToken, getMessages);
router.put('/:sessionId/end', authenticateToken, endChatSession);
router.get('/sessions', authenticateToken, getChatSessions);
router.delete('/:sessionId/:messageId', authenticateToken, deleteMessage);

export default router;
