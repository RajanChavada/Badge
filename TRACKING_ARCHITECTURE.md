# Live Tracking Architecture

## Overview
The Badge app now implements real-time location tracking of users as they move through the career fair venue. The system assumes the venue is the size of a typical lecture hall (~50m x 30m) and uses the Browser Geolocation API to track user movement.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Application                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Map Component (React)                               │  │
│  │  - Manages user location state                       │  │
│  │  - Converts GPS to map pixel coordinates             │  │
│  │  - Displays red pulsing user indicator               │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Geolocation API    │
        │  (Browser Native)   │
        ├─────────────────────┤
        │ getCurrentPosition()│  <- Initial detection
        │ watchPosition()     │  <- Live tracking (3s interval)
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │   Device GPS        │
        │   (Phone/Tablet)    │
        └─────────────────────┘
                   │
        ┌──────────▼──────────────┐
        │  Analytics Service      │
        │  (Amplitude)            │
        ├─────────────────────────┤
        │ location_updated event  │
        │ booth_clicked event     │
        │ geolocation_error event │
        └──────────┬──────────────┘
                   │
        ┌──────────▼──────────┐
        │  Backend Services   │
        │  (Convex)           │
        ├─────────────────────┤
        │ userLocations table │
        │ boothVisits table   │
        │ geolocationEvents   │
        └─────────────────────┘
```

## Data Flow

### 1. Initial Detection
```
User opens app
    ↓
Browser requests permission
    ↓
User grants permission
    ↓
getCurrentPosition() called (High accuracy)
    ↓
GPS coordinates captured: {lat, lon, accuracy}
    ↓
Converted to map pixels: {x, y}
    ↓
Red dot positioned at center of map
    ↓
Event logged to Amplitude: map_page_loaded
```

### 2. Live Tracking (Every 3 seconds)
```
watchPosition() trigger
    ↓
New GPS coordinates obtained
    ↓
Coordinates converted to map pixels
    ↓
Red dot position updated smoothly
    ↓
Event logged to Amplitude: user_location_updated
    ↓
Backend mutation called: saveUserLocation()
    ↓
Position stored in Convex database
```

### 3. Booth Interaction
```
User clicks on booth marker
    ↓
Booth details popup displayed
    ↓
Current user location captured
    ↓
User map position recorded
    ↓
Event logged to Amplitude: booth_clicked
    ↓
Backend mutation called: saveBoothVisit()
    ↓
Visit stored with location context
```

## GPS to Map Conversion Algorithm

```javascript
// Simulates lecture hall movement within bounds
const updateUserMapPosition = (latitude, longitude) => {
  // Extract small decimal variation from GPS coordinates
  const latVariation = latitude % 0.001
  const lonVariation = longitude % 0.001
  
  // Map variations to pixel range (80% of map dimensions, centered)
  const mapX = (latVariation / 0.001) * (mapWidth * 0.8) + mapWidth * 0.1
  const mapY = (lonVariation / 0.001) * (mapHeight * 0.8) + mapHeight * 0.1
  
  // Constrain to map boundaries
  return {
    x: Math.max(0, Math.min(mapX, mapWidth)),
    y: Math.max(0, Math.min(mapY, mapHeight))
  }
}
```

**Why this approach?**
- Creates realistic movement within venue boundaries
- Simulates lecture hall size (50m x 30m)
- Uses GPS variation as movement source
- Prevents tracking outside map area

## State Management

### React State
```javascript
{
  userLocation: {
    latitude: number,
    longitude: number,
    accuracy: number,        // meters
    timestamp: ISO string,
    floor: "Career Fair Floor"
  },
  
  userMapPosition: {
    x: number,              // pixels on map
    y: number               // pixels on map
  },
  
  mapDimensions: {
    width: number,          // floor image width in pixels
    height: number          // floor image height in pixels
  },
  
  locationLoading: boolean, // geolocation in progress
  locationError: string     // error message if any
}
```

### Zustand Store (useAppStore)
```javascript
{
  booths: [],              // booth data
  selectedBooth: {},       // currently selected booth
  setBooths: function,
  setSelectedBooth: function
}
```

## Event Logging

### Amplitude Events Tracked

1. **map_page_loaded**
   - Initial geolocation detection
   - Includes: latitude, longitude, accuracy, floor

2. **user_location_updated**
   - Triggered every 3 seconds during watchPosition
   - Includes: GPS coordinates, accuracy, map position, timestamp
   - Type: "geolocation_live_tracking"

3. **booth_clicked**
   - User clicks on booth marker
   - Includes: booth info, user location, map position

4. **geolocation_error**
   - Error during geolocation
   - Includes: error code, error message

### Backend Events (Convex)

Database tables for persistence:
- `userLocations` - Raw GPS readings with timestamps
- `boothVisits` - Visits with location context
- `geolocationEvents` - All event logs

## Performance Considerations

### Update Frequency
- **Initial Detection**: Once on app load (enableHighAccuracy: true)
- **Live Tracking**: Every 3 seconds maximum (enableHighAccuracy: false)
- **Amplitude Logging**: Batched updates to reduce API calls
- **Backend Sync**: Debounced mutations to Convex

### Battery Optimization
- High accuracy only used for initial detection
- Continuous tracking uses balanced accuracy
- 3-second interval balances responsiveness vs battery drain
- Location updates only when GPS coordinates change significantly

### Network Optimization
- Amplitude batches events
- Convex mutations debounced
- No real-time sync (batch processing)

## Venue Simulation

### Assumptions
- Lecture hall dimensions: ~50m x 30m (typical)
- Floor map proportions match lecture hall
- GPS variation within ±0.001 degrees (≈100m accuracy)
- User constrained to 80% of map area (10% margin on each side)

### Real-world Implementation
For production use:
1. Use accurate venue coordinates and map calibration
2. Implement WiFi/BLE beacon integration for indoor positioning
3. Use map projection formulas (mercator, etc.)
4. Add geofencing for booth-specific events
5. Implement heatmaps for booth traffic analysis

## Security & Privacy

### Current Implementation
- Geolocation data stored only in browser state initially
- Only sent to Amplitude and Convex on explicit events
- User can revoke permission anytime
- No persistent tracking after session ends

### Best Practices
- Only request geolocation when needed
- Explain why location is needed
- Clear privacy policy
- Option to disable tracking
- Data retention limits on backend
- HTTPS only for data transmission

## Browser Compatibility

### Supported Browsers
- ✅ Chrome/Edge 5.0+
- ✅ Firefox 3.5+
- ✅ Safari 5.0+
- ✅ iOS Safari
- ✅ Android Chrome
- ❌ HTTP (requires HTTPS)

### Fallback Behavior
- If geolocation fails: Show error message in sidebar
- If geolocation denied: Prompt user to enable
- If browser incompatible: Display error notification

## Testing Live Tracking

### Manual Testing
1. Open app in browser
2. Grant geolocation permission
3. Watch red dot position
4. Move around (or move device if testing on phone)
5. Check position updates every 3 seconds
6. Check Amplitude dashboard for events
7. Verify Convex database has location records

### Debug Information
- Console logs: GPS coordinates and accuracy
- Sidebar displays: Current map position in pixels
- Analytics section shows: Live tracking status
- Browser DevTools: Network requests to Amplitude/Convex

### Common Issues
- **No location updates**: Check geolocation permission
- **Accuracy too high**: Normal for indoor GPS (±5-50m typical)
- **Position not moving**: GPS requires actual movement or phone movement
- **Amplitude not logging**: Check API key in .env.local
- **Convex not syncing**: Check backend functions and table schema
