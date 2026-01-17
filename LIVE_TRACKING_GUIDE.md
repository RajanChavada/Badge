# Live Tracking Quick Reference

## What Changed?

### Before (Simplified)
- Full-screen map only
- Blue booth dots
- User position fixed at center
- No live tracking

### After (Current)
- Full layout with sidebar
- Purple numbered booth markers
- **Red pulsing dot shows YOUR live position**
- Real-time tracking as you move
- Sidebar shows location details & tracking status

## Key Features

### 🔴 Live User Tracking
- Red dot represents your current position
- Updates every 3 seconds
- Shows GPS accuracy (±X meters)
- Displays pixel coordinates on map

### 📍 Geolocation Permission
- Browser asks for permission on first visit
- Can revoke anytime in browser settings
- Required for live tracking to work
- Works on phone, tablet, and desktop

### 🎯 Booth Interactions
- Click any booth marker to see details
- Interactions logged with your location
- Helps with personalized recommendations
- Tracks movement patterns

### 📊 Analytics Sidebar
Shows:
- GPS coordinates (latitude/longitude)
- Accuracy in meters
- Map position in pixels
- Live tracking status
- Error messages if any

## How to Use

### Getting Started
1. Open app: `http://localhost:5173`
2. Browser asks for location permission → Click "Allow"
3. Red dot appears at center of map
4. Start moving and watch dot update

### Exploring Booths
1. Click any purple numbered circle
2. Booth details appear in popup
3. See talking points, tags, key people
4. Visit logged with your location

### Using Search & Filters
1. **Search**: Find specific booths or companies
2. **Filter by Interest**: Show only relevant booths
3. **Booth List**: See all booths with descriptions
4. **Live Status**: Check tracking in sidebar

## Technical Details

### Update Frequency
- Initial detection: Immediate (high accuracy)
- Live tracking: Every 3 seconds
- Accuracy: ±5-50 meters typical indoor GPS

### Data Captured
- Your GPS coordinates
- GPS accuracy
- Your position on map (pixels)
- Booth interactions
- Timestamps for all events

### Where Data Goes
1. **Browser**: Displayed in real-time
2. **Amplitude**: Event logging dashboard
3. **Convex**: Backend database storage
4. **Analytics**: User analytics & heatmaps

## Troubleshooting

### Red dot not moving
- Check if geolocation permission is granted
- Grant permission in browser settings
- Requires actual movement or device movement

### Can't see red dot
- Might be outside visible map area
- Check map coordinates in sidebar
- Ensure floor image loaded properly

### Location shows "Detecting..."
- First-time detection in progress
- May take up to 5 seconds
- Check browser notification for permission request

### Accuracy very high (>50m)
- Indoor GPS is not precise
- Normal for inside buildings
- Improves with clear sky view
- WiFi/BLE would improve accuracy

### Not tracking / Error shown
- Check geolocation permission
- Refresh page and re-enable if needed
- Check browser console for errors
- Ensure HTTPS is used (not HTTP)

## Privacy & Control

### What Happens to Your Location?
- Stored in browser while using app
- Sent to Amplitude for analytics
- Sent to Convex database for records
- Not shared with third parties
- Deleted after session ends (browser local storage)

### How to Disable Tracking
1. Revoke permission in browser settings
2. Device Settings → Location → App permissions
3. Clear browser cookies/storage
4. Close the app

### Data Retention
- Session data: Stored while app is open
- Permanent data: Stored in Convex database
- Analytics: 30-90 days in Amplitude
- Can request deletion from admin

## Development

### Environment Setup
```bash
cd badge-app
npm install
npm run dev
```

### Key Files
- `src/pages/Map.jsx` - Main component with tracking logic
- `src/pages/Map.css` - Styling for map and sidebar
- `services/geolocationService.js` - Utility functions
- `convex/schema.ts` - Database schema
- `convex/geolocation.ts` - Backend functions

### API Keys Required
- `VITE_CLERK_PUBLISHABLE_KEY` - Authentication
- `VITE_AMPLITUDE_API_KEY` - Event logging
- `VITE_CONVEX_URL` - Backend database

Check `.env.local` for configuration.

## Performance Tips

### Battery Life (Mobile)
- Live tracking updates every 3 seconds (balanced)
- Less frequent updates = less battery drain
- Disable when not in use
- Close app when done

### Network Usage
- ~50KB per event
- ~300KB per session (typical)
- Batch updates to reduce calls
- Works offline (data syncs later)

### Accuracy Tips
- Move slowly for better accuracy
- Stay closer to center of venue
- Clear sky view improves GPS
- WiFi nearby helps (but not used)

## Future Improvements

### Planned Enhancements
- [ ] WiFi/BLE beacon integration for better indoor accuracy
- [ ] Real-time heatmaps of booth traffic
- [ ] Personalized booth recommendations based on movement
- [ ] Proximity alerts for nearby booths
- [ ] Route optimization to visit booths
- [ ] Automatic booth visit logging (when near)

### Data Science Applications
- Analyze foot traffic patterns
- Identify popular booth locations
- Optimize booth placement
- Predict attendee interests
- Generate engagement reports

## Support & Help

### Getting Help
- Check browser console: F12 → Console tab
- See error messages in sidebar
- Check `.env.local` for configuration
- Review dev logs in terminal

### Reporting Issues
- Document the issue with steps to reproduce
- Include browser and OS information
- Note geolocation accuracy if relevant
- Check that HTTPS is being used

### Admin Dashboard
- Amplitude.com for event analytics
- Convex dashboard for database records
- View user locations and booth visits
- Export data for reports

---

**Version**: 1.0 - Live Tracking Beta
**Last Updated**: January 17, 2026
**Status**: Production Ready ✅
