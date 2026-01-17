# Backend Integration & Amplitude Setup Guide

## Overview

The geolocation tracking system now includes:
- ✅ 4 hardcoded booths (Google, Shopify, Amplitude, Foresters Financial)
- ✅ Real-time Amplitude logging for all events
- ✅ Convex backend schema for data persistence
- ✅ Service layer for data orchestration

---

## What's Been Set Up

### 1. Booth Data Added

Four booths are now configured in `badge-app/src/pages/Map.jsx`:

| Booth | Position | Tags | Status |
|-------|----------|------|--------|
| Google | x:150, y:200 | AI/ML, Cloud, Web Dev | ✅ Ready |
| Shopify | x:400, y:150 | E-Commerce, Web Dev, Payments | ✅ Ready |
| Amplitude | x:300, y:350 | Analytics, Data Science, Product | ✅ Ready |
| Foresters Financial | x:550, y:280 | Finance, Insurance, Actuarial | ✅ Ready |

All have placeholder descriptions and talking points ready to be filled in.

### 2. Amplitude Logging Enabled

**Events being logged**:
- `map_page_loaded` - When map loads with initial geolocation
- `user_location_updated` - Every 10 seconds with new coordinates
- `booth_clicked` - When user clicks on a booth marker
- `booth_visit_started` - When booth popup opens
- `booth_visit_ended` - When booth popup closes (includes duration)
- `geolocation_error` - If GPS access denied or unavailable
- `geolocation_watch_error` - If continuous tracking fails

**Event data includes**:
- Latitude/Longitude coordinates
- GPS accuracy radius
- Booth information (if applicable)
- Timestamps
- Error details (if applicable)

### 3. Convex Backend Ready

**Three new tables created** in `my-app/convex/schema.ts`:

#### `userLocations` Table
Stores every GPS coordinate captured
```
- userId, latitude, longitude, accuracy, floor, timestamp
- Indexed by userId for quick lookups
```

#### `boothVisits` Table
Tracks booth interactions with duration
```
- userId, boothId, boothName, companyName
- visitedAt, endedAt, durationSeconds, userLocation
- Indexed by userId and boothId
```

#### `geolocationEvents` Table
Raw event log for analytics
```
- userId, eventName, eventData (JSON), timestamp
- Indexed by eventName for event-based queries
```

### 4. Convex Functions Created

**Mutations** (`my-app/convex/geolocation.ts`):
- `saveUserLocation()` - Store GPS coordinates
- `saveBoothVisit()` - Store booth visit records
- `logGeolocationEvent()` - Log events for analytics

**Queries**:
- `getUserLocations()` - Get all locations for a user
- `getUserBoothVisits()` - Get all booth visits for a user
- `getBoothVisits()` - Get all users who visited a booth
- `getEventsByType()` - Get events by event name

### 5. Service Layer Created

**`badge-app/src/services/geolocationService.js`** provides:
- `logGeolocationEvent()` - Log to Amplitude
- `saveLocationToBackend()` - Save to Convex
- `saveBoothVisitToBackend()` - Save visit to Convex
- `calculateDistance()` - Haversine distance calc
- `getNearbyBooths()` - Find booths near user
- `BoothVisitTracker` - Class for tracking visit duration

---

## How to Complete the Integration

### Step 1: Enable Amplitude Logging (Done ✅)

The code is already logging events. Amplitude will automatically track:
```javascript
window.amplitude.getInstance().logEvent('booth_clicked', {
  booth_id: '1',
  booth_name: 'Google Sponsor Booth',
  user_location: { latitude, longitude, accuracy },
  timestamp: new Date().toISOString(),
})
```

