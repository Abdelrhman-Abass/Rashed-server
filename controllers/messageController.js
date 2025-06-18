// import { PrismaClient } from '@prisma/client';
// import { fetchBotResponse } from '../utils/aiModel.js';
// // import { redisClient } from '../app.js';

// const prisma = new PrismaClient();

// // Start a new chat session
// export const startChatSession = async (req, res) => {
//   const userId = req.user.id;
//   const { title = 'New Chat' } = req.body;

//   const chatSession = await prisma.chatSession.create({
//     data: {
//       userId,
//       title,
//       isActive: true,
//     },
//   });

//   await prisma.conversationAnalytics.create({
//     data: {
//       sessionId: chatSession.id,
//       userId,
//       messageCount: 0,
//       topics: [],
//     },
//   });

//   res.status(201).json({ sessionId: chatSession.id, title: chatSession.title });
// };

// // Send a message and get AI response
// export const sendMessage = async (req, res) => {
//   const { sessionId } = req.params;
//   const { content, type = 'TEXT', metadata = {} } = req.body;
//   const userId = req.user.id;

//   // Verify the session exists and belongs to the user
//   const chatSession = await prisma.chatSession.findFirst({
//     where: { id: sessionId, userId, isActive: true },
//   });

//   if (!chatSession) {
//     return res.status(404).json({ message: 'Chat session not found or inactive' });
//   }

//   // Save the user's message
//   const userMessage = await prisma.message.create({
//     data: {
//       sessionId,
//       userId,
//       content,
//       isFromBot: false,
//       type,
//       metadata,
//       isRead: true,
//     },
//   });

//   // Call the external AI model API to get the bot's response
//   let botResponseContent;
//   try {
//     botResponseContent = await fetchBotResponse(content);
//   } catch (error) {
//     console.error('Error fetching AI response:', error.message);
//     return res.status(500).json({ message: 'Failed to get AI response' });
//   }

//   // Save the bot's response as a message
//   const botMessage = await prisma.message.create({
//     data: {
//       sessionId,
//       userId,
//       content: botResponseContent,
//       isFromBot: true,
//       type: 'TEXT', // Update this if the AI API can return non-text responses
//       isRead: false,
//     },
//   });

//   // Update conversation analytics
//   const analytics = await prisma.conversationAnalytics.findFirst({
//     where: { sessionId },
//   });

//   if (analytics) {
//     await prisma.conversationAnalytics.update({
//       where: { id: analytics.id },
//       data: {
//         messageCount: { increment: 2 }, // User message + bot message
//       },
//     });
//   }

//   // Update Redis cache with the full conversation history
//   // let allMessages = [];
//   // try {
//   //   const cachedMessages = await redisClient.get(`messages:${sessionId}`);
//   //   allMessages = cachedMessages ? JSON.parse(cachedMessages) : [];
//   //   allMessages.push(userMessage, botMessage);
//   //   await redisClient.setEx(`messages:${sessionId}`, 3600, JSON.stringify(allMessages));
//   // } catch (err) {
//   //   console.error('Failed to cache messages in Redis:', err.message);
//   //   // Fetch all messages from the database as a fallback
//   //   allMessages = await prisma.message.findMany({
//   //     where: { sessionId },
//   //     orderBy: { createdAt: 'asc' },
//   //     select: {
//   //       id: true,
//   //       content: true,
//   //       isFromBot: true,
//   //       type: true,
//   //       metadata: true,
//   //       createdAt: true,
//   //     },
//   //   });
//   // }

//   res.status(201).json({
//     userMessage: { id: userMessage.id, content: userMessage.content, createdAt: userMessage.createdAt },
//     botMessage: { id: botMessage.id, content: botMessage.content, createdAt: botMessage.createdAt },
//   });
// };

// // Retrieve all messages in a session (with pagination)


// export const getMessages = async (req, res) => {
//   const { sessionId } = req.params;
//   const userId = req.user.id;
//   const { page = 1, limit = 50 } = req.query;

//   // Verify the session exists and belongs to the user
//   const chatSession = await prisma.chatSession.findFirst({
//     where: { id: sessionId, userId },
//   });

//   if (!chatSession) {
//     return res.status(404).json({ message: 'Chat session not found' });
//   }

//   // Fetch messages from the database with pagination
//   const messages = await prisma.message.findMany({
//     where: { sessionId },
//     orderBy: { createdAt: 'asc' },
//     skip: (page - 1) * limit,
//     take: parseInt(limit),
//     select: {
//       id: true,
//       content: true,
//       isFromBot: true,
//       type: true,
//       metadata: true,
//       createdAt: true,
//     },
//   });

//   // Mark unread bot messages as read
//   await prisma.message.updateMany({
//     where: { sessionId, userId, isFromBot: true, isRead: false },
//     data: { isRead: true },
//   });

//   res.json(messages);
// };
// // End a chat session
// export const endChatSession = async (req, res) => {
//   const { sessionId } = req.params;
//   const userId = req.user.id;

