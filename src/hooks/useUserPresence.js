import { useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook to track user online/offline status and update lastSeen
 * Updates status every 30 seconds while user is active
 * Sets offline status when user closes tab/browser or becomes inactive
 */
export function useUserPresence(user) {
  const intervalRef = useRef(null);
  const isGuest = user?.isAnonymous;
  const isSettingOfflineRef = useRef(false);

  useEffect(() => {
    if (!user || isGuest) return; // Don't track guest users

    const userRef = doc(db, 'users', user.uid);

    // Set user as online when component mounts
    const setOnline = async () => {
      try {
        isSettingOfflineRef.current = false;
        await updateDoc(userRef, {
          online: true,
          lastSeen: serverTimestamp(),
        });
      } catch (err) {
        // Silently fail - not critical
      }
    };

    // Set user as offline
    const setOffline = async () => {
      if (isSettingOfflineRef.current) return; // Prevent duplicate calls
      isSettingOfflineRef.current = true;
      
      try {
        await updateDoc(userRef, {
          online: false,
          lastSeen: serverTimestamp(),
        });
      } catch (err) {
        // Silently fail - not critical
      }
    };

    // Set online immediately
    setOnline();

    // Update lastSeen every 30 seconds while user is active
    intervalRef.current = setInterval(() => {
      // Only update if window is visible and focused
      if (!document.hidden && document.hasFocus()) {
        updateDoc(userRef, {
          online: true,
          lastSeen: serverTimestamp(),
        }).catch(() => {
          // Silently fail - not critical
        });
      }
    }, 30000); // 30 seconds

    // Set offline when user closes tab/browser
    const handleBeforeUnload = () => {
      setOffline();
    };

    // Set offline when user becomes inactive (hidden tab or loses focus)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else if (document.hasFocus()) {
        setOnline();
      }
    };
    
    // Handle window focus/blur
    const handleFocus = () => {
      if (!document.hidden) {
        setOnline();
      }
    };
    
    const handleBlur = () => {
      // Set offline after a short delay to avoid flickering
      setTimeout(() => {
        if (document.hidden || !document.hasFocus()) {
          setOffline();
        }
      }, 2000);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Cleanup
    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      setOffline();
    };
  }, [user, isGuest]);
}
