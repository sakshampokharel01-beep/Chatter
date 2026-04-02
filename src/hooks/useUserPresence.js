import { useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp, onDisconnect } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook to track user online/offline status and update lastSeen
 * Updates status every 30 seconds while user is active
 * Sets offline status when user closes tab/browser
 */
export function useUserPresence(user) {
  const intervalRef = useRef(null);
  const isGuest = user?.isAnonymous;

  useEffect(() => {
    if (!user || isGuest) return; // Don't track guest users

    const userRef = doc(db, 'users', user.uid);

    // Set user as online when component mounts
    const setOnline = async () => {
      try {
        await updateDoc(userRef, {
          online: true,
          lastSeen: serverTimestamp(),
        });
      } catch (err) {
        console.error('Failed to set online status:', err);
      }
    };

    // Set user as offline
    const setOffline = async () => {
      try {
        await updateDoc(userRef, {
          online: false,
          lastSeen: serverTimestamp(),
        });
      } catch (err) {
        console.error('Failed to set offline status:', err);
      }
    };

    // Set online immediately
    setOnline();

    // Update lastSeen every 30 seconds while user is active
    intervalRef.current = setInterval(() => {
      updateDoc(userRef, {
        online: true,
        lastSeen: serverTimestamp(),
      }).catch(err => {
        console.error('Failed to update presence:', err);
      });
    }, 30000); // 30 seconds

    // Set offline when user closes tab/browser
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status update
      navigator.sendBeacon && setOffline();
    };

    // Set offline when user becomes inactive (hidden tab)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setOffline();
    };
  }, [user, isGuest]);
}
