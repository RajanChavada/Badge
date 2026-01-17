# User Interface Layout

## Floor Map Page Structure

```
┌────────────────────────────────────────────────────────────────────┐
│  BADGE CAREER FAIR                                      [Nav Icons] │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Career Fair Map                                                  │
│  Explore booths and companies                                     │
│                                                                    │
├────────────────────────────────────────────┬─────────────────────┤
│                                            │                     │
│                                            │  🔍 Search         │
│                                            │  ┌─────────────┐   │
│   FLOOR MAP DISPLAY                        │  │ Search... │   │
│   ┌──────────────────────────────────────┐ │  └─────────────┘   │
│   │                                      │ │                     │
│   │  [Floor Image Background]            │ │  🎯 Filter by     │
│   │  ┌────────────────────────────────┐  │ │  Interest        │
│   │  │                                │  │ │  ┌────────────┐   │
│   │  │        🔴 (User Location)      │  │ │  │ All ✓      │   │
│   │  │                           ①    │  │ │  │ AI/ML      │   │
│   │  │    ③            ②    ④        │  │ │  │ Cloud      │   │
│   │  │  ⑤                            │  │ │  │ Web Dev    │   │
│   │  │                   ⑥          │  │ │  │ VR/AR      │   │
│   │  │                                │  │ │  │ Mobile Dev │   │
│   │  │                                │  │ │  └────────────┘   │
│   │  └────────────────────────────────┘  │ │                     │
│   │                                      │ │  Booths (1)        │
│   │  [Booth Details Popup]              │ │  ┌────────────┐   │
│   │  ┌─────────────────────────────┐    │ │  │ ① Google   │   │
│   │  │ × Google Sponsor Booth  [X] │    │ │  │   Sponsor  │   │
│   │  │                             │    │ │  │   Booth    │   │
│   │  │ Google                      │    │ │  │ 📍         │   │
│   │  │                             │    │ │  │ AI/ML      │   │
│   │  │ <to be filled later>        │    │ │  │ Cloud      │   │
│   │  │                             │    │ │  │ Web Dev    │   │
│   │  │ Suggested Talking Points:   │    │ │  │ + 0 more   │   │
│   │  │ <to be filled later>        │    │ │  └────────────┘   │
│   │  │                             │    │ │                     │
│   │  │ [Tags...]                   │    │ │  📍 Geolocation   │
│   │  │                             │    │ │     Status        │
│   │  │ Key People:                 │    │ │  ┌────────────┐   │
│   │  │ ┌─────────────────────────┐ │    │ │  │ ✓ Location │   │
│   │  │ │ To be announced         │ │    │ │  │   detected │   │
│   │  │ │ TBA                     │ │    │ │  │            │   │
│   │  │ │ Connect with us...      │ │    │ │  │ Lat: 40.71 │   │
│   │  │ │ [Skills...]             │ │    │ │  │ Lon:-74.00 │   │
│   │  │ └─────────────────────────┘ │    │ │  │ Accuracy:  │   │
│   │  │                             │    │ │  │ 15m        │   │
│   │  │ [Get Personalized Summary]  │    │ │  │            │   │
│   │  │                             │    │ │  │ Assuming   │   │
│   │  └─────────────────────────────┘    │ │  │ this floor │   │
│   │                                      │ │  │ location   │   │
│   └──────────────────────────────────────┘ │  └────────────┘   │
│                                            │                     │
└────────────────────────────────────────────┴─────────────────────┘
```

## Component Hierarchy

```
<Map>
├── .map-page
│   ├── .map-header
│   │   ├── <h1>Career Fair Map</h1>
│   │   └── <p>Explore booths and companies</p>
│   │
│   └── .map-container
│       ├── .map-view (1fr width)
│       │   ├── .map-canvas
│       │   │   └── .floor-image-container
│       │   │       ├── <img src="floor-map.jpg" />
│       │   │       ├── .user-location-indicator
│       │   │       │   └── .location-pulse
│       │   │       │
│       │   │       └── {filteredBooths.map} .booth-marker-dot
│       │   │           ├── .marker-number
│       │   │           └── .marker-tooltip
│       │   │
│       │   └── .booth-details-popup (when selectedBooth)
│       │       ├── <button>.close-btn</button>
│       │       ├── <h2>Booth Name</h2>
│       │       ├── <p>.company-name</p>
│       │       ├── <p>.description</p>
│       │       ├── .talking-points-section
│       │       ├── .tags
│       │       ├── .key-people
│       │       │   └── {keyPeople.map} .person-card
│       │       └── <button>.btn-personalized-summary</button>
│       │
│       └── .map-sidebar (350px width)
│           ├── .search-section
│           │   └── .search-box
│           │       └── <input /> placeholder="Search booths..."
│           │
│           ├── .filters-section
│           │   └── .tag-filter
│           │       └── {tags.map} <button>.filter-tag</button>
│           │
│           ├── .booths-list
│           │   ├── <h3>Booths (X)</h3>
│           │   └── .booth-items
│           │       └── {filteredBooths.map} .booth-item
│           │           ├── .booth-header
│           │           ├── <p>.booth-company</p>
│           │           ├── <p>.booth-desc</p>
│           │           └── .booth-tags
│           │
│           └── .analytics-section
│               ├── <h3>📍 Geolocation Status</h3>
│               └── [Loading|Success|Error State]
└── All styles in Map.css
```

