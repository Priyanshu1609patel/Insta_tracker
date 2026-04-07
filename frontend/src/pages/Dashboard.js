import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../utils/api';
import { formatViews, formatCurrency, timeAgo, exactViews, exactCurrency } from '../utils/format';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';


export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [fmt] = useState(() => localStorage.getItem('numFmt') || 'indian');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await API.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await API.get('/dashboard/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insta-tracker-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    </Layout>
  );

  const { overview, clients } = data || {};

  return (
    <Layout>
      <div style={{ padding: '32px', maxWidth: '1200px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Your reel performance at a glance
            </p>
          </div>
          <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? <span className="spinner" /> : '⬇️'} Export CSV
          </button>
        </div>

        {/* Overview stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Clients', value: overview?.totalClients || 0, icon: '👥', color: '#833AB4' },
            { label: 'Total Reels', value: overview?.totalReels || 0, icon: '🎬', color: '#E1306C' },
            { label: 'Total Views', value: formatViews(overview?.totalViews || 0, fmt), icon: '👁️', color: '#F77737' },
            { label: 'Total Earnings', value: formatCurrency(overview?.totalEarnings || 0, fmt), icon: '💰', color: '#22c55e' },
          ].map((stat) => (
            <div key={stat.label} className="stat-card" style={{ borderTop: `3px solid ${stat.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="stat-label">{stat.label}</span>
                <div className="stat-icon" style={{ background: `${stat.color}20` }}>
                  {stat.icon}
                </div>
              </div>
              <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Client-wise breakdown */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Client Performance</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/clients')}>
              Manage Clients
            </button>
          </div>

          {!clients || clients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No clients yet</div>
              <div className="empty-state-desc">Add your first client to start tracking</div>
              <button className="btn btn-primary" onClick={() => navigate('/clients')}>
                Add Client
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Reels</th>
                  <th>Total Views</th>
                  <th>Rate / View</th>
                  <th>Total Earnings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{client.name}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(131,58,180,0.15)', color: '#c084fc' }}>
                        {client.total_reels} reels
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatViews(client.total_views, fmt)}</div>
                      {fmt !== 'exact' && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{exactViews(client.total_views)}</div>}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>₹{client.rate_per_view}</td>
                    <td>
                      <div style={{ color: 'var(--success)', fontWeight: 700 }}>{formatCurrency(client.total_earnings, fmt)}</div>
                      {fmt !== 'exact' && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{exactCurrency(client.total_earnings)}</div>}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Notifications for milestone reels */}
        <MilestoneAlerts clients={clients} />
      </div>
    </Layout>
  );
}

function MilestoneAlerts({ clients }) {
  const [reels, setReels] = useState([]);

  useEffect(() => {
    API.get('/reels').then(res => {
      const milestones = (res.data.reels || []).filter(r =>
        r.views >= 100000 || r.views >= 1000000 || r.views >= 500000
      );
      setReels(milestones);
    }).catch(() => {});
  }, []);

  if (reels.length === 0) return null;

  return (
    <div className="card">
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
        🔥 Milestone Reels
      </h2>
      {reels.map(reel => {
        const milestone = reel.views >= 1000000 ? '1M' : reel.views >= 500000 ? '500K' : '100K';
        return (
          <div key={reel.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px', background: 'var(--banner-error-bg)',
            border: '1px solid var(--banner-error-border)', borderRadius: '8px', marginBottom: '8px'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>
                🎉 {reel.client_name} — Crossed {milestone} views!
              </div>
              <a href={reel.reel_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>
                {reel.reel_url.substring(0, 50)}...
              </a>
            </div>
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>
              {formatViews(reel.views)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
