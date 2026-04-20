const axios = require('axios');

// ─────────────────────────────────────────────────────────────
// Fetch with Cloudflare Worker fallback (same pattern as instaScraper)
// ─────────────────────────────────────────────────────────────
async function fetchWithFallback(targetUrl, headers) {
  try {
    const res = await axios.get(targetUrl, { headers, maxRedirects: 10, timeout: 20000 });
    return res;
  } catch (directErr) {
    const status = directErr.response?.status;
    const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
    const workerToken = process.env.CLOUDFLARE_WORKER_TOKEN;
    if (workerUrl && (status === 429 || status === 403 || status === 400 || !status)) {
      console.log(`[TikTok-Worker] Direct blocked (${status}) — retrying via Cloudflare edge`);
      const workerRes = await axios.post(
        workerUrl,
        { url: targetUrl, headers },
        {
          headers: {
            'X-Worker-Token': workerToken || '',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
      return workerRes;
    }
    throw directErr;
  }
}

// ─────────────────────────────────────────────────────────────
// Main TikTok scraper
// Handles full URLs (tiktok.com/@user/video/ID)
// AND short links (vm.tiktok.com/XXX, vt.tiktok.com/XXX)
// — axios follows redirects automatically (maxRedirects: 10)
// No login or session needed — TikTok pages are public
// ─────────────────────────────────────────────────────────────
async function scrapeTikTokViews(videoUrl) {
  console.log(`\n[TikTok] ▶ ${videoUrl}`);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.tiktok.com/',
  };

  try {
    const res = await fetchWithFallback(videoUrl, headers);
    const html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    console.log(`[TikTok] HTML length=${html.length}`);

    // Method A: __UNIVERSAL_DATA_FOR_REHYDRATION__ JSON blob
    const scriptMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
    if (scriptMatch) {
      try {
        const json = JSON.parse(scriptMatch[1]);
        const scope = json['__DEFAULT_SCOPE__'] || {};
        const videoDetail = scope['webapp.video-detail'];
        const itemStruct = videoDetail?.itemInfo?.itemStruct;
        // statsV2 uses string values (newer TikTok), stats uses numbers (older)
        const playCount = itemStruct?.statsV2?.playCount ?? itemStruct?.stats?.playCount;
        if (playCount !== undefined) {
          const views = parseInt(playCount);
          console.log(`[TikTok] ✅ UNIVERSAL_DATA → ${views} views`);
          return views;
        }
      } catch (_) {}
    }

    // Method B: SIGI_STATE JSON blob (older TikTok HTML structure)
    const sigiMatch = html.match(/window\['SIGI_STATE'\]\s*=\s*(\{[\s\S]*?\});\s*window\[/);
    if (sigiMatch) {
      try {
        const json = JSON.parse(sigiMatch[1]);
        const itemModule = json?.ItemModule || {};
        const firstItem = Object.values(itemModule)[0];
        const playCount = firstItem?.statsV2?.playCount ?? firstItem?.stats?.playCount;
        if (playCount !== undefined) {
          const views = parseInt(playCount);
          console.log(`[TikTok] ✅ SIGI_STATE → ${views} views`);
          return views;
        }
      } catch (_) {}
    }

    // Method C: regex fallback — handles both string and number values
    const patterns = [
      /"playCount"\s*:\s*"(\d+)"/,   // string value (new TikTok)
      /"playCount"\s*:\s*(\d+)/,      // number value (old TikTok)
      /"play_count"\s*:\s*"(\d+)"/,
      /"play_count"\s*:\s*(\d+)/,
      /"videoPlayCount"\s*:\s*"(\d+)"/,
      /"videoPlayCount"\s*:\s*(\d+)/,
    ];
    for (const pattern of patterns) {
      const m = html.match(pattern);
      if (m) {
        const views = parseInt(m[1]);
        console.log(`[TikTok] ✅ Regex → ${views} views`);
        return views;
      }
    }

    // Debug: inspect UNIVERSAL_DATA structure
    const scriptMatch2 = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
    if (scriptMatch2) {
      try {
        const json = JSON.parse(scriptMatch2[1]);
        const scope = json['__DEFAULT_SCOPE__'] || {};
        console.log(`[TikTok] Debug — scope keys=${Object.keys(scope).join(',')}`);
        const videoDetail = scope['webapp.video-detail'];
        console.log(`[TikTok] Debug — videoDetail keys=${videoDetail ? Object.keys(videoDetail).join(',') : 'undefined'}`);
        const itemInfo = videoDetail?.itemInfo;
        console.log(`[TikTok] Debug — itemInfo keys=${itemInfo ? Object.keys(itemInfo).join(',') : 'undefined'}`);
        const itemStruct = itemInfo?.itemStruct;
        console.log(`[TikTok] Debug — itemStruct=${itemStruct ? JSON.stringify(itemStruct).slice(0, 300) : 'undefined'}`);
      } catch (e) {
        console.log(`[TikTok] Debug — parse error: ${e.message}`);
      }
    }

    console.log('[TikTok] ❌ No view count found in HTML');
    return null;
  } catch (err) {
    console.log(`[TikTok] ❌ Error: ${err.message}`);
    return null;
  }
}

module.exports = { scrapeTikTokViews };
