/**
 * CubynSMP Website Server
 * Express.js backend for the Minecraft server website
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Config file path
const CONFIG_PATH = path.join(__dirname, 'config.json');

/**
 * Read configuration from file
 */
function readConfig() {
    try {
        const data = fs.readFileSync(CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading config:', error);
        return null;
    }
}

/**
 * Write configuration to file
 */
function writeConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing config:', error);
        return false;
    }
}

// ========================================
// API Routes
// ========================================

/**
 * Get configuration
 * GET /api/config
 */
app.get('/api/config', (req, res) => {
    const config = readConfig();
    if (config) {
        res.json(config);
    } else {
        res.status(500).json({ error: 'Failed to read configuration' });
    }
});

/**
 * Update configuration
 * POST /api/config
 */
app.post('/api/config', (req, res) => {
    const newConfig = req.body;
    
    if (!newConfig) {
        return res.status(400).json({ error: 'No configuration provided' });
    }
    
    if (writeConfig(newConfig)) {
        res.json({ success: true, message: 'Configuration updated' });
    } else {
        res.status(500).json({ error: 'Failed to write configuration' });
    }
});

/**
 * Get server status (proxy to avoid CORS)
 * GET /api/server-status
 */
app.get('/api/server-status', async (req, res) => {
    const config = readConfig();
    if (!config) {
        return res.status(500).json({ error: 'Configuration not found' });
    }
    
    const { ip, port } = config.server;
    
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`https://api.mcstatus.io/v2/status/java/${ip}:${port}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching server status:', error);
        res.status(500).json({ error: 'Failed to fetch server status' });
    }
});

/**
 * Get specific section of config
 * GET /api/config/:section
 */
app.get('/api/config/:section', (req, res) => {
    const config = readConfig();
    if (!config) {
        return res.status(500).json({ error: 'Configuration not found' });
    }
    
    const section = req.params.section;
    if (config[section]) {
        res.json(config[section]);
    } else {
        res.status(404).json({ error: 'Section not found' });
    }
});

/**
 * Update specific section of config
 * PUT /api/config/:section
 */
app.put('/api/config/:section', (req, res) => {
    const config = readConfig();
    if (!config) {
        return res.status(500).json({ error: 'Configuration not found' });
    }
    
    const section = req.params.section;
    const data = req.body;
    
    if (!data) {
        return res.status(400).json({ error: 'No data provided' });
    }
    
    config[section] = data;
    
    if (writeConfig(config)) {
        res.json({ success: true, message: `${section} updated` });
    } else {
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

// ========================================
// Static File Routes
// ========================================

/**
 * Main page
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * Admin panel
 */
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ========================================
// Error Handling
// ========================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ========================================
// Start Server
// ========================================

app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════╗
    ║                                                          ║
    ║           CubynSMP Website Server Running                ║
    ║                                                          ║
    ║   Local:   http://localhost:${PORT}                      ║
    ║   Admin:   http://localhost:${PORT}/admin                ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
