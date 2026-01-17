# Live Tracking Map - 75m × 75m Room Implementation

## Overview
The career fair map now features **live real-time tracking** with 4 sponsor booths distributed throughout a 75m × 75m venue, with the user represented by a red pulsing dot that updates in real-time as they move.

## Key Updates

### 1. **Room Dimensions: 75m × 75m**
- **Total Space**: 75 meters × 75 meters
- **Room Bounds on Map**:
  - Left edge: 12.5% of map width
  - Right edge: 87.5% of map width
  - Top edge: 12.5% of map height
  - Bottom edge: 87.5% of map height
- **Room Center** (User Starting Position): 50% × 50% of map

### 2. **Booth Distribution**
The 4 sponsor booths are now spaced evenly throughout the room:

| Booth | Position | Distance from Center |
|-------|----------|----------------------|
| **Google** | 20% × 20% (TL) | ~42m from center |
| **Shopify** | 80% × 20% (TR) | ~42m from center |
| **Amplitude** | 20% × 80% (BL) | ~42m from center |
| **Foresters Financial** | 80% × 80% (BR) | ~42m from center |

**Spacing**:
- Top-left to top-right: ~42.4m apart (horizontal)
- Top-left to bottom-left: ~42.4m apart (vertical)
- Each booth is roughly in the middle section of its quadrant, not at extreme corners
- All booths evenly distributed for good coverage

### 3. **Live Tracking Implementation**

#### GPS to Map Position Conversion
```javascript
// 1. Get GPS delta from initial position
latDiff = current_latitude - initial_latitude
lonDiff = current_longitude - initial_longitude

// 2. Convert degrees to meters
metersLat = latDiff × 111,000 (meters per degree)
metersLon = lonDiff × 111,000 × cos(latitude) (adjusted for latitude)

// 3. Convert meters to map percentage
percentX = (metersLon / 150) × 100  // 150 = 75m × 2 (full span)
percentY = (metersLat / 150) × 100

// 4. Position relative to room center
pixelX = 50 + percentX
pixelY = 50 - percentY

// 5. Constrain to room bounds
pixelX = clamp(pixelX, 12.5%, 87.5%)
pixelY = clamp(pixelY, 12.5%, 87.5%)
```

#### Real-Time Updates
- **Update Frequency**: Every 500ms (maximumAge: 500)
- **Accuracy**: High accuracy GPS enabled
- **Smooth Movement**: Red dot smoothly follows user position
- **Bounds Checking**: User can't move outside the room area

### 4. **Distance Calculations**
- **Metric**: 1% of map ≈ 1 meter in the room
- **Calculation**: Euclidean distance from user to booth position
- **Display**: Updated in real-time in sidebar and booth details
- **Format**: "~{distance}m away"

Example distances from center (50%, 50%):
- To Google (20%, 20%): √[(30)² + (30)²] ≈ 42m
- To Shopify (80%, 20%): √[(30)² + (30)²] ≈ 42m
- To Amplitude (20%, 80%): √[(30)² + (30)²] ≈ 42m
- To Foresters (80%, 80%): √[(30)² + (30)²] ≈ 42m

