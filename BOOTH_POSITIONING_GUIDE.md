# Booth Positioning Guide

## How to Position Booths on the Floor Map

### Understanding Coordinates

The floor image is displayed in a container, and booth positions are specified using **pixel coordinates relative to the floor image itself**, not the viewport.

- **x**: Horizontal position (0 = left edge, increases going right)
- **y**: Vertical position (0 = top edge, increases going down)

### Current Configuration

**Google Sponsor Booth**:
- Position: x=150px, y=200px
- This should align with a physical location on your floor plan image

### How to Find Booth Coordinates

1. **Open the floor image** (`/public/floor-map.jpg`) in an image editor or browser
2. **Identify booth locations** on the floor plan
3. **Measure pixel position** from the top-left corner:
   - Find where the booth dot should be
   - Count pixels from the left (x value)
   - Count pixels from the top (y value)

### Adding New Booths

Edit `/src/pages/Map.jsx` and add entries to the `FLOOR_MAP_BOOTHS` array:

```javascript
const FLOOR_MAP_BOOTHS = [
  {
    id: '1',
    name: 'Google Sponsor Booth',
    companyName: 'Google',
    description: '<to be filled later>',
    x: 150,
    y: 200,
    tags: ['AI/ML', 'Cloud', 'Web Dev'],
    talkingPoints: '<to be filled later>',
    keyPeople: [/* ... */],
  },
  // Add more booths here
  {
    id: '2',
    name: 'Company Name',
    companyName: 'Company',
    description: 'Description goes here',
    x: 300,    // Adjust based on floor image
    y: 150,    // Adjust based on floor image
    tags: ['Tag1', 'Tag2'],
    talkingPoints: 'What to discuss...',
    keyPeople: [
      {
        id: 'person_id',
        name: 'Person Name',
        role: 'Role Title',
        company: 'Company',
        bio: 'Brief bio',
        expertise: ['Skill1', 'Skill2'],
      },
    ],
  },
]
```

### Booth Data Structure

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | Yes | Unique identifier |
| `name` | string | Yes | Booth display name |
| `companyName` | string | Yes | Company name |
| `description` | string | Yes | Short description |
| `x` | number | Yes | X coordinate on floor image (pixels) |
| `y` | number | Yes | Y coordinate on floor image (pixels) |
| `tags` | string[] | Yes | Interest tags (AI/ML, Cloud, etc.) |
| `talkingPoints` | string | Yes | Suggested conversation topics |
| `keyPeople` | Person[] | Yes | Array of key personnel |

### Person Object Structure

```javascript
{
  id: 'unique_id',
  name: 'Full Name',
  role: 'Job Title',
  company: 'Company Name',
  bio: 'Brief biography',
  expertise: ['Skill1', 'Skill2', 'Skill3'],
}
```

### Tips for Accurate Positioning

1. **Use browser developer tools**:
   - Right-click on floor image → Inspect
   - Take note of displayed dimensions
   - Calculate proportional coordinates

2. **Be consistent**:
   - Use same measurement reference point
   - Mark all positions from top-left corner
   - Double-check X, Y values

3. **Test incrementally**:
   - Add one booth at a time
   - Verify position on map
   - Adjust x, y values if needed

4. **Consider clustering**:
   - Ensure booths don't overlap
   - Leave space between markers
   - Account for hover effects (48px diameter when selected)

### Verification Steps

After adding booths:

1. Start the dev server: `npm run dev`
2. Navigate to the map page
3. Verify each booth appears at the correct location
4. Click each booth to confirm popup displays correctly
5. Check that tooltips show proper names on hover

### Example Floor Image Measurements

If your floor image is 1200×800 pixels:
- **Top-left booth**: x=50, y=50
- **Center booth**: x=600, y=400
- **Bottom-right booth**: x=1150, y=750

Adjust based on your actual floor image dimensions and desired booth placements.

## Viewing Current Booth Positions

The map displays:
- 📍 Colored circular markers at specified x,y coordinates
- 🏷️ Numbered badges (1, 2, 3, etc.)
- 🎯 Blue pulse indicating user's location (top-right)
- 💬 Tooltips showing booth names on hover

## Coordinates System Reference

```
(0,0) ─────────────────→ x (width)
│
│    Booth positions
│    specified as
│    (x, y) pixels
│
↓ y (height)
```

The origin (0,0) is at the **top-left corner** of the floor image.

