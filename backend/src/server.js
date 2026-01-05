const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/database');
const authRoutes = require('./routes/auth');
const msmeRoutes = require('./routes/msme');
const invoiceRoutes = require('./routes/invoice');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/msme', msmeRoutes);
app.use('/api/invoice', invoiceRoutes);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: result.rows[0].now
        });
    } catch (error) {
        res.json({ status: 'ok', database: 'disconnected', timestamp: new Date().toISOString() });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await db.query('SELECT 1');
        console.log('PostgreSQL Connected');

        app.listen(PORT, () => {
            console.log(`TrustFlow Backend running on port ${PORT}`);
        });
    } catch (error) {
        console.warn('PostgreSQL not connected - running without database');
        app.listen(PORT, () => {
            console.log(`TrustFlow Backend running on port ${PORT} (no database)`);
        });
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    await db.close();
    process.exit(0);
});

startServer();

module.exports = app;


