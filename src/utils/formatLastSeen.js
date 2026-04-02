/**
 * Format last seen timestamp into human-readable text
 * @param {Timestamp|Date|number} lastSeen - Firestore timestamp or Date
 * @param {boolean} isOnline - Whether user is currently online
 * @returns {string} Formatted last seen text
 */
export function formatLastSeen(lastSeen, isOnline) {
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
