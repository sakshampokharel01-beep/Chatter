# Integrate Video Call Button - Quick Guide

## ✅ What's Running:
- Socket.IO signaling server: `http://localhost:3001`
- Vite dev server: `http://localhost:5173`
- ExpressTURN credentials: Configured in `.env`

## 🎯 Next Step: Add Video Call Button to DirectMessages

Add these changes to `src/components/DirectMessages.jsx`:

### 1. Import VideoCall component (at the top)
```jsx
import VideoCall from './VideoCall';
```

### 2. Add state for video call (with other useState declarations)
```jsx
const [showVideoCall, setShowVideoCall] = useState(false);
```

### 3. Add video call button in chat header
Find the `dm-chat-header` div and add this button after the user info:

```jsx
<div className="dm-chat-header">
  <button className="dm-back-btn" onClick={() => setMobileView('list')}>
    {/* ... existing back button ... */}
  </button>
  <Avatar displayName={selectedUser.displayName} photoURL={selectedUser.photoURL} size={34} />
  <div className="dm-chat-info">
    <span className="dm-chat-name">{selectedUser.displayName}</span>
    <span className="dm-chat-sub">Private conversation</span>
  </div>
  
  {/* ADD THIS VIDEO CALL BUTTON */}
  <button 
    className="video-call-btn" 
    onClick={() => setShowVideoCall(true)}
    title="Start video call"
  >
    📹
  </button>
</div>
```

### 4. Render VideoCall component
Add this right after the closing `</div>` of `dm-chat` div:

```jsx
{/* Video Call Modal */}
{showVideoCall && selectedUser && (
  <VideoCall
    user={user}
    friendId={selectedUser.id}
    friendName={selectedUser.displayName}
    onClose={() => setShowVideoCall(false)}
  />
)}
```

### 5. Add CSS for video call button (in `src/App.css`)
```css
.video-call-btn {
  margin-left: auto;
  background: rgba(91, 141, 238, 0.15);
  border: 1px solid rgba(91, 141, 238, 0.3);
  color: #5b8dee;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
}

.video-call-btn:hover {
  background: rgba(91, 141, 238, 0.25);
  border-color: #5b8dee;
}
```

## 🧪 Test It:

1. Open `http://localhost:5173` in two different browsers (or use incognito)
2. Sign in as two different users
3. Add each other as friends
4. Open a DM conversation
5. Click the 📹 button
6. Allow camera/microphone access
7. Click "Start Call"
8. The other user should see the incoming call and connect automatically

## 🔍 Debugging:

Open browser console (F12) to see:
- `✅ Socket.IO connected` - Signaling working
- `✅ PeerJS connected with ID: xxx` - Peer connection ready
- `📞 Call signal sent to xxx` - Call initiated
- `✅ Connected! Receiving remote stream` - Call successful

## 📝 What Happens:

1. User A clicks 📹 → Gets camera/mic → Sends signal via Socket.IO
2. User B receives signal → Gets camera/mic → Connects to User A's peer ID
3. PeerJS establishes peer-to-peer connection using ExpressTURN
4. Video/audio streams flow directly between browsers

That's it! Your video calling is ready to test.
