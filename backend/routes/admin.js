const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const supabase = require('../supabase');
const { sendApprovalEmail, sendRejectionEmail } = require('../utils/mailer');

// All admin routes require auth + admin role
router.use(authMiddleware, requireAdmin);

// GET /api/admin/users  –  list all approved creator users with client count
router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, status, created_at')
      .eq('role', 'creator')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

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

// GET /api/admin/pending-users  –  list users awaiting approval
router.get('/pending-users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, status, created_at')
      .eq('role', 'creator')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ users: users || [] });
  } catch (err) {
    console.error('Pending users error:', err);
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

// POST /api/admin/users/:id/approve
router.post('/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, name, email, status')
      .eq('id', id)
      .single();

    if (fetchErr || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { error } = await supabase
      .from('users')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) throw error;

    // Notify the user (non-blocking)
    sendApprovalEmail({ name: user.name, email: user.email });

    res.json({ success: true, message: `${user.name} has been approved` });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// POST /api/admin/users/:id/reject
router.post('/users/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, name, email, status')
      .eq('id', id)
      .single();

    if (fetchErr || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { error } = await supabase
      .from('users')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) throw error;

    // Notify the user (non-blocking)
    sendRejectionEmail({ name: user.name, email: user.email });

    res.json({ success: true, message: `${user.name} has been rejected` });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

module.exports = router;