//   const chatSession = await prisma.chatSession.findFirst({
//     where: { id: sessionId, userId, isActive: true },
//   });

//   if (!chatSession) {
//     return res.status(404).json({ message: 'Chat session not found or already ended' });
//   }

//   const updatedSession = await prisma.chatSession.update({
//     where: { id: sessionId },
//     data: {
//       isActive: false,
//       endedAt: new Date(),
//     },
//   });

//   const analytics = await prisma.conversationAnalytics.findFirst({
//     where: { sessionId },
//   });

//   if (analytics) {
//     const duration = Math.floor((new Date() - new Date(chatSession.createdAt)) / 1000);
//     await prisma.conversationAnalytics.update({
//       where: { id: analytics.id },
//       data: { duration },
//     });
//   }

//   res.json({ message: 'Chat session ended successfully', session: updatedSession });
// };
// // New endpoint: List all chat sessions for the user
// export const getChatSessions = async (req, res) => {
//   const userId = req.user.id;
//   const { page = 1, limit = 10 } = req.query;

//   const sessions = await prisma.chatSession.findMany({
//     where: { userId },
//     orderBy: { createdAt: 'desc' },
//     skip: (page - 1) * limit,
//     take: parseInt(limit),
//     select: {
//       id: true,
//       title: true,
//       isActive: true,
//       createdAt: true,
//       updatedAt: true,
//       endedAt: true,
//     },
//   });

//   res.json(sessions);
// };


import { PrismaClient } from '@prisma/client';
import { fetchBotResponse } from '../utils/aiModel.js';
// import { uploadFileToStorage } from '../utils/fileStorage.js'; // Simulated file storage utility

const prisma = new PrismaClient();

// In-memory rate limiting (for demonstration purposes only; use a proper solution in production)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const RATE_LIMIT_MAX = 10; // Max 10 messages per minute per user per session

// Helper function to check and update rate limit
const checkRateLimit = (key) => {
  const now = Date.now();
  const rateLimit = rateLimitMap.get(key) || { count: 0, lastReset: now };

  // Reset the count if the window has expired
  if (now - rateLimit.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { count: 0, lastReset: now });
    return true;
  }

  // Increment the count and check the limit
  rateLimit.count += 1;
  rateLimitMap.set(key, rateLimit);

  return rateLimit.count <= RATE_LIMIT_MAX;
};

