import React, { useState, useEffect } from 'react';
import { auth, registerUser, signOutUser } from './firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import AuthScreen from './components/AuthScreen';
import ChatRoom from './components/ChatRoom';
import './App.css';

function App() {
  // undefined = still loading, null = signed out, object = signed in
  const [user, setUser] = useState(undefined);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    // Subscribe to auth state. getRedirectResult is handled automatically
    // by the Firebase SDK before onAuthStateChanged fires.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ?? null);
      if (currentUser && !currentUser.isAnonymous) {
        registerUser(currentUser);
      }
    });
    return unsubscribe;
  }, []);

  // Real-time listener: if admin deletes this user, force sign-out immediately
  // Super-admin is always exempt — they can never be locked out
  useEffect(() => {
    if (!user) return;
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();
    if (user.email && user.email.toLowerCase() === adminEmail) return; // super-admin is immune
    const unsub = onSnapshot(doc(db, 'deletedUsers', user.uid), (snap) => {
      if (snap.exists()) {
        setRemoved(true);
        signOutUser();
      }
    });
    return unsub;
  }, [user?.uid]);

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

  return (
    <div className="app">
      {user ? <ChatRoom user={user} /> : <AuthScreen />}
    </div>
  );
}

export default App;
