import React, { useState, useEffect } from 'react';
import { signInWithGoogle, signInWithApple, signInAsGuest, signUpWithEmail, signInWithEmail } from '../firebase';
import '../styles/AuthScreenNew.css';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.89 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

export default function AuthScreenNew({ onBack }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading('email');
    setError('');
    
    try {
      if (mode === 'signup') {
        await signUpWithEmail(name, email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading('google');
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading('apple');
    setError('');
    try {
      await signInWithApple();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Apple sign-in failed');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="auth-new-screen">
      {/* City Skyline SVG Background */}
      <div className="city-skyline">
        <svg viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" className="skyline-svg">
          {/* Buildings with glowing windows */}
          <rect x="50" y="200" width="80" height="200" fill="#0a0f1a" />
          <rect x="55" y="210" width="8" height="12" fill="#3b82f6" opacity="0.8" className="window" />
          <rect x="68" y="210" width="8" height="12" fill="#3b82f6" opacity="0.6" className="window" />
          <rect x="81" y="210" width="8" height="12" fill="#3b82f6" opacity="0.9" className="window" />
          <rect x="94" y="210" width="8" height="12" fill="#3b82f6" opacity="0.7" className="window" />
          <rect x="107" y="210" width="8" height="12" fill="#3b82f6" opacity="0.8" className="window" />
          
          <rect x="55" y="230" width="8" height="12" fill="#3b82f6" opacity="0.7" className="window" />
          <rect x="68" y="230" width="8" height="12" fill="#3b82f6" opacity="0.9" className="window" />
          <rect x="81" y="230" width="8" height="12" fill="#3b82f6" opacity="0.6" className="window" />
          <rect x="94" y="230" width="8" height="12" fill="#3b82f6" opacity="0.8" className="window" />
          <rect x="107" y="230" width="8" height="12" fill="#3b82f6" opacity="0.7" className="window" />

          <rect x="150" y="150" width="100" height="250" fill="#0d1219" />
          <rect x="160" y="165" width="10" height="15" fill="#3b82f6" opacity="0.9" className="window" />
          <rect x="175" y="165" width="10" height="15" fill="#3b82f6" opacity="0.7" className="window" />
          <rect x="190" y="165" width="10" height="15" fill="#3b82f6" opacity="0.8" className="window" />
          <rect x="205" y="165" width="10" height="15" fill="#3b82f6" opacity="0.6" className="window" />
          <rect x="220" y="165" width="10" height="15" fill="#3b82f6" opacity="0.9" className="window" />

          <rect x="270" y="180" width="90" height="220" fill="#0a0f1a" />
          <rect x="380" y="220" width="70" height="180" fill="#0d1219" />
          <rect x="470" y="160" width="110" height="240" fill="#0a0f1a" />
          <rect x="600" y="190" width="85" height="210" fill="#0d1219" />
          <rect x="700" y="140" width="95" height="260" fill="#0a0f1a" />
          <rect x="810" y="200" width="75" height="200" fill="#0d1219" />
          <rect x="900" y="170" width="100" height="230" fill="#0a0f1a" />
          <rect x="1020" y="210" width="80" height="190" fill="#0d1219" />
        </svg>
      </div>

      {/* Floating Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* Animated Stars */}
      <div className="stars">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="auth-new-container">
        {/* Left Hero Section */}
        <div className="auth-hero">
          <div className="hero-content">
            <h1 className="hero-title">Welcome back to Chatter</h1>
            <p className="hero-subtitle">
              Connect with friends, join conversations, and stay in touch with people around the world.
            </p>

            <div className="user-stats">
              <div className="avatar-stack">
                <div className="avatar" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>A</div>
                <div className="avatar" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>S</div>
                <div className="avatar" style={{background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'}}>M</div>
                <div className="avatar" style={{background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'}}>R</div>
              </div>
              <div className="stats-text">
                <div className="stats-number">2,400+</div>
                <div className="stats-label">users online</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Login Card */}
        <div className="auth-glass-card">
          <div className="shimmer-border"></div>
          
          <div className="card-header">
            <h2 className="card-title">{mode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
            <p className="card-subtitle">
              {mode === 'signin' ? 'Enter your credentials to continue' : 'Join thousands of users worldwide'}
            </p>
          </div>

          {error && (
            <div className="error-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="auth-form">
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="name">Display Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required={mode === 'signup'}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {mode === 'signin' && (
              <div className="form-footer">
                <button type="button" className="forgot-link">
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading === 'email'}>
              {loading === 'email' ? (
                <div className="spinner"></div>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <div className="social-buttons">
            <button
              className="social-btn"
              onClick={handleGoogleSignIn}
              disabled={loading === 'google'}
            >
              {loading === 'google' ? <div className="spinner"></div> : <GoogleIcon />}
              Google
            </button>
            <button
              className="social-btn"
              onClick={handleAppleSignIn}
              disabled={loading === 'apple'}
            >
              {loading === 'apple' ? <div className="spinner"></div> : <AppleIcon />}
              Apple
            </button>
          </div>

          <div className="switch-mode">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button onClick={() => setMode('signup')}>Sign up</button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => setMode('signin')}>Sign in</button>
              </>
            )}
          </div>

          {onBack && (
            <button className="back-btn" onClick={onBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
