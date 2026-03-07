import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  signOut,
  updateProfile,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

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
// Proves every request comes from your real app — blocks direct API scripts.
// To enable: Firebase Console → App Check → Register web app → reCAPTCHA v3
// Then add VITE_RECAPTCHA_SITE_KEY to your .env and Vercel env vars,
// and click "Enforce" for Firestore in Firebase Console → App Check.
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account', login_hint: '' });

// ── Sign up with email + password ──────────────────────────
export const signUpWithEmail = async (name, email, password) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name.trim() || email.split('@')[0] });
  return result;
};

// ── Sign in with email + password ────────────────────────
export const signInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

// ── Sign in with Google ──────────────────────────────────────
// Uses redirect on mobile (popups are blocked), popup on desktop.
// Signs out first to always force the account picker.
const isMobile = () => /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

export const signInWithGoogle = async () => {
  await signOut(auth);
  return isMobile()
    ? signInWithRedirect(auth, googleProvider)
    : signInWithPopup(auth, googleProvider);
};

export { getRedirectResult };

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
// Called every sign-in so displayName/photoURL stay up to date.
export const registerUser = async (user) => {
  if (!user || user.isAnonymous) return;
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    displayName: getDisplayName(user).slice(0, 64),
    photoURL: safePhotoURL(user.photoURL),
    lastSeen: serverTimestamp(),
  }, { merge: true });
};

// ── Admin ───────────────────────────────────────────────
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
export const isAdmin = (user) => !!(user?.email && user.email === ADMIN_EMAIL);

// ── Deterministic DM conversation ID ─────────────────────────
export const getDMId = (uid1, uid2) => [uid1, uid2].sort().join('_');
