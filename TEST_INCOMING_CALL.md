# 📞 Test Incoming Call Notification

## ✅ What's New:
- Incoming call notification popup (top-right corner)
- Accept/Decline buttons
- Animated notification with ringing icon
- Auto-opens video call when accepted

## 🧪 How to Test:

### Setup (2 browsers):
1. **Browser 1**: Sign in as User A
2. **Browser 2**: Sign in as User B
3. Make sure they're friends
4. **Browser 2**: Stay on any tab (Global Chat, DMs, anywhere)

### Test Incoming Call:
1. **Browser 1**: Open DM with User B
2. **Browser 1**: Click 📹 button
3. **Browser 1**: Click "Start Call"
4. **Browser 2**: Should see notification popup in top-right:
   ```
   📞 [User A name]
   Incoming video call...
   [✓ Accept] [✕ Decline]
   ```

### Test Accept:
1. **Browser 2**: Click "✓ Accept"
2. Should open video call automatically
3. Both users should see each other's video

### Test Decline:
1. **Browser 2**: Click "✕ Decline"
2. Notification disappears
3. Call is rejected

## 🎯 Features:

### Notification:
- ✅ Appears anywhere in the app (not just in DMs)
- ✅ Shows caller's name
- ✅ Animated ringing icon (pulses)
- ✅ Slides in from right
- ✅ Mobile responsive

### Accept Button:
- Opens the DM conversation
- Starts video call automatically
- Connects to caller's peer

### Decline Button:
- Dismisses notification
- Doesn't open video call

## 🔍 Console Logs:

### Caller (Browser 1):
```
📞 Call signal sent to [userId]
```

### Receiver (Browser 2):
```
📞 Incoming call from: [userId]
```

### Socket.IO Server:
```
📞 Call signal from [userId] to [userId], peer ID: xxx
✅ Call signal delivered to [userId]
```

## 📱 Mobile:
- Notification is full-width on mobile
- Buttons stack vertically
- Easy to tap

## 🐛 Troubleshooting:

### No notification appears:
- Check both users are signed in
- Check Socket.IO server is running (port 3001)
- Check browser console for errors
- Make sure users are friends

### Notification appears but Accept doesn't work:
- Check that the caller is in the friends list
- Refresh both browsers
- Check console for errors

### Multiple notifications:
- This is normal if caller clicks "Start Call" multiple times
- Each notification is independent

---

**Test it now!** Open two browsers and try calling between users.
