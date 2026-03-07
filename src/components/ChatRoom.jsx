import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  setDoc,
  doc,
} from 'firebase/firestore';
import { db, auth, signOutUser, getDisplayName, isAdmin, safePhotoURL } from '../firebase';
import DirectMessages from './DirectMessages';
import AdminPanel from './AdminPanel';

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
function ChatMessage({ message, isOwn, hideAvatar, onDelete, onBlock, onRemove }) {
  const name = message.displayName || (message.isAnonymous ? 'Guest' : 'User');

  return (
    <div className={`message-row ${isOwn ? 'own' : 'other'}${hideAvatar ? ' hide-avatar' : ''}`}>
      <div className="msg-avatar">
        <Avatar displayName={name} photoURL={message.photoURL} size={30} />
      </div>

      <div className="msg-content">
        {!isOwn && !hideAvatar && (
          <span className="msg-sender">
            {name}
            {message.isAdmin && <span className="admin-tag" style={{marginLeft:'6px',fontSize:'10px',padding:'1px 6px'}}>Admin</span>}
          </span>
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
          {onBlock && !isOwn && (
            <button
              className="msg-delete-btn"
              onClick={() => onBlock(message.uid, name)}
              title="Block user"
              aria-label="Block user"
              style={{color:'#e05c6a'}}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            </button>
          )}
          {onRemove && !isOwn && (
            <button
              className="msg-delete-btn"
              onClick={() => onRemove(message.uid, name)}
              title="Remove user from site"
              aria-label="Remove user"
              style={{color:'#e05c6a'}}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="17" y1="8" x2="23" y2="14"/>
                <line x1="23" y1="8" x2="17" y2="14"/>
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
  const isSuperAdmin = isAdmin(user);
  const [adminUser, setAdminUser] = useState(isSuperAdmin);

  // Real-time admin status — super-admin is always admin; others check the admins collection
  useEffect(() => {
    if (isSuperAdmin) { setAdminUser(true); return; }
    return onSnapshot(collection(db, 'admins'), snap => {
      setAdminUser(snap.docs.some(d => d.id === user.uid));
    }, (err) => {
      console.error('Admin status snapshot error:', err);
    });
  }, [user.uid, isSuperAdmin]);

  /* ── Delete a global message (admin only) ── */
  const deleteMessage = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, []);

  /* ── Block a user (admin only) ── */
  const blockUser = useCallback(async (uid, name) => {
    if (!window.confirm(`Block "${name}"? They will be unable to send any messages.`)) return;
    try {
      await setDoc(doc(db, 'blockedUsers', uid), {
        blockedAt: serverTimestamp(),
        blockedBy: user.uid,
      });
    } catch (err) {
      console.error('Block failed:', err);
    }
  }, [user.uid]);

  /* ── Remove a user (admin only) ── */
  const removeUser = useCallback(async (uid, name) => {
    if (!window.confirm(`Remove "${name}" from Chatter? They will be instantly signed out and their messages deleted.`)) return;
    try {
      const msgsSnap = await getDocs(query(collection(db, 'messages'), where('uid', '==', uid)));
      await Promise.all([
        ...msgsSnap.docs.map(d => deleteDoc(d.ref)),
        setDoc(doc(db, 'deletedUsers', uid), { deletedAt: serverTimestamp(), deletedBy: user.uid }),
        setDoc(doc(db, 'blockedUsers', uid), { blockedAt: serverTimestamp(), blockedBy: user.uid }),
      ]);
    } catch (err) {
      console.error('Remove failed:', err);
    }
  }, [user.uid]);

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
    }, (err) => {
      console.error('Global chat snapshot error:', err);
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
        isAdmin: adminUser,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputText(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [inputText, sending, user, displayName, adminUser]);

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
          <span className="header-logo" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="14" fill="#5b8dee"/><path d="M14 16h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H26l-5 4v-4h-7a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2z" fill="#fff" fillOpacity=".92"/><circle cx="19" cy="24" r="1.5" fill="#5b8dee"/><circle cx="24" cy="24" r="1.5" fill="#5b8dee"/><circle cx="29" cy="24" r="1.5" fill="#5b8dee"/></svg>
          </span>
          <span className="header-title">Chatter</span>
          {adminUser && <span className="admin-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-1px',marginRight:'3px'}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Admin</span>}
        </div>

        <div className="header-tabs">
          <button
            className={`tab-btn${activeTab === 'global' ? ' active' : ''}`}
            onClick={() => setActiveTab('global')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Global
          </button>
          <button
            className={`tab-btn${activeTab === 'dms' ? ' active' : ''}`}
            onClick={() => !isGuest && setActiveTab('dms')}
            disabled={isGuest}
            title={isGuest ? 'Sign in with Google to use Direct Messages' : 'Direct Messages'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            DMs{isGuest ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:'4px',verticalAlign:'-1px'}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> : ''}
          </button>
          {adminUser && (
            <button
              className={`tab-btn${activeTab === 'admin' ? ' active' : ''}`}
              onClick={() => setActiveTab('admin')}
              title="Admin Panel"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Users
            </button>
          )}
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
                <span className="welcome-icon" aria-hidden="true">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5b8dee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </span>
                <strong>Welcome to Chatter!</strong>
                <p>Be the first to say hello to the world.</p>
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
                    onBlock={adminUser ? blockUser : null}
                    onRemove={adminUser ? removeUser : null}
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
            <div className="crafted-footer">Crafted by <a href="https://sakshampokharel.me" target="_blank" rel="noopener noreferrer">Saksham Pokharel</a></div>
          </div>
        </>
      )}

      {/* ── Direct Messages ── */}
      {activeTab === 'dms' && <DirectMessages user={user} />}

      {/* ── Admin Panel ── */}
      {activeTab === 'admin' && adminUser && <AdminPanel adminUid={user.uid} isSuperAdmin={isSuperAdmin} />}
    </div>
  );
}
