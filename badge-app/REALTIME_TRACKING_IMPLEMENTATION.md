# Real-Time Map Implementation Guide

## Overview
The Map component has been redesigned to use **JavaScript Geolocation API** for real-time user position tracking on an interactive career fair floor map.

## Key Features Implemented

### 1. **Real-Time Geolocation Tracking**
- Uses browser's native `navigator.geolocation.watchPosition()` API
- **No additional API keys needed** - this is a browser-native W3C standard API
- Continuous position updates every 1 second
- High accuracy enabled for better indoor positioning
- Initial location establishes the map center point

### 2. **Sponsor Booths in Four Corners**
The 4 sponsor booths are positioned evenly in the four corners of the map:

| Booth | Position | Color | Tags |
|-------|----------|-------|------|
| Google | Top-Left (10%, 10%) | Blue (#4285F4) | AI/ML, Cloud, Web Dev |
| Shopify | Top-Right (90%, 10%) | Green (#96BE28) | E-Commerce, Web Dev, Payments |
| Amplitude | Bottom-Left (10%, 90%) | Purple (#7B68EE) | Analytics, Data Science, Product |
| Foresters Financial | Bottom-Right (90%, 90%) | Orange (#FF6B35) | Finance, Insurance, Actuarial |

### 3. **GPS to Pixel Conversion**
- **Room Simulation**: 50m × 50m venue (as specified)
- Calculates GPS latitude/longitude deltas from initial position
- Converts meters to pixel percentages on map
- Constrains user position to 10-90% bounds to stay within room area
- Accounts for latitude-dependent meter-per-degree variations

#### Conversion Algorithm:
```javascript
// Constants
const ROOM_WIDTH_METERS = 50
const ROOM_HEIGHT_METERS = 50

// Calculate offset from initial position
const latDiff = latitude - initialLocationRef.current.latitude
const lonDiff = longitude - initialLocationRef.current.longitude

// Convert to meters (latitude approx constant, longitude varies by latitude)
const metersPerDegreeLat = 111000
const metersPerDegreeLon = 111000 * Math.cos((latitude * Math.PI) / 180)

const metersLat = latDiff * metersPerDegreeLat
const metersLon = lonDiff * metersPerDegreeLon

// Convert to pixel position (as percentage of map)
const pixelX = 50 + (metersLon / (ROOM_WIDTH_METERS / 2)) * 10
const pixelY = 50 - (metersLat / (ROOM_HEIGHT_METERS / 2)) * 10

// Constrain to bounds
setUserPixelPosition({
  x: Math.max(10, Math.min(90, pixelX)),
  y: Math.max(10, Math.min(90, pixelY)),
})
```

### 4. **User Position Indicator**
- **Red pulsing dot** at user's real-time location
- Pulse animation shows continuous tracking
- Inner dot with white border for visibility
- Updates smoothly as user moves
- Shows accuracy information on hover

### 5. **Distance Calculations**
- Shows approximate distance to each booth
- Calculated as pixel-based distance from user position
- 1% of map ≈ 1 meter (based on 50m room)
- Displayed in booth list and details popup

### 6. **Interactive Booth Markers**
- Color-coded pins matching booth branding
- Hover shows booth name and distance
- Click to view detailed booth information
- Selected booth highlighted on map and in list
- Distance updates in real-time as user moves

### 7. **Location Status Panel**
Shows real-time tracking information:
- GPS coordinates (latitude/longitude with 4 decimal precision)
- Accuracy estimate (±X meters)
- User position as map percentage (X% × Y%)
- Connection status with loading/error states

## API Keys Required

✅ **No additional API keys needed** for the Geolocation API itself.

Existing keys in `.env.local` (still supported):
- `VITE_CLERK_PUBLISHABLE_KEY` - Authentication
- `VITE_AMPLITUDE_API_KEY` - Analytics logging
- `VITE_CONVEX_URL` - Backend service

## Component Structure

### Main Component: `Map.jsx`
- **State Management**: React hooks for location, booth filtering, UI state
- **Refs**: `watchIdRef` for geolocation cleanup, `initialLocationRef` for center point
- **Key Functions**:
  - `handleBoothClick()` - Booth selection and analytics logging
  - `getDistanceToUser()` - Real-time distance calculation
  - Geolocation setup in `useEffect` hook

### Booth Data: `SPONSOR_BOOTHS`
Array of 4 booth objects with:
- `id`, `name`, `companyName`, `description`
- `x`, `y` - Position as percentage (corners)
- `color` - Brand color for marker
- `tags` - Interest categories
- `talkingPoints`, `keyPeople` - Booth details

### Styling: `Map.css`
Enhanced styles for:
- `.user-location-dot` - Pulsing user indicator with animations
- `.booth-marker` - Booth pin styling with hover effects
- `.booth-label` - Distance information labels
- `.distance-info` - Distance display in popup
- Responsive layout for different screen sizes

## Geolocation Permissions

Users will see a browser permission prompt requesting:
- "Allow this site to access your precise location?"

The application requires:
- `enableHighAccuracy: true` - For better indoor positioning
- `timeout: 5000` - 5 second timeout for each position request
- `maximumAge: 1000` - Cache results for 1 second to reduce battery drain

## Amplitude Event Logging

Events logged for analytics:
- `map_page_loaded` - Initial geolocation detection
- `user_location_updated` - Continuous position updates
- `geolocation_error` - Any location permission/sensor errors
- `booth_clicked` - When user clicks a booth (includes position data)

## Testing the Implementation

### Local Development
```bash
cd badge-app
npm run dev
# Server runs on http://localhost:5174
```

### Testing Real-Time Tracking
1. Open the map in a browser
2. Accept geolocation permission
3. **Initial position**: Map center (50%, 50%)
4. **Move around**: Position dot should follow your movement
5. **Booth distances**: Update in real-time as you move
6. **Click booths**: View details including current distance

### Simulating Movement (For Testing Without Moving)
- Use browser DevTools → Sensors → Geolocation
- Set custom coordinates to test position calculations
- Or use browser geolocation spoofing extensions

## Known Limitations

1. **Indoor Accuracy**: GPS accuracy can be ±5-20m indoors depending on building
2. **Position Caching**: Browser may cache location for up to 1 second
3. **Room Assumption**: Current setup assumes a 50m × 50m space
4. **Mobile Only**: Geolocation works best on mobile devices with GPS
5. **Cold Start**: Initial geolocation may take 1-5 seconds

## Future Enhancements

1. **Distance Alerts**: Notify when user is close to a booth
2. **Booth Visit History**: Track time spent at each booth
3. **Route Optimization**: Suggest optimal path to visit booths
4. **Offline Map**: Work without constant GPS connectivity
5. **Beacon Integration**: Use BLE beacons for more accurate indoor positioning
6. **Multi-Floor Support**: Handle multiple floors with elevation data

## Architecture Notes

### Three-Layer System:
1. **Geolocation Layer** - Raw GPS data via browser API
2. **Conversion Layer** - GPS to map position transformation
3. **Display Layer** - React UI component rendering positions

### Data Flow:
```
Browser Geolocation API
    ↓
watchPosition() callback
    ↓
Calculate GPS delta from initial
    ↓
Convert to pixel percentage
    ↓
Update React state
    ↓
Re-render map with new position
    ↓
Amplitude logging (async)
```

## References

- [W3C Geolocation API Spec](https://www.w3.org/TR/geolocation-API/)
- [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Browser Support](https://caniuse.com/geolocation)
- [GPS Accuracy Improvements](https://developers.google.com/location-context/geolocation)
