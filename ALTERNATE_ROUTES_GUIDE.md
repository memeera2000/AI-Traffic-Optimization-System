# Alternate Routes Feature Guide

## Overview
Your Route Finder application now features an enhanced **Alternate Routes** system that intelligently calculates and displays multiple routing options for every journey, helping users choose the best path based on their preferences.

## Key Features

### 1. **Multiple Route Calculations**
- **Automatic Generation**: The system calculates up to 3+ alternate routes for every search
- **Multi-Mode Support**: Routes are calculated for:
  - 🚗 **Driving** (default)
  - 🚶 **Walking**
  - 🚴 **Cycling**
- **API Integration**: Uses OSRM (Open Source Routing Machine) with the `alternatives=3` parameter

### 2. **Visual Display**
- **Color-Coded Routes**: Each route has a distinct color on the map:
  - Route 1 (Recommended): **Cyan** (#00d4ff) - Active/Thicker line
  - Route 2: **Orange** (#ffba00)
  - Route 3: **Green** (#00ff88)
  - Route 4+: **Purple** & **Red** variants
- **Visual Hierarchy**:
  - Active route: Bold, full opacity, smooth lines
  - Alternate routes: Thinner, semi-transparent, dashed pattern
  - Hover effect: Routes highlight when you hover on them
- **Interactive Elements**:
  - Click any route on the map to select it
  - Click route cards in the panel to switch between them
  - Popups show route info on hover

### 3. **Route Comparison Panel**
Located in the results card, the Alternative Routes panel shows:

```
Route 1 ⭐ Recommended
12.5 km · 18 min · 🟢 Light Traffic

Route 2 🔀 Alternate
14.2 km · 22 min +22% time · 🟡 Moderate

Route 3 🔀 Alternate
13.8 km · 20 min +11% time · 🟡 Moderate
```

Each route displays:
- **Distance**: Total route length
- **Time**: Estimated travel time
- **Comparison**: Percentage difference from fastest route
- **Traffic Status**: Real-time traffic conditions
- **Tags**: Indicators like "Fastest", "Shortest", "Alternative"

### 4. **Smart Route Generation**

The system ensures you always have meaningful choices:

#### If Multiple Routes Found (from API):
```
✅ All API routes are preserved and displayed
   - Different actual paths through the city/area
   - Various traffic conditions considered
```

#### If Single Route Found:
```
⚠️ Intelligent alternatives are generated:
   - Route 1: Original (Fastest via direct path)
   - Route 2: +12% distance, -7% time per km
   - Route 3: +28% distance, -12% time per km
```

### 5. **Traffic-Aware Routing**
- **Real-time Updates**: Traffic conditions update every 15 seconds
- **Route Scoring**: Routes prioritized by:
  1. Traffic level (free > moderate > heavy)
  2. Travel time (fastest preferred)
- **Visual Feedback**: Route lines change based on traffic:
  - 🟢 Green: Free flowing (>50 km/h)
  - 🟡 Orange: Moderate (25-50 km/h)
  - 🔴 Red: Heavy (< 25 km/h)

## How to Use

### Finding Alternate Routes
1. Enter start and destination locations
2. Click "Find Route"
3. The system calculates multiple routes automatically
4. All alternate routes appear in the results panel

### Switching Between Routes
**Method 1: Click on Map**
- Click any route line on the map
- The route becomes active and displays in cyan

**Method 2: Click Route Card**
- Click any route card in the Alternative Routes panel
- Route details update immediately
- Map refocuses on the selected route

**Method 3: Keyboard (Optional)**
- Arrow keys to navigate between routes
- Enter to select

### Comparing Routes
Use the comparison information shown for each route:
- Compare distances
- Compare travel times
- Check traffic conditions
- Make informed decisions

### Transportation Mode Switching
While viewing routes, switch between transportation modes:
1. Look for mode selector (🚗 🚶 🚴) in the results panel
2. Click to switch modes
3. All alternate routes recalculate for new mode
4. Traffic and times update accordingly

## Route Selection Logic

### Recommended Route (Route 1)
Selected based on:
1. **Lowest traffic score**: Free > Moderate > Heavy
2. **Fastest travel time**: Secondary factor
3. **Marked with**: ⭐ Recommended badge

### Fastest Route
- Minimum travel time among all alternatives
- Tagged with: ⚡ Fastest badge

### Shortest Route
- Minimum distance among all alternatives
- Tagged with: 📍 Shortest badge

## Technical Details

### API Requests
```
URL: https://router.project-osrm.org/route/v1/driving/{lon},{lat};{lon},{lat}
Parameters:
  - overview=full      (Include full geometry)
  - geometries=geojson (Return GeoJSON format)
  - alternatives=3     (Return up to 3 alternative routes)
  - steps=true         (Include turn-by-turn steps)
```

### Route Data Structure
```javascript
{
  distance: 12500,           // meters
  duration: 1080,            // seconds
  geometry: {
    type: 'LineString',
    coordinates: [[lon, lat], ...]
  },
  isBest: true,              // Marked as recommended
  routeType: 'standard',     // or 'alternative'
  label: 'Faster Route'      // Optional label
}
```

### Performance Optimizations
- Routes cached during a session
- Traffic updates don't recalculate paths
- Map rendering optimized for multiple polylines
- Lazy loading of route details

## Color Scheme

| Route | Color | Usage |
|-------|-------|-------|
| Active Route | #00d4ff (Cyan) | Currently selected route |
| Route 2 | #ffba00 (Orange) | First alternate |
| Route 3 | #00ff88 (Green) | Second alternate |
| Route 4 | #a78bfa (Purple) | Third alternate |
| Route 5+ | #f87171 (Red) | Additional alternates |

## Troubleshooting

### Issue: No alternate routes showing
**Solution**: The routing API may have returned only one route. The system automatically generates 2 additional alternatives.

### Issue: Routes overlap on map
**Solution**: This is normal for similar paths. Zoom in to see individual routes better. Click routes in the panel to isolate them.

### Issue: Route doesn't update when clicked
**Solution**: 
- Ensure you clicked directly on the route card or line
- Check browser console for any errors
- Refresh the page and try again

### Issue: Traffic information not updating
**Solution**: 
- Traffic updates every 15 seconds
- Open the Traffic Dashboard to see live updates
- Check internet connection

## Advanced Features

### Route Customization
Routes can be modified by:
1. Dragging waypoints on the map (future feature)
2. Adding intermediate stops (future feature)
3. Selecting road preferences (highways vs. local roads)

### Route Persistence
- Current route persists during session
- Switching modes keeps the same general route available
- Clear all routes by starting a new search

### Export Routes
Future features may include:
- Export route as GPX
- Share route via URL
- Save favorite routes
- Download turn-by-turn directions

## Tips & Tricks

### For Daily Commute
1. Check all routes during off-peak hours
2. Compare and save your preferred routes
3. Review in morning before commute

### For Road Trips
1. Use alternate routes to avoid monotony
2. Check traffic updates before switching
3. Use "Scenic Route" options when available

### For Navigation
1. **First time path**: Use recommended route (Route 1)
2. **Running late**: Check "Fastest" route (may have updates)
3. **Explore**: Try alternate routes to discover new paths

## System Architecture

```
User Input (Start/End)
        ↓
Location Search (Geocoding)
        ↓
Route Calculation (OSRM API × 3 modes)
        ↓
Route Enhancement (Generate alternatives if needed)
        ↓
Traffic Analysis (Real-time conditions)
        ↓
Display (Map + Panel)
        ↓
User Selection → Active Route
        ↓
Navigation/Display
```

## Performance Notes

- **Route Calculation**: 2-5 seconds per mode
- **Map Rendering**: Handles up to 5 routes smoothly
- **Traffic Updates**: Every 15 seconds (configurable)
- **UI Responsiveness**: Instant feedback on route clicks

## Future Enhancements

Planned features for alternate routes:
- [ ] Machine learning route prediction
- [ ] Historical traffic patterns
- [ ] User preference learning
- [ ] Toll road options
- [ ] Eco-friendly routing
- [ ] Scenic route scoring
- [ ] Route bookmarking
- [ ] Collaborative routing (shared routes)
- [ ] Voice-guided alternate route prompts
- [ ] Real-time rerouting

## Support & Feedback

For issues or suggestions:
1. Check this guide first
2. Review browser console for errors
3. Test with different locations
4. Report via GitHub issues

---

**Last Updated**: 2026-05-07  
**Version**: 2.0 - Alternate Routes Feature  
**Status**: Active & Maintained
