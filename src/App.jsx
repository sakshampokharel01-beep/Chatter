import React, { useState, useEffect, lazy, Suspense } from 'react';
import './App.css';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, registerUser, signOutUser } from './firebase';
import { useUserPresence } from './hooks/useUserPresence';

// Lazy load heavy components for better initial load
const LandingPage = lazy(() => import('./components/LandingPage'));
const AuthScreen = lazy(() => import('./components/AuthScreen'));
const ChatRoom = lazy(() => import('./components/ChatRoom'));
const EmailVerificationScreen = lazy(() => import('./components/EmailVerificationScreen'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="loading-screen">
    <div className="loader" />
    <p className="loading-text">Loading…</p>
  </div>
);

function App() {
  // undefined = still loading, null = signed out, object = signed in
  const [user, setUser] = useState(undefined);
  const [removed, setRemoved] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);

  // Track user online/offline status
  useUserPresence(user);

  useEffect(() => {
    // Subscribe to auth state. getRedirectResult is handled automatically
    // by the Firebase SDK before onAuthStateChanged fires.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ?? null);
      if (currentUser) {
        // Check if email verification is needed
        // Skip verification check for anonymous users and Google sign-in
        const isEmailPasswordUser = currentUser.providerData.some(
          provider => provider.providerId === 'password'
        );
        
        if (isEmailPasswordUser && !currentUser.emailVerified) {
          setNeedsVerification(true);
        } else {
          setNeedsVerification(false);
          registerUser(currentUser);
          setShowLanding(false);
        }
      } else {
        setNeedsVerification(false);
      }
    });
    return unsubscribe;
  }, []);

  // Real-time listener: if admin deletes this user, force sign-out immediately
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'deletedUsers', user.uid), (snap) => {
      if (snap.exists()) {
        setRemoved(true);
        signOutUser();
      }
    });
    return unsub;
  }, [user?.uid]);

  // Manage body scroll class
  useEffect(() => {
    if (user && !needsVerification) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [user, needsVerification]);

  const handleVerified = async () => {
    // Reload user to get fresh emailVerified status
    await user.reload();
    if (user.emailVerified) {
      setNeedsVerification(false);
      registerUser(user);
      setShowLanding(false);
    }
  };

  if (user === undefined) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <p className="loading-text">Loading Chatter…</p>
      </div>
    );
  }

  if (removed) {
    return (
      <div className="loading-screen">
        <p className="loading-text" style={{color:'#e05c6a'}}>Your account has been removed by an admin.</p>
      </div>
    );
  }

  // Show email verification screen if needed
  if (user && needsVerification) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <EmailVerificationScreen user={user} onVerified={handleVerified} />
      </Suspense>
    );
  }

  // Show landing page for first-time visitors
  if (showLanding && !user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LandingPage onGetStarted={() => setShowLanding(false)} />
      </Suspense>
    );
  }

  return (
    <div className="app">
      <Suspense fallback={<LoadingFallback />}>
        {user ? <ChatRoom user={user} /> : <AuthScreen onBack={() => setShowLanding(true)} />}
      </Suspense>
    </div>
  );
}

export default App;

