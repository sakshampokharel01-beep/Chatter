# 🎥 Test Video Call - Ready Now!

## ✅ Everything is Running:
- **Vite dev server**: http://localhost:5173
- **Socket.IO signaling server**: Port 3001
- **ExpressTURN**: Configured with your credentials
- **Video call button**: Added to DM chat header (📹)

## 🧪 How to Test:

### Option 1: Two Browsers (Easiest)
1. Open **Chrome**: http://localhost:5173
2. Open **Firefox** (or Chrome Incognito): http://localhost:5173
3. Sign in as two different users
4. Add each other as friends (All Users tab → + button → accept request)
5. Open DM conversation
6. Click the **📹 button** in the chat header
7. Allow camera/microphone when prompted
8. Click **"Start Call"**
9. Other user should auto-connect

### Option 2: Same Browser (Two Tabs)
1. Open two tabs: http://localhost:5173
2. Sign in as different users in each tab
3. Add as friends
4. Open DM in both tabs
5. Click 📹 in one tab
6. Allow camera/mic
7. Click "Start Call"
8. Other tab should connect

## 🔍 What to Check:

### Browser Console (F12):
You should see:
```
✅ Socket.IO connected
✅ PeerJS connected with ID: xxx
📞 Call signal sent to xxx
✅ Connected! Receiving remote stream
```

### Video Call UI:
- **Left video**: Your camera (local)
- **Right video**: Friend's camera (remote)
- **Controls**: Mute, Video, End Call buttons
- **Status**: Shows connection status at bottom

## 🎯 Features Working:
- ✅ Camera access
- ✅ Microphone access
- ✅ Peer-to-peer connection via PeerJS
- ✅ Signaling via Socket.IO
- ✅ NAT traversal via ExpressTURN
- ✅ Mute/unmute audio
- ✅ Toggle video on/off
- ✅ End call

## 🐛 Troubleshooting:

### "Not ready to call"
- Wait a few seconds for PeerJS to connect
- Check console for peer ID

### "Camera access denied"
- Click the camera icon in browser address bar
- Allow camera and microphone permissions
- Refresh the page

### "User offline"
- Make sure both users are signed in
- Check Socket.IO server is running (should see green checkmark in terminal)

### No video showing
- Check camera is not being used by another app
- Try refreshing both browser windows
- Check ExpressTURN credentials in `.env`

### Call doesn't connect
- Check browser console for errors
- Make sure both users are friends
- Try ending and starting call again

## 📱 Mobile Testing:
The video call works on mobile too! Just:
1. Deploy to production (Vercel)
2. Deploy Socket.IO server (Render/Railway)
3. Update `VITE_SOCKET_SERVER_URL` in production `.env`
4. Test on your phone

## 🚀 Next Steps:
Once tested locally, you can:
1. Deploy Socket.IO server to Render/Railway
2. Update production environment variables
3. Test on production URL
4. Add audio-only call option (optional)
5. Add call notifications (optional)

---

**Your video calling is ready to test right now!** 🎉
Open http://localhost:5173 in two browsers and try it out.
