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

// import { Router } from 'express';
// import { startChatSession, sendMessage, getMessages, endChatSession, getChatSessionInfo, renameChatSession ,deleteMessage, deleteChatSession } from '../controllers/messageController.js';
// import multer from 'multer';

// const router = Router();
// // const upload = multer({ dest: 'uploads/' }); // Configure multer for file uploads

// router.post('/session', authenticateToken, startChatSession);
// router.post('/send-message/:sessionId', authenticateToken, sendMessage);
// router.get('/get-message/:sessionId', authenticateToken, getMessages);
// router.get('/chat-session-info/:sessionId', authenticateToken, getChatSessionInfo);
// router.put('/:sessionId/end', authenticateToken, endChatSession);
// // router.get('/get-sessions', authenticateToken, getChatSessions);
// router.delete('/:sessionId/:messageId', authenticateToken, deleteMessage);
// router.delete('/delete-session/:sessionId', authenticateToken, deleteChatSession);
// router.patch('/rename-session/:sessionId', authenticateToken, renameChatSession);

// export default router;


import { Router } from 'express';
import { startChatSession, sendMessage, getMessages, endChatSession, getChatSessionInfo, renameChatSession, deleteMessage, deleteChatSession } from '../controllers/messageController.js';
import multer from 'multer';

const router = Router();
// const upload = multer({ dest: 'uploads/' }); // Configure multer for file uploads

/**
 * @swagger
 * /messages/session:
 *   post:
 *     summary: Start a new chat session
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: New Chat
 *                 description: Title of the chat session (max 100 characters)
 *     responses:
 *       201:
 *         description: Chat session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                     title:
 *                       type: string
 *       400:
 *         description: Invalid title
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/session', authenticateToken, startChatSession);

/**
 * @swagger
 * /messages/send-message/{sessionId}:
 *   post:
 *     summary: Send a message and get AI response
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - messageReturn  
 *             properties:
 *               content:
 *                 type: string
 *                 example: Hello, how can you help me?
 *                 description: Message content
 *               messageReturn:
 *                 type: boolean
 *                 example: false
 *                 description: Message content
 *               fileName:
 *                 type: string
 *                 example: file name
 *                 description: file name
 *               type:
 *                 type: string
 *                 enum: [TEXT, IMAGE, FILE]
 *                 default: TEXT
 *                 description: Type of message
 *               metadata:
 *                 type: object
 *                 example: {}
 *                 description: Additional metadata for the message
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userMessage:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         content:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     botMessage:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         content:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Invalid input or missing content
 *       404:
 *         description: Chat session not found
 *       429:
 *         description: Rate limit exceeded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/send-message/:sessionId', authenticateToken, sendMessage);

/**
 * @swagger
 * /messages/get-message/{sessionId}:
 *   get:
 *     summary: Retrieve all messages in a session
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat session
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages per page (max 100)
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       content:
 *                         type: string
 *                       isFromBot:
 *                         type: boolean
 *                       type:
 *                         type: string
 *                       fileName:
 *                         type: string
 *                       metadata:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid pagination parameters
 *       404:
 *         description: Chat session not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/get-message/:sessionId', authenticateToken, getMessages);

/**
 * @swagger
 * /messages/chat-session-info/{sessionId}:
 *   get:
 *     summary: Retrieve information about a chat session
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat session
 *     responses:
 *       200:
 *         description: Chat session info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     endedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       404:
 *         description: Chat session not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/chat-session-info/:sessionId', authenticateToken, getChatSessionInfo);

/**
 * @swagger
 * /messages/{sessionId}/end:
 *   put:
 *     summary: End a chat session
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat session
 *     responses:
 *       200:
 *         description: Chat session ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         endedAt:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Chat session not found or already ended
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/:sessionId/end', authenticateToken, endChatSession);

/**
 * @swagger
 * /messages/{sessionId}/{messageId}:
 *   delete:
 *     summary: Delete a specific message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat session
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the message
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: null
 *       404:
 *         description: Chat session or message not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:sessionId/:messageId', authenticateToken, deleteMessage);

/**
 * @swagger
 * /messages/delete-session/{sessionId}:
 *   delete:
 *     summary: Delete a chat session and its messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat session
 *     responses:
 *       200:
 *         description: Chat session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: null
 *       404:
 *         description: Chat session not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/delete-session/:sessionId', authenticateToken, deleteChatSession);

/**
 * @swagger
 * /messages/rename-session/{sessionId}:
 *   patch:
 *     summary: Rename a chat session
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Chat Title
 *                 description: New title for the chat session (max 100 characters)
 *     responses:
 *       200:
 *         description: Chat session renamed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                     title:
 *                       type: string
 *       400:
 *         description: Invalid title
 *       404:
 *         description: Chat session not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch('/rename-session/:sessionId', authenticateToken, renameChatSession);

export default router;