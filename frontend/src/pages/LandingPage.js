import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function rolePath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'client_user') return '/client-portal';
  return '/dashboard';
}

const features = [
  { icon: '📊', title: 'Real-time Analytics', desc: 'Track views and growth trends across all your reels automatically — updated every 3 hours.' },
  { icon: '🤝', title: 'Client Management', desc: 'Manage multiple clients, set custom rates per client, and view detailed earning breakdowns.' },
  { icon: '🎬', title: 'Multi-Platform', desc: 'Unified dashboard for both Instagram Reels and TikTok videos across all your clients.' },
  { icon: '💰', title: 'Tiered Pricing', desc: 'Set view-based tiered rates per client and automatically calculate accurate monthly payouts.' },
  { icon: '🔄', title: 'Auto Sync', desc: 'Background sync runs every 3 hours. No manual updates, no missed views, ever.' },
  { icon: '📤', title: 'CSV Export', desc: 'One-click export of earnings reports for billing, accounting, and client sharing.' },
];

const steps = [
  { num: '01', title: 'Register & Get Approved', desc: 'Create your agency account. Our team reviews and approves it within 24 hours.' },
  { num: '02', title: 'Add Your Clients', desc: 'Onboard clients, set custom view rates, and invite client users to their own portal.' },
  { num: '03', title: 'Track & Get Paid', desc: 'Add reel URLs and let Amplify handle the rest — views, earnings, and reports.' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user) navigate(rolePath(user.role), { replace: true });
  }, [user, navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>📸</div>
            <span style={{ fontWeight: 800, fontSize: '18px' }} className="gradient-text">Amplify</span>
          </div>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="landing-desktop-nav">
            <a href="#features" style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >Features</a>
            <a href="#how-it-works" style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >How it works</a>
            <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />
            <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px 8px', marginLeft: '4px' }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Mobile right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="landing-mobile-nav">
            <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px' }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setMobileMenu(v => !v)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text)', fontSize: '18px', padding: '6px 10px' }}>
              {mobileMenu ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenu && (
          <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="#features" onClick={() => setMobileMenu(false)} style={{ color: 'var(--text)', fontSize: '15px', textDecoration: 'none', padding: '8px 0' }}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)} style={{ color: 'var(--text)', fontSize: '15px', textDecoration: 'none', padding: '8px 0' }}>How it works</a>
            <div style={{ height: '1px', background: 'var(--border)' }} />
            <Link to="/login" className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={() => setMobileMenu(false)}>Sign In</Link>
            <Link to="/register" className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setMobileMenu(false)}>Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Full-screen background glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 35%, rgba(225,48,108,0.18) 0%, rgba(131,58,180,0.10) 40%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Main content — grows to fill space, centers content */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 6% 48px', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(225,48,108,0.12)', border: '1px solid rgba(225,48,108,0.3)',
            borderRadius: '20px', padding: '7px 16px', fontSize: '13px', fontWeight: 600,
            color: '#E1306C', marginBottom: '32px',
          }}>
            <span>🚀</span> Built for Content Agencies
          </div>

          {/* BIG title — scales with viewport width */}
          <h1 style={{
            fontSize: 'clamp(48px, 8.5vw, 110px)',
            fontWeight: 900, lineHeight: 1.0,
            letterSpacing: '-3px', marginBottom: '28px', width: '100%',
          }}>
            Track. Analyze.<br />
            <span className="gradient-text">Earn More.</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(16px, 1.8vw, 20px)',
            color: 'var(--text-muted)', lineHeight: 1.7,
            marginBottom: '44px', maxWidth: '640px',
          }}>
            The most powerful analytics platform for Instagram & TikTok agencies.
            Track views, manage clients, and calculate earnings — all in one place.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: '16px', padding: '14px 32px', fontWeight: 700 }}>
              Get Started Free →
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ fontSize: '16px', padding: '14px 28px' }}>
              Sign In
            </Link>
          </div>
        </div>

        {/* Stats bar — pinned to bottom of hero */}
        <div style={{
          position: 'relative',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid var(--border)',
        }}>
          {[
            { num: '3hr', label: 'Auto Sync' },
            { num: '2x', label: 'Platforms' },
            { num: '∞', label: 'Clients' },
            { num: '100%', label: 'Automated' },
          ].map((s, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '24px 16px',
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
            }}>
              <div className="gradient-text" style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 900, letterSpacing: '-1px' }}>{s.num}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '80px 0', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-block', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
              textTransform: 'uppercase', color: '#E1306C', marginBottom: '14px',
              background: 'rgba(225,48,108,0.1)', padding: '5px 14px', borderRadius: '20px',
            }}>Features</div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.5px' }}>
              Everything your agency needs
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
              A complete toolkit for reel analytics, client billing, and earnings tracking.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(225,48,108,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'rgba(225,48,108,0.12)', border: '1px solid rgba(225,48,108,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', marginBottom: '18px',
                }}>{f.icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-block', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
              textTransform: 'uppercase', color: '#833AB4', marginBottom: '14px',
              background: 'rgba(131,58,180,0.1)', padding: '5px 14px', borderRadius: '20px',
            }}>Process</div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.5px' }}>
              Up and running in minutes
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto', lineHeight: 1.7 }}>
              Simple onboarding designed for agencies of all sizes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div className="gradient-text" style={{ fontSize: '52px', fontWeight: 900, lineHeight: 1, marginBottom: '20px', letterSpacing: '-2px' }}>{s.num}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>{s.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ padding: '80px 0', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(247,119,55,0.12)', border: '1px solid rgba(247,119,55,0.3)',
            borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: 600,
            color: '#F77737', marginBottom: '28px',
          }}>
            <span>✨</span> Join the waitlist
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, marginBottom: '18px', letterSpacing: '-1px', lineHeight: 1.15 }}>
            Ready to grow your agency?
          </h2>
          <p style={{ fontSize: '17px', color: 'var(--text-muted)', marginBottom: '36px', lineHeight: 1.7 }}>
            Register your agency account today and take control of your reel analytics.
          </p>
          <Link to="/register" className="btn btn-primary" style={{ fontSize: '16px', padding: '14px 32px', fontWeight: 700 }}>
            Create Free Account →
          </Link>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '16px' }}>
            Registration is free. Accounts are reviewed and approved within 24 hours.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📸</div>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Amplify</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            © {new Date().getFullYear()} Amplify. Built for content creators and agencies.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>Sign In</Link>
            <Link to="/register" style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Register</Link>
          </div>
        </div>
      </footer>

      {/* Responsive CSS for nav */}
      <style>{`
        .landing-desktop-nav { display: flex !important; }
        .landing-mobile-nav { display: none !important; }
        @media (max-width: 640px) {
          .landing-desktop-nav { display: none !important; }
          .landing-mobile-nav { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
