# How Geolocation Tracking Works - Your Question Answered

## Your Question: "Clarify how geolocation data is being tracked?"

### Answer (Plain English):

There are **3 separate systems** that track location data:

---

## System 1: Browser Geolocation (Your Device)

**What it does**:
- Asks your browser for GPS coordinates (latitude/longitude)
- Gets accuracy rating (like "accurate within 15 meters")
- Repeats every 10 seconds to track movement

**Where data lives**:
- In the browser's memory (app-only)
- Disappears if you close browser or navigate away
- NOT sent anywhere by default

**What you see**:
- Red pulsing dot on the floor map
- Updates position every 10 seconds
- Shows your real-time location on the map

**Timeline**:
```
13:04:00 → Browser: "Let me get your location..."
         → Your device GPS: "You're at 40.7128°N, 74.0060°W"
         → Browser: "Got it, showing red dot on map"
         → Red dot appears at that location ✓

13:04:10 → Browser: "Let me check again..."
         → Your device GPS: "You're at 40.7135°N, 74.0065°W (moved slightly)"
         → Browser: "Got it, moving red dot"
         → Red dot shifts slightly on map ✓
```

---

## System 2: Amplitude (Real-time Analytics)

**What it does**:
- Logs EVERY event that happens (with timestamp and location)
- Sends logs to Amplitude servers immediately
- Organizers see live updates on a dashboard

**Events being logged**:

| Event | Logged at | Contains |
|-------|-----------|----------|
| `map_page_loaded` | When you open map | Your location, timestamp |
| `user_location_updated` | Every 10 seconds | New location, accuracy |
| `booth_clicked` | When you click a booth | Booth ID, your location, time |
| `booth_visit_started` | When popup opens | Booth name, start time |
| `booth_visit_ended` | When you close popup | Duration spent (in seconds) |
| `geolocation_error` | If GPS fails | Error message, timestamp |

**Where data goes**:
```
Your App → (sends event) → Amplitude Servers → Dashboard
                                     ↓
                        Organizers see in real-time
                        at amplitude.com
```

**Example of a logged event**:
```javascript
{
  eventName: "booth_clicked",
  timestamp: "2026-01-17T13:04:30.000Z",
  booth_id: "1",
  booth_name: "Google Sponsor Booth",
  user_location: {
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 15
  }
}
```

**What organizers see in real-time**:
- "127 users have opened the map"
- "54 users visited Google booth"
- "38 users visited Shopify booth"
- "Average time per booth: 3 min 45 sec"
- Live updates as events happen

---

## System 3: Convex Backend (Permanent Database)

**What it does**:
- Saves the same event data to a permanent database
- Creates searchable records that never go away
- Allows for detailed historical analysis

**Data saved in 3 tables**:

### Table 1: `userLocations`
Stores every GPS coordinate you've been at
```
Record: { 
  userId: "user_123",
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 15,
  floor: "MyHall Floor 3",
  timestamp: "2026-01-17T13:04:00Z"
}
```
**Used for**: Replaying your path, heat maps, movement analysis

### Table 2: `boothVisits`
Stores when/where you visited a booth
```
Record: {
  userId: "user_123",
  boothId: "1",
  boothName: "Google Sponsor Booth",
  companyName: "Google",
  visitedAt: "2026-01-17T13:04:30Z",
  endedAt: "2026-01-17T13:05:15Z",
  durationSeconds: 45,
  userLocation: { latitude, longitude, accuracy }
}
```
**Used for**: Booth popularity, engagement metrics, user profiles

### Table 3: `geolocationEvents`
Stores raw event log
```
Record: {
  userId: "user_123",
  eventName: "booth_clicked",
  eventData: {
    latitude: 40.7128,
    booth_id: "1",
    booth_name: "Google Booth",
    ...
  },
  timestamp: "2026-01-17T13:04:30Z"
}
```
**Used for**: Detailed event analysis, debugging, auditing

**Where data goes**:
```
Your App → (saves record) → Convex API → Database
                                    ↓
                         Stored permanently
                         Visible at convex.dev
```

---

