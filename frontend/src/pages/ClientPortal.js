import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CurrencyDropdown from '../components/CurrencyDropdown';
import API from '../utils/api';
import { formatViews, formatCurrency, exactViews, exactCurrency, timeAgo } from '../utils/format';
import { useCurrency } from '../hooks/useCurrency';

const FORMAT_OPTIONS = [
  { value: 'indian', label: '🇮🇳 Indian',        desc: 'L / Cr'    },
  { value: 'intl',   label: '🌐 International', desc: 'K / M / B' },
  { value: 'exact',  label: '# Exact',           desc: 'Raw number' },
];

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '14px', padding: '20px 22px',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
        <div style={{
          width: '34px', height: '34px', borderRadius: '9px',
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px',
        }}>{icon}</div>
      </div>
      <div style={{ fontSize: '26px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>{sub}</div>}
    </div>
  );
}

const AUTO_REFRESH_MS = 3 * 60 * 1000; // silent re-read every 3 min

export default function ClientPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { currency, changeCurrency, exchangeRate, lastUpdated, loading: currencyLoading } = useCurrency();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [syncing, setSyncing]     = useState(false);  // full Instagram scrape in progress
  const [syncMsg, setSyncMsg]     = useState(null);   // { text, ok }
  const [lastSynced, setLastSynced] = useState(null);
  const [fmt, setFmt]             = useState(() => localStorage.getItem('numFmt') || 'indian');
  const [theme, setTheme]         = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Just re-read DB (silent, no Instagram call)
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await API.get('/client-portal/data');
      setData(r.data);
      setLastSynced(new Date());
    } catch {}
    finally { setLoading(false); }
  };

  // Trigger real Instagram scrape for all reels, then poll for updates
  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await API.post('/client-portal/sync');
      const count = res.data.count || 0;
      if (!count) {
        setSyncMsg({ text: 'No reels to sync', ok: true });
        setSyncing(false);
        return;
      }
      setSyncMsg({ text: `Syncing ${count} reel${count > 1 ? 's' : ''} from Instagram…`, ok: true });

      const syncStartTime = Date.now();

      const poll = setInterval(async () => {
        try {
          const r = await API.get('/client-portal/data');
          setData(r.data);
          setLastSynced(new Date());

          const fresh = r.data.reels || [];
          const doneCount = fresh.filter(
            reel => new Date(reel.last_updated).getTime() > syncStartTime
          ).length;

          if (doneCount >= count || Date.now() - syncStartTime > 40000) {
            clearInterval(poll);
            setSyncing(false);
            setSyncMsg({ text: `Sync complete — ${doneCount} of ${count} updated`, ok: true });
            setTimeout(() => setSyncMsg(null), 5000);
          }
        } catch {
          clearInterval(poll);
          setSyncing(false);
        }
      }, 2000);
    } catch (err) {
      setSyncMsg({ text: err.response?.data?.error || 'Sync failed', ok: false });
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  // Initial load + silent auto-refresh every 3 minutes
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const { client, reels = [] } = data || {};
  const totalViews    = reels.reduce((s, r) => s + (Number(r.views) || 0), 0);
  const totalEarnings = reels.reduce((s, r) => s + (parseFloat(r.earnings) || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top navbar */}
      <header style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        padding: '0 16px', height: '58px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50, gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
            background: 'var(--gradient)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '15px',
          }}>📸</div>
          <div style={{ display: 'none' }} className="portal-brand">
            <div style={{ fontWeight: 700, fontSize: '14px' }}>InstaTracker</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Client Portal</div>
          </div>
          {client && (
            <span style={{
              fontSize: '12px', fontWeight: 600,
              background: 'rgba(225,48,108,0.12)', color: 'var(--primary)',
              border: '1px solid rgba(225,48,108,0.25)',
              borderRadius: '20px', padding: '3px 10px',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px',
            }}>
              {client.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {lastSynced && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'none' }} className="portal-updated">
              Updated {lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSync}
            disabled={syncing}
            title="Fetch fresh view counts from Instagram for all your reels"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            {syncing
              ? <><span className="spinner" style={{ width: 11, height: 11 }} /> Syncing…</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg> Sync</>
            }
          </button>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '17px', color: 'var(--text-secondary)', padding: '4px' }}
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 58px)' }}>
          <span className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : (
        <div className="page-pad-sm" style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Client info header */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '14px',
                background: 'var(--gradient)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', fontWeight: 700, color: '#fff',
              }}>
                {client?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800 }}>{client?.name}</h1>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Rate: <strong style={{ color: 'var(--primary)' }}>₹{client?.rate_per_view} per view</strong>
                  {client?.description && (
                    <span style={{ marginLeft: '14px' }}>{client.description}</span>
                  )}
                </div>
              </div>

              {/* Format & Currency selectors */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <CurrencyDropdown 
                  currency={currency} 
                  onChange={changeCurrency} 
                  exchangeRate={exchangeRate}
                  loading={currencyLoading}
                  lastUpdated={lastUpdated}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Display:</span>
                  <select
                    value={fmt}
                    onChange={e => { setFmt(e.target.value); localStorage.setItem('numFmt', e.target.value); }}
                    style={{
                      background: 'var(--bg-card2)', border: '1px solid var(--border)',
                      borderRadius: '7px', padding: '5px 10px', fontSize: '12px',
                      color: 'var(--text)', cursor: 'pointer', outline: 'none',
                    }}
                  >
                    {FORMAT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label} ({o.desc})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Sync message */}
          {syncMsg && (
            <div className={`alert ${syncMsg.ok ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '20px' }}>
              {syncMsg.text}
            </div>
          )}

          {/* Stat cards */}
          <div className="grid-3" style={{ marginBottom: '28px' }}>
            <StatCard icon="🎬" label="Total Reels"    color="#833AB4"
              value={reels.length.toString()} />
            <StatCard icon="👁️" label="Total Views"    color="#F77737"
              value={formatViews(totalViews, fmt)}
              sub={fmt !== 'exact' ? exactViews(totalViews) : null} />
            <StatCard icon="💰" label="Total Earnings" color="#22c55e"
              value={formatCurrency(totalEarnings, fmt, currency, exchangeRate)}
              sub={fmt !== 'exact' ? exactCurrency(totalEarnings, currency, exchangeRate) : null} />
          </div>

          {/* Reels table */}
          <div className="card">
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px' }}>
              Your Reels
              <span style={{
                marginLeft: '10px', fontSize: '12px', fontWeight: 400,
                color: 'var(--text-muted)',
              }}>
                (read-only · auto-updated every 3 hours)
              </span>
            </h2>

            {reels.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎬</div>
                <div className="empty-state-title">No reels tracked yet</div>
                <div className="empty-state-desc">Your reels will appear here once your creator adds them</div>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ minWidth: '600px' }}>
                    <thead>
                      <tr>
                        <th>Reel</th>
                        <th>
                          Views
                          <span style={{ fontSize: '10px', background: 'var(--bg-card2)', padding: '1px 5px', borderRadius: '4px', fontWeight: 400, marginLeft: '5px' }}>
                            {FORMAT_OPTIONS.find(o => o.value === fmt)?.desc}
                          </span>
                        </th>
                        <th>Earnings</th>
                        <th>Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reels.map((reel, i) => {
                        const short = reel.reel_url.replace('https://www.', '').replace('https://', '').split('?')[0];
                        return (
                          <tr key={reel.id}>
                            <td style={{ maxWidth: '280px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>#{i + 1}</div>
                              <a
                                href={reel.reel_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: 'var(--primary)', fontSize: '12px',
                                  display: 'block', overflow: 'hidden',
                                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}
                                title={reel.reel_url}
                              >
                                {short}
                              </a>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: '15px', color: '#F77737' }}>
                                {formatViews(reel.views, fmt)}
                              </div>
                              {fmt !== 'exact' && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                                  {exactViews(reel.views)}
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--success)' }}>
                                {formatCurrency(reel.earnings, fmt, currency, exchangeRate)}
                              </div>
                              {fmt !== 'exact' && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                                  {exactCurrency(reel.earnings, currency, exchangeRate)}
                                </div>
                              )}
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {timeAgo(reel.last_updated)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer totals */}
                <div style={{
                  marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'flex-end', gap: '28px',
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Views</div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#F77737' }}>{formatViews(totalViews, fmt)}</div>
                    {fmt !== 'exact' && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{exactViews(totalViews)}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Earnings</div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--success)' }}>{formatCurrency(totalEarnings, fmt, currency, exchangeRate)}</div>
                    {fmt !== 'exact' && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{exactCurrency(totalEarnings, currency, exchangeRate)}</div>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
