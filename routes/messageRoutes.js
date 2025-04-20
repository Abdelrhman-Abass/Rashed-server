import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  startChatSession,
  sendMessage,
  getMessages,
  endChatSession,
} from '../controllers/messageController.js';

const router = express.Router();

// Start a new chat session
router.post('/session', authenticateToken, startChatSession);

// Send a message in a chat session (user message + bot response)
router.post('/:sessionId', authenticateToken, sendMessage);

// Get all messages in a chat session
router.get('/:sessionId', authenticateToken, getMessages);

// End a chat session
router.patch('/session/:sessionId/end', authenticateToken, endChatSession);

export default router;