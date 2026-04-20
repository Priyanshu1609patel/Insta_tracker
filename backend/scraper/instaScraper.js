const axios = require('axios');
const fs = require('fs');
const path = require('path');
const supabase = require('../supabase');

// ─────────────────────────────────────────────────────────────
// Session cookie stored on disk so dashboard can update it
// without restarting the server
// ─────────────────────────────────────────────────────────────
const SESSION_STORE = path.join(__dirname, '../.ig_web_session.json');

// In-memory cache so we don't hit Supabase on every scrape
let _sessionCache = null;

function getSessionId() {
  // 1. Local file (local dev)
  try {
    if (fs.existsSync(SESSION_STORE)) {
      const data = JSON.parse(fs.readFileSync(SESSION_STORE, 'utf8'));
      if (data.sessionId) return data.sessionId;
    }
  } catch (_) {}
  // 2. In-memory cache (set after Supabase fetch)
  if (_sessionCache) return _sessionCache;
  // 3. Env variable fallback
  return process.env.INSTAGRAM_SESSION_ID || null;
}

// Called once on server start — loads sessionId from Supabase into memory
async function loadSessionFromSupabase() {
  try {
    const { data } = await supabase
      .from('users')
      .select('ig_session_id')
      .eq('role', 'admin')
      .single();
    if (data?.ig_session_id) {
      _sessionCache = data.ig_session_id;
      console.log('[Session] Loaded sessionId from Supabase ✅');
    }
  } catch (_) {}
}

async function getSavedAt() {
  // 1. Try local file first (works for local dev)
  try {
    if (fs.existsSync(SESSION_STORE)) {
      const data = JSON.parse(fs.readFileSync(SESSION_STORE, 'utf8'));
      if (data.savedAt) return data.savedAt;
    }
  } catch (_) {}
  // 2. Fall back to Supabase (works on Render after redeploy)
  try {
    const { data } = await supabase
      .from('users')
      .select('ig_session_saved_at')
      .eq('role', 'admin')
      .single();
    if (data?.ig_session_saved_at) return data.ig_session_saved_at;
  } catch (_) {}
  return null;
}

function setSessionId(sessionId) {
  const savedAt = new Date().toISOString();
  // Save to local file (local dev)
  try { fs.writeFileSync(SESSION_STORE, JSON.stringify({ sessionId, savedAt })); } catch (_) {}
  // Save to Supabase (production — survives Render redeploys)
  _sessionCache = sessionId;
  supabase
    .from('users')
    .update({ ig_session_id: sessionId, ig_session_saved_at: savedAt })
    .eq('role', 'admin')
    .then(() => console.log('[Session] Saved to Supabase ✅'))
    .catch(() => {});
}

function getStatus() {
  const sessionId = getSessionId();
  return {
    method: 'web_session',
    hasSession: !!sessionId,
    sessionPreview: sessionId ? sessionId.substring(0, 8) + '...' : null,
    rapidApiEnabled: !!process.env.RAPIDAPI_KEY,
    cloudflareWorkerEnabled: !!process.env.CLOUDFLARE_WORKER_URL,
  };
}

async function checkSessionHealth() {
  const sessionId = getSessionId();
  if (!sessionId) return { valid: false, reason: 'No session ID set' };

  // Get savedAt from file (local) or Supabase (production)
  let savedAt = null;
  let daysRemaining = null;
  try {
    savedAt = await getSavedAt();
    if (savedAt) {
      const daysPassed = Math.floor((Date.now() - new Date(savedAt).getTime()) / 86400000);
      daysRemaining = Math.max(0, 90 - daysPassed);
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
// Build axios config — routes through Cloudflare Worker if direct request is blocked
async function fetchWithFallback(targetUrl, headers) {
  // Always try direct first (cookie works, no proxy stripping)
  try {
    const res = await axios.get(targetUrl, { headers, maxRedirects: 5, timeout: 15000 });
    return res;
  } catch (directErr) {
    const status = directErr.response?.status;
    // Fall back to Cloudflare Worker on IP-based blocks (429, 400, or no response)
    const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
    const workerToken = process.env.CLOUDFLARE_WORKER_TOKEN;
    if (workerUrl && (status === 429 || status === 400 || status === 403 || !status)) {
      console.log(`[CloudflareWorker] Direct blocked (${status}) — retrying via Cloudflare edge`);
      try {
        const workerRes = await axios.post(
          workerUrl.trim(),
          { url: targetUrl, headers },
          {
            headers: {
              'X-Worker-Token': workerToken || '',
              'Content-Type': 'application/json',
            },
            timeout: 25000,
          }
        );
        console.log(`[CloudflareWorker] Response status: ${workerRes.status}`);
        return workerRes;
      } catch (workerErr) {
        const workerStatus = workerErr.response?.status;
        const workerBody = workerErr.response?.data;
        console.log(`[CloudflareWorker] Failed — status=${workerStatus} body=${JSON.stringify(workerBody)}`);
        throw workerErr;
      }
    }
    throw directErr;
  }
}

async function scrapeViaWebSession(mediaId, shortcode) {
  const sessionId = getSessionId();
  if (!sessionId) return null;

  const cookieHeader = `sessionid=${sessionId}`;
  const browserAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/120.0.0.0 Safari/537.36';

  // Attempt A: Instagram mobile API with mediaId
  try {
    const res = await fetchWithFallback(
      `https://i.instagram.com/api/v1/media/${mediaId}/info/`,
      {
        Cookie: cookieHeader,
        'X-IG-App-ID': '936619743392459',
        'User-Agent': 'Instagram 278.0.0.19.115 Android (33/13; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 460516050)',
        Accept: '*/*',
        'Accept-Language': 'en-US',
      }
    );
    const item = res.data?.items?.[0];
    if (item) {
      const views = item.play_count ?? item.view_count ?? item.video_view_count ?? item.ig_play_count ?? 0;
      console.log(`[WebSession-A] got ${views} views`);
      return parseInt(views) || 0;
    }
  } catch (err) {
    console.log(`[WebSession-A] status=${err.response?.status} error=${err.message}`);
    // Don't return early on 403 — mobile API may be blocked but web page might still work
    if (err.response?.status === 401) return null;
  }

  // Attempt B: parse view count from the reel's HTML page
  try {
    const res = await fetchWithFallback(
      `https://www.instagram.com/reel/${shortcode}/`,
      {
        Cookie: cookieHeader,
        'User-Agent': browserAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.instagram.com/',
      }
    );
    const html = res.data;
    console.log(`[WebSession-B] got HTML length=${html.length}`);
    const patterns = [
      /"play_count":(\d+)/,
      /"video_view_count":(\d+)/,
      /"view_count":(\d+)/,
      /"ig_play_count":(\d+)/,
    ];
    for (const pattern of patterns) {
      const m = html.match(pattern);
      if (m) {
        console.log(`[WebSession-B] found ${m[1]} views`);
        return parseInt(m[1]);
      }
    }
    console.log('[WebSession-B] no view count found in HTML');
  } catch (err) {
    console.log(`[WebSession-B] status=${err.response?.status} error=${err.message}`);
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
  loadSessionFromSupabase,
  // kept for route compatibility (no-ops now)
  resolveChallenge: async () => ({ success: false, error: 'Not applicable' }),
  resendCode: async () => ({ success: false, error: 'Not applicable' }),
  resetLogin: () => {},
};
