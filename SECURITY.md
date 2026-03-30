# Security Configuration Guide

## Admin Setup

To grant admin privileges to a user:

1. Go to Firebase Console → Firestore Database
2. Navigate to the `admins` collection
3. Add a new document with the user's UID as the document ID
4. Add fields:
   - `grantedAt`: timestamp
   - `grantedBy`: (optional) UID of who granted access

Example:
```
Collection: admins
Document ID: <user-uid-here>
Fields:
  grantedAt: <timestamp>
  grantedBy: "system"
```

## Security Best Practices

### Firebase API Keys
- The Firebase API keys in `.env` are meant to be public (they identify your Firebase project)
- Security is enforced through Firestore Rules, not by hiding API keys
- However, if you suspect abuse, you can restrict API key usage in Firebase Console → Project Settings → API Keys

### Firestore Security Rules
- User profiles: Users can only write to their own profile
- Messages: Any authenticated user can read/create, only admins can delete
- DMs: Only participants can read their conversations
- Admin collections: Only admins can access

### Service Account (Backend)
- Keep `service-account.json` secure and never commit it to git
- It's already in `.gitignore`
- Download it from Firebase Console → Project Settings → Service Accounts
- Use it only for backend/admin scripts

### App Check (Optional)
- Currently disabled due to reCAPTCHA network issues
- When re-enabling, ensure reCAPTCHA v3 loads reliably
- Configure in Firebase Console → App Check

## Rate Limiting
- Client-side: 1 message per second cooldown
- Consider adding Cloud Functions for server-side rate limiting

## Blocked Domains
The following email domains are blocked from registration:
- @example.com
- @test.com
- @temp-mail.*
- @guerrillamail.*
- @10minutemail.*
- @throwaway.*
- @mailinator.*
- @trashmail.*

Add more patterns in `src/firebase.js` → `registerUser()` function.
