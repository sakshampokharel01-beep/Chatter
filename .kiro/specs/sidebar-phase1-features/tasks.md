# Implementation Plan: Chatter Sidebar Phase 1 Features

## Overview

This implementation plan covers three essential sidebar features for the Chatter chat application:
1. Global Search - Search across messages, users, and DMs
2. Friends/Contacts - Friend list with online status and requests
3. Saved Messages - Bookmark messages for later reference

All features integrate with the existing React + Firebase architecture, Socket.io real-time system, and Instagram-style collapsible sidebar design.

## Tasks

- [ ] 1. Set up Firestore collections and security rules
  - Create savedMessages collection structure in Firestore
  - Add composite indexes for savedMessages (userId + savedAt DESC, userId + messageId)
  - Update Firestore security rules for savedMessages collection
  - Update security rules for friends and friendRequests collections if needed
  - _Requirements: Data Models, Security Considerations_

- [ ] 2. Create custom hooks for data management
  - [ ] 2.1 Create useGlobalSearch hook
    - Implement debounced search logic (300ms delay)
    - Add parallel queries for messages, users, and DMs
    - Handle search result categorization and limiting
    - Add error handling and loading states
    - _Requirements: Global Search functionality, Search Algorithm_
  
  - [ ] 2.2 Create useFriends hook
    - Implement Firestore snapshot listener for friends collection
    - Add real-time presence integration with Socket.io
    - Implement friend list sorting (online first, then alphabetical)
    - Add friend request fetching logic
    - _Requirements: Friends/Contacts functionality, Friend Status Algorithm_
  
  - [ ] 2.3 Create useSavedMessages hook
    - Implement Firestore query for user's saved messages
    - Add pagination support (30 messages per page)
    - Implement save/unsave toggle logic
    - Add duplicate detection before saving
    - _Requirements: Saved Messages functionality, Save Message Algorithm_

- [ ] 3. Implement GlobalSearch component
  - [ ] 3.1 Create GlobalSearch.jsx component structure
    - Build modal overlay with search input
    - Add keyboard navigation support (Escape to close, Enter to select)
    - Implement mobile-responsive full-screen modal
    - Add ARIA labels for accessibility
    - _Requirements: Global Search UI, Mobile Responsive Design_
  
  - [ ] 3.2 Implement search results display
    - Create categorized result sections (Messages, Users, DMs)
    - Add result highlighting for search terms
    - Implement click handlers to navigate to results
    - Add empty state and loading indicators
    - _Requirements: Global Search results display_
  
  - [ ]* 3.3 Write unit tests for GlobalSearch component
    - Test search input debouncing
    - Test result categorization
    - Test keyboard navigation
    - Test empty and error states
    - _Requirements: Testing Strategy_

- [ ] 4. Checkpoint - Verify search functionality
  - Ensure search queries execute correctly
  - Test navigation to search results
  - Verify mobile responsiveness
  - Ask the user if questions arise

- [ ] 5. Implement FriendsPanel component
  - [ ] 5.1 Create FriendsPanel.jsx component structure
    - Build friends list container with tabs (Friends, Requests)
    - Add online status indicators (green dot for online)
    - Implement friend count badges
    - Add mobile-responsive full-screen view
    - _Requirements: Friends/Contacts UI, Mobile Responsive Design_
  
  - [ ] 5.2 Implement friend list items
    - Create FriendItem component with avatar, name, status
    - Add "Start DM" button for each friend
    - Implement lastSeen time formatting
    - Add sorting by online status
    - _Requirements: Friends list display, Friend Status Algorithm_
  
  - [ ] 5.3 Implement friend request handling
    - Create FriendRequest component with accept/reject buttons
    - Add acceptFriendRequest function
    - Add rejectFriendRequest function
    - Implement optimistic UI updates
    - Integrate with existing DirectMessages friend request system
    - _Requirements: Friend request functionality_
  
  - [ ]* 5.4 Write unit tests for FriendsPanel component
    - Test friend list sorting
    - Test online status display
    - Test friend request accept/reject
    - Test DM navigation
    - _Requirements: Testing Strategy_

- [ ] 6. Implement SavedMessages component
  - [ ] 6.1 Create SavedMessages.jsx component structure
    - Build saved messages list container
    - Add navigation header with back button
    - Implement mobile-responsive full-screen view
    - Add empty state when no saved messages
    - _Requirements: Saved Messages UI, Mobile Responsive Design_
  
  - [ ] 6.2 Implement saved message items
    - Create SavedMessageItem component with message preview
    - Display sender info, timestamp, and conversation context
    - Add "Go to message" navigation button
    - Add "Remove bookmark" button
    - Implement pagination (load 30 at a time)
    - _Requirements: Saved Messages display_
  
  - [ ] 6.3 Add save/unsave functionality to message components
    - Add save button to ChatRoom message actions
    - Add save button to DirectMessages message actions
    - Implement toggleSaveMessage function
    - Add visual indicator for already-saved messages
    - Show toast notifications on save/unsave
    - _Requirements: Save Message Algorithm, Toggle functionality_
  
  - [ ]* 6.4 Write unit tests for SavedMessages component
    - Test message list rendering
    - Test pagination
    - Test navigation to original message
    - Test remove bookmark functionality
    - _Requirements: Testing Strategy_

