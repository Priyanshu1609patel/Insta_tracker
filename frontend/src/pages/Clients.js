import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../utils/api';
import { formatViews, formatCurrency, formatDate } from '../utils/format';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm] = useState({ name: '', rate_per_view: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchClients = async () => {
    try {
      const res = await API.get('/clients');
      setClients(res.data.clients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const openAdd = () => {
    setEditClient(null);
    setForm({ name: '', rate_per_view: '', description: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (client, e) => {
    e.stopPropagation();
    setEditClient(client);
    setForm({ name: client.name, rate_per_view: client.rate_per_view, description: client.description || '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editClient) {
        await API.put(`/clients/${editClient.id}`, form);
      } else {
        await API.post('/clients', form);
      }
      setShowModal(false);
      fetchClients();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this client and all their reels?')) return;
    try {
      await API.delete(`/clients/${id}`);
      fetchClients();
    } catch (err) {
      alert('Failed to delete client');
    }
  };

  return (
    <Layout>
      <div className="page-pad" style={{ maxWidth: '1000px' }}>
        {/* Header */}
        <div className="page-header" style={{ marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Clients</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Manage your agency clients
            </p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            + Add Client
          </button>
        </div>

        {/* Client grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}><span className="spinner" style={{ width: 40, height: 40 }} /></div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No clients yet</div>
            <div className="empty-state-desc">Add your first client to start tracking reels</div>
            <button className="btn btn-primary" onClick={openAdd}>+ Add First Client</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {clients.map(client => (
              <div
                key={client.id}
                className="card"
                style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}
                onClick={() => navigate(`/clients/${client.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {/* Client header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: 'var(--gradient)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px', flexShrink: 0
                    }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>{client.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        ₹{client.rate_per_view} / view
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={(e) => openEdit(client, e)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(client.id, e)}>🗑️</button>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Reels', value: client.total_reels || 0 },
                    { label: 'Views', value: formatViews(client.total_views || 0) },
                    { label: 'Earnings', value: formatCurrency(client.total_earnings || 0) },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background: 'var(--bg-card2)', borderRadius: '8px',
                      padding: '10px', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: 700 }}>{stat.value}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Added {formatDate(client.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editClient ? 'Edit Client' : 'Add New Client'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Client Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Acme Corp"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rate Per View (₹) *</label>
                <input
                  className="input"
                  type="number"
                  step="0.000001"
                  min="0"
                  placeholder="e.g. 0.01"
                  value={form.rate_per_view}
                  onChange={e => setForm({ ...form, rate_per_view: e.target.value })}
                  required
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Earnings = Views × Rate per view
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  className="input"
                  placeholder="Notes about this client"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : (editClient ? 'Save Changes' : 'Add Client')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
