import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoIcon, DashboardIcon, ClientsIcon, ShieldIcon, SyncIcon } from '../components/Icons';

function rolePath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'client_user') return '/client-portal';
  return '/dashboard';
}

const features = [
  { icon: '⚡', tag: 'AUTOMATION', title: '3-Hour Auto View Sync', desc: 'Background workers continuously poll Instagram Reels & TikTok stats. Zero manual updates or lost view metrics.' },
  { icon: '💼', tag: 'CLIENT PORTALS', title: 'White-Labeled Portals', desc: 'Grant clients dedicated, read-only portals with verified metrics and custom client view tier reporting.' },
  { icon: '📊', tag: 'ANALYTICS', title: 'Deep Viral Velocity', desc: 'Track viral trajectories, retention brackets, growth spikes, and cross-platform campaign reach seamlessly.' },
  { icon: '💎', tag: 'BILLING TIER', title: 'Tiered Payout Calculator', desc: 'Automate complex view milestone formulas (e.g. $1.50/1k up to 100k, $2.50/1k after) and audit-ready payout sheets.' },
  { icon: '🚀', tag: 'CROSS-PLATFORM', title: 'Unified IG & TikTok Hub', desc: 'Manage dual-platform creators from a single sleek command center with unified performance analytics.' },
  { icon: '📥', tag: 'FINANCIALS', title: 'One-Click CSV Exports', desc: 'Generate and export clean, formatted accounting summaries direct to stakeholders or financial teams.' },
];

const steps = [
  { num: '01', title: 'Connect Agency Workspace', desc: 'Register your agency in under 60 seconds and set up your default currency, metrics, and branding.' },
  { num: '02', title: 'Onboard Clients & Rate Cards', desc: 'Create client profiles, assign custom view payout formulas, and dispatch instant client portal access.' },
  { num: '03', title: 'Paste Reel Links & Auto-Bill', desc: 'Input reel URLs or creator handles. Amplify tracks real-time growth and computes audit-proof monthly earnings.' },
];

const faqs = [
  { q: 'How often does Amplify update view counts?', a: 'Amplify automatically syncs views, likes, and engagement metrics every 3 hours across all linked Instagram Reels and TikTok videos without requiring any manual browser triggers.' },
  { q: 'Can clients see our internal agency payout calculations?', a: 'No. Clients receive access to a dedicated Client Portal with strict permission controls. They only see verified campaign metrics and approved client reporting summaries.' },
  { q: 'What platform formats and media types are supported?', a: 'Amplify natively supports Instagram Reels, IGTV, posts, and TikTok videos with automatic metric normalization and verification.' },
  { q: 'Can I set up custom tier structures per client?', a: 'Yes! You can define unique rate cards for every client (e.g., $1.50 per 1,000 views up to 100k views, $2.50 per 1,000 views above 100k).' },
  { q: 'Is there an audit log for financial payout reports?', a: 'Every view update and calculated payout is backed by historical view logs, allowing complete transparency and audit compliance for agency billing.' }
];

const comparisonData = [
  { feature: 'View Tracking Frequency', spreadsheet: 'Manual manual checks (once/week)', amplify: '⚡ Automatic background sync every 3 hours' },
  { feature: 'Payout Accuracy', spreadsheet: 'High human error in formula cells', amplify: '🎯 100% automated precision calculations' },
  { feature: 'Client Reporting', spreadsheet: 'Static, outdated PDF exports', amplify: '🌐 Live interactive white-labeled Client Portals' },
  { feature: 'Multi-Tier Rate Cards', spreadsheet: 'Complex Excel nested IF statements', amplify: '⚙️ Built-in visual tier builder per client' },
  { feature: 'Scale Capacity', spreadsheet: 'Breaks down after 20-30 reels', amplify: '🚀 Built to scale across 10,000+ active reels' },
];

