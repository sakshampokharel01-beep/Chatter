import React, { useState, useEffect } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { signOutUser } from '../firebase';

export default function EmailVerificationScreen({ user, onVerified }) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(false);

  // Auto-check verification status every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await user.reload();
        if (user.emailVerified) {
          onVerified();
        }
      } catch (err) {
        console.error('Error checking verification:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, onVerified]);

  const handleResendEmail = async () => {
    setSending(true);
    setMessage('');
    try {
      await sendEmailVerification(user);
      setMessage('✅ Verification email sent! Check your inbox.');
    } catch (err) {
      if (err.code === 'auth/too-many-requests') {
        setMessage('⚠️ Too many requests. Please wait a few minutes.');
      } else {
        setMessage('❌ Failed to send email. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleCheckNow = async () => {
    setChecking(true);
    setMessage('');
    try {
      await user.reload();
      if (user.emailVerified) {
        setMessage('✅ Email verified! Redirecting...');
        setTimeout(() => onVerified(), 1000);
      } else {
        setMessage('⚠️ Email not verified yet. Please check your inbox.');
      }
    } catch (err) {
      setMessage('❌ Error checking verification status.');
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
  };

  return (
    <div className="auth-screen">
      <div className="auth-orb auth-orb--1" />
      <div className="auth-orb auth-orb--2" />
      <div className="auth-orb auth-orb--3" />

      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-logo" aria-hidden="true">
          <div className="auth-logo-icon">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#5b8dee" strokeWidth="1.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <span className="auth-logo-ring" />
        </div>

        <h1 className="auth-title" style={{ fontSize: '28px' }}>Verify Your Email</h1>
        <p className="auth-subtitle" style={{ marginBottom: '24px' }}>
          We sent a verification link to<br />
          <strong style={{ color: '#5b8dee' }}>{user.email}</strong>
        </p>

        <div style={{ 
          background: 'rgba(91, 141, 238, 0.08)', 
          border: '1px solid rgba(91, 141, 238, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <p style={{ fontSize: '14px', color: '#c8cfe0', lineHeight: '1.6', margin: 0 }}>
            📧 Check your inbox (and spam folder)<br />
            🔗 Click the verification link<br />
            ✅ Come back here and click "I've Verified"
          </p>
        </div>

        {message && (
          <div className={message.includes('✅') ? 'success-msg' : 'error-msg'} style={{ marginBottom: '16px' }}>
            {message}
          </div>
        )}

        <div className="auth-buttons" style={{ gap: '12px' }}>
          <button 
            className="btn-google" 
            style={{ background: '#5b8dee', color: '#fff' }}
            onClick={handleCheckNow}
            disabled={checking}
          >
            {checking ? (
              <div className="btn-spinner btn-spinner-light" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            I've Verified My Email
          </button>

          <button 
            className="btn-guest"
            onClick={handleResendEmail}
            disabled={sending}
          >
            {sending ? (
              <div className="btn-spinner btn-spinner-light" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            )}
            Resend Verification Email
          </button>

          <button 
            className="btn-guest"
            onClick={handleSignOut}
            style={{ marginTop: '8px' }}
          >
            Sign Out
          </button>
        </div>

        <p className="auth-disclaimer" style={{ marginTop: '24px' }}>
          Didn't receive the email? Check your spam folder or click "Resend" above.
        </p>
      </div>
    </div>
  );
}
