# Real-Time Navigation Dashboard - React Component

A production-ready React component for real-time navigation with live GPS tracking, voice commands, and dynamic distance/ETA calculations.

## Features

✅ **Real-time GPS Tracking** - Uses Geolocation API for live position updates  
✅ **Live Speed Display** - Shows current speed in KM/H with averaging  
✅ **Dynamic Distance Calculation** - Updates remaining distance using Haversine formula  
✅ **ETA Calculation** - Estimates arrival time based on current speed  
✅ **Voice Commands** - Web Speech API integration for "Start Navigation", "Stop", etc.  
✅ **Interactive Map** - Leaflet.js integration for route visualization  
✅ **Heading/Bearing** - Displays current heading direction  
✅ **GPS Accuracy Display** - Shows current GPS accuracy radius  
✅ **Beautiful UI** - Modern overlay dashboard with glassmorphism design  
✅ **Responsive Controls** - Easy-to-use pause/stop/start buttons  

## Installation & Setup

### Prerequisites
- React 16.8+ (hooks support required)
- Leaflet.js library
- Node.js environment

### 1. Install Dependencies

```bash
npm install leaflet
npm install --save-dev @types/leaflet  # Optional: for TypeScript
```

### 2. Import in Your Project

```jsx
import RealTimeNavigationDashboard from './RealTimeNavigationDashboard';
import 'leaflet/dist/leaflet.css'; // Required!
```

### 3. Basic Usage

```jsx
function App() {
  const destination = {
    latitude: 51.5074,
    longitude: -0.1278,
    name: 'London, UK'
  };

  const route = [
    { latitude: 51.5145, longitude: -0.1234 },
    { latitude: 51.5100, longitude: -0.1270 },
    { latitude: 51.5074, longitude: -0.1278 }
  ];

  return (
    <RealTimeNavigationDashboard
      destination={destination}
      route={route}
      onNavigationStart={() => console.log('Started')}
      onNavigationEnd={() => console.log('Ended')}
    />
  );
}
```

## Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `destination` | Object | Yes | Object with `latitude` and `longitude` properties |
| `route` | Array | No | Array of waypoint objects with `latitude` and `longitude` |
| `onNavigationStart` | Function | No | Callback when navigation starts |
| `onNavigationEnd` | Function | No | Callback when navigation ends |

### Destination Object Format
```javascript
{
  latitude: number,      // -90 to 90
  longitude: number,     // -180 to 180
  name: string          // Optional display name
}
```

### Route Waypoint Format
```javascript
[
  {
    latitude: number,
    longitude: number,
    name: string        // Optional
  },
  // ... more waypoints
]
```

## API Reference

### Methods (via ref)

You can access component methods using a ref:

```jsx
const dashboardRef = useRef();

// Start navigation (same as clicking button)
dashboardRef.current?.startNavigation();

// Stop navigation
dashboardRef.current?.stopNavigation();

// Pause navigation (stop GPS tracking but keep state)
dashboardRef.current?.pauseNavigation();
```

## Display Metrics

### Speed (Top Left)
- Current speed in KM/H
- Updated in real-time from GPS
- Uses 10-point average for smoothing

### Distance (Top Center)
- **Distance**: Current remaining distance to destination
- **Total**: Full route distance

### ETA (Top Right)
- Time remaining to destination (e.g., "2h 15m")
- Estimated arrival time (24-hour format)
- Calculated based on average speed

### Accuracy & Heading (Bottom Right)
- **Accuracy**: Current GPS accuracy radius (±meters)
- **Heading**: Current direction in degrees (0-360°)

### Voice Commands (Right Side)
- Voice recognition status
- Last recognized command
- Tap to start/stop listening

### Status Indicator (Top Center)
- Green: ● Navigating
- Gray: ○ Ready (not navigating)

## Voice Commands Supported

Say any of these phrases:
- **Start Navigation** / **Start** - Begins GPS tracking
- **Stop Navigation** / **Stop** - Ends navigation session
- **Pause** - Pauses GPS tracking (can resume)
- **Resume** - Resumes paused navigation

> Note: Voice commands work best in a quiet environment. The API will recognize partial phrases.

## Browser Support & Permissions

### Required Permissions
1. **GPS/Geolocation** - Browser will prompt user for location access
2. **Microphone** (for voice commands) - Browser will prompt if using Web Speech API

### Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Geolocation API | ✅ | ✅ | ✅ | ✅ |
| Web Speech API | ✅ | ❌ | ⚠️ | ✅ |
| Leaflet.js | ✅ | ✅ | ✅ | ✅ |

> Note: Web Speech API has limited support. Fallback gracefully if unavailable.

## GPS Accuracy Tips

For best GPS accuracy:
- ✅ Use on a real device with GPS (not browser simulator)
- ✅ Ensure clear line of sight to sky (outdoor environments work best)
- ✅ Wait 30-60 seconds for GPS to establish strong signal
- ✅ Accuracy typically 5-20 meters, can vary by location
- ✅ Higher accuracy when moving vs. stationary

