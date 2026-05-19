import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * RealTimeNavigationDashboard Component
 * 
 * A real-time navigation dashboard that tracks user movement and displays live speed/distance/ETA.
 * 
 * Features:
 * - Bottom Dashboard: 4 live stats (Distance, Time, Speed, Destination)
 * - Live GPS Movement: Real-time marker position updates
 * - Dynamic Data: Auto-updates as user moves
 * - Speedometer: Real-time km/h calculation
 * - Auto-Route: Generate route when location added
 */
const RealTimeNavigationDashboard = ({ 
  destination = null, 
  route = null,
  onNavigationStart = null,
  onNavigationEnd = null,
  onLocationAdded = null,
  autoGenerateRoute = true
}) => {
  // Refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const watchIdRef = useRef(null);
  const routeLayerRef = useRef(null);
  const positionMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const speedHistoryRef = useRef([]);
  const previousPositionRef = useRef(null);
  const previousTimeRef = useRef(null);
  const distanceTraveledRef = useRef(0);

  // State
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [eta, setEta] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [heading, setHeading] = useState(null);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [generatedRoute, setGeneratedRoute] = useState(route);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current).setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  // Auto-generate route when destination is set
  useEffect(() => {
    if (autoGenerateRoute && destination && !route) {
      // Generate route from current location to destination
      generateAutoRoute();
    } else if (route) {
      setGeneratedRoute(route);
    }
  }, [destination, route, autoGenerateRoute]);

  // Generate automatic route
  const generateAutoRoute = useCallback(() => {
    // Get current user position first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const startPoint = { latitude, longitude };
        
        // Generate intermediate waypoints for route
        const waypoints = generateRouteWaypoints(startPoint, destination);
        setGeneratedRoute(waypoints);

        if (onLocationAdded) {
          onLocationAdded(waypoints);
        }
      });
    }
  }, [destination, onLocationAdded]);

  // Generate waypoints between start and destination
  const generateRouteWaypoints = (start, end, numWaypoints = 15) => {
    const waypoints = [start];

    for (let i = 1; i < numWaypoints - 1; i++) {
      const progress = i / (numWaypoints - 1);
      const latitude = start.latitude + (end.latitude - start.latitude) * progress;
      const longitude = start.longitude + (end.longitude - start.longitude) * progress;

      // Add slight random deviation for realistic route
      const deviation = 0.0005;
      waypoints.push({
        latitude: latitude + (Math.random() - 0.5) * deviation,
        longitude: longitude + (Math.random() - 0.5) * deviation,
      });
    }

    waypoints.push(end);
    return waypoints;
  };

  // Start navigation
  const startNavigation = useCallback(async () => {
    if (!destination) {
      alert('Please set a destination first');
      return;
    }

    setIsNavigating(true);
    setStartTime(Date.now());
    previousPositionRef.current = null;
    previousTimeRef.current = null;
    distanceTraveledRef.current = 0;
    
    if (onNavigationStart) {
      onNavigationStart();
    }

    // Request geolocation permission
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, accuracy: acc, heading: h } = position.coords;
        const currentTime = Date.now();
        
        setCurrentPosition({ latitude, longitude });
        setAccuracy(acc);
        setHeading(h);

        // Calculate real-time speed using distance/time gap between coordinates
        let calculatedSpeed = 0;
        if (previousPositionRef.current && previousTimeRef.current) {
          const timeDiffSeconds = (currentTime - previousTimeRef.current) / 1000;
          const distanceDiff = haversineDistance(
            previousPositionRef.current.latitude,
            previousPositionRef.current.longitude,
            latitude,
            longitude
          );
          
          // Convert to km/h
          calculatedSpeed = (distanceDiff / (timeDiffSeconds / 3600));
          distanceTraveledRef.current += distanceDiff;
          setDistanceTraveled(parseFloat(distanceTraveledRef.current.toFixed(2)));
        }

        // Use calculated speed, fall back to GPS speed if available
        const speedKmh = calculatedSpeed > 0 ? calculatedSpeed : ((speed || 0) * 3.6);
        setCurrentSpeed(parseFloat(speedKmh.toFixed(2)));

        // Add to speed history for averaging
        speedHistoryRef.current.push(speedKmh);
        if (speedHistoryRef.current.length > 10) {
          speedHistoryRef.current.shift();
        }

        // Store previous position and time for next calculation
        previousPositionRef.current = { latitude, longitude };
        previousTimeRef.current = currentTime;

        // Update map center and marker
        updateMapPosition(latitude, longitude, heading);

        // Calculate remaining distance and ETA
        if (destination) {
          calculateRemainingDistance(latitude, longitude);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to access location. Please enable GPS and try again.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );
  }, [destination, onNavigationStart]);

  // Stop navigation
  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setCurrentSpeed(0);
    setRemainingDistance(0);
    setEta(null);
    setDistanceTraveled(0);
    speedHistoryRef.current = [];
    previousPositionRef.current = null;
    previousTimeRef.current = null;
    distanceTraveledRef.current = 0;

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (onNavigationEnd) {
      onNavigationEnd();
    }
  }, [onNavigationEnd]);

  // Pause navigation (stop tracking but keep state)
  const pauseNavigation = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Calculate remaining distance using Haversine formula
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate remaining distance and ETA
  const calculateRemainingDistance = (currentLat, currentLon) => {
    const distance = haversineDistance(
      currentLat,
      currentLon,
      destination.latitude,
      destination.longitude
    );

    setRemainingDistance(parseFloat(distance.toFixed(2)));

    // Calculate ETA based on average speed
    if (speedHistoryRef.current.length > 0) {
      const avgSpeed =
        speedHistoryRef.current.reduce((a, b) => a + b) /
        speedHistoryRef.current.length;

      if (avgSpeed > 0.5) {
        // Only calculate ETA if moving
        const timeRemainingHours = distance / avgSpeed;
        const now = new Date();
        const eta = new Date(now.getTime() + timeRemainingHours * 60 * 60 * 1000);
        setEta(eta);
      }
    }
  };

  // Update map position and marker
  const updateMapPosition = (latitude, longitude, bearing) => {
    if (!mapInstanceRef.current) return;

    // Remove old marker
    if (positionMarkerRef.current) {
      mapInstanceRef.current.removeLayer(positionMarkerRef.current);
    }

    // Create custom arrow icon for bearing
    const arrowIcon = L.divIcon({
      html: `<div style="transform: rotate(${bearing || 0}deg); width: 40px; height: 40px; background: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2218%22 fill=%22%234A90E2%22 stroke=%22white%22 stroke-width=%222%22/><polygon points=%2220,6 28,28 20,24 12,28%22 fill=%22white%22/></svg>') center/contain no-repeat;">
      </div>`,
      iconSize: [40, 40],
      className: 'custom-arrow-icon',
    });

    // Add new marker
    positionMarkerRef.current = L.marker([latitude, longitude], {
      icon: arrowIcon,
      zIndexOffset: 1000,
    }).addTo(mapInstanceRef.current);

    // Center map on current position
    mapInstanceRef.current.setView([latitude, longitude], 16);
  };

  // Render route on map
  useEffect(() => {
    if (!mapInstanceRef.current || !generatedRoute) return;

    // Remove old route layer
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
    }

    // Draw route
    const routeCoordinates = generatedRoute.map((point) => [point.latitude, point.longitude]);
    routeLayerRef.current = L.polyline(routeCoordinates, {
      color: '#FF6B6B',
      weight: 4,
      opacity: 0.7,
      dashArray: '5, 5',
    }).addTo(mapInstanceRef.current);

    // Calculate total distance
    let totalDist = 0;
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      totalDist += haversineDistance(
        routeCoordinates[i][0],
        routeCoordinates[i][1],
        routeCoordinates[i + 1][0],
        routeCoordinates[i + 1][1]
      );
    }
    setTotalDistance(parseFloat(totalDist.toFixed(2)));
  }, [generatedRoute]);

  // Render destination marker
  useEffect(() => {
    if (!mapInstanceRef.current || !destination) return;

    // Remove old destination marker
    if (destinationMarkerRef.current) {
      mapInstanceRef.current.removeLayer(destinationMarkerRef.current);
    }

    // Add destination marker
    destinationMarkerRef.current = L.marker(
      [destination.latitude, destination.longitude],
      {
        icon: L.icon({
          iconUrl:
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%23E74C3C" stroke="white" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="white"/></svg>',
          iconSize: [32, 32],
        }),
      }
    ).addTo(mapInstanceRef.current);
  }, [destination]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Format time for ETA
  const formatTime = (date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format remaining time
  const formatRemainingTime = (date) => {
    if (!date) return '--';
    const now = new Date();
    const diffMs = date - now;
    const diffMins = Math.max(0, Math.round(diffMs / 60000));
    if (diffMins < 60) {
      return `${diffMins}m`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

 return (
    <div style={styles.container}>
      {/* 1. Map Background */}
      <div id="map" style={styles.map}></div>

      {/* 2. Top Status Indicator (Navigating / Ready) */}
      <div style={{
        ...styles.statusIndicator,
        ...(isNavigating ? styles.statusActive : styles.statusInactive)
      }}>
        {isNavigating ? '● Navigating' : '○ Ready'}
      </div>

      {/* 3. Bottom Dashboard - The 4 Live Stats */}
      <div style={styles.dashboardWrapper}>
        <div style={styles.dashboardContainer}>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>Distance</span>
            <span style={styles.statValue}>{remainingDistance.toFixed(2)}</span>
            <span style={styles.statUnit}>KM</span>
          </div>

          <div style={styles.statBox}>
            <span style={styles.statLabel}>Time Left</span>
            <span style={styles.statValue}>{formatTimeRemaining(eta)}</span>
            <span style={styles.statUnit}>ETA: {formatETATime(eta)}</span>
          </div>

          <div style={styles.statBox}>
            <span style={styles.statLabel}>Speed</span>
            <span style={styles.statValue}>{currentSpeed.toFixed(1)}</span>
            <span style={styles.statUnit}>KM/H</span>
          </div>

          <div style={styles.statBox}>
            <span style={styles.statLabel}>Destination</span>
            <span style={styles.statValue}>{destination?.name || 'Target'}</span>
            <span style={styles.statUnit}>{distanceTraveled.toFixed(1)} km trv</span>
          </div>
        </div>

        {/* 4. Accuracy and Heading Metadata */}
        <div style={styles.gpsInfo}>
          <div style={styles.gpsText}>📍 Accuracy: ±{Math.round(accuracy)}m</div>
          <div style={styles.gpsText}>🧭 Heading: {Math.round(heading)}°</div>
        </div>

        {/* 5. Manual Control Buttons */}
        <div style={styles.controlsBelow}>
          {!isNavigating ? (
            <button onClick={startNavigation} style={styles.button}>
              ▶ Start Navigation
            </button>
          ) : (
            <>
              <button onClick={pauseNavigation} style={styles.button}>
                ⏸ Pause
              </button>
              <button 
                onClick={stopNavigation} 
                style={{...styles.button, backgroundColor: '#EF4444'}}
              >
                ⏹ Stop
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

// Styles
const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    fontFamily: 'Arial, sans-serif',
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 100,
  },
  bottomDashboard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '20px',
    pointerEvents: 'auto',
    backgroundImage: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)',
    paddingTop: '40px',
    minHeight: '280px',
  },
  dashboardContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    width: '100%',
    maxWidth: '900px',
    marginBottom: '20px',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.2s ease',
  },
  statLabel: {
    fontSize: '12px',
    color: '#A0AEC0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#4A90E2',
    lineHeight: '1',
    marginBottom: '4px',
  },
  statUnit: {
    fontSize: '11px',
    color: '#718096',
  },
  controlsBelow: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '12px',
    pointerEvents: 'auto',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s ease',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '#6B7280',
  },
  gpsInfo: {
    position: 'absolute',
    bottom: 70,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '24px',
    fontSize: '12px',
    color: '#A0AEC0',
    textAlign: 'center',
    pointerEvents: 'auto',
  },
  gpsText: {
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: '6px',
    backdropFilter: 'blur(10px)',
  },
  statusIndicator: {
    position: 'absolute',
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    pointerEvents: 'auto',
  },
  statusActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    color: 'white',
  },
  statusInactive: {
    backgroundColor: 'rgba(107, 114, 128, 0.9)',
    color: '#E5E7EB',
  },
};
voiceContainer: {
    display: 'none';       // This forces it to be invisible
    visibility: 'hidden';
    pointerEvents: 'none';
  }
  voiceButton: {
    display: 'none';
  }

export default RealTimeNavigationDashboard;}

