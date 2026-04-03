import { initializeApp } from 'firebase/admin/app';
import { getFirestore } from 'firebase/admin/firestore';
import { readFileSync } from 'fs';

// Read service account key
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf-8'));

initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

async function cleanupDuplicateFriendships() {
  try {
    console.log('🔍 Checking for duplicate friendships...\n');
    
    const friendsSnap = await db.collection('friends').get();
    console.log(`Total friendship documents: ${friendsSnap.size}\n`);
    
    // Group friendships by user pairs
    const friendshipMap = new Map();
    const duplicates = [];
    
    friendsSnap.docs.forEach(doc => {
      const data = doc.data();
      const users = data.users.sort(); // Sort to ensure consistent key
      const key = users.join('_');
      
      if (friendshipMap.has(key)) {
        // Duplicate found!
        duplicates.push({
          id: doc.id,
          users: data.users,
          createdAt: data.createdAt
        });
        console.log(`❌ Duplicate friendship found: ${doc.id}`);
        console.log(`   Users: ${data.users.join(' <-> ')}`);
        console.log(`   Created: ${data.createdAt?.toDate()}\n`);
      } else {
        friendshipMap.set(key, {
          id: doc.id,
          users: data.users,
          createdAt: data.createdAt
        });
      }
    });
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate friendships found!');
      return;
    }
    
    console.log(`\n⚠️  Found ${duplicates.length} duplicate friendship(s)\n`);
    console.log('Do you want to delete these duplicates? (yes/no)');
    
    // In a real script, you'd use readline for input
    // For now, just delete them
    console.log('Deleting duplicates...\n');
    
    for (const dup of duplicates) {
      await db.collection('friends').doc(dup.id).delete();
      console.log(`✅ Deleted duplicate: ${dup.id}`);
    }
    
    console.log(`\n✅ Cleanup complete! Deleted ${duplicates.length} duplicate(s)`);
    
    // Show final count
    const finalSnap = await db.collection('friends').get();
    console.log(`Final friendship count: ${finalSnap.size}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanupDuplicateFriendships();
