require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const crypto = require('crypto');

const app = express();

// ================= SECURITY HEADERS =================

app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.header('Permissions-Policy', 'geolocation=self');
    next();
});

// ================= CORS (single configuration) =================

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// ================= RATE LIMITING =================

const rateLimitMap = new Map();

function rateLimit({ windowMs = 60000, max = 20, keyFn }) {
    return (req, res, next) => {
        const key = keyFn ? keyFn(req) : req.ip;
        const now = Date.now();
        const record = rateLimitMap.get(key);

        if (!record || now - record.start > windowMs) {
            rateLimitMap.set(key, { start: now, count: 1 });
            return next();
        }

        record.count++;
        if (record.count > max) {
            return res.status(429).json({ error: 'Too many requests, try again later' });
        }

        next();
    };
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
        if (now - record.start > 120000) {
            rateLimitMap.delete(key);
        }
    }
}, 300000);

// ================= INPUT SANITIZATION =================

function sanitize(str) {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>\"'&]/g, (c) => {
        const map = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
        return map[c];
    }).slice(0, 500);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return typeof password === 'string' && password.length >= 6 && password.length <= 128;
}

const db = new sqlite3.Database(path.join(__dirname, 'routefinder.db'));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        start_location TEXT NOT NULL,
        end_location TEXT NOT NULL,
        distance TEXT,
        duration TEXT,
        transport_mode TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS saved_places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        address TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        place_type TEXT DEFAULT 'other',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    console.log('Database initialized');
});

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

if (!process.env.JWT_SECRET) {
    console.warn('⚠️ WARNING: Using random JWT secret. Set JWT_SECRET in .env for production.');
}

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// ================= API ROUTES =================

app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'All APIs working' });
});

app.post('/api/register', rateLimit({ windowMs: 60000, max: 5, keyFn: (req) => req.ip }), (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }

    const sanitizedName = sanitize(name);
    const sanitizedEmail = sanitize(email);

    if (!validateEmail(sanitizedEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({ error: 'Password must be 6-128 characters' });
    }

    db.get('SELECT id FROM users WHERE email = ?', [sanitizedEmail], (err, existing) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (existing) return res.status(400).json({ error: 'Email already registered' });

        bcrypt.hash(password, 12, (err, hash) => {
            if (err) return res.status(500).json({ error: 'Server error' });

            db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [sanitizedName, sanitizedEmail, hash], function(err) {
                if (err) return res.status(500).json({ error: 'Server error' });

                const token = jwt.sign({ id: this.lastID, name: sanitizedName, email: sanitizedEmail }, JWT_SECRET, { expiresIn: '7d' });
                res.json({ success: true, token, user: { id: this.lastID, name: sanitizedName, email: sanitizedEmail } });
            });
        });
    });
});

app.post('/api/login', rateLimit({ windowMs: 60000, max: 10, keyFn: (req) => req.ip }), (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        bcrypt.compare(password, user.password, (err, valid) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

            const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
            res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
        });
    });
});

app.get('/api/me', authenticate, (req, res) => {
    db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    });
});

app.post('/api/routes', authenticate, (req, res) => {
    const { start, end, distance, duration, mode } = req.body;

    if (!start || !end) return res.status(400).json({ error: 'Start and end required' });

    const sanitizedStart = sanitize(start);
    const sanitizedEnd = sanitize(end);
    const sanitizedDistance = distance ? sanitize(distance) : '';
    const sanitizedDuration = duration ? sanitize(duration) : '';
    const sanitizedMode = mode ? sanitize(mode) : 'driving';

    if (sanitizedStart.length > 200 || sanitizedEnd.length > 200) {
        return res.status(400).json({ error: 'Location names too long' });
    }

    db.run('INSERT INTO routes (user_id, start_location, end_location, distance, duration, transport_mode) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, sanitizedStart, sanitizedEnd, sanitizedDistance, sanitizedDuration, sanitizedMode],
        function(err) {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.json({ success: true, route: { id: this.lastID, start: sanitizedStart, end: sanitizedEnd, distance: sanitizedDistance, duration: sanitizedDuration, mode: sanitizedMode } });
        }
    );
});

