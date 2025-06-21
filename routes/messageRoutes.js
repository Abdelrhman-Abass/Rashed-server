import { authenticateToken } from '../middleware/authMiddleware.js';


import { Router } from 'express';
import { startChatSession, sendMessage, getMessages, endChatSession, getChatSessionInfo, renameChatSession, deleteMessage, deleteChatSession } from '../controllers/messageController.js';

const router = Router();
// const upload = multer({ dest: 'uploads/' }); // Configure multer for file uploads
import multer from 'multer';
import { readFileSync, unlinkSync } from 'fs';
import PDFParser from 'pdf2json';


const upload = multer({ dest: 'uploads/' });

router.post('/api/upload/:sessionId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const sessionId = req.params.sessionId;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    if (req.file.mimetype !== 'application/pdf') {
      unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'Only PDF files are allowed' });
    }

    // Parse PDF using pdf2json
    const pdfParser = new PDFParser();
    pdfParser.on('pdfParser_dataError', (errData) => {
      console.error('PDF Parsing Error:', errData.parserError);
      res.status(500).json({ success: false, message: 'Failed to process PDF' });
    });
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      // Extract text (simplified, adjust based on needs)
      let text = '';
      for (const page of pdfData.Pages) {
        for (const field of page.Texts) {
          text += decodeURIComponent(field.R[0].T) + ' ';
        }
      }

      unlinkSync(filePath); // Clean up

      console.log('Extracted PDF Content:', text);

      res.json({
        success: true,
        type: 'FILE',
        data: {
          fileName,
          text,
          sessionId,
        },
      });
    });

    pdfParser.loadPDF(filePath);
  } catch (error) {
    console.error('Error processing PDF:', error);
    if (req.file?.path) unlinkSync(req.file.path); // Clean up on error
    res.status(500).json({ success: false, message: 'Failed to process PDF' });
  }
});

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