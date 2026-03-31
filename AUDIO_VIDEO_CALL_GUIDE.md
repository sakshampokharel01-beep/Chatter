# 📞 Audio/Video Call Implementation Guide

## 🎯 Overview

Adding audio/video calls requires WebRTC (Web Real-Time Communication) technology. Here are your options:

---

## 🚀 Option 1: Agora (Recommended - Easiest)

### Why Agora?
- ✅ Easy to implement (2-3 hours)
- ✅ Free tier: 10,000 minutes/month
- ✅ Excellent quality
- ✅ Works on mobile browsers
- ✅ Built-in UI components

### Implementation Steps:

**1. Install Agora SDK**
```bash
npm install agora-rtc-react agora-rtc-sdk-ng
```

**2. Get Agora Credentials**
- Sign up: https://www.agora.io/
- Create project
- Get App ID (free)

**3. Add to .env**
```env
VITE_AGORA_APP_ID=your_app_id_here
```

**4. Create Call Component**
```javascript
// src/components/VideoCall.jsx
import { useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

export default function VideoCall({ channelName, onLeave }) {
  const [localTracks, setLocalTracks] = useState([]);
  
  const joinCall = async () => {
    await client.join(
      import.meta.env.VITE_AGORA_APP_ID,
      channelName,
      null,
      null
    );
    
    const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
    setLocalTracks([audioTrack, videoTrack]);
    
    await client.publish([audioTrack, videoTrack]);
  };
  
  // ... rest of implementation
}
```

**5. Add Call Buttons to DMs**
```javascript
// In DirectMessages.jsx
<button onClick={() => startCall('audio')}>📞 Audio Call</button>
<button onClick={() => startCall('video')}>📹 Video Call</button>
```

**Cost:** FREE for 10,000 minutes/month

---

## 🔥 Option 2: Firebase + WebRTC (Free but Complex)

### Why Firebase WebRTC?
- ✅ Completely free
- ✅ No third-party service
- ✅ Full control
- ❌ More complex to implement (1-2 days)

### Implementation Steps:

**1. Install Dependencies**
```bash
npm install simple-peer
```

**2. Create Signaling with Firestore**
```javascript
// Store call offers/answers in Firestore
const callDoc = doc(db, 'calls', callId);

// Caller creates offer
await setDoc(callDoc, {
  offer: offer,
  from: userId,
  to: friendId,
  type: 'video', // or 'audio'
  createdAt: serverTimestamp()
});

// Callee responds with answer
await updateDoc(callDoc, {
  answer: answer
});
```

**3. WebRTC Connection**
```javascript
// Get user media
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});

// Create peer connection
const peer = new SimplePeer({
  initiator: true,
  stream: stream,
  trickle: false
});

// Exchange signals via Firestore
peer.on('signal', signal => {
  // Save to Firestore
});
```

**Cost:** FREE (uses your Firebase quota)

---

## 🌐 Option 3: Daily.co (Best Quality)

### Why Daily.co?
- ✅ Professional quality
- ✅ Easy to implement
- ✅ Free tier: 10,000 minutes/month
- ✅ Recording & screen sharing built-in

### Implementation:

**1. Install**
```bash
npm install @daily-co/daily-js @daily-co/daily-react
```

**2. Sign up**
- Visit: https://www.daily.co/
- Get API key

**3. Create Room**
```javascript
const createRoom = async () => {
  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        enable_screenshare: true,
        enable_chat: true
      }
    })
  });
  
  const room = await response.json();
  return room.url;
};
```

**Cost:** FREE for 10,000 minutes/month

---

## 📱 Option 4: Twilio Video (Enterprise)

### Why Twilio?
- ✅ Most reliable
- ✅ Best for production
- ❌ Expensive ($0.0015/min)
- ✅ Excellent documentation

**Cost:** $0.0015 per participant per minute

---

## 🎨 Recommended Implementation (Agora)

Here's a complete minimal implementation:

### Step 1: Install
```bash
npm install agora-rtc-react agora-rtc-sdk-ng
```