## The Complete Flow (Step-by-Step)

### Step 1: You Open the Map
```
Browser checks: "Can I access your location?"
  ↓
You click: "Allow"
  ↓
Browser gets GPS: { lat: 40.7128, lon: -74.0060, accuracy: 15 }
  ↓
React updates state with location
  ↓
Red dot appears on map at 40.7128, -74.0060
```

### Step 2: Red Dot Shows Your Position
```
Location data in browser memory:
  { latitude: 40.7128, longitude: -74.0060, accuracy: 15 }
  ↓
Draws red pulsing circle at coordinates
  ↓
You see yourself on the floor map
```

### Step 3: Events Get Logged to Amplitude
```
Browser creates event:
  { eventName: "map_page_loaded", location: {...}, timestamp: "..." }
  ↓
Sends to Amplitude: amplitude.getInstance().logEvent(...)
  ↓
Amplitude receives and processes
  ↓
Event appears on amplitude.com dashboard
```

### Step 4: Events Get Saved to Convex
```
Browser creates mutation:
  { eventName: "map_page_loaded", location: {...}, timestamp: "..." }
  ↓
Calls Convex: saveLocationMutation(...)
  ↓
Convex API receives and validates
  ↓
Data inserted into userLocations table
  ↓
Record visible in convex.dev database forever
```

### Step 5: Every 10 Seconds (Repeat)
```
Browser gets new GPS coordinates
  ↓
Updates red dot on map
  ↓
Logs "user_location_updated" to Amplitude
  ↓
Saves new record to Convex database
```

### Step 6: You Click a Booth
```
You click: Booth marker on map
  ↓
Browser creates event: "booth_clicked"
  ↓
Logs to Amplitude + saves to Convex
  ↓
Popup opens with booth details
  ↓
Timer starts counting seconds
```

### Step 7: You Close the Booth Popup
```
You click: Close button on popup (after 45 seconds)
  ↓
Browser calculates: 45 seconds spent
  ↓
Creates event: "booth_visit_ended" with duration
  ↓
Logs to Amplitude + saves to Convex
  ↓
Convex records: { boothId: 1, durationSeconds: 45, ... }
```

---

## Visualization: The Three Layers

```
┌─────────────────────────────────────────────────────────┐
│ LAYER 1: BROWSER (Your Device)                          │
│ ┌──────────────────────────────────────────────────┐    │
│ │ GPS Coordinates (Every 10 seconds)               │    │
│ │ Latitude: 40.7128° N                             │    │
│ │ Longitude: 74.0060° W                            │    │
│ │ Accuracy: 15 meters                              │    │
│ │                                                   │    │
│ │ [Red Pulsing Dot on Map Shows Position]          │    │
│ │ ↓ Disappears if browser closes                   │    │
│ └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                        ↓ Event
                 (latitude, longitude, accuracy,
                  booth_id, timestamp, etc.)
                        ↓
        ┌───────────────┴───────────────┐
        ↓                               ↓
┌──────────────────┐          ┌──────────────────┐
│ LAYER 2: AMPLITUDE           │ LAYER 3: CONVEX  │
│ Real-time Analytics          │ Permanent DB     │
│                              │                  │
│ Event received               │ Record inserted  │
│ ↓ Processed instantly        │ ↓ Stored forever │
│ ↓ Dashboard updates live     │ ↓ Queryable      │
│ ↓ Visible at amplitude.com   │ ↓ In convex.dev  │
│                              │                  │
│ 127 map opens ✓              │ userLocations ✓  │
│ 54 Google visits ✓           │ boothVisits ✓    │
│ 38 Shopify visits ✓          │ geolocationEvt ✓ │
│ 3:45 avg time ✓              │                  │
└──────────────────┘          └──────────────────┘
```

---

## What Gets Shared Where

### With Browser (Only)
```
✓ GPS coordinates (latitude, longitude)
✓ Accuracy radius
✗ NOT sent anywhere else unless...
```

### With Amplitude (Real-time)
```
✓ GPS coordinates
✓ Accuracy
✓ Booth IDs & names
✓ Visit duration
✓ All timestamps
→ Visible to organizers immediately
```

