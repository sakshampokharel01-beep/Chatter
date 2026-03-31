# ✅ Deployment Checklist

## Before You Start:
- [ ] Code pushed to GitHub ✅ (Already done!)
- [ ] Have Vercel account
- [ ] Have Render account (sign up with GitHub)

---

## Step 1: Vercel (Frontend)
- [ ] Go to https://vercel.com/dashboard
- [ ] Check if `Chatter` is deploying automatically
- [ ] Copy your Vercel URL: `https://chatter-xxx.vercel.app`

---

## Step 2: Render (Socket.IO Server)
- [ ] Go to https://render.com/
- [ ] Sign up with GitHub
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repo: `Chatter`
- [ ] Settings:
  - Name: `chatter-socket-server`
  - Start Command: `node server.js`
  - Instance Type: Free
- [ ] Add env var: `CLIENT_URL` = `*`
- [ ] Click "Create Web Service"
- [ ] Wait 2-3 minutes
- [ ] Copy Render URL: `https://chatter-socket-server.onrender.com`

---

## Step 3: Vercel Environment Variables
- [ ] Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Add: `VITE_SOCKET_SERVER_URL` = `https://chatter-socket-server.onrender.com`
- [ ] Add: `VITE_TURN_URL` = `turn:free.expressturn.com:3478`
- [ ] Add: `VITE_TURN_USERNAME` = `0000000020903232S7`
- [ ] Add: `VITE_TURN_CREDENTIAL` = `cDVIsOIcU+KPoCmHqqnQ2T8hmM0=`
- [ ] Go to Deployments → Redeploy

---

## Step 4: Firebase Rules
- [ ] Go to https://console.firebase.google.com/
- [ ] Select project: `chatapp-eb6e3`
- [ ] Firestore Database → Rules
- [ ] Copy content from `firestore.rules` file
- [ ] Paste into Firebase Console
- [ ] Click "Publish"

---

## Step 5: Test
- [ ] Open Vercel URL on computer
- [ ] Open Vercel URL on phone
- [ ] Sign in as different users
- [ ] Add as friends
- [ ] Start video call
- [ ] Video works! 🎉

---

## URLs to Save:
- **Frontend**: `https://chatter-xxx.vercel.app`
- **Socket.IO**: `https://chatter-socket-server.onrender.com`
- **Health Check**: `https://chatter-socket-server.onrender.com/health`

---

**Total Time: ~10 minutes**

Follow `DEPLOY_STEP_BY_STEP.md` for detailed instructions!
