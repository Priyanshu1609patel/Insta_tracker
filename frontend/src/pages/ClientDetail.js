import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import CurrencyDropdown from '../components/CurrencyDropdown';
import API from '../utils/api';
import { formatViews, formatCurrency, exactViews, exactCurrency, timeAgo, formatDate } from '../utils/format';
import { useCurrency } from '../hooks/useCurrency';

// ── Number format dropdown ────────────────────────────────────
const FORMAT_OPTIONS = [
  { value: 'intl',   label: '🌐 International', desc: 'K / M / B' },
  { value: 'indian', label: '🇮🇳 Indian',        desc: 'L / Cr'   },
  { value: 'exact',  label: '# Exact',           desc: 'Raw number' },
];

function FormatDropdown({ value, onChange }) {
  const current = FORMAT_OPTIONS.find(o => o.value === value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Display:</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
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
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon, label, formatted, exact, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '18px 20px',
      borderTop: `3px solid ${color}`,
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
        <span style={{
          width: '34px', height: '34px', borderRadius: '9px',
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px',
        }}>{icon}</span>
      </div>
      <div style={{ fontSize: '26px', fontWeight: 800, color, lineHeight: 1 }}>{formatted}</div>
      {exact && formatted !== exact && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>{exact}</div>
      )}
    </div>
  );
}

