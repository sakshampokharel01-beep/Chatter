import React, { useState, useEffect } from 'react';
import { auth, registerUser } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AuthScreen from './components/AuthScreen';
import ChatRoom from './components/ChatRoom';
import './App.css';

function App() {
  // undefined = still loading, null = signed out, object = signed in
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ?? null);
      if (currentUser && !currentUser.isAnonymous) {
        registerUser(currentUser);
      }
    });
    return unsubscribe;
  }, []);

  if (user === undefined) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <p className="loading-text">Loading Chatter…</p>
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
