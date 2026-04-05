# Collapsible Sidebar Specification - Instagram Style

## Overview
Transform the current sidebar into an Instagram-style collapsible navigation that shows only icons by default and expands to show full text labels on hover.

## Current State vs Desired State

### Current State
- Sidebar is always fully expanded (260px wide)
- Shows icons + text labels at all times
- Takes up significant screen space

### Desired State (Instagram Style)
- **Default (Collapsed)**: 72px wide, shows only icons
- **On Hover**: Expands to 260px, shows icons + text labels
- **Smooth Animation**: 0.3s ease transition
- **More Screen Space**: Content area gets extra ~188px when collapsed

## Visual Layout

### Collapsed State (Default - 72px)
```
┌────┐
│ 🏠 │  ← Home icon only
│    │
│ 💬 │  ← Messages icon only
│    │
│ 👥 │  ← Users icon only (admin)
│    │
│ 👤 │  ← Profile icon only
│    │
│ 🔔 │  ← Notifications icon only
│    │
│ ⋮  │  ← More icon only
│    │
│ 👨 │  ← User avatar only
│    │
│ 🚪 │  ← Logout icon only
└────┘
```

### Expanded State (On Hover - 260px)
```
┌─────────────────┐
│ 🏠  Home        │  ← Icon + text
│                 │
│ 💬  Messages    │  ← Icon + text
│   ↳ Global      │  ← Sub-items visible
│   ↳ Private     │
│                 │
│ 👥  Users       │  ← Icon + text (admin)
│                 │
│ 👤  Profile     │  ← Icon + text
│                 │
│ 🔔  Notifications│ ← Icon + text
│                 │
│ ⋮   More        │  ← Icon + text
│   ↳ Theme       │  ← Sub-items visible
│   ↳ Sessions    │
│                 │
│ 👨  Username    │  ← Avatar + name + status
│ ●   Online      │
│                 │
│ 🚪  Log Out     │  ← Icon + text
└─────────────────┘
```

## Technical Implementation

### CSS Changes

#### Sidebar Container
```css
.sidebar {
  width: 72px; /* Collapsed by default */
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar:hover {
  width: 260px; /* Expanded on hover */
}
```

#### Text Labels
```css
.sidebar-item span,
.sidebar-subitem span,
.sidebar-user-name,
.sidebar-user-status {
  opacity: 0;
  width: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: opacity 0.2s ease, width 0.2s ease;
}

.sidebar:hover .sidebar-item span,
.sidebar:hover .sidebar-subitem span,
.sidebar:hover .sidebar-user-name,
.sidebar:hover .sidebar-user-status {
  opacity: 1;
  width: auto;
}
```

#### Icons (Always Visible)
```css
.sidebar-item svg,
.sidebar-subitem svg {
  flex-shrink: 0;
  min-width: 24px;
  min-height: 24px;
}
```

#### Brand Logo
```css
.sidebar-brand-text {
  opacity: 0;
  width: 0;
  transition: opacity 0.2s ease, width 0.2s ease;
}

.sidebar:hover .sidebar-brand-text {
  opacity: 1;
  width: auto;
}
```

#### Expandable Sections
```css
/* Hide expand icon when collapsed */
.expand-icon {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.sidebar:hover .expand-icon {
  opacity: 1;
}

/* Hide sub-items when collapsed */
.sidebar-subitems {
  display: none;
}

.sidebar:hover .sidebar-subitems {
  display: flex;
}
```

#### User Info Section
```css
.sidebar-user {
  padding: 12px 16px;
}

.sidebar-user-info {
  opacity: 0;
  width: 0;
  transition: opacity 0.2s ease, width 0.2s ease;
}

.sidebar:hover .sidebar-user-info {
  opacity: 1;
  width: auto;
}
```

### Component Changes

