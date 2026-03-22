function App() {
  // undefined = still loading, null = signed out, object = signed in
  const [user, setUser] = useState(undefined);
  const [removed, setRemoved] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Subscribe to auth state. getRedirectResult is handled automatically
    // by the Firebase SDK before onAuthStateChanged fires.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ?? null);
      if (currentUser) {
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

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light' : '';
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (user === undefined) {
    return (
      <div className={`loading-screen${theme === 'light' ? ' light' : ''}`}>
        <div className="loader" />
        <p className="loading-text">Loading Chatter…</p>
        <button
          className="theme-toggle-btn"
          onClick={handleToggleTheme}
          style={{marginTop: 16, padding: '8px 16px', borderRadius: 6, border: 'none', background: theme === 'light' ? '#22232a' : '#e2e6ed', color: theme === 'light' ? '#fff' : '#22232a', fontWeight: 600, cursor: 'pointer'}}
        >
          Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme
        </button>
      </div>
    );
  }

  if (removed) {
    return (
      <div className={`loading-screen${theme === 'light' ? ' light' : ''}`}>
        <p className="loading-text" style={{color:'#e05c6a'}}>Your account has been removed by an admin.</p>
        <button
          className="theme-toggle-btn"
          onClick={handleToggleTheme}
          style={{marginTop: 16, padding: '8px 16px', borderRadius: 6, border: 'none', background: theme === 'light' ? '#22232a' : '#e2e6ed', color: theme === 'light' ? '#fff' : '#22232a', fontWeight: 600, cursor: 'pointer'}}
        >
          Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme
        </button>
      </div>
    );
  }

  return (
    <div className={`app${theme === 'light' ? ' light' : ''}`}>
      <button
        className="theme-toggle-btn"
        onClick={handleToggleTheme}
        style={{position: 'fixed', top: 12, right: 12, zIndex: 1000, padding: '8px 16px', borderRadius: 6, border: 'none', background: theme === 'light' ? '#22232a' : '#e2e6ed', color: theme === 'light' ? '#fff' : '#22232a', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}
      >
        Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme
      </button>
      {user ? <ChatRoom user={user} /> : <AuthScreen />}
    </div>
  );
}

export default App;

