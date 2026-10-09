require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

// Import database to trigger immediate connection verification
const pool = require('./config/db'); 

// Import routes
const firecrackerRoutes = require('./routes/firecrackerRoute');
const orderRoutes = require('./routes/orderRoute');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'https://fireworks-fe-six.vercel.app',
    'https://shivasfireworks.in',
    'https://www.shivasfireworks.in'
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Detailed Request Logging Middleware (Applies to ALL routes)
app.use((req, res, next) => {
    console.log(`\n--- [INCOMING REQUEST] [${new Date().toISOString()}] ---`);
    console.log(`Method: ${req.method} | URL: ${req.originalUrl}`);
    console.log('Headers Auth:', req.headers.authorization || 'None');
    console.log('Query Token:', req.query.token || 'None');
    console.log('Cookies:', Object.keys(req.cookies || {}).length ? req.cookies : 'None');
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Serve uploaded images statically
// Serve uploaded images statically with 1-year browser caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1y',
    immutable: true
}));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/firecrackers', firecrackerRoutes);
app.use('/api/firecrackers/orders', orderRoutes);

// Global 500 Error Catching Middleware (Captures uncaught controller errors)
app.use((err, req, res, next) => {
    console.error('\n --- [SERVER 500 ERROR CAUGHT] ---');
    console.error(`Route: ${req.method} ${req.originalUrl}`);
    console.error('Error Message:', err.message);
    console.error('Stack Trace:\n', err.stack);
    console.error('------------------------------------\n');

    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
    if (err) {
        console.error(` [SERVER START FAILED]: ${err.message}`);
        process.exit(1);
    }
    console.log(`[SERVER RUNNING]: Listening on http://localhost:${PORT}`);
});
