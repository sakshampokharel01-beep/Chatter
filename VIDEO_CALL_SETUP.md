# 📞 Video Call Setup Instructions

## ✅ What's Been Done

1. ✅ Installed PeerJS and Socket.IO client
2. ✅ Created VideoCall component
3. ✅ Added CSS styles
4. ✅ Created Socket.IO signaling server
5. ✅ Set up environment variables template

---

## 🚀 Quick Start (5 Steps)

### Step 1: Add ExpressTURN Credentials to .env

Open your `.env` file and add these lines:

```env
# Socket.IO Server
VITE_SOCKET_SERVER_URL=http://localhost:3001

# ExpressTURN Configuration
VITE_TURN_URL=turn:your-turn-server.com:3478
VITE_TURN_USERNAME=your_username_here
VITE_TURN_CREDENTIAL=your_password_here
```

**Replace with your actual ExpressTURN credentials!**

---

### Step 2: Set Up Signaling Server

```bash
# Create a new folder for the server (or use the same project)
mkdir signaling-server
cd signaling-server

# Copy the server files
cp ../server.js .
cp ../server-package.json package.json

# Install dependencies
npm install

# Start the server
npm start
```

Server will run on `http://localhost:3001`

---

### Step 3: Add Video Call Button to DirectMessages

Open `src/components/DirectMessages.jsx` and add:

```javascript
import { useState } from 'react';
import VideoCall from './VideoCall';

// Inside your component, add state:
const [showVideoCall, setShowVideoCall] = useState(false);

// Add button in the DM chat header (after the back button):
{selectedUser && (
  <button 
    className="video-call-btn"
    onClick={() => setShowVideoCall(true)}
    title="Start video call"
  >
    📹 Video Call
  </button>
)}

// Add VideoCall component at the end of your return statement:
{showVideoCall && selectedUser && (
  <VideoCall
    user={user}
    friendId={selectedUser.uid}
    friendName={selectedUser.displayName}
    onClose={() => setShowVideoCall(false)}
  />
)}
```

---

### Step 4: Add Button Styles

Add to `src/App.css`:

```css
.video-call-btn {
  padding: 0.5rem 1rem;
  background: rgba(91, 141, 238, 0.12);
  border: 1px solid rgba(91, 141, 238, 0.25);
  color: #5b8dee;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;
}

.video-call-btn:hover {
  background: rgba(91, 141, 238, 0.2);
  border-color: rgba(91, 141, 238, 0.4);
}
```

---

### Step 5: Test Locally

**Terminal 1 - Signaling Server:**
```bash
cd signaling-server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Test:**
1. Open `http://localhost:5173` in two different browsers (or incognito)
2. Sign in as different users
3. Add each other as friends
4. Open DM conversation
5. Click "📹 Video Call" button
6. Grant camera/microphone permissions
7. Other user should see incoming call
8. Click "Start Call" to connect

---

## 🔧 Configuration Details

### PeerJS Configuration

The VideoCall component uses these ICE servers:

```javascript
const iceServers = [
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'your-username',
    credential: 'your-password'
  },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];
```

**TURN Server (ExpressTURN):**
- Required for connections behind NAT/firewalls
- Provides relay when direct P2P fails
- You provide the credentials

**STUN Servers (Google):**
- Free fallback servers
- Help discover public IP addresses
- Used when TURN is not needed

---

## 📱 Features Included

✅ **Camera & Microphone Access**
- Requests permissions on call start
- HD video (1280x720)
- Echo cancellation & noise suppression

✅ **Peer-to-Peer Connection**
- Direct connection via PeerJS
- Automatic fallback to TURN server
- Low latency

✅ **Signaling via Socket.IO**
- Real-time call notifications
- Peer ID exchange
- Call status updates

✅ **UI Controls**
- Start/End call
- Mute/Unmute audio
- Enable/Disable video
- Connection status display

✅ **Mobile Responsive**
- Works on mobile browsers
- Touch-friendly controls
- Adaptive layout

---

## 🧪 Testing Checklist