## Responsive Design Breakpoints

### Desktop (1024px+)
```
Grid: 1fr (map) | 350px (sidebar)
Both visible side-by-side
Booth popup on map
Full details in sidebar list
```

### Tablet (768px - 1024px)
```
Grid: 1fr (stacked)
Sidebar flows horizontally with flex-wrap
Search and filters visible
Booths list may scroll
Details popup on map
```

### Mobile (< 768px)
```
Stack: map above sidebar
Sidebar takes full width
Full-screen popup when booth selected
Reduced padding and margins
Simplified layout
```

## Styling Color Scheme

| Element | Color | Usage |
|---------|-------|-------|
| Primary Gradient | #667eea → #764ba2 | Booth markers, buttons |
| Background | #e8f4f8 | Map canvas bg |
| Text Primary | #333 | Headings, main text |
| Text Secondary | #666 | Descriptions |
| Accent | #667eea | Links, highlights |
| Success | #27ae60 | Location detected |
| Error | #e74c3c | Error messages |
| Warning | #f39c12 | Alerts |
| User Location | #ff6b6b | GPS dot |
| Highlight | rgba(102,126,234,0.1) | Selected item |
| Border | #e0e0e0 | Input borders |

## Geolocation Status States

### 1. Loading State
```
📍 Geolocation Status

🔄 Detecting location...
```

### 2. Success State
```
📍 Geolocation Status

✓ Location detected

Lat: 40.7128°
Lon: -74.0060°
Accuracy: 15m

Assuming this floor location for booth proximity tracking
```

### 3. Error State
```
📍 Geolocation Status

❌ Geolocation is not supported by your browser
```

## Booth Marker Interactive States

### Default
- Size: 40×40px
- Color: Gradient (purple-blue)
- Opacity: Full
- Shadow: Subtle drop shadow

### Hover
- Size: 48×48px (110% scale)
- Shadow: Larger drop shadow
- Tooltip: Fade in booth name
- Cursor: Pointer

### Selected
- Size: 48×48px
- Border: 4px outer glow
- Color: Reversed gradient
- Shadow: Enhanced shadow

### Click
- Popup: Appears at bottom-left
- Map: Dimmed slightly (optional)
- Details: Full booth information shown

## Animation Keyframes

### Pulse Animation (Location Indicator)
```
0% - 100%:   Box shadow: 4px radius
50%:         Box shadow: 8px radius
```

### Pulse Ring (Expanding)
```
0%:   Scale 1.0, Opacity 100%
100%: Scale 2.0, Opacity 0%
```

### Spin (Loading)
```
0%:   Rotate 0deg
100%: Rotate 360deg
```

## Accessibility Features

- Semantic HTML structure
- ARIA labels on buttons and interactive elements
- High contrast text on backgrounds
- Focus states for keyboard navigation
- Tooltips on hover for better UX
- Error messages clearly displayed
- Loading states indicated visually + text

## Performance Optimizations

| Feature | Optimization |
|---------|---------------|
| Floor Image | JPG format, 85KB |
| Markers | CSS transforms for smooth animation |
| List Scrolling | max-height with overflow-y auto |
| Location Updates | 10s interval (battery efficient) |
| CSS | No unused styles, proper cascading |
| Re-renders | Zustand state management |

## Mobile-First Approach

```css
/* Base: Mobile styles */
.map-container {
  grid-template-columns: 1fr;
}

/* Tablet and up */
@media (min-width: 768px) {
  .map-container {
    grid-template-columns: 1fr 350px;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  /* Enhanced styling for larger screens */
}
```

## Touch Interactions (Mobile)

- Tap booth marker: Open popup
- Tap × button: Close popup
- Tap filter tags: Apply filter
- Tap booth item: Show on map
- Swipe sidebar: Scroll list
- Long press: Show tooltip info

## Keyboard Navigation

- Tab: Move between interactive elements
- Enter/Space: Activate buttons
- Escape: Close popups
- Arrow keys: Scroll lists