### Step 2: Create VideoCall Component
```javascript
// src/components/VideoCall.jsx
import { useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

export default function VideoCall({ channelName, onLeave, isVideo = true }) {
  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Join channel
      await client.join(
        import.meta.env.VITE_AGORA_APP_ID,
        channelName,
        null,
        null
      );

      // Create local tracks
      const tracks = isVideo
        ? await AgoraRTC.createMicrophoneAndCameraTracks()
        : [await AgoraRTC.createMicrophoneAudioTrack()];
      
      setLocalTracks(tracks);
      
      // Publish tracks
      await client.publish(tracks);
      setJoined(true);

      // Handle remote users
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        setRemoteUsers(prev => [...prev, user]);
      });

      client.on('user-unpublished', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });
    };

    init();

    return () => {
      localTracks.forEach(track => track.close());
      client.leave();
    };
  }, []);

  const leaveCall = () => {
    localTracks.forEach(track => track.close());
    client.leave();
    onLeave();
  };

  return (
    <div className="video-call">
      <div className="video-grid">
        {/* Local video */}
        <div className="video-player local">
          <div ref={ref => {
            if (ref && localTracks[1]) {
              localTracks[1].play(ref);
            }
          }} />
        </div>

        {/* Remote videos */}
        {remoteUsers.map(user => (
          <div key={user.uid} className="video-player remote">
            <div ref={ref => {
              if (ref && user.videoTrack) {
                user.videoTrack.play(ref);
              }
            }} />
          </div>
        ))}
      </div>

      <div className="call-controls">
        <button onClick={leaveCall}>End Call</button>
      </div>
    </div>
  );
}
```

### Step 3: Add to DirectMessages
```javascript
// In DirectMessages.jsx
const [callActive, setCallActive] = useState(false);
const [callChannel, setCallChannel] = useState(null);

const startCall = async (type) => {
  const channelName = `dm_${getDMId(user.uid, selectedUser.uid)}`;
  
  // Notify other user via Firestore
  await addDoc(collection(db, 'callNotifications'), {
    from: user.uid,
    to: selectedUser.uid,
    channel: channelName,
    type: type, // 'audio' or 'video'
    createdAt: serverTimestamp()
  });
  
  setCallChannel(channelName);
  setCallActive(true);
};

// In render
{callActive && (
  <VideoCall
    channelName={callChannel}
    onLeave={() => setCallActive(false)}
    isVideo={true}
  />
)}
```

### Step 4: Add CSS
```css
.video-call {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 1000;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
  padding: 20px;
  height: calc(100% - 80px);
}

.video-player {
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.video-player video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.call-controls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 15px;
}

.call-controls button {
  padding: 15px 30px;
  border-radius: 50px;
  border: none;
  background: #e05c6a;
  color: white;
  font-weight: 600;
  cursor: pointer;
}
```

---

## 📊 Comparison Table

| Service | Free Tier | Ease | Quality | Mobile | Cost After Free |
|---------|-----------|------|---------|--------|-----------------|
| **Agora** | 10K min/mo | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | $0.99/1K min |
| **Firebase WebRTC** | Unlimited | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | FREE |
| **Daily.co** | 10K min/mo | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | $0.002/min |
| **Twilio** | $15 credit | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | $0.0015/min |

---

## 🎯 My Recommendation

**For Your App: Use Agora**

**Why?**
1. ✅ Free 10,000 minutes/month (enough for testing)
2. ✅ Easy to implement (2-3 hours)
3. ✅ Excellent quality
4. ✅ Works on mobile
5. ✅ Good documentation
6. ✅ Affordable after free tier

**Implementation Time:**
- Basic audio call: 2 hours
- Video call: 3 hours
- With UI polish: 5 hours

---

## 🚀 Quick Start (Agora)

```bash
# 1. Install
npm install agora-rtc-react agora-rtc-sdk-ng

# 2. Sign up at agora.io and get App ID

# 3. Add to .env
echo "VITE_AGORA_APP_ID=your_app_id" >> .env

# 4. Copy VideoCall.jsx component (from above)

# 5. Add call buttons to DirectMessages

# 6. Test!
```

---

## 📝 Additional Features to Add

**Basic:**
- Mute/unmute audio
- Turn video on/off
- End call button

**Advanced:**
- Screen sharing
- Call notifications
- Call history
- Recording
- Group calls (3+ people)

---

## 🔒 Security Considerations

**Agora Token Server (Production):**
```javascript
// Generate token on backend
const token = await generateAgoraToken(channelName, userId);

// Use token when joining
await client.join(appId, channelName, token, userId);
```

**Firestore Rules for Call Notifications:**
```javascript
match /callNotifications/{notifId} {
  allow read: if request.auth.uid == resource.data.to;
  allow create: if request.auth.uid == request.resource.data.from;
  allow delete: if request.auth.uid == resource.data.to;
}
```

---

## 💡 Pro Tips

1. **Test on mobile early** - WebRTC behaves differently on mobile
2. **Handle permissions** - Ask for camera/mic access gracefully
3. **Add loading states** - Connection takes 2-3 seconds
4. **Error handling** - Network issues are common
5. **Fallback to audio** - If video fails, offer audio-only

---

## 📚 Resources

- Agora Docs: https://docs.agora.io/en/video-calling/get-started/get-started-sdk
- WebRTC Guide: https://webrtc.org/getting-started/overview
- Daily.co Docs: https://docs.daily.co/
- Twilio Video: https://www.twilio.com/docs/video

---

**Ready to implement? Start with Agora - it's the easiest and most reliable option!** 🎉
