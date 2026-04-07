import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const navItems = user?.role === 'admin'
    ? [{ path: '/admin', label: 'Admin Panel', icon: '👑' }]
    : [
        { path: '/dashboard', label: 'Dashboard',    icon: '📊' },
        { path: '/clients',   label: 'Clients',       icon: '👥' },
        { path: '/reels',     label: 'All Reels',     icon: '🎬' },
        { path: '/users',     label: 'Client Users',  icon: '🔑' },
      ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '220px' : '60px',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: 'var(--gradient)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '17px', flexShrink: 0,
            }}>📸</div>
            {sidebarOpen && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>InstaTracker</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Reel Analytics</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 7px' }}>
          {navItems.map(item => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 11px', borderRadius: '8px', marginBottom: '3px',
                background: active ? 'rgba(225,48,108,0.13)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 400, fontSize: '13px',
                transition: 'all 0.15s', textDecoration: 'none',
              }}>
                <span style={{ fontSize: '17px', flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: theme + user + logout */}
        <div style={{ padding: '10px 7px', borderTop: '1px solid var(--border)' }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 11px', borderRadius: '8px', width: '100%',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px',
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span style={{ fontSize: '17px', flexShrink: 0 }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </span>
            {sidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* User */}
          {sidebarOpen && (
            <div style={{ padding: '7px 11px', marginBottom: '4px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{user?.name}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>
          )}

          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 11px', borderRadius: '8px', width: '100%',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--danger)', fontSize: '13px',
          }}>
            <span style={{ fontSize: '17px' }}>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          position: 'absolute', top: '50%', right: '-11px',
          width: '22px', height: '22px', borderRadius: '50%',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          cursor: 'pointer', color: 'var(--text-muted)', fontSize: '11px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {sidebarOpen ? '←' : '→'}
        </button>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  );
}