const testimonials = [
  { quote: "Amplify eliminated over 25 hours of manual screenshot matching every month. Our clients love having their own live dashboard!", author: "Sarah Jenkins", role: "Founder @ Lumina Media Agency", rating: "5.0 ★★★★★" },
  { quote: "The tiered view payout calculator alone saved us thousands in billing miscalculations. It's an indispensable agency tool.", author: "Marcus Vance", role: "Head of Talent @ ViralPulse Studios", rating: "5.0 ★★★★★" },
  { quote: "Seamless tracking across Instagram and TikTok. We onboarded 40 creators in one afternoon and automated our entire end-of-month payout process.", author: "Elena Rostova", role: "Operations Lead @ Apex Creator Network", rating: "5.0 ★★★★★" },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = 'dark';
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeDemoTab, setActiveDemoTab] = useState('analytics');

  // ROI Calculator state
  const [calcClients, setCalcClients] = useState(12);
  const [calcViews, setCalcViews] = useState(2500); // in thousands
  const [calcRate, setCalcRate] = useState(2.5); // $ per 1k views
  const [calcBonusTier, setCalcBonusTier] = useState(true);

  // Simulated live terminal logs for live demo tab
  const [logs, setLogs] = useState([
    { id: 1, time: '19:32:01', status: 'SUCCESS', msg: 'Worker #4 synced Reel @fitness_pro_01 (+42.5K views)' },
    { id: 2, time: '19:32:08', status: 'INFO', msg: 'Calculated Tier Milestone (100K view threshold crossed)' },
    { id: 3, time: '19:32:15', status: 'SUCCESS', msg: 'Updated Client "Apex Brands" billing ledger: +$106.25' },
    { id: 4, time: '19:32:22', status: 'SYNC', msg: 'Triggering scheduled 3-hour background batch for 142 reels...' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toTimeString().split(' ')[0];
      const sampleLogs = [
        `Worker #2 synced TikTok @creator_daily (+18.4K views)`,
        `Client Portal session validated for "Zenith Campaign"`,
        `Milestone Alert dispatched: 500K views reached on reel #9402`,
        `CSV billing report exported by admin`,
        `Rate card multiplier applied: Tier 2 ($3.00 / 1k views)`
      ];
      const randomMsg = sampleLogs[Math.floor(Math.random() * sampleLogs.length)];
      const statuses = ['SUCCESS', 'INFO', 'SYNC'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      setLogs(prev => [
        { id: Date.now(), time: now, status: randomStatus, msg: randomMsg },
        ...prev.slice(0, 4)
      ]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const monthlyPayout = useMemo(() => {
    let base = calcViews * calcRate;
    if (calcBonusTier && calcViews > 1000) {
      base += (calcViews - 1000) * 0.75; // bonus tier simulation
    }
    return Math.round(base);
  }, [calcViews, calcRate, calcBonusTier]);

  const hoursSaved = useMemo(() => {
    return Math.round(calcClients * 14);
  }, [calcClients]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  useEffect(() => {
    if (user) navigate(rolePath(user.role), { replace: true });
  }, [user, navigate]);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="stitch-landing" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', Inter, -apple-system, sans-serif", position: 'relative', overflowX: 'hidden' }}>
      
      {/* ── Stitch & Ultra Luxe CSS Animations ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        
        @keyframes heroGlowPulse {
          0%, 100% { opacity: 0.45; transform: scale(1) translateY(0); }
          50% { opacity: 0.75; transform: scale(1.08) translateY(-15px); }
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(0.5deg); }
        }
        @keyframes gridShimmer {
          0% { background-position: 0 0; }
          100% { background-position: 50px 50px; }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(225,48,108,0.3); }
          50% { border-color: rgba(131,58,180,0.6); }
        }

        .hero-bg-grid {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
        }
        [data-theme="light"] .hero-bg-grid {
          background-image: linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px);
        }

        .glass-panel {
          background: rgba(17, 17, 17, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        [data-theme="light"] .glass-panel {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 20px 50px rgba(0,0,0,0.06);
        }

        .stitch-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .stitch-card:hover {
          border-color: rgba(225, 48, 108, 0.5);
          transform: translateY(-6px);
          box-shadow: 0 16px 36px -10px rgba(225, 48, 108, 0.2);
        }

        .stitch-glow-btn {
          position: relative;
          background: var(--gradient);
          color: white !important;
          font-weight: 700;
          border-radius: 12px;
          box-shadow: 0 6px 24px rgba(225, 48, 108, 0.4);
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          cursor: pointer;
        }
        .stitch-glow-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 32px rgba(225, 48, 108, 0.6);
          opacity: 0.98;
        }

        .stitch-outline-btn {
          background: var(--bg-card2);
          border: 1px solid var(--border);
          color: var(--text);
          font-weight: 700;
          border-radius: 12px;
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
        }
        .stitch-outline-btn:hover {
          border-color: var(--primary);
          background: rgba(225,48,108,0.05);
          transform: translateY(-2px);
        }

        .stitch-tag {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 30px;
          background: rgba(225,48,108,0.12);
          color: #E1306C;
          border: 1px solid rgba(225,48,108,0.25);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .demo-tab-btn {
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-muted);
          transition: all 0.2s ease;
        }
        .demo-tab-btn.active {
          background: var(--bg-card);
          color: var(--text);
          border-color: rgba(225,48,108,0.4);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .stitch-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: var(--bg-card2);
          outline: none;
          border: 1px solid var(--border);
        }
        .stitch-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--gradient);
          cursor: pointer;
          box-shadow: 0 0 14px rgba(225, 48, 108, 0.6);
          transition: transform 0.15s;
        }
        .stitch-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .landing-desktop-nav { display: flex !important; }
        .landing-mobile-nav { display: none !important; }
        @media (max-width: 868px) {
          .landing-desktop-nav { display: none !important; }
          .landing-mobile-nav { display: flex !important; }
        }
      `}</style>

      {/* ── Top Announcement Banner ── */}
      <div style={{ background: 'linear-gradient(90deg, #E1306C, #833AB4, #F77737)', padding: '8px 16px', textAlign: 'center', color: '#fff', fontSize: '13px', fontWeight: 700, letterSpacing: '0.3px', position: 'relative', zIndex: 101 }}>
        ✨ Amplify v3.0 Launched: Automated Multi-Tenant Creator Portals & 3-Hour Scraping Infrastructure ⚡
      </div>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '74px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <LogoIcon size={44} />
              <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', border: '2.5px solid var(--bg)', boxShadow: '0 0 8px #10b981' }} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '22px', letterSpacing: '-0.8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="gradient-text">Amplify</span>
                <span style={{ fontSize: '10px', background: 'rgba(131,58,180,0.18)', color: '#a855f7', border: '1px solid rgba(131,58,180,0.4)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, letterSpacing: '0.5px' }}>AGENCY OS</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }} className="landing-desktop-nav">
            <a href="#demo" style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, padding: '8px 12px', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >Live Demo</a>
            <a href="#features" style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, padding: '8px 12px', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >Capabilities</a>
            <a href="#calculator" style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, padding: '8px 12px', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >ROI Calculator</a>
            <a href="#comparison" style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, padding: '8px 12px', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >Why Amplify</a>
            <a href="#faq" style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, padding: '8px 12px', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >FAQ</a>
            
            <div style={{ width: '1px', height: '22px', background: 'var(--border)', margin: '0 4px' }} />
            
            <Link to="/login" style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 600, padding: '9px 20px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card2)', textDecoration: 'none' }}>
              Sign In
            </Link>
            <Link to="/register" className="stitch-glow-btn" style={{ padding: '10px 22px', fontSize: '14px' }}>
              Get Started Free →
            </Link>

          </div>

          {/* Mobile Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="landing-mobile-nav">
            <button onClick={() => setMobileMenu(v => !v)}
              style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text)', fontSize: '20px', padding: '7px 13px' }}>
              {mobileMenu ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenu && (
          <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <a href="#demo" onClick={() => setMobileMenu(false)} style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>Live Demo</a>
            <a href="#features" onClick={() => setMobileMenu(false)} style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>Capabilities</a>
            <a href="#calculator" onClick={() => setMobileMenu(false)} style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>ROI Calculator</a>
            <a href="#comparison" onClick={() => setMobileMenu(false)} style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>Why Amplify</a>
            <a href="#faq" onClick={() => setMobileMenu(false)} style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>FAQ</a>
            <div style={{ height: '1px', background: 'var(--border)' }} />
            <Link to="/login" style={{ textAlign: 'center', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card2)', textDecoration: 'none', color: 'var(--text)', fontWeight: 600 }} onClick={() => setMobileMenu(false)}>Sign In</Link>
            <Link to="/register" className="stitch-glow-btn" style={{ padding: '12px', textDecoration: 'none', textAlign: 'center' }} onClick={() => setMobileMenu(false)}>Get Started Free →</Link>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section className="hero-bg-grid" style={{ position: 'relative', padding: '90px 24px 70px', overflow: 'hidden' }}>
        
        {/* Glow ambient background graphics */}
        <div style={{
          position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
          width: '1100px', height: '550px',
          background: 'radial-gradient(ellipse at center, rgba(225,48,108,0.22) 0%, rgba(131,58,180,0.15) 35%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0, animation: 'heroGlowPulse 8s ease-in-out infinite'
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          
          {/* Floating Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'rgba(225,48,108,0.1)', border: '1px solid rgba(225,48,108,0.35)',
            borderRadius: '30px', padding: '8px 20px', fontSize: '13px', fontWeight: 800,
            color: '#E1306C', marginBottom: '32px', backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(225,48,108,0.15)'
          }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#E1306C', boxShadow: '0 0 10px #E1306C' }} />
            <span>INSTAGRAM & TIKTOK AGENCY REVENUE ENGINE</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(46px, 7vw, 86px)', fontWeight: 900, lineHeight: 1.05,
            letterSpacing: '-2.5px', marginBottom: '28px', maxWidth: '1080px', margin: '0 auto 28px'
          }}>
            Turn Viral Reel Views Into<br />
            <span className="gradient-text">Automated Agency Revenue.</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(17px, 2.2vw, 21px)', color: 'var(--text-muted)', lineHeight: 1.65,
            maxWidth: '760px', margin: '0 auto 44px', fontWeight: 500
          }}>
            Track real-time video performance, automate multi-tier client payout rate cards, and dispatch white-labeled Client Portals with zero manual overhead.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '18px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
            <Link to="/register" className="stitch-glow-btn" style={{ padding: '18px 40px', fontSize: '17px' }}>
              Launch Agency Portal →
            </Link>
            <a href="#demo" className="stitch-outline-btn" style={{ padding: '18px 34px', fontSize: '17px' }}>
              ⚡ Interactive Command Center
            </a>
          </div>

          {/* Live Stats Row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', marginBottom: '60px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981', fontSize: '18px' }}>✓</span> 3-Hour Background Sync
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981', fontSize: '18px' }}>✓</span> Multi-Tier Rate Cards
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981', fontSize: '18px' }}>✓</span> White-Labeled Client Portals
            </div>
          </div>

          {/* ── Interactive Command Center Showcase (Demo Section) ── */}
          <div id="demo" className="glass-panel" style={{
            maxWidth: '1040px', margin: '0 auto',
            borderRadius: '24px', padding: '10px',
            textAlign: 'left', animation: 'floatCard 8s ease-in-out infinite'
          }}>
            <div style={{ background: 'var(--bg-card2)', borderRadius: '18px', padding: '24px', border: '1px solid var(--border)' }}>
              
              {/* Terminal Header Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '18px', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
                  </div>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 700, fontFamily: 'monospace' }}>amplify-terminal://agency-command-center</span>
                </div>

                {/* Interactive Demo Navigation Tabs */}
                <div style={{ display: 'flex', gap: '6px', background: 'var(--bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <button onClick={() => setActiveDemoTab('analytics')} className={`demo-tab-btn ${activeDemoTab === 'analytics' ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><DashboardIcon size={14} /> Analytics</button>
                  <button onClick={() => setActiveDemoTab('portals')} className={`demo-tab-btn ${activeDemoTab === 'portals' ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ClientsIcon size={14} /> Client Portals</button>
                  <button onClick={() => setActiveDemoTab('ratecards')} className={`demo-tab-btn ${activeDemoTab === 'ratecards' ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ShieldIcon size={14} /> Rate Cards</button>
                  <button onClick={() => setActiveDemoTab('live_logs')} className={`demo-tab-btn ${activeDemoTab === 'live_logs' ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><SyncIcon size={14} /> Live Sync Log</button>
                </div>
              </div>

              {/* Tab 1: Analytics Demo */}
              {activeDemoTab === 'analytics' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '24px' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>Total Tracked Reel Views</div>
                      <div style={{ fontSize: '30px', fontWeight: 900, color: 'var(--text)' }}>4,829,140</div>
                      <div style={{ fontSize: '12px', color: '#10b981', marginTop: '6px', fontWeight: 800 }}>↑ +18.4% this week</div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>Active Client Accounts</div>
                      <div style={{ fontSize: '30px', fontWeight: 900, color: 'var(--text)' }}>18 Clients</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Across IG & TikTok</div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>Est. Monthly Client Payout</div>
                      <div className="gradient-text" style={{ fontSize: '30px', fontWeight: 900 }}>$12,072.85</div>
                      <div style={{ fontSize: '12px', color: '#a855f7', marginTop: '6px', fontWeight: 800 }}>Automated Tiered Payout</div>
                    </div>
                  </div>

                  {/* Simulated Visual Graph Bar */}
                  <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px', fontWeight: 700 }}>
                      <span>Reel View Growth Trajectory (Last 7 Days)</span>
                      <span style={{ color: '#E1306C' }}>● Instagram Reels (82%)</span>
                    </div>
                    <div style={{ display: 'flex', items: 'flex-end', gap: '12px', height: '120px', alignItems: 'flex-end', padding: '10px 0 0' }}>
                      {[40, 55, 35, 70, 85, 60, 95].map((val, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '100%', height: `${val}%`, background: 'var(--gradient)', borderRadius: '6px 6px 0 0', opacity: 0.85, transition: 'height 0.5s' }} />
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Day {i+1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Client Portals Demo */}
              {activeDemoTab === 'portals' && (
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: 800 }}>Client Portal Preview: Apex Growth Campaign</h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Dedicated secure view for brand sponsors and clients.</p>
                    </div>
                    <span className="stitch-tag" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>● Verified Portal Active</span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '10px' }}>Campaign Reel</th>
                        <th style={{ padding: '10px' }}>Views</th>
                        <th style={{ padding: '10px' }}>Current Rate Tier</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Calculated Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 700 }}>🎥 @fitness_pro / Summer Challenge</td>
                        <td style={{ padding: '12px 10px' }}>450,200</td>
                        <td style={{ padding: '12px 10px' }}><span style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>Tier 2 ($2.50/1K)</span></td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>$1,125.50</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 10px', fontWeight: 700 }}>🎥 @lifestyle_kate / Unboxing Vlog</td>
                        <td style={{ padding: '12px 10px' }}>890,100</td>
                        <td style={{ padding: '12px 10px' }}><span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>Tier 3 ($3.00/1K)</span></td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>$2,670.30</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 3: Rate Cards Demo */}
              {activeDemoTab === 'ratecards' && (
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Automated Tiered Payout Formulas</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Configure custom rate multipliers that automatically adjust payouts based on view brackets.</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{ background: 'var(--bg-card2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '12px', color: '#E1306C', fontWeight: 800 }}>TIER 1 (0 - 100K Views)</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, margin: '6px 0' }}>$1.50 / 1K</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Base engagement rate</div>
                    </div>
                    <div style={{ background: 'var(--bg-card2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '12px', color: '#a855f7', fontWeight: 800 }}>TIER 2 (100K - 500K Views)</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, margin: '6px 0' }}>$2.50 / 1K</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Viral boost multiplier</div>
                    </div>
                    <div style={{ background: 'var(--bg-card2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 800 }}>TIER 3 (500K+ Views)</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, margin: '6px 0' }}>$3.50 / 1K</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mega viral tier</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Live Sync Log Simulator */}
              {activeDemoTab === 'live_logs' && (
                <div style={{ background: '#090d16', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b', fontFamily: 'monospace', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #1e293b', fontWeight: 700 }}>
                    <span>BACKGROUND SCRAPER STREAM</span>
                    <span style={{ color: '#10b981' }}>● LIVE POLL 3h</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {logs.map(log => (
                      <div key={log.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>[{log.time}]</span>
                        <span style={{
                          padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800,
                          background: log.status === 'SUCCESS' ? 'rgba(16,185,129,0.2)' : log.status === 'SYNC' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)',
                          color: log.status === 'SUCCESS' ? '#34d399' : log.status === 'SYNC' ? '#60a5fa' : '#c084fc'
                        }}>
                          {log.status}
                        </span>
                        <span style={{ color: '#e2e8f0' }}>{log.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            { value: '3 Hours', label: 'Automated Scraping Sync' },
            { value: '99.99%', label: 'Scraper Uptime' },
            { value: '$5.4M+', label: 'Client Payouts Calculated' },
            { value: '100%', label: 'Audit-Ready Compliance' },
          ].map((stat, idx) => (
            <div key={idx} style={{
              padding: '32px 24px', textAlign: 'center',
              borderRight: idx < 3 ? '1px solid var(--border)' : 'none'
            }}>
              <div className="gradient-text" style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-1px' }}>{stat.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Capabilities Grid ── */}
      <section id="features" style={{ padding: '100px 24px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span className="stitch-tag">ENGINEERING EXCELLENCE</span>
            <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 900, marginTop: '16px', letterSpacing: '-1.2px' }}>
              Built specifically for content & talent agencies
            </h2>
            <p style={{ fontSize: '17px', color: 'var(--text-muted)', maxWidth: '600px', margin: '14px auto 0', lineHeight: 1.65 }}>
              Replace clunky manual spreadsheets and missed billing calculations with dedicated high-speed tracking architecture.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
            {features.map((f, i) => (
              <div key={i} className="stitch-card" style={{ padding: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{
                    width: '54px', height: '54px', borderRadius: '16px',
                    background: 'rgba(225,48,108,0.12)', border: '1px solid rgba(225,48,108,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px',
                    boxShadow: '0 4px 14px rgba(225,48,108,0.15)'
                  }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', background: 'var(--bg-card2)', padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>{f.tag}</span>
                </div>
                <h3 style={{ fontSize: '21px', fontWeight: 800, marginBottom: '12px', color: 'var(--text)' }}>{f.title}</h3>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── ROI & Revenue Calculator (Interactive Tool) ── */}
      <section id="calculator" style={{ padding: '100px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span className="stitch-tag" style={{ background: 'rgba(131,58,180,0.15)', color: '#a855f7', borderColor: 'rgba(131,58,180,0.35)' }}>INTERACTIVE ROI CALCULATOR</span>
            <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 900, marginTop: '16px', letterSpacing: '-1.2px' }}>
              Estimate Monthly Client Billing & Saved Hours
            </h2>
            <p style={{ fontSize: '17px', color: 'var(--text-muted)', maxWidth: '620px', margin: '14px auto 0' }}>
              Adjust your agency size and view volume below to project your automated monthly financial operations.
            </p>
          </div>

          <div className="glass-panel" style={{ background: 'var(--bg)', borderRadius: '24px', padding: '44px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '44px', alignItems: 'center' }}>
            
            {/* Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px', fontWeight: 700 }}>
                  <span>Active Managed Clients:</span>
                  <span style={{ color: '#E1306C', fontSize: '16px', fontWeight: 800 }}>{calcClients} Clients</span>
                </div>
                <input type="range" min="1" max="60" value={calcClients} onChange={e => setCalcClients(Number(e.target.value))} className="stitch-slider" />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px', fontWeight: 700 }}>
                  <span>Est. Monthly Tracked Views:</span>
                  <span style={{ color: '#a855f7', fontSize: '16px', fontWeight: 800 }}>{(calcViews * 1000).toLocaleString()} Views</span>
                </div>
                <input type="range" min="100" max="15000" step="100" value={calcViews} onChange={e => setCalcViews(Number(e.target.value))} className="stitch-slider" />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px', fontWeight: 700 }}>
                  <span>Base Payout Rate (per 1K views):</span>
                  <span style={{ color: '#F77737', fontSize: '16px', fontWeight: 800 }}>${calcRate.toFixed(2)} / 1K</span>
                </div>
                <input type="range" min="0.50" max="10.00" step="0.25" value={calcRate} onChange={e => setCalcRate(Number(e.target.value))} className="stitch-slider" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card2)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <input type="checkbox" id="bonusTier" checked={calcBonusTier} onChange={e => setCalcBonusTier(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#E1306C', cursor: 'pointer' }} />
                <label htmlFor="bonusTier" style={{ fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: 'var(--text)' }}>Enable Viral Bonus Tier Multiplier (&gt;1M views)</label>
              </div>
            </div>

            {/* Projected Output Display */}
            <div style={{ background: 'var(--bg-card2)', borderRadius: '20px', padding: '36px', border: '1px solid var(--border)', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '10px' }}>Projected Monthly Client Payout Operations</div>
              <div className="gradient-text" style={{ fontSize: 'clamp(40px, 5.5vw, 56px)', fontWeight: 900, marginBottom: '18px', letterSpacing: '-1px' }}>
                ${monthlyPayout.toLocaleString()}
              </div>

              <div style={{ height: '1px', background: 'var(--border)', margin: '24px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-around', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#10b981' }}>{hoursSaved} hrs</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Admin Saved / Month</div>
                </div>
                <div style={{ width: '1px', background: 'var(--border)' }} />
                <div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#a855f7' }}>3 Hours</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Auto-Sync Intervals</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── Comparison Table (Spreadsheets vs Amplify) ── */}
      <section id="comparison" style={{ padding: '100px 24px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span className="stitch-tag" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>THE UPGRADE</span>
            <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 900, marginTop: '16px', letterSpacing: '-1.2px' }}>
              Manual Spreadsheets vs. Amplify Agency OS
            </h2>
          </div>

          <div className="stitch-card" style={{ padding: '0', borderRadius: '20px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '15px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card2)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '20px 24px', fontWeight: 800 }}>Operational Feature</th>
                    <th style={{ padding: '20px 24px', fontWeight: 800, color: '#ef4444' }}>Traditional Manual Spreadsheets</th>
                    <th style={{ padding: '20px 24px', fontWeight: 800, color: '#10b981' }}>Amplify Automated Engine ⚡</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < comparisonData.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '20px 24px', fontWeight: 700, color: 'var(--text)' }}>{row.feature}</td>
                      <td style={{ padding: '20px 24px', color: 'var(--text-muted)' }}>{row.spreadsheet}</td>
                      <td style={{ padding: '20px 24px', fontWeight: 700, color: 'var(--text)' }}>{row.amplify}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* ── Workflow Steps ── */}
      <section style={{ padding: '100px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span className="stitch-tag" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>ONBOARDING WORKFLOW</span>
            <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 900, marginTop: '16px', letterSpacing: '-1.2px' }}>
              Operational in 3 simple steps
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '36px' }}>
            {steps.map((s, i) => (
              <div key={i} className="stitch-card" style={{ padding: '40px 32px', textAlign: 'center' }}>
                <div className="gradient-text" style={{ fontSize: '56px', fontWeight: 900, lineHeight: 1, marginBottom: '24px', letterSpacing: '-2px' }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '14px' }}>{s.title}</h3>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Testimonials & Social Proof ── */}
      <section style={{ padding: '100px 24px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span className="stitch-tag">AGENCY TRUST</span>
            <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 900, marginTop: '16px', letterSpacing: '-1.2px' }}>
              Loved by leading creator networks
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
            {testimonials.map((t, idx) => (
              <div key={idx} className="stitch-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#f59e0b', fontSize: '16px', marginBottom: '16px', fontWeight: 700 }}>{t.rating}</div>
                  <p style={{ fontSize: '16px', color: 'var(--text)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '24px' }}>
                    "{t.quote}"
                  </p>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '16px' }}>{t.author}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" style={{ padding: '100px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span className="stitch-tag">FREQUENTLY ASKED QUESTIONS</span>
            <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 44px)', fontWeight: 900, marginTop: '16px', letterSpacing: '-1.2px' }}>
              Everything you need to know
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} style={{
                  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px',
                  overflow: 'hidden', transition: 'all 0.2s'
                }}>
                  <button onClick={() => toggleFaq(idx)} style={{
                    width: '100%', padding: '24px', background: 'none', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    color: 'var(--text)', fontSize: '17px', fontWeight: 800, cursor: 'pointer', textAlign: 'left'
                  }}>
                    <span>{faq.q}</span>
                    <span style={{ fontSize: '22px', color: 'var(--primary)', transition: 'transform 0.25s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>↓</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 24px 24px', color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.75, borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── Final High Conversion Banner ── */}
      <section style={{ padding: '120px 24px', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '800px', height: '400px',
          background: 'radial-gradient(circle at center, rgba(225,48,108,0.18) 0%, rgba(131,58,180,0.12) 50%, transparent 80%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="stitch-tag" style={{ background: 'rgba(247,119,55,0.15)', color: '#F77737', borderColor: 'rgba(247,119,55,0.35)' }}>READY TO SCALE YOUR AGENCY?</span>
          <h2 style={{ fontSize: 'clamp(36px, 5.5vw, 60px)', fontWeight: 900, marginTop: '24px', marginBottom: '24px', letterSpacing: '-2px', lineHeight: 1.08 }}>
            Streamline your Instagram & TikTok reel view operations today.
          </h2>
          <p style={{ fontSize: '19px', color: 'var(--text-muted)', marginBottom: '44px', lineHeight: 1.65 }}>
            Join top content agencies leveraging automated 3-hour syncs and audit-proof client billing.
          </p>
          <Link to="/register" className="stitch-glow-btn" style={{ padding: '20px 48px', fontSize: '18px' }}>
            Create Free Agency Workspace →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '50px 24px', background: 'var(--bg-card)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogoIcon size={36} /></div>
            <span style={{ fontWeight: 900, fontSize: '19px', letterSpacing: '-0.5px' }}>Amplify Agency OS</span>
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            © {new Date().getFullYear()} Amplify Systems Inc. Automated Reels & TikTok Billing Infrastructure.
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
            <Link to="/register" style={{ color: 'var(--primary)', fontSize: '14px', textDecoration: 'none', fontWeight: 800 }}>Register Account</Link>
          </div>

        </div>
      </footer>

    </div>
  );
}
