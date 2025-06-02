// import { Router } from 'express';
// import multer from 'multer';
// import { authenticateToken } from '../middleware/authMiddleware.js';
// import { getChatSessions, getChatSessionInfo } from '../controllers/messageController.js';

// const router = Router();



// // router.get('/chat-sessions', authenticateToken, getChatSessions);



// /**
//  * @swagger
//  * /messages/chat-sessions:
//  *   get:
//  *     summary: List all chat sessions for the authenticated user
//  *     tags: [Messages]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Chat sessions retrieved successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                 message:
//  *                   type: string
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     type: object
//  *                     properties:
//  *                       id:
//  *                         type: string
//  *                       title:
//  *                         type: string
//  *                       isActive:
//  *                         type: boolean
//  *                       createdAt:
//  *                         type: string
//  *                         format: date-time
//  *                       updatedAt:
//  *                         type: string
//  *                         format: date-time
//  *                       endedAt:
//  *                         type: string
//  *                         format: date-time
//  *                         nullable: true
//  *       401:
//  *         description: Unauthorized
//  *       500:
//  *         description: Internal server error
//  */
// router.get('/chat-sessions', authenticateToken, getChatSessions);

// /**
//  * @swagger
//  * /messages/chat-session-info/{sessionId}:
//  *   get:
//  *     summary: Retrieve information about a specific chat session
//  *     tags: [Messages]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: sessionId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: ID of the chat session
//  *     responses:
//  *       200:
//  *         description: Chat session info retrieved successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                 message:
//  *                   type: string
//  *                 data:
//  *                   type: object
//  *                   properties:
//  *                     id:
//  *                       type: string
//  *                     title:
//  *                       type: string
//  *                     createdAt:
//  *                       type: string
//  *                       format: date-time
//  *                     updatedAt:
//  *                       type: string
//  *                       format: date-time
//  *                     endedAt:
//  *                       type: string
//  *                       format: date-time
//  *                       nullable: true
//  *       404:
//  *         description: Chat session not found
//  *       401:
//  *         description: Unauthorized
//  *       500:
//  *         description: Internal server error
//  */
// router.get('/chat-session-info/:sessionId', authenticateToken, getChatSessionInfo);



// export default router;


import { Router } from 'express';
import { getChatSessions, getChatSessionInfo } from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = Router();

/**
 * @swagger
 * /list/chat-sessions:
 *   get:
 *     summary: List all chat sessions for the authenticated user
 *     tags: [List]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat sessions retrieved successfully
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
 *                       title:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       endedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/chat-sessions', authenticateToken, getChatSessions);

/**
 * @swagger
 * /list/chat-session-info/{sessionId}:
 *   get:
 *     summary: Retrieve information about a specific chat session
 *     tags: [List]
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

export default router;