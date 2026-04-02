import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Your Firebase config (from .env or firebase.js)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setRamOffline() {
  try {
    // Find Ram's user ID - you'll need to replace this with the actual ID
    const ramUserId = 'RAM_USER_ID_HERE'; // Replace with actual user ID
    
    await updateDoc(doc(db, 'users', ramUserId), {
      online: false,
      lastSeen: serverTimestamp()
    });
    
    console.log('✅ Ram set to offline');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

setRamOffline();