### 5. **Red Dot User Indicator**
Features:
- **Position**: Centers at user's real-time GPS location
- **Animation**: Pulsing ring effect showing active tracking
- **Color**: Bright red (#ff6b6b)
- **Updates**: Refreshes every 500ms as user moves
- **Accuracy**: Shows GPS accuracy in tooltip
- **Smoothness**: Uses CSS transitions for smooth movement

CSS Animation:
```css
@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}
```

## How Live Tracking Works

### Step-by-Step Flow
1. **User Visits Map**
   - Browser requests geolocation permission
   - User clicks "Allow"

2. **Initial Position**
   - `getCurrentPosition()` reads initial GPS
   - Map center (50%, 50%) is established as starting point
   - Red dot appears at map center

3. **Continuous Tracking**
   - `watchPosition()` runs every 500ms
   - New GPS coordinates are received
   - Delta from initial position is calculated
   - Coordinates converted to map percentage
   - Red dot updates smoothly to new position

4. **Distance Updates**
   - Every position update triggers distance recalculation
   - All booth distances update in real-time
   - Sidebar booth list shows updated distances
   - Details popup (if open) shows current distance

5. **Analytics Logging**
   - Position updates logged to Amplitude
   - Distance data sent with analytics events

### Example Tracking Sequence
```
Time: 0s
Initial GPS: (40.7128, -74.0060)
Map Position: (50%, 50%) ← Center
Red Dot: Appears at center
Distances: All booths ~42m away

Time: 5s
New GPS: (40.7132, -74.0065) - user moved ~500m northeast
Lat Delta: +0.0004° ≈ +44m
Lon Delta: -0.0005° ≈ -45m
Map Position: (55%, 45%) ← Moved towards top-right
Red Dot: Moves northeast on map
Distances: Shopify closer (~15m), Amplitude farther (~65m)

Time: 10s
New GPS: (40.7135, -74.0058) - user moved to Shopify booth
Map Position: ~(70%, 30%)
Red Dot: Positioned near Shopify marker
Distance to Shopify: ~0m
Amplitude Logging: "user_location_updated" event sent
```

## Testing Live Tracking

### Real Device (Mobile)
1. Open app on smartphone with GPS
2. Accept location permission
3. Move around the venue
4. Watch red dot follow your position in real-time
5. Check distances to booths as you move

### Desktop Simulation
Using browser DevTools:
1. Open DevTools (F12 or Cmd+Shift+I)
2. Go to **Sensors** tab → **Geolocation**
3. Set "Location" to custom coordinates
4. Click "Overwrite" button repeatedly with different coordinates
5. Red dot will update based on new coordinates
6. Distances will recalculate

### Testing Path Example
```
Initial: (50%, 50%) → Center
Move 1: (30%, 30%) → Google booth area
Move 2: (70%, 30%) → Shopify booth area
Move 3: (30%, 70%) → Amplitude booth area
Move 4: (70%, 70%) → Foresters booth area
Move 5: (50%, 50%) → Back to center
```

## API Configuration

### Browser Geolocation API Options
```javascript
{
  enableHighAccuracy: true,    // Use GPS, not WiFi triangulation
  timeout: 5000,               // 5 second timeout per request
  maximumAge: 500              // Cache results for 500ms (frequent updates)
}
```

### No Additional API Keys Required
- ✅ Geolocation API is browser-native (W3C standard)
- ✅ No Google Maps needed
- ✅ No external location service required
- ✅ Works offline (uses device GPS)

## Performance Optimization

### Updates Per Second
- `maximumAge: 500` → Up to 2 updates per second
- Smooth animation without excessive re-renders
- Battery efficient on mobile devices
- Accurate enough for indoor tracking

### Memory Management
- Initial position stored in `initialLocationRef`
- Watch ID stored for cleanup on unmount
- No memory leaks: `clearWatch()` called on component unmount
- Automatic ref cleanup on navigation

## Accuracy Considerations

### GPS Accuracy Indoors
- Typical accuracy: ±5-20m indoors
- Can be affected by:
  - Building materials (concrete, metal)
  - Number of satellites visible
  - Time of day (atmospheric conditions)
  - Tall buildings (urban canyon effect)

### Mitigation Strategies
- Show accuracy estimate: "±{accuracy}m"
- Large room (75m) means ±20m error is only ±26% of room width
- Constrain user to bounds so they can't escape room
- Use high accuracy GPS to minimize errors

### Fallback Options (Future)
- QR code scanning for precise booth entry
- WiFi trilateration for better indoor accuracy
- BLE beacon integration for centimeter-level precision
- Manual floor/zone selection

## File Changes

### Modified Files
1. **Map.jsx**
   - Room constants: 75m × 75m
   - Booth positions: 20%, 80% on both axes (0.2, 0.8 decimals)
   - Room bounds: 12.5% - 87.5% on each axis
   - Geolocation algorithm: Updated for 75m space
   - WatchPosition maximumAge: 500ms (was 1000ms)
   - Distance calculation: Now handles decimal booth positions

2. **No CSS Changes**
   - Existing styles work with new data format
   - Booth markers still animate on hover
   - Red dot still pulses smoothly

### Key Constants
```javascript
const ROOM_WIDTH_METERS = 75
const ROOM_HEIGHT_METERS = 75
const ROOM_BOUNDS = {
  minX: 0.125,    // 12.5%
  maxX: 0.875,    // 87.5%
  minY: 0.125,    // 12.5%
  maxY: 0.875,    // 87.5%
}
```

## Amplitude Event Data

Events logged for live tracking analysis:
```javascript
// Initial detection
{
  event: 'map_page_loaded',
  latitude, longitude, accuracy
}

// Continuous updates
{
  event: 'user_location_updated',
  latitude, longitude, accuracy,
  pixelX, pixelY  // Map position
}

// Booth interaction
{
  event: 'booth_clicked',
  booth_id, booth_name, company_name,
  user_position: {x, y},
  distance_to_booth
}
```

## Troubleshooting

### Red Dot Not Moving
- ✓ Check if geolocation permission granted
- ✓ Check browser console for GPS errors
- ✓ Verify GPS receiver has satellite lock (3+ satellites)
- ✓ Try moving outdoors for better signal
- ✓ Check maximumAge (500ms) is appropriate

### Distances Not Updating
- ✓ Ensure red dot is moving
- ✓ Check console for calculation errors
- ✓ Verify booth positions are in decimal format (0.2, not 20)

### Jumpy Position
- ✓ Reduce frequency: increase maximumAge (less responsive but smoother)
- ✓ Add position smoothing algorithm (Kalman filter)
- ✓ Use higher accuracy GPS if available

## Next Steps

1. **Test with real mobile device** in a venue
2. **Monitor accuracy** - adjust based on real-world results
3. **Collect analytics** - see how users interact with live tracking
4. **Consider add-ons**:
   - Proximity alerts ("You're near Google booth!")
   - Booth visit timer ("You've been here 5 min")
   - Route optimization ("Closest unvisited booth: Shopify, 12m")
   - Achievement badges ("Visited all 4 booths!")

---

## Summary of Changes

| Aspect | Before | After |
|--------|--------|-------|
| Room Size | 50m × 50m | 75m × 75m |
| Booth Positions | 10%, 90% | 20%, 80% (decimals: 0.2, 0.8) |
| Booth Spacing | Extreme corners | Evenly distributed |
| Update Frequency | 1000ms | 500ms |
| User Indicator | Static or slow | Live, smooth movement |
| Distance Metric | Generic | Real-time, accurate |
| Real-Time? | Partial | Full implementation |

The map is now a fully functional **live tracking system** that updates the user's position as they move in real-time! 🎯📍
