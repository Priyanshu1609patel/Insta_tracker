/**
 * Cloudflare Worker — Instagram proxy
 *
 * Receives POST { url, headers } from backend,
 * fetches the target URL using Cloudflare's edge IPs,
 * and returns the raw response back.
 */
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const token = request.headers.get('X-Worker-Token');
    if (!token || token !== env.WORKER_TOKEN) {
      return new Response('Unauthorized', { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON body', { status: 400 });
    }

    const { url, headers } = body;
    if (!url) {
      return new Response('Missing url in body', { status: 400 });
    }

    // Strip headers that Cloudflare Workers forbid forwarding
    const safeHeaders = {};
    const forbidden = ['host', 'content-length', 'transfer-encoding', 'connection', 'keep-alive', 'upgrade', 'te', 'trailer'];
    for (const [key, value] of Object.entries(headers || {})) {
      if (!forbidden.includes(key.toLowerCase())) {
        safeHeaders[key] = value;
      }
    }

    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: safeHeaders,
        redirect: 'follow',
        cf: {
          cacheTtl: 0,
          cacheEverything: false,
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ workerError: err.message, url }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const contentType = response.headers.get('Content-Type') || 'text/plain';
    const responseBody = await response.text();

    // If Instagram returned an error status, still pass it through
    // so the backend knows what happened
    return new Response(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'X-Instagram-Status': String(response.status),
      },
    });
  },
};
