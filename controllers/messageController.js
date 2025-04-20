import { PrismaClient } from '@prisma/client';
import { fetchBotResponse } from '../utils/aiModel.js';
import { redisClient } from '../app.js';

const prisma = new PrismaClient();

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

  // Initialize analytics for the session
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
  const botResponseContent = await fetchBotResponse(content);

  // Save the bot's response as a message
  const botMessage = await prisma.message.create({
    data: {
      sessionId,
      userId,
      content: botResponseContent,
      isFromBot: true,
      type: 'TEXT',
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
        // Optionally compute sentiment or topics here
        // For now, we'll leave sentiment and topics as placeholders
      },
    });
  }

  // Cache the messages in Redis (optional, for faster retrieval)
  const messages = [userMessage, botMessage];
  await redisClient.setEx(`messages:${sessionId}`, 3600, JSON.stringify(messages));

  res.status(201).json({
    userMessage: { id: userMessage.id, content: userMessage.content, createdAt: userMessage.createdAt },
    botMessage: { id: botMessage.id, content: botMessage.content, createdAt: botMessage.createdAt },
  });
};

export const getMessages = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  // Check Redis cache first
  const cachedMessages = await redisClient.get(`messages:${sessionId}`);
  if (cachedMessages) {
    return res.json(JSON.parse(cachedMessages));
  }

  // Verify the session exists and belongs to the user
  const chatSession = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!chatSession) {
    return res.status(404).json({ message: 'Chat session not found' });
  }

  // Fetch all messages in the session
  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      content: true,
      isFromBot: true,
      type: true,
      metadata: true,
      createdAt: true,
    },
  });

  // Cache the messages in Redis
  await redisClient.setEx(`messages:${sessionId}`, 3600, JSON.stringify(messages));

  // Mark unread bot messages as read
  await prisma.message.updateMany({
    where: { sessionId, userId, isFromBot: true, isRead: false },
    data: { isRead: true },
  });

  res.json(messages);
};

export const endChatSession = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  // Verify the session exists and belongs to the user
  const chatSession = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId, isActive: true },
  });

  if (!chatSession) {
    return res.status(404).json({ message: 'Chat session not found or already ended' });
  }

  // End the session
  const updatedSession = await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      isActive: false,
      endedAt: new Date(),
    },
  });

  // Update analytics with the session duration
  const analytics = await prisma.conversationAnalytics.findFirst({
    where: { sessionId },
  });

  if (analytics) {
    const duration = Math.floor((new Date() - new Date(chatSession.createdAt)) / 1000); // Duration in seconds
    await prisma.conversationAnalytics.update({
      where: { id: analytics.id },
      data: { duration },
    });
  }

  res.json({ message: 'Chat session ended successfully', session: updatedSession });
};