# Booth Layout Diagram - 75m × 75m Room

## Map Layout (ASCII Visualization)

```
┌─────────────────────────────────────────────────────────┐
│                     MAP CANVAS (100% × 100%)            │
│                                                          │
│    ┌─────────────────────────────────────────────┐      │
│    │           VENUE FLOOR PLAN (75m × 75m)      │      │
│    │           [12.5% - 87.5% bounds]             │      │
│    │                                              │      │
│    │  🔵 GOOGLE (20%, 20%)                       │      │
│    │  #4285F4 (Blue)                            │      │
│    │  "AI/ML, Cloud, Web Dev"                   │      │
│    │         ↓ 42.4m                            │      │
│    │                                              │      │
│    │              ● USER (50%, 50%)              │      │
│    │              Red Pulsing Dot                │      │
│    │              Real-time Position            │      │
│    │                                              │      │
│    │         ↓ 42.4m                            │      │
│    │  🟪 AMPLITUDE (20%, 80%)                   │      │
│    │  #7B68EE (Purple)                          │      │
│    │  "Analytics, Data Science, Product"       │      │
│    │                                              │      │
│    └─────────────────────────────────────────────┘      │
│                  ↑              ↑                         │
│                42.4m           42.4m                     │
│                                                          │
│    🟩 SHOPIFY (80%, 20%)      🟧 FORESTERS (80%, 80%)   │
│    #96BE28 (Green)            #FF6B35 (Orange)         │
│    "E-Commerce"               "Finance, Insurance"      │
│                                                          │
└─────────────────────────────────────────────────────────┘

        Coordinates (as percentages of full map):
        Map Range: 0% - 100% (both X and Y)
        Room Range: 12.5% - 87.5% (bounded area)
```

## Detailed Booth Positions

### Google (Top-Left)
```
Position: (20%, 20%)
Color: Blue (#4285F4)
Tags: AI/ML, Cloud, Web Dev
Distance from Center: ~42.4m
Distance from Shopify: ~42.4m
Distance from Amplitude: ~42.4m
Distance from Foresters: ~59.9m (diagonal)
```

### Shopify (Top-Right)
```
Position: (80%, 20%)
Color: Green (#96BE28)
Tags: E-Commerce, Web Dev, Payments
Distance from Center: ~42.4m
Distance from Google: ~42.4m
Distance from Foresters: ~42.4m
Distance from Amplitude: ~59.9m (diagonal)
```

### Amplitude (Bottom-Left)
```
Position: (20%, 80%)
Color: Purple (#7B68EE)
Tags: Analytics, Data Science, Product
Distance from Center: ~42.4m
Distance from Google: ~42.4m
Distance from Foresters: ~42.4m
Distance from Shopify: ~59.9m (diagonal)
```

### Foresters Financial (Bottom-Right)
```
Position: (80%, 80%)
Color: Orange (#FF6B35)
Tags: Finance, Insurance, Actuarial
Distance from Center: ~42.4m
Distance from Shopify: ~42.4m
Distance from Amplitude: ~42.4m
Distance from Google: ~59.9m (diagonal)
```

## Distance Matrix (in meters)

```
                Google    Shopify   Amplitude  Foresters
Google            0        42.4       42.4       59.9
Shopify          42.4       0         59.9       42.4
Amplitude        42.4      59.9        0         42.4
Foresters        59.9      42.4       42.4        0
Center (User)    42.4      42.4       42.4       42.4
```

## Room Dimensions

```
┌──────────────────────────────────────┐
│         Total Room: 75m × 75m        │
│                                      │
│  Bounds: [12.5% - 87.5%] on both    │
│  axes, which equals:                 │
│                                      │
│  Width Usable: 75% of map × 75m     │
│             = 0.75 × 75m = 56.25m   │
│                                      │
│  Height Usable: 75% of map × 75m    │
│              = 0.75 × 75m = 56.25m  │
│                                      │
│  This centers in a 75m × 75m space  │
│                                      │
│  Left Margin: 12.5% × 75m = 9.375m  │
│  Right Margin: 12.5% × 75m = 9.375m │
│  Top Margin: 12.5% × 75m = 9.375m   │
│  Bottom Margin: 12.5% × 75m = 9.375m│
│                                      │
└──────────────────────────────────────┘
```

## Booth Spacing Distribution