### With Convex (Permanent)
```
✓ GPS coordinates
✓ Accuracy
✓ Booth IDs & names
✓ Visit duration
✓ All timestamps
✓ User ID (if logged in)
→ Stored forever in database
→ Available for any future analysis
```

---

## Privacy Considerations

### What's Tracked ✅
- Your GPS location (latitude/longitude)
- Booth interactions
- Time spent at booths
- Timestamps of everything

### What's NOT Tracked ❌
- Your personal information (unless you log in)
- Conversations at booths
- Device fingerprint
- Browsing history
- Physical appearance

### You Control It 🎮
- Grant/deny permission at start
- Can revoke anytime in browser settings
- Data deleted when you close browser (locally)
- Can request Convex to delete your data anytime

---

## Real Example: Your Visit Timeline

```
13:04:00 - You open app
  Browser: Getting location...
  ↓ Your location: 40.7128°N, 74.0060°W (accuracy: 15m)
  ↓ Event to Amplitude: "map_page_loaded"
  ↓ Record to Convex: Insert into userLocations
  Red dot appears on map ✓

13:04:10 - 10 seconds pass (continuous tracking)
  Browser: Getting location...
  ↓ Your location: 40.7135°N, 74.0065°W (moved slightly)
  ↓ Event to Amplitude: "user_location_updated"
  ↓ Record to Convex: Insert into userLocations
  Red dot moves on map ✓

13:04:30 - You click Google booth
  Browser detects click
  ↓ Event to Amplitude: "booth_clicked"
  ↓ Record to Convex: Insert into geolocationEvents
  ↓ Timer starts: 00:00
  Booth popup opens ✓

13:04:45 - 15 seconds at booth
  Browser: Getting location...
  ↓ Your location: 40.7138°N, 74.0070°W
  ↓ Event to Amplitude: "user_location_updated"
  ↓ Record to Convex: Insert into userLocations
  (Note: You're still inside the popup)

13:05:15 - You close the popup (45 seconds spent)
  Browser detects popup close
  ↓ Calculates duration: 45 seconds
  ↓ Event to Amplitude: "booth_visit_ended"
  ↓ Record to Convex: Insert into boothVisits
  Popup closes ✓

13:05:25 - 10 more seconds pass
  Browser: Getting location...
  ↓ Your location: 40.7142°N, 74.0058°W (moved to different booth)
  ↓ Event to Amplitude: "user_location_updated"
  ↓ Record to Convex: Insert into userLocations
  Red dot moves on map ✓
```

---

## Questions You Might Have

### Q: "Is my location being sold?"
**A**: No. It's only used for:
- Real-time booth discovery (your device only)
- Event analytics (Amplitude dashboard)
- Permanent records (Convex database)
- All owned by your organization

### Q: "Can I turn it off?"
**A**: Yes, anytime:
- Click "Deny" when browser asks
- Go to browser settings → Revoke location permission
- Close the app

### Q: "Who can see this data?"
**A**:
- Amplitude Dashboard: Organizers/admin team
- Convex Database: Developers/admin team
- Your App: Anyone using the map can see their own red dot

### Q: "How long is it stored?"
**A**:
- Browser: Until you close the app
- Amplitude: 1-2 years (typical) or as configured
- Convex: Permanent (your decision to archive/delete)

### Q: "Can I see my own data?"
**A**:
- Live: Red dot on map shows your location
- History: Technically possible but not currently displayed
- Can be added as a feature

---

## The Simplest Explanation Possible

**One sentence**: Your location is tracked by 3 systems:
1. **Browser** shows you a dot on the map
2. **Amplitude** logs events for real-time dashboards
3. **Convex** saves everything permanently for analysis

**That's it.**

---

## Need More Details?

- **Technical deep dive**: See `GEOLOCATION_TRACKING_EXPLAINED.md`
- **Backend integration**: See `BACKEND_INTEGRATION_GUIDE.md`
- **Adding more booths**: See `BOOTH_POSITIONING_GUIDE.md`

