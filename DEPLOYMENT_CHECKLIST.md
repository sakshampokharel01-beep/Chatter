# Deployment Security Checklist

## Before Deploying

### 1. Check Git History for Exposed Credentials
```bash
git log --all --full-history -- .env
```

If `.env` was ever committed:
- Rotate all Firebase API keys in Firebase Console
- Generate new service account key
- Update `.env` with new credentials

### 2. Set Up First Admin User
Since admin email is no longer in environment variables:

1. Deploy the app first
2. Sign in with your admin account
3. Manually add your UID to Firestore:
   - Go to Firebase Console → Firestore
   - Create collection: `admins`
   - Add document with your UID as document ID
   - Add field: `grantedAt: <current timestamp>`

### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

Verify the rules are active in Firebase Console → Firestore → Rules tab.

### 4. Enable App Check (Recommended)
1. Go to Firebase Console → App Check
2. Register your app with reCAPTCHA v3
3. Start in "Unenforced" mode to test
4. Monitor for issues, then switch to "Enforced"

### 5. Set Up Cloud Functions Rate Limiting (Optional)
Consider adding server-side rate limiting with Cloud Functions to prevent abuse.

### 6. Monitor Security
- Enable Firebase Security Rules monitoring
- Set up alerts for suspicious activity
- Regularly review admin access logs

## Post-Deployment

### Verify Security Rules
Test that:
- [ ] Non-admin users cannot write to other users' profiles
- [ ] Only admins can delete messages
- [ ] DM conversations are private to participants
- [ ] Blocked domains cannot register

### Monitor for Issues
- Check Firebase Console → Authentication for unusual sign-ups
- Review Firestore usage for spikes
- Monitor error logs

## Emergency Response

If credentials are compromised:
1. Immediately rotate Firebase API keys
2. Regenerate service account key
3. Review Firestore audit logs
4. Check for unauthorized admin accounts in `admins` collection
5. Review and update security rules if needed
