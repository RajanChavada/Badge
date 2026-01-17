# Geolocation Tracking Implementation

## Overview

The map component implements real-time geolocation tracking to detect the user's current location and display it on the floor map.

## Features Implemented

### 1. Initial Location Detection
- Triggered on component mount
- Requests single location snapshot from user's device
- Uses `navigator.geolocation.getCurrentPosition()`
- Configuration:
  - `enableHighAccuracy: true` - Uses GPS for best accuracy
  - `timeout: 5000` - Waits up to 5 seconds
  - `maximumAge: 0` - Ignores cached positions

### 2. Continuous Location Tracking
- Uses `navigator.geolocation.watchPosition()`
- Updates location every 10 seconds (maximumAge: 10000)
- Less power-intensive than high accuracy mode
- Automatically stops when component unmounts

### 3. Location Data Captured
```javascript
{
  latitude: number,      // Decimal degrees
  longitude: number,     // Decimal degrees
  accuracy: number,      // Radius in meters
  timestamp: Date        // When location was detected
}
```

### 4. User Interface Elements

#### Location Status Display (Sidebar)
Shows one of three states:

**Loading State** 🔄
```
📍 Geolocation Status
  🔄 Detecting location...
```

**Success State** ✅
```
📍 Geolocation Status
  ✓ Location detected
  Lat: 40.7128°
  Lon: -74.0060°
  Accuracy: 15m
  Assuming this floor location for booth proximity tracking
```

**Error State** ❌
```
📍 Geolocation Status
  ❌ Geolocation is not supported by your browser
```

#### User Location Indicator (Map)
- Red pulsing dot in top-right corner of map
- Shows user's current position on floor plan
- Pulse animation indicates active tracking
- Tooltip shows accuracy radius

### 5. Error Handling

Gracefully handles various scenarios:
- Browser doesn't support Geolocation API
- User denies permission
- GPS signal unavailable
- Timeout (no response within 5 seconds)

Each error displays a user-friendly message in the sidebar.

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Yes | Full support |
| Firefox | ✅ Yes | Full support |
| Safari | ✅ Yes | Full support on iOS 8+ |
| Edge | ✅ Yes | Full support |
| IE 11 | ❌ No | Not supported |

## Security & Privacy Considerations

### HTTPS Requirement
Geolocation API only works over HTTPS (except localhost for development)

### User Permissions
- Browser requests user permission before accessing location
- User can deny, allow, or block location sharing
- Can be revoked in browser settings at any time

### Data Usage
- Location data is **NOT** sent to external servers by default
- Only logs to browser console and Amplitude (if configured)
- Never persisted without explicit user consent

## Integration with Analytics (Amplitude)

When Amplitude is configured, the component logs:

```javascript
window.amplitude.getInstance().logEvent('user_location_detected', {
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 15,
  timestamp: '2026-01-17T13:04:00.000Z'
})
```

This enables:
- Tracking which floor users are on
- Analytics on location-based engagement
- Heat maps of user movement patterns

## Code Implementation Details

### State Management
```javascript
const [userLocation, setUserLocation] = useState(null)
const [locationLoading, setLocationLoading] = useState(true)
const [locationError, setLocationError] = useState(null)
```

### Geolocation Hook (useEffect)
```javascript
useEffect(() => {
  if ('geolocation' in navigator) {
    // Get current position
    navigator.geolocation.getCurrentPosition(success, error, options)
    
    // Watch for position changes
    const watchId = navigator.geolocation.watchPosition(
      success, error, watchOptions
    )
    
    // Cleanup on unmount
    return () => navigator.geolocation.clearWatch(watchId)
  }
}, [])
```

### Success Handler
- Updates `userLocation` state
- Logs to console and Amplitude
- Sets `locationLoading` to false

### Error Handler
- Sets error message
- Sets `locationLoading` to false
- Logs warning to console

## Future Enhancements

### 1. Proximity Detection
```javascript
// Calculate distance between user and booth
const distance = calculateHaversineDistance(
  userLocation,
  {latitude: boothLat, longitude: boothLon}
)

// Suggest nearby booths
if (distance < 50) { // Within 50 meters
  suggestBooth(booth)
}
```

### 2. Booth Visit Tracking
```javascript
// When user enters booth zone
const onBoothProximity = (booth) => {
  addBoothVisit({
    boothId: booth.id,
    enteredAt: new Date(),
    userLocation,
  })
}
```

### 3. Location Heatmap
- Aggregate user locations over time
- Identify popular booth areas
- Optimize floor layout

### 4. Background Location Updates
- Request background location permission
- Track movement even when app is minimized
- Power-efficient tracking algorithm

## Testing Recommendations

### Desktop Testing
1. Use Chrome DevTools geolocation emulation
2. Set custom coordinates
3. Test error scenarios

### Mobile Testing
1. Use real device with GPS
2. Test in different locations
3. Verify accuracy in various environments

### Edge Cases
- Indoors (weaker GPS signal)
- GPS spoofing detection
- Rapid movement scenarios
- Location permission revocation

## Configuration Options

To modify tracking behavior, edit the options in `Map.jsx`:

```javascript
// Initial position request
{
  enableHighAccuracy: true,   // Use GPS (battery intensive)
  timeout: 5000,             // Max wait time
  maximumAge: 0,             // Ignore cache
}

// Continuous position watching
{
  enableHighAccuracy: false,  // Balanced accuracy
  timeout: 5000,
  maximumAge: 10000,         // Cache for 10 seconds
}
```

### Battery vs Accuracy Trade-off
- **High Accuracy**: More battery drain, better precision
- **Balanced Mode**: Lower accuracy, conserves battery
- **Battery Saver**: Coarse location, minimal battery usage

Currently configured with:
- **Initial**: High accuracy to establish baseline
- **Continuous**: Balanced mode for ongoing tracking

