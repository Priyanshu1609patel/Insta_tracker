import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isMobileWidth = () => typeof window !== 'undefined' && window.innerWidth < 768;

  const [isMobile, setIsMobile]     = useState(isMobileWidth);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobileWidth());
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const toggleTheme  = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const navItems = user?.role === 'admin'
    ? [{ path: '/admin', label: 'Admin Panel', icon: '👑' }]
    : [
        { path: '/dashboard', label: 'Dashboard',   icon: '📊' },
        { path: '/clients',   label: 'Clients',      icon: '👥' },
        { path: '/reels',     label: 'All Reels',    icon: '🎬' },
        { path: '/users',     label: 'Client Users', icon: '🔑' },
      ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Backdrop — mobile only */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 98,
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: isMobile ? '240px' : (sidebarOpen ? '220px' : '60px'),
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0,
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: isMobile ? 99 : 'auto',
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: isMobile ? 'transform 0.25s ease' : 'width 0.2s',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: 'var(--gradient)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '17px', flexShrink: 0,
            }}>📸</div>
            {(sidebarOpen || isMobile) && (
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
                {(sidebarOpen || isMobile) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: theme + user + logout */}
        <div style={{ padding: '10px 7px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
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
            {(sidebarOpen || isMobile) && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {(sidebarOpen || isMobile) && (
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
            {(sidebarOpen || isMobile) && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            position: 'absolute', top: '50%', right: '-11px',
            width: '22px', height: '22px', borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            cursor: 'pointer', color: 'var(--text-muted)', fontSize: '11px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {sidebarOpen ? '←' : '→'}
          </button>
        )}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)', minWidth: 0 }}>
        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text)', fontSize: '20px', padding: '4px 6px',
              display: 'flex', alignItems: 'center',
            }}
          >☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '7px',
              background: 'var(--gradient)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            }}>📸</div>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>InstaTracker</span>
          </div>
          <button
            onClick={toggleTheme}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {children}
      </main>
    </div>
  );
}
