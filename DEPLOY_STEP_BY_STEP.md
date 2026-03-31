# 🚀 Deploy Chatter - Step by Step

## Part 1: Deploy Frontend to Vercel (Auto)

Your frontend should auto-deploy from GitHub to Vercel.

1. Check: https://vercel.com/dashboard
2. Find your project: `Chatter`
3. Wait for deployment to complete
4. Copy your URL: `https://chatter-xxx.vercel.app`

**If not auto-deploying:**
- Go to Vercel → Add New Project
- Import from GitHub: `sakshampokharel01-beep/Chatter`
- Click Deploy

---

## Part 2: Deploy Socket.IO Server to Render (2 minutes)

### Step 1: Sign Up to Render
1. Go to: https://render.com/
2. Click "Get Started"
3. Sign up with GitHub (1 click)

### Step 2: Create Web Service
1. Click "New +" button (top right)
2. Select "Web Service"

### Step 3: Connect Repository
1. Click "Connect account" to connect GitHub
2. Find and select: `sakshampokharel01-beep/Chatter`
3. Click "Connect"

### Step 4: Configure Service
Fill in these settings:

- **Name**: `chatter-socket-server` (or any name you like)
- **Region**: Choose closest to you
- **Branch**: `master`
- **Root Directory**: Leave empty
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Instance Type**: `Free`

### Step 5: Add Environment Variable
1. Scroll down to "Environment Variables"
2. Click "Add Environment Variable"
3. Add:
   - **Key**: `CLIENT_URL`
   - **Value**: `*` (allows all origins)

### Step 6: Deploy
1. Click "Create Web Service" button at bottom
2. Wait 2-3 minutes for deployment
3. You'll see logs showing deployment progress
4. When done, you'll see: "Your service is live 🎉"

### Step 7: Copy Your Server URL
At the top of the page, you'll see your URL:
```
https://chatter-socket-server.onrender.com
```
**Copy this URL!** You'll need it in the next step.

---

## Part 3: Update Vercel Environment Variables

### Step 1: Go to Vercel Settings
1. Go to: https://vercel.com/dashboard
2. Click on your `Chatter` project
3. Click "Settings" tab
4. Click "Environment Variables" in left sidebar

### Step 2: Add Environment Variables
Add these 3 variables (click "Add" for each):

**Variable 1:**
- **Key**: `VITE_SOCKET_SERVER_URL`
- **Value**: `https://chatter-socket-server.onrender.com` (your Render URL)
- **Environment**: Production, Preview, Development (select all)

**Variable 2:**
- **Key**: `VITE_TURN_URL`
- **Value**: `turn:free.expressturn.com:3478`
- **Environment**: Production, Preview, Development (select all)

**Variable 3:**
- **Key**: `VITE_TURN_USERNAME`
- **Value**: `0000000020903232S7`
- **Environment**: Production, Preview, Development (select all)

**Variable 4:**
- **Key**: `VITE_TURN_CREDENTIAL`
- **Value**: `cDVIsOIcU+KPoCmHqqnQ2T8hmM0=`
- **Environment**: Production, Preview, Development (select all)

### Step 3: Redeploy
1. Go to "Deployments" tab
2. Find the latest deployment
3. Click "..." (three dots) on the right
4. Click "Redeploy"
5. Wait 1-2 minutes

---

## Part 4: Deploy Firestore Rules

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Click on your project: `chatapp-eb6e3`

### Step 2: Go to Firestore Rules
1. Click "Firestore Database" in left sidebar
2. Click "Rules" tab at the top

### Step 3: Update Rules
1. You'll see a code editor
2. Select ALL the text (Ctrl+A or Cmd+A)
3. Delete it
4. Open your `firestore.rules` file in VS Code
5. Copy ALL the content
6. Paste into Firebase Console editor

### Step 4: Publish
1. Click "Publish" button (top right)
2. Wait for confirmation: "Rules published successfully"

---

## Part 5: Test Your Deployment! 🎉

### Test on Two Devices:

**Device 1 (Computer):**
1. Open: `https://chatter-xxx.vercel.app` (your Vercel URL)
2. Sign in with Google or Email
3. Go to DMs tab

**Device 2 (Phone):**
1. Open: `https://chatter-xxx.vercel.app` (same URL)
2. Sign in with different account
3. Go to DMs tab

**Add as Friends:**
1. Device 2: Go to "All Users" tab
2. Click "+" button next to Device 1's user
3. Device 1: Go to "Requests" tab
4. Click "✓" to accept

**Start Video Call:**
1. Device 1: Open DM with Device 2
2. Click 📹 button
3. Click "Start Call"
4. Device 2: Should see notification popup
5. Click "✓ Accept"
6. Both devices: Allow camera/microphone
7. You should see each other! 🎥

---

## 🔍 Verify Everything is Working

### Check Frontend:
- Visit: `https://chatter-xxx.vercel.app`
- Should see landing page ✅
- Sign in should work ✅
- Chat should work ✅

### Check Socket.IO Server:
- Visit: `https://chatter-socket-server.onrender.com/health`
- Should see: `{"status":"ok","connectedUsers":0}` ✅

### Check Video Calling:
- Make a call between two devices
- Notification should appear ✅
- Video should connect ✅

---

## 🐛 Troubleshooting

### "User offline" error:
- Render free tier sleeps after 15 minutes of inactivity
- First call might take 30 seconds to wake up
- Try again after 30 seconds

### Video not connecting:
- Check browser console for errors (F12)
- Make sure both users allowed camera/microphone
- Try refreshing both devices

### No notification appearing:
- Check Socket.IO server is running (visit /health endpoint)
- Check Vercel environment variables are set correctly
- Try refreshing the page

---

## 🎉 You're Done!

Your video calling app is now live at:
- **Frontend**: `https://chatter-xxx.vercel.app`
- **Socket.IO Server**: `https://chatter-socket-server.onrender.com`

Share the link with friends and start video chatting! 📹
