# Deploy Firebase Storage Rules

## Overview
This guide explains how to deploy Firebase Storage security rules for file uploads and voice messages.

## Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged in to Firebase (`firebase login`)
- Firebase project initialized

## Steps to Deploy

### 1. Deploy Storage Rules

```bash
firebase deploy --only storage
```

### 2. Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Storage** → **Rules**
4. Verify the rules are deployed correctly

### 3. Test File Upload

1. Open your app
2. Go to Direct Messages
3. Select a friend
4. Click the attachment icon (📎)
5. Upload a test file
6. Verify it uploads successfully

### 4. Test Voice Message

1. In Direct Messages with a friend
2. Click the microphone icon (🎤)
3. Record a short voice message
4. Click stop to send
5. Verify the voice message appears and plays

## Storage Structure

```
/dms/{dmId}/files/{userId}/{fileName}  - Regular file uploads
/dms/{dmId}/voice/{userId}/{fileName}  - Voice messages
/profiles/{userId}/avatar              - Profile pictures
```

## Security Features

✅ Only DM participants can upload/view files
✅ File size limits: 10MB for files, 5MB for voice
✅ Only owner can delete within 1 hour
✅ Allowed file types validated
✅ Profile pictures limited to 2MB

## Troubleshooting

### Permission Denied Error
- Ensure Firestore rules are deployed (`firebase deploy --only firestore`)
- Verify user is authenticated
- Check that user is a participant in the DM

### Upload Fails
- Check file size (max 10MB for files, 5MB for voice)
- Verify file type is allowed
- Check browser console for errors

### Voice Recording Not Working
- Grant microphone permission in browser
- Check browser compatibility (Chrome, Firefox, Edge recommended)
- Ensure HTTPS connection (required for microphone access)

## File Type Support

### Images
- JPEG, PNG, GIF, WebP

### Audio
- MP3, WAV, OGG, WebM, MP4

### Video
- MP4, WebM, OGG

### Documents
- PDF, DOC, DOCX, XLS, XLSX, TXT

## Cost Considerations

Firebase Storage pricing:
- Storage: $0.026/GB/month
- Download: $0.12/GB
- Upload: Free

Typical usage:
- 1000 images (2MB each) = 2GB = ~$0.05/month
- 1000 voice messages (100KB each) = 100MB = ~$0.003/month

## Next Steps

1. Deploy the rules: `firebase deploy --only storage`
2. Test file uploads in your app
3. Monitor usage in Firebase Console
4. Set up Storage quotas if needed

## Support

If you encounter issues:
1. Check Firebase Console logs
2. Verify authentication is working
3. Test with different file types/sizes
4. Check browser console for errors
