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
  updateDoc,
  startAfter,
} from 'firebase/firestore';
import { db, auth, signOutUser, getDisplayName, safePhotoURL } from '../firebase';
import DirectMessages from './DirectMessages';
import AdminPanel from './AdminPanel';
import UserProfile from './UserProfile';
import DeviceManagement from './DeviceManagement';
import NotificationSettings from './NotificationSettings';
import InAppNotification from './InAppNotification';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import GlobalSearch from './GlobalSearch';
import SavedMessages from './SavedMessages';
import Groups from './Groups';
import GroupChat from './GroupChat';
import { useInAppNotifications } from '../hooks/useInAppNotifications.jsx';
import { useSavedMessages } from '../hooks/useSavedMessages';
import { getSocket } from '../socket';

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
function ChatMessage({ message, isOwn, hideAvatar, onDelete, onBlock, onRemove, onEdit, onReply, onSave, messages }) {
  const name = message.displayName || (message.isAnonymous ? 'Guest' : 'User');
  
  // Check if message can be edited (within 15 minutes)
  const canEdit = isOwn && message.createdAt && onEdit && 
    (Date.now() - (message.createdAt.toMillis ? message.createdAt.toMillis() : message.createdAt)) < 15 * 60 * 1000;
  
  // Check if message can be deleted by owner (within 1 hour)
  const canDeleteOwn = isOwn && message.createdAt && 
    (Date.now() - (message.createdAt.toMillis ? message.createdAt.toMillis() : message.createdAt)) < 60 * 60 * 1000;

  // Find the replied message if this is a reply
  const repliedMessage = message.replyTo ? messages.find(m => m.id === message.replyTo) : null;

  return (
    <div className={`message-row ${isOwn ? 'own' : 'other'}${hideAvatar ? ' hide-avatar' : ''}`} id={`msg-${message.id}`}>
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
          <div className="msg-bubble">
            {(repliedMessage || message.replyTo) && (
              <div 
                className="msg-reply-preview" 
                onClick={() => {
                  const element = document.getElementById(`msg-${message.replyTo}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('msg-highlight');
                    setTimeout(() => element.classList.remove('msg-highlight'), 2000);
                  }
                }}
              >
                <div className="msg-reply-line"></div>
                <div className="msg-reply-content">
                  <div className="msg-reply-name">
                    {repliedMessage ? (repliedMessage.displayName || 'User') : (message.replyToUser || 'User')}
                  </div>
                  <div className="msg-reply-text">
                    {repliedMessage ? repliedMessage.text : (message.replyToText || '')}
                  </div>
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
          {onSave && (
            <button
              className="msg-save-btn"
              onClick={() => onSave(message)}
              title="Save message"
              aria-label="Save message"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
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
          {(onDelete || canDeleteOwn) && (
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
  const [loadingOlderMsgs, setLoadingOlderMsgs] = useState(false); // Loading older messages
  const [hasMoreMessages, setHasMoreMessages] = useState(true); // Whether there are more messages to load
  const [typingUsers, setTypingUsers] = useState(new Map()); // Map of userId -> userName
  const [editingMessageId, setEditingMessageId] = useState(null); // Track which message is being edited
  const [editingText, setEditingText] = useState(''); // Track the edited text
  const [replyingTo, setReplyingTo] = useState(null); // Track which message is being replied to
  const [showProfile, setShowProfile] = useState(false); // Track profile modal visibility
  const [showDevices, setShowDevices] = useState(false); // Track device management modal visibility
  const [showNotifications, setShowNotifications] = useState(false); // Track notification settings modal visibility
  const [showMobileMenu, setShowMobileMenu] = useState(false); // Track mobile menu visibility
  const [showSearch, setShowSearch] = useState(false); // Track global search modal visibility
  const [selectedGroupId, setSelectedGroupId] = useState(null); // Track selected group for chat
  const [theme, setTheme] = useState(() => {
    // Initialize theme from localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });

  // Apply theme on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const lastSentRef = useRef(0);
  const typingTimeoutRef = useRef(null); // Ref for typing timeout
  const oldestMessageRef = useRef(null); // Track oldest message for pagination
  
  // In-app notifications
  const { notifications, showNotification, hideNotification } = useInAppNotifications();
  
  // Saved messages hook
  const { toggleSaveMessage } = useSavedMessages(user.uid);

  const displayName = getDisplayName(user);
  const isGuest = user.isAnonymous;
  const [adminUser, setAdminUser] = useState(false);
  const [friends, setFriends] = useState(new Set()); // Track friend IDs for search

  // Cleanup session on sign out or browser close
  useEffect(() => {
    if (!user) return;

    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) return;

    const cleanup = async () => {
      try {
        // Find and delete the current session
        const q = query(
          collection(db, 'sessions'),
          where('userId', '==', user.uid),
          where('sessionId', '==', sessionId)
        );
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => deleteDoc(doc.ref));
      } catch (err) {
        // Silently fail
      }
    };

    // Cleanup on browser close/refresh
    window.addEventListener('beforeunload', cleanup);

    return () => {
      window.removeEventListener('beforeunload', cleanup);
    };
  }, [user]);

  // Real-time admin status — check the admins collection
  useEffect(() => {
    return onSnapshot(collection(db, 'admins'), snap => {
      setAdminUser(snap.docs.some(d => d.id === user.uid));
    }, (err) => {
      console.error('Admin status snapshot error:', err);
    });
  }, [user.uid]);

  // Subscribe to friends list for search
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
    }, (err) => {
      console.error('Friends snapshot error:', err);
    });
  }, [user.uid]);

  // Listen for typing indicators in global chat
  useEffect(() => {
    const socket = getSocket(user.uid, displayName);

    const handleTypingGlobal = ({ from, userName, isTyping }) => {
      if (from === user.uid) return; // Ignore own typing
      
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (isTyping) {
          newMap.set(from, userName);
          
          // Auto-remove after 3 seconds
          setTimeout(() => {
            setTypingUsers(current => {
              const updated = new Map(current);
              updated.delete(from);
              return updated;
            });
          }, 3000);
        } else {
          newMap.delete(from);
        }
        return newMap;
      });
    };

    socket.on('typing-global', handleTypingGlobal);

    return () => {
      socket.off('typing-global', handleTypingGlobal);
    };
  }, [user.uid, displayName]);

  /* ── Delete a global message (admin only or own message within 1 hour) ── */
  const deleteMessage = useCallback(async (id) => {
    const message = messages.find(m => m.id === id);
    if (!message) return;
    
    // Check if user can delete (admin or own message within 1 hour)
    const isOwn = message.uid === user.uid;
    const canDeleteOwn = isOwn && message.createdAt && 
      (Date.now() - (message.createdAt.toMillis ? message.createdAt.toMillis() : message.createdAt)) < 60 * 60 * 1000;
    
    if (!adminUser && !canDeleteOwn) {
      alert('You can only delete your own messages within 1 hour of sending');
      return;
    }
    
    if (isOwn && !adminUser) {
      if (!window.confirm('Delete this message for everyone?')) return;
    }
    
    try {
      await deleteDoc(doc(db, 'messages', id));
      // Clear edit state if deleting the message being edited
      if (editingMessageId === id) {
        setEditingMessageId(null);
        setEditingText('');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete message');
    }
  }, [adminUser, user.uid, messages, editingMessageId]);

  /* ── Edit a message (own message within 15 minutes) ── */
  const startEditMessage = useCallback((id, currentText) => {
    setEditingMessageId(id);
    setEditingText(currentText);
    setInputText(currentText);
    setReplyingTo(null); // Clear reply when editing
    inputRef.current?.focus();
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingText('');
    setInputText('');
  }, []);
  
  /* ── Reply to a message ── */
  const startReply = useCallback((message) => {
    setReplyingTo(message);
    setEditingMessageId(null); // Clear edit when replying
    setEditingText('');
    inputRef.current?.focus();
  }, []);
  
  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  /* ── Save/Unsave a message ── */
  const handleSaveMessage = useCallback(async (message) => {
    try {
      const isSaved = await toggleSaveMessage(message, 'global', 'global');
      // Show toast notification
      if (isSaved) {
        showNotification({
          id: `save-${message.id}`,
          type: 'success',
          title: 'Message saved',
          message: 'Message added to Saved Messages',
          duration: 2000
        });
      } else {
        showNotification({
          id: `unsave-${message.id}`,
          type: 'info',
          title: 'Message removed',
          message: 'Message removed from Saved Messages',
          duration: 2000
        });
      }
    } catch (err) {
      console.error('Failed to save message:', err);
      showNotification({
        id: `save-error-${message.id}`,
        type: 'error',
        title: 'Error',
        message: 'Failed to save message',
        duration: 3000
      });
    }
  }, [toggleSaveMessage, showNotification]);

  const saveEdit = useCallback(async () => {
    if (!editingMessageId || !editingText.trim()) return;
    
    const message = messages.find(m => m.id === editingMessageId);
    if (!message) return;
    
    // Verify ownership and time limit
    const isOwn = message.uid === user.uid;
    const canEdit = isOwn && message.createdAt && 
      (Date.now() - (message.createdAt.toMillis ? message.createdAt.toMillis() : message.createdAt)) < 15 * 60 * 1000;
    
    if (!canEdit) {
      alert('You can only edit your own messages within 15 minutes of sending');
      cancelEdit();
      return;
    }
    
    setSending(true);
    try {
      await updateDoc(doc(db, 'messages', editingMessageId), {
        text: editingText.trim().slice(0, MAX_CHARS),
        edited: true,
        editedAt: serverTimestamp()
      });
      cancelEdit();
    } catch (err) {
      console.error('Edit failed:', err);
      alert('Failed to edit message');
    } finally {
      setSending(false);
    }
  }, [editingMessageId, editingText, messages, user.uid, cancelEdit]);

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
    setLoadingMsgs(true);
    setHasMoreMessages(true);
    oldestMessageRef.current = null;
    
    // Load only recent 50 messages initially
    const q = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).reverse();
      
      // Track oldest message for pagination
      if (snapshot.docs.length > 0) {
        oldestMessageRef.current = snapshot.docs[snapshot.docs.length - 1];
      }
      
      // Check if there are more messages
      setHasMoreMessages(snapshot.docs.length === 50);
      
      setMessages(msgs);
      setLoadingMsgs(false);
    }, (err) => {
      console.error('Global chat snapshot error:', err);
      setLoadingMsgs(false);
    });

    return unsubscribe;
  }, []);
  
  /* ── Load older messages when scrolling up ── */
  const loadOlderMessages = useCallback(async () => {
    if (!oldestMessageRef.current || loadingOlderMsgs || !hasMoreMessages) return;
    
    setLoadingOlderMsgs(true);
    
    try {
      const q = query(
        collection(db, 'messages'),
        orderBy('createdAt', 'desc'),
        startAfter(oldestMessageRef.current),
        limit(50)
      );
      
      const snap = await getDocs(q);
      const olderMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
      
      if (snap.docs.length > 0) {
        oldestMessageRef.current = snap.docs[snap.docs.length - 1];
        setMessages(prev => [...olderMsgs, ...prev]);
      }
      
      setHasMoreMessages(snap.docs.length === 50);
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setLoadingOlderMsgs(false);
    }
  }, [loadingOlderMsgs, hasMoreMessages]);
  
  /* ── Detect scroll to top and load older messages ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      if (container.scrollTop < 100 && hasMoreMessages && !loadingOlderMsgs) {
        loadOlderMessages();
      }
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadOlderMessages, hasMoreMessages, loadingOlderMsgs]);

  /* ── Auto-scroll to latest message ── */
  useEffect(() => {
    const el = messagesEndRef.current;
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Send or edit a message ── */
  const sendMessage = useCallback(async () => {
    // If editing, save the edit instead
    if (editingMessageId) {
      await saveEdit();
      return;
    }
    
    const text = inputText.trim();
    if (!text || sending) return;
    // client-side rate limit
    const now = Date.now();
    if (now - lastSentRef.current < SEND_COOLDOWN_MS) return;
    lastSentRef.current = now;

    setSending(true);
    setInputText('');

    // Stop typing indicator when sending
    const socket = getSocket(user.uid, displayName);
    socket.emit('typing-global', {
      from: user.uid,
      userName: displayName,
      isTyping: false
    });

    try {
      const cu = auth.currentUser;
      const messageData = {
        text: text.slice(0, MAX_CHARS),
        uid: user.uid,
        displayName: (cu?.displayName || displayName).slice(0, 64),
        photoURL: safePhotoURL(cu?.photoURL),
        isAnonymous: user.isAnonymous ?? false,
        isAdmin: adminUser,
        createdAt: serverTimestamp(),
        edited: false,
      };
      
      // Add reply reference if replying to a message
      if (replyingTo) {
        messageData.replyTo = replyingTo.id;
        messageData.replyToText = replyingTo.text.slice(0, 100);
        messageData.replyToUser = replyingTo.displayName;
      }
      
      await addDoc(collection(db, 'messages'), messageData);
      
      // Clear reply state after sending
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Error sending message: ' + err.message);
      setInputText(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [inputText, sending, user, displayName, adminUser, editingMessageId, replyingTo, saveEdit]);

  /* ── Handle typing indicator for global chat ── */
  const handleTyping = useCallback(() => {
    const socket = getSocket(user.uid, displayName);
    
    // Emit typing start
    socket.emit('typing-global', {
      from: user.uid,
      userName: displayName,
      isTyping: true
    });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to emit typing stop after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-global', {
        from: user.uid,
        userName: displayName,
        isTyping: false
      });
    }, 2000);
  }, [user.uid, displayName]);

  /* ── Keyboard handler ── */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === 'Escape' && editingMessageId) {
      e.preventDefault();
      cancelEdit();
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

  /* ── Character count colour ── */
  const charCount = inputText.length;
  const charClass = charCount > MAX_CHARS * 0.9
    ? 'char-count danger'
    : charCount > MAX_CHARS * 0.75
      ? 'char-count warn'
      : 'char-count';

  /* ── Render ── */
  return (
    <div className="chat-room-wrapper">
      {/* Sidebar - Desktop */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        displayName={displayName}
        adminUser={adminUser}
        isGuest={isGuest}
        onProfileClick={() => setShowProfile(true)}
        onNotificationsClick={() => setShowNotifications(true)}
        onDevicesClick={() => setShowDevices(true)}
        onSearchClick={() => setShowSearch(true)}
        onSavedClick={() => setActiveTab('saved')}
        onGroupsClick={() => setActiveTab('groups')}
        onThemeToggle={() => {
          const newTheme = theme === 'dark' ? 'light' : 'dark';
          setTheme(newTheme);
        }}
        onLogout={signOutUser}
        theme={theme}
      />

      {/* Main Content Area */}
      <div className="chat-room">
        {/* Minimal Header - Just shows current view title */}
        <header className="chat-header-minimal">
          <h1 className="chat-header-title">
            {activeTab === 'global' && 'Global Chat'}
            {activeTab === 'dms' && 'Private Messages'}
            {activeTab === 'admin' && 'User Management'}
            {activeTab === 'saved' && 'Saved Messages'}
            {activeTab === 'groups' && 'Groups & Channels'}
          </h1>
          {adminUser && activeTab !== 'admin' && (
            <span className="admin-badge-minimal">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Admin
            </span>
          )}
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
              <>
                {/* Loading indicator for older messages */}
                {loadingOlderMsgs && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                    <div className="loader" style={{ width: '20px', height: '20px' }} />
                  </div>
                )}
                {/* Show "No more messages" if reached the beginning */}
                {!hasMoreMessages && messages.length > 0 && (
                  <div style={{ textAlign: 'center', padding: '12px 0', fontSize: '12px', color: '#8b8ba7' }}>
                    Beginning of conversation
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isOwn = msg.uid === user.uid;
                  const prev = messages[idx - 1];
                  const hideAvatar = !isOwn && prev?.uid === msg.uid;
                  return (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isOwn={isOwn}
                      hideAvatar={hideAvatar}
                      onDelete={adminUser || isOwn ? deleteMessage : null}
                      onBlock={adminUser ? blockUser : null}
                      onRemove={adminUser ? removeUser : null}
                      onEdit={isOwn ? startEditMessage : null}
                      onReply={startReply}
                      onSave={handleSaveMessage}
                      messages={messages}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
            
            {/* Typing indicators for global chat */}
            {typingUsers.size > 0 && (
              <div className="typing-indicator-wrapper">
                <div className="typing-indicator">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
                <span className="typing-text">
                  {Array.from(typingUsers.values()).slice(0, 3).join(', ')}
                  {typingUsers.size === 1 ? ' is' : ' are'} typing...
                </span>
              </div>
            )}
          </div>

          <div className="input-area">
            {editingMessageId && (
              <div className="editing-indicator">
                <span>✏️ Editing message</span>
                <button onClick={cancelEdit} className="cancel-edit-btn" title="Cancel editing">
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 14 4 9 9 4"/>
                    <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
                  </svg>
                  <div className="replying-text">
                    <div className="replying-to">Replying to {replyingTo.displayName}</div>
                    <div className="replying-message">{replyingTo.text}</div>
                  </div>
                </div>
                <button onClick={cancelReply} className="cancel-reply-btn" title="Cancel reply">
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
                placeholder={editingMessageId ? "Edit your message…" : replyingTo ? "Write a reply…" : "Say something to the world…"}
                rows={1}
                value={inputText}
                onChange={handleInputChange}
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
                aria-label={editingMessageId ? "Save edit" : "Send message"}
                title={editingMessageId ? "Save edit" : "Send message"}
              >
                <SendIcon />
              </button>
            </div>
            <div className="crafted-footer">Crafted by <a href="https://sakshampokharel.me" target="_blank" rel="noopener noreferrer">Saksham Pokharel</a></div>
          </div>
        </>
      )}

      {/* ── Direct Messages ── */}
      {activeTab === 'dms' && <DirectMessages user={user} showNotification={showNotification} />}

      {/* ── Admin Panel ── */}
      {activeTab === 'admin' && adminUser && <AdminPanel adminUid={user.uid} isSuperAdmin={adminUser} />}

      {/* ── Saved Messages ── */}
      {activeTab === 'saved' && (
        <SavedMessages
          user={user}
          onMessageClick={(result) => {
            // Navigate to the original message
            if (result.conversationType === 'global') {
              setActiveTab('global');
              // Scroll to message after a short delay
              setTimeout(() => {
                const element = document.getElementById(`msg-${result.messageId}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  element.classList.add('msg-highlight');
                  setTimeout(() => element.classList.remove('msg-highlight'), 2000);
                }
              }, 300);
            } else if (result.conversationType === 'dm') {
              setActiveTab('dms');
              // DM navigation will be handled by DirectMessages component
            }
          }}
          onBack={() => setActiveTab('global')}
        />
      )}

      {/* ── Groups & Channels ── */}
      {activeTab === 'groups' && !selectedGroupId && (
        <Groups
          user={user}
          onGroupSelect={(groupId) => {
            setSelectedGroupId(groupId);
          }}
          onBack={() => setActiveTab('global')}
        />
      )}

      {/* ── Group Chat ── */}
      {activeTab === 'groups' && selectedGroupId && (
        <GroupChat
          user={user}
          groupId={selectedGroupId}
          onBack={() => setSelectedGroupId(null)}
        />
      )}

      {/* ── Global Search Modal ── */}
      {showSearch && (
        <GlobalSearch
          user={user}
          friendIds={friends}
          onClose={() => setShowSearch(false)}
          onResultClick={(result) => {
            if (result.type === 'message') {
              setActiveTab('global');
              setShowSearch(false);
              // Scroll to message after a short delay
              setTimeout(() => {
                const element = document.getElementById(`msg-${result.id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  element.classList.add('msg-highlight');
                  setTimeout(() => element.classList.remove('msg-highlight'), 2000);
                }
              }, 300);
            } else if (result.type === 'user') {
              // Navigate to user profile or DMs
              setActiveTab('dms');
              setShowSearch(false);
            } else if (result.type === 'dm') {
              setActiveTab('dms');
              setShowSearch(false);
              // DM navigation will be handled by DirectMessages component
            }
          }}
        />
      )}

      {/* ── User Profile Modal ── */}
      {showProfile && <UserProfile user={user} onClose={() => setShowProfile(false)} />}

      {/* ── Device Management Modal ── */}
      {showDevices && <DeviceManagement user={user} onClose={() => setShowDevices(false)} />}

      {/* ── Notification Settings Modal ── */}
      {showNotifications && <NotificationSettings onClose={() => setShowNotifications(false)} />}

      {/* ── In-App Notifications ── */}
      {notifications.map((notification) => (
        <InAppNotification
          key={notification.id}
          notification={notification}
          onClose={() => hideNotification(notification.id)}
          onClick={notification.onClick}
        />
      ))}
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminUser={adminUser}
        isGuest={isGuest}
        onMoreClick={() => setShowMobileMenu(true)}
      />

      {/* Mobile Menu Modal */}
      {showMobileMenu && (
        <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h3>Menu</h3>
              <button onClick={() => setShowMobileMenu(false)} className="mobile-menu-close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="mobile-menu-items">
              <button
                className="mobile-menu-item"
                onClick={() => {
                  setShowProfile(true);
                  setShowMobileMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Profile</span>
              </button>

              <button
                className="mobile-menu-item"
                onClick={() => {
                  setShowNotifications(true);
                  setShowMobileMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span>Notifications</span>
              </button>

              <button
                className="mobile-menu-item"
                onClick={() => {
                  const newTheme = theme === 'dark' ? 'light' : 'dark';
                  setTheme(newTheme);
                  setShowMobileMenu(false);
                }}
              >
                {theme === 'dark' ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/>
                      <line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              <button
                className="mobile-menu-item"
                onClick={() => {
                  setShowDevices(true);
                  setShowMobileMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                <span>Active Sessions</span>
              </button>

              <div className="mobile-menu-divider"></div>

              <button
                className="mobile-menu-item logout"
                onClick={() => {
                  setShowMobileMenu(false);
                  signOutUser();
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
