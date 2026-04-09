const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');
const { scrapeReelViews } = require('../scraper/instaScraper');
const { scrapeTikTokViews } = require('../scraper/tiktokScraper');

function detectPlatform(url) {
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  return 'instagram';
}

function scrapeViews(url) {
  return detectPlatform(url) === 'tiktok' ? scrapeTikTokViews(url) : scrapeReelViews(url);
}

// GET /api/reels - Get all reels (optionally filter by client)
router.get('/', auth, async (req, res) => {
  try {
    const { client_id, from, to } = req.query;

    let query = supabase
      .from('reel_earnings')
      .select('*');

    if (client_id) {
      query = query.eq('client_id', client_id);
    }

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      query = query.lte('created_at', to);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    // Filter reels by user's clients
    const { data: userClients } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', req.user.id);

    const clientIds = (userClients || []).map(c => c.id);
    const filtered = (data || []).filter(r => clientIds.includes(r.client_id));

    res.json({ reels: filtered });
  } catch (err) {
    console.error('Get reels error:', err);
    res.status(500).json({ error: 'Failed to fetch reels' });
  }
});

// POST /api/reels - Add a new reel
router.post('/', auth, async (req, res) => {
  try {
    const { client_id, reel_url, reel_date } = req.body;

    if (!client_id || !reel_url || !reel_date) {
      return res.status(400).json({ error: 'client_id, reel_url, and reel_date are required' });
    }

    // Validate reel_date is not in the future
    const todayStr = new Date().toISOString().split('T')[0];
    if (reel_date > todayStr) {
      return res.status(400).json({ error: 'Date cannot be in the future' });
    }

    // Verify client belongs to user
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .eq('user_id', req.user.id)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Validate Instagram or TikTok URL
    const platform = detectPlatform(reel_url);
    if (!reel_url.includes('instagram.com') && !reel_url.includes('tiktok.com')) {
      return res.status(400).json({ error: 'Please provide a valid Instagram or TikTok URL' });
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from('reels')
      .select('id')
      .eq('client_id', client_id)
      .eq('reel_url', reel_url)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'This reel URL is already added for this client' });
    }

    // Save reel first
    const { data: reel, error } = await supabase
      .from('reels')
      .insert([{ client_id, reel_url, views: 0, reel_date, platform }])
      .select()
      .single();

    if (error) throw error;

    // Try to scrape views in background
    res.status(201).json({ reel, message: 'Reel added. Views will be fetched shortly.' });

    // Scrape async after response
    scrapeViews(reel_url).then(async (views) => {
      if (views !== null) {
        await supabase
          .from('reels')
          .update({ views, last_updated: new Date().toISOString() })
          .eq('id', reel.id);

        await supabase.from('view_history').insert([{ reel_id: reel.id, views }]);

        await supabase.from('sync_logs').insert([{
          reel_id: reel.id,
          status: 'success',
          message: 'Initial scrape successful',
          views_before: 0,
          views_after: views
        }]);
      }
    }).catch(err => console.error('Background scrape error:', err));

  } catch (err) {
    console.error('Add reel error:', err);
    res.status(500).json({ error: 'Failed to add reel' });
  }
});

// POST /api/reels/sync-client - Sync all reels for a client (batch, background)
router.post('/sync-client', auth, async (req, res) => {
  try {
    const { client_id } = req.body;
    if (!client_id) return res.status(400).json({ error: 'client_id is required' });

    // Verify client belongs to this user
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .eq('user_id', req.user.id)
      .single();

    if (!client) return res.status(404).json({ error: 'Client not found' });

    const { data: reels } = await supabase
      .from('reels')
      .select('id, reel_url, views')
      .eq('client_id', client_id)
      .eq('status', 'active');

    const count = reels?.length || 0;
    if (!count) return res.json({ message: 'No reels to sync', count: 0 });

    // Respond immediately — scrape runs in background
    res.json({ message: 'Sync started', count });

    let consecutiveFails = 0;
    for (const reel of reels) {
      if (consecutiveFails >= 3) {
        console.log('[BatchSync] 3 consecutive failures — stopping batch.');
        break;
      }
      try {
        const views = await scrapeViews(reel.reel_url);
        if (views !== null) {
          consecutiveFails = 0;
          await supabase.from('reels')
            .update({ views, last_updated: new Date().toISOString() })
            .eq('id', reel.id);
          await supabase.from('view_history').insert([{ reel_id: reel.id, views }]);
          await supabase.from('sync_logs').insert([{
            reel_id: reel.id, status: 'success',
            message: 'Batch sync by creator',
            views_before: reel.views, views_after: views,
          }]);
        } else {
          consecutiveFails++;
        }
        // Delay between reels to avoid Instagram rate limiting
        await new Promise(r => setTimeout(r, 3000 + Math.random() * 3000));
      } catch (e) {
        consecutiveFails++;
        console.error('[BatchSync] reel error:', e.message);
      }
    }
  } catch (err) {
    console.error('Sync-client error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Sync failed' });
  }
});

