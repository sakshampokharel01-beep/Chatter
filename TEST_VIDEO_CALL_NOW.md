# 🎬 TEST VIDEO CALLS NOW - Quick Guide

**Both servers are RUNNING! You can test video calls immediately.**

---

## ✅ Server Status

### Socket.IO Server (Port 3001)
```
Status: ✅ RUNNING
PID: 1172
URL: http://localhost:3001
```

### Vite Dev Server (Port 5173)
```
Status: ✅ RUNNING  
PID: 13160
URL: http://localhost:5173
```

---

## 🚀 QUICK TEST (5 Minutes)

### Step 1: Open Two Browser Windows
1. **Window 1:** Open `http://localhost:5173` in Chrome/Edge
2. **Window 2:** Open `http://localhost:5173` in Chrome Incognito (or another browser)

### Step 2: Login with Different Accounts
**Window 1:**
- Click "Get Started"
- Choose any login method (Google, Email, or Guest)
- Login as User A

**Window 2:**
- Click "Get Started"  
- Login with a DIFFERENT account
- Login as User B

### Step 3: Add Each Other as Friends
**Window 1 (User A):**
1. Click search icon (🔍) in top right
2. Search for User B by name/email
3. Click "Add Friend" button
4. Wait for confirmation

**Window 2 (User B):**
1. You'll see friend request notification
2. Click "Accept" button
3. Now you're friends!

### Step 4: Start Video Call
**Either Window:**
1. Click "Private Messages" in sidebar
2. Click on your friend's name
3. Look for video camera icon (📹) in DM header
4. Click the video camera icon

### Step 5: Grant Permissions
**Both Windows:**
- Browser will ask for camera/microphone permissions
- Click "Allow"
- Wait 2-3 seconds for connection

### Step 6: Verify It Works ✅
**You should see:**
- ✅ Your video in small window (bottom left)
- ✅ Friend's video in large window
- ✅ Mute button works (🎤)
- ✅ Video toggle works (📹)
- ✅ End call button works (❌)

---

## 🎯 Expected Results

### Call Initiation:
```
Window 1: Clicks video icon → Shows "Calling..."
Window 2: Sees incoming call → Auto-accepts
Both: Video connects within 3 seconds
```

### During Call:
- ✅ Both users see each other's video
- ✅ Audio is clear (no echo if using headphones)
- ✅ Mute button changes icon
- ✅ Video toggle shows "camera off" when disabled
- ✅ Remote user sees status changes

### Call End:
- ✅ Either user can end call
- ✅ Both users return to DM chat
- ✅ Camera/mic are released

---

## 🐛 Common Issues & Quick Fixes

### Issue: "Calling..." Never Connects
**Fix:**
```bash
# Check if Socket.IO server is still running
netstat -ano | findstr :3001

# If not running, restart it:
node server.js
```

### Issue: Camera/Mic Permission Denied
**Fix:**
1. Click lock icon in address bar
2. Reset permissions
3. Refresh page
4. Click video icon again

### Issue: Can't Find Friend in Search
**Fix:**
- Make sure both users are logged in
- Check spelling of name/email
- Try searching by exact email address
- Refresh the page

### Issue: Video Shows Black Screen
**Fix:**
1. Check if camera is being used by another app (Zoom, Teams)
2. Close other apps using camera
3. Refresh browser
4. Try different browser

### Issue: No Audio
**Fix:**
1. Check system volume
2. Check browser tab isn't muted (right-click tab)
3. Test microphone in browser settings
4. Use headphones to prevent echo

---

## 🧪 Advanced Testing

### Test Audio-Only Call:
1. Modify `DirectMessages.jsx` to pass `audioOnly={true}`
2. Or just turn off camera during video call

### Test With Mobile:
1. Find your computer's local IP:
   ```bash
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   ```
2. On mobile browser: `http://192.168.1.100:5173`
3. Login and test call

### Test Typing Indicators:
1. While in DM chat (before calling)
2. Start typing in message box
3. Other user should see "... is typing" indicator
4. This confirms Socket.IO is working

---

## 📊 What to Look For in Console

### Browser Console (F12):
**Good Signs:**
```javascript
Socket.IO connected
PeerJS: Peer ID: abc123xyz
Call signal sent
Remote stream received
MediaStream { active: true, id: "..." }
```

**Bad Signs:**
```javascript
Socket.IO connection error
PeerJS: Error - Connection failed
getUserMedia error
```

### Socket.IO Server Terminal:
**Good Signs:**
```
✅ User connected: xyz
📝 Registered user: John (uid-123)
📞 Call signal from uid-123 to uid-456
✅ Call signal delivered
```

**Bad Signs:**
```
❌ Invalid userId
❌ User uid-456 not found or offline
Connection error
```

---

## 🎉 SUCCESS CHECKLIST

Test these features:

- [ ] Login with two different accounts
- [ ] Send and accept friend request
- [ ] Open DM conversation
- [ ] Click video call button
- [ ] Both users see each other's video
- [ ] Test mute button
- [ ] Test video off button
- [ ] Verify remote status indicators work
- [ ] Test end call button
- [ ] Test typing indicators in DM
- [ ] Test typing indicators in global chat

If all checked ✅ - **VIDEO CALLS ARE WORKING!**

---

## 💡 Pro Tips

1. **Use Headphones:** Prevents echo and feedback
2. **Good Lighting:** Position yourself in front of a window or lamp
3. **Stable Connection:** WiFi should be strong for both users
4. **Close Other Apps:** Free up bandwidth and CPU
5. **Update Browser:** Use latest Chrome/Edge for best WebRTC support

---

## 🌐 Production Deployment Reminder

**IMPORTANT:** 
This is working on localhost only. To make it work on your deployed site (`https://chatter-talk.vercel.app`), you MUST:

1. Deploy Socket.IO server to Render/Railway/Heroku
2. Update `VITE_SOCKET_SERVER_URL` in Vercel environment variables
3. Redeploy your Vercel app

See `VIDEO_CALL_FIX_COMPLETE.md` for full deployment instructions.

---

## 🆘 Need Help?

### Debug Checklist:
1. ✅ Socket.IO server running? `netstat -ano | findstr :3001`
2. ✅ Vite dev server running? `netstat -ano | findstr :5173`
3. ✅ Both users logged in?
4. ✅ Both users are friends?
5. ✅ Camera/mic permissions granted?
6. ✅ No other app using camera?
7. ✅ Browser console shows errors?

### Still Not Working?
- Check `VIDEO_CALL_FIX_COMPLETE.md` for detailed troubleshooting
- Verify `.env` has correct Socket URL
- Restart both servers
- Clear browser cache
- Try incognito/private mode

---

**🎥 EVERYTHING IS READY - START TESTING NOW!**

Open two browser windows and follow the steps above. Video calls should work immediately.

---

**Last Updated:** June 23, 2026
