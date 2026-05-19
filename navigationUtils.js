/**
 * Navigation Utilities
 * 
 * Helper functions for distance calculations, ETA, mock location data,
 * and other navigation-related utilities
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Starting latitude
 * @param {number} lon1 - Starting longitude
 * @param {number} lat2 - Ending latitude
 * @param {number} lon2 - Ending longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
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

/**
 * Calculate total distance for a route
 * @param {Array} waypoints - Array of {latitude, longitude} objects
 * @returns {number} Total distance in kilometers
 */
export const calculateTotalDistance = (waypoints) => {
  if (!waypoints || waypoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const current = waypoints[i];
    const next = waypoints[i + 1];
    totalDistance += calculateDistance(
      current.latitude,
      current.longitude,
      next.latitude,
      next.longitude
    );
  }
  return totalDistance;
};

/**
 * Calculate ETA given current speed and remaining distance
 * @param {number} remainingDistance - Distance in kilometers
 * @param {number} averageSpeed - Speed in km/h
 * @returns {Date} Estimated arrival time
 */
export const calculateETA = (remainingDistance, averageSpeed) => {
  if (averageSpeed <= 0 || remainingDistance <= 0) return null;

  const timeRemainingHours = remainingDistance / averageSpeed;
  const now = new Date();
  return new Date(now.getTime() + timeRemainingHours * 60 * 60 * 1000);
};

/**
 * Format time remaining (e.g., "2h 30m")
 * @param {Date} etaDate - ETA date
 * @returns {string} Formatted time string
 */
export const formatTimeRemaining = (etaDate) => {
  if (!etaDate) return '--';
  const now = new Date();
  const diffMs = etaDate - now;

  if (diffMs <= 0) return 'Arrived';

  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins}m`;
  }

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
};

/**
 * Format ETA as time string (e.g., "14:30")
 * @param {Date} etaDate - ETA date
 * @returns {string} Formatted time
 */
export const formatETATime = (etaDate) => {
  if (!etaDate) return '--:--';
  return etaDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Convert meters per second to kilometers per hour
 * @param {number} mps - Speed in m/s (from GPS)
 * @returns {number} Speed in km/h
 */
export const mpsToKmh = (mps) => {
  return (mps || 0) * 3.6;
};

/**
 * Convert kilometers per hour to meters per second
 * @param {number} kmh - Speed in km/h
 * @returns {number} Speed in m/s
 */
export const kmhToMps = (kmh) => {
  return (kmh || 0) / 3.6;
};

/**
 * Calculate bearing (heading) between two coordinates
 * @param {number} lat1 - Starting latitude
 * @param {number} lon1 - Starting longitude
 * @param {number} lat2 - Ending latitude
 * @param {number} lon2 - Ending longitude
 * @returns {number} Bearing in degrees (0-360)
 */
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
};

/**
 * Get cardinal direction from bearing (e.g., "NE", "SSW")
 * @param {number} bearing - Bearing in degrees
 * @returns {string} Cardinal direction
 */
export const getBearingDirection = (bearing) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
};

/**
 * Smooth speed values using moving average
 * @param {Array} speeds - Array of speed values
 * @param {number} windowSize - Size of moving average window
 * @returns {number} Smoothed speed
 */
export const smoothSpeed = (speeds, windowSize = 10) => {
  if (!speeds || speeds.length === 0) return 0;

  const window = speeds.slice(-windowSize);
  const average = window.reduce((sum, speed) => sum + speed, 0) / window.length;
  return parseFloat(average.toFixed(2));
};

/**
 * Check if user is moving (speed above threshold)
 * @param {number} speed - Current speed in km/h
 * @param {number} threshold - Minimum speed to consider as moving (default 0.5 km/h)
 * @returns {boolean} Whether user is moving
 */
export const isMoving = (speed, threshold = 0.5) => {
  return speed >= threshold;
};

/**
 * Generate mock route for testing
 * @param {Object} start - Starting point {latitude, longitude}
 * @param {Object} end - Ending point {latitude, longitude}
 * @param {number} points - Number of waypoints to generate
 * @returns {Array} Array of waypoints
 */
export const generateMockRoute = (start, end, points = 10) => {
  const route = [start];

  for (let i = 1; i < points - 1; i++) {
    const progress = i / (points - 1);
    const latitude = start.latitude + (end.latitude - start.latitude) * progress;
    const longitude = start.longitude + (end.longitude - start.longitude) * progress;

    // Add slight random deviation for realism
    const deviation = 0.001;
    route.push({
      latitude: latitude + (Math.random() - 0.5) * deviation,
      longitude: longitude + (Math.random() - 0.5) * deviation,
    });
  }

  route.push(end);
  return route;
};

/**
 * Simulate GPS position along a route
 * @param {Array} route - Array of waypoints
 * @param {number} progress - Progress along route (0-1)
 * @returns {Object} Interpolated position {latitude, longitude}
 */
export const getPositionAlongRoute = (route, progress) => {
  if (!route || route.length < 2) return route?.[0] || { latitude: 0, longitude: 0 };

  progress = Math.max(0, Math.min(1, progress));

  // Find which segment the progress point is on
  const totalDistance = calculateTotalDistance(route);
  const targetDistance = totalDistance * progress;

  let currentDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const segmentDistance = calculateDistance(
      route[i].latitude,
      route[i].longitude,
      route[i + 1].latitude,
      route[i + 1].longitude
    );

    if (currentDistance + segmentDistance >= targetDistance) {
      // Interpolate within this segment
      const segmentProgress = (targetDistance - currentDistance) / segmentDistance;
      return {
        latitude:
          route[i].latitude +
          (route[i + 1].latitude - route[i].latitude) * segmentProgress,
        longitude:
          route[i].longitude +
          (route[i + 1].longitude - route[i].longitude) * segmentProgress,
      };
    }

    currentDistance += segmentDistance;
  }

  return route[route.length - 1];
};

/**
 * Mock location update for testing without real GPS
 * Simulates movement along a predefined route
 */
export class MockLocationUpdater {
  constructor(route, options = {}) {
    this.route = route;
    this.speed = options.speed || 50; // km/h
    this.updateInterval = options.updateInterval || 1000; // ms
    this.onUpdate = options.onUpdate || (() => {});
    this.isRunning = false;
    this.startTime = null;
    this.intervalId = null;
    this.accuracy = options.accuracy || 10;
  }

  start() {
    this.isRunning = true;
    this.startTime = Date.now();
    const totalDistance = calculateTotalDistance(this.route);
    const totalTimeHours = totalDistance / this.speed;
    const totalTimeMs = totalTimeHours * 60 * 60 * 1000;

    this.intervalId = setInterval(() => {
      const elapsedTime = Date.now() - this.startTime;
      const progress = Math.min(1, elapsedTime / totalTimeMs);

      const position = getPositionAlongRoute(this.route, progress);
      const lat1 = this.route[Math.floor(progress * (this.route.length - 1))].latitude;
      const lon1 = this.route[Math.floor(progress * (this.route.length - 1))].longitude;
      const lat2 = this.route[Math.ceil(progress * (this.route.length - 1))].latitude;
      const lon2 = this.route[Math.ceil(progress * (this.route.length - 1))].longitude;

      const heading = calculateBearing(lat1, lon1, lat2, lon2);

      const mockUpdate = {
        coords: {
          latitude: position.latitude,
          longitude: position.longitude,
          speed: this.speed / 3.6, // Convert to m/s
          accuracy: this.accuracy,
          heading: heading,
        },
        timestamp: Date.now(),
      };

      this.onUpdate(mockUpdate);

      if (progress >= 1) {
        this.stop();
      }
    }, this.updateInterval);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

/**
 * Check if geolocation is available
 * @returns {boolean} Whether geolocation API is available
 */
export const isGeolocationAvailable = () => {
  return 'geolocation' in navigator;
};

/**
 * Check if HTTPS is being used (required for Geolocation)
 * @returns {boolean} Whether connection is HTTPS or localhost
 */
export const isSecureConnection = () => {
  return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
};

/**
 * Validate route waypoints
 * @param {Array} route - Array of waypoints
 * @returns {Array} Array of validation errors (empty if valid)
 */
export const validateRoute = (route) => {
  const errors = [];

  if (!Array.isArray(route)) {
    errors.push('Route must be an array');
    return errors;
  }

  if (route.length < 2) {
    errors.push('Route must have at least 2 waypoints');
  }

  route.forEach((waypoint, index) => {
    if (!waypoint.latitude || !waypoint.longitude) {
      errors.push(`Waypoint ${index} missing latitude or longitude`);
    }

    if (waypoint.latitude < -90 || waypoint.latitude > 90) {
      errors.push(`Waypoint ${index} has invalid latitude`);
    }

    if (waypoint.longitude < -180 || waypoint.longitude > 180) {
      errors.push(`Waypoint ${index} has invalid longitude`);
    }
  });

  return errors;
};

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(2)}km`;
};

