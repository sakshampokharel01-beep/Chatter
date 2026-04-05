import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

async function run() {
  // Look for service account key
  const keyFiles = ['service-account.json', 'chatapp-eb6e3-firebase-adminsdk.json'];
  let keyPath = null;
  for (const k of keyFiles) {
    if (existsSync(k)) keyPath = k;
  }
  
  if (!keyPath) {
    console.log('❌ No service account key found.');
    console.log('Please add your Firebase Admin SDK key to the project root.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  
  initializeApp({
    credential: cert(serviceAccount)
  });
  
  const db = getFirestore();
  console.log('✅ Connected to Firestore\n');
  
  // Get all DM conversations
  const dmsSnapshot = await db.collection('dms').get();
  console.log(`📁 Found ${dmsSnapshot.size} DM conversations\n`);
  
  let totalDeleted = 0;
  
  for (const dmDoc of dmsSnapshot.docs) {
    const dmId = dmDoc.id;
    console.log(`Checking DM: ${dmId}`);
    
    // Get all messages in this DM
    const messagesSnapshot = await db.collection('dms').doc(dmId).collection('messages').get();
    
    let deletedInThisDM = 0;
    
    for (const msgDoc of messagesSnapshot.docs) {
      const msgData = msgDoc.data();
      
      // Check if message has a file URL pointing to serve-blob API
      if (msgData.fileUrl && msgData.fileUrl.includes('/api/serve-blob')) {
        console.log(`  🗑️  Deleting message ${msgDoc.id} with file: ${msgData.fileName || 'unknown'}`);
        await msgDoc.ref.delete();
        deletedInThisDM++;
        totalDeleted++;
      }
    }
    
    if (deletedInThisDM > 0) {
      console.log(`  ✅ Deleted ${deletedInThisDM} messages from this DM\n`);
    } else {
      console.log(`  ✓ No orphaned files in this DM\n`);
    }
  }
  
  console.log(`\n🎉 Cleanup complete!`);
  console.log(`📊 Total messages deleted: ${totalDeleted}`);
}

run().catch(console.error);
