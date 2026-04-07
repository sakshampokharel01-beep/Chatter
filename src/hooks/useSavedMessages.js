import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  addDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  doc,
  startAfter
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Custom hook for managing saved messages (bookmarks)
 * @param {string} userId - Current user ID
 * @returns {Object} - { savedMessages, loading, toggleSaveMessage, isSaved, loadMore, hasMore }
 */
export function useSavedMessages(userId) {
  const [savedMessages, setSavedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

  // Subscribe to saved messages
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const q = query(
      collection(db, 'savedMessages'),
      where('userId', '==', userId),
      orderBy('savedAt', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSavedMessages(messages);
      setHasMore(snapshot.docs.length === 30);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setLoading(false);
    }, (err) => {
      console.error('Saved messages snapshot error:', err);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  // Load more saved messages (pagination)
  const loadMore = useCallback(async () => {
    if (!userId || !lastDoc || !hasMore) return;

    try {
      const q = query(
        collection(db, 'savedMessages'),
        where('userId', '==', userId),
        orderBy('savedAt', 'desc'),
        startAfter(lastDoc),
        limit(30)
      );

      const snapshot = await getDocs(q);
      const moreMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setSavedMessages(prev => [...prev, ...moreMessages]);
      setHasMore(snapshot.docs.length === 30);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    } catch (err) {
      console.error('Failed to load more saved messages:', err);
    }
  }, [userId, lastDoc, hasMore]);

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
    if (!userId || !message || !message.id) {
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

      if (snapshot.docs.length > 0) {
        // Already saved - remove it
        await deleteDoc(doc(db, 'savedMessages', snapshot.docs[0].id));
        return false; // Unsaved
      } else {
        // Not saved - save it
        await addDoc(collection(db, 'savedMessages'), {
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
        });
        return true; // Saved
      }
    } catch (err) {
      console.error('Failed to toggle save message:', err);
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
