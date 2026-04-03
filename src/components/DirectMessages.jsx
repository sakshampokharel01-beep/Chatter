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
  getDocs,
} from 'firebase/firestore';
import { db, auth, getDisplayName, getDMId, safePhotoURL } from '../firebase';
import { formatLastSeen, isUserActuallyOnline } from '../utils/formatLastSeen';
import { areNotificationsEnabled } from '../utils/notifications';
import { createMessageNotification, createCallNotification, createFriendRequestNotification } from '../hooks/useInAppNotifications.jsx';
import VideoCall from './VideoCall';
import { getSocket } from '../socket';

const DM_LIMIT = 100;
const MAX_CHARS = 500;
const SEND_COOLDOWN_MS = 1000;

/* ── Avatar ───────────────────────────────────────────────── */
function Avatar({ displayName, photoURL, size = 32, isOnline, showOnlineIndicator = false }) {
  const initial = (displayName || '?').charAt(0).toUpperCase();
  const [imgError, setImgError] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {photoURL && !imgError ? (
        <img
          src={photoURL}
          alt={displayName}
          style={{
            width: size, height: size, borderRadius: '50%',
            objectFit: 'cover', border: '1.5px solid rgba(99,102,241,0.3)', flexShrink: 0,
          }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="msg-avatar-placeholder"
          style={{ width: size, height: size, fontSize: size * 0.42, flexShrink: 0 }}
        >
          {initial}
        </div>
      )}
      {showOnlineIndicator && isOnline && (
        <span className="online-indicator" title="Online"></span>
      )}
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
function DmMessage({ message, isOwn, hideAvatar, friendId, onEdit, onDelete, onReply, messages }) {
  const name = message.displayName || 'User';
  const isSeen = message.seenBy && message.seenBy.includes(friendId);
  const isDelivered = message.deliveredTo && message.deliveredTo.includes(friendId);
  
  // Check if message can be edited (within 15 minutes)
  const canEdit = isOwn && message.createdAt && onEdit && 
    (Date.now() - (message.createdAt.toMillis ? message.createdAt.toMillis() : message.createdAt)) < 15 * 60 * 1000;
  
  // Check if message can be deleted by owner (within 1 hour)
  const canDelete = isOwn && message.createdAt && onDelete &&
    (Date.now() - (message.createdAt.toMillis ? message.createdAt.toMillis() : message.createdAt)) < 60 * 60 * 1000;
  
  // Find the replied message if this is a reply
  const repliedMessage = message.replyTo ? messages.find(m => m.id === message.replyTo) : null;
  
  return (
    <div className={`message-row ${isOwn ? 'own' : 'other'}${hideAvatar ? ' hide-avatar' : ''}`} id={`dm-msg-${message.id}`}>
      <div className="msg-avatar">
        <Avatar displayName={name} photoURL={message.photoURL} size={30} />
      </div>
      <div className="msg-content">
        {!isOwn && !hideAvatar && <span className="msg-sender">{name}</span>}
        <div className="msg-bubble-wrap">
          <div className="msg-bubble">
            {repliedMessage && (
              <div 
                className="msg-reply-preview" 
                onClick={() => {
                  const element = document.getElementById(`dm-msg-${repliedMessage.id}`);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  element?.classList.add('msg-highlight');
                  setTimeout(() => element?.classList.remove('msg-highlight'), 2000);
                }}
              >
                <div className="msg-reply-line"></div>
                <div className="msg-reply-content">
                  <div className="msg-reply-name">{repliedMessage.displayName || 'User'}</div>
                  <div className="msg-reply-text">{repliedMessage.text}</div>
                </div>
              </div>
            )}
            {message.text}
            {message.edited && <span className="msg-edited-label"> (edited)</span>}
          </div>
          {onReply && (
            <button
              className="msg-reply-btn"
              onClick={() => onReply(message)}
              title="Reply to message"
              aria-label="Reply to message"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 14 4 9 9 4"/>
                <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
              </svg>
            </button>
          )}
          {canEdit && (
            <button
              className="msg-edit-btn"
              onClick={() => onEdit(message.id, message.text)}
              title="Edit message"
              aria-label="Edit message"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
          {canDelete && (
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
        <div className="msg-time-row">
          <span className="msg-time">{formatTime(message.createdAt)}</span>
          {isOwn && (
            <span className={`msg-status-indicator ${isSeen ? 'seen' : isDelivered ? 'delivered' : 'sent'}`} 
                  title={isSeen ? 'Seen' : isDelivered ? 'Delivered' : 'Sent'}>
              {isSeen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                  <polyline points="20 6 9 17 4 12" transform="translate(4, 0)"/>
                </svg>
              ) : isDelivered ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                  <polyline points="20 6 9 17 4 12" transform="translate(4, 0)"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </span>
          )}
        </div>
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
export default function DirectMessages({ user, showNotification }) {
  const [users, setUsers] = useState([]);
  const [removed, setRemoved] = useState(new Set());
  const [friends, setFriends] = useState(new Set());
  const [pendingRequests, setPendingRequests] = useState(new Map()); // uid -> request doc
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true); // Add loading state
  const [loadingFriends, setLoadingFriends] = useState(true); // Add loading state
  
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
  const [isAudioOnly, setIsAudioOnly] = useState(false); // Track if call is audio-only
  const [friendTyping, setFriendTyping] = useState(false); // Track if friend is typing
  const [typingTimeout, setTypingTimeout] = useState(null); // Timeout for typing indicator
  const [editingMessageId, setEditingMessageId] = useState(null); // Track which message is being edited
  const [editingText, setEditingText] = useState(''); // Track the edited text
  const [replyingTo, setReplyingTo] = useState(null); // Track which message is being replied to

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastSentRef = useRef(0);
  const typingTimeoutRef = useRef(null); // Ref for typing timeout
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
    setLoadingUsers(true);
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
      setLoadingUsers(false);
    }, (err) => {
      console.error('Users snapshot error:', err);
      setLoadingUsers(false);
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
    
    let isFirstLoad = true;
    
    return onSnapshot(q, (snap) => {
      const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Show notification for new friend requests (skip first load)
      if (!isFirstLoad && showNotification) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const request = change.doc.data();
            const notification = createFriendRequestNotification(
              request.fromName,
              request.fromPhotoURL
            );
            showNotification({
              ...notification,
              onClick: () => {
                window.focus();
                setActiveTab('requests');
              }
            });
          }
        });
      }
      
      isFirstLoad = false;
      setIncomingRequests(requests);
    });
  }, [user.uid]);

  /* ── Subscribe to friends list ── */
  useEffect(() => {
    setLoadingFriends(true);
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
      setLoadingFriends(false);
    }, (err) => {
      console.error('Friends snapshot error:', err);
      setLoadingFriends(false);
    });
  }, [user.uid]);

  /* ── Subscribe to DM messages when a conversation is open ── */
  useEffect(() => {
    if (!selectedUser) return;
    setLoadingMsg(true);
    const dmId = getDMId(user.uid, selectedUser.id);
    const q = query(
      collection(db, 'dms', dmId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(DM_LIMIT),
    );
    
    let isFirstLoad = true;
    
    return onSnapshot(q, async (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Show notification for new messages (skip first load)
      if (!isFirstLoad && showNotification) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const msg = change.doc.data();
            // Only notify for messages from the other user
            if (msg.uid !== user.uid) {
              const notification = createMessageNotification(
                selectedUser.displayName,
                msg.text,
                selectedUser.photoURL
              );
              showNotification({
                ...notification,
                onClick: () => {
                  // Focus the chat when notification is clicked
                  window.focus();
                }
              });
            }
          }
        });
      }
      
      isFirstLoad = false;
      setMessages(msgs);
      setLoadingMsg(false);
      
      // Mark messages as delivered (happens when chat is opened)
      const undeliveredMessages = msgs.filter(msg => 
        msg.uid !== user.uid && // Not my message
        (!msg.deliveredTo || !msg.deliveredTo.includes(user.uid)) // Not delivered to me yet
      );
      
      // Update delivered status
      for (const msg of undeliveredMessages) {
        try {
          const msgRef = doc(db, 'dms', dmId, 'messages', msg.id);
          await updateDoc(msgRef, {
            deliveredTo: [...(msg.deliveredTo || []), user.uid],
            deliveredAt: serverTimestamp()
          });
        } catch (err) {
          // Silently fail - not critical
        }
      }
      
      // Mark messages as seen (only if window is focused and user is viewing)
      if (!document.hidden && document.hasFocus()) {
        const unseenMessages = msgs.filter(msg => 
          msg.uid !== user.uid && // Not my message
          (!msg.seenBy || !msg.seenBy.includes(user.uid)) // Not seen by me yet
        );
        
        for (const msg of unseenMessages) {
          try {
            const msgRef = doc(db, 'dms', dmId, 'messages', msg.id);
            await updateDoc(msgRef, {
              seenBy: [...(msg.seenBy || []), user.uid],
              seenAt: serverTimestamp()
            });
          } catch (err) {
            // Silently fail - not critical
          }
        }
      }
    }, (err) => {
      console.error('DM messages snapshot error:', err);
      setLoadingMsg(false);
    });
  }, [selectedUser, user.uid]);
  
  /* ── Mark messages as seen when window becomes visible ── */
  useEffect(() => {
    if (!selectedUser) return;
    
    const handleVisibilityChange = async () => {
      if (!document.hidden && document.hasFocus()) {
        // Window is now visible and focused, mark unseen messages as seen
        const dmId = getDMId(user.uid, selectedUser.id);
        const q = query(
          collection(db, 'dms', dmId, 'messages'),
          where('uid', '==', selectedUser.id),
          orderBy('createdAt', 'desc'),
          limit(50) // Only check recent messages
        );
        
        try {
          const snap = await getDocs(q);
          for (const docSnap of snap.docs) {
            const msgData = docSnap.data();
            // Check if message is not already seen by current user
            if (!msgData.seenBy || !msgData.seenBy.includes(user.uid)) {
              const msgRef = doc(db, 'dms', dmId, 'messages', docSnap.id);
              await updateDoc(msgRef, {
                seenBy: [...(msgData.seenBy || []), user.uid],
                seenAt: serverTimestamp()
              });
            }
          }
        } catch (err) {
          // Silently fail - not critical
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
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
      // Find the user who's calling - use a callback to get latest users
      setUsers(currentUsers => {
        const caller = currentUsers.find(u => u.id === from);
        
        if (caller) {
          setIncomingCall({ from, fromName: caller.displayName, peerId });
          
          // Show notification for incoming call
          if (showNotification) {
            const notification = createCallNotification(
              caller.displayName,
              true, // isVideoCall
              caller.photoURL
            );
            showNotification({
              ...notification,
              onClick: () => {
                // Accept call when notification is clicked
                window.focus();
                setSelectedUser(caller);
                setShowVideoCall(true);
                setIncomingCall(null);
                setMobileView('chat');
              }
            });
          }
        }
        
        return currentUsers; // Don't modify users array
      });
    };

    const handleCallEnded = ({ from }) => {
      // Close video call if open
      setShowVideoCall(false);
      // Clear incoming call notification
      setIncomingCall(null);
    };

    // Handle typing indicators
    const handleTypingDM = ({ from, isTyping }) => {
      if (selectedUser && from === selectedUser.id) {
        setFriendTyping(isTyping);
        
        // Auto-hide typing indicator after 3 seconds
        if (isTyping) {
          if (typingTimeout) clearTimeout(typingTimeout);
          const timeout = setTimeout(() => {
            setFriendTyping(false);
          }, 3000);
          setTypingTimeout(timeout);
        }
      }
    };

    socket.on('call-signal', handleCallSignal);
    socket.on('call-ended', handleCallEnded);
    socket.on('typing-dm', handleTypingDM);

    return () => {
      socket.off('call-signal', handleCallSignal);
      socket.off('call-ended', handleCallEnded);
      socket.off('typing-dm', handleTypingDM);
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [user.uid, displayName, isGuest, selectedUser, typingTimeout]); // Removed 'users' from dependencies

  /* ── Accept incoming call ── */
  const acceptIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    
    const caller = users.find(u => u.id === incomingCall.from);
    if (caller) {
      setSelectedUser(caller);
      setShowVideoCall(true);
      // Don't clear incomingCall yet - pass it to VideoCall component
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
    
    // Always set the selected user first
    setSelectedUser(u);
    setMobileView('chat');
    
    // Only clear messages if switching to a different user
    if (selectedUser?.id !== u.id) {
      setMessages([]);
      setLoadingMsg(true);
    }
    
    const dmId = getDMId(user.uid, u.id);
    try {
      // Ensure participants array is properly formatted
      const participants = [user.uid, u.id].filter(Boolean);
      
      if (participants.length !== 2) {
        // Invalid participants - skip DM creation
        return;
      }
      
      await setDoc(doc(db, 'dms', dmId), {
        participants: participants,
        createdAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      // Silently fail - not critical
    }
    
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  /* ── Delete DM (own message within 1 hour) ── */
  const deleteDM = useCallback(async (messageId) => {
    if (!selectedUser) return;
    
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    // Check if user can delete (own message within 1 hour)
    const isOwn = message.uid === user.uid;
    const canDelete = isOwn && message.createdAt && 
      (Date.now() - (message.createdAt.toMillis ? message.createdAt.toMillis() : message.createdAt)) < 60 * 60 * 1000;
    
    if (!canDelete) {
      alert('You can only delete your own messages within 1 hour of sending');
      return;
    }
    
    if (!window.confirm('Delete this message for everyone?')) return;
    
    try {
      const dmId = getDMId(user.uid, selectedUser.id);
      await deleteDoc(doc(db, 'dms', dmId, 'messages', messageId));
      // Clear edit state if deleting the message being edited
      if (editingMessageId === messageId) {
        setEditingMessageId(null);
        setEditingText('');
        setInputText('');
      }
    } catch (err) {
      console.error('Delete DM failed:', err);
      alert('Failed to delete message');
    }
  }, [selectedUser, user.uid, messages, editingMessageId]);

  /* ── Edit DM (own message within 15 minutes) ── */
  const startEditDM = useCallback((messageId, currentText) => {
    setEditingMessageId(messageId);
    setEditingText(currentText);
    setInputText(currentText);
    inputRef.current?.focus();
  }, []);

  const cancelEditDM = useCallback(() => {
    setEditingMessageId(null);
    setEditingText('');
    setInputText('');
  }, []);

  /* ── Reply to DM ── */
  const startReplyDM = useCallback((message) => {
    setReplyingTo(message);
    setEditingMessageId(null); // Clear edit when replying
    setEditingText('');
    inputRef.current?.focus();
  }, []);

  const cancelReplyDM = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const saveEditDM = useCallback(async () => {
    if (!editingMessageId || !editingText.trim() || !selectedUser) return;
    
    const message = messages.find(m => m.id === editingMessageId);
    if (!message) return;
    
    // Verify ownership and time limit
    const isOwn = message.uid === user.uid;
    const canEdit = isOwn && message.createdAt && 
      (Date.now() - (message.createdAt.toMillis ? message.createdAt.toMillis() : message.createdAt)) < 15 * 60 * 1000;
    
    if (!canEdit) {
      alert('You can only edit your own messages within 15 minutes of sending');
      cancelEditDM();
      return;
    }
    
    setSending(true);
    try {
      const dmId = getDMId(user.uid, selectedUser.id);
      await updateDoc(doc(db, 'dms', dmId, 'messages', editingMessageId), {
        text: editingText.trim().slice(0, MAX_CHARS),
        edited: true,
        editedAt: serverTimestamp()
      });
      cancelEditDM();
    } catch (err) {
      console.error('Edit DM failed:', err);
      alert('Failed to edit message');
    } finally {
      setSending(false);
    }
  }, [editingMessageId, editingText, selectedUser, messages, user.uid, cancelEditDM]);

  /* ── Send DM ── */
  const sendDM = useCallback(async () => {
    // If editing, save the edit instead
    if (editingMessageId) {
      await saveEditDM();
      return;
    }
    
    const text = inputText.trim();
    if (!text || sending || !selectedUser) return;
    const now = Date.now();
    if (now - lastSentRef.current < SEND_COOLDOWN_MS) return;
    lastSentRef.current = now;
    setSending(true);
    setInputText('');
    
    // Stop typing indicator when sending
    const socket = getSocket(user.uid, displayName);
    socket.emit('typing-dm', {
      to: selectedUser.id,
      from: user.uid,
      isTyping: false
    });
    
    const cu = auth.currentUser;
    try {
      const messageData = {
        text: text.slice(0, MAX_CHARS),
        uid: user.uid,
        displayName: (cu?.displayName || displayName).slice(0, 64),
        photoURL: safePhotoURL(cu?.photoURL),
        createdAt: serverTimestamp(),
        deliveredTo: [], // Will be updated when friend opens chat
        seenBy: [], // Will be updated when friend sees message
        edited: false,
      };
      
      // Add reply reference if replying to a message
      if (replyingTo) {
        messageData.replyTo = replyingTo.id;
        messageData.replyToText = replyingTo.text.slice(0, 100);
        messageData.replyToUser = replyingTo.displayName;
      }
      
      await addDoc(
        collection(db, 'dms', getDMId(user.uid, selectedUser.id), 'messages'),
        messageData
      );
      
      // Clear reply state after sending
      setReplyingTo(null);
    } catch (err) {
      console.error('DM send failed:', err);
      setInputText(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [inputText, sending, user, selectedUser, displayName, editingMessageId, replyingTo, saveEditDM]);

  /* ── Handle typing indicator ── */
  const handleTyping = useCallback(() => {
    if (!selectedUser) return;
    
    const socket = getSocket(user.uid, displayName);
    
    // Emit typing start
    socket.emit('typing-dm', {
      to: selectedUser.id,
      from: user.uid,
      isTyping: true
    });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to emit typing stop after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-dm', {
        to: selectedUser.id,
        from: user.uid,
        isTyping: false
      });
    }, 2000);
  }, [selectedUser, user.uid, displayName]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendDM();
    } else if (e.key === 'Escape' && editingMessageId) {
      e.preventDefault();
      cancelEditDM();
    } else if (e.key === 'Escape' && replyingTo) {
      e.preventDefault();
      cancelReplyDM();
    }
  };

  /* ── Handle input change ── */
  const handleInputChange = (e) => {
    const newText = e.target.value.slice(0, MAX_CHARS);
    setInputText(newText);
    if (editingMessageId) {
      setEditingText(newText);
    }
    if (!editingMessageId) {
      handleTyping();
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
          {/* Loading state */}
          {(loadingUsers || loadingFriends) && (
            <div className="dm-loading">
              <div className="loader" style={{ width: '24px', height: '24px' }} />
              <span style={{ marginTop: '8px', fontSize: '13px', color: '#8b8ba7' }}>Loading...</span>
            </div>
          )}
          
          {/* Friends Tab */}
          {activeTab === 'friends' && !loadingFriends && !loadingUsers && (
            friendsList.length === 0 ? (
              <div className="dm-empty">No friends yet.\nAdd friends from All Users tab!</div>
            ) : (
              friendsList.map(u => (
                <button
                  key={u.id}
                  className={`dm-user-item${selectedUser?.id === u.id ? ' dm-user-active' : ''}`}
                  onClick={() => openConversation(u)}
                >
                  <Avatar 
                    displayName={u.displayName} 
                    photoURL={u.photoURL} 
                    size={38} 
                    isOnline={isUserActuallyOnline(u.lastSeen, u.online)}
                    showOnlineIndicator={true}
                  />
                  <div className="dm-user-info">
                    <span className="dm-user-name">{u.displayName}</span>
                    <span className="dm-user-status">{formatLastSeen(u.lastSeen, u.online)}</span>
                  </div>
                  {selectedUser?.id === u.id && <span className="dm-selected-dot" />}
                </button>
              ))
            )
          )}

          {/* All Users Tab */}
          {activeTab === 'all' && !loadingUsers && (
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
              <Avatar 
                displayName={selectedUser.displayName} 
                photoURL={selectedUser.photoURL} 
                size={34}
                isOnline={isUserActuallyOnline(selectedUser.lastSeen, selectedUser.online)}
                showOnlineIndicator={true}
              />
              <div className="dm-chat-info">
                <span className="dm-chat-name">{selectedUser.displayName}</span>
                <span className="dm-chat-sub">{formatLastSeen(selectedUser.lastSeen, selectedUser.online)}</span>
              </div>
              <div className="call-buttons-group">
                <button 
                  className="audio-call-btn" 
                  onClick={() => {
                    setIsAudioOnly(true);
                    setShowVideoCall(true);
                    setIncomingCall(null);
                  }}
                  title="Start audio call"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </button>
                <button 
                  className="video-call-btn" 
                  onClick={() => {
                    setIsAudioOnly(false);
                    setShowVideoCall(true);
                    setIncomingCall(null);
                  }}
                  title="Start video call"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </button>
              </div>
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
                    <DmMessage 
                      key={msg.id} 
                      message={msg} 
                      isOwn={isOwn} 
                      hideAvatar={hideAvatar}
                      friendId={selectedUser.id}
                      onEdit={isOwn ? startEditDM : null}
                      onDelete={isOwn ? deleteDM : null}
                      onReply={startReplyDM}
                      messages={messages}
                    />
                  );
                })
              )}
              <div ref={messagesEndRef} />
              
              {/* Typing indicator */}
              {friendTyping && (
                <div className="typing-indicator-wrapper">
                  <div className="typing-indicator">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                  <span className="typing-text">{selectedUser.displayName} is typing...</span>
                </div>
              )}
            </div>

            <div className="input-area">
              {editingMessageId && (
                <div className="editing-indicator">
                  <span>✏️ Editing message</span>
                  <button onClick={cancelEditDM} className="cancel-edit-btn" title="Cancel editing">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}
              {replyingTo && (
                <div className="replying-indicator">
                  <div className="replying-content">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 14 4 9 9 4"/>
                      <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
                    </svg>
                    <div className="replying-text">
                      <span className="replying-to">Replying to {replyingTo.displayName}</span>
                      <span className="replying-msg">{replyingTo.text.slice(0, 50)}{replyingTo.text.length > 50 ? '...' : ''}</span>
                    </div>
                  </div>
                  <button onClick={cancelReplyDM} className="cancel-reply-btn" title="Cancel reply">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}
              <div className="input-wrapper">
                <textarea
                  ref={inputRef}
                  className="msg-input"
                  placeholder={editingMessageId ? "Edit your message…" : replyingTo ? "Write a reply…" : `Message ${selectedUser.displayName}…`}
                  rows={1}
                  value={inputText}
                  onChange={handleInputChange}
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
                  title={editingMessageId ? "Save edit" : "Send message"}
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
            <div className="incoming-call-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
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
          onClose={() => {
            setShowVideoCall(false);
            setIncomingCall(null); // Clear incoming call when closing
            setIsAudioOnly(false); // Reset audio-only mode
          }}
          autoStart={true} // Always auto-start (either new call or accepting incoming)
          incomingPeerId={incomingCall?.peerId} // Pass the peer ID if accepting incoming call
          audioOnly={isAudioOnly} // Pass audio-only mode
        />
      )}
    </div>
  );
}