- [ ] 7. Checkpoint - Verify friends and saved messages
  - Ensure friend list displays correctly with online status
  - Test friend request accept/reject flow
  - Verify saved messages save and display correctly
  - Test navigation from saved messages to original location
  - Ask the user if questions arise

- [ ] 8. Integrate new features into Sidebar
  - [ ] 8.1 Update Sidebar.jsx with new navigation items
    - Add Search icon button to sidebar
    - Add Friends icon button to sidebar
    - Add Saved Messages icon button to sidebar
    - Implement active state highlighting
    - Add tooltips for collapsed sidebar
    - _Requirements: Sidebar integration_
  
  - [ ] 8.2 Add state management for feature panels
    - Add state for GlobalSearch modal visibility
    - Add state for FriendsPanel visibility
    - Add state for SavedMessages view
    - Implement panel open/close handlers
    - _Requirements: State management_
  
  - [ ] 8.3 Update BottomNav for mobile
    - Add Search, Friends, Saved icons to BottomNav
    - Implement mobile navigation handlers
    - Ensure proper active state on mobile
    - _Requirements: Mobile Responsive Design_

- [ ] 9. Implement Socket.io real-time updates
  - [ ] 9.1 Add Socket.io event handlers for presence
    - Add 'presence-update' event listener in useFriends hook
    - Update friend online status on presence events
    - Implement presence broadcast on user online/offline
    - _Requirements: Real-time presence updates_
  
  - [ ] 9.2 Add Socket.io events for friend requests
    - Add 'friend-request-sent' event emission
    - Add 'friend-request-accepted' event emission
    - Add event listeners to show notifications
    - Integrate with existing notification system
    - _Requirements: Friend request notifications_

- [ ] 10. Add performance optimizations
  - [ ] 10.1 Implement code splitting for components
    - Lazy load GlobalSearch component
    - Lazy load SavedMessages component
    - Add loading fallbacks
    - _Requirements: Performance Considerations_
  
  - [ ] 10.2 Add memoization and optimization
    - Memoize search results with useMemo
    - Memoize friend list sorting with useMemo
    - Use useCallback for event handlers
    - Implement virtual scrolling for long friend lists (if needed)
    - _Requirements: Performance Considerations_
  
  - [ ] 10.3 Implement caching strategies
    - Cache search results for 30 seconds
    - Cache friend status updates
    - Implement optimistic UI updates for save/unsave
    - _Requirements: Performance Considerations_

- [ ] 11. Add accessibility features
  - [ ] 11.1 Implement keyboard navigation
    - Add Tab navigation through all interactive elements
    - Add Escape key to close modals
    - Add Enter key to select search results
    - Implement focus trapping in modals
    - _Requirements: Accessibility_
  
  - [ ] 11.2 Add ARIA labels and screen reader support
    - Add ARIA labels to all buttons and inputs
    - Add role attributes to modal overlays
    - Implement status announcements for search results
    - Add alt text to all images
    - _Requirements: Accessibility_

- [ ] 12. Final integration and testing
  - [ ] 12.1 Test complete user flows
    - Test search → navigate to message flow
    - Test friend request → accept → start DM flow
    - Test save message → view saved → navigate back flow
    - Test mobile responsiveness on all features
    - _Requirements: Integration Testing_
  
  - [ ]* 12.2 Write integration tests
    - Test GlobalSearch with real Firestore queries
    - Test FriendsPanel with Socket.io presence
    - Test SavedMessages full save/unsave flow
    - Test cross-component navigation
    - _Requirements: Integration Testing_
  
  - [ ] 12.3 Verify security rules
    - Test savedMessages read/write permissions
    - Test friends collection access control
    - Test friend requests permissions
    - Verify rate limiting on search queries
    - _Requirements: Security Considerations_

- [ ] 13. Final checkpoint - Complete feature verification
  - Ensure all three features work correctly
  - Verify mobile and desktop responsiveness
  - Test real-time updates and Socket.io integration
  - Verify Firestore security rules are deployed
  - Ensure all tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements from the design document
- Checkpoints ensure incremental validation throughout implementation
- All features integrate with existing React + Firebase architecture
- Implementation uses JavaScript/JSX (existing codebase language)
- Socket.io integration required for real-time presence updates
- Firestore indexes must be created before deploying to production