// POST /api/reels/:id/sync - Manually sync a reel's views
router.post('/:id/sync', auth, async (req, res) => {
  try {
    const { data: reel, error: reelError } = await supabase
      .from('reels')
      .select('*, clients!inner(user_id)')
      .eq('id', req.params.id)
      .single();

    if (reelError || !reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    if (reel.clients.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const views = await scrapeViews(reel.reel_url);

    if (views === null) {
      await supabase.from('sync_logs').insert([{
        reel_id: reel.id,
        status: 'failed',
        message: 'Failed to scrape views'
      }]);
      const platformLabel = detectPlatform(reel.reel_url) === 'tiktok' ? 'TikTok' : 'Instagram';
      return res.status(500).json({ error: `Failed to fetch views from ${platformLabel}` });
    }

    const viewsBefore = reel.views;

    await supabase
      .from('reels')
      .update({ views, last_updated: new Date().toISOString() })
      .eq('id', reel.id);

    await supabase.from('view_history').insert([{ reel_id: reel.id, views }]);

    await supabase.from('sync_logs').insert([{
      reel_id: reel.id,
      status: 'success',
      message: 'Manual sync successful',
      views_before: viewsBefore,
      views_after: views
    }]);

    res.json({ message: 'Views synced successfully', views });
  } catch (err) {
    console.error('Sync reel error:', err);
    res.status(500).json({ error: 'Failed to sync reel' });
  }
});

// GET /api/reels/:id/history - Get view history for charts
router.get('/:id/history', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('view_history')
      .select('views, recorded_at')
      .eq('reel_id', req.params.id)
      .order('recorded_at', { ascending: true });

    if (error) throw error;
    res.json({ history: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// PUT /api/reels/:id/views - Manually update view count
router.put('/:id/views', auth, async (req, res) => {
  try {
    const { views } = req.body;

    if (views === undefined || isNaN(views) || parseInt(views) < 0) {
      return res.status(400).json({ error: 'Valid view count is required' });
    }

    const { data: reel } = await supabase
      .from('reels')
      .select('*, clients!inner(user_id)')
      .eq('id', req.params.id)
      .single();

    if (!reel || reel.clients.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    const viewCount = parseInt(views);

    await supabase
      .from('reels')
      .update({ views: viewCount, last_updated: new Date().toISOString() })
      .eq('id', req.params.id);

    await supabase.from('view_history').insert([{ reel_id: reel.id, views: viewCount }]);

    await supabase.from('sync_logs').insert([{
      reel_id: reel.id,
      status: 'manual',
      message: 'Manually updated by user',
      views_before: reel.views,
      views_after: viewCount
    }]);

    res.json({ message: 'Views updated successfully', views: viewCount });
  } catch (err) {
    console.error('Manual update error:', err);
    res.status(500).json({ error: 'Failed to update views' });
  }
});

// PUT /api/reels/:id/date - Update reel date
router.put('/:id/date', auth, async (req, res) => {
  try {
    const { reel_date } = req.body;

    if (!reel_date) {
      return res.status(400).json({ error: 'reel_date is required' });
    }

    // Validate not in the future
    const todayStr = new Date().toISOString().split('T')[0];
    if (reel_date > todayStr) {
      return res.status(400).json({ error: 'Date cannot be in the future' });
    }

    const { data: reel } = await supabase
      .from('reels')
      .select('*, clients!inner(user_id)')
      .eq('id', req.params.id)
      .single();

    if (!reel || reel.clients.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    await supabase
      .from('reels')
      .update({ reel_date })
      .eq('id', req.params.id);

    res.json({ message: 'Date updated successfully', reel_date });
  } catch (err) {
    console.error('Update date error:', err);
    res.status(500).json({ error: 'Failed to update date' });
  }
});

// DELETE /api/reels/:id - Delete a reel
router.delete('/:id', auth, async (req, res) => {
  try {
    const { data: reel } = await supabase
      .from('reels')
      .select('*, clients!inner(user_id)')
      .eq('id', req.params.id)
      .single();

    if (!reel || reel.clients.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    await supabase.from('reels').delete().eq('id', req.params.id);
    res.json({ message: 'Reel deleted successfully' });
  } catch (err) {
    console.error('Delete reel error:', err);
    res.status(500).json({ error: 'Failed to delete reel' });
  }
});

module.exports = router;
