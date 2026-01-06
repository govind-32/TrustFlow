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
    res.json({
        status: 'ok',
        database: db.isConfigured() ? 'connected' : 'demo-mode',
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const startServer = async () => {
    // Test database connection
    const connected = await db.testConnection();

    app.listen(PORT, () => {
        if (connected) {
            console.log(`TrustFlow Backend running on port ${PORT} with Supabase`);
        } else {
            console.log(`TrustFlow Backend running on port ${PORT} (demo mode)`);
        }
    });
};

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    process.exit(0);
});

startServer();

module.exports = app;
