# 🔥 Deploy Firestore Rules - Fix Friend Request Error

## ❌ Current Error:
"Failed to accept friend request"

## ✅ Solution:
Deploy the updated Firestore rules to Firebase Console

## 📋 Steps to Deploy:

### 1. Open Firebase Console
Go to: https://console.firebase.google.com/

### 2. Select Your Project
Click on: **chatapp-eb6e3**

### 3. Navigate to Firestore Rules
- Click **"Firestore Database"** in left sidebar
- Click **"Rules"** tab at the top

### 4. Copy the Rules
Open the `firestore.rules` file in your project and copy ALL the content

### 5. Paste into Firebase Console
- Delete all existing rules in the Firebase Console editor
- Paste the new rules from `firestore.rules`

### 6. Publish
- Click the **"Publish"** button
- Wait for confirmation message

### 7. Test Again
- Refresh your app: http://localhost:5173
- Try accepting a friend request again
- Should work now! ✅

## 🔍 What These Rules Do:

### Friend Requests:
- Users can send friend requests
- Users can accept/reject requests sent to them
- Users can delete their own sent requests

### Friends:
- Users can create friendships (when accepting requests)
- Users can only see their own friendships
- Users can delete friendships

### Direct Messages:
- Only friends can send DMs to each other
- Users can only read DMs they're part of
- Messages are private and secure

## ⚠️ Important:
Without deploying these rules, the friend request system won't work because Firebase will block the operations.

## 🎯 After Deploying:
1. Friend requests will work ✅
2. Accepting/rejecting will work ✅
3. DMs between friends will work ✅
4. Video calls between friends will work ✅

---

**Deploy the rules now to fix the error!**
