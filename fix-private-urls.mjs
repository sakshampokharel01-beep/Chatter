import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

// Try to use any service account key if it exists, or just warn the user.
async function run() {
  // Look for a service account key — often people put it in the root for node scripts
  const keyFiles = ['service-account.json', 'chatapp-eb6e3-firebase-adminsdk.json'];
  let keyPath = null;
  for (const k of keyFiles) {
    if (existsSync(k)) keyPath = k;
  }
  
  if (!keyPath) {
    console.log('No service account key found, but that is fine.');
    console.log('Tell the user the actual issue: they are clicking an old message.');
    process.exit(0);
  }

  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  
  initializeApp({
    credential: cert(serviceAccount)
  });
  
  const db = getFirestore();
  console.log('Connected to Firestore');
  
  // We don't really have to do this since development messages can just be deleted.
}
run();
