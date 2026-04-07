const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');
const { scrapeReelViews } = require('../scraper/instaScraper');

// All routes require auth + client_user role
router.use(auth);
router.use((req, res, next) => {
  if (req.user.role !== 'client_user') {
    return res.status(403).json({ error: 'Client portal access required' });
  }
  next();
});

// POST /api/client-portal/sync  –  trigger fresh Instagram scrape for all client reels
router.post('/sync', async (req, res) => {
  try {
    const client_id = req.user.client_id;
    if (!client_id) return res.status(400).json({ error: 'No client linked to this account' });

    const { data: reels } = await supabase
      .from('reels')
      .select('id, reel_url, views')
      .eq('client_id', client_id)
      .eq('status', 'active');

    const count = reels?.length || 0;
    if (!count) return res.json({ message: 'No reels to sync', count: 0 });

    // Respond immediately — scrape runs in background
    res.json({ message: 'Sync started', count });

    for (const reel of reels) {
      try {
        const views = await scrapeReelViews(reel.reel_url);
        if (views !== null) {
          await supabase.from('reels')
            .update({ views, last_updated: new Date().toISOString() })
            .eq('id', reel.id);
          await supabase.from('view_history').insert([{ reel_id: reel.id, views }]);
          await supabase.from('sync_logs').insert([{
            reel_id: reel.id, status: 'success',
            message: 'Sync by client portal',
            views_before: reel.views, views_after: views,
          }]);
        }
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.error('[PortalSync] reel error:', e.message);
      }
    }
  } catch (err) {
    console.error('Client portal sync error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Sync failed' });
  }
});

// GET /api/client-portal/data  –  client sees their own data
router.get('/data', async (req, res) => {
  try {
    const client_id = req.user.client_id;
    if (!client_id) {
      return res.status(400).json({ error: 'No client linked to this account' });
    }

    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('id, name, rate_per_view, description')
      .eq('id', client_id)
      .single();

    if (clientErr || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const { data: reels } = await supabase
      .from('reel_earnings')
      .select('*')
      .eq('client_id', client_id)
      .order('created_at', { ascending: false });

    res.json({ client, reels: reels || [] });
  } catch (err) {
    console.error('Client portal data error:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

module.exports = router;
