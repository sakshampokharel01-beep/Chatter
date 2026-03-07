import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Check if service-account.json exists before trying to read it
// If I deleted it earlier, I'll need to ask the user or look for it.
// Wait, I DID delete it in step 1141. I need to check if I can still access it or if I need to recreate a temporary one.
// Actually, I should probably just check the .env and use a different approach or ask the user.
// But wait, I have the credentials in .env, maybe I can use them? 
// No, admin sdk needs a service account key usually.

async function checkRecentUsers() {
  try {
    const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'));
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const db = admin.firestore();
    const usersSnap = await db.collection('users').orderBy('lastSeen', 'desc').limit(5).get();
    
    console.log(`--- RECENT USERS (${usersSnap.size}) ---`);
    usersSnap.forEach(doc => {
        const data = doc.data();
        console.log(`DocID: ${doc.id} | Email: ${data.email} | Name: ${data.displayName} | LastSeen: ${data.lastSeen?.toDate()}`);
    });
    console.log('--- END ---');
    process.exit(0);
  } catch (error) {
    console.error("Error checking users:", error.message);
    process.exit(1);
  }
}

checkRecentUsers();
