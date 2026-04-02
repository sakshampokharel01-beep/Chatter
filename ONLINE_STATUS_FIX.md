# Online Status & Message Seen Status - Bug Fixes

## Issues Fixed

### 1. Messages Showing as "Seen" Immediately
**Problem:** Messages were being marked as "seen" as soon as the chat was opened, even if the user wasn't actively viewing the window or had the tab in the background.

**Root Cause:** The code was marking all unseen messages as "seen" immediately when the chat loaded, without checking if the window was focused or visible.

**Solution:**
- Messages are now only marked as "seen" when:
  - The window is visible (`!document.hidden`)
  - The window has focus (`document.hasFocus()`)
- Added event listeners for `visibilitychange` and `focus` events to mark messages as seen when the user returns to the tab
- Messages are still marked as "delivered" when the chat is opened (this is correct behavior)
- Fixed query to use `orderBy` and `limit` instead of `not-in` (which doesn't work with arrays)

### 2. Online Status Staying "Online" After User Leaves
**Problem:** Users were showing as "online" even after they closed the tab, switched to another tab, or minimized the window.

**Root Cause:** 
- The visibility change handler wasn't properly setting users offline
- The periodic update (every 30 seconds) was running even when the tab was hidden
- No proper handling of window focus/blur events
- No fallback mechanism for stale online status

**Solution:**
- Added `isSettingOfflineRef` to prevent duplicate offline calls
- Periodic updates now only run when window is visible AND focused
- Added proper `focus` and `blur` event handlers
- Added 2-second delay on blur to avoid flickering when quickly switching tabs
- Improved visibility change handler to check both `document.hidden` and `document.hasFocus()`
- Removed error console logs (silently fail for non-critical operations)
- **Added automatic stale detection**: Users are automatically shown as offline if their `lastSeen` timestamp is older than 2 minutes, even if the `online` flag is still true
- Created `isUserActuallyOnline()` helper function to check both the online flag and lastSeen timestamp

## Firestore Rules Status

✅ **Rules are properly configured:**

1. **Online Status Updates** (Line 56-58 in firestore.rules):
   - Allows updating `online` and `lastSeen` fields without rate limits
   - Separate condition for presence tracking to avoid rate limit conflicts

2. **Message Seen/Delivered Status** (Line 127-130 in firestore.rules):
   - Allows updating `seenBy`, `seenAt`, `deliveredTo`, and `deliveredAt` fields
   - Only allows updates if the current user is in the array (security check)

3. **Message Editing** (Line 133-139 in firestore.rules):
   - Allows editing own messages within 15 minutes
   - Allows deleting own messages within 1 hour

**No changes needed to Firestore rules!**

## Technical Details

### Message Seen Status Flow
1. **Delivered:** Message is marked as delivered when recipient opens the chat
2. **Seen:** Message is marked as seen only when:
   - Recipient has the chat open
   - Window is visible (not minimized/background tab)
   - Window has focus (user is actively viewing)

### Online Status Flow
1. **Online:** User is marked online when:
   - They first load the app
   - They return to the tab (visibility change)
   - They focus the window
   - Periodic update runs (every 30s) while window is visible and focused

2. **Offline:** User is marked offline when:
   - They close the tab/browser
   - They switch to another tab (visibility change)
   - They minimize the window
   - They blur the window (after 2-second delay)

## Files Modified
- `src/components/DirectMessages.jsx` - Fixed message seen logic and query
- `src/hooks/useUserPresence.js` - Fixed online/offline status tracking
- `firestore.rules` - No changes needed (already properly configured)

## Testing Recommendations
1. Open chat in two different browsers/devices
2. Send messages from one device
3. Switch tabs on the receiving device - messages should stay "delivered" (not "seen")
4. Return to the tab - messages should now show as "seen"
5. Check online status updates when switching tabs
6. Verify user goes offline when closing tab or switching away

## Date
April 2, 2026
