# Map Component - Live Tracking Update

## Summary of Changes

### Reverted Map Structure
The map interface has been reverted from a simplified full-screen blue-dot view back to the full-featured layout with:
- **Sidebar** - Search, filters, booth list, and analytics information
- **Map header** - Title and subtitle
- **Full layout** - 2-column grid layout with map view and sidebar

### Live Tracking Implementation
The user location is now tracked live as they move through the venue:

#### Features:
1. **Initial Position**: User starts at the center of the floor map
2. **Live Updates**: Position updates every 3 seconds based on GPS movement
3. **Lecture Hall Simulation**: Movement is constrained within a lecture hall-sized space (~50m x 30m)
4. **Visual Indicator**: Red pulsing dot shows user's current position on the map
5. **Accuracy Display**: Geolocation accuracy (in meters) is shown in the analytics panel

#### Technical Implementation:

**Geolocation API Usage:**
- `navigator.geolocation.getCurrentPosition()` - Initial location detection with high accuracy
- `navigator.geolocation.watchPosition()` - Continuous tracking with 3-second update interval
- High accuracy enabled on initial detection, balanced mode for continuous tracking

**GPS to Map Conversion:**
- GPS coordinates are converted to pixel coordinates on the floor map
- Conversion accounts for map dimensions and assumes lecture hall-sized space
- User position is constrained within map boundaries

**Amplitude Logging:**
- `map_page_loaded` - Initial geolocation detection
- `user_location_updated` - Continuous position updates with GPS and map coordinates
- `geolocation_error` - Error tracking if geolocation fails
- `booth_clicked` - Booth interactions with user location context

**Backend Tracking:**
- User positions are logged to Convex backend via mutations
- Booth visits are tracked with GPS coordinates
- Event timestamps record all movements and interactions

### Code Changes

**File: `/badge-app/src/pages/Map.jsx`**
- Added `userLocation` state for GPS data (latitude, longitude, accuracy)
- Added `userMapPosition` state for pixel coordinates on map
- Added `mapDimensions` state to track floor image size
- Implemented `updateUserMapPosition()` function for GPS-to-pixel conversion
- Modified `useEffect` for geolocation to use watchPosition instead of one-time detection
- Updated user location indicator to use `userMapPosition` instead of center
- Added real-time position updates every 3 seconds
- Updated analytics panel to show live tracking status and map position

**File: `/badge-app/src/pages/Map.css`**
- Restored full sidebar styling
- Updated user location indicator styling for dynamic positioning
- Red pulsing dot animation for user location
- All booth marker and popup styles restored

### User Experience
- Users see a **red pulsing dot** representing their current position
- The dot moves as they walk around the venue in real-time
- Accuracy information helps users understand GPS precision
- Booth markers (purple numbered circles) remain visible and interactive
- Sidebar provides search, filtering, and booth information

### Demo / Testing
To test live tracking:
1. Open the app at `http://localhost:5173`
2. Allow geolocation access when prompted
3. Watch the red dot move as you move around (or refresh multiple times to see position changes)
4. Check the "Live Location Tracking" panel in the sidebar for coordinates
5. Click booths to see visit events logged with location data
