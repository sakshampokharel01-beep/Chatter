import React, { useState, useEffect } from 'react';
import './App.css';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, registerUser, signOutUser } from './firebase';
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import ChatRoom from './components/ChatRoom';

function App() {
  // undefined = still loading, null = signed out, object = signed in
  const [user, setUser] = useState(undefined);
  const [removed, setRemoved] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    // Subscribe to auth state. getRedirectResult is handled automatically
    // by the Firebase SDK before onAuthStateChanged fires.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ?? null);
      if (currentUser) {
        registerUser(currentUser);
        setShowLanding(false);
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
    if (user) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [user]);

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

  // Show landing page for first-time visitors
  if (showLanding && !user) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <div className="app">
      {user ? <ChatRoom user={user} /> : <AuthScreen onBack={() => setShowLanding(true)} />}
    </div>
  );
}

export default App;

