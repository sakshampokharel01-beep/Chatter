import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  updateProfile,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
// App Check import removed — disabled due to reCAPTCHA network failures blocking all Firebase ops

// ── Safe URL allow-list ──────────────────────────────────────
// Only allow https:// photo URLs to prevent javascript: injection
export const safePhotoURL = (url) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
};

// ============================================================
// FIREBASE CONFIGURATION
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use an existing one)
// 3. Add a Web app and copy the firebaseConfig object below
// 4. Enable "Authentication" → Sign-in method:
//      • Google  (for Google sign-in)
//      • Anonymous  (for Guest sign-in)
// 5. Enable "Firestore Database" in test mode
// ============================================================
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// ── App Check (reCAPTCHA v3) ─────────────────────────────────
// DISABLED: reCAPTCHA script fails to load on some networks (ERR_CERT_COMMON_NAME_INVALID).
// When App Check token generation hangs, Firebase SDK queues ALL operations indefinitely,
// causing infinite loading spinners on sign-in. Re-enable only when reCAPTCHA loads reliably.
// if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
//   initializeAppCheck(app, {
//     provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
//     isTokenAutoRefreshEnabled: true,
//   });
// }

export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account', login_hint: '' });

// ── Sign up with email + password ──────────────────────────
export const signUpWithEmail = async (name, email, password) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name.trim() || email.split('@')[0] });
  
  // Send email verification (anti-spam measure)
  try {
    const { sendEmailVerification } = await import('firebase/auth');
    await sendEmailVerification(result.user);
    console.log('✅ Verification email sent');
  } catch (err) {
    console.warn('⚠️ Could not send verification email:', err);
  }
  
  return result;
};

// ── Sign in with email + password ────────────────────────
export const signInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

// ── Sign in with Google ──────────────────────────────────────
// Always uses popup — redirect was silently failing because
// getRedirectResult() was never awaited after the page returned.
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// ── Sign in as Anonymous guest ───────────────────────────────
// Accepts a user-chosen name. Falls back to a random Guest# name.
export const signInAsGuest = async (chosenName) => {
  const guestName = chosenName?.trim() ||
    `Guest#${Math.floor(Math.random() * 9000 + 1000)}`;
  sessionStorage.setItem('guestName', guestName);
  const result = await signInAnonymously(auth);
  await updateProfile(result.user, { displayName: guestName });
  return result;
};

// ── Resolve display name reliably ───────────────────────────
// updateProfile() updates auth.currentUser immediately but may
// race with onAuthStateChanged. This helper always returns the
// freshest display name.
export const getDisplayName = (user) => {
  if (!user) return '';
  // auth.currentUser is always the freshest source
  const freshName = auth.currentUser?.uid === user.uid
    ? auth.currentUser.displayName
    : user.displayName;
  if (freshName) return freshName;
  if (user.isAnonymous) return sessionStorage.getItem('guestName') || 'Guest';
  return user.email?.split('@')[0] || 'User';
};

// ── Sign out ─────────────────────────────────────────────────
export const signOutUser = () => {
  sessionStorage.removeItem('guestName');
  return signOut(auth);
};

// ── Register signed-in (non-anonymous) user in Firestore ─────
export const registerUser = async (user, retryCount = 0) => {
  if (!user) return;
  
  const isGuest = user.isAnonymous;
  const email = user.email?.toLowerCase() || '';
  console.log("--- REGISTRATION ATTEMPT ---");
  console.log("Active Project ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
  console.log("Auth Provider:", isGuest ? 'anonymous' : (user.providerData[0]?.providerId || 'email'));
  console.log("UID/DocID:", user.uid);
  console.log("User Type:", isGuest ? 'Guest' : 'Registered');

  // 1. Anti-Spam: Block disposable/test domains (only for non-anonymous)
  const blockedDomains = [
    '@example.com', '@test.com', '@temp-mail.', '@guerrillamail.',
    '@10minutemail.', '@throwaway.', '@mailinator.', '@trashmail.'
  ];
  if (!isGuest && blockedDomains.some(domain => email.includes(domain))) {
    console.warn("Registration rejected: Disposable email domain blocked.");
    return;
  }

  const userRef = doc(db, 'users', user.uid);
  try {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: getDisplayName(user).slice(0, 64),
      email: email,
      photoURL: safePhotoURL(user.photoURL),
      lastSeen: serverTimestamp(),
      isAnonymous: isGuest,
    }, { merge: true });
    console.log(`✅ ${isGuest ? 'Guest' : 'User'} Registration SUCCESSFUL in Firestore`);
  } catch (err) {
    console.error("❌ Registration FAILED:", err);
    if (err.code === 'permission-denied') {
      console.error("PERMISSION DENIED: Double-check if App Check is 'Enforced' in Firebase Console.");
    }
    // Simple retry for network glitches
    if (retryCount < 2 && err.code !== 'permission-denied') {
      console.log(`Retrying registration (Attempt ${retryCount + 2})...`);
      setTimeout(() => registerUser(user, retryCount + 1), 2000);
    }
  }
  console.log("----------------------------");
};

// ── Admin ───────────────────────────────────────────────
// Check admin status from Firestore instead of exposing in client code
export const isAdmin = async (user) => {
  if (!user) return false;
  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    return adminDoc.exists();
  } catch (err) {
    console.error('Error checking admin status:', err);
    return false;
  }
};

// ── Deterministic DM conversation ID ─────────────────────────
export const getDMId = (uid1, uid2) => [uid1, uid2].sort().join('_');
