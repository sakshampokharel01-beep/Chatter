import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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

async function checkSushamUser() {
  try {
    console.log('🔍 Searching for susham pokharel...\n');
    
    // Find user by display name
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('displayName', '==', 'susham pokharel'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ User "susham pokharel" not found in users collection');
      
      // Try case-insensitive search
      console.log('\n🔍 Trying case-insensitive search...');
      const allUsersSnap = await getDocs(usersRef);
      const found = allUsersSnap.docs.find(doc => 
        doc.data().displayName?.toLowerCase().includes('susham')
      );
      
      if (found) {
        console.log('✅ Found user with similar name:');
        console.log('User ID:', found.id);
        console.log('Data:', JSON.stringify(found.data(), null, 2));
      } else {
        console.log('❌ No users found with "susham" in name');
      }
      return;
    }
    
    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log('✅ Found user:');
    console.log('User ID:', userId);
    console.log('Display Name:', userData.displayName);
    console.log('Email:', userData.email);
    console.log('Is Anonymous:', userData.isAnonymous);
    console.log('Online:', userData.online);
    console.log('Last Seen:', userData.lastSeen?.toDate());
    
    // Check if user is blocked
    console.log('\n🔍 Checking if user is blocked...');
    const blockedDoc = await getDoc(doc(db, 'blockedUsers', userId));
    if (blockedDoc.exists()) {
      console.log('⚠️ USER IS BLOCKED!');
      console.log('Blocked data:', JSON.stringify(blockedDoc.data(), null, 2));
    } else {
      console.log('✅ User is not blocked');
    }
    
    // Check if user is deleted
    console.log('\n🔍 Checking if user is deleted...');
    const deletedDoc = await getDoc(doc(db, 'deletedUsers', userId));
    if (deletedDoc.exists()) {
      console.log('⚠️ USER IS MARKED AS DELETED!');
      console.log('Deleted data:', JSON.stringify(deletedDoc.data(), null, 2));
    } else {
      console.log('✅ User is not deleted');
    }
    
    // Check friendships
    console.log('\n🔍 Checking friendships...');
    const friendsRef = collection(db, 'friends');
    const friendsQuery = query(friendsRef, where('users', 'array-contains', userId));
    const friendsSnap = await getDocs(friendsQuery);
    
    if (friendsSnap.empty) {
      console.log('⚠️ User has no friends');
    } else {
      console.log(`✅ User has ${friendsSnap.size} friendship(s):`);
      friendsSnap.docs.forEach(doc => {
        const data = doc.data();
        console.log('  - Friends with:', data.users.filter(id => id !== userId));
      });
    }
    
    // Check DM conversations
    console.log('\n🔍 Checking DM conversations...');
    const dmsRef = collection(db, 'dms');
    const dmsSnap = await getDocs(dmsRef);
    
    const userDMs = dmsSnap.docs.filter(doc => 
      doc.data().participants?.includes(userId)
    );
    
    if (userDMs.length === 0) {
      console.log('⚠️ No DM conversations found');
    } else {
      console.log(`✅ Found ${userDMs.length} DM conversation(s):`);
      for (const dmDoc of userDMs) {
        const dmData = dmDoc.data();
        console.log(`  - DM ID: ${dmDoc.id}`);
        console.log(`    Participants: ${dmData.participants?.join(', ')}`);
        
        // Check messages in this DM
        const messagesRef = collection(db, 'dms', dmDoc.id, 'messages');
        const messagesSnap = await getDocs(messagesRef);
        console.log(`    Messages: ${messagesSnap.size}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSushamUser();
