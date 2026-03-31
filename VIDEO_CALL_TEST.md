# Video Call - Quick Test Guide

## What You Have
- PeerJS for peer-to-peer connections
- Socket.IO for signaling (exchanging peer IDs)
- ExpressTURN as ICE server (NAT traversal)
- VideoCall component ready to use

## Setup Steps

### 1. Get ExpressTURN Credentials (Free)
Visit: https://www.expressturn.com/
- Sign up for free account
- Get your credentials:
  - URL: `turn:a.relay.metered.ca:80`
  - Username: (provided by ExpressTURN)
  - Credential: (provided by ExpressTURN)

### 2. Add Credentials to `.env`
```env
VITE_SOCKET_SERVER_URL=http://localhost:3001
VITE_TURN_URL=turn:a.relay.metered.ca:80
VITE_TURN_USERNAME=your_actual_username
VITE_TURN_CREDENTIAL=your_actual_credential
```

### 3. Start Socket.IO Server
```bash
cd your-project-folder
npm install express socket.io cors
node server.js
```

You should see:
```
🚀 Socket.IO signaling server running on port 3001
📡 Accepting connections from: http://localhost:5173
```

### 4. Start Your App
```bash
npm run dev
```

### 5. Test Locally
1. Open two browser windows (or use incognito mode)
2. Sign in as two different users
3. Add each other as friends
4. Open DM conversation
5. Click video call button (you'll add this next)

## How It Works

1. **User A clicks "Start Call"**
   - Gets camera/microphone access
   - Creates PeerJS connection
   - Sends call signal via Socket.IO to User B

2. **User B receives signal**
   - Gets camera/microphone access
   - Connects to User A's peer ID
   - Streams start flowing peer-to-peer

3. **ExpressTURN helps**
   - If direct connection fails (NAT/firewall)
   - Routes media through TURN server
   - Ensures call works even behind firewalls

## Next Step: Add Video Call Button

You need to integrate the VideoCall component into DirectMessages.jsx:

```jsx
// In DirectMessages.jsx
import VideoCall from './VideoCall';

// Add state
const [showVideoCall, setShowVideoCall] = useState(false);

// Add button in chat header (next to user name)
<button 
  className="video-call-btn" 
  onClick={() => setShowVideoCall(true)}
>
  📹 Call
</button>

// Render VideoCall component
{showVideoCall && (
  <VideoCall
    user={user}
    friendId={selectedUser.id}
    friendName={selectedUser.displayName}
    onClose={() => setShowVideoCall(false)}
  />
)}
```

## Troubleshooting

- **"Not ready to call"**: Wait for PeerJS to connect (check console for peer ID)
- **"Camera access denied"**: Allow camera/microphone in browser settings
- **"User offline"**: Make sure both users are connected to Socket.IO server
- **No video/audio**: Check ExpressTURN credentials are correct

## Tech Stack Summary
- **PeerJS**: Peer-to-peer WebRTC connections
- **Socket.IO**: Signaling server (exchange peer IDs)
- **ExpressTURN**: TURN server (NAT traversal)
- **React**: UI components
