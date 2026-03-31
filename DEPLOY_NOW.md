# 🚀 Deploy Chatter - Complete Guide

## ✅ Code Pushed to GitHub!

Your code is now at: https://github.com/sakshampokharel01-beep/Chatter.git

## 📋 Deployment Steps

### Step 1: Deploy Frontend to Vercel

Your frontend should auto-deploy if connected to Vercel. If not:

1. Go to: https://vercel.com/
2. Click "Add New Project"
3. Import from GitHub: `sakshampokharel01-beep/Chatter`
4. Click "Deploy"

**Vercel will automatically:**
- Build your app (`npm run build`)
- Deploy to production
- Give you a URL like: `https://chatter-xxx.vercel.app`

### Step 2: Deploy Socket.IO Server

You need to deploy the signaling server (`server.js`) separately.

#### Option A: Deploy to Render (Recommended - Free)

1. Go to: https://render.com/
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repo: `Chatter`
5. Configure:
   - **Name**: `chatter-signaling-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install express socket.io cors`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
6. Add Environment Variable:
   - **Key**: `CLIENT_URL`
   - **Value**: `https://your-vercel-url.vercel.app` (your Vercel URL)
7. Click "Create Web Service"

**Wait 2-3 minutes for deployment**

You'll get a URL like: `https://chatter-signaling-server.onrender.com`

#### Option B: Deploy to Railway (Alternative)

1. Go to: https://railway.app/
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `Chatter` repo
5. Add these settings:
   - **Start Command**: `node server.js`
   - **Environment Variable**: `CLIENT_URL` = your Vercel URL
6. Deploy

### Step 3: Update Environment Variables

Once both are deployed, update your Vercel environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:

```
VITE_SOCKET_SERVER_URL=https://your-render-url.onrender.com
VITE_TURN_URL=turn:free.expressturn.com:3478
VITE_TURN_USERNAME=0000000020903232S7
VITE_TURN_CREDENTIAL=cDVIsOIcU+KPoCmHqqnQ2T8hmM0=
```

3. Click "Save"
4. Go to "Deployments" tab
5. Click "..." on latest deployment → "Redeploy"

### Step 4: Deploy Firestore Rules

1. Go to: https://console.firebase.google.com/
2. Select project: `chatapp-eb6e3`
3. Click "Firestore Database" → "Rules" tab
4. Copy ALL content from `firestore.rules` file
5. Paste into Firebase Console editor
6. Click "Publish"

### Step 5: Test on Production

1. Open your Vercel URL on your computer
2. Open your Vercel URL on your phone
3. Sign in as different users on each device
4. Add each other as friends
5. Start a video call
6. Full video + audio should work! 🎉

## 🔍 Verify Deployment

### Check Frontend:
- Visit your Vercel URL
- Should see landing page
- Sign in should work
- Chat should work

### Check Socket.IO Server:
- Visit: `https://your-render-url.onrender.com/health`
- Should see: `{"status":"ok","connectedUsers":0}`

### Check Video Calling:
- Open on two devices
- Make a call
- Should see notification
- Should connect with video

## 🐛 Troubleshooting

### Frontend not deploying:
- Check Vercel build logs
- Make sure all dependencies are in `package.json`

### Socket.IO server not working:
- Check Render logs
- Make sure `CLIENT_URL` is set correctly
- Make sure server is running (check health endpoint)

### Video call not connecting:
- Check browser console for errors
- Make sure `VITE_SOCKET_SERVER_URL` is correct
- Make sure ExpressTURN credentials are correct
- Try refreshing both devices

### "User offline" error:
- Socket.IO server might be sleeping (Render free tier)
- Wait 30 seconds and try again
- Or upgrade to paid tier for always-on

## 📱 Production URLs

After deployment, you'll have:

- **Frontend**: `https://chatter-xxx.vercel.app`
- **Socket.IO Server**: `https://chatter-signaling-server.onrender.com`
- **Health Check**: `https://chatter-signaling-server.onrender.com/health`

## 🎉 You're Done!

Your video calling app is now live and ready to use on any device!

Test it with friends on different devices for the full experience.

---

**Need help?** Check the logs:
- Vercel: Dashboard → Deployments → View Function Logs
- Render: Dashboard → Your Service → Logs
