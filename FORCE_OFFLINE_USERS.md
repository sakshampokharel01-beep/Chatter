# Force Users Offline - Manual Fix

If users are stuck showing as "Online" even after they've left, you can manually set them offline using the Firebase Console.

## Option 1: Using Firebase Console (Recommended)

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to Firestore Database
4. Navigate to the `users` collection
5. Find the user who is stuck as "online"
6. Edit the document:
   - Set `online` to `false`
   - Update `lastSeen` to current timestamp
7. Save the changes

## Option 2: Using Browser Console (Quick Fix)

If you're an admin, you can run this in the browser console on your site:

```javascript
// Import Firestore functions
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Set a specific user offline
async function setUserOffline(userId) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      online: false,
      lastSeen: serverTimestamp()
    });
    console.log(`User ${userId} set to offline`);
  } catch (err) {
    console.error('Failed to set user offline:', err);
  }
}

// Usage:
// setUserOffline('USER_ID_HERE');
```

## Option 3: Bulk Fix All Stale Users

Create a Cloud Function or run this script to fix all users with stale online status:

```javascript
const admin = require('firebase-admin');
admin.initializeApp();

async function fixStaleOnlineUsers() {
  const db = admin.firestore();
  const usersRef = db.collection('users');
  
  // Get all users marked as online
  const snapshot = await usersRef.where('online', '==', true).get();
  
  const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
  const batch = db.batch();
  let count = 0;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const lastSeen = data.lastSeen?.toMillis() || 0;
    
    // If lastSeen is older than 2 minutes, set offline
    if (lastSeen < twoMinutesAgo) {
      batch.update(doc.ref, {
        online: false,
        lastSeen: admin.firestore.FieldValue.serverTimestamp()
      });
      count++;
      console.log(`Marking ${doc.id} as offline (last seen: ${new Date(lastSeen)})`);
    }
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`Fixed ${count} stale online users`);
  } else {
    console.log('No stale users found');
  }
}

fixStaleOnlineUsers();
```

## Why This Happens

Users can get stuck as "online" when:
- They force-close the browser
- Network connection drops suddenly
- Browser crashes
- Mobile app is killed by OS

## The Automatic Fix

The code now includes automatic stale detection:
- Users are shown as offline if their `lastSeen` is older than 2 minutes
- This happens client-side, so no database update needed
- The fix is in `formatLastSeen.js` and `isUserActuallyOnline()`

## Verifying the Fix is Deployed

1. Check Vercel deployment: https://vercel.com/dashboard
2. Look for the latest deployment with commit message about "online status"
3. Verify the deployment is "Ready" (not "Building")
4. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
5. Clear browser cache if needed

## Temporary Workaround

Until the fix is deployed, users will automatically show as offline after 2 minutes of inactivity once the new code is live. The green dot and "Online" status are calculated client-side based on the `lastSeen` timestamp.

## Date
April 2, 2026
