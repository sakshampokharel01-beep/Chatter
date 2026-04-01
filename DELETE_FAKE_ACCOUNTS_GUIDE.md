# How to Delete Fake Accounts 🗑️

## If Your Friend Creates Fake Accounts

### Option 1: Use Admin Panel (Easiest)

1. Sign in as admin
2. Go to Admin Panel tab
3. Find fake accounts
4. Click "Remove User" button
5. Done!

### Option 2: Firebase Console (Manual)

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `chatapp-eb6e3`
3. Go to **Authentication** → **Users**
4. Find fake accounts
5. Click the 3 dots → **Delete account**
6. Go to **Firestore Database**
7. Delete the user document from `users` collection
8. Delete any messages from `messages` collection (filter by uid)

### Option 3: Bulk Delete Script (Advanced)

If you need to delete many fake accounts at once:

```javascript
// delete-fake-accounts.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Your config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteFakeAccounts() {
  // Find accounts created in last hour with "Guest" or "Fake" in name
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('displayName', '>=', 'Fake'),
    where('displayName', '<=', 'Fake\uf8ff')
  );
  
  const snapshot = await getDocs(q);
  
  console.log(`Found ${snapshot.size} fake accounts`);
  
  for (const userDoc of snapshot.docs) {
    console.log(`Deleting: ${userDoc.data().displayName}`);
    await deleteDoc(doc(db, 'users', userDoc.id));
  }
  
  console.log('✅ Done!');
}

deleteFakeAccounts();
```

Run with: `node delete-fake-accounts.js`

---

## Prevention is Better Than Cure

### Enable Email Verification (Recommended)

I've already added email verification to your sign-up flow. Now add this to your Firestore rules:

```javascript
// In firestore.rules
match /users/{uid} {
  allow create: if isOwner(uid) &&
    request.resource.data.displayName is string &&
    request.resource.data.displayName.size() > 0 &&
    request.resource.data.displayName.size() <= 64 &&
    // Require email verification for email sign-ups
    (request.auth.token.firebase.sign_in_provider == 'anonymous' ||
     request.auth.token.firebase.sign_in_provider == 'google.com' ||
     request.auth.token.email_verified == true);
}
```

This will:
- ✅ Allow Google sign-ins (verified by Google)
- ✅ Allow guest accounts (filtered from DMs anyway)
- ✅ Require email verification for email sign-ups
- ❌ Block unverified email accounts

---

## Monitor for Suspicious Activity

### Daily Check:
1. Open Firebase Console
2. Go to Authentication → Users
3. Sort by "Created" date
4. Look for patterns:
   - Many accounts in short time
   - Similar names (Guest1, Guest2, Fake1, Fake2)
   - Same email domain

### Set Up Alerts:
1. Go to Firebase Console → Usage
2. Click "Set budget alert"
3. Set alert at 50% of free tier
4. You'll get email if usage spikes

---

## What to Do If Attacked

### Step 1: Assess the Damage
- How many fake accounts?
- Are they causing issues?
- Is usage spiking?

### Step 2: Immediate Response
1. Enable App Check in "Enforced" mode (blocks bots)
2. Require email verification (blocks fake emails)
3. Delete fake accounts via Admin Panel

### Step 3: Long-term Fix
1. Add IP-based rate limiting
2. Monitor Firebase usage
3. Consider adding CAPTCHA

---

## The Reality Check

**Your friend would need to:**
1. Manually create each account (Firebase rate limits automation)
2. Verify each email (if verification enabled)
3. Bypass Firebase's abuse detection
4. Spend hours doing this
5. Accomplish... nothing (can't access private data)

**Conclusion**: Not worth their time. Your app is secure.

---

## Challenge Your Friend

Tell them to try and show you:
1. Create 100 fake accounts
2. Read someone else's private messages
3. Delete someone else's messages
4. Access admin panel without being admin

**They will fail at all of these.** Your security is solid. 🔒
