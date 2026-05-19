import React, { useState } from 'react';
import RealTimeNavigationDashboard from './RealTimeNavigationDashboard';

/**
 * Example usage of RealTimeNavigationDashboard component
 * 
 * Features demonstrated:
 * 1. Bottom Dashboard - Shows 4 live stats
 * 2. Live GPS Movement - Real-time marker updates
 * 3. Dynamic Data - Auto-updating distance and time
 * 4. Speedometer - Real-time km/h from GPS coordinates
 * 5. Auto-Route - Auto-generates route when location added
 */
const NavigationDashboardExample = () => {
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [isSetup, setIsSetup] = useState(false);

  // Multiple destination examples
  const destinations = {
    london: {
      latitude: 51.5074,
      longitude: -0.1278,
      name: 'London, UK',
    },
    paris: {
      latitude: 48.8566,
      longitude: 2.3522,
      name: 'Paris, France',
    },
    newYork: {
      latitude: 40.7128,
      longitude: -74.0060,
      name: 'New York, USA',
    },
  };

  const handleSetDestination = (dest) => {
    setDestination(dest);
    setIsSetup(true);
    // Route will auto-generate from current location to destination
  };

  const handleLocationAdded = (generatedRoute) => {
    setRoute(generatedRoute);
    console.log('Route auto-generated:', generatedRoute);
  };

  const handleNavigationStart = () => {
    console.log('Navigation started - Live tracking active');
  };

  const handleNavigationEnd = () => {
    console.log('Navigation ended');
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Setup Menu - shown before navigation starts */}
      {!isSetup && (
        <div style={styles.setupOverlay}>
          <div style={styles.setupContainer}>
            <h1 style={styles.setupTitle}>🗺️ Navigation Dashboard</h1>
            <p style={styles.setupSubtitle}>Select a destination to begin</p>
            
            <div style={styles.destinationButtons}>
              <button
                onClick={() => handleSetDestination(destinations.london)}
                style={styles.destButton}
              >
                📍 London, UK
                <br />
                <span style={styles.destSubtext}>51.5074°N, 0.1278°W</span>
              </button>
              
              <button
                onClick={() => handleSetDestination(destinations.paris)}
                style={styles.destButton}
              >
                🗼 Paris, France
                <br />
                <span style={styles.destSubtext}>48.8566°N, 2.3522°E</span>
              </button>
              
              <button
                onClick={() => handleSetDestination(destinations.newYork)}
                style={styles.destButton}
              >
                🏙️ New York, USA
                <br />
                <span style={styles.destSubtext}>40.7128°N, 74.0060°W</span>
              </button>
            </div>

            <div style={styles.setupHints}>
              <h3>💡 How to Use:</h3>
              <ul>
                <li>Select a destination above</li>
                <li>Route will auto-generate from your current location</li>
                <li>Say <strong>"Start"</strong> to begin navigation</li>
                <li>Watch live stats update as you move</li>
                <li>Speed calculated from GPS coordinates</li>
                <li>Distance and ETA update in real-time</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Dashboard */}
      {isSetup && (
        <RealTimeNavigationDashboard
          destination={destination}
          route={route}
          onNavigationStart={handleNavigationStart}
          onNavigationEnd={handleNavigationEnd}
          onLocationAdded={handleLocationAdded}
          autoGenerateRoute={true}
        />
      )}
    </div>
  );
};

const styles = {
  setupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
  },
  setupContainer: {
    backgroundColor: 'rgba(20, 20, 40, 0.9)',
    padding: '40px',
    borderRadius: '16px',
    textAlign: 'center',
    maxWidth: '600px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
  },
  setupTitle: {
    fontSize: '36px',
    marginBottom: '12px',
    color: '#4A90E2',
  },
  setupSubtitle: {
    fontSize: '16px',
    color: '#A0AEC0',
    marginBottom: '32px',
  },
  destinationButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px',
    marginBottom: '32px',
  },
  destButton: {
    padding: '20px 16px',
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    border: '2px solid rgba(74, 144, 226, 0.5)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
  },
  destSubtext: {
    fontSize: '12px',
    color: '#A0AEC0',
    marginTop: '8px',
    display: 'block',
  },
  setupHints: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'left',
    color: '#A0AEC0',
    fontSize: '14px',
  },
};

export default NavigationDashboardExample;