#### Sidebar.jsx
```javascript
// Add hover state management (optional for additional control)
const [isHovered, setIsHovered] = useState(false);

return (
  <aside 
    className="sidebar"
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
  >
    {/* Content */}
  </aside>
);
```

### Content Area Adjustment
```css
.chat-room {
  flex: 1;
  margin-left: 0; /* Remove fixed margin */
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Behavior Details

### Hover Interaction
1. **Mouse enters sidebar**: Expands from 72px to 260px over 0.3s
2. **Text fades in**: Labels appear with 0.2s delay
3. **Sub-items appear**: Expandable sections become visible
4. **Mouse leaves sidebar**: Collapses back to 72px over 0.3s
5. **Text fades out**: Labels disappear smoothly

### Expandable Sections Behavior
- **When Collapsed**: 
  - Only parent icon visible
  - Sub-items completely hidden
  - No expand arrow visible
  
- **When Expanded (Hover)**:
  - Parent icon + text visible
  - Expand arrow appears
  - Click to show/hide sub-items
  - Sub-items animate in/out

### User Info Section
- **When Collapsed**: Only avatar visible (40px circle)
- **When Expanded**: Avatar + name + online status visible

### Active State Indicators
- Active items highlighted even when collapsed
- Blue accent color on active icon
- Background highlight on hover

## Responsive Behavior

### Desktop (>768px)
- Collapsible sidebar enabled
- Hover to expand functionality active
- Default width: 72px
- Expanded width: 260px

### Tablet (769-1024px)
- Same as desktop
- Slightly smaller expanded width: 220px

### Mobile (≤768px)
- Sidebar completely hidden
- Bottom navigation shown instead
- No collapsible behavior needed

## Animation Timing

```css
/* Smooth cubic-bezier for natural feel */
--sidebar-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--text-transition: 0.2s ease;
--icon-transition: 0.15s ease;
```

## Accessibility Considerations

1. **Tooltips**: Add tooltips to icons when collapsed
2. **ARIA Labels**: Ensure all icons have proper aria-labels
3. **Keyboard Navigation**: Tab through items works in both states
4. **Focus Indicators**: Visible focus rings on all interactive elements
5. **Screen Readers**: Announce state changes

## Benefits

1. **More Screen Space**: ~188px extra width for content when collapsed
2. **Cleaner Look**: Minimalist icon-only view by default
3. **Quick Access**: Hover to see full labels when needed
4. **Modern UX**: Matches Instagram's familiar pattern
5. **Smooth Experience**: Fluid animations feel natural
6. **Better Focus**: Less visual clutter, more focus on content

## Implementation Checklist

- [ ] Update Sidebar.css with collapsed/expanded states
- [ ] Add hover transitions for width
- [ ] Hide/show text labels on hover
- [ ] Hide/show sub-items on hover
- [ ] Update brand logo behavior
- [ ] Update user info section
- [ ] Add tooltips for collapsed state
- [ ] Test all navigation items
- [ ] Test expandable sections
- [ ] Test on different screen sizes
- [ ] Verify smooth animations
- [ ] Check accessibility
- [ ] Test keyboard navigation
- [ ] Verify active states work in both modes

## Edge Cases to Handle

1. **Rapid Hover On/Off**: Debounce or use CSS transitions only
2. **Long Usernames**: Truncate with ellipsis when expanded
3. **Many Sub-items**: Ensure scrolling works when expanded
4. **Touch Devices**: Consider tap-to-expand on tablets
5. **Slow Connections**: Ensure icons load first (inline SVG)

## Future Enhancements

1. **Pin/Unpin Toggle**: Button to lock sidebar in expanded state
2. **Remember Preference**: Save user's preferred state in localStorage
3. **Keyboard Shortcut**: Ctrl+B to toggle sidebar
4. **Resize Handle**: Drag to custom width
5. **Compact Mode**: Even smaller 56px collapsed state

---

**Status**: Ready for Implementation
**Priority**: High
**Estimated Time**: 2-3 hours
**Complexity**: Medium
