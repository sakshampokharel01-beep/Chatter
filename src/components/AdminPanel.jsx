import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/AdminPanel.css';

export default function AdminPanel({ adminUid, isSuperAdmin }) {
  const [users, setUsers]       = useState([]);
  const [blocked, setBlocked]   = useState(new Set());
  const [removed, setRemoved]   = useState(new Set());
  const [admins, setAdmins]     = useState(new Set());
  const [msgCount, setMsgCount] = useState(0);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // all, admins, blocked

  // Load all registered users
  useEffect(() => {
    const q = collection(db, 'users');
    return onSnapshot(q, snap => {
      const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      allUsers.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      setUsers(allUsers);
      setLoading(false);
    }, (err) => {
      console.error('Admin users snapshot error:', err);
      setLoading(false);
    });
  }, []);

  // Track blocked users
  useEffect(() => {
    return onSnapshot(collection(db, 'blockedUsers'), snap => {
      setBlocked(new Set(snap.docs.map(d => d.id)));
    }, (err) => {
      console.error('Blocked users snapshot error:', err);
    });
  }, []);

  // Track removed users
  useEffect(() => {
    return onSnapshot(collection(db, 'deletedUsers'), snap => {
      const ids = snap.docs.map(d => d.id);
      setRemoved(new Set(ids));
    }, (err) => {
      console.error('Deleted users snapshot error:', err);
    });
  }, []);

  // Track admins
  useEffect(() => {
    return onSnapshot(collection(db, 'admins'), snap => {
      setAdmins(new Set(snap.docs.map(d => d.id)));
    }, (err) => {
      console.error('Admins snapshot error:', err);
    });
  }, []);

  // Track message count for stats
  useEffect(() => {
    return onSnapshot(collection(db, 'messages'), snap => {
      setMsgCount(snap.size);
    }, (err) => {
      console.error('Messages count snapshot error:', err);
    });
  }, []);

  const handlePromote = async (uid, name) => {
    if (!window.confirm(`Make "${name}" an admin?\n\nThey will get full admin powers.`)) return;
    try {
      await setDoc(doc(db, 'admins', uid), { grantedAt: serverTimestamp(), grantedBy: adminUid });
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };

  const handleDemote = async (uid, name) => {
    if (!window.confirm(`Remove admin from "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'admins', uid));
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };

  const handleBlock = async (uid, name) => {
    if (uid === adminUid) return;
    if (admins.has(uid)) { alert('You cannot block another admin.'); return; }
    try {
      if (blocked.has(uid)) {
        if (!window.confirm(`Unblock "${name}"?`)) return;
        await deleteDoc(doc(db, 'blockedUsers', uid));
      } else {
        if (!window.confirm(`Block "${name}"? They cannot send messages.`)) return;
        await setDoc(doc(db, 'blockedUsers', uid), { blockedAt: serverTimestamp(), blockedBy: adminUid });
      }
    } catch (e) {
      alert('Action failed: ' + e.message);
    }
  };

  const handleRemove = async (uid, name) => {
    if (uid === adminUid) return;
    if (admins.has(uid)) { alert('You cannot remove another admin.'); return; }
    if (!window.confirm(`Remove "${name}" from Chatter?\n\nThey will be instantly signed out and their messages deleted.`)) return;
    try {
      // Delete all their global messages
      const msgsSnap = await getDocs(query(collection(db, 'messages'), where('uid', '==', uid)));
      await Promise.all([
        // Delete all their messages
        ...msgsSnap.docs.map(d => deleteDoc(d.ref)),
        // Add to deletedUsers collection (permanent ban)
        setDoc(doc(db, 'deletedUsers', uid), { deletedAt: serverTimestamp(), deletedBy: adminUid }),
        // Add to blockedUsers collection (prevent messaging)
        setDoc(doc(db, 'blockedUsers', uid), { blockedAt: serverTimestamp(), blockedBy: adminUid }),
        // DELETE the user document from users collection (THIS WAS MISSING!)
        deleteDoc(doc(db, 'users', uid)),
      ]);
    } catch (e) {
      console.error('Remove failed:', e);
      alert('Remove failed: ' + e.message);
    }
  };



  const filtered = users.filter(u => {
    const notRemoved = !removed.has(u.id);
    const notExample = !(u.email || '').toLowerCase().endsWith('@example.com');
    const matchesSearch = !search ||
      (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    
    // Apply filter tab
    let matchesFilter = true;
    if (filterTab === 'admins') {
      matchesFilter = admins.has(u.id);
    } else if (filterTab === 'blocked') {
      matchesFilter = blocked.has(u.id);
    }
    
    return notRemoved && notExample && matchesSearch && matchesFilter;
  });

  const stats = {
    total: users.filter(u => !removed.has(u.id) && !(u.email || '').toLowerCase().endsWith('@example.com')).length,
    admins: Array.from(admins).filter(id => !removed.has(id)).length,
    blocked: Array.from(blocked).filter(id => !removed.has(id)).length,
    messages: msgCount
  };


  return (
    <div className="admin-panel-modern">
      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon users">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon admins">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.admins}</div>
            <div className="stat-label">Admins</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon blocked">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.blocked}</div>
            <div className="stat-label">Blocked</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon messages">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.messages}</div>
            <div className="stat-label">Messages</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="admin-controls">
        <div className="admin-search-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            id="admin-search"
            name="admin-search"
            className="admin-search-modern"
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        <div className="admin-filter-tabs">
          <button
            className={`filter-tab ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All Users
          </button>
          <button
            className={`filter-tab ${filterTab === 'admins' ? 'active' : ''}`}
            onClick={() => setFilterTab('admins')}
          >
            Admins
          </button>
          <button
            className={`filter-tab ${filterTab === 'blocked' ? 'active' : ''}`}
            onClick={() => setFilterTab('blocked')}
          >
            Blocked
          </button>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="admin-loading-modern">
          <div className="loader" />
          <p>Loading users...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty-modern">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <h3>No users found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="admin-users-grid">
          {filtered.map(u => {
            const isSelf    = u.id === adminUid;
            const isBlocked = blocked.has(u.id);
            const isAnAdmin = isSelf || admins.has(u.id);
            return (
              <div key={u.id} className={`admin-user-card ${isSelf ? 'self' : ''}`}>
                <div className="user-card-header">
                  <div className="user-avatar-large">
                    {u.photoURL
                      ? <img src={u.photoURL} alt={u.displayName} />
                      : <div className="user-avatar-placeholder-large">{(u.displayName || '?').charAt(0).toUpperCase()}</div>
                    }
                    {u.online && <span className="online-indicator"></span>}
                  </div>
                  <div className="user-card-info">
                    <h3 className="user-card-name">
                      {u.displayName || <em style={{color:'var(--text-secondary)',fontStyle:'normal'}}>Unknown User</em>}
                    </h3>
                    <p className="user-card-email">{u.email || 'No email'}</p>
                  </div>
                </div>

                <div className="user-card-badges">
                  {isSelf && <span className="badge badge-self">You</span>}
                  {isAnAdmin && <span className="badge badge-admin">Admin</span>}
                  {isBlocked && <span className="badge badge-blocked">Blocked</span>}
                  {u.isAnonymous && <span className="badge badge-guest">Guest</span>}
                </div>

                {!isSelf && (
                  <div className="user-card-actions">
                    {isSuperAdmin && (
                      <button
                        className={`action-btn ${isAnAdmin ? 'demote' : 'promote'}`}
                        onClick={() => isAnAdmin ? handleDemote(u.id, u.displayName) : handlePromote(u.id, u.displayName)}
                        title={isAnAdmin ? 'Remove admin privileges' : 'Grant admin privileges'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        {isAnAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    )}
                    <button
                      className={`action-btn ${isBlocked ? 'unblock' : 'block'}`}
                      onClick={() => handleBlock(u.id, u.displayName)}
                      title={isBlocked ? 'Unblock user' : 'Block user from messaging'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {isBlocked ? (
                          <polyline points="20 6 9 17 4 12"/>
                        ) : (
                          <>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                          </>
                        )}
                      </svg>
                      {isBlocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      className="action-btn remove"
                      onClick={() => handleRemove(u.id, u.displayName)}
                      title="Permanently remove user from Chatter"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
