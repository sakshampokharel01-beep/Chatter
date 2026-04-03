# Clean Up Duplicate Friendships

## The Problem
Your database has duplicate friendship records. For example:
- User A <-> User B might have 5 duplicate records
- This makes friend counts show incorrectly (showing 15 friends when they only have 1)

## Solution: Manual Cleanup in Firebase Console

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/project/chatapp-eb6e3/firestore
2. Click on the `friends` collection

### Step 2: Identify Duplicates
Each friendship document has a `users` array with 2 user IDs.
Look for multiple documents with the same pair of users.

Example of duplicates:
```
Document 1: users: ["abc123", "def456"]
Document 2: users: ["abc123", "def456"]  ← DUPLICATE
Document 3: users: ["abc123", "def456"]  ← DUPLICATE
```

### Step 3: Delete Duplicates
For each duplicate pair:
1. Keep the OLDEST document (earliest `createdAt`)
2. Delete all other duplicates
3. Click the trash icon next to each duplicate document

### Step 4: Verify
After cleanup:
1. Refresh your app
2. Check user profiles
3. Friend counts should now be correct

## Quick Fix for Specific Users

### For Rusil Koirala:
1. Search friends collection for documents containing Rusil's user ID
2. Group by unique user pairs
3. Delete duplicates, keep one per pair

### For Bivaas Baral:
Same process as above

## Prevention
The app now has better duplicate prevention, but existing duplicates need manual cleanup.

## Alternative: Export and Re-import
If you have many duplicates:
1. Export the `friends` collection
2. Remove duplicates in a spreadsheet
3. Delete the collection
4. Re-import clean data

This is faster for large-scale cleanup.
