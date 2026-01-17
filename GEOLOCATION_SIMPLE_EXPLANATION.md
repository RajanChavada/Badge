# Geolocation Data Tracking - Simple Explanation

## The Simple Answer

**How is geolocation data being tracked?**

There are **3 layers** tracking your location:

### Layer 1: Your Browser (Real-time UI)
- When you open the map, the browser asks: "Can I access your location?"
- If you say "Yes", it gets your GPS coordinates (latitude, longitude)
- Every 10 seconds, it checks your new position
- A red pulsing dot shows where you are on the floor map
- **Storage**: Lives in app memory only (disappears when you close the browser)

### Layer 2: Amplitude (Real-time Analytics)
- Every time something interesting happens, the app logs it
- **Examples of logged events**:
  - "User opened map at 40.7128°N, 74.0060°W"
  - "User location updated to 40.7150°N, 74.0050°W"
  - "User clicked on Google booth"
  - "User spent 45 seconds at Google booth"
- **Where it goes**: Sent to Amplitude's servers immediately
- **Storage**: Kept for analytics (dashboards, reports, trends)
- **Visible at**: amplitude.com dashboard (real-time)

### Layer 3: Convex (Permanent Storage)
- All events and locations are also saved to a database
- **What's stored**:
  - Every GPS coordinate you've been at
  - Which booths you clicked on
  - How long you spent at each booth
  - Timestamps of everything
- **Where it goes**: Convex backend database
- **Storage**: Permanent (kept for your profile/history)
- **Visible at**: convex.dev dashboard or through queries

---

## Visual Data Flow

```
YOU (on the floor)
    ↓
    ↓ Every 10 seconds, your device's GPS sends coordinates
    ↓
YOUR BROWSER
    ├─→ Shows red dot on map (immediate)
    ├─→ Sends event to AMPLITUDE
    │   (real-time analytics)
    │
    └─→ Sends event to CONVEX
        (permanent database)
    
    When you click a booth:
    ├─→ Popup shows booth info (immediate)
    ├─→ Sends "booth_clicked" to AMPLITUDE
    ├─→ Saves to CONVEX
    └─→ Starts a timer to measure how long you stay
    
    When you close booth popup:
    ├─→ Stops the timer
    ├─→ Sends "booth_visit_ended" + duration to AMPLITUDE
    └─→ Saves final visit record to CONVEX
```

---

## What Actually Gets Tracked

### 1. Location Data (GPS)
```
{
  latitude: 40.7128,     // Your north/south position (degrees)
  longitude: -74.0060,   // Your east/west position (degrees)
  accuracy: 15,          // Uncertainty radius (15 meters)
  timestamp: "2026-01-17T13:04:00Z"
}
```
**Captured**: Every 10 seconds while viewing the map
**Sent to**: Browser → Amplitude → Convex

### 2. Booth Interactions
```
{
  booth_id: "1",
  booth_name: "Google Sponsor Booth",
  action: "clicked",
  duration_seconds: 45,
  timestamp: "2026-01-17T13:04:30Z"
}
```
**Captured**: When you click/unclick a booth
**Sent to**: Browser → Amplitude → Convex

### 3. Events (for Analytics)
```
Examples of events that get logged:
- "map_page_loaded"          → User opened map
- "user_location_updated"    → GPS coordinates updated
- "booth_clicked"            → User clicked on a booth
- "booth_visit_started"      → Booth popup opened
- "booth_visit_ended"        → Booth popup closed
- "geolocation_error"        → GPS failed/denied
```
**Sent to**: Amplitude (immediately) + Convex (for backup)

---

## Real-World Timeline Example

### You arrive at career fair and open the map:

```
⏱️ 13:04:00 - Map page loads
   → Browser requests location permission
   → You grant permission ✓
   → Browser gets GPS: 40.7128°, -74.0060°
   → Red dot appears on map
   → Event logged: "map_page_loaded"
   → Data sent to: Amplitude ✓, Convex ✓

⏱️ 13:04:10 - 10 seconds later
   → GPS checks again: 40.7130°, -74.0062°
   → Red dot moves slightly
   → Event logged: "user_location_updated"
   → Data sent to: Amplitude ✓, Convex ✓

⏱️ 13:04:30 - You click Google Booth
   → Popup shows "Google Sponsor Booth"
   → Timer starts: 00:00
   → Event logged: "booth_clicked"
   → Data sent to: Amplitude ✓, Convex ✓

⏱️ 13:05:15 - You close the popup (45 seconds later)
   → Timer stops: 00:45
   → Booth visit saved (45 seconds at Google booth)
   → Event logged: "booth_visit_ended" + duration
   → Data sent to: Amplitude ✓, Convex ✓

⏱️ 13:05:25 - Still viewing map
   → GPS checks: 40.7145°, -74.0055°
   → Red dot updates
   → Event logged: "user_location_updated"
   → Data sent to: Amplitude ✓, Convex ✓
```

---

## The 4 Booths Now Being Tracked

When you visit any of these booths, the system logs:

1. **Google Sponsor Booth** (x:150, y:200)
   - Booth clicks
   - Visit duration
   - Your location when clicked

2. **Shopify Booth** (x:400, y:150)
   - Booth clicks
   - Visit duration
   - Your location when clicked

