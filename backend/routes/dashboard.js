const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');
const { Parser } = require('json2csv');

// GET /api/dashboard - Get dashboard stats
router.get('/', auth, async (req, res) => {
  try {
    const { data: clients, error: clientsError } = await supabase
      .from('client_summary')
      .select('*')
      .eq('user_id', req.user.id);

    if (clientsError) throw clientsError;

    const totalClients = clients.length;
    const totalReels = clients.reduce((sum, c) => sum + parseInt(c.total_reels || 0), 0);
    const totalViews = clients.reduce((sum, c) => sum + parseInt(c.total_views || 0), 0);
    const totalEarnings = clients.reduce((sum, c) => sum + parseFloat(c.total_earnings || 0), 0);

    res.json({
      overview: { totalClients, totalReels, totalViews, totalEarnings },
      clients
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/dashboard/export - Export as CSV
router.get('/export', auth, async (req, res) => {
  try {
    const { client_id, from, to } = req.query;

    const { data: userClients } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', req.user.id);

    const clientIds = (userClients || []).map(c => c.id);
    if (clientIds.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    let query = supabase
      .from('reel_earnings')
      .select('client_name, reel_url, views, earnings, rate_per_view, created_at, last_updated')
      .in('client_id', clientIds);

    if (client_id) query = query.eq('client_id', client_id);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    query = query.order('client_name').order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    const fields = [
      { label: 'Client Name', value: 'client_name' },
      { label: 'Reel URL', value: 'reel_url' },
      { label: 'Views', value: 'views' },
      { label: 'Rate Per View (₹)', value: 'rate_per_view' },
      { label: 'Earnings (₹)', value: 'earnings' },
      { label: 'Added On', value: 'created_at' },
      { label: 'Last Updated', value: 'last_updated' }
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(data || []);

    res.header('Content-Type', 'text/csv');
    res.attachment(`insta-tracker-export-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// GET /api/dashboard/monthly - Monthly summary
router.get('/monthly', auth, async (req, res) => {
  try {
    const { data: userClients } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', req.user.id);

    const clientIds = (userClients || []).map(c => c.id);

    const { data, error } = await supabase
      .from('view_history')
      .select('views, recorded_at, reel_id, reels!inner(client_id)')
      .in('reels.client_id', clientIds)
      .order('recorded_at', { ascending: true });

    if (error) throw error;

    // Group by month
    const monthly = {};
    (data || []).forEach(entry => {
      const month = entry.recorded_at.substring(0, 7); // YYYY-MM
      if (!monthly[month]) monthly[month] = { views: 0, count: 0 };
      monthly[month].views = Math.max(monthly[month].views, entry.views);
      monthly[month].count++;
    });

    res.json({ monthly });
  } catch (err) {
    console.error('Monthly summary error:', err);
    res.status(500).json({ error: 'Failed to fetch monthly data' });
  }
});

module.exports = router;
