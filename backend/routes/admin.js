const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const supabase = require('../supabase');

// All admin routes require auth + admin role
router.use(authMiddleware, requireAdmin);

// GET /api/admin/users  –  list all creator users with client count
router.get('/users', async (req, res) => {
  try {
    // Fetch all creator users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('role', 'creator')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch client counts per user
    const { data: clientCounts } = await supabase
      .from('clients')
      .select('user_id');

    const countMap = {};
    (clientCounts || []).forEach(c => {
      countMap[c.user_id] = (countMap[c.user_id] || 0) + 1;
    });

    const result = (users || []).map(u => ({
      ...u,
      clientCount: countMap[u.id] || 0,
    }));

    res.json({ users: result });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
