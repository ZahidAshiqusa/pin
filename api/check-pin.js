// api/check-pin.js
// Vercel Node Serverless function: checks submitted PIN(s) against env var(s).
// Set environment variable named DASHBOARD_PINS in Vercel, e.g. "1234,2468,9876"

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    const { pin } = req.body || {};
    if (!pin || typeof pin !== 'string') {
      return res.status(400).json({ ok: false, message: 'Missing pin' });
    }

    // Read pins from env var
    // Example: DASHBOARD_PINS=1234,4321
    const raw = process.env.DASHBOARD_PINS || '';
    const allowed = raw.split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // No pins configured — deny by default
    if (allowed.length === 0) {
      return res.status(403).json({ ok: false, message: 'No PIN configured (server)' });
    }

    // constant-time compare for security
    const crypto = require('crypto');

    const valid = allowed.some(stored => {
      // ensure same length to use timingSafeEqual
      const a = Buffer.from(String(stored));
      const b = Buffer.from(String(pin));
      if (a.length !== b.length) {
        // fast path: lengths differ → not equal
        return false;
      }
      try {
        return crypto.timingSafeEqual(a, b);
      } catch (e) {
        return false;
      }
    });

    if (valid) {
      return res.status(200).json({ ok: true, message: 'Unlocked' });
    } else {
      return res.status(401).json({ ok: false, message: 'Invalid PIN' });
    }

  } catch (err) {
    console.error('check-pin error', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
      }