// Start a new chat session
export const startChatSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title = 'New Chat' } = req.body;

    // Validate title
    if (typeof title !== 'string' || title.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Title must be a string with max length of 100 characters',
        data: null,
      });
    }

    const chatSession = await prisma.chatSession.create({
      data: {
        userId,
        title,
        isActive: true,
      },
    });

    await prisma.conversationAnalytics.create({
      data: {
        sessionId: chatSession.id,
        userId,
        messageCount: 0,
        topics: [],
      },
    });

    res.status(201).json({
      success: true,
      message: 'Chat session started successfully',
      data: { sessionId: chatSession.id, title: chatSession.title },
    });
  } catch (error) {
    console.error('Error starting chat session:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  }
};

// Send a message and get AI response
export const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content, type = 'TEXT', metadata = {} , messageReturn = true } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!content && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Message content or file is required',
        data: null,
      });
    }
    if (!['TEXT', 'IMAGE', 'FILE'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message type. Must be TEXT, IMAGE, or FILE',
        data: null,
      });
    }

    // Verify the session exists and belongs to the user
    const chatSession = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId, isActive: true },
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found or inactive',
        data: null,
      });
    }

    // Rate limiting: Allow max 10 messages per minute per user per session
    const rateLimitKey = `sendMessage:${userId}:${sessionId}`;
    if (!checkRateLimit(rateLimitKey)) {
      return res.status(429).json({
        success: false,
        message: 'Too many messages sent. Please wait a minute before sending again.',
        data: null,
      });
    }

    let messageContent = content;
    let messageType = type;
    let messageMetadata = metadata;

    // Handle file upload if present
    // if (req.file) {
    //   try {
    //     const fileUrl = await uploadFileToStorage(req.file); // Simulated file storage utility
    //     messageContent = fileUrl;
    //     messageType = type === 'IMAGE' ? 'IMAGE' : 'FILE';
    //     messageMetadata = { ...metadata, fileName: req.file.originalname, fileSize: req.file.size };
    //   } catch (error) {
    //     console.error('Error uploading file:', error.message);
    //     return res.status(500).json({
    //       success: false,
    //       message: 'Failed to upload file',
    //       data: null,
    //     });
    //   }
    // }

    const messageCount = await prisma.message.count({
      where: { sessionId },
    });

    
    // Save the user's message
    const userMessage = await prisma.message.create({
      data: {
        sessionId,
        userId,
        content: messageContent,
        isFromBot: false,
        type: messageType,
        metadata: messageMetadata,
        isRead: true,
      },
    });

    if (messageCount === 0 && messageContent && messageType === 'TEXT') {
      const newTitle = messageContent.trim().slice(0, 50) || 'Untitled Chat';
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: newTitle },
      });
    }

    // Call the external AI model API to get the bot's response
    let botResponseContent;
    try {
      botResponseContent = await fetchBotResponse(messageContent, messageType);
    } catch (error) {
      console.error('Error fetching AI response:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to get AI response',
        data: null,
      });
    }

    // Save the bot's response as a message
    const botMessage = await prisma.message.create({
      data: {
        sessionId,
        userId,
        content: botResponseContent,
        isFromBot: true,
        type: 'TEXT', // Update this if the AI API can return non-text responses
        isRead: false,
      },
    });

    // Update conversation analytics
    const analytics = await prisma.conversationAnalytics.findFirst({
      where: { sessionId },
    });

    if (analytics) {
      // Simulated topic detection and sentiment analysis (replace with real implementation)
      const topics = [...(analytics.topics || []), 'General']; // Simulated topic

      await prisma.conversationAnalytics.update({
        where: { id: analytics.id },
        data: {
          messageCount: { increment: 2 }, // User message + bot message
          topics,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: messageReturn 
      ? {
          userMessage: { id: userMessage.id, content: userMessage.content, createdAt: userMessage.createdAt },
          botMessage: { id: botMessage.id, content: botMessage.content, createdAt: botMessage.createdAt }
        }
      : {
          botMessage: { id: botMessage.id, content: botMessage.content, createdAt: botMessage.createdAt }
        }
    });
  } catch (error) {
    console.error('Error sending message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  }
};

// Retrieve all messages in a session (with pagination)
export const getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters',
        data: null,
      });
    }

    // Verify the session exists and belongs to the user
    const chatSession = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
        data: null,
      });
    }

    // Fetch messages from the database
    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      select: {
        id: true,
        content: true,
        isFromBot: true,
        type: true,
        metadata: true,
        createdAt: true,
      },
    });

    // Mark unread bot messages as read
    await prisma.message.updateMany({
      where: { sessionId, userId, isFromBot: true, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: messages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  }
};

// End a chat session
export const endChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const chatSession = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId, isActive: true },
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found or already ended',
        data: null,
      });
    }

    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    const analytics = await prisma.conversationAnalytics.findFirst({
      where: { sessionId },
    });

    if (analytics) {
      const duration = Math.floor((new Date() - new Date(chatSession.createdAt)) / 1000);
      await prisma.conversationAnalytics.update({
        where: { id: analytics.id },
        data: { duration },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Chat session ended successfully',
      data: { session: updatedSession },
    });
  } catch (error) {
    console.error('Error ending chat session:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  }
};

// List all chat sessions for the user
export const getChatSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('User ID:', userId); // Debugging line  

    // Fetch sessions from the database
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        endedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Chat sessions retrieved successfully',
      data: sessions,
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  }
};
export const getChatSessionInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    // console.log('User ID:', userId); // Debugging line  
    const { sessionId } = req.params;

    const chatSession = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId},
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        endedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Chat sessions retrieved successfully',
      data: chatSession,
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  }
};


// Delete a specific message
export const deleteMessage = async (req, res) => {
  try {
    const { sessionId, messageId } = req.params;
    const userId = req.user.id;

    // Verify the session exists and belongs to the user
    const chatSession = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
        data: null,
      });
    }

    // Verify the message exists and belongs to the session
    const message = await prisma.message.findFirst({
      where: { id: messageId, sessionId, userId },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
        data: null,
      });
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId },
    });

    // Update conversation analytics
    const analytics = await prisma.conversationAnalytics.findFirst({
      where: { sessionId },
    });

    if (analytics) {
      await prisma.conversationAnalytics.update({
        where: { id: analytics.id },
        data: {
          messageCount: { decrement: 1 },
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Error deleting message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  }
};

// Delete a chat session
export const deleteChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify the session exists and belongs to the user
    const chatSession = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
        data: null,
      });
    }

    // Delete associated messages
    await prisma.message.deleteMany({
      where: { sessionId },
    });

    // Delete associated conversation analytics
    await prisma.conversationAnalytics.deleteMany({
      where: { sessionId },
    });

    // Delete the chat session
    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    res.status(200).json({
      success: true,
      message: 'Chat session deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Error deleting chat session:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  }
};


// Rename a chat session
export const renameChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!title || typeof title !== 'string' || title.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Title must be a string with max length of 100 characters',
        data: null,
      });
    }

    // Verify the session exists and belongs to the user
    const chatSession = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
        data: null,
      });
    }

    // Update the chat session title
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: title.trim() },
      select: {
        id: true,
        title: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Chat session renamed successfully',
      data: { sessionId: updatedSession.id, title: updatedSession.title },
    });
  } catch (error) {
    console.error('Error renaming chat session:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  }
};