/**
 * Deletes all global chat messages belonging to users in the deletedUsers collection.
 * Run once: node cleanup-removed-messages.mjs
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// 1. Get all removed user UIDs
const deletedSnap = await db.collection('deletedUsers').get();
const removedUids = deletedSnap.docs.map(d => d.id);

if (removedUids.length === 0) {
  console.log('No removed users found.');
  process.exit(0);
}

console.log(`Found ${removedUids.length} removed user(s): ${removedUids.join(', ')}`);

// 2. Delete their messages
let totalDeleted = 0;
for (const uid of removedUids) {
  const msgsSnap = await db.collection('messages').where('uid', '==', uid).get();
  if (msgsSnap.empty) {
    console.log(`  [${uid}] No messages found.`);
    continue;
  }
  const batch = db.batch();
  msgsSnap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  console.log(`  [${uid}] Deleted ${msgsSnap.size} message(s).`);
  totalDeleted += msgsSnap.size;
}

console.log(`\nDone. Total messages deleted: ${totalDeleted}`);
