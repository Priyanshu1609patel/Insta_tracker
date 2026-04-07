const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Session cookie stored on disk so dashboard can update it
// without restarting the server
// ─────────────────────────────────────────────────────────────
const SESSION_STORE = path.join(__dirname, '../.ig_web_session.json');

function getSessionId() {
  try {
    if (fs.existsSync(SESSION_STORE)) {
      const data = JSON.parse(fs.readFileSync(SESSION_STORE, 'utf8'));
      if (data.sessionId) return data.sessionId;
    }
  } catch (_) {}
  return process.env.INSTAGRAM_SESSION_ID || null;
}

function setSessionId(sessionId) {
  fs.writeFileSync(SESSION_STORE, JSON.stringify({ sessionId, savedAt: new Date().toISOString() }));
}

function getStatus() {
  const sessionId = getSessionId();
  return {
    method: 'web_session',
    hasSession: !!sessionId,
    sessionPreview: sessionId ? sessionId.substring(0, 8) + '...' : null,
    rapidApiEnabled: !!process.env.RAPIDAPI_KEY,
  };
}

async function checkSessionHealth() {
  const sessionId = getSessionId();
  if (!sessionId) return { valid: false, reason: 'No session ID set' };

  // Always calculate days remaining from savedAt — works even if API call fails
  let savedAt = null;
  let daysRemaining = null;
  try {
    if (fs.existsSync(SESSION_STORE)) {
      const data = JSON.parse(fs.readFileSync(SESSION_STORE, 'utf8'));
      if (data.savedAt) {
        savedAt = data.savedAt;
        const daysPassed = Math.floor((Date.now() - new Date(savedAt).getTime()) / 86400000);
        daysRemaining = Math.max(0, 90 - daysPassed);
      }
    }
  } catch (_) {}

  // Lightweight API call to verify session is still accepted by Instagram
  try {
    const res = await axios.get(
      'https://i.instagram.com/api/v1/accounts/current_user/',
      {
        headers: {
          Cookie: `sessionid=${sessionId}`,
          'X-IG-App-ID': '936619743392459',
          'User-Agent': 'Instagram 278.0.0.19.115 Android',
          'Accept-Language': 'en-US',
        },
        maxRedirects: 0,
        timeout: 10000,
      }
    );
    const user = res.data?.user;
    return {
      valid: true,
      username: user?.username || null,
      savedAt,
      daysRemaining,
      note: `~${daysRemaining ?? 90} days remaining (Instagram sessions last ~90 days)`,
    };
  } catch (err) {
    const status = err.response?.status;
    // Definitely expired
    if (status === 401 || status === 403) {
      return { valid: false, reason: 'Session expired — paste a new sessionid in Settings', savedAt, daysRemaining: 0 };
    }
    // Network/redirect error — session may still work, return age-based info
    return {
      valid: daysRemaining === null || daysRemaining > 0,
      username: null,
      savedAt,
      daysRemaining,
      note: `~${daysRemaining ?? 90} days remaining (Instagram sessions last ~90 days)`,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Method 1 — Instagram Web Session Cookie (FREE, no rate limit)
// ─────────────────────────────────────────────────────────────
async function scrapeViaWebSession(mediaId, shortcode) {
  const sessionId = getSessionId();
  if (!sessionId) return null;

  const cookieHeader = `sessionid=${sessionId}`;
  const browserAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/120.0.0.0 Safari/537.36';

  // Attempt A: i.instagram.com mobile API (correct host for /api/v1/)
  try {
    const res = await axios.get(
      `https://i.instagram.com/api/v1/media/${mediaId}/info/`,
      {
        headers: {
          Cookie: cookieHeader,
          'X-IG-App-ID': '936619743392459',
          'X-ASBD-ID': '198387',
          'User-Agent': 'Instagram 278.0.0.19.115 Android',
          Accept: '*/*',
          'Accept-Language': 'en-US',
        },
        maxRedirects: 0,
        timeout: 15000,
      }
    );
    const item = res.data?.items?.[0];
    if (item) {
      const views =
        item.view_count ?? item.play_count ??
        item.video_view_count ?? item.ig_play_count ?? 0;
      return parseInt(views) || 0;
    }
  } catch (err) {
    const status = err.response?.status;
    console.log(`[WebSession-A] status=${status} error=${err.message}`);
    if (status === 401 || status === 403) {
      console.log('[WebSession] ❌ Session expired — update it in Settings');
      return null;
    }
    // fall through to Attempt B for any error including 400
  }

  // Attempt B: parse view count from the reel's HTML page
  try {
    const res = await axios.get(
      `https://www.instagram.com/reel/${shortcode}/`,
      {
        headers: {
          Cookie: cookieHeader,
          'User-Agent': browserAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15000,
      }
    );
    const html = res.data;
    const patterns = [
      /"video_view_count"\s*:\s*(\d+)/,
      /"view_count"\s*:\s*(\d+)/,
      /"play_count"\s*:\s*(\d+)/,
      /"ig_play_count"\s*:\s*(\d+)/,
    ];
    for (const pattern of patterns) {
      const m = html.match(pattern);
      if (m) return parseInt(m[1]);
    }
  } catch (err) {
    const status = err.response?.status;
    console.log(`[WebSession-B] status=${status} error=${err.message}`);
    if (status === 401 || status === 403) {
      console.log('[WebSession] ❌ Session expired — update it in Settings');
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// Method 2 — RapidAPI fallback
// ─────────────────────────────────────────────────────────────
async function scrapeViaRapidAPI(reelUrl, shortcode) {
  if (!process.env.RAPIDAPI_KEY) return null;
  try {
    const username = await getUsername(reelUrl);
    if (!username) return null;
    const res = await axios.get(
      'https://instagram-scraper-20251.p.rapidapi.com/userreels/',
      {
        params: { username_or_id: username, count: 50 },
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'instagram-scraper-20251.p.rapidapi.com',
        },
        timeout: 15000,
      }
    );
    const items = res.data?.data?.items || [];
    const matched = items.find(i => i.code === shortcode);
    if (matched) return parseInt(matched.ig_play_count ?? matched.play_count ?? 0);
    return null;
  } catch (err) {
    console.log(`[RapidAPI] ${err.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN SCRAPER
// ─────────────────────────────────────────────────────────────
async function scrapeReelViews(reelUrl) {
  console.log(`\n[Scraper] ▶ ${reelUrl}`);

  const shortcode = extractShortcode(reelUrl);
  if (!shortcode) return null;

  const mediaId = shortcodeToMediaId(shortcode);

  // Method 1: Web session cookie (free, unlimited)
  const webViews = await scrapeViaWebSession(mediaId, shortcode);
  if (webViews !== null) {
    console.log(`[Scraper] ✅ Web Session → ${webViews} views`);
    return webViews;
  }

  // Method 2: RapidAPI (30 req/month free)
  const rapidViews = await scrapeViaRapidAPI(reelUrl, shortcode);
  if (rapidViews !== null) {
    console.log(`[Scraper] ✅ RapidAPI → ${rapidViews} views`);
    return rapidViews;
  }

  console.log('[Scraper] ❌ All methods failed');
  return null;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function extractShortcode(url) {
  const m = url.match(/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

function shortcodeToMediaId(shortcode) {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let mediaId = BigInt(0);
  for (const char of shortcode) {
    mediaId = mediaId * BigInt(64) + BigInt(alphabet.indexOf(char));
  }
  return mediaId.toString();
}

async function getUsername(reelUrl) {
  // Try Instagram's public oEmbed API — no auth needed
  try {
    const res = await axios.get('https://www.instagram.com/api/v1/oembed/', {
      params: { url: reelUrl },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; oEmbed/1.0)' },
      timeout: 10000,
    });
    const authorUrl = res.data?.author_url || '';
    const m = authorUrl.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
    if (m) return m[1];
  } catch (_) {}

  // Fallback: parse from HTML
  try {
    const res = await axios.get(reelUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    });
    const m = res.data.match(/"username"\s*:\s*"([a-zA-Z0-9._]+)"/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function parseViewCount(str) {
  if (!str) return 0;
  str = str.toString().trim().replace(/,/g, '');
  const num = parseFloat(str);
  if (/b$/i.test(str)) return Math.round(num * 1e9);
  if (/m$/i.test(str)) return Math.round(num * 1e6);
  if (/k$/i.test(str)) return Math.round(num * 1e3);
  return Math.round(num) || 0;
}

async function scrapeMultipleReels(reels) {
  const results = [];
  for (const reel of reels) {
    const views = await scrapeReelViews(reel.reel_url);
    results.push({ id: reel.id, views, reel_url: reel.reel_url });
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));
  }
  return results;
}

module.exports = {
  scrapeReelViews,
  scrapeMultipleReels,
  parseViewCount,
  getStatus,
  setSessionId,
  checkSessionHealth,
  // kept for route compatibility (no-ops now)
  resolveChallenge: async () => ({ success: false, error: 'Not applicable' }),
  resendCode: async () => ({ success: false, error: 'Not applicable' }),
  resetLogin: () => {},
};
