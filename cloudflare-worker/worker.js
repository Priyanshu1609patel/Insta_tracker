/**
 * Cloudflare Worker — Instagram proxy
 *
 * Receives POST { url, headers } from Render backend,
 * fetches the target URL using Cloudflare's edge IPs,
 * and returns the raw response back to Render.
 *
 * Deploy: https://dash.cloudflare.com → Workers → Create Worker → paste this code
 * Set env var WORKER_TOKEN to a random secret string (same value goes in Render env)
 */
export default {
  async fetch(request, env) {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Validate secret token to prevent abuse
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

    // Fetch from Instagram using Cloudflare's IPs
    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: headers || {},
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Pass through the response body and content-type
    const contentType = response.headers.get('Content-Type') || 'text/plain';
    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: { 'Content-Type': contentType },
    });
  },
};
