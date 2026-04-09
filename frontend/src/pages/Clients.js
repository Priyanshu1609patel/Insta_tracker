import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../utils/api';
import { formatViews, formatCurrency, formatDate } from '../utils/format';
import { useCurrency } from '../hooks/useCurrency';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rateCurrency, setRateCurrency] = useState('INR');
  const [segments, setSegments] = useState([{ id: 1, per_units: '1', custom_per_units: '', rate: '' }]);
  const { exchangeRate } = useCurrency();
  const navigate = useNavigate();

  const formatRateLabel = (client) => {
    const tiers = client.rate_tiers;
    if (tiers && tiers.length > 0) {
      return tiers.map(t => {
        const n = t.display_per_units || 1;
        const r = t.display_rate !== undefined ? t.display_rate : (t.rate_inr_per_view * n);
        const label = n >= 1000000 ? `${n/1000000}M` : n >= 1000 ? `${n/1000}K` : n;
        return `₹${parseFloat(r).toFixed(0)}/${label}`;
      }).join(' · ');
    }
    return `₹${client.rate_per_view} / view`;
  };

  const addSegment = () => setSegments(prev => [...prev, { id: Date.now(), per_units: '1000', custom_per_units: '', rate: '' }]);
  const removeSegment = (idx) => setSegments(prev => prev.filter((_, i) => i !== idx));
  const updateSegment = (idx, field, value) => setSegments(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

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
    setForm({ name: '', description: '' });
    setRateCurrency('INR');
    setSegments([{ id: Date.now(), per_units: '1', custom_per_units: '', rate: '' }]);
    setError('');
    setShowModal(true);
  };

  const openEdit = (client, e) => {
    e.stopPropagation();
    setEditClient(client);
    setForm({ name: client.name, description: client.description || '' });
    setRateCurrency('INR');
    const existingTiers = client.rate_tiers || [];
    const PRESET_UNITS = ['1', '1000', '5000', '10000', '100000', '1000000'];
    if (existingTiers.length > 0) {
      setSegments(existingTiers.map((t, i) => {
        const pu = String(t.display_per_units || '1');
        const isPreset = PRESET_UNITS.includes(pu);
        return {
          id: i,
          rate: String(t.display_rate !== undefined ? t.display_rate : t.rate_inr_per_view),
          per_units: isPreset ? pu : 'custom',
          custom_per_units: isPreset ? '' : pu,
        };
      }));
    } else {
      setSegments([{ id: 0, per_units: '1', custom_per_units: '', rate: String(client.rate_per_view) }]);
    }
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const convertedSegments = segments
        .filter(s => s.rate && parseFloat(s.rate) > 0 && (s.per_units !== 'custom' || (s.custom_per_units && parseFloat(s.custom_per_units) > 0)))
        .map(s => {
          const perUnits = s.per_units === 'custom' ? Math.max(1, parseFloat(s.custom_per_units) || 1) : parseFloat(s.per_units);
          const rateINR = rateCurrency === 'USD' ? parseFloat(s.rate) * exchangeRate : parseFloat(s.rate);
          return {
            min_views: perUnits,
            rate_inr_per_view: rateINR / perUnits,
            display_rate: rateINR,
            display_per_units: perUnits,
          };
        })
        .sort((a, b) => a.min_views - b.min_views);

      const baseRate = convertedSegments.length > 0 ? convertedSegments[0].rate_inr_per_view : 0;
      const payload = { ...form, rate_per_view: baseRate, rate_tiers: convertedSegments };
      if (editClient) {
        await API.put(`/clients/${editClient.id}`, payload);
      } else {
        await API.post('/clients', payload);
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {clients.map(client => (
              <div
                key={client.id}
                className="card"
                style={{ cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', padding: '24px' }}
                onClick={() => navigate(`/clients/${client.id}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = ''; }}
              >
                {/* Client header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '16px',
                      background: 'var(--gradient)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '24px', fontWeight: 700, color: '#fff', flexShrink: 0
                    }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '17px', marginBottom: '4px' }}>{client.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {formatRateLabel(client)}
                      </div>
                      {client.description && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', opacity: 0.7 }}>
                          {client.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button className="btn btn-secondary btn-sm" onClick={(e) => openEdit(client, e)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(client.id, e)}>🗑️</button>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { label: 'Reels', value: client.total_reels || 0, icon: '🎬' },
                    { label: 'Views', value: formatViews(client.total_views || 0), icon: '👁️' },
                    { label: 'Earnings', value: formatCurrency(client.total_earnings || 0), icon: '💰' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background: 'var(--bg-card2)', borderRadius: '12px',
                      padding: '14px 10px', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '18px', marginBottom: '4px' }}>{stat.icon}</div>
                      <div style={{ fontSize: '17px', fontWeight: 700 }}>{stat.value}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
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

            {error && <div className="alert alert-error" style={{ flexShrink: 0 }}>{error}</div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
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
                {/* Label + currency toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Rate *</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button type="button" onClick={() => setRateCurrency('INR')} className={`btn btn-sm ${rateCurrency === 'INR' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '3px 10px', fontSize: '12px' }}>₹ INR</button>
                    <button type="button" onClick={() => setRateCurrency('USD')} className={`btn btn-sm ${rateCurrency === 'USD' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '3px 10px', fontSize: '12px' }}>$ USD</button>
                  </div>
                </div>

                {/* Segments */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {segments.map((seg, idx) => {
                    const perUnitsNum = parseFloat(seg.per_units === 'custom' ? seg.custom_per_units : seg.per_units) || 0;
                    const rateVal = parseFloat(seg.rate) || 0;
                    const rateINR = rateCurrency === 'USD' ? rateVal * exchangeRate : rateVal;
                    const perViewINR = perUnitsNum > 0 && rateVal > 0 ? rateINR / perUnitsNum : 0;
                    return (
                      <div key={seg.id} style={{ background: 'var(--bg-card2)', borderRadius: '10px', padding: '10px 12px' }}>
                        {/* Charge per row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Charge per:</span>
                          <select
                            value={seg.per_units}
                            onChange={e => updateSegment(idx, 'per_units', e.target.value)}
                            className="input"
                            style={{ flex: 1, padding: '5px 8px', fontSize: '12px', height: 'auto' }}
                          >
                            <option value="1">1 View</option>
                            <option value="1000">1K Views (1,000)</option>
                            <option value="5000">5K Views (5,000)</option>
                            <option value="10000">10K Views (10,000)</option>
                            <option value="100000">100K Views (1,00,000)</option>
                            <option value="1000000">1M Views (10,00,000)</option>
                            <option value="custom">Custom</option>
                          </select>
                          {seg.per_units === 'custom' && (
                            <input
                              className="input"
                              type="number"
                              min="1"
                              placeholder="e.g. 500"
                              value={seg.custom_per_units}
                              onChange={e => updateSegment(idx, 'custom_per_units', e.target.value)}
                              style={{ width: '90px', padding: '5px 8px', fontSize: '12px', height: 'auto' }}
                            />
                          )}
                          {segments.length > 1 && (
                            <button type="button" onClick={() => removeSegment(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px', padding: '0 2px', lineHeight: 1 }}>×</button>
                          )}
                        </div>
                        {/* Views >= label + rate input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            Views ≥ <strong style={{ color: 'var(--text)' }}>{perUnitsNum ? perUnitsNum.toLocaleString('en-IN') : '—'}</strong>
                          </span>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px', pointerEvents: 'none' }}>
                              {rateCurrency === 'INR' ? '₹' : '$'}
                            </span>
                            <input
                              className="input"
                              style={{ paddingLeft: '26px' }}
                              type="number"
                              step="0.000001"
                              min="0"
                              placeholder="e.g. 100"
                              value={seg.rate}
                              onChange={e => updateSegment(idx, 'rate', e.target.value)}
                              required={idx === 0}
                            />
                          </div>
                        </div>
                        {/* Conversion hint */}
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {rateVal > 0
                            ? <>
                                {rateCurrency === 'INR' ? `₹${rateVal.toFixed(3)} = $${(rateVal / exchangeRate).toFixed(3)} USD` : `$${rateVal.toFixed(3)} = ₹${(rateVal * exchangeRate).toFixed(3)} INR`}
                                {perUnitsNum > 1 && perViewINR > 0 && ` · ₹${perViewINR.toFixed(6)}/view`}
                              </>
                            : `Earnings = Views × Rate per ${perUnitsNum > 0 ? perUnitsNum.toLocaleString('en-IN') + ' views' : '—'}`
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add another */}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addSegment} style={{ marginTop: '8px', fontSize: '12px', width: '100%' }}>
                  + Add another segment
                </button>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Highest matched segment applies to all views.
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

              </div>{/* end scrollable area */}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px', flexShrink: 0, borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
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