3. **Amplitude Booth** (x:300, y:350)
   - Booth clicks
   - Visit duration
   - Your location when clicked

4. **Foresters Financial Booth** (x:550, y:280)
   - Booth clicks
   - Visit duration
   - Your location when clicked

---

## Where Does This Data Go?

### Amplitude Dashboard
- **URL**: amplitude.com
- **Access**: Organizers/admins only
- **View**: Real-time user activity
- **Use**: Understand booth popularity, user patterns
- **Example query**: "Show me all users who visited Google booth in the last hour"

### Convex Database
- **URL**: convex.dev
- **Access**: Developers/admins only
- **View**: Raw data tables with all records
- **Use**: Permanent storage, backups, advanced queries
- **Example query**: "What's the average time spent at each booth?"

### Your Browser
- **View**: Red pulsing dot on map
- **Persistence**: Disappears when you close browser
- **Use**: Real-time navigation and booth discovery

---

## Privacy & Security

### ✅ What's Tracked
- Your GPS coordinates (latitude/longitude)
- Accuracy of GPS signal
- Which booths you interact with
- How long you spend at each booth
- When each action happened

### ❌ What's NOT Tracked
- Your name (unless you're logged in)
- Your email/phone
- What you said or discussed
- Your browsing history elsewhere
- Your device ID or MAC address

### 🔐 Protection
- All data sent over HTTPS (encrypted)
- You control permission with browser prompt
- You can revoke permission anytime in browser settings
- Data only kept for this career fair event
- You can request deletion anytime

---

## What Can Organizers Learn?

### Real-time Insights (from Amplitude)
- "Google booth has 127 visitors so far"
- "Users spend an average of 3 minutes 20 seconds per booth"
- "Shopify booth is the most visited (45% of users)"
- "20 users haven't visited any booths yet"
- "Peak floor traffic is 2:15 PM - 2:45 PM"

### Historical Analysis (from Convex)
- "User 'john_doe' visited Google, Microsoft, and Shopify"
- "The path through the floor - most users go left to right"
- "Booth visit trend - increased traffic after announcements"
- "Comparison: Last year Google had 156 visitors, this year 189"

### Better Event Planning
- Optimize booth placement based on foot traffic
- Identify areas people avoid
- Time announcements for peak foot traffic
- Improve flow and booth distribution

---

## How Amplitude & Convex Work Together

```
┌─────────────────────────────────────────────────┐
│ Real-time: AMPLITUDE                            │
│ • Live dashboard updates                         │
│ • Watch events as they happen                    │
│ • Real-time alerts & notifications               │
│ • Great for: Monitoring, dashboards              │
└─────────────────────────────────────────────────┘

                    ↓ Same Data ↓

┌─────────────────────────────────────────────────┐
│ Permanent: CONVEX                               │
│ • Database backup of all events                  │
│ • Historical analysis                            │
│ • Complex queries & reports                      │
│ • Great for: Archives, analysis, debugging       │
└─────────────────────────────────────────────────┘
```

**Analogy**: Amplitude is like a live TV broadcast of what's happening right now. Convex is like recording that broadcast to your DVR for watching and analyzing later.

---

## The Complete Picture

### Step 1: Browser Collects (YOUR DEVICE)
- GPS location (latitude, longitude, accuracy)
- Timestamp
- Booth ID (if applicable)
- Update every 10 seconds

### Step 2: Amplitude Receives (REAL-TIME)
- Event logged immediately
- Updates dashboard instantly
- Visible in Amplitude console within seconds
- Used for live monitoring and trending

### Step 3: Convex Receives (PERSISTENT)
- Same data saved to database
- Permanent record created
- Can be queried anytime
- Backup for historical analysis

### Step 4: Analysis Happens (ON-DEMAND)
- Organizers run reports
- Compare booth metrics
- Identify trends
- Plan improvements

---

## Example Queries You Could Run

### Query 1: "Which booth is most popular?"
**Data Source**: Convex
**Result**: Amplitude booth with 127 visitors (52%)

### Query 2: "What's the average visit duration?"
**Data Source**: Convex
**Result**: 3 minutes 45 seconds per booth

### Query 3: "Who are the most engaged visitors?"
**Data Source**: Convex
**Result**: Users who visited 3+ booths and spent >10 mins total

### Query 4: "Show me the path one user took"
**Data Source**: Convex
**Result**: Timeline of 15 GPS points showing user's journey

### Query 5: "What time had peak foot traffic?"
**Data Source**: Amplitude
**Result**: 2:30 PM - 3:15 PM (187 concurrent users)

---

## Summary in Plain English

**Q: How is geolocation data being tracked?**

A: Three ways:

1. **Live View** (Your Browser)
   - Shows red dot on map
   - Updates every 10 seconds
   - You see your position in real-time

2. **Real-time Analytics** (Amplitude)
   - Every GPS update sent to Amplitude
   - Organizers see live dashboard
   - Can spot trends as they happen

3. **Permanent Database** (Convex)
   - All data also saved to database
   - Available for later analysis
   - Used for reports and insights

**Result**: Organizers can understand:
- Which booths are popular
- How long people spend at each booth
- What paths people take through the floor
- Overall event engagement

**Your Privacy**: Controlled by you through browser permissions. You can deny, revoke, or allow at any time.

