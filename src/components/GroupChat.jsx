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
  getDoc,
  getDocs,
  where,
  arrayUnion
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
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load group details and members
  useEffect(() => {
    const loadGroup = async () => {
      try {
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        if (groupDoc.exists()) {
          const groupData = { id: groupDoc.id, ...groupDoc.data() };
          setGroup(groupData);
          
          // Load member details
          if (groupData.members && groupData.members.length > 0) {
            setLoadingMembers(true);
            const membersList = [];
            for (const memberId of groupData.members) {
              try {
                const userDoc = await getDoc(doc(db, 'users', memberId));
                if (userDoc.exists()) {
                  membersList.push({
                    id: memberId,
                    ...userDoc.data()
                  });
                }
              } catch (err) {
                console.error(`Failed to load member ${memberId}:`, err);
              }
            }
            setMembers(membersList);
            setLoadingMembers(false);
          }
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

  // Load friends list
  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const q = query(
        collection(db, 'friends'),
        where('users', 'array-contains', user.uid)
      );
      const snapshot = await getDocs(q);
      
      const friendsList = [];
      for (const friendDoc of snapshot.docs) {
        const data = friendDoc.data();
        const friendId = data.users.find(uid => uid !== user.uid);
        
        // Get friend's user data
        const userDoc = await getDoc(doc(db, 'users', friendId));
        if (userDoc.exists()) {
          friendsList.push({
            id: friendId,
            ...userDoc.data(),
            isInGroup: group?.members?.includes(friendId)
          });
        }
      }
      
      setFriends(friendsList);
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  };

  // Add member to group
  const addMember = async (friendId) => {
    try {
      await updateDoc(doc(db, 'groups', groupId), {
        members: arrayUnion(friendId),
        memberCount: (group?.memberCount || 0) + 1
      });
      
      // Update local friends list
      setFriends(prev => prev.map(f => 
        f.id === friendId ? { ...f, isInGroup: true } : f
      ));
      
      // Add to members list
      const userDoc = await getDoc(doc(db, 'users', friendId));
      if (userDoc.exists()) {
        setMembers(prev => [...prev, { id: friendId, ...userDoc.data() }]);
      }
    } catch (err) {
      console.error('Failed to add member:', err);
      alert('Failed to add member: ' + err.message);
    }
  };

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
        <button 
          className="group-chat-members-btn"
          onClick={() => setShowMembers(!showMembers)}
          title="View members"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </button>
        <button 
          className="group-chat-add-btn"
          onClick={() => {
            setShowAddMembers(true);
            loadFriends();
          }}
          title="Add members"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        </button>
      </div>

      <div className="group-chat-content">
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

        {/* Members Sidebar */}
        {showMembers && (
          <div className="group-members-sidebar">
            <div className="group-members-header">
              <h3>Members — {members.length}</h3>
            </div>
            <div className="group-members-list">
              {loadingMembers ? (
                <div className="group-members-loading">
                  <div className="loader" />
                </div>
              ) : members.length === 0 ? (
                <div className="group-members-empty">
                  <p>No members</p>
                </div>
              ) : (
                members.map(member => (
                  <div key={member.id} className="group-member-item">
                    <div className="group-member-avatar">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt={member.displayName} />
                      ) : (
                        <div className="group-member-avatar-placeholder">
                          {(member.displayName || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="group-member-info">
                      <div className="group-member-name">{member.displayName}</div>
                      {member.id === group.createdBy && (
                        <span className="group-member-badge">Owner</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
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

      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="group-modal-overlay" onClick={() => setShowAddMembers(false)}>
          <div className="group-modal" onClick={(e) => e.stopPropagation()}>
            <div className="group-modal-header">
              <h3>Add Members</h3>
              <button onClick={() => setShowAddMembers(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="group-modal-content">
              {loadingFriends ? (
                <div className="group-modal-loading">
                  <div className="loader" />
                  <p>Loading friends...</p>
                </div>
              ) : friends.length === 0 ? (
                <div className="group-modal-empty">
                  <p>No friends to add</p>
                </div>
              ) : (
                <div className="friends-list">
                  {friends.map(friend => (
                    <div key={friend.id} className="friend-item">
                      <div className="friend-avatar">
                        {friend.photoURL ? (
                          <img src={friend.photoURL} alt={friend.displayName} />
                        ) : (
                          <div className="friend-avatar-placeholder">
                            {(friend.displayName || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="friend-info">
                        <div className="friend-name">{friend.displayName}</div>
                      </div>
                      {friend.isInGroup ? (
                        <span className="friend-status">Already in group</span>
                      ) : (
                        <button
                          className="friend-add-btn"
                          onClick={() => addMember(friend.id)}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
