# Vercel Blob Storage Setup

## Get Your Blob Token

I can see you already created a blob store called `chatter-app-blob`. Now you need to get the token:

### Step 1: Get the Read/Write Token

1. In your Vercel dashboard, go to **Storage** → **chatter-app-blob**
2. Click on the **".env.local"** tab at the top
3. You'll see something like:
   ```
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxx"
   ```
4. Copy that token value

### Step 2: Add Token to Your Project

1. Open your `.env` file (or create `.env.local` if it doesn't exist)
2. Add this line:
   ```
   VITE_BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxx
   ```
   (Replace with your actual token)

### Step 3: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test File Upload

1. Open your app
2. Go to Direct Messages
3. Select a friend
4. Click the 📎 (paperclip) button
5. Upload a test image
6. It should upload successfully!

### Step 5: Test Voice Message

1. Click the 🎤 (microphone) button
2. Allow microphone access
3. Record a short message
4. Click stop
5. Voice message should send!

## Vercel Blob Free Tier

- **1 GB storage** (free on Hobby plan)
- **100 GB bandwidth/month** (free)
- **Perfect for chat apps!**

## Troubleshooting

### "Storage not configured" Error
- Make sure you added `VITE_BLOB_READ_WRITE_TOKEN` to your `.env` file
- Restart your dev server after adding the token

### Token Not Working
- Make sure you copied the full token including `vercel_blob_rw_` prefix
- Check there are no extra spaces or quotes
- Token should look like: `vercel_blob_rw_XXXXXXXXXX_YYYYYYYYYY`

### Upload Fails
- Check browser console (F12) for detailed errors
- Verify you're signed in and friends with the person
- Make sure file size is under 10MB (5MB for voice)

## Production Deployment

When deploying to Vercel:

1. Go to your project settings on Vercel
2. Navigate to **Environment Variables**
3. Add `VITE_BLOB_READ_WRITE_TOKEN` with your token
4. Redeploy your app

The token will automatically work in production!

## Security Note

- Never commit `.env` or `.env.local` to git (they're in .gitignore)
- The token allows read/write access to your blob storage
- Keep it secret!