// ── Confirm Update Modal ──────────────────────────────────────
function ConfirmUpdateModal({ oldViews, newViews, onConfirm, onCancel, saving }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: '22px', marginBottom: '10px', textAlign: 'center' }}>✏️</div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, textAlign: 'center', marginBottom: '6px' }}>
          Update Views Manually?
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '20px' }}>
          This will override the auto-synced view count.
        </p>

        {/* Before / After */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '22px',
        }}>
          <div style={{
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Views</div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-muted)' }}>
              {Number(oldViews).toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{
            background: 'rgba(225,48,108,0.08)', border: '1px solid rgba(225,48,108,0.3)',
            borderRadius: '10px', padding: '12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>New Views</div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--primary)' }}>
              {Number(newViews).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={saving}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={saving}
            style={{ flex: 1 }}
          >
            {saving ? <span className="spinner" /> : 'Yes, Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Date Modal ────────────────────────────────────────
function ConfirmDateModal({ oldDate, newDate, onConfirm, onCancel, saving }) {
  const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: '22px', marginBottom: '10px', textAlign: 'center' }}>📅</div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, textAlign: 'center', marginBottom: '6px' }}>
          Update Reel Date?
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '20px' }}>
          Are you sure you want to change the date for this reel?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '22px' }}>
          <div style={{
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Date</div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-muted)' }}>{fmt(oldDate)}</div>
          </div>
          <div style={{
            background: 'rgba(225,48,108,0.08)', border: '1px solid rgba(225,48,108,0.3)',
            borderRadius: '10px', padding: '12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>New Date</div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--primary)' }}>{fmt(newDate)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={saving} style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={saving} style={{ flex: 1 }}>
            {saving ? <span className="spinner" /> : 'Yes, Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reel row ──────────────────────────────────────────────────
function ReelRow({ reel, fmt, currency, exchangeRate, syncingId, onSync, onDelete, editingViews, setEditingViews, onRequestSave, savingViews, editingDate, setEditingDate, onRequestDateSave }) {
  const isEditing = editingViews?.reelId === reel.id;
  const isEditingDate = editingDate?.reelId === reel.id;
  const todayStr = new Date().toISOString().split('T')[0];
  const shortUrl = reel.reel_url.replace('https://www.', '').replace('https://', '').split('?')[0];
  const isPending  = reel._pending;   // just added, awaiting server
  const isSyncing  = reel._syncing;   // server saved, awaiting view scrape
  const platform = reel.platform || (reel.reel_url?.includes('tiktok.com') ? 'tiktok' : 'instagram');

  return (
    <tr style={{ opacity: isPending ? 0.7 : 1 }}>
      {/* Platform */}
      <td>
        {platform === 'tiktok' ? (
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '5px', background: 'rgba(0,194,203,0.12)', color: '#008b94', border: '1px solid rgba(0,194,203,0.35)', whiteSpace: 'nowrap' }}>
            TikTok
          </span>
        ) : (
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '5px', background: 'rgba(131,58,180,0.12)', color: '#7c3aed', border: '1px solid rgba(131,58,180,0.35)', whiteSpace: 'nowrap' }}>
            Instagram
          </span>
        )}
      </td>
      {/* URL */}
      <td style={{ maxWidth: '260px' }}>
        <a
          href={reel.reel_url} target="_blank" rel="noopener noreferrer"
          style={{
            color: 'var(--primary)', fontSize: '12px', display: 'block',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
          title={reel.reel_url}
        >
          {shortUrl}
        </a>
        {isPending && (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="spinner" style={{ width: 8, height: 8 }} /> Saving…
          </div>
        )}
        {isSyncing && !isPending && (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="spinner" style={{ width: 8, height: 8 }} /> Fetching views…
          </div>
        )}
      </td>

      {/* Views */}
      <td>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <input
              type="number" className="input"
              style={{ width: '110px', padding: '4px 8px', fontSize: '13px' }}
              value={editingViews.value}
              onChange={e => setEditingViews({ ...editingViews, value: e.target.value })}
              onKeyDown={e => { if (e.key === 'Enter') onRequestSave(reel); if (e.key === 'Escape') setEditingViews(null); }}
              autoFocus
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onRequestSave(reel)}
              title="Save (shows confirmation)"
            >
              ✓
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditingViews(null)}>✕</button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
                {formatViews(reel.views, fmt)}
              </span>
              <button
                onClick={() => setEditingViews({ reelId: reel.id, value: reel.views })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '11px', padding: '1px 3px' }}
                title="Edit manually"
              >✏️</button>
            </div>
            {fmt !== 'exact' && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                {exactViews(reel.views)}
              </div>
            )}
          </div>
        )}
      </td>

      {/* Earnings */}
      <td>
        <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '14px' }}>
          {formatCurrency(reel.earnings, fmt, currency, exchangeRate)}
        </div>
        {fmt !== 'exact' && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
            {exactCurrency(reel.earnings, currency, exchangeRate)}
          </div>
        )}
      </td>

      {/* Date */}
      <td style={{ whiteSpace: 'nowrap' }}>
        {isEditingDate ? (
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <input
              type="date"
              className="input input-date"
              style={{ padding: '4px 8px', fontSize: '12px' }}
              value={editingDate.value}
              max={todayStr}
              onChange={e => setEditingDate({ ...editingDate, value: e.target.value })}
              onKeyDown={e => { if (e.key === 'Enter') onRequestDateSave(reel); if (e.key === 'Escape') setEditingDate(null); }}
              onClick={e => { try { e.target.showPicker(); } catch {} }}
              autoFocus
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onRequestDateSave(reel)}
              title="Save date"
            >✓</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditingDate(null)}>✕</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {reel.reel_date
                ? new Date(reel.reel_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'}
            </span>
            {!reel._pending && (
              <button
                onClick={() => setEditingDate({ reelId: reel.id, value: reel.reel_date || todayStr })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '11px', padding: '1px 3px' }}
                title="Edit date"
              >✏️</button>
            )}
          </div>
        )}
      </td>

      {/* Last Updated */}
      <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {timeAgo(reel.last_updated)}
      </td>

      {/* Actions */}
      <td>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onSync(reel.id)}
            disabled={syncingId === reel.id}
            title={`Sync from ${platform === 'tiktok' ? 'TikTok' : 'Instagram'}`}
            style={{ padding: '5px 9px' }}
          >
            {syncingId === reel.id
              ? <span className="spinner" style={{ width: 12, height: 12 }} />
              : '🔄'}
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(reel.id)}
            title="Delete reel"
            style={{ padding: '5px 9px' }}
          >🗑️</button>
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency, changeCurrency, exchangeRate, lastUpdated, loading: currencyLoading } = useCurrency();

  const [client, setClient] = useState(null);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fmt, setFmt] = useState(() => localStorage.getItem('numFmt') || 'indian');

  const todayStr = new Date().toISOString().split('T')[0];

  const [showAddReel, setShowAddReel] = useState(false);
  const [reelUrl, setReelUrl] = useState('');
  const [reelDate, setReelDate] = useState(todayStr);
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const [syncingId, setSyncingId]   = useState(null);
  const [syncMsg, setSyncMsg]       = useState(null); // { reelId, text, ok }
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncAllMsg, setSyncAllMsg] = useState(null); // { text, ok }

  const [editingViews, setEditingViews] = useState(null);   // { reelId, value, oldValue }
  const [confirmUpdate, setConfirmUpdate] = useState(null); // { reel }
  const [savingViews, setSavingViews] = useState(false);

  const [editingDate, setEditingDate] = useState(null);       // { reelId, value }
  const [confirmDateUpdate, setConfirmDateUpdate] = useState(null); // { reel }
  const [savingDate, setSavingDate] = useState(false);

  const fetchClient = async () => {
    try {
      const res = await API.get(`/clients/${id}`);
      setClient(res.data.client);
      setReels(res.data.reels || []);
    } catch {
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClient(); }, [id]);

  const handleFmtChange = (v) => { setFmt(v); localStorage.setItem('numFmt', v); };

  const handleAddReel = async (e) => {
    e.preventDefault();
    if (!reelUrl.trim() || !reelDate) return;
    setAddError('');

    const urlToAdd = reelUrl.trim();
    const dateToAdd = reelDate;
    const tempId = 'temp_' + Date.now();

    // Optimistic: show reel instantly with 0 views + syncing indicator
    setReels(prev => [{
      id: tempId,
      reel_url: urlToAdd,
      views: 0,
      earnings: 0,
      reel_date: dateToAdd,
      last_updated: new Date().toISOString(),
      _pending: true,
    }, ...prev]);
    setReelUrl('');
    setShowAddReel(false);

    try {
      const res = await API.post('/reels', { client_id: id, reel_url: urlToAdd, reel_date: dateToAdd });
      // Backend returns { reel, message } — extract the reel object
      const saved = res.data.reel || res.data;

      // Replace temp placeholder with real reel
      setReels(prev => prev.map(r =>
        r.id === tempId ? { ...saved, earnings: 0, _syncing: true } : r
      ));

      // Auto-poll every 3s until views appear (max 10 attempts = 30s)
      let tries = 0;
      const poll = setInterval(async () => {
        tries++;
        try {
          const r = await API.get(`/clients/${id}`);
          const found = (r.data.reels || []).find(x => x.id === saved.id);
          if (found) {
            const done = found.views > 0 || tries >= 10;
            setReels(prev => prev.map(x =>
              x.id === saved.id ? { ...found, _syncing: !done } : x
            ));
            if (done) clearInterval(poll);
          } else if (tries >= 10) {
            clearInterval(poll);
          }
        } catch { clearInterval(poll); }
      }, 3000);

    } catch (err) {
      // Remove optimistic entry on error and restore the form
      setReels(prev => prev.filter(r => r.id !== tempId));
      setShowAddReel(true);
      setReelUrl(urlToAdd);
      setReelDate(dateToAdd);
      setAddError(err.response?.data?.error || 'Failed to add reel');
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    setSyncAllMsg(null);
    try {
      const res = await API.post('/reels/sync-client', { client_id: id });
      const count = res.data.count || 0;
      if (!count) {
        setSyncAllMsg({ text: 'No reels to sync', ok: true });
        setSyncingAll(false);
        return;
      }
      setSyncAllMsg({ text: `Syncing ${count} reel${count > 1 ? 's' : ''}…`, ok: true });

      const syncStartTime = Date.now();

      const poll = setInterval(async () => {
        try {
          const r = await API.get(`/clients/${id}`);
          const fresh = r.data.reels || [];
          setClient(r.data.client);
          setReels(fresh);

          // Count reels whose last_updated is after the sync was triggered
          const doneCount = fresh.filter(
            reel => new Date(reel.last_updated).getTime() > syncStartTime
          ).length;

          // Stop as soon as all expected reels are updated, or after 40s fallback
          if (doneCount >= count || Date.now() - syncStartTime > 40000) {
            clearInterval(poll);
            setSyncingAll(false);
            setSyncAllMsg({ text: `Sync complete — ${doneCount} of ${count} updated`, ok: true });
            setTimeout(() => setSyncAllMsg(null), 4000);
          }
        } catch {
          clearInterval(poll);
          setSyncingAll(false);
        }
      }, 2000);
    } catch (err) {
      setSyncAllMsg({ text: err.response?.data?.error || 'Sync failed', ok: false });
      setSyncingAll(false);
      setTimeout(() => setSyncAllMsg(null), 4000);
    }
  };

  const handleSync = async (reelId) => {
    setSyncingId(reelId); setSyncMsg(null);
    try {
      const res = await API.post(`/reels/${reelId}/sync`);
      setSyncMsg({ reelId, text: `Synced → ${res.data.views?.toLocaleString('en-IN')} views`, ok: true });
      fetchClient();
    } catch (err) {
      setSyncMsg({ reelId, text: err.response?.data?.error || 'Sync failed', ok: false });
    } finally {
      setSyncingId(null);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  // Step 1: user clicks ✓ → show confirm modal
  const handleRequestSave = (reel) => {
    setConfirmUpdate({ reel });
  };

  // Step 2: user confirms → actually save
  const handleConfirmSave = async () => {
    const { reel } = confirmUpdate;
    setSavingViews(true);
    try {
      await API.put(`/reels/${reel.id}/views`, { views: editingViews.value });
      setEditingViews(null);
      setConfirmUpdate(null);
      fetchClient();
    } catch {
      alert('Failed to update views');
    } finally {
      setSavingViews(false);
    }
  };

  const handleRequestDateSave = (reel) => {
    setConfirmDateUpdate({ reel });
  };

  const handleConfirmDateSave = async () => {
    const { reel } = confirmDateUpdate;
    setSavingDate(true);
    try {
      await API.put(`/reels/${reel.id}/date`, { reel_date: editingDate.value });
      setEditingDate(null);
      setConfirmDateUpdate(null);
      fetchClient();
    } catch {
      alert('Failed to update date');
    } finally {
      setSavingDate(false);
    }
  };

  const handleDeleteReel = async (reelId) => {
    if (!window.confirm('Delete this reel?')) return;
    try {
      await API.delete(`/reels/${reelId}`);
      fetchClient();
    } catch {
      alert('Failed to delete reel');
    }
  };

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    </Layout>
  );

  const totalViews    = reels.reduce((s, r) => s + (Number(r.views) || 0), 0);
  const totalEarnings = reels.reduce((s, r) => s + (parseFloat(r.earnings) || 0), 0);

  return (
    <Layout>
      {/* Confirm update modal */}
      {confirmUpdate && (
        <ConfirmUpdateModal
          oldViews={confirmUpdate.reel.views}
          newViews={editingViews?.value}
          onConfirm={handleConfirmSave}
          onCancel={() => setConfirmUpdate(null)}
          saving={savingViews}
        />
      )}

      {/* Confirm date update modal */}
      {confirmDateUpdate && (
        <ConfirmDateModal
          oldDate={confirmDateUpdate.reel.reel_date}
          newDate={editingDate?.value}
          onConfirm={handleConfirmDateSave}
          onCancel={() => setConfirmDateUpdate(null)}
          saving={savingDate}
        />
      )}

      <div className="page-pad-sm" style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Back */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/clients')}
          style={{ marginBottom: '20px' }}
        >
          ← Back to Clients
        </button>

        {/* ── Client Header ── */}
        <div className="card" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0,
            background: 'var(--gradient)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', fontWeight: 700, color: '#fff',
          }}>
            {client?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>{client?.name}</h1>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
              Rate: <strong style={{ color: 'var(--primary)' }}>
                {client?.rate_tiers?.length > 0
                  ? client.rate_tiers.map(t => {
                      const n = t.display_per_units || 1;
                      const r = t.display_rate !== undefined ? t.display_rate : (t.rate_inr_per_view * n);
                      const label = n >= 1000000 ? `${n/1000000}M` : n >= 1000 ? `${n/1000}K` : n;
                      return `₹${parseFloat(r).toFixed(0)}/${label}`;
                    }).join(' · ')
                  : `₹${client?.rate_per_view} per view`
                }
              </strong>
              {client?.description && (
                <span style={{ marginLeft: '14px', color: 'var(--text-secondary)' }}>{client.description}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <CurrencyDropdown 
              currency={currency} 
              onChange={changeCurrency} 
              exchangeRate={exchangeRate}
              loading={currencyLoading}
              lastUpdated={lastUpdated}
            />
            <FormatDropdown value={fmt} onChange={handleFmtChange} />
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid-3" style={{ marginBottom: '20px' }}>
          <StatCard
            icon="🎬" label="Total Reels" color="#833AB4"
            formatted={reels.length.toString()}
            exact={null}
          />
          <StatCard
            icon="👁️" label="Total Views" color="#F77737"
            formatted={formatViews(totalViews, fmt)}
            exact={exactViews(totalViews)}
          />
          <StatCard
            icon="💰" label="Total Earnings" color="#22c55e"
            formatted={formatCurrency(totalEarnings, fmt, currency, exchangeRate)}
            exact={exactCurrency(totalEarnings, currency, exchangeRate)}
          />
        </div>

        {/* ── Reels Section ── */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Reels</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleSyncAll}
                disabled={syncingAll || reels.length === 0}
                title="Fetch latest views for all reels at once"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                {syncingAll
                  ? <><span className="spinner" style={{ width: 11, height: 11 }} /> Syncing…</>
                  : <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                      </svg>
                      Sync All
                    </>
                }
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddReel(v => !v)}>
                {showAddReel ? '✕ Cancel' : '+ Add Reel'}
              </button>
            </div>
          </div>

          {/* Sync All feedback */}
          {syncAllMsg && (
            <div className={`alert ${syncAllMsg.ok ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '12px' }}>
              {syncAllMsg.text}
            </div>
          )}

          {/* Individual sync feedback */}
          {syncMsg && (
            <div className={`alert ${syncMsg.ok ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '14px' }}>
              {syncMsg.text}
            </div>
          )}

          {/* Add Reel form */}
          {showAddReel && (
            <div style={{
              background: 'var(--bg-card2)', borderRadius: '10px',
              padding: '16px', marginBottom: '18px', border: '1px solid var(--border)',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '10px', fontSize: '14px' }}>Add Instagram / TikTok Reel</div>
              {addError && <div className="alert alert-error">{addError}</div>}
              <form onSubmit={handleAddReel}>
                <input
                  className="input"
                  placeholder="https://www.instagram.com/reel/... or https://www.tiktok.com/@user/video/..."
                  value={reelUrl}
                  onChange={e => setReelUrl(e.target.value)}
                  required
                  style={{ width: '100%', marginBottom: '8px', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Date:</label>
                  <input
                    type="date"
                    className="input input-date"
                    value={reelDate}
                    onChange={e => setReelDate(e.target.value)}
                    max={todayStr}
                    required
                    onClick={e => { try { e.target.showPicker(); } catch {} }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={addLoading}>
                    {addLoading ? <span className="spinner" /> : 'Add'}
                  </button>
                </div>
              </form>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '7px' }}>
                Views are fetched automatically. Use ✏️ to enter manually if auto-sync fails.
              </div>
            </div>
          )}

          {/* Reels table */}
          {reels.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎬</div>
              <div className="empty-state-title">No reels yet</div>
              <div className="empty-state-desc">Paste an Instagram or TikTok reel URL to start tracking views</div>
              <button className="btn btn-primary" onClick={() => setShowAddReel(true)}>+ Add First Reel</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: '640px' }}>
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Reel URL</th>
                    <th>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        Views
                        <span style={{ fontSize: '10px', background: 'var(--bg-card2)', padding: '1px 5px', borderRadius: '4px', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                          {FORMAT_OPTIONS.find(o => o.value === fmt)?.desc}
                        </span>
                      </div>
                    </th>
                    <th>Earnings</th>
                    <th>Date</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reels.map(reel => (
                    <ReelRow
                      key={reel.id}
                      reel={reel}
                      fmt={fmt}
                      currency={currency}
                      exchangeRate={exchangeRate}
                      syncingId={syncingId}
                      onSync={handleSync}
                      onDelete={handleDeleteReel}
                      editingViews={editingViews}
                      setEditingViews={setEditingViews}
                      onRequestSave={handleRequestSave}
                      savingViews={savingViews}
                      editingDate={editingDate}
                      setEditingDate={setEditingDate}
                      onRequestDateSave={handleRequestDateSave}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer summary */}
          {reels.length > 0 && (
            <div style={{
              marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'flex-end', gap: '28px',
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Views</div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#F77737' }}>
                  {formatViews(totalViews, fmt)}
                </div>
                {fmt !== 'exact' && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{exactViews(totalViews)}</div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Earnings</div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--success)' }}>
                  {formatCurrency(totalEarnings, fmt, currency, exchangeRate)}
                </div>
                {fmt !== 'exact' && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{exactCurrency(totalEarnings, currency, exchangeRate)}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
