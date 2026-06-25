# Chatter - Real-time Chat Application

Chatter is a modern, feature-rich chat application built with React, Firebase, and WebRTC for communication.

This project is still more of a learning/portfolio project than a production-ready app, but the structure is setup in a way that makes it easy to extend.

## Screenshots
<img width="1877" height="861" alt="image" src="https://github.com/user-attachments/assets/c2c0d0d3-5a27-4591-ae93-2d37ac346c5c" />

## Features

- **Real-time Messaging** - Global chat and private DMs with typing indicators
- **Video & Audio Calls** - Peer-to-peer calling with WebRTC
- **Friend System** - Send/accept friend requests, manage connections
- **Groups & Channels** - Create and manage group conversations
- **File Sharing** - Upload files and send voice messages
- **Multiple Authentication** - Email, Google, GitHub, and Guest login
- **User Presence** - Real-time online/offline status
- **Message Features** - Save messages, read receipts, message editing
- **Admin Panel** - User management and moderation tools

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React/Vite                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Auth UI    │  │   Chat UI    │  │  Video Call  │         │
│  │              │  │              │  │      UI      │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                  │
└─────────┼─────────────────┼──────────────────┼──────────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│     Firebase    │ │     Firebase    │ │   Socket.IO     │
│  Authentication │ │    Firestore    │ │     Server      │
│                 │ │                 │ │   (Render)      │
│  - Email/Pass   │ │  - Messages     │ │                 │
│  - Google       │ │  - Users        │ │  - Call Signal  │
│  - GitHub       │ │  - Friends      │ │  - Typing       │
│  - Anonymous    │ │  - Groups       │ │                 │
└─────────────────┘ └─────────────────┘ └────────┬────────┘
                                                  │
                    ┌─────────────────────────────┘
                    ▼
          ┌─────────────────┐
          │     PeerJS      │
          │   + TURN        │
          │                 │
          │  - P2P Video    │
          │  - P2P Audio    │
          │  - ExpressTURN  │
          └─────────────────┘
```

## Tech Stack

**Frontend**
- React 18 with Hooks
- React Router for navigation
- Vite for build tooling
- CSS3 for styling

**Backend Services**
- Firebase Authentication (Email, Google, GitHub, Anonymous)
- Firebase Firestore (Real-time database)
- Firebase Storage (File uploads)
- Socket.IO (Call signaling, typing indicators)

**Real-time Communication**
- Socket.IO for WebSocket connections
- PeerJS for WebRTC peer-to-peer connections
- ExpressTURN for TURN/STUN servers

**Deployment**
- Vercel (Frontend hosting)
- Render (Socket.IO server)
- Firebase (Backend services)

## Deployment

**Frontend:** Vercel (https://chatter-talk.vercel.app)
**Socket.IO Server:** Render (https://chatter-25wdxnreeder.com)
**Backend:** Firebase (chatapp-eb6e3)

## Project Structure

```
chatter/
├── src/
│   ├── components/          # React components
│   │   ├── AuthScreen.jsx   # Authentication UI
│   │   ├── ChatRoom.jsx     # Main chat interface
│   │   ├── DirectMessages.jsx # Private messaging
│   │   ├── VideoCall.jsx    # Video call component
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   ├── useUserPresence.js
│   │   └── useInAppNotifications.jsx
│   ├── utils/               # Utility functions
│   ├── styles/              # CSS files
│   ├── firebase.js          # Firebase configuration
│   └── socket.js            # Socket.IO client
├── server.js                # Socket.IO server
├── firestore.rules          # Firestore security rules
├── storage.rules            # Firebase Storage rules
└── package.json
```
## AI Usage Note
I used AI help for some parts of the project, especially for:

- improving code structure and debugging
- generating UI ideas and component patterns
- helping with documentation and README writing
- understanding some setup/config issues
But the main idea, system design, app flow, and overall project structure were built by me. The core logic and product direction were not copied from anywhere else.

## Security Features

- Firestore security rules for data protection
- Anti-spam measures (rate limiting, blocked domains)
- Admin-only moderation tools
- User blocking and account deletion
- Secure file upload validation
## Notes

- This is a learning project first
- The app is not fully polished like a commercial streaming service yet
- The goal was to practice building a real product flow end to end
