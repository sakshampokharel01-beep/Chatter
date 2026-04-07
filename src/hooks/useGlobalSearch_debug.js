import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * DEBUG VERSION - Simplified search without orderBy
 */
export function useGlobalSearch(searchQuery, userId, friendIds = new Set()) {
  const [results, setResults] = useState({ messages: [], users: [], dms: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceTimerRef = useRef(null);
  const cacheRef = useRef(new Map());

  const performSearch = useCallback(async (query) => {
    console.log('DEBUG performSearch called with query:', query);
    
    if (!query || query.length < 2) {
      setResults({ messages: [], users: [], dms: [] });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const normalizedQuery = query.trim().toLowerCase();
      console.log('DEBUG Searching for normalized query:', normalizedQuery);
      
      // Fetch messages WITHOUT orderBy
      console.log('DEBUG Fetching messages...');
      const messagesSnap = await getDocs(
        query(
          collection(db, 'messages'),
          limit(100) // Get more to filter client-side
        )
      );
      console.log('DEBUG Messages fetched:', messagesSnap.docs.length);
      
      // Fetch users
      console.log('DEBUG Fetching users...');
      const usersSnap = await getDocs(
        query(
          collection(db, 'users'),
          where('isAnonymous', '==', false),
          limit(50)
        )
      );
      console.log('DEBUG Users fetched:', usersSnap.docs.length);
      
      // Filter and format results
      const allMessages = messagesSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        type: 'message' 
      }));
      
      console.log('DEBUG All messages:', allMessages.length);
      console.log('DEBUG Sample message:', allMessages[0]);
      
      const messageResults = allMessages
        .filter(msg => {
          const hasText = msg.text && typeof msg.text === 'string';
          const matches = hasText && msg.text.toLowerCase().includes(normalizedQuery);
          if (hasText && !matches) {
            console.log('DEBUG Message text does not match:', msg.text);
          }
          return matches;
        })
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        })
        .slice(0, 20);
      
      console.log('DEBUG Filtered message results:', messageResults.length);

      const allUsers = usersSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        type: 'user' 
      }));
      
      console.log('DEBUG All users:', allUsers.length);
      
      const userResults = allUsers
        .filter(user => {
          const notSelf = user.id !== userId;
          const hasName = user.displayName && typeof user.displayName === 'string';
          const matches = hasName && user.displayName.toLowerCase().includes(normalizedQuery);
          return notSelf && matches;
        })
        .slice(0, 10);
      
      console.log('DEBUG Filtered user results:', userResults.length);

      // Skip DM search for now in debug mode
      const dmResultsFlat = [];

      const searchResults = {
        messages: messageResults,
        users: userResults,
        dms: dmResultsFlat
      };

      console.log('DEBUG Final search results:', searchResults);

      setResults(searchResults);
    } catch (err) {
      console.error('DEBUG Search error:', err);
      console.error('DEBUG Error code:', err.code);
      console.error('DEBUG Error message:', err.message);
      console.error('DEBUG Error stack:', err.stack);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, friendIds]);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchQuery || searchQuery.length < 2) {
      setResults({ messages: [], users: [], dms: [] });
      setLoading(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  return { results, loading, error };
}
