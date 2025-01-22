const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = 'P-YQ6XKk8fjkX6dBeyHh0Yau25FC_7tHu4nItM2tzsS_0Hw_IoIEEbG3a1GM1sQ';

app.use(cors());
app.use(compression());

const cache = new Map();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

function calculateDomainAge(createdDate) {
  const created = new Date(createdDate);
  const now = new Date();
  
  const diffTime = Math.abs(now - created);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const years = Math.floor(diffDays / 365);
  const remainingDays = diffDays % 365;
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;

  // Format the age string based on the conditions
  if (years > 0) {
    if (months > 0 && days === 0) {
      return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
    } else if (months === 0 && days > 0) {
      return `${years} year${years !== 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''}`;
    } else if (months === 0 && days === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
  } else if (months > 0) {
    if (days === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${months} month${months !== 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''}`;
  }
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
}

app.get('/agechecker-api/:domain', async (req, res) => {
  try {
    const domain = req.params.domain;
    
    const cachedData = cache.get(domain);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      return res.json({ domainAge: cachedData.data });
    }

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
    const domainAge = calculateDomainAge(data.domain.created_date);

    cache.set(domain, {
      timestamp: Date.now(),
      data: domainAge
    });

    res.json({ domainAge });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'An error occurred while fetching WHOIS data',
      message: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

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
