import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db, auth, getDisplayName, getDMId, safePhotoURL } from '../firebase';

const DM_LIMIT = 100;
const MAX_CHARS = 500;
const SEND_COOLDOWN_MS = 1000;

/* ── Avatar ───────────────────────────────────────────────── */
function Avatar({ displayName, photoURL, size = 32 }) {
  const initial = (displayName || '?').charAt(0).toUpperCase();
  const [imgError, setImgError] = useState(false);

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={displayName}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', border: '1.5px solid rgba(99,102,241,0.3)', flexShrink: 0,
        }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div
      className="msg-avatar-placeholder"
      style={{ width: size, height: size, fontSize: size * 0.42, flexShrink: 0 }}
    >
      {initial}
    </div>
  );
}

/* ── Time formatter ───────────────────────────────────────── */
function formatTime(ts) {
  if (!ts) return '';
  return (ts.toDate ? ts.toDate() : new Date(ts))
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ── DM Message ───────────────────────────────────────────── */
function DmMessage({ message, isOwn, hideAvatar }) {
  const name = message.displayName || 'User';
  return (
    <div className={`message-row ${isOwn ? 'own' : 'other'}${hideAvatar ? ' hide-avatar' : ''}`}>
      <div className="msg-avatar">
        <Avatar displayName={name} photoURL={message.photoURL} size={30} />
      </div>
      <div className="msg-content">
        {!isOwn && !hideAvatar && <span className="msg-sender">{name}</span>}
        <div className="msg-bubble">{message.text}</div>
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

/* ── Direct Messages ──────────────────────────────────────── */
export default function DirectMessages({ user }) {
  const [users, setUsers] = useState([]);
  const [removed, setRemoved] = useState(new Set());
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastSentRef = useRef(0);
  const displayName = getDisplayName(user);

  /* ── Subscribe to registered users ── */
  useEffect(() => {
    const q = collection(db, 'users');
    return onSnapshot(q, (snap) => {
      const allUsers = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.uid !== user.uid);
      
      allUsers.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      setUsers(allUsers);
    }, (err) => {
      console.error('Users snapshot error:', err);
    });
  }, [user.uid]);

  /* ── Subscribe to removed users ── */
  useEffect(() => {
    return onSnapshot(collection(db, 'deletedUsers'), snap => {
      setRemoved(new Set(snap.docs.map(d => d.id)));
    }, (err) => {
      console.error('Deleted users snapshot error:', err);
    });
  }, []);

  /* ── Subscribe to DM messages when a conversation is open ── */
  useEffect(() => {
    if (!selectedUser) return;
    setLoadingMsg(true);
    const dmId = getDMId(user.uid, selectedUser.uid);
    const q = query(
      collection(db, 'dms', dmId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(DM_LIMIT),
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingMsg(false);
    }, (err) => {
      console.error('DM messages snapshot error:', err);
      setLoadingMsg(false);
    });
  }, [selectedUser, user.uid]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Open a conversation ── */
  const openConversation = async (u) => {
    setMessages([]);
    const dmId = getDMId(user.uid, u.uid);
    // Attempt to create the conversation doc; if it already exists the
    // update rule will deny it — that's fine, we just ignore the error.
    try {
      await setDoc(doc(db, 'dms', dmId), {
        participants: [user.uid, u.uid],
        createdAt: serverTimestamp(),
      });
    } catch {
      // doc already exists — safe to proceed
    }
    setSelectedUser(u);
    setMobileView('chat');
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  /* ── Send DM ── */
  const sendDM = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending || !selectedUser) return;
    const now = Date.now();
    if (now - lastSentRef.current < SEND_COOLDOWN_MS) return;
    lastSentRef.current = now;
    setSending(true);
    setInputText('');
    const cu = auth.currentUser;
    try {
      await addDoc(
        collection(db, 'dms', getDMId(user.uid, selectedUser.uid), 'messages'),
        {
          text: text.slice(0, MAX_CHARS),
          uid: user.uid,
          displayName: (cu?.displayName || displayName).slice(0, 64),
          photoURL: safePhotoURL(cu?.photoURL),
          createdAt: serverTimestamp(),
        },
      );
    } catch (err) {
      console.error('DM send failed:', err);
      setInputText(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [inputText, sending, user, selectedUser, displayName]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendDM();
    }
  };

  const filtered = users.filter(u =>
    !removed.has(u.id) &&
    !(u.email || '').toLowerCase().endsWith('@example.com') &&
    (u.displayName || '').toLowerCase().includes(search.toLowerCase()),
  );

  const charCount = inputText.length;
  const charClass =
    charCount > MAX_CHARS * 0.9 ? 'char-count danger'
    : charCount > MAX_CHARS * 0.75 ? 'char-count warn'
    : 'char-count';

  /* ── Render ── */
  return (
    <div className="dm-container">

      {/* ── Users Sidebar ── */}
      <div className={`dm-sidebar${mobileView === 'chat' ? ' dm-mobile-hidden' : ''}`}>
        <div className="dm-sidebar-header">
          <span className="dm-sidebar-title">Messages</span>
        </div>

        <div className="dm-search-wrap">
          <svg className="dm-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#55558a" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" stroke="#55558a" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            id="dm-search"
            name="dm-search"
            className="dm-search"
            type="text"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search users"
          />
        </div>

        <div className="dm-users-list">
          {filtered.length === 0 ? (
            <div className="dm-empty">
              {users.length === 0
                ? 'No other users yet.\nAsk a friend to join with Google!'
                : 'No users match your search.'}
            </div>
          ) : (
            filtered.map(u => (
              <button
                key={u.uid}
                className={`dm-user-item${selectedUser?.uid === u.uid ? ' dm-user-active' : ''}`}
                onClick={() => openConversation(u)}
              >
                <Avatar displayName={u.displayName} photoURL={u.photoURL} size={38} />
                <div className="dm-user-info">
                  <span className="dm-user-name">{u.displayName}</span>
                </div>
                {selectedUser?.uid === u.uid && <span className="dm-selected-dot" />}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── DM Chat Panel ── */}
      <div className={`dm-chat${mobileView === 'list' ? ' dm-mobile-hidden' : ''}`}>
        {selectedUser ? (
          <>
            <div className="dm-chat-header">
              <button
                className="dm-back-btn"
                onClick={() => setMobileView('list')}
                aria-label="Back to users"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <Avatar displayName={selectedUser.displayName} photoURL={selectedUser.photoURL} size={34} />
              <div className="dm-chat-info">
                <span className="dm-chat-name">{selectedUser.displayName}</span>
                <span className="dm-chat-sub">Private conversation</span>
              </div>
            </div>

            <div className="messages-container">
              {loadingMsg ? (
                <div className="welcome-msg"><div className="loader" /></div>
              ) : messages.length === 0 ? (
                <div className="welcome-msg">
                  <span className="welcome-icon" aria-hidden="true">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#5b8dee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <strong>No messages yet</strong>
                  <p>Say hello to {selectedUser.displayName}!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOwn = msg.uid === user.uid;
                  const prev = messages[idx - 1];
                  const hideAvatar = !isOwn && prev?.uid === msg.uid;
                  return (
                    <DmMessage key={msg.id} message={msg} isOwn={isOwn} hideAvatar={hideAvatar} />
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
                  placeholder={`Message ${selectedUser.displayName}…`}
                  rows={1}
                  value={inputText}
                  onChange={e => setInputText(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  aria-label="DM input"
                />
                {charCount > 0 && (
                  <span className={charClass}>{charCount}/{MAX_CHARS}</span>
                )}
                <button
                  className="btn-send"
                  onClick={sendDM}
                  disabled={!inputText.trim() || sending}
                  aria-label="Send message"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="dm-welcome">
            <span className="welcome-icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5b8dee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </span>
            <strong>Your Messages</strong>
            <p>Select someone from the list to start a private conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