/**
 * Calculate progress percentage along route
 * @param {Array} route - Array of waypoints
 * @param {number} currentDistance - Current distance traveled
 * @returns {number} Progress percentage (0-100)
 */
export const calculateProgress = (route, currentDistance) => {
  const totalDistance = calculateTotalDistance(route);
  if (totalDistance === 0) return 0;
  return Math.min(100, (currentDistance / totalDistance) * 100);
};

/**
 * Get next waypoint along route
 * @param {Array} route - Array of waypoints
 * @param {number} progress - Progress along route (0-1)
 * @returns {Object} Next waypoint or null
 */
export const getNextWaypoint = (route, progress) => {
  if (!route || route.length < 2) return null;

  const totalDistance = calculateTotalDistance(route);
  const targetDistance = totalDistance * progress;

  let currentDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const segmentDistance = calculateDistance(
      route[i].latitude,
      route[i].longitude,
      route[i + 1].latitude,
      route[i + 1].longitude
    );

    if (currentDistance + segmentDistance >= targetDistance && i + 1 < route.length) {
      return { waypoint: route[i + 1], index: i + 1 };
    }

    currentDistance += segmentDistance;
  }

  return null;
};

export default {
  calculateDistance,
  calculateTotalDistance,
  calculateETA,
  formatTimeRemaining,
  formatETATime,
  mpsToKmh,
  kmhToMps,
  calculateBearing,
  getBearingDirection,
  smoothSpeed,
  isMoving,
  generateMockRoute,
  getPositionAlongRoute,
  MockLocationUpdater,
  isGeolocationAvailable,
  isSecureConnection,
  validateRoute,
  formatDistance,
  calculateProgress,
  getNextWaypoint,
};
