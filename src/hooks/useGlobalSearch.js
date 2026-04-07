import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Custom hook for global search across messages, users, and DMs
 * @param {string} searchQuery - The search query string
 * @param {string} userId - Current user ID
 * @param {Set<string>} friendIds - Set of friend user IDs for DM search
 * @returns {Object} - { results, loading, error }
 */
export function useGlobalSearch(searchQuery, userId, friendIds = new Set()) {
  const [results, setResults] = useState({ messages: [], users: [], dms: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceTimerRef = useRef(null);
  const cacheRef = useRef(new Map()); // Cache for search results

  const performSearch = useCallback(async (query) => {
    console.log('performSearch called with query:', query);
    
    if (!query || query.length < 2) {
      setResults({ messages: [], users: [], dms: [] });
      return;
    }

    // Check cache first
    const cacheKey = `${query}-${userId}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 30000) { // 30 second cache
      console.log('Using cached results for:', cacheKey);
      setResults(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const normalizedQuery = query.trim().toLowerCase();
      console.log('Searching for normalized query:', normalizedQuery);
      
      // Execute queries in parallel
      console.log('Fetching messages...');
      const messagesSnap = await getDocs(
        query(
          collection(db, 'messages'),
          orderBy('createdAt', 'desc'),
          limit(50) // Get more to filter client-side
        )
      );
      console.log('Messages fetched:', messagesSnap.docs.length);
      
      console.log('Fetching users...');
      const usersSnap = await getDocs(
        query(
          collection(db, 'users'),
          where('isAnonymous', '==', false),
          limit(20)
        )
      );
      console.log('Users fetched:', usersSnap.docs.length);
      
      console.log('Fetching DMs for friends:', Array.from(friendIds));
      const dmResults = await Promise.all(
        Array.from(friendIds).map(async (friendId) => {
          const dmId = [userId, friendId].sort().join('_');
          try {
            const dmSnap = await getDocs(
              query(
                collection(db, 'dms', dmId, 'messages'),
                orderBy('createdAt', 'desc'),
                limit(20)
              )
            );
            console.log(`DMs with ${friendId}:`, dmSnap.docs.length);
            return dmSnap.docs
              .map(doc => ({ id: doc.id, ...doc.data(), dmId, friendId }))
              .filter(msg => msg.text && msg.text.toLowerCase().includes(normalizedQuery));
          } catch (err) {
            console.warn(`Failed to search DMs with ${friendId}:`, err);
            return [];
          }
        })
      );

      // Filter and format results
      const messageResults = messagesSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data(), type: 'message' }))
        .filter(msg => msg.text && msg.text.toLowerCase().includes(normalizedQuery));
      
      console.log('Filtered message results:', messageResults.length);

      const userResults = usersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data(), type: 'user' }))
        .filter(user => 
          user.id !== userId && // Exclude current user
          user.displayName && 
          user.displayName.toLowerCase().includes(normalizedQuery)
        );
      
      console.log('Filtered user results:', userResults.length);

      const dmResultsFlat = dmResults.flat().slice(0, 15);
      console.log('Filtered DM results:', dmResultsFlat.length);

      const searchResults = {
        messages: messageResults.slice(0, 20),
        users: userResults.slice(0, 10),
        dms: dmResultsFlat
      };

      console.log('Final search results:', searchResults);

      // Cache results
      cacheRef.current.set(cacheKey, {
        data: searchResults,
        timestamp: Date.now()
      });

      // Clean old cache entries (keep last 10)
      if (cacheRef.current.size > 10) {
        const entries = Array.from(cacheRef.current.entries());
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        cacheRef.current = new Map(entries.slice(0, 10));
      }

      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
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
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  return { results, loading, error };
}
