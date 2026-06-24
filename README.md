# Chatter - Real-time Chat Application

A modern, feature-rich chat application built with React, Firebase, and WebRTC.

## Features

- Real-time messaging (global chat & private DMs)
- Video and audio calling
- Friend system
- Groups and channels
- File sharing and voice messages
- Multiple authentication methods (Email, Google, GitHub, Guest)
- Online/offline status tracking
- Saved messages
- Admin panel for user management

## Tech Stack

- **Frontend**: React 18, React Router, Vite
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Real-time**: Socket.IO for call signaling
- **Video/Audio**: PeerJS with ExpressTURN
- **Deployment**: Vercel (frontend), Render (Socket.IO server)

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

- Frontend is deployed on Vercel
- Socket.IO server on Render
- Firebase for backend services

## License

MIT
