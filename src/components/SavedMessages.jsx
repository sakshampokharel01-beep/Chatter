import React, { useRef, useEffect } from 'react';
import { useSavedMessages } from '../hooks/useSavedMessages';
import '../styles/SavedMessages.css';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString([], { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export default function SavedMessages({ user, onMessageClick, onBack }) {
  const { savedMessages, loading, toggleSaveMessage, loadMore, hasMore } = useSavedMessages(user.uid);
  const containerRef = useRef(null);

  // Detect scroll to bottom for pagination
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !loading) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasMore, loading]);

  const handleRemoveBookmark = async (message, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Remove this bookmark?')) return;

    try {
      await toggleSaveMessage(
        { id: message.messageId, text: message.messageText },
        message.conversationType,
        message.conversationId
      );
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
      alert('Failed to remove bookmark');
    }
  };

  const handleMessageClick = (message) => {
    onMessageClick({
      messageId: message.messageId,
      conversationType: message.conversationType,
      conversationId: message.conversationId
    });
  };

  return (
    <div className="saved-messages-container">
      {/* Header */}
      <div className="saved-messages-header">
        <button className="saved-messages-back" onClick={onBack} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2>Saved Messages</h2>
        <div className="saved-messages-count">
          {savedMessages.length} {savedMessages.length === 1 ? 'message' : 'messages'}
        </div>
      </div>

      {/* Content */}
      <div className="saved-messages-content" ref={containerRef}>
        {loading && savedMessages.length === 0 ? (
          <div className="saved-messages-loading">
            <div className="loader" />
            <p>Loading saved messages...</p>
          </div>
        ) : savedMessages.length === 0 ? (
          <div className="saved-messages-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <h3>No saved messages yet</h3>
            <p>Bookmark important messages to find them easily later</p>
          </div>
        ) : (
          <div className="saved-messages-list">
            {savedMessages.map(message => (
              <div 
                key={message.id} 
                className="saved-message-item"
                onClick={() => handleMessageClick(message)}
              >
                <div className="saved-message-header">
                  <div className="saved-message-sender">
                    {message.messageSenderPhoto ? (
                      <img 
                        src={message.messageSenderPhoto} 
                        alt={message.messageSender}
                        className="saved-message-avatar"
                      />
                    ) : (
                      <div className="saved-message-avatar-placeholder">
                        {(message.messageSender || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="saved-message-sender-info">
                      <span className="saved-message-sender-name">
                        {message.messageSender}
                      </span>
                      <span className="saved-message-meta">
                        {message.conversationType === 'global' ? 'Global Chat' : 'Private Message'} • 
                        {formatTime(message.messageTimestamp)}
                      </span>
                    </div>
                  </div>
                  <button
                    className="saved-message-remove"
                    onClick={(e) => handleRemoveBookmark(message, e)}
                    title="Remove bookmark"
                    aria-label="Remove bookmark"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                </div>
                <div className="saved-message-text">
                  {message.messageText}
                </div>
                <div className="saved-message-footer">
                  <span className="saved-message-saved-at">
                    Saved {formatTime(message.savedAt)}
                  </span>
                  <button className="saved-message-goto">
                    Go to message
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div className="saved-messages-load-more">
                <button onClick={loadMore} disabled={loading}>
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