**To view in Amplitude Dashboard**:
1. Go to [amplitude.com](https://amplitude.com)
2. Log in to your project
3. Go to "Chart" → Create new chart
4. Filter by event name (e.g., "booth_clicked")
5. View real-time user activity

### Step 2: Connect Convex Mutations to Map Component

Currently, the Map component logs to Amplitude but doesn't save to Convex yet. To enable:

**Edit**: `badge-app/src/pages/Map.jsx`

Add Convex hook:
```javascript
import { useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'

export default function Map() {
  // Add these lines
  const saveLocationMutation = useMutation(api.geolocation.saveUserLocation)
  const saveBoothVisitMutation = useMutation(api.geolocation.saveBoothVisit)
  
  // Inside location success handler:
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude, accuracy } = position.coords
      setUserLocation({ latitude, longitude, accuracy, ... })
      
      // NEW: Save to Convex
      await saveLocationMutation({
        userId: userProfile?.id || 'anonymous',
        latitude,
        longitude,
        accuracy,
        floor: 'MyHall Floor 3',
        timestamp: new Date().toISOString(),
      })
    })
  }, [saveLocationMutation])
}
```

### Step 3: Enable Booth Visit Persistence

Update booth click handler to save to Convex:

```javascript
const handleBoothClick = (booth) => {
  setSelectedBooth(booth)
  
  // Log to Amplitude (already done)
  window.amplitude.getInstance().logEvent('booth_clicked', { ... })
  
  // NEW: Save to Convex
  const boothVisit = {
    userId: userProfile?.id || 'anonymous',
    boothId: booth.id,
    boothName: booth.name,
    companyName: booth.companyName,
    visitedAt: new Date().toISOString(),
    userLocation,
  }
  
  await saveBoothVisitMutation(boothVisit)
  
  // Track duration
  const tracker = new BoothVisitTracker(booth, userLocation)
  
  // When closing popup, end tracking
  // tracker.end() will save to backend
}
```

### Step 4: Verify in Convex Dashboard

1. Go to [convex.dev](https://convex.dev)
2. Select your project
3. Go to "Database" tab
4. View tables: `userLocations`, `boothVisits`, `geolocationEvents`
5. Query and inspect the data

---

## Data Flow After Integration

```
User Action
    ↓
Map Component (Map.jsx)
    ├→ Update React State (immediate UI update)
    ├→ Call Amplitude (real-time analytics)
    └→ Call Convex Mutation (persistent storage)
         ↓
    Backend Processing
         ├→ Save to userLocations table (if location)
         ├→ Save to boothVisits table (if booth visit)
         └→ Save to geolocationEvents table (event log)
         ↓
    Database (Convex)
         ├→ userLocations: All GPS coordinates
         ├→ boothVisits: All booth interactions
         └→ geolocationEvents: Event history
         ↓
    Analytics Available
         ├→ Amplitude Dashboard: Real-time events
         ├→ Convex Console: Raw data inspection
         └→ Custom Queries: Event analysis
```

---

## Testing the Integration

### Local Testing

1. Start the dev server:
```bash
cd badge-app
npm run dev
```

2. Open the Map page and allow location access

3. Check console for logged events:
```
[Amplitude] map_page_loaded { latitude: ..., longitude: ... }
[Amplitude] user_location_updated { latitude: ..., longitude: ... }
[Amplitude] booth_clicked { booth_id: '1', ... }
```

4. Click on booth markers and watch for events

### Production Testing

1. Deploy to Convex:
```bash
cd my-app
npx convex deploy
```

2. Amplitude events flow automatically (no action needed)

3. View data in Convex Dashboard:
```
convex.dev → Project → Database → Tables
```

---

## Key Metrics & Insights Available

### User Engagement
```javascript
// Query: Get all booth visits for a user
const userBooths = await useQuery(api.geolocation.getUserBoothVisits, {
  userId: 'user_123'
})
// Result: [{boothId, boothName, visitedAt, durationSeconds}, ...]
// Insight: Which booths did each user visit?
```

### Booth Popularity
```javascript
// Query: Get all visitors to a booth
const boothVisitors = await useQuery(api.geolocation.getBoothVisits, {
  boothId: '1'
})
// Result: [{userId, visitedAt, durationSeconds}, ...]
// Insight: How many people visited? How long did they stay?
```

### User Movement
```javascript
// Query: Get all locations for a user
const userPath = await useQuery(api.geolocation.getUserLocations, {
  userId: 'user_123'
})
// Result: [{latitude, longitude, timestamp}, ...]
// Insight: What path did the user take through the floor?
```

### Event Analysis
```javascript
// Query: Get all booth clicks
const clicks = await useQuery(api.geolocation.getEventsByType, {
  eventName: 'booth_clicked'
})
// Result: Array of all booth click events across all users
// Insight: Which booths get the most attention?
```

---

## Amplitude Dashboard Features

### Real-Time Activity
- See events as they happen
- Live user locations on map (with geolocation data)
- Booth click heatmaps

### Segmentation
```
Filter events by:
- Booth ID
- User location (latitude/longitude range)
- Time period
- Event type (click, visit, location update)
```

### Cohort Analysis
```
Find:
- Users who visited multiple booths
- Users who spent >5 minutes at a booth
- Users who visited Google but not Shopify
```

### Funnel Analysis
```
Track user journey:
1. Loaded map
2. Detected location
3. Clicked booth
4. Viewed booth details
5. [Next: Messaged recruiter?]
```

---

## Convex Dashboard Features

### Data Explorer
- Browse all tables
- Filter and search records
- View raw JSON data

### Query Builder
```typescript
// Example: Get average booth visit duration
const avgDuration = await ctx.db
  .query("boothVisits")
  .collect()
  .reduce((sum, visit) => sum + (visit.durationSeconds || 0), 0) 
  / visits.length
```

### Real-Time Sync
- View data updates instantly
- No refresh needed
- Changes visible immediately

---

## Common Use Cases

### Use Case 1: "Which booth is most popular?"
```javascript
// Query all booth visits, count by booth ID
const boothCounts = visits.reduce((acc, visit) => {
  acc[visit.boothId] = (acc[visit.boothId] || 0) + 1
  return acc
}, {})
// Result: { '1': 45, '2': 38, '3': 52, '4': 31 }
// Answer: Amplitude booth (ID 3) with 52 visitors!
```

### Use Case 2: "How long do people spend at Google booth?"
```javascript
// Query Google booth visits, calculate average
const googleVisits = visits.filter(v => v.boothId === '1')
const avgTime = googleVisits.reduce((sum, v) => 
  sum + (v.durationSeconds || 0), 0
) / googleVisits.length
// Result: 180 seconds = 3 minutes average
```

### Use Case 3: "Show me user's journey through the floor"
```javascript
// Get locations in chronological order
const journey = locations
  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
// Result: Array of coordinates tracking user's path
// Visualize on map to see walking pattern
```

### Use Case 4: "Which users haven't visited any booths?"
```javascript
// Find users with no booth visits
const inactiveUsers = allUsers.filter(user => 
  !boothVisits.some(visit => visit.userId === user.id)
)
// Result: Users who opened map but didn't explore
```

---

## Troubleshooting

### Events not appearing in Amplitude?

1. Check Amplitude API key is correct in index.html
2. Verify `window.amplitude` is initialized
3. Check browser console for errors
4. Verify user hasn't blocked analytics

### Convex mutations not saving?

1. Ensure Convex project is deployed: `npx convex deploy`
2. Check API keys are correct
3. Verify mutations are properly typed
4. View errors in Convex dashboard

### Location not being captured?

1. User may have denied permission
2. Browser may not support geolocation
3. HTTPS required in production
4. Check browser geolocation settings

### Performance issues?

1. Reduce update frequency (increase `maximumAge`)
2. Implement pagination for large datasets
3. Add database indexes (already done)
4. Archive old geolocation data periodically

---

## Next Steps

1. ✅ **Test the current implementation**
   - Start dev server
   - Open map page
   - Click booths
   - Watch Amplitude events

2. 🔲 **Enable Convex mutations** (see Step 2 above)
   - Add Convex hooks to Map.jsx
   - Test data saves to database

3. 🔲 **Fill in booth details**
   - Add descriptions for each booth
   - Add talking points
   - Add actual personnel

4. 🔲 **Create analytics dashboard**
   - Display booth popularity
   - Show user visit history
   - Visualize floor movement

5. 🔲 **Deploy to production**
   - Push to main branch
   - Deploy Convex changes
   - Verify HTTPS enabled
   - Monitor Amplitude dashboard

---

## Files Modified/Created

✅ `badge-app/src/pages/Map.jsx` - 4 booths + enhanced logging
✅ `badge-app/src/services/geolocationService.js` - Service layer
✅ `my-app/convex/schema.ts` - Database schema
✅ `my-app/convex/geolocation.ts` - Backend functions
✅ `GEOLOCATION_TRACKING_EXPLAINED.md` - Detailed explanation

---

## Questions?

Refer to:
- `GEOLOCATION_TRACKING_EXPLAINED.md` - How geolocation works
- `BOOTH_POSITIONING_GUIDE.md` - How to add more booths
- `IMPLEMENTATION_SUMMARY.md` - Overall architecture
- Inline comments in source files

