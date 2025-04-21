// import { io } from '../server.js'
// import { PrismaClient } from '@prisma/client';
// import { fetchBotResponse } from '../utils/aiModel.js';

// const prisma = new PrismaClient();

// const setupSocket = () => {
//   io.on('connection', (socket) => {
//     console.log('A user connected:', socket.id);

//     // Join a chat session room
//     socket.on('joinSession', async ({ sessionId, userId }) => {
//       try {
//         // Verify the session exists and belongs to the user
//         const chatSession = await prisma.chatSession.findFirst({
//           where: { id: sessionId, userId, isActive: true },
//         });

//         if (!chatSession) {
//           socket.emit('error', { message: 'Chat session not found or inactive' });
//           return;
//         }

//         // Join a room specific to the session
//         socket.join(sessionId);
//         socket.emit('sessionJoined', { sessionId });
//       } catch (err) {
//         socket.emit('error', { message: 'Failed to join session' });
//       }
//     });

//     // Handle sending a message
//     socket.on('sendMessage', async ({ sessionId, userId, content, type = 'TEXT', metadata = {} }) => {
//       try {
//         // Verify the session exists and belongs to the user
//         const chatSession = await prisma.chatSession.findFirst({
//           where: { id: sessionId, userId, isActive: true },
//         });

//         if (!chatSession) {
//           socket.emit('error', { message: 'Chat session not found or inactive' });
//           return;
//         }

//         // Save the user's message
//         const userMessage = await prisma.message.create({
//           data: {
//             sessionId,
//             userId,
//             content,
//             isFromBot: false,
//             type,
//             metadata,
//             isRead: true,
//           },
//         });

//         // Broadcast the user's message to the session room
//         io.to(sessionId).emit('newMessage', {
//           id: userMessage.id,
//           content: userMessage.content,
//           isFromBot: false,
//           type: userMessage.type,
//           metadata: userMessage.metadata,
//           createdAt: userMessage.createdAt,
//         });

//         // Call the external AI model API to get the bot's response
//         let botResponseContent;
//         try {
//           botResponseContent = await fetchBotResponse(content);
//         } catch (error) {
//           console.error('Error fetching AI response:', error.message);
//           socket.emit('error', { message: 'Failed to get AI response' });
//           return;
//         }

//         // Save the bot's response as a message
//         const botMessage = await prisma.message.create({
//           data: {
//             sessionId,
//             userId,
//             content: botResponseContent,
//             isFromBot: true,
//             type: 'TEXT',
//             isRead: false,
//           },
//         });

//         // Broadcast the bot's response to the session room
//         io.to(sessionId).emit('newMessage', {
//           id: botMessage.id,
//           content: botMessage.content,
//           isFromBot: true,
//           type: botMessage.type,
//           metadata: botMessage.metadata,
//           createdAt: botMessage.createdAt,
//         });

//         // Update conversation analytics
//         const analytics = await prisma.conversationAnalytics.findFirst({
//           where: { sessionId },
//         });

//         if (analytics) {
//           await prisma.conversationAnalytics.update({
//             where: { id: analytics.id },
//             data: {
//               messageCount: { increment: 2 },
//             },
//           });
//         }
//       } catch (err) {
//         socket.emit('error', { message: 'Failed to send  send message' });
//       }
//     });

//     // Handle disconnection
//     socket.on('disconnect', () => {
//       console.log('User disconnected:', socket.id);
//     });
//   });
// };


// export default setupSocket