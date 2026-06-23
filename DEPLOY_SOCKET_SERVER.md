# 🚀 Deploy Socket.IO Server to Production

**Simple 10-Minute Guide for Render (FREE)**

---

## 📋 Prerequisites

- [x] GitHub repository: https://github.com/sakshampokharel01-beep/Chatter
- [x] Vercel deployment: https://chatter-talk.vercel.app
- [ ] Render account (create at render.com)

---

## 🎯 Step-by-Step Deployment (Render)

### Step 1: Create Render Account
1. Go to https://render.com
2. Click "Get Started"
3. Sign up with GitHub (easiest option)
4. Authorize Render to access your repositories

### Step 2: Create New Web Service
1. Click "New +" button (top right)
2. Select "Web Service"
3. Click "Connect account" to connect GitHub
4. Find and select your repository: `Chatter`

### Step 3: Configure Service

**Basic Settings:**
```
Name: chatter-socket-server
Region: Choose closest to you (e.g., Oregon, Frankfurt)
Branch: master (or main)
Root Directory: (leave blank)
```

**Build & Deploy:**
```
Runtime: Node
Build Command: npm install
Start Command: node server.js
```

### Step 4: Add Environment Variable

Click "Add Environment Variable":
```
Key: CLIENT_URL
Value: https://chatter-talk.vercel.app
```

**Important:** No trailing slash!

### Step 5: Choose Plan

Select **Free** plan:
- ✅ 0.1 CPU
- ✅ 512 MB RAM  
- ✅ Automatic SSL
- ⚠️ Spins down after 15 min of inactivity (acceptable for small apps)

### Step 6: Deploy!

1. Click "Create Web Service"
2. Wait 3-5 minutes for deployment
3. Watch the logs - should see:
   ```
   ==> Starting service...
   ==> Installing dependencies...
   ==> Running: node server.js
   🚀 Socket.IO signaling server running on port 10000
   ```

### Step 7: Copy Your Server URL

Render will give you a URL like:
```
https://chatter-socket-server.onrender.com
```

**Important:** Save this URL - you'll need it next!

---

## 🔧 Update Vercel Environment Variables

### Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Select your project: `Chatter` (or whatever it's named)
3. Click "Settings" tab

### Step 2: Update Environment Variables
1. Click "Environment Variables" in left sidebar
2. Find `VITE_SOCKET_SERVER_URL` (or add it if missing)

**Edit/Add:**
```
Name: VITE_SOCKET_SERVER_URL
Value: https://chatter-socket-server.onrender.com
Environment: Production, Preview, Development (select all)
```

3. Click "Save"

### Step 3: Redeploy
1. Go to "Deployments" tab
2. Click "..." menu on latest deployment
3. Click "Redeploy"
4. Wait 1-2 minutes

---

## ✅ Verify Deployment

### Test 1: Check Render Server Health

Visit in browser:
```
https://chatter-socket-server.onrender.com/health
```

Should show:
```json
{
  "status": "ok",
  "connectedUsers": 0,
  "timestamp": "2026-06-23T..."
}
```

### Test 2: Test Production Video Call

1. Open your production site: https://chatter-talk.vercel.app
2. Login with two different accounts (two browser windows)
3. Add each other as friends
4. Try a video call
5. Should connect within 3-5 seconds

### Test 3: Check Browser Console

Open DevTools (F12) and look for:
```javascript
Socket.IO connected to wss://chatter-socket-server.onrender.com
```

**No errors = SUCCESS! 🎉**

---

## 🐛 Troubleshooting

### Issue: "CORS Error" in Browser Console

**Cause:** Render URL not in allowed origins

**Fix:** Update `server.js`:
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://chatter-talk.vercel.app',
  'https://chatter-socket-server.onrender.com', // Add this
  process.env.CLIENT_URL
].filter(Boolean);
```

Commit and push - Render will auto-deploy.

---

### Issue: "Connection Timeout"

**Cause:** Render free tier server sleeping

**Fix:** This is normal behavior:
- Free tier spins down after 15 min of inactivity
- First connection after sleep takes 30-60 seconds
- Subsequent connections are instant

**Solution:** Upgrade to paid plan ($7/month) for 24/7 uptime
Or accept the delay (users can retry after 30 seconds)

---

### Issue: Video Call Doesn't Connect

**Check:**
1. Render deployment logs show no errors
2. Vercel environment variables saved correctly
3. Vercel app redeployed after changing variables
4. Browser console shows connection to correct URL

**Debug:**
```bash
# Open browser console on production site
# Run:
console.log(import.meta.env.VITE_SOCKET_SERVER_URL)

# Should show:
# https://chatter-socket-server.onrender.com
```

---

### Issue: "App crashed" on Render

**Cause:** Missing dependencies or wrong start command

**Fix:**
1. Check Render logs for specific error
2. Verify `package.json` has all dependencies:
   ```json
   "dependencies": {
     "socket.io": "^4.8.3",
     "express": "^5.2.1",
     "cors": "^2.8.6"
   }
   ```
3. Verify start command is: `node server.js`

---

## 💰 Cost Comparison

### Render (Recommended)
- **Free Tier:** ✅ Works for small apps
  - Spins down after 15 min inactivity
  - 512 MB RAM
  - Automatic SSL
  
- **Starter ($7/month):** Better for production
  - Always on
  - 512 MB RAM
  - Faster cold starts

### Railway
- **Free Tier:** $5 credit/month
  - Usually enough for small apps
  - Better uptime than Render free
  
- **Paid:** Pay as you go
  - $0.000463/GB-s
  - Typically $5-10/month for small apps

### Heroku
- **No Free Tier** (as of 2022)
- **Basic:** $5-7/month
- More expensive but very reliable

**Recommendation:** Start with Render free, upgrade to paid if you get users.

---

## 📊 Monitor Your Deployment

### Render Dashboard
1. Go to https://dashboard.render.com
2. Click your service: `chatter-socket-server`
3. Monitor:
   - **Metrics:** CPU, Memory usage
   - **Logs:** Real-time server logs
   - **Events:** Deployments, restarts

### Look For These Logs (Good):
```
✅ User connected: abc123
📝 Registered user: John (uid-xxx)
📞 Call signal from uid-1 to uid-2
✅ Call signal delivered
```

### Look For These Logs (Bad):
```
❌ Invalid userId
❌ User not found
Connection error
CORS error
```

---

## 🔄 Auto-Deploy Setup

Render automatically redeploys when you push to GitHub:

1. Make changes to `server.js`
2. Commit and push to GitHub:
   ```bash
   git add server.js
   git commit -m "Update socket server"
   git push origin master
   ```
3. Render detects push and redeploys (2-3 minutes)
4. No manual intervention needed!

---

## 🎉 Success Checklist

- [ ] Render account created
- [ ] Web service deployed
- [ ] Environment variable `CLIENT_URL` set
- [ ] Deployment successful (logs show no errors)
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Vercel environment variable updated
- [ ] Vercel app redeployed
- [ ] Test video call connects
- [ ] No CORS errors in browser console
- [ ] Typing indicators work
- [ ] Call controls work (mute, video off)

**All checked? YOU'RE DONE! 🚀**

---

## 📱 Mobile Testing

After deployment, test on mobile:

1. Open `https://chatter-talk.vercel.app` on phone
2. Login and add friend
3. Try video call
4. Should work exactly like desktop

**Note:** Some mobile networks block WebRTC - test on WiFi first.

---

## 🔐 Security Notes

### Already Configured:
- ✅ CORS restricted to your domain
- ✅ Input validation on all socket events
- ✅ User authentication required
- ✅ Rate limiting via Firebase
- ✅ Automatic HTTPS via Render

### Optional Enhancements:
- Add rate limiting on socket connections
- Add IP blacklist for abuse
- Add logging/monitoring service (Sentry, LogRocket)

---

## 📚 Useful Commands

### Check Render Logs:
```bash
# From Render dashboard
# Click your service → Logs tab
# Or use Render CLI (if installed):
render logs -t chatter-socket-server
```

### Test Health Endpoint:
```bash
curl https://chatter-socket-server.onrender.com/health
```

### Force Redeploy:
```bash
# From Render dashboard
# Click "Manual Deploy" → "Deploy latest commit"
```

---

## 🆘 Still Need Help?

### Resources:
- **Render Docs:** https://render.com/docs/web-services
- **Socket.IO Docs:** https://socket.io/docs/v4/
- **GitHub Issues:** Open issue on your repo

### Quick Debug:
1. Check Render logs for errors
2. Verify Vercel environment variables
3. Test health endpoint
4. Check browser console
5. Try incognito mode

---

## 🎯 Next Steps After Deployment

1. **Monitor Usage:**
   - Check Render metrics daily
   - Watch for errors in logs
   - Monitor bandwidth usage

2. **Get Feedback:**
   - Test with real users
   - Fix any reported issues
   - Improve based on feedback

3. **Consider Upgrade:**
   - If >100 concurrent users
   - If 15-min spin-down is annoying
   - Upgrade to Render Starter ($7/month)

---

**🎉 THAT'S IT!**

Video calls will now work on your production site. The entire deployment takes ~10 minutes.

**Remember:** Render free tier spins down after 15 min. First connection might take 30 seconds to wake up the server. This is normal and acceptable for small apps.

---

**Last Updated:** June 23, 2026  
**Deployment Time:** ~10 minutes  
**Cost:** FREE (Render free tier)
