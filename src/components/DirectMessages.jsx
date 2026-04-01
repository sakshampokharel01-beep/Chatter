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
  updateDoc,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { db, auth, getDisplayName, getDMId, safePhotoURL } from '../firebase';
import VideoCall from './VideoCall';
import { getSocket } from '../socket';

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

/* ── Direct Messages with Friend Requests ──────────────────────────────────────── */
export default function DirectMessages({ user }) {
  const [users, setUsers] = useState([]);
  const [removed, setRemoved] = useState(new Set());
  const [friends, setFriends] = useState(new Set());
  const [pendingRequests, setPendingRequests] = useState(new Map()); // uid -> request doc
  const [incomingRequests, setIncomingRequests] = useState([]);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'all' | 'requests'
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { from: userId, fromName: string }

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastSentRef = useRef(0);
  const displayName = getDisplayName(user);
  const isGuest = user.isAnonymous;

  // If user is a guest, show message that DMs are not available
  if (isGuest) {
    return (
      <div className="dm-container">
        <div className="dm-welcome" style={{ width: '100%', height: '100%' }}>
          <span className="welcome-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5b8dee" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <strong>Direct Messages Unavailable</strong>
          <p>Sign in with Google or Email to use Direct Messages and add friends.</p>
        </div>
      </div>
    );
  }

  /* ── Subscribe to registered users (exclude guests) ── */
  useEffect(() => {
    const q = collection(db, 'users');
    return onSnapshot(q, (snap) => {
      const allUsers = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => 
          u.id !== user.uid &&           // Not current user
          !u.isAnonymous                 // Not a guest user
        );
      
      allUsers.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      setUsers(allUsers);
    }, (err) => {
      console.error('Users snapshot error:', err);
    });
  }, [user.uid]);

  /* ── Subscribe to removed users ── */
  useEffect(() => {
    if (isGuest) return; // Guests don't need this
    
    const unsub = onSnapshot(
      collection(db, 'deletedUsers'), 
      (snap) => {
        setRemoved(new Set(snap.docs.map(d => d.id)));
      }, 
      (err) => {
        // Silently fail if no permission - not critical for DMs
        console.warn('Could not load deleted users (may need Firestore rules deployed)');
      }
    );
    return unsub;
  }, [isGuest]);

  /* ── Subscribe to friend requests (sent by me) ── */
  useEffect(() => {
    const q = query(
      collection(db, 'friendRequests'),
      where('from', '==', user.uid)
    );
    return onSnapshot(q, (snap) => {
      const pending = new Map();
      snap.docs.forEach(d => {
        pending.set(d.data().to, { id: d.id, ...d.data() });
      });
      setPendingRequests(pending);
    });
  }, [user.uid]);

  /* ── Subscribe to incoming friend requests ── */
  useEffect(() => {
    const q = query(
      collection(db, 'friendRequests'),
      where('to', '==', user.uid)
    );
    return onSnapshot(q, (snap) => {
      setIncomingRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user.uid]);

  /* ── Subscribe to friends list ── */
  useEffect(() => {
    const q = query(
      collection(db, 'friends'),
      where('users', 'array-contains', user.uid)
    );
    return onSnapshot(q, (snap) => {
      const friendSet = new Set();
      snap.docs.forEach(d => {
        const data = d.data();
        const otherUser = data.users.find(uid => uid !== user.uid);
        if (otherUser) friendSet.add(otherUser);
      });
      setFriends(friendSet);
    });
  }, [user.uid]);

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

  /* ── Listen for incoming calls ── */
  useEffect(() => {
    if (isGuest) return; // Don't set up socket for guest users
    
    const socket = getSocket(user.uid, displayName);

    const handleCallSignal = ({ from, peerId }) => {
      console.log('📞 Incoming call from:', from, 'peerId:', peerId);
      
      // Find the user who's calling - use a callback to get latest users
      setUsers(currentUsers => {
        const caller = currentUsers.find(u => u.id === from);
        console.log('👤 Caller found:', caller);
        
        if (caller) {
          console.log('✅ Setting incoming call notification');
          setIncomingCall({ from, fromName: caller.displayName, peerId });
        } else {
          console.log('❌ Caller not found in users list');
        }
        
        return currentUsers; // Don't modify users array
      });
    };

    const handleCallEnded = ({ from }) => {
      console.log('📴 Call ended by:', from);
      // Close video call if open
      setShowVideoCall(false);
      // Clear incoming call notification
      setIncomingCall(null);
    };

    socket.on('call-signal', handleCallSignal);
    socket.on('call-ended', handleCallEnded);
    console.log('🎧 Listening for call-signal and call-ended events');

    return () => {
      socket.off('call-signal', handleCallSignal);
      socket.off('call-ended', handleCallEnded);
      console.log('🔇 Stopped listening for call events');
    };
  }, [user.uid, displayName, isGuest]); // Removed 'users' from dependencies

  /* ── Accept incoming call ── */
  const acceptIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    
    const caller = users.find(u => u.id === incomingCall.from);
    if (caller) {
      setSelectedUser(caller);
      setShowVideoCall(true);
      setIncomingCall(null);
      setMobileView('chat');
    }
  }, [incomingCall, users]);

  /* ── Reject incoming call ── */
  const rejectIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  /* ── Send friend request ── */
  const sendFriendRequest = async (toUser) => {
    try {
      await addDoc(collection(db, 'friendRequests'), {
        from: user.uid,
        fromName: displayName,
        fromPhoto: safePhotoURL(auth.currentUser?.photoURL),
        to: toUser.id,
        toName: toUser.displayName,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to send friend request:', err);
      alert('Failed to send friend request');
    }
  };

  /* ── Accept friend request ── */
  const acceptFriendRequest = async (request) => {
    try {
      // Create friendship
      await addDoc(collection(db, 'friends'), {
        users: [user.uid, request.from],
        createdAt: serverTimestamp(),
      });
      // Delete request
      await deleteDoc(doc(db, 'friendRequests', request.id));
    } catch (err) {
      console.error('Failed to accept friend request:', err);
      alert('Failed to accept friend request');
    }
  };

  /* ── Reject friend request ── */
  const rejectFriendRequest = async (requestId) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
    } catch (err) {
      console.error('Failed to reject friend request:', err);
    }
  };

  /* ── Open a conversation (only if friends) ── */
  const openConversation = async (u) => {
    if (!friends.has(u.id)) {
      alert('You must be friends to send messages');
      return;
    }
    
    setMessages([]);
    const dmId = getDMId(user.uid, u.id);
    try {
      await setDoc(doc(db, 'dms', dmId), {
        participants: [user.uid, u.id],
        createdAt: serverTimestamp(),
      });
    } catch {
      // doc already exists
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

  const friendsList = filtered.filter(u => friends.has(u.id));
  const allUsersList = filtered;

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
          {incomingRequests.length > 0 && (
            <span className="request-badge">{incomingRequests.length}</span>
          )}
        </div>

        {/* Tabs */}
        <div className="dm-tabs">
          <button
            className={`dm-tab${activeTab === 'friends' ? ' active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Friends ({friendsList.length})
          </button>
          <button
            className={`dm-tab${activeTab === 'all' ? ' active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Users
          </button>
          <button
            className={`dm-tab${activeTab === 'requests' ? ' active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests {incomingRequests.length > 0 && `(${incomingRequests.length})`}
          </button>
        </div>

        {activeTab !== 'requests' && (
          <div className="dm-search-wrap">
            <svg className="dm-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#55558a" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="#55558a" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              className="dm-search"
              type="text"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        <div className="dm-users-list">
          {/* Friends Tab */}
          {activeTab === 'friends' && (
            friendsList.length === 0 ? (
              <div className="dm-empty">No friends yet.\nAdd friends from All Users tab!</div>
            ) : (
              friendsList.map(u => (
                <button
                  key={u.id}
                  className={`dm-user-item${selectedUser?.id === u.id ? ' dm-user-active' : ''}`}
                  onClick={() => openConversation(u)}
                >
                  <Avatar displayName={u.displayName} photoURL={u.photoURL} size={38} />
                  <div className="dm-user-info">
                    <span className="dm-user-name">{u.displayName}</span>
                  </div>
                  {selectedUser?.id === u.id && <span className="dm-selected-dot" />}
                </button>
              ))
            )
          )}

          {/* All Users Tab */}
          {activeTab === 'all' && (
            allUsersList.length === 0 ? (
              <div className="dm-empty">No users found</div>
            ) : (
              allUsersList.map(u => {
                const isFriend = friends.has(u.id);
                const hasPending = pendingRequests.has(u.id);
                
                return (
                  <div key={u.id} className="dm-user-item-wrapper">
                    <div className="dm-user-item">
                      <Avatar displayName={u.displayName} photoURL={u.photoURL} size={38} />
                      <div className="dm-user-info">
                        <span className="dm-user-name">{u.displayName}</span>
                        {isFriend && <span className="friend-badge">Friend</span>}
                        {hasPending && <span className="pending-badge">Pending</span>}
                      </div>
                      {!isFriend && !hasPending && (
                        <button
                          className="add-friend-btn"
                          onClick={() => sendFriendRequest(u)}
                          title="Send friend request"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="8.5" cy="7" r="4"/>
                            <line x1="20" y1="8" x2="20" y2="14"/>
                            <line x1="23" y1="11" x2="17" y2="11"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            incomingRequests.length === 0 ? (
              <div className="dm-empty">No pending requests</div>
            ) : (
              incomingRequests.map(req => {
                const reqUser = users.find(u => u.id === req.from);
                if (!reqUser) return null;
                
                return (
                  <div key={req.id} className="friend-request-item">
                    <Avatar displayName={reqUser.displayName} photoURL={reqUser.photoURL} size={38} />
                    <div className="dm-user-info">
                      <span className="dm-user-name">{reqUser.displayName}</span>
                      <span className="request-text">wants to be friends</span>
                    </div>
                    <div className="request-actions">
                      <button
                        className="accept-btn"
                        onClick={() => acceptFriendRequest(req)}
                        title="Accept"
                      >
                        ✓
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => rejectFriendRequest(req.id)}
                        title="Reject"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )
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
              <button 
                className="video-call-btn" 
                onClick={() => setShowVideoCall(true)}
                title="Start video call"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </button>
            </div>

            <div className="messages-container">
              {loadingMsg ? (
                <div className="welcome-msg"><div className="loader" /></div>
              ) : messages.length === 0 ? (
                <div className="welcome-msg">
                  <span className="welcome-icon">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#5b8dee" strokeWidth="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
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
                />
                {charCount > 0 && (
                  <span className={charClass}>{charCount}/{MAX_CHARS}</span>
                )}
                <button
                  className="btn-send"
                  onClick={sendDM}
                  disabled={!inputText.trim() || sending}
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="dm-welcome">
            <span className="welcome-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5b8dee" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            <strong>Your Messages</strong>
            <p>Add friends and start chatting!</p>
          </div>
        )}
      </div>

      {/* Incoming Call Notification - Only show if video call is not already open */}
      {incomingCall && !showVideoCall && (
        <div className="incoming-call-notification">
          <div className="incoming-call-content">
            <div className="incoming-call-icon">📞</div>
            <div className="incoming-call-info">
              <strong>{incomingCall.fromName}</strong>
              <span>Incoming video call</span>
            </div>
            <div className="incoming-call-actions">
              <button className="accept-call-btn" onClick={acceptIncomingCall}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Accept
              </button>
              <button className="reject-call-btn" onClick={rejectIncomingCall}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
                  <line x1="23" y1="1" x2="1" y2="23"/>
                </svg>
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {showVideoCall && selectedUser && (
        <VideoCall
          user={user}
          friendId={selectedUser.id}
          friendName={selectedUser.displayName}
          onClose={() => setShowVideoCall(false)}
          autoStart={incomingCall !== null} // Auto-start if accepting from notification
        />
      )}
    </div>
  );
}
