import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { readFileSync } from 'fs';

// Read .env file manually
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupAllDuplicateFriendships() {
  try {
    console.log('🔍 Loading all friendships from database...\n');
    
    const friendsSnap = await getDocs(collection(db, 'friends'));
    console.log(`📊 Total friendship documents: ${friendsSnap.size}\n`);
    
    // Group friendships by user pairs
    const friendshipMap = new Map();
    const duplicatesToDelete = [];
    
    friendsSnap.docs.forEach(doc => {
      const data = doc.data();
      const users = [...data.users].sort(); // Sort to ensure consistent key
      const key = users.join('_');
      
      if (friendshipMap.has(key)) {
        // Duplicate found! Mark for deletion
        duplicatesToDelete.push({
          id: doc.id,
          users: data.users,
          createdAt: data.createdAt
        });
        console.log(`❌ Duplicate: ${users[0].substring(0, 8)}... <-> ${users[1].substring(0, 8)}...`);
      } else {
        // First occurrence - keep this one
        friendshipMap.set(key, {
          id: doc.id,
          users: data.users,
          createdAt: data.createdAt
        });
      }
    });
    
    if (duplicatesToDelete.length === 0) {
      console.log('\n✅ No duplicate friendships found! Database is clean.');
      process.exit(0);
    }
    
    console.log(`\n⚠️  Found ${duplicatesToDelete.length} duplicate friendship(s)`);
    console.log(`✅ Will keep ${friendshipMap.size} unique friendships\n`);
    
    console.log('🗑️  Deleting duplicates...\n');
    
    let deleted = 0;
    for (const dup of duplicatesToDelete) {
      try {
        await deleteDoc(doc(db, 'friends', dup.id));
        deleted++;
        console.log(`✅ Deleted duplicate ${deleted}/${duplicatesToDelete.length}`);
      } catch (err) {
        console.error(`❌ Failed to delete ${dup.id}:`, err.message);
      }
    }
    
    console.log(`\n✅ Cleanup complete!`);
    console.log(`   - Deleted: ${deleted} duplicates`);
    console.log(`   - Remaining: ${friendshipMap.size} unique friendships`);
    
    // Verify final count
    const finalSnap = await getDocs(collection(db, 'friends'));
    console.log(`   - Final count in database: ${finalSnap.size}\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

console.log('🚀 Starting duplicate friendship cleanup...\n');
cleanupAllDuplicateFriendships();
