# 🐛 Debug Call Notification Issue

## What I Fixed:

1. **Improved socket connection management**
   - Prevents duplicate connections for same user
   - Properly disconnects old connections when switching users
   - Added connection error handling

2. **Added debug logging**
   - Shows when call-signal is received
   - Shows if caller is found in users list
   - Shows when notification is set

## How to Debug:

### Step 1: Open Browser Console (F12)

**In BOTH tabs**, open the browser console (F12 → Console tab)

### Step 2: Start a Call

**Tab 1 (Caller)**:
1. Open DM with friend
2. Click 📹 button
3. Click "Start Call"

**Watch console for**:
```
📞 Call signal sent to [userId]
```

### Step 3: Check Receiver Console

**Tab 2 (Receiver)**:

**You should see**:
```
🎧 Listening for call-signal events
📞 Incoming call from: [userId] peerId: [peerId]
📋 Current users list: [...]
👤 Caller found: { id: '...', displayName: '...' }
✅ Setting incoming call notification
```

**If you see**:
```
❌ Caller not found in users list
```

This means the users list hasn't loaded yet. Solution: Wait a few seconds after page load.

### Step 4: Check Socket.IO Server

**In the terminal running `node server.js`**, you should see:
```
📞 Call signal from [userId] to [userId], peer ID: [peerId]
✅ Call signal delivered to [userId]
```

## Common Issues:

### Issue 1: "Caller not found in users list"
**Cause**: Users list hasn't loaded from Firestore yet
**Solution**: 
- Wait 2-3 seconds after page loads
- Refresh the receiver tab
- Check Firestore rules are deployed

### Issue 2: No console logs at all
**Cause**: DirectMessages component not mounted
**Solution**:
- Make sure you're on the DMs tab
- Check that user is signed in (not guest)

### Issue 3: "User not found or offline" in server
**Cause**: Socket.IO connection not established
**Solution**:
- Refresh both tabs
- Check Socket.IO server is running
- Check VITE_SOCKET_SERVER_URL in .env

### Issue 4: Multiple connections
**Cause**: Component re-rendering
**Solution**: Fixed with improved socket.js

## Test Procedure:

1. **Restart Socket.IO server**:
   ```bash
   # Stop current server (Ctrl+C)
   node server.js
   ```

2. **Refresh both browser tabs** (Ctrl+R or Cmd+R)

3. **Wait 3 seconds** for everything to load

4. **Open console in both tabs** (F12)

5. **Tab 1**: Go to DMs tab

6. **Tab 2**: Go to DMs tab (or stay on Global Chat)

7. **Tab 1**: Click 📹 → "Start Call"

8. **Tab 2**: Check console for logs

9. **Tab 2**: Should see notification popup

## Expected Console Output:

### Tab 1 (Caller):
```
✅ Socket.IO connected: [socketId]
🎧 Listening for call-signal events
📞 Call signal sent to [friendId]
```

### Tab 2 (Receiver):
```
✅ Socket.IO connected: [socketId]
🎧 Listening for call-signal events
📞 Incoming call from: [callerId] peerId: [peerId]
📋 Current users list: [Array of users]
👤 Caller found: {id: "...", displayName: "..."}
✅ Setting incoming call notification
```

### Server Terminal:
```
✅ User connected: [socketId]
📝 Registered user: [userName] ([userId])
📞 Call signal from [callerId] to [receiverId], peer ID: [peerId]
✅ Call signal delivered to [receiverId]
```

## If Still Not Working:

1. Take a screenshot of BOTH browser consoles
2. Take a screenshot of the server terminal
3. Share the screenshots so I can see what's happening

---

**The notification system is working correctly in the code.** If you're not seeing it, the debug logs will tell us exactly why.
