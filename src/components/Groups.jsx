import React, { useState } from 'react';
import { useGroups } from '../hooks/useGroups';
import '../styles/Groups.css';

export default function Groups({ user, onGroupSelect, onBack }) {
  const { groups, loading, createGroup, leaveGroup } = useGroups(user.uid);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupType, setNewGroupType] = useState('group');
  const [newGroupPublic, setNewGroupPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || creating) return;

    setCreating(true);
    try {
      const groupId = await createGroup({
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        type: newGroupType,
        isPublic: newGroupPublic
      });
      
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupType('group');
      setNewGroupPublic(false);
      
      // Select the newly created group
      onGroupSelect(groupId);
    } catch (err) {
      alert('Failed to create group: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleLeaveGroup = async (groupId, groupName) => {
    if (!window.confirm(`Leave "${groupName}"?`)) return;

    try {
      await leaveGroup(groupId);
    } catch (err) {
      alert('Failed to leave group: ' + err.message);
    }
  };

  return (
    <div className="groups-container">
      {/* Header */}
      <div className="groups-header">
        <button className="groups-back" onClick={onBack} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2>Groups & Channels</h2>
        <button 
          className="groups-create-btn"
          onClick={() => setShowCreateModal(true)}
          title="Create new group"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="groups-content">
        {loading ? (
          <div className="groups-loading">
            <div className="loader" />
            <p>Loading groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="groups-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <h3>No groups yet</h3>
            <p>Create or join a group to start collaborating</p>
            <button 
              className="groups-empty-create-btn"
              onClick={() => setShowCreateModal(true)}
            >
              Create Group
            </button>
          </div>
        ) : (
          <div className="groups-list">
            {groups.map(group => (
              <div 
                key={group.id} 
                className="group-item"
                onClick={() => onGroupSelect(group.id)}
              >
                <div className="group-icon">
                  {group.type === 'channel' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      <path d="M8 10h.01M12 10h.01M16 10h.01"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  )}
                </div>
                <div className="group-info">
                  <div className="group-name">
                    {group.name}
                    {group.isPublic && (
                      <span className="group-badge">Public</span>
                    )}
                  </div>
                  <div className="group-meta">
                    {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                    {group.messageCount > 0 && ` • ${group.messageCount} messages`}
                  </div>
                </div>
                <button
                  className="group-leave-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLeaveGroup(group.id, group.name);
                  }}
                  title="Leave group"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="groups-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="groups-modal" onClick={(e) => e.stopPropagation()}>
            <div className="groups-modal-header">
              <h3>Create New {newGroupType === 'channel' ? 'Channel' : 'Group'}</h3>
              <button onClick={() => setShowCreateModal(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="groups-modal-form">
              <div className="form-group">
                <label>Type</label>
                <div className="form-radio-group">
                  <label className="form-radio">
                    <input
                      type="radio"
                      value="group"
                      checked={newGroupType === 'group'}
                      onChange={(e) => setNewGroupType(e.target.value)}
                    />
                    <span>Group</span>
                    <small>For teams and communities</small>
                  </label>
                  <label className="form-radio">
                    <input
                      type="radio"
                      value="channel"
                      checked={newGroupType === 'channel'}
                      onChange={(e) => setNewGroupType(e.target.value)}
                    />
                    <span>Channel</span>
                    <small>For broadcasts and announcements</small>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="group-name">Name *</label>
                <input
                  id="group-name"
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value.slice(0, 100))}
                  placeholder={`Enter ${newGroupType} name`}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="group-desc">Description</label>
                <textarea
                  id="group-desc"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value.slice(0, 500))}
                  placeholder={`Describe your ${newGroupType}`}
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={newGroupPublic}
                    onChange={(e) => setNewGroupPublic(e.target.checked)}
                  />
                  <span>Make this {newGroupType} public</span>
                  <small>Anyone can discover and join</small>
                </label>
              </div>

              <div className="groups-modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!newGroupName.trim() || creating}
                  className="btn-primary"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
