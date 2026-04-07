import React, { useState, useEffect, useRef } from 'react';
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
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/GroupChat.css';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
    >
      {initial}
    </div>
  );
}

export default function GroupChat({ user, groupId, onBack }) {
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load group details
  useEffect(() => {
    const loadGroup = async () => {
      try {
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        if (groupDoc.exists()) {
          setGroup({ id: groupDoc.id, ...groupDoc.data() });
        }
      } catch (err) {
        console.error('Failed to load group:', err);
      }
    };
    loadGroup();
  }, [groupId]);

  // Subscribe to group messages
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'groups', groupId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
      setMessages(msgs);
      setLoading(false);
    }, (err) => {
      console.error('Group messages snapshot error:', err);
      setLoading(false);
    });

    return unsubscribe;
  }, [groupId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText('');

    try {
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        text: text.slice(0, 500),
        uid: user.uid,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        edited: false
      });

      // Update group's lastActivity and messageCount
      await updateDoc(doc(db, 'groups', groupId), {
        lastActivity: serverTimestamp(),
        messageCount: (group?.messageCount || 0) + 1
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Error sending message: ' + err.message);
      setInputText(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!group) {
    return (
      <div className="group-chat-container">
        <div className="group-chat-loading">
          <div className="loader" />
        </div>
      </div>
    );
  }

  return (
    <div className="group-chat-container">
      {/* Header */}
      <div className="group-chat-header">
        <button className="group-chat-back" onClick={onBack} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="group-chat-info">
          <h2>{group.name}</h2>
          <span className="group-chat-meta">
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="group-chat-messages">
        {loading ? (
          <div className="group-chat-loading">
            <div className="loader" />
          </div>
        ) : messages.length === 0 ? (
          <div className="group-chat-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwn = msg.uid === user.uid;
              return (
                <div key={msg.id} className={`message-row ${isOwn ? 'own' : 'other'}`}>
                  <div className="msg-avatar">
                    <Avatar displayName={msg.displayName} photoURL={msg.photoURL} size={30} />
                  </div>
                  <div className="msg-content">
                    {!isOwn && (
                      <span className="msg-sender">{msg.displayName}</span>
                    )}
                    <div className="msg-bubble-wrap">
                      <div className="msg-bubble">
                        {msg.text}
                        {msg.edited && <span className="msg-edited-label"> (edited)</span>}
                      </div>
                    </div>
                    <span className="msg-time">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="group-chat-input-container">
        <textarea
          ref={inputRef}
          className="group-chat-input"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value.slice(0, 500))}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={sending}
        />
        <button
          className="group-chat-send-btn"
          onClick={sendMessage}
          disabled={!inputText.trim() || sending}
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
