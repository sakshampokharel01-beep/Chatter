/**
 * Simple Socket.IO Signaling Server for PeerJS
 * 
 * This server handles signaling for video/audio calls
 * It does NOT handle the actual media streams (that's peer-to-peer via PeerJS)
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

// Configure CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store connected users
const users = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Register user
  const userId = socket.handshake.auth.userId;
  const userName = socket.handshake.auth.userName;
  
  if (userId) {
    users.set(userId, {
      socketId: socket.id,
      userName: userName
    });
    console.log(`📝 Registered user: ${userName} (${userId})`);
  }

  // Handle call signal (initiating a call)
  socket.on('call-signal', ({ to, from, peerId }) => {
    console.log(`📞 Call signal from ${from} to ${to}, peer ID: ${peerId}`);
    
    const recipient = users.get(to);
    if (recipient) {
      io.to(recipient.socketId).emit('call-signal', {
        from: from,
        peerId: peerId
      });
      console.log(`✅ Call signal delivered to ${to}`);
    } else {
      console.log(`❌ User ${to} not found or offline`);
      socket.emit('call-error', {
        message: 'User is offline or not available'
      });
    }
  });

  // Handle call ended
  socket.on('call-ended', ({ to, from }) => {
    console.log(`📴 Call ended: ${from} -> ${to}`);
    
    const recipient = users.get(to);
    if (recipient) {
      io.to(recipient.socketId).emit('call-ended', {
        from: from
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    
    // Remove user from map
    for (const [userId, userData] of users.entries()) {
      if (userData.socketId === socket.id) {
        users.delete(userId);
        console.log(`📝 Unregistered user: ${userId}`);
        break;
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connectedUsers: users.size,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO signaling server running on port ${PORT}`);
  console.log(`📡 Accepting connections from: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});
