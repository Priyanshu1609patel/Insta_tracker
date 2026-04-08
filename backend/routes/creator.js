const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../supabase');
const auth = require('../middleware/auth');

// All routes require auth + creator role
router.use(auth);
router.use((req, res, next) => {
  if (req.user.role !== 'creator') {
    return res.status(403).json({ error: 'Creator access required' });
  }
  next();
});

// GET /api/creator/users  –  list client users created by this creator
router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, client_id, created_at')
      .eq('created_by', req.user.id)
      .eq('role', 'client_user')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Resolve client names
    const clientIds = [...new Set((users || []).map(u => u.client_id).filter(Boolean))];
    let clientMap = {};
    if (clientIds.length) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds);
      (clients || []).forEach(c => { clientMap[c.id] = c.name; });
    }

    res.json({
      users: (users || []).map(u => ({ ...u, client_name: clientMap[u.client_id] || '—' })),
    });
  } catch (err) {
    console.error('Creator users list error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/creator/users  –  create a new client user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, client_id } = req.body;

    if (!name || !email || !password || !client_id) {
      return res.status(400).json({ error: 'Name, email, password and client are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verify client belongs to this creator
    const { data: client } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', client_id)
      .eq('user_id', req.user.id)
      .single();

    if (!client) {
      return res.status(403).json({ error: 'Client not found or does not belong to you' });
    }

    // Email uniqueness check
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        name,
        email: email.toLowerCase(),
        password_hash,
        role: 'client_user',
        client_id,
        created_by: req.user.id,
      }])
      .select('id, name, email, client_id, created_at')
      .single();

    if (error) throw error;

    res.status(201).json({ user: { ...user, client_name: client.name } });
  } catch (err) {
    console.error('Create client user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// DELETE /api/creator/users/:id  –  remove a client user
router.delete('/users/:id', async (req, res) => {
  try {
    const { data: target } = await supabase
      .from('users')
      .select('id')
      .eq('id', req.params.id)
      .eq('created_by', req.user.id)
      .eq('role', 'client_user')
      .single();

    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    await supabase.from('users').delete().eq('id', req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete client user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// PUT /api/creator/users/:id/password  –  update user password
router.put('/users/:id/password', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verify user belongs to this creator
    const { data: target } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', req.params.id)
      .eq('created_by', req.user.id)
      .eq('role', 'client_user')
      .single();

    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { error } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: `Password updated for ${target.name}` });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;
