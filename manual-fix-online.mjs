// Quick script to manually set all stale users offline
// Run with: node manual-fix-online.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';

// Read .env file manually
const envFile = readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixStaleOnlineUsers() {
  console.log('🔍 Checking for stale online users...\n');
  
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
  let fixed = 0;
  
  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    
    if (data.online === true) {
      const lastSeen = data.lastSeen?.toMillis() || 0;
      const minutesAgo = Math.floor((Date.now() - lastSeen) / 60000);
      
      if (lastSeen < twoMinutesAgo) {
        console.log(`❌ ${data.displayName || userDoc.id} - Online but last seen ${minutesAgo} minutes ago`);
        console.log(`   Setting to offline...`);
        
        await updateDoc(doc(db, 'users', userDoc.id), {
          online: false,
          lastSeen: serverTimestamp()
        });
        
        console.log(`   ✅ Fixed!\n`);
        fixed++;
      } else {
        console.log(`✅ ${data.displayName || userDoc.id} - Online (last seen ${minutesAgo} minutes ago) - OK\n`);
      }
    }
  }
  
  console.log(`\n🎉 Done! Fixed ${fixed} stale user(s)`);
  process.exit(0);
}

fixStaleOnlineUsers().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
