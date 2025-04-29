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
import { startChatSession, sendMessage, getMessages, endChatSession, getChatSessions, deleteMessage } from '../controllers/messages.js';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // Configure multer for file uploads

router.post('/messages/session', authenticateToken, startChatSession);
router.post('/messages/:sessionId', authenticateToken, upload.single('file'), sendMessage);
router.get('/messages/:sessionId', authenticateToken, getMessages);
router.put('/messages/:sessionId/end', authenticateToken, endChatSession);
router.get('/messages/sessions', authenticateToken, getChatSessions);
router.delete('/messages/:sessionId/:messageId', authenticateToken, deleteMessage);

export default router;
