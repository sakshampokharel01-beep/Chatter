# How to Add Yourself as Admin

Your admin panel code is working perfectly! You just need to add yourself to the `admins` collection in Firestore.

## Quick Steps:

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `chatapp-eb6e3`
3. **Click "Firestore Database"** in the left sidebar
4. **Click "Start collection"** (if admins collection doesn't exist) or find the `admins` collection
5. **Add a new document**:
   - **Document ID**: `lnYH4ddsv2NRE2DQm7d8sWZGwdS2` (your user ID)
   - **Field**: `isAdmin` (type: boolean) = `true`
   - **Field**: `grantedAt` (type: timestamp) = (current time)
   - **Field**: `grantedBy` (type: string) = `lnYH4ddsv2NRE2DQm7d8sWZGwdS2`
6. **Click "Save"**
7. **Refresh your browser** on the Chatter app

## After Adding:

- You'll see an "Admin" badge next to your name
- A new "Users" tab will appear in the header
- You can manage users, block/unblock, promote/demote admins
- The "Could not load deleted users" error will disappear

## Your User Info:
- **User ID**: `lnYH4ddsv2NRE2DQm7d8sWZGwdS2`
- **Email**: `sakshampokharel01@gmail.com`

That's it! Once you add this document, you'll have full admin access.
