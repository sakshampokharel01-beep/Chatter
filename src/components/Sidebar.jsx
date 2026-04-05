import React, { useState } from 'react';
import '../styles/Sidebar.css';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  user, 
  displayName, 
  adminUser, 
  isGuest,
  onProfileClick,
  onNotificationsClick,
  onDevicesClick,
  onThemeToggle,
  onLogout,
  theme
}) {
  const [messagesExpanded, setMessagesExpanded] = useState(true);
  const [moreExpanded, setMoreExpanded] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        {/* Logo/Brand */}
        <div className="sidebar-brand">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="#5b8dee"/>
            <path d="M14 16h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H26l-5 4v-4h-7a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2z" fill="#fff" fillOpacity=".92"/>
            <circle cx="19" cy="24" r="1.5" fill="#5b8dee"/>
            <circle cx="24" cy="24" r="1.5" fill="#5b8dee"/>
            <circle cx="29" cy="24" r="1.5" fill="#5b8dee"/>
          </svg>
          <span className="sidebar-brand-text">Chatter</span>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {/* Messages Section (Expandable) */}
          <div className="sidebar-section">
            <button
              className={`sidebar-item expandable ${messagesExpanded ? 'expanded' : ''}`}
              onClick={() => setMessagesExpanded(!messagesExpanded)}
              title="Messages"
            >
              <div className="sidebar-item-content">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Messages</span>
              </div>
              <svg 
                className="expand-icon" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* Sub-items */}
            {messagesExpanded && (
              <div className="sidebar-subitems">
                <button
                  className={`sidebar-subitem ${activeTab === 'global' ? 'active' : ''}`}
                  onClick={() => setActiveTab('global')}
                  title="Global Chat"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <span>Global</span>
                </button>

                <button
                  className={`sidebar-subitem ${activeTab === 'dms' ? 'active' : ''} ${isGuest ? 'disabled' : ''}`}
                  onClick={() => !isGuest && setActiveTab('dms')}
                  disabled={isGuest}
                  title={isGuest ? 'Sign in with Google to use Direct Messages' : 'Private Messages'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                  <span>Private</span>
                  {isGuest && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:'auto'}}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Users (Admin Only) */}
          {adminUser && (
            <button
              className={`sidebar-item ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
              title="User Management"
            >
              <div className="sidebar-item-content">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Users</span>
              </div>
            </button>
          )}

          {/* Profile */}
          <button
            className="sidebar-item"
            onClick={onProfileClick}
            title="Edit Profile"
          >
            <div className="sidebar-item-content">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Profile</span>
            </div>
          </button>

          {/* Notifications */}
          <button
            className="sidebar-item"
            onClick={onNotificationsClick}
            title="Notification Settings"
          >
            <div className="sidebar-item-content">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span>Notifications</span>
            </div>
          </button>
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-bottom">
          {/* More Section (Expandable) */}
          <div className="sidebar-section">
            <button
              className={`sidebar-item expandable ${moreExpanded ? 'expanded' : ''}`}
              onClick={() => setMoreExpanded(!moreExpanded)}
              title="More Options"
            >
              <div className="sidebar-item-content">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
                <span>More</span>
              </div>
              <svg 
                className="expand-icon" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* More Sub-items */}
            {moreExpanded && (
              <div className="sidebar-subitems">
                <button
                  className="sidebar-subitem"
                  onClick={onThemeToggle}
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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
                  className="sidebar-subitem"
                  onClick={onDevicesClick}
                  title="Manage Active Sessions"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  <span>Active Sessions</span>
                </button>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="sidebar-user" title={displayName}>
            <div className="sidebar-user-avatar">
              {user.photoURL ? (
                <img src={user.photoURL} alt={displayName} />
              ) : (
                <div className="sidebar-user-avatar-placeholder">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{displayName}</div>
              <div className="sidebar-user-status">
                <span className="status-dot online"></span>
                <span>Online</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            className="sidebar-item logout"
            onClick={onLogout}
            title="Log Out"
          >
            <div className="sidebar-item-content">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Log Out</span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
