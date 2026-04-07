require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const supabase = require('./supabase');
const { startSyncJob } = require('./jobs/syncViews');

const app = express();
const PORT = process.env.PORT || 5000;

// Seed admin user on startup
async function seedAdmin() {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', 'admin@gmail.com')
      .single();

    if (!existing) {
      const hash = await bcrypt.hash('admin@123', 12);
      await supabase.from('users').insert([{
        name: 'Admin',
        email: 'admin@gmail.com',
        password_hash: hash,
        role: 'admin',
      }]);
      console.log('✅ Admin user created: admin@gmail.com');
    } else if (existing.role !== 'admin') {
      await supabase.from('users').update({ role: 'admin' }).eq('email', 'admin@gmail.com');
      console.log('✅ Admin role restored for admin@gmail.com');
    }
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
}

// Middleware
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/creator', require('./routes/creator'));
app.use('/api/client-portal', require('./routes/client-portal'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/reels', require('./routes/reels'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/scraper', require('./routes/scraper'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Instagram Reel Tracker Backend Ready\n`);

  // Seed admin user
  await seedAdmin();

  // Start background sync job
  startSyncJob();
});

module.exports = app;
