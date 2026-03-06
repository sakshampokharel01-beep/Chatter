import React, { useState, useEffect, useRef } from 'react';
import { signInWithGoogle, signInAsGuest, signUpWithEmail, signInWithEmail } from '../firebase';

/* ── EyeIcon ─────────────────────────────────────────── */
function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

/* ── Email error mapper ───────────────────────────────── */
function mapEmailError(code) {
  return ({
    'auth/email-already-in-use':   'That email is already registered. Try signing in.',
    'auth/invalid-email':          'Invalid email address.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/user-not-found':         'No account found. Try signing up.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/invalid-credential':     'Incorrect email or password.',
    'auth/too-many-requests':      'Too many attempts — try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/operation-not-allowed':  'Email/Password sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in method → Email/Password → Enable.',
  })[code] || `Error (${code})`;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.89 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function AuthScreen() {
  const [loading, setLoading] = useState(null);
  const [error, setError]   = useState('');
  const [step, setStep]     = useState('home');   // 'home' | 'guestName'
  const [guestName, setGuestName] = useState('');
  const [mode, setMode]     = useState('signin'); // 'signin' | 'signup'

  // email form
  const [emailName, setEmailName] = useState('');
  const [emailAddr, setEmailAddr] = useState('');
  const [emailPass, setEmailPass] = useState('');
  const [showPass,  setShowPass]  = useState(false);

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (step === 'guestName') setTimeout(() => nameInputRef.current?.focus(), 50);
  }, [step]);

  const goHome = () => { setStep('home'); setError(''); };
  const switchMode = (m) => { setMode(m); setError(''); setEmailPass(''); };

  // ── Google ─────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setLoading('google'); setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        const msgs = {
          'auth/popup-blocked':         'Popup blocked. Allow popups for localhost and retry.',
          'auth/unauthorized-domain':   'Localhost not authorized. Check Firebase → Auth → Settings → Authorized domains.',
          'auth/operation-not-allowed': 'Google sign-in not enabled in Firebase.',
        };
        setError(msgs[err.code] || `Error (${err.code}): ${err.message}`);
      }
      setLoading(null);
    }
  };

  // ── Email Sign Up ──────────────────────────────────────
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!emailAddr.trim() || !emailPass) return;
    setLoading('email'); setError('');
    try {
      await signUpWithEmail(emailName, emailAddr.trim(), emailPass);
    } catch (err) {
      setError(mapEmailError(err.code));
      setLoading(null);
    }
  };

  // ── Email Sign In ──────────────────────────────────────
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!emailAddr.trim() || !emailPass) return;
    setLoading('email'); setError('');
    try {
      await signInWithEmail(emailAddr.trim(), emailPass);
    } catch (err) {
      setError(mapEmailError(err.code));
      setLoading(null);
    }
  };

  // ── Guest ──────────────────────────────────────────────────
  const handleGuestContinue = async () => {
    setLoading('guest'); setError('');
    try {
      await signInAsGuest(guestName);
    } catch (err) {
      setError('Could not join as guest. Please try again.');
      setLoading(null);
    }
  };

  const busy = !!loading;

  // ── Step: guest name ─────────────────────────────────────
  if (step === 'guestName') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <span className="auth-logo" role="img" aria-label="Guest">👤</span>
          <h1 className="auth-title" style={{ fontSize: '28px' }}>Choose a name</h1>
          <p className="auth-subtitle">This is how others will see you in the chat.</p>
          {error && <div className="error-msg" role="alert">{error}</div>}
          <div className="guest-name-form">
            <input
              ref={nameInputRef}
              className="guest-name-input"
              type="text"
              placeholder="e.g. CoolExplorer99"
              value={guestName}
              maxLength={24}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !busy) handleGuestContinue(); }}
              disabled={busy}
              aria-label="Guest display name"
            />
            <span className="guest-name-hint">Max 24 chars · Blank = random name</span>
          </div>
          <div className="auth-buttons" style={{ marginTop: '20px' }}>
            <button
              className="btn-google"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}
              onClick={handleGuestContinue}
              disabled={busy}
            >
              {loading === 'guest'
                ? <div className="btn-spinner btn-spinner-light" aria-hidden="true" />
                : <UserIcon />}
              Enter Chat
            </button>
            <button className="btn-guest" onClick={goHome} disabled={busy}>← Back</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: home ───────────────────────────────────────────
  const isSignUp = mode === 'signup';
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="14" fill="url(#logo-grad)"/>
            <path d="M14 16h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H26l-5 4v-4h-7a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2z" fill="white" fillOpacity="0.92"/>
            <circle cx="19" cy="24" r="1.5" fill="url(#logo-grad)"/>
            <circle cx="24" cy="24" r="1.5" fill="url(#logo-grad)"/>
            <circle cx="29" cy="24" r="1.5" fill="url(#logo-grad)"/>
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/>
                <stop offset="1" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className="auth-title">Chatter</h1>
        <p className="auth-subtitle">
          Connect with people around the globe<br />in real-time, for free.
        </p>

        {/* Tab toggle */}
        <div className="auth-tabs" role="tablist">
          <button
            className={`auth-tab${!isSignUp ? ' active' : ''}`}
            role="tab"
            aria-selected={!isSignUp}
            onClick={() => switchMode('signin')}
            disabled={busy}
          >
            Sign In
          </button>
          <button
            className={`auth-tab${isSignUp ? ' active' : ''}`}
            role="tab"
            aria-selected={isSignUp}
            onClick={() => switchMode('signup')}
            disabled={busy}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="error-msg" role="alert">{error}</div>}

        {/* ── Email form ── */}
        <form
          className="email-form"
          onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn}
          noValidate
        >
          {isSignUp && (
            <div className="email-field">
              <label className="email-label" htmlFor="auth-name">Display Name</label>
              <input
                id="auth-name"
                className="email-input"
                type="text"
                placeholder="How should we call you?"
                value={emailName}
                onChange={e => setEmailName(e.target.value)}
                maxLength={32}
                disabled={busy}
                autoComplete="name"
              />
            </div>
          )}

          <div className="email-field">
            <label className="email-label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="email-input"
              type="email"
              placeholder="you@example.com"
              value={emailAddr}
              onChange={e => setEmailAddr(e.target.value)}
              disabled={busy}
              autoComplete={isSignUp ? 'email' : 'username'}
              required
            />
          </div>

          <div className="email-field">
            <label className="email-label" htmlFor="auth-pass">Password</label>
            <div className="email-pass-wrap">
              <input
                id="auth-pass"
                className="email-input"
                type={showPass ? 'text' : 'password'}
                placeholder={isSignUp ? 'Min 6 characters' : 'Your password'}
                value={emailPass}
                onChange={e => setEmailPass(e.target.value)}
                disabled={busy}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPass} />
              </button>
            </div>
          </div>

          <button
            className="btn-email-submit"
            type="submit"
            disabled={busy || !emailAddr.trim() || !emailPass}
          >
            {loading === 'email'
              ? <div className="btn-spinner btn-spinner-light" aria-hidden="true" />
              : isSignUp ? '🚀 Create Account' : '→ Sign In'}
          </button>
        </form>

        <div className="divider" aria-hidden="true"><span>or</span></div>

        <div className="auth-buttons">
          <button className="btn-google" onClick={handleGoogleSignIn} disabled={busy}>
            {loading === 'google' ? <div className="btn-spinner" aria-hidden="true" /> : <GoogleIcon />}
            {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
          </button>

          {!isSignUp && (
            <button className="btn-guest" onClick={() => { setStep('guestName'); setError(''); }} disabled={busy}>
              <UserIcon />
              Join as Guest
            </button>
          )}
        </div>

        <p className="auth-disclaimer">
          {isSignUp
            ? 'Already have an account? Switch to Sign In above.'
            : 'Guest sessions are temporary. Messages are visible to all users.'}
        </p>
        <p className="crafted-footer">✦ Crafted by <strong>Saksham Pokharel</strong></p>
      </div>
    </div>
  );
}