## Performance Considerations

### Geolocation Updates
- High accuracy mode enabled by default
- Maximum age: 0 (always fresh data)
- Timeout: 5 seconds per update

### Speed History
- Maintains 10-point history for averaging
- Prevents sudden speed spikes from affecting ETA
- Automatically cycles old data

### Map Rendering
- Uses Leaflet's efficient rendering
- Markers updated every GPS event
- Route cached after initial load

## Distance Calculation

The component uses the **Haversine formula** for accurate great-circle distance:

```
distance = 2R × arcsin(√(sin²(Δlat/2) + cos(lat₁) × cos(lat₂) × sin²(Δlon/2)))
```

Where:
- R = Earth's radius (6371 km)
- Δlat = difference in latitudes
- Δlon = difference in longitudes

This accounts for Earth's curvature and provides accurate distances.

## ETA Calculation

ETA is calculated as:

```
time_remaining = remaining_distance / average_speed
eta = current_time + time_remaining
```

The average speed is calculated from the last 10 GPS updates, smoothing out fluctuations.

## Styling Customization

All styles are defined in the `styles` object at the bottom of the component. You can customize:

```jsx
const styles = {
  topBar: { /* modify color, padding, etc */ },
  speedValue: { /* modify font size, color */ },
  button: { /* modify button styling */ },
  // ... etc
};
```

Or use CSS overrides:

```css
.custom-arrow-icon {
  filter: drop-shadow(0 0 2px rgba(74, 144, 226, 0.8));
}

[data-testid="navigation-dashboard"] .leaflet-marker-icon {
  filter: brightness(1.2);
}
```

## Error Handling

### GPS Not Available
If GPS access is denied or unavailable:
```
Alert: "Unable to access location. Please enable GPS and try again."
```

Solution:
1. Check browser permissions
2. Ensure HTTPS connection (required for Geolocation API)
3. Try a different browser
4. Use real device with GPS (not simulator)

### Web Speech Not Supported
If browser doesn't support Web Speech API:
```
Alert: "Speech Recognition not supported in this browser"
```

Solution:
- Use Chrome, Edge, or Safari 14.1+
- Fallback to manual button controls

## Advanced Usage

### Custom Event Handlers

```jsx
const handleNavStart = () => {
  console.log('Navigation started');
  // Send to analytics
  trackEvent('navigation_started');
  // Start audio guidance
  playAudio('navigation_started.mp3');
};

const handleNavEnd = () => {
  console.log('Navigation ended');
  // Log distance traveled
  // Update user stats
};

<RealTimeNavigationDashboard
  destination={destination}
  route={route}
  onNavigationStart={handleNavStart}
  onNavigationEnd={handleNavEnd}
/>
```

### Displaying Multiple Routes

```jsx
const [selectedRoute, setSelectedRoute] = useState(0);

const routes = [
  { name: 'Fastest', waypoints: [...] },
  { name: 'Shortest', waypoints: [...] },
  { name: 'Scenic', waypoints: [...] }
];

<RealTimeNavigationDashboard
  destination={destination}
  route={routes[selectedRoute].waypoints}
/>
```

### Integration with Routing APIs

```jsx
const getRoute = async (start, end) => {
  const response = await fetch(`/api/route`, {
    method: 'POST',
    body: JSON.stringify({ start, end })
  });
  const data = await response.json();
  setRoute(data.waypoints);
};
```

## Testing

### Manual Testing Checklist

- [ ] GPS permission requested and granted
- [ ] Current location displayed on map
- [ ] Speed updates in real-time
- [ ] Distance decreases as user moves
- [ ] ETA updates based on speed
- [ ] Voice commands recognized ("Start Navigation")
- [ ] Start/Pause/Stop buttons work
- [ ] Accuracy and heading displayed
- [ ] Route line visible on map
- [ ] Destination marker visible

### Testing on Device

For accurate GPS testing:
1. Use real mobile device or GPS simulator
2. Walk/drive along planned route
3. Monitor distance/ETA changes
4. Test voice commands in quiet environment

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Map not showing | Missing leaflet.css | Import `leaflet/dist/leaflet.css` |
| GPS not working | HTTPS not used | Use HTTPS connection |
| GPS slow to start | Cold start | Wait 30-60 seconds outdoors |
| Voice commands silent | Microphone denied | Check browser permissions |
| Wrong distance | GPS inaccuracy | Ensure clear sky view |
| Marker not moving | GPS updates stopped | Check browser console for errors |

## License

MIT License - Feel free to use in your projects

## Contributing

Found a bug or want to improve? Submit an issue or PR to the main repository.

---

**Last Updated**: May 2026  
**Component Version**: 1.0.0  
**React Hooks Required**: Yes (16.8+)
