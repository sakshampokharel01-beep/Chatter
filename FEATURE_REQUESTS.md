# Chatter - Feature Requests & Implementation Tracker

This document tracks all requested features for Chatter. Features will be implemented one by one and marked as complete.

---

## 📋 Feature Status Legend
- ⏳ **Pending** - Not yet started
- 🚧 **In Progress** - Currently being implemented
- ✅ **Done** - Implemented and deployed
- ❌ **Cancelled** - Not implementing

---

## 🎯 Feature List

### 1. ✅ Typing Indicators
**Status:** Done  
**Priority:** High  
**Description:** Show "User is typing..." indicator in real-time when someone is composing a message.

**Implementation Details:**
- ✅ Socket.IO events for real-time typing (typing-dm, typing-global)
- ✅ Typing indicator in Direct Messages
- ✅ Typing indicator in Global Chat
- ✅ Auto-hide after 3 seconds of inactivity
- ✅ Throttled typing events (2 second debounce)
- ✅ Animated dots UI with smooth animations
- ✅ Shows multiple users typing in global chat

**Completed:** April 2, 2026

---

### 2. ✅ Read Receipts & Delivery Status
**Status:** Done  
**Priority:** High  
**Description:** Show message delivery and read status with visual indicators.

**Implementation Details:**
- ✅ Three-state status indicators for DMs:
  * Single checkmark (✓) = Sent (gray)
  * Double checkmark (✓✓) = Delivered (gray)
  * Double checkmark (✓✓) = Seen (blue)
- ✅ Messages marked as delivered when recipient opens chat
- ✅ Messages marked as seen when recipient views them
- ✅ Firestore rules updated to allow deliveredTo/deliveredAt updates
- ✅ Color-coded status indicators with smooth transitions
- ⏳ Global chat read receipts (not implemented - not typical for public chats)

**Completed:** April 2, 2026

---

### 3. ✅ Message Reactions & Emojis
**Status:** Pending  
**Priority:** Medium  
**Description:** Allow users to react to messages with emojis (like, love, laugh, etc.)

**Implementation Notes:**
- Quick reactions: 👍 ❤️ 😂 😮 😢 🙏
- Show reaction count below message
- Click to add/remove reaction
- Show who reacted (on hover/click)

---

### 4. ✅ Message Editing & Deletion
**Status:** Done  
**Priority:** High  
**Description:** Allow users to edit or delete their own messages.

**Implementation Details:**
- ✅ Users can edit their own messages within 15 minutes
- ✅ Users can delete their own messages within 1 hour
- ✅ Edit button (pencil icon) appears on hover for own messages
- ✅ Delete button appears on hover for own messages
- ✅ Editing indicator bar shows "Editing message" with cancel button
- ✅ Press Escape to cancel editing
- ✅ Shows "(edited)" label on edited messages
- ✅ Delete confirmation dialog
- ✅ Implemented for both global chat and DMs
- ✅ Firestore rules enforce time limits (15 min edit, 1 hour delete)
- ✅ Admins can delete any message anytime

**Completed:** April 2, 2026

---

### 5. ⏳ Group Chats & Channels
**Status:** Pending  
**Priority:** High  
**Description:** Create group conversations with multiple users.

**Implementation Notes:**
- Create group with name and icon
- Add/remove members
- Group admin roles
- Group settings (mute, leave, etc.)
- Public channels vs private groups

---

### 6. ⏳ Push Notifications
**Status:** Pending  
**Priority:** Medium  
**Description:** Browser push notifications for new messages and calls.

**Implementation Notes:**
- Request notification permission
- Notify on new DM
- Notify on incoming call
- Notify on mentions (in groups)
- Mute/unmute notifications per chat

---

### 7. ✅ Online/Offline Status & Last Seen
**Status:** Done  
**Priority:** Medium  
**Description:** Show user online status and last seen timestamp.

**Implementation Details:**
- ✅ Green dot indicator for online users
- ✅ "Last seen X minutes ago" timestamp display
- ✅ Real-time presence tracking with 30-second updates
- ✅ Automatic offline status when user closes tab/browser
- ✅ Automatic offline status when tab becomes inactive
- ✅ Shows in user list (friends tab)
- ✅ Shows in chat header
- ✅ Human-readable time format (minutes, hours, days ago)
- ✅ Guest users not tracked (privacy consideration)
- ✅ Firestore rules updated for online/lastSeen updates
- ⏳ Privacy settings to hide last seen (not implemented)

**Completed:** April 2, 2026

---

### 8. ⏳ Message Search
**Status:** Pending  
**Priority:** Medium  
**Description:** Search through message history.

**Implementation Notes:**
- Search in current chat
- Search across all chats
- Filter by date, sender, media type
- Highlight search results
- Jump to message in conversation

---

### 9. ⏳ Dark Mode Toggle
**Status:** Pending (App is already dark by default)  
**Priority:** Low  
**Description:** Toggle between light and dark themes.

**Current State:**
- ✅ App uses dark theme by default
- ⏳ No light mode available
- ⏳ No theme toggle

**Implementation Notes:**
- Add theme toggle in settings
- Save preference to localStorage
- Smooth theme transition
- Consider system preference (prefers-color-scheme)

---

### 10. ⏳ Customizable Profiles
**Status:** Pending (Basic profiles exist)  
**Priority:** Medium  
**Description:** Allow users to customize their profiles.

**Current State:**
- ✅ Display name from Google/Email
- ✅ Profile photo from Google
- ⏳ Can't edit profile after signup

**Implementation Notes:**
- Edit display name
- Upload custom profile photo
- Add bio/status message
- Set custom status (Available, Busy, Away)
- Profile settings page

---

### 11. ⏳ Message Threads / Replies
**Status:** Pending  
**Priority:** Low  
**Description:** Reply to specific messages and create conversation threads.

**Implementation Notes:**
- Click "Reply" on any message
- Show quoted message in reply
- Thread view for grouped replies
- Navigate to original message
- Reply count indicator

---

### 12. ⏳ Link Previews
**Status:** Pending  
**Priority:** Low  
**Description:** Automatically generate previews for shared links.

**Implementation Notes:**
- Detect URLs in messages
- Fetch Open Graph metadata
- Show title, description, image
- Click to open link
- Support YouTube, Twitter, etc.

---

### 13. ⏳ Multiple Device Sync
**Status:** Pending  
**Priority:** Low  
**Description:** Sync messages and state across multiple devices.

**Current State:**
- ✅ Messages sync via Firestore
- ⏳ No device management
- ⏳ No active sessions view

**Implementation Notes:**
- Track active sessions
- Show logged-in devices
- Remote logout from other devices
- Sync read status across devices
- Sync typing indicators

---

## 📊 Implementation Priority

### Phase 1 (High Priority)
1. Typing Indicators
2. Read Receipts & Delivery Status
3. Message Editing & Deletion
4. Group Chats & Channels

### Phase 2 (Medium Priority)
5. Push Notifications
6. Online/Offline Status & Last Seen
7. Message Search
8. Customizable Profiles

### Phase 3 (Low Priority)
9. Dark Mode Toggle
10. Message Threads / Replies
11. Link Previews
12. Multiple Device Sync

---

## 📝 Notes

- Features will be implemented one by one
- Each feature will be tested before marking as done
- Breaking changes will be documented
- User feedback will influence priority

---

**Last Updated:** April 2, 2026
