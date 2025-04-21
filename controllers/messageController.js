import { PrismaClient } from '@prisma/client';
import { fetchBotResponse } from '../utils/aiModel.js';
// import { redisClient } from '../app.js';

const prisma = new PrismaClient();

// Start a new chat session
export const startChatSession = async (req, res) => {
  const userId = req.user.id;
  const { title = 'New Chat' } = req.body;

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

  res.status(201).json({ sessionId: chatSession.id, title: chatSession.title });
};

// Send a message and get AI response
export const sendMessage = async (req, res) => {
  const { sessionId } = req.params;
  const { content, type = 'TEXT', metadata = {} } = req.body;
  const userId = req.user.id;

  // Verify the session exists and belongs to the user
  const chatSession = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId, isActive: true },
  });

  if (!chatSession) {
    return res.status(404).json({ message: 'Chat session not found or inactive' });
  }

  // Save the user's message
  const userMessage = await prisma.message.create({
    data: {
      sessionId,
      userId,
      content,
      isFromBot: false,
      type,
      metadata,
      isRead: true,
    },
  });

  // Call the external AI model API to get the bot's response
  let botResponseContent;
  try {
    botResponseContent = await fetchBotResponse(content);
  } catch (error) {
    console.error('Error fetching AI response:', error.message);
    return res.status(500).json({ message: 'Failed to get AI response' });
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
    await prisma.conversationAnalytics.update({
      where: { id: analytics.id },
      data: {
        messageCount: { increment: 2 }, // User message + bot message
      },
    });
  }

  // Update Redis cache with the full conversation history
  // let allMessages = [];
  // try {
  //   const cachedMessages = await redisClient.get(`messages:${sessionId}`);
  //   allMessages = cachedMessages ? JSON.parse(cachedMessages) : [];
  //   allMessages.push(userMessage, botMessage);
  //   await redisClient.setEx(`messages:${sessionId}`, 3600, JSON.stringify(allMessages));
  // } catch (err) {
  //   console.error('Failed to cache messages in Redis:', err.message);
  //   // Fetch all messages from the database as a fallback
  //   allMessages = await prisma.message.findMany({
  //     where: { sessionId },
  //     orderBy: { createdAt: 'asc' },
  //     select: {
  //       id: true,
  //       content: true,
  //       isFromBot: true,
  //       type: true,
  //       metadata: true,
  //       createdAt: true,
  //     },
  //   });
  // }

  res.status(201).json({
    userMessage: { id: userMessage.id, content: userMessage.content, createdAt: userMessage.createdAt },
    botMessage: { id: botMessage.id, content: botMessage.content, createdAt: botMessage.createdAt },
  });
};

// Retrieve all messages in a session (with pagination)


export const getMessages = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;
  const { page = 1, limit = 50 } = req.query;

  // Verify the session exists and belongs to the user
  const chatSession = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!chatSession) {
    return res.status(404).json({ message: 'Chat session not found' });
  }

  // Fetch messages from the database with pagination
  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    skip: (page - 1) * limit,
    take: parseInt(limit),
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

  res.json(messages);
};
// End a chat session
export const endChatSession = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  const chatSession = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId, isActive: true },
  });

  if (!chatSession) {
    return res.status(404).json({ message: 'Chat session not found or already ended' });
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

  res.json({ message: 'Chat session ended successfully', session: updatedSession });
};
// New endpoint: List all chat sessions for the user
export const getChatSessions = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  const sessions = await prisma.chatSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: parseInt(limit),
    select: {
      id: true,
      title: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      endedAt: true,
    },
  });

  res.json(sessions);
};