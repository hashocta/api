const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = 'P-YQ6XKk8fjkX6dBeyHh0Yau25FC_7tHu4nItM2tzsS_0Hw_IoIEEbG3a1GM1sQ';

// Enable CORS for all origins
app.use(cors());

// Enable compression for all responses
app.use(compression());

// Cache middleware
const cache = new Map();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Main API endpoint
app.get('/agechecker-api/:domain', async (req, res) => {
  try {
    const domain = req.params.domain;
    
    // Check if we have a valid cached response
    const cachedData = cache.get(domain);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      return res.json(cachedData.data);
    }

    // Make request to WHOIS API
    const response = await fetch(`https://whoisjsonapi.com/v1/${domain}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`WHOIS API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Cache the response
    cache.set(domain, {
      timestamp: Date.now(),
      data: data
    });

    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'An error occurred while fetching WHOIS data',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something broke!',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});