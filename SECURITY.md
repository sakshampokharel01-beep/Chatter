# Security

## Admin Setup

To grant admin privileges:
1. Firebase Console → Firestore Database → `admins` collection
2. Add document with user's UID as document ID
3. Add `grantedAt` timestamp field

## Firebase Security

- API keys are public (security is in Firestore Rules)
- Service account JSON must stay private (already in .gitignore)
- Firestore rules enforce user permissions and data access

## Rate Limiting

Client-side cooldown: 1 message per second

## Anti-Spam

Blocked email domains:
- Disposable email services (temp-mail, guerrillamail, 10minutemail, etc.)
- Test domains (example.com, test.com)

Configure in `src/firebase.js` → `registerUser()` function.
