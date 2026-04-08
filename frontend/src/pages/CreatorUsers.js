import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import API from '../utils/api';

export default function CreatorUsers() {
  const [users, setUsers]       = useState([]);
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Password update state
  const [editingPassword, setEditingPassword] = useState(null); // { userId, userName }
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null); // { userId, text, ok }

  // Form state
  const [form, setForm] = useState({ name: '', email: '', password: '', client_id: '' });
  const [saving, setSaving]   = useState(false);
  const [formErr, setFormErr] = useState('');
  const [formOk, setFormOk]   = useState('');

  const fetchUsers = () =>
    API.get('/creator/users').then(r => setUsers(r.data.users || [])).catch(() => {});

  useEffect(() => {
    Promise.all([
      API.get('/creator/users'),
      API.get('/clients'),
    ]).then(([u, c]) => {
      setUsers(u.data.users || []);
      setClients(c.data.clients || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErr(''); setFormOk('');
    if (!form.client_id) { setFormErr('Please select a client'); return; }
    setSaving(true);
    try {
      const res = await API.post('/creator/users', form);
      setUsers(prev => [res.data.user, ...prev]);
      setForm({ name: '', email: '', password: '', client_id: '' });
      setShowForm(false);
      setFormOk(`User "${res.data.user.name}" created successfully`);
      setTimeout(() => setFormOk(''), 4000);
    } catch (err) {
      setFormErr(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? They will no longer be able to log in.`)) return;
    setDeleting(userId);
    try {
      await API.delete(`/creator/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch {
      alert('Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const handleUpdatePassword = async (userId) => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ userId, text: 'Password must be at least 6 characters', ok: false });
      setTimeout(() => setPasswordMsg(null), 3000);
      return;
    }
    setUpdatingPassword(true);
    try {
      const res = await API.put(`/creator/users/${userId}/password`, { password: newPassword });
      setPasswordMsg({ userId, text: res.data.message, ok: true });
      setEditingPassword(null);
      setNewPassword('');
      setTimeout(() => setPasswordMsg(null), 4000);
    } catch (err) {
      setPasswordMsg({ userId, text: err.response?.data?.error || 'Failed to update password', ok: false });
      setTimeout(() => setPasswordMsg(null), 3000);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <Layout>
      <div className="page-pad-sm" style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Client Users</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Create login accounts for your clients. Each user can only see their own data.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { setShowForm(v => !v); setFormErr(''); setFormOk(''); }}
          >
            {showForm ? '✕ Cancel' : '+ Create User'}
          </button>
        </div>

        {/* Success message */}
        {formOk && (
          <div className="alert alert-success" style={{ marginBottom: '18px' }}>{formOk}</div>
        )}

        {/* Create user form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px' }}>New Client User</h2>
            {formErr && <div className="alert alert-error" style={{ marginBottom: '14px' }}>{formErr}</div>}
            <form onSubmit={handleCreate}>
              <div className="grid-2" style={{ marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Name *
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Rahul Sharma"
                    value={form.name}
                    onChange={set('name')}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Email (used to login) *
                  </label>
                  <input
                    className="input"
                    type="email"
                    placeholder="client@email.com"
                    value={form.email}
                    onChange={set('email')}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Password *
                  </label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={set('password')}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Client (which client they can see) *
                  </label>
                  <select
                    className="input"
                    value={form.client_id}
                    onChange={set('client_id')}
                    required
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">— Select a client —</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {clients.length === 0 && (
                <div className="alert alert-error" style={{ marginBottom: '14px' }}>
                  You have no clients yet. <a href="/clients" style={{ color: 'var(--primary)' }}>Add a client first →</a>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving || clients.length === 0}>
                  {saving ? <span className="spinner" /> : 'Create User'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users table */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700 }}>
              Registered Users
              <span style={{
                marginLeft: '10px', fontSize: '12px', fontWeight: 500,
                background: 'var(--bg-card2)', border: '1px solid var(--border)',
                borderRadius: '20px', padding: '2px 9px', color: 'var(--text-muted)',
              }}>
                {users.length} total
              </span>
            </h2>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <span className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <div className="empty-state-title">No client users yet</div>
              <div className="empty-state-desc">Create a user above to give your client access to their data</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Client Access</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <React.Fragment key={u.id}>
                      <tr>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{i + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '30px', height: '30px', borderRadius: '8px',
                              background: 'var(--gradient)', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontWeight: 700, fontSize: '12px', flexShrink: 0,
                            }}>
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{u.email}</td>
                        <td>
                          <span className="badge" style={{ background: 'rgba(225,48,108,0.12)', color: 'var(--primary)', fontWeight: 600 }}>
                            {u.client_name}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingPassword({ userId: u.id, userName: u.name });
                                setNewPassword('');
                                setPasswordMsg(null);
                              }}
                              title="Change password"
                              style={{ padding: '5px 10px' }}
                            >
                              🔑
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(u.id, u.name)}
                              disabled={deleting === u.id}
                              style={{ padding: '5px 10px' }}
                            >
                              {deleting === u.id ? <span className="spinner" style={{ width: 11, height: 11 }} /> : '🗑️'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Password update row */}
                      {editingPassword?.userId === u.id && (
                        <tr>
                          <td colSpan="6" style={{ padding: '12px 16px', background: 'var(--bg-card2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                                Update password for {editingPassword.userName}:
                              </span>
                              <input
                                type="password"
                                className="input"
                                placeholder="New password (min 6 characters)"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}
                                autoFocus
                              />
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleUpdatePassword(u.id)}
                                disabled={updatingPassword}
                              >
                                {updatingPassword ? <span className="spinner" style={{ width: 11, height: 11 }} /> : 'Update'}
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => { setEditingPassword(null); setNewPassword(''); setPasswordMsg(null); }}
                              >
                                Cancel
                              </button>
                            </div>
                            {passwordMsg?.userId === u.id && (
                              <div className={`alert ${passwordMsg.ok ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '10px', marginBottom: 0 }}>
                                {passwordMsg.text}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info box */}
        <div style={{
          marginTop: '20px', padding: '14px 16px',
          background: 'var(--bg-card2)', border: '1px solid var(--border)',
          borderRadius: '10px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.7',
        }}>
          <strong style={{ color: 'var(--text)' }}>How it works:</strong> Each user you create here can log in at the same login page.
          They will only see the reels and earnings for the client you assign to them — nothing else.
          Share their email + password with your client directly.
        </div>
      </div>
    </Layout>
  );
}
