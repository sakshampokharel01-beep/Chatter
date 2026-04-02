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

// Configure CORS - Only allow your Vercel domain
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://chatter-talk.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Initialize Socket.IO with stricter CORS
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://chatter-talk.vercel.app',
        process.env.CLIENT_URL
      ].filter(Boolean);
      
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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
  
  // Validate user data
  if (!userId || typeof userId !== 'string' || userId.length > 128) {
    console.log('❌ Invalid userId');
    socket.disconnect();
    return;
  }
  
  if (!userName || typeof userName !== 'string' || userName.length > 64) {
    console.log('❌ Invalid userName');
    socket.disconnect();
    return;
  }
  
  if (userId) {
    users.set(userId, {
      socketId: socket.id,
      userName: userName.slice(0, 64) // Ensure max length
    });
    console.log(`📝 Registered user: ${userName} (${userId})`);
  }

  // Handle call signal (initiating a call)
  socket.on('call-signal', ({ to, from, peerId }) => {
    // Validate input
    if (!to || !from || !peerId || 
        typeof to !== 'string' || typeof from !== 'string' || typeof peerId !== 'string' ||
        to.length > 128 || from.length > 128 || peerId.length > 128) {
      console.log('❌ Invalid call signal data');
      return;
    }
    
    // Verify sender is authenticated
    if (from !== userId) {
      console.log('❌ Unauthorized call signal');
      return;
    }
    
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

  // Handle media status changes (mute/video toggle)
  socket.on('media-status', ({ to, from, isMuted, isVideoOff }) => {
    // Validate input
    if (!to || !from || typeof isMuted !== 'boolean' || typeof isVideoOff !== 'boolean') {
      return;
    }
    
    // Verify sender is authenticated
    if (from !== userId) {
      return;
    }
    
    const recipient = users.get(to);
    if (recipient) {
      io.to(recipient.socketId).emit('media-status', {
        from: from,
        isMuted: isMuted,
        isVideoOff: isVideoOff
      });
    }
  });

  // Handle typing indicators for DMs
  socket.on('typing-dm', ({ to, from, isTyping }) => {
    // Validate input
    if (!to || !from || typeof isTyping !== 'boolean') {
      return;
    }
    
    // Verify sender is authenticated
    if (from !== userId) {
      return;
    }
    
    const recipient = users.get(to);
    if (recipient) {
      io.to(recipient.socketId).emit('typing-dm', {
        from: from,
        isTyping: isTyping
      });
    }
  });

  // Handle typing indicators for global chat
  socket.on('typing-global', ({ from, userName, isTyping }) => {
    // Validate input
    if (!from || !userName || typeof isTyping !== 'boolean') {
      return;
    }
    
    // Verify sender is authenticated
    if (from !== userId) {
      return;
    }
    
    // Broadcast to all users except sender
    socket.broadcast.emit('typing-global', {
      from: from,
      userName: userName.slice(0, 64),
      isTyping: isTyping
    });
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
