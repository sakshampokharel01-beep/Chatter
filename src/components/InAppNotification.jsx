import React, { useEffect } from 'react';

export default function InAppNotification({ notification, onClose, onClick }) {
  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!notification) return null;

  const { type, title, message, avatar, icon } = notification;

  return (
    <div 
      className={`in-app-notification ${type || 'default'}`}
      onClick={() => {
        if (onClick) onClick();
        onClose();
      }}
    >
      <div className="in-app-notification-content">
        {avatar && (
          <div className="in-app-notification-avatar">
            {avatar.startsWith('http') ? (
              <img src={avatar} alt="" />
            ) : (
              <div className="in-app-notification-avatar-placeholder">
                {avatar}
              </div>
            )}
          </div>
        )}
        
        {icon && !avatar && (
          <div className="in-app-notification-icon">
            {icon}
          </div>
        )}

        <div className="in-app-notification-text">
          <div className="in-app-notification-title">{title}</div>
          {message && <div className="in-app-notification-message">{message}</div>}
        </div>

        <button 
          className="in-app-notification-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close notification"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="in-app-notification-progress">
        <div className="in-app-notification-progress-bar"></div>
      </div>
    </div>
  );
}