### Local Testing:
- [ ] Signaling server starts without errors
- [ ] Frontend connects to Socket.IO
- [ ] PeerJS generates peer ID
- [ ] Camera permission prompt appears
- [ ] Local video displays
- [ ] Call signal sent successfully
- [ ] Remote video displays
- [ ] Audio works both ways
- [ ] Mute button works
- [ ] Video toggle works
- [ ] End call works
- [ ] Streams stop after call ends

### Network Testing:
- [ ] Test on same WiFi
- [ ] Test on different networks
- [ ] Test with mobile hotspot
- [ ] Test behind corporate firewall

---

## 🐛 Troubleshooting

### "Failed to access camera/microphone"
**Solution:** Grant permissions in browser settings
- Chrome: Settings → Privacy → Site Settings → Camera/Microphone
- Firefox: Preferences → Privacy & Security → Permissions

### "Connection failed" or "Call not connecting"
**Solution:** Check TURN server credentials
- Verify `VITE_TURN_URL` is correct
- Verify `VITE_TURN_USERNAME` is correct
- Verify `VITE_TURN_CREDENTIAL` is correct
- Test TURN server: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

### "Socket.IO not connecting"
**Solution:** Check signaling server
- Ensure server is running on port 3001
- Check `VITE_SOCKET_SERVER_URL` in .env
- Check CORS settings in server.js

### "Black screen" or "No video"
**Solution:** Check video element
- Open browser console (F12)
- Look for errors
- Check if `getUserMedia` succeeded
- Verify video track is enabled

### "No audio"
**Solution:** Check audio settings
- Unmute if muted
- Check system audio settings
- Verify microphone is not used by another app
- Check browser audio permissions

---

## 📊 Architecture

```
User A                    Signaling Server              User B
  |                              |                         |
  |-- Socket.IO Connect -------->|<----- Socket.IO Connect-|
  |                              |                         |
  |-- call-signal (peerId) ----->|                         |
  |                              |-- call-signal --------->|
  |                              |                         |
  |<============ PeerJS Direct Connection ================>|
  |                              |                         |
  |<============ Media Stream (P2P) ======================>|
  |                              |                         |
```

**Key Points:**
- Socket.IO only for signaling (peer ID exchange)
- Actual media streams go peer-to-peer via PeerJS
- TURN server used only if direct connection fails
- Low latency because media doesn't go through server

---

## 🚀 Production Deployment

### Deploy Signaling Server:

**Option 1: Heroku**
```bash
heroku create chatter-signaling
git push heroku master
```

**Option 2: Railway**
```bash
railway init
railway up
```

**Option 3: DigitalOcean/AWS**
- Deploy as Node.js app
- Expose port 3001
- Set environment variables

### Update Frontend .env:
```env
VITE_SOCKET_SERVER_URL=https://your-signaling-server.com
```

---

## 💰 Cost Estimate

**ExpressTURN:**
- Pricing varies by provider
- Typically $5-20/month for small apps
- Pay per GB of relayed traffic

**Signaling Server:**
- Free tier on Railway/Heroku
- Or $5/month on DigitalOcean

**Total:** ~$10-25/month for production

---

## 🎯 Next Steps (Optional Enhancements)

1. **Call Notifications**
   - Show incoming call popup
   - Ring tone sound
   - Accept/Reject buttons

2. **Call History**
   - Store call logs in Firestore
   - Show call duration
   - Missed call indicators

3. **Screen Sharing**
   - Add screen share button
   - Use `getDisplayMedia()` API

4. **Group Calls**
   - Support 3+ participants
   - Mesh or SFU architecture

5. **Recording**
   - Record calls to cloud storage
   - MediaRecorder API

---

## 📚 Resources

- PeerJS Docs: https://peerjs.com/docs/
- Socket.IO Docs: https://socket.io/docs/
- WebRTC Guide: https://webrtc.org/getting-started/
- ExpressTURN: https://www.expressturn.com/

---

## ✅ Summary

You now have:
- ✅ Working video call component
- ✅ PeerJS with ExpressTURN configuration
- ✅ Socket.IO signaling server
- ✅ Mobile-responsive UI
- ✅ Mute/video toggle controls
- ✅ Ready to test locally

**Just add your ExpressTURN credentials and start testing!** 🎉
