const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');

// GET /api/clients - Get all clients for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('client_summary')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ clients: data });
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/clients/:id - Get single client with reels
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const { data: reels } = await supabase
      .from('reel_earnings')
      .select('*')
      .eq('client_id', req.params.id)
      .order('created_at', { ascending: false });

    res.json({ client, reels: reels || [] });
  } catch (err) {
    console.error('Get client error:', err);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// POST /api/clients - Create client
router.post('/', auth, async (req, res) => {
  try {
    const { name, rate_per_view, description } = req.body;

    if (!name || !rate_per_view) {
      return res.status(400).json({ error: 'Name and rate_per_view are required' });
    }

    if (isNaN(rate_per_view) || rate_per_view < 0) {
      return res.status(400).json({ error: 'rate_per_view must be a positive number' });
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([{ name, rate_per_view: parseFloat(rate_per_view), description, user_id: req.user.id }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ client: data });
  } catch (err) {
    console.error('Create client error:', err);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id - Update client
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, rate_per_view, description } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (rate_per_view !== undefined) updates.rate_per_view = parseFloat(rate_per_view);
    if (description !== undefined) updates.description = description;

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Client not found' });

    res.json({ client: data });
  } catch (err) {
    console.error('Update client error:', err);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;
