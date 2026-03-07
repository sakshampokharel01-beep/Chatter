import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminPanel({ adminUid, isSuperAdmin }) {
  const [users, setUsers]       = useState([]);
  const [blocked, setBlocked]   = useState(new Set());
  const [removed, setRemoved]   = useState(new Set());
  const [admins, setAdmins]     = useState(new Set());
  const [msgCount, setMsgCount] = useState(0);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  // Load all registered users
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('displayName'));
    return onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
      setRemoved(new Set(snap.docs.map(d => d.id)));
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

  // Track total message count
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
        ...msgsSnap.docs.map(d => deleteDoc(d.ref)),
        setDoc(doc(db, 'deletedUsers', uid), { deletedAt: serverTimestamp(), deletedBy: adminUid }),
        setDoc(doc(db, 'blockedUsers', uid), { blockedAt: serverTimestamp(), blockedBy: adminUid }),
      ]);
    } catch (e) {
      alert('Remove failed: ' + e.message);
    }
  };

  const filtered = users.filter(u =>
    !removed.has(u.id) && 
    !(u.email || '').toLowerCase().endsWith('@example.com') && (
      !search ||
      (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div className="admin-stats">
          <div className="admin-stat">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Registered Users <span className="admin-count">{users.filter(u => !removed.has(u.id)).length}</span>
          </div>
          <div className="admin-stat">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Messages <span className="admin-count">{msgCount}</span>
          </div>
        </div>
        <input
          id="admin-search"
          name="admin-search"
          className="admin-search"
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="admin-loading"><div className="loader" /></div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">No users found.</div>
      ) : (
        <div className="admin-user-list">
          {filtered.map(u => {
            const isSelf    = u.id === adminUid;
            const isBlocked = blocked.has(u.id);
            const isAnAdmin = isSelf || admins.has(u.id);
            return (
              <div key={u.id} className="admin-user-row">
                <div className="admin-user-avatar">
                  {u.photoURL
                    ? <img src={u.photoURL} alt={u.displayName} />
                    : <div className="admin-avatar-placeholder">{(u.displayName || '?').charAt(0).toUpperCase()}</div>
                  }
                </div>
                <div className="admin-user-info">
                  <span className="admin-user-name">
                    {u.displayName || <em style={{color:'#666',fontStyle:'normal'}}>Unknown User</em>}
                    {isSelf   && <span className="admin-tag">You (Admin)</span>}
                    {!isSelf && isAnAdmin && <span className="admin-tag">Admin</span>}
                    {isBlocked && <span className="blocked-tag">Blocked</span>}
                  </span>
                  <span className="admin-user-uid">{u.email || ''}</span>
                </div>
                {!isSelf && (
                  <div className="admin-user-actions">
                    {isSuperAdmin && (
                      <button
                        className={`admin-action-btn ${isAnAdmin ? 'unblock' : 'promote'}`}
                        onClick={() => isAnAdmin ? handleDemote(u.id, u.displayName) : handlePromote(u.id, u.displayName)}
                        title={isAnAdmin ? 'Remove admin' : 'Make admin'}
                      >
                        {isAnAdmin ? (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
                            Demote
                          </>
                        ) : (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            Admin
                          </>
                        )}
                      </button>
                    )}
                    <button
                      className={`admin-action-btn ${isBlocked ? 'unblock' : 'block'}`}
                      onClick={() => handleBlock(u.id, u.displayName)}
                      title={isBlocked ? 'Unblock user' : 'Block user'}
                    >
                      {isBlocked ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Unblock
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                          Block
                        </>
                      )}
                    </button>
                    <button
                      className="admin-action-btn remove"
                      onClick={() => handleRemove(u.id, u.displayName)}
                      title="Remove user from Chatter"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="23" y2="14"/><line x1="23" y1="8" x2="17" y2="14"/></svg>
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
