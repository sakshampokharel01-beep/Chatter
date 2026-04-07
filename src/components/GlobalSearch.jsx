import React, { useState, useEffect, useRef } from 'react';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import '../styles/GlobalSearch.css';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString([], { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function highlightText(text, query) {
  if (!query || !text) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <mark key={i}>{part}</mark> 
      : part
  );
}

export default function GlobalSearch({ user, onClose, onResultClick, friendIds }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { results, loading } = useGlobalSearch(searchQuery, user.uid, friendIds);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleResultClick = (result) => {
    onResultClick(result);
    onClose();
  };

  const totalResults = results.messages.length + results.users.length + results.dms.length;

  return (
    <div className="global-search-overlay">
      <div className="global-search-modal" ref={modalRef}>
        {/* Header */}
        <div className="global-search-header">
          <div className="global-search-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              className="global-search-input"
              placeholder="Search messages, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            {searchQuery && (
              <button 
                className="global-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <button className="global-search-close" onClick={onClose} aria-label="Close search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Results */}
        <div className="global-search-results">
          {loading && (
            <div className="global-search-loading">
              <div className="loader" style={{ width: '24px', height: '24px' }} />
              <span>Searching...</span>
            </div>
          )}

          {!loading && searchQuery.length >= 2 && totalResults === 0 && (
            <div className="global-search-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <p>No results found for "{searchQuery}"</p>
            </div>
          )}

          {!loading && searchQuery.length < 2 && (
            <div className="global-search-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <p>Type at least 2 characters to search</p>
            </div>
          )}

          {/* Messages */}
          {!loading && results.messages.length > 0 && (
            <div className="global-search-section">
              <div className="global-search-section-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Messages ({results.messages.length})</span>
              </div>
              {results.messages.map(msg => (
                <button
                  key={msg.id}
                  className="global-search-result-item"
                  onClick={() => handleResultClick({ ...msg, type: 'message', conversationId: 'global' })}
                >
                  <div className="global-search-result-content">
                    <div className="global-search-result-title">
                      {msg.displayName || 'User'}
                      {msg.isAdmin && <span className="admin-badge-small">Admin</span>}
                    </div>
                    <div className="global-search-result-text">
                      {highlightText(msg.text, searchQuery)}
                    </div>
                    <div className="global-search-result-meta">
                      Global Chat • {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Users */}
          {!loading && results.users.length > 0 && (
            <div className="global-search-section">
              <div className="global-search-section-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Users ({results.users.length})</span>
              </div>
              {results.users.map(usr => (
                <button
                  key={usr.id}
                  className="global-search-result-item"
                  onClick={() => handleResultClick({ ...usr, type: 'user' })}
                >
                  <div className="global-search-result-avatar">
                    {usr.photoURL ? (
                      <img src={usr.photoURL} alt={usr.displayName} />
                    ) : (
                      <div className="global-search-result-avatar-placeholder">
                        {(usr.displayName || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="global-search-result-content">
                    <div className="global-search-result-title">
                      {highlightText(usr.displayName, searchQuery)}
                    </div>
                    <div className="global-search-result-meta">
                      {usr.email || 'User profile'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* DMs */}
          {!loading && results.dms.length > 0 && (
            <div className="global-search-section">
              <div className="global-search-section-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
                <span>Private Messages ({results.dms.length})</span>
              </div>
              {results.dms.map(msg => (
                <button
                  key={msg.id}
                  className="global-search-result-item"
                  onClick={() => handleResultClick({ ...msg, type: 'dm', conversationId: msg.dmId })}
                >
                  <div className="global-search-result-content">
                    <div className="global-search-result-title">
                      {msg.displayName || 'User'}
                    </div>
                    <div className="global-search-result-text">
                      {highlightText(msg.text, searchQuery)}
                    </div>
                    <div className="global-search-result-meta">
                      Private Message • {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
