/**
 * Format last seen timestamp into human-readable text
 * @param {Timestamp|Date|number} lastSeen - Firestore timestamp or Date
 * @param {boolean} isOnline - Whether user is currently online
 * @returns {string} Formatted last seen text
 */
export function formatLastSeen(lastSeen, isOnline) {
  // Check if lastSeen is stale (older than 2 minutes)
  // If so, consider user offline even if online flag is true
  if (lastSeen) {
    try {
      const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
      const now = new Date();
      const diffMs = now - lastSeenDate;
      const diffMins = Math.floor(diffMs / 60000);
      
      // If lastSeen is older than 2 minutes, user is definitely offline
      // (presence updates happen every 30 seconds, so 2 min is safe threshold)
      if (diffMins >= 2) {
        isOnline = false;
      }
    } catch (err) {
      // If error parsing date, assume offline
      isOnline = false;
    }
  }

  if (isOnline) {
    return 'Online';
  }

  if (!lastSeen) {
    return 'Offline';
  }

  try {
    const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const now = new Date();
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return lastSeenDate.toLocaleDateString();
    }
  } catch (err) {
    return 'Offline';
  }
}

/**
 * Check if user is actually online based on lastSeen timestamp
 * @param {Timestamp|Date|number} lastSeen - Firestore timestamp or Date
 * @param {boolean} isOnline - Whether user's online flag is true
 * @returns {boolean} True if user is actually online
 */
export function isUserActuallyOnline(lastSeen, isOnline) {
  if (!isOnline) return false;
  
  if (!lastSeen) return false;
  
  try {
    const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const now = new Date();
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    // User is only considered online if lastSeen is within 2 minutes
    return diffMins < 2;
  } catch (err) {
    return false;
  }
}