app.post('/api/places', authenticate, (req, res) => {
    const { name, address, lat, lon, type } = req.body;

    if (!name || lat == null || lon == null) return res.status(400).json({ error: 'Name and coordinates required' });

    const sanitizedName = sanitize(name);
    const sanitizedAddress = address ? sanitize(address) : '';
    const sanitizedType = type ? sanitize(type) : 'other';
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
        return res.status(400).json({ error: 'Invalid coordinates' });
    }

    if (sanitizedName.length > 100) {
        return res.status(400).json({ error: 'Place name too long' });
    }

    db.run('INSERT INTO saved_places (user_id, name, address, latitude, longitude, place_type) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, sanitizedName, sanitizedAddress, parsedLat, parsedLon, sanitizedType],
        function(err) {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.json({ success: true, place: { id: this.lastID, name: sanitizedName, address: sanitizedAddress, lat: parsedLat, lon: parsedLon, type: sanitizedType } });
        }
    );
});

app.get('/api/routes', authenticate, (req, res) => {
    db.all('SELECT * FROM routes WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, routes) => {
        res.json({ routes: routes || [] });
    });
});

app.delete('/api/routes/:id', authenticate, (req, res) => {
    db.run('DELETE FROM routes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err) => {
        res.json({ success: true });
    });
});

app.get('/api/places', authenticate, (req, res) => {
    db.all('SELECT * FROM saved_places WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, places) => {
        res.json({ places: places || [] });
    });
});

app.delete('/api/places/:id', authenticate, (req, res) => {
    db.run('DELETE FROM saved_places WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err) => {
        res.json({ success: true });
    });
});

// ================= FRONTEND =================

app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'route-finder.html'));
});

app.get('/route-finder.html', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'route-finder.html'));
});

app.post('/api/live-traffic-route', rateLimit({ windowMs: 60000, max: 30 }), async (req, res) => {
    try {
        const { fromLoc, toLoc } = req.body;

        if (!fromLoc || !toLoc) {
            return res.status(400).json({ error: 'Locations required' });
        }

        if (!fromLoc.lat || !fromLoc.lon || !toLoc.lat || !toLoc.lon) {
            return res.status(400).json({ error: 'Invalid location coordinates' });
        }

        const token = process.env.MAPBOX_TOKEN;
        if (!token || token.startsWith('pk.your_') || token === 'your_mapbox_token_here') {
            return res.status(500).json({ error: 'Add a real MAPBOX_TOKEN in .env and restart the server' });
        }

        const coords = `${fromLoc.lon},${fromLoc.lat};${toLoc.lon},${toLoc.lat}`;

        const url =
            `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}` +
            `?geometries=geojson&overview=full&alternatives=true&annotations=congestion,duration,distance` +
            `&access_token=${token}`;

        const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: data.message || data.error || 'Mapbox traffic request failed'
            });
        }

        if (!data.routes || !data.routes.length) {
            return res.status(404).json({ error: 'No traffic route found' });
        }

        res.json({
            routes: data.routes.map(route => ({
                distance: route.distance,
                duration: route.duration,
                geometry: route.geometry,
                congestion: route.legs?.[0]?.annotation?.congestion || []
            }))
        });
    } catch (error) {
        if (error.name === 'TimeoutError') {
            return res.status(504).json({ error: 'Traffic request timed out' });
        }
        res.status(500).json({ error: 'Live traffic failed' });
    }
});

// ================= 404 HANDLER =================

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// ================= GLOBAL ERROR HANDLER =================

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// ================= START =================

const PORT = process.env.PORT || 3000;
console.log(`Using PORT: ${PORT} (from env: ${process.env.PORT || 'default'})`);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Route Finder running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
