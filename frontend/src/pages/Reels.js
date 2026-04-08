import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import API from '../utils/api';
import { formatViews, formatCurrency, timeAgo } from '../utils/format';

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClient, setFilterClient] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [syncingId, setSyncingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterClient) params.client_id = filterClient;
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;

      const [reelsRes, clientsRes] = await Promise.all([
        API.get('/reels', { params }),
        API.get('/clients')
      ]);

      setReels(reelsRes.data.reels || []);
      setClients(clientsRes.data.clients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterClient, filterFrom, filterTo]);

  const handleSync = async (reelId) => {
    setSyncingId(reelId);
    try {
      const res = await API.post(`/reels/${reelId}/sync`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (reelId) => {
    if (!window.confirm('Delete this reel?')) return;
    try {
      await API.delete(`/reels/${reelId}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete reel');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (filterClient) params.client_id = filterClient;
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;

      const res = await API.get('/dashboard/export', { params, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reels-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const totalViews = reels.reduce((s, r) => s + (r.views || 0), 0);
  const totalEarnings = reels.reduce((s, r) => s + (r.earnings || 0), 0);

  return (
    <Layout>
      <div className="page-pad" style={{ maxWidth: '1200px' }}>
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800 }}>All Reels</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              {reels.length} reels · {formatViews(totalViews)} views · {formatCurrency(totalEarnings)} earned
            </p>
          </div>
          <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? <span className="spinner" /> : '⬇️'} Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label className="form-label">Filter by Client</label>
              <select
                className="input"
                value={filterClient}
                onChange={e => setFilterClient(e.target.value)}
              >
                <option value="">All Clients</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label className="form-label">From Date</label>
              <input
                type="date"
                className="input"
                value={filterFrom}
                onChange={e => setFilterFrom(e.target.value)}
              />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label className="form-label">To Date</label>
              <input
                type="date"
                className="input"
                value={filterTo}
                onChange={e => setFilterTo(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary" onClick={() => {
              setFilterClient(''); setFilterFrom(''); setFilterTo('');
            }}>
              Clear
            </button>
          </div>
        </div>

        {/* Reels table */}
        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <span className="spinner" style={{ width: 36, height: 36 }} />
            </div>
          ) : reels.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎬</div>
              <div className="empty-state-title">No reels found</div>
              <div className="empty-state-desc">Add reels through a client page</div>
            </div>
          ) : (
            <div className="table-scroll"><table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Reel URL</th>
                  <th>Views</th>
                  <th>Rate/View</th>
                  <th>Earnings</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reels.map((reel, idx) => (
                  <tr key={reel.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{idx + 1}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(131,58,180,0.15)', color: '#c084fc' }}>
                        {reel.client_name}
                      </span>
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      <a
                        href={reel.reel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary)', fontSize: '13px' }}
                        title={reel.reel_url}
                      >
                        {reel.reel_url.replace('https://www.instagram.com/', '').substring(0, 35)}...
                      </a>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{formatViews(reel.views)}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      ₹{reel.rate_per_view}
                    </td>
                    <td>
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                        {formatCurrency(reel.earnings)}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {timeAgo(reel.last_updated)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleSync(reel.id)}
                          disabled={syncingId === reel.id}
                          title="Sync views now"
                        >
                          {syncingId === reel.id ? <span className="spinner" /> : '🔄'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(reel.id)}
                          title="Delete reel"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      </div>
    </Layout>
  );
}
