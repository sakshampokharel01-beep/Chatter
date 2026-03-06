import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db, auth, signOutUser, getDisplayName, isAdmin, safePhotoURL } from '../firebase';
import DirectMessages from './DirectMessages';

const MAX_CHARS = 500;
const MESSAGES_LIMIT = 150;
const SEND_COOLDOWN_MS = 1000; // prevent spam: 1 message per second

/* ── Helpers ──────────────────────────────────────────────── */
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ── Avatar ───────────────────────────────────────────────── */
function Avatar({ displayName, photoURL, size = 30 }) {
  const initial = (displayName || '?').charAt(0).toUpperCase();
  const [imgError, setImgError] = useState(false);

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={displayName}
        className="msg-avatar"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div
      className="msg-avatar-placeholder"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-label={displayName}
    >
      {initial}
    </div>
  );
}

/* ── Single Chat Message ──────────────────────────────────── */
function ChatMessage({ message, isOwn, hideAvatar, onDelete }) {
  const name = message.displayName || (message.isAnonymous ? 'Guest' : 'User');

  return (
    <div className={`message-row ${isOwn ? 'own' : 'other'}${hideAvatar ? ' hide-avatar' : ''}`}>
      <div className="msg-avatar">
        <Avatar displayName={name} photoURL={message.photoURL} size={30} />
      </div>

      <div className="msg-content">
        {!isOwn && !hideAvatar && (
          <span className="msg-sender">{name}</span>
        )}
        <div className="msg-bubble-wrap">
          <div className="msg-bubble">{message.text}</div>
          {onDelete && (
            <button
              className="msg-delete-btn"
              onClick={() => onDelete(message.id)}
              title="Delete message"
              aria-label="Delete message"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
        <span className="msg-time">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}

/* ── Send Icon ────────────────────────────────────────────── */
function SendIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Chat Room (main) ─────────────────────────────────────── */
export default function ChatRoom({ user }) {
  const [activeTab, setActiveTab] = useState('global');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const lastSentRef = useRef(0);

  const displayName = getDisplayName(user);
  const isGuest = user.isAnonymous;
  const adminUser = isAdmin(user);

  /* ── Delete a global message (admin only) ── */
  const deleteMessage = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, []);

  /* ── Subscribe to Firestore messages ── */
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(MESSAGES_LIMIT),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setLoadingMsgs(false);
    });

    return unsubscribe;
  }, []);

  /* ── Auto-scroll to latest message ── */
  useEffect(() => {
    const el = messagesEndRef.current;
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Send a message ── */
  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    // client-side rate limit
    const now = Date.now();
    if (now - lastSentRef.current < SEND_COOLDOWN_MS) return;
    lastSentRef.current = now;

    setSending(true);
    setInputText('');

    try {
      const cu = auth.currentUser;
      await addDoc(collection(db, 'messages'), {
        text: text.slice(0, MAX_CHARS),
        uid: user.uid,
        displayName: (cu?.displayName || displayName).slice(0, 64),
        photoURL: safePhotoURL(cu?.photoURL),
        isAnonymous: user.isAnonymous ?? false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputText(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [inputText, sending, user, displayName]);

  /* ── Keyboard handler ── */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ── Character count colour ── */
  const charCount = inputText.length;
  const charClass = charCount > MAX_CHARS * 0.9
    ? 'char-count danger'
    : charCount > MAX_CHARS * 0.75
      ? 'char-count warn'
      : 'char-count';

  /* ── Render ── */
  return (
    <div className="chat-room">
      {/* ── Header ── */}
      <header className="chat-header">
        <div className="header-brand">
          <span className="header-logo" role="img" aria-label="chat">💬</span>
          <span className="header-title">Chatter</span>
          {adminUser && <span className="admin-badge">🛡️ Admin</span>}
        </div>

        <div className="header-tabs">
          <button
            className={`tab-btn${activeTab === 'global' ? ' active' : ''}`}
            onClick={() => setActiveTab('global')}
          >
            🌍 Global
          </button>
          <button
            className={`tab-btn${activeTab === 'dms' ? ' active' : ''}`}
            onClick={() => !isGuest && setActiveTab('dms')}
            disabled={isGuest}
            title={isGuest ? 'Sign in with Google to use Direct Messages' : 'Direct Messages'}
          >
            💬 DMs{isGuest ? ' 🔒' : ''}
          </button>
        </div>

        <div className="header-user">
          {user.photoURL ? (
            <img src={user.photoURL} alt={displayName} className="user-avatar" />
          ) : (
            <div className="user-avatar-placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="user-name" title={displayName}>{displayName}</span>
          <button
            className="btn-signout"
            onClick={signOutUser}
            aria-label="Sign out"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Global Chat ── */}
      {activeTab === 'global' && (
        <>
          <div className="messages-container" ref={containerRef} aria-live="polite">
            {loadingMsgs ? (
              <div className="welcome-msg">
                <div className="loader" />
              </div>
            ) : messages.length === 0 ? (
              <div className="welcome-msg">
                <span className="welcome-icon" role="img" aria-label="globe">🌍</span>
                <strong>Welcome to Chatter!</strong>
                <p>Be the first to say hello to the world 👋</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isOwn = msg.uid === user.uid;
                const prev = messages[idx - 1];
                const hideAvatar = !isOwn && prev?.uid === msg.uid;
                return (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isOwn={isOwn}
                    hideAvatar={hideAvatar}
                    onDelete={adminUser ? deleteMessage : null}
                  />
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <div className="input-wrapper">
              <textarea
                ref={inputRef}
                className="msg-input"
                placeholder="Say something to the world…"
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={handleKeyDown}
                disabled={sending}
                autoFocus
                aria-label="Message input"
              />

              {charCount > 0 && (
                <span className={charClass} aria-label={`${charCount} of ${MAX_CHARS} characters`}>
                  {charCount}/{MAX_CHARS}
                </span>
              )}

              <button
                className="btn-send"
                onClick={sendMessage}
                disabled={!inputText.trim() || sending}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </div>
            <div className="crafted-footer">✦ Crafted by <strong>Saksham Pokharel</strong></div>
          </div>
        </>
      )}

      {/* ── Direct Messages ── */}
      {activeTab === 'dms' && <DirectMessages user={user} />}
    </div>
  );
}
