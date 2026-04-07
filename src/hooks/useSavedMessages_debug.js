import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  limit, 
  onSnapshot,
  addDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * DEBUG VERSION - Without orderBy to test if index is the issue
 */
export function useSavedMessages(userId) {
  const [savedMessages, setSavedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  // Subscribe to saved messages - WITHOUT orderBy
  useEffect(() => {
    if (!userId) {
      console.log('useSavedMessages: No userId provided');
      return;
    }

    console.log('useSavedMessages DEBUG: Setting up listener for userId:', userId);
    setLoading(true);
    
    // Simple query without orderBy to avoid index requirement
    const q = query(
      collection(db, 'savedMessages'),
      where('userId', '==', userId),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('useSavedMessages DEBUG: Snapshot received, docs count:', snapshot.docs.length);
      
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Saved message doc:', doc.id, data);
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Sort client-side by savedAt
      messages.sort((a, b) => {
        const aTime = a.savedAt?.toMillis?.() || 0;
        const bTime = b.savedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      
      setSavedMessages(messages);
      setHasMore(false);
      setLoading(false);
    }, (err) => {
      console.error('Saved messages snapshot error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const loadMore = useCallback(() => {
    console.log('loadMore called but disabled in debug version');
  }, []);

  // Check if a message is saved
  const isSaved = useCallback(async (messageId) => {
    if (!userId || !messageId) return false;

    try {
      const q = query(
        collection(db, 'savedMessages'),
        where('userId', '==', userId),
        where('messageId', '==', messageId),
        limit(1)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.length > 0;
    } catch (err) {
      console.error('Failed to check if message is saved:', err);
      return false;
    }
  }, [userId]);

  // Toggle save/unsave message
  const toggleSaveMessage = useCallback(async (message, conversationType, conversationId) => {
    console.log('toggleSaveMessage DEBUG called with:', { message, conversationType, conversationId, userId });
    
    if (!userId || !message || !message.id) {
      console.error('Invalid parameters:', { userId, message });
      throw new Error('Invalid parameters for toggleSaveMessage');
    }

    try {
      // Check if already saved
      const q = query(
        collection(db, 'savedMessages'),
        where('userId', '==', userId),
        where('messageId', '==', message.id),
        limit(1)
      );

      const snapshot = await getDocs(q);
      console.log('Existing saved messages found:', snapshot.docs.length);

      if (snapshot.docs.length > 0) {
        // Already saved - remove it
        console.log('Removing saved message:', snapshot.docs[0].id);
        await deleteDoc(doc(db, 'savedMessages', snapshot.docs[0].id));
        return false; // Unsaved
      } else {
        // Not saved - save it
        const saveData = {
          userId,
          messageId: message.id,
          conversationType: conversationType || 'global',
          conversationId: conversationId || 'global',
          messageText: (message.text || '').slice(0, 500),
          messageSender: message.displayName || 'User',
          messageSenderPhoto: message.photoURL || '',
          messageTimestamp: message.createdAt,
          savedAt: serverTimestamp(),
          note: ''
        };
        console.log('Saving message with data:', saveData);
        const docRef = await addDoc(collection(db, 'savedMessages'), saveData);
        console.log('Message saved with ID:', docRef.id);
        return true; // Saved
      }
    } catch (err) {
      console.error('Failed to toggle save message:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      throw err;
    }
  }, [userId]);

  return {
    savedMessages,
    loading,
    toggleSaveMessage,
    isSaved,
    loadMore,
    hasMore
  };
}