```
Horizontal Spacing:
┌─────────────┬──────────────┬─────────────┐
│  Google     │    Center    │   Shopify   │
│  (20%)      │    (50%)     │   (80%)     │
└─────────────┴──────────────┴─────────────┘
     ←─ 30% ─→      ←─ 30% ─→

On actual room (~56m):
Google at: 20% = 14.2m from left edge
Center at: 50% = 28.1m from left edge
Shopify at: 80% = 42m from left edge
Total: ~27.8m between booths


Vertical Spacing:
    Google
      (20%)
       ↕
    ~42.4m
       ↕
    Center
      (50%)
       ↕
    ~42.4m
       ↕
    Amplitude
      (80%)
```

## Map Coordinate System

```
(0%, 0%) ─────────────────────── (100%, 0%)
   │                                │
   │  (12.5%, 12.5%) ┌──────────┐  │
   │                 │          │  │
   │  ┌─── Google    │          │  │
   │  │              │          │  │
   │  └─ (20%, 20%)  │  ROOM    │  │
   │                 │          │  │
   │      (50%,      │  BOUNDS  │  │
   │       50%)      │          │  │
   │        ●        │          │  │
   │                 │          │  │
   │   (20%, 80%)    │          │  │
   │   └─ Amplitude  │          │  │
   │                 │          │  │
   │                 └──────────┘  │
   │            (87.5%, 87.5%)     │
   │                                │
(0%, 100%) ─────────────────────── (100%, 100%)
```

## Live Tracking Red Dot Path

### Example: User Walking from Google → Shopify

```
Step 1: At Google Booth (20%, 20%)
┌──────────────────────────────────┐
│                                  │
│  ● (RED DOT)  →  →  →           │
│  Google              Shopify     │
│                                  │
└──────────────────────────────────┘

Step 2: Halfway Between (50%, 20%)
┌──────────────────────────────────┐
│                                  │
│  Google  →  ● (RED DOT)  →  Shopify
│                                  │
└──────────────────────────────────┘

Step 3: At Shopify Booth (80%, 20%)
┌──────────────────────────────────┐
│                                  │
│  Google  →  →  →  ● (RED DOT)    │
│                  Shopify         │
│                                  │
└──────────────────────────────────┘
```

## Distance Visualization

### From Center (50%, 50%)

```
             North
              ↑
              │
              │ 30%
              │
    Google ← ─┼─ → Shopify
    (20%)     │     (80%)
              │ Center (50%, 50%)
              │ RED DOT: ●
              │
              │
              ↓
              South
              
Southwest ← Center → Northeast
41.2m      (50%, 50%)  41.2m

Each quadrant from center:
 NW: Google (42.4m)
 NE: Shopify (42.4m)
 SW: Amplitude (42.4m)
 SE: Foresters (42.4m)
```

## Meter-to-Pixel Conversion Reference

```
Distance on Map (%)  │  Distance in Room (m)  │  Notes
─────────────────────┼────────────────────────┼─────────────
0.5% (±distance)     │  ±0.5m                 │ Very close
5%                   │  ~5m                   │ Close
10%                  │  ~10m                  │ Nearby
20%                  │  ~20m                  │ Across room
30%                  │  ~30m                  │ Far side
42.4%                │  ~42.4m                │ Corner distance
50%                  │  ~50m                  │ Half room
75%                  │  ~75m                  │ Full room
```

## Real-Time Update Visualization

```
Time: 0ms        Time: 500ms       Time: 1000ms
    ●    →          ●    →           ●
  (50%, 50%)     (50.5%, 49.5%)   (51%, 49%)
  
Updates every 500ms as GPS fixes arrive
Smooth CSS transitions between positions
```

## Color Reference

| Booth | Hex | RGB | Color Name |
|-------|-----|-----|-----------|
| Google | #4285F4 | (66, 133, 244) | Bright Blue |
| Shopify | #96BE28 | (150, 190, 40) | Lime Green |
| Amplitude | #7B68EE | (123, 104, 238) | Medium Purple |
| Foresters | #FF6B35 | (255, 107, 53) | Burnt Orange |
| User (Red Dot) | #ff6b6b | (255, 107, 107) | Vibrant Red |

---

## Summary

✅ **4 Booths** evenly distributed in quadrants
✅ **75m × 75m** room for realistic spacing
✅ **42.4m average** distance from center to each booth
✅ **Real-time red dot** showing live user position
✅ **Dynamic distance** updates as user moves
✅ **Bounded area** constrains user within room limits
✅ **Smooth animations** for continuous tracking

The venue layout is now optimized for natural exploration and real-time engagement! 🎯
