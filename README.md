# Chatter - Real-time Chat Application

A modern, feature-rich chat application built with React, Firebase, and WebRTC for seamless communication.

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

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with Firebase credentials:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_SOCKET_SERVER_URL=http://localhost:3001
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

5. Start Socket.IO server (in another terminal):
   ```bash
   node server.js
   ```

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

## Security Features

- Firestore security rules for data protection
- Email verification for new accounts
- Anti-spam measures (rate limiting, blocked domains)
- Admin-only moderation tools
- User blocking and account deletion
- Secure file upload validation
## Notes
-This is a learning project first
-The app is not fully polished like a commercial streaming service yet
-The goal was to practice building a real product flow end to end
