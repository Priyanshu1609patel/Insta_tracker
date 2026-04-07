import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

// ── Instagram Session Banner (same as before) ────────────────
function getSessionTheme(health) {
  if (!health) return { bg: 'var(--banner-success-bg)', border: 'var(--banner-success-border)', textColor: 'var(--banner-success-text)', icon: '✅', label: 'Active' };
  if (!health.valid) return { bg: 'var(--banner-error-bg)', border: 'var(--banner-error-border)', textColor: 'var(--banner-error-text)', icon: '❌', label: 'Expired' };
  const days = health.daysRemaining;
  if (days != null && days <= 7)  return { bg: 'var(--alert-error-bg)',   border: 'var(--alert-error-border)',   textColor: 'var(--alert-error-text)',   icon: '🚨', label: 'Expires very soon' };
  if (days != null && days <= 15) return { bg: 'var(--alert-warning-bg)', border: 'var(--alert-warning-border)', textColor: 'var(--alert-warning-text)', icon: '⚠️', label: 'Expires soon' };
  return { bg: 'var(--banner-success-bg)', border: 'var(--banner-success-border)', textColor: 'var(--banner-success-text)', icon: '✅', label: 'Active' };
}

function InstagramScraperCard() {
  const [status, setStatus]   = useState(null);
  const [health, setHealth]   = useState(null);
  const [testing, setTesting] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [msg, setMsg]         = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadHealth = (force = false) =>
    API.get(`/scraper/check${force ? '?force=true' : ''}`).then(h => setHealth(h.data)).catch(() => {});

  useEffect(() => {
    API.get('/scraper/status').then(r => {
      setStatus(r.data);
      if (r.data?.hasSession) loadHealth();
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!status?.hasSession) return;
    const id = setInterval(() => loadHealth(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [status?.hasSession]);

  const handleTest = async () => {
    setTesting(true);
    await loadHealth(true);
    setTesting(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      const res = await API.post('/scraper/session', { sessionId });
      setMsg(res.data.message);
      setShowForm(false); setSessionId('');
      const r = await API.get('/scraper/status');
      setStatus(r.data);
      loadHealth();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Failed to save'));
    } finally { setLoading(false); }
  };

  if (status?.hasSession) {
    const theme = getSessionTheme(health);
    const days  = health?.daysRemaining;

    return (
      <div style={{
        background: theme.bg, border: `1px solid ${theme.border}`,
        borderRadius: '12px', padding: '16px 20px', marginBottom: '28px',
        color: theme.textColor,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{theme.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>
                Instagram Scraper {theme.label}
                {health?.username ? <span style={{ fontWeight: 400, marginLeft: '6px' }}>— @{health.username}</span> : ''}
              </div>
              <div style={{ fontSize: '12px', marginTop: '2px', opacity: 0.85 }}>
                {days != null ? (
                  <>
                    Session saved: {new Date(health.savedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    &nbsp;·&nbsp;
                    <strong style={{ color: days <= 7 ? 'var(--alert-error-text)' : days <= 15 ? 'var(--alert-warning-text)' : 'inherit' }}>
                      ~{days} days remaining
                    </strong>
                    &nbsp;·&nbsp;
                    Last checked: {new Date(health.lastChecked).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </>
                ) : (
                  'Session active · ~90 day lifetime'
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleTest}
              disabled={testing}
              title="Make a live call to Instagram to verify session right now"
            >
              {testing ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '🔍 Test Now'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(v => !v)}>
              🔄 Update Session
            </button>
          </div>
        </div>

        {days != null && days <= 15 && (
          <div style={{
            marginTop: '12px', padding: '10px 14px',
            background: days <= 7 ? 'var(--alert-error-bg)' : 'var(--alert-warning-bg)',
            border: `1px solid ${days <= 7 ? 'var(--alert-error-border)' : 'var(--alert-warning-border)'}`,
            borderRadius: '8px', fontSize: '13px',
            color: days <= 7 ? 'var(--alert-error-text)' : 'var(--alert-warning-text)',
          }}>
            {days <= 7
              ? '🚨 Session expiring in less than a week! Update it now to avoid scraping failures for your clients.'
              : '⚠️ Session expiring soon. Refresh your Instagram sessionid cookie before it expires.'}
            <div style={{ marginTop: '6px', fontSize: '12px', opacity: 0.8 }}>
              Go to instagram.com → F12 → Application → Cookies → copy <strong>sessionid</strong> → click "Update Session"
            </div>
          </div>
        )}

        {health?.valid === false && (
          <div className="alert alert-error" style={{ marginTop: '12px', marginBottom: 0 }}>
            ❌ Session expired or rejected by Instagram. Please paste a fresh sessionid to restore scraping.
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSave} style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              className="input"
              placeholder="Paste new sessionid cookie value"
              value={sessionId}
              onChange={e => setSessionId(e.target.value)}
              style={{ flex: 1, minWidth: '260px' }}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Save'}
            </button>
          </form>
        )}
        {msg && (
          <div className={`alert ${msg.startsWith('❌') ? 'alert-error' : 'alert-success'}`}
            style={{ marginTop: '10px', marginBottom: 0 }}>
            {msg}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--banner-error-bg)', border: '1px solid var(--banner-error-border)',
      borderRadius: '12px', padding: '20px', marginBottom: '28px',
      color: 'var(--banner-error-text)'
    }}>
      <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
        🔐 Connect Instagram (One-Time Setup)
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.8' }}>
        1. Open <strong>instagram.com</strong> in Chrome and log in<br />
        2. Press <strong>F12</strong> → Application → Cookies → <code>https://www.instagram.com</code><br />
        3. Find the cookie named <strong>sessionid</strong> and copy its value<br />
        4. Paste it below — session lasts ~90 days, renew when prompted.
      </div>
      {msg && (
        <div className={`alert ${msg.startsWith('❌') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '12px' }}>
          {msg}
        </div>
      )}
      <form onSubmit={handleSave} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Paste your Instagram sessionid cookie value"
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          style={{ flex: 1, minWidth: '280px' }}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Activate Scraper'}
        </button>
      </form>
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────
export default function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    API.get('/admin/users')
      .then(r => setUsers(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px', background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: 'var(--gradient)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '17px',
            }}>📸</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>InstaTracker</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 7px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 11px', borderRadius: '8px',
            background: 'rgba(225,48,108,0.13)', color: 'var(--primary)',
            fontWeight: 600, fontSize: '13px',
          }}>
            <span style={{ fontSize: '17px' }}>👑</span>
            <span>Admin Panel</span>
          </div>
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px 7px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => { const t = theme === 'dark' ? 'light' : 'dark'; setTheme(t); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 11px', borderRadius: '8px', width: '100%',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px',
            }}
          >
            <span style={{ fontSize: '17px' }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div style={{ padding: '7px 11px', marginBottom: '4px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{user?.name}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{user?.email}</div>
            <div style={{ fontSize: '10px', color: 'var(--primary)', marginTop: '2px', fontWeight: 600 }}>Admin</div>
          </div>

          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 11px', borderRadius: '8px', width: '100%',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--danger)', fontSize: '13px',
          }}>
            <span style={{ fontSize: '17px' }}>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)', padding: '32px' }}>
        <div style={{ maxWidth: '1000px' }}>
          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Admin Panel</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Manage Instagram scraper session and monitor creator accounts
            </p>
          </div>

          {/* Scraper Status */}
          <InstagramScraperCard />

          {/* Creator Users */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>
                Creator Accounts
                <span style={{
                  marginLeft: '10px', fontSize: '12px', fontWeight: 500,
                  background: 'var(--bg-card2)', border: '1px solid var(--border)',
                  borderRadius: '20px', padding: '2px 9px', color: 'var(--text-muted)',
                }}>
                  {users.length} registered
                </span>
              </h2>
            </div>

            {loadingUsers ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <span className="spinner" style={{ width: 32, height: 32 }} />
              </div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <div className="empty-state-title">No creators yet</div>
                <div className="empty-state-desc">Users who register will appear here</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Clients</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{i + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: 'var(--gradient)', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontWeight: 700, fontSize: '13px', flexShrink: 0,
                            }}>
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{u.email}</td>
                        <td>
                          <span className="badge" style={{ background: 'rgba(131,58,180,0.15)', color: '#c084fc' }}>
                            {u.clientCount} {u.clientCount === 1 ? 'client' : 'clients'}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                            creator
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {new Date(u.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
