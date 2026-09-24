/**
 * OmniExtract — Local Node.js Express Server & Headless Scraper
 * Optional backend for running local scraping or deploying as an API service.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

/**
 * High-speed Server-side HTML Proxy Endpoint
 * GET /api/fetch?url=https://example.com
 */
app.get('/api/fetch', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target URL parameter (?url=...)' });
  }

  try {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;

    const request = client.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 10000
    }, (response) => {
      // Follow redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return res.redirect(`/api/fetch?url=${encodeURIComponent(new URL(response.headers.location, targetUrl).href)}`);
      }

      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(data);
      });
    });

    request.on('error', (err) => {
      res.status(500).json({ error: `Proxy request failed: ${err.message}` });
    });

    request.on('timeout', () => {
      request.destroy();
      res.status(504).json({ error: 'Target URL timed out after 10 seconds' });
    });

  } catch (err) {
    res.status(400).json({ error: `Invalid URL: ${err.message}` });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime(), version: '2.0.0' });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 OmniExtract Server running on http://localhost:${PORT}`);
  console.log(`📡 High-Speed Proxy API: http://localhost:${PORT}/api/fetch?url=...`);
  console.log(`======================================================\n`);
});
