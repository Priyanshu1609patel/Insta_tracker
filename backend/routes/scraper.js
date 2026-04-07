const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getStatus, setSessionId, checkSessionHealth } = require('../scraper/instaScraper');

// ── In-memory health cache — refreshed every 6 hours automatically ──
let healthCache = null;
let lastChecked = null;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

async function refreshHealthCache() {
  healthCache = await checkSessionHealth();
  lastChecked = Date.now();
  console.log(`[Session] Health check: ${healthCache.valid ? '✅ valid' : '❌ expired'} — daysRemaining: ${healthCache.daysRemaining}`);
  return healthCache;
}

// Auto-refresh every 6 hours
setInterval(refreshHealthCache, CACHE_TTL);
// Run once on startup after 5s
setTimeout(refreshHealthCache, 5000);

// GET /api/scraper/status
router.get('/status', auth, (req, res) => {
  res.json(getStatus());
});

// POST /api/scraper/session — save Instagram session cookie
router.post('/session', auth, (req, res) => {
  let { sessionId } = req.body;
  if (!sessionId || sessionId.trim().length < 10) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }
  try { sessionId = decodeURIComponent(sessionId.trim()); } catch (_) { sessionId = sessionId.trim(); }
  setSessionId(sessionId);
  // Immediately re-check health after saving new session
  refreshHealthCache();
  res.json({ message: '✅ Session ID saved! Scraping is now active.' });
});

// GET /api/scraper/check — returns cached result (fresh if cache expired)
router.get('/check', auth, async (req, res) => {
  const force = req.query.force === 'true';
  if (force || !healthCache || Date.now() - lastChecked > CACHE_TTL) {
    await refreshHealthCache();
  }
  res.json({ ...healthCache, lastChecked: new Date(lastChecked).toISOString() });
});

// kept for backwards-compat with old frontend code
router.post('/verify', auth, (req, res) => res.status(410).json({ error: 'Not used anymore' }));
router.post('/resend', auth, (req, res) => res.status(410).json({ error: 'Not used anymore' }));
router.post('/reset', auth, (req, res) => res.json({ message: 'OK' }));

module.exports = router;
