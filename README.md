# RouteNav - Find Your Way

A modern navigation web application similar to Google Maps, built with Node.js, Express, and Leaflet.js.

## Features

### Core Navigation
- Route search between any two locations worldwide
- Multi-modal directions: Driving, Walking, Cycling
- Mode comparison for all transport types
- Real-time GPS tracking during navigation

### Advanced Features
- **Multi-stop Routing**: Plan routes with multiple waypoints/stops
- **Route Sharing**: Share routes via link or QR code
- **Offline Support**: Map caching for offline use
- **Real-time Traffic Rerouting**: Automatic rerouting on traffic changes
- **Dark/Light Theme**: Auto-switch based on system preference

### Additional Features
- Save favorite places with categories (home, work, fuel, food, hotel)
- Traffic condition indicators

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Leaflet.js
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **APIs**: OSRM (Routing), Nominatim (Geocoding)

## Quick Start

### Prerequisites
- Node.js 14+ installed

### Installation

```bash
# Clone or navigate to project
cd Route_Finder

# Install dependencies
npm install

# Start the server
npm start
```

### Usage

1. Open browser at `http://localhost:3000`
2. Enter start and destination locations
3. Click "Find Route"
4. Select transport mode and view route
5. Click "Start Navigation" for live GPS tracking

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/test` | Health check |
| POST | `/api/register` | User registration |
| POST | `/api/login` | User login |
| GET | `/api/me` | Get current user info |
| POST | `/api/routes` | Save route to history |
| GET | `/api/routes` | Get user's route history |
| DELETE | `/api/routes/:id` | Delete a route |
| POST | `/api/places` | Save a place |
| GET | `/api/places` | Get saved places |
| DELETE | `/api/places/:id` | Delete a place |

## Environment Variables

See `.env` file for configuration options.

## License

MIT
