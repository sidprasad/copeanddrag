// src/server.js - Minimal server for Sterling integration
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle Sterling POST requests
app.post('/', (req, res) => {
    const { alloydatum, cope } = req.body;
    
    // Generate unique session ID for this request
    const sessionId = Date.now().toString();
    
    // Store data temporarily (in-memory or Redis for production)
    global.sterlingData = global.sterlingData || {};
    global.sterlingData[sessionId] = { alloydatum, cope };

    // console.log('Received Sterling POST request');
    // console.log('Request Body:', req.body);

    console.log(`Received Sterling data for session ${sessionId}`);
    console.log('Alloy Datum:', alloydatum);
    console.log('Cope:', cope);
    
    // Redirect to client-side app with session ID
    res.redirect(`/?session=${sessionId}`);
});

// API endpoint for client to fetch Sterling data
app.get('/api/sterling-data/:sessionId', (req, res) => {
    console.log('Fetching Sterling data for session:', req.params.sessionId);

    const { sessionId } = req.params;
    const data = global.sterlingData?.[sessionId];

    console.log('Retrieved data:', data);
    
    if (data) {
        // Clean up after retrieval
        delete global.sterlingData[sessionId];
        res.json(data);
        console.log(`Session ${sessionId} data retrieved and cleaned up`);
    } else {
        res.status(404).json({ error: 'Session not found' });
    }
});

// Serve index.html for all other routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve import.html for the import route
app.get('/import', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'import.html'));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`));