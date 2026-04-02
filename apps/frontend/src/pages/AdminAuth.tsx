import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { authAdmin } from '@/lib/firebase';
import { useStore } from '@/app/store/useStore';

// ── palette ────────────────────────────────────────────────────
const C = {
  forest:  '#0e2e1e',
  lime:    '#c5f135',
  orange:  '#e05a2b',
  cream:   '#f5f0e8',
  white:   '#ffffff',
  bg:      '#0e2e1e',
};

// ── font helpers ───────────────────────────────────────────────
const playfair: React.CSSProperties = { fontFamily: '"Playfair Display", Georgia, serif' };
const dm:       React.CSSProperties = { fontFamily: '"DM Sans", system-ui, sans-serif' };
const mono:     React.CSSProperties = { fontFamily: '"DM Mono", "Courier New", monospace' };

// ── permission lines ───────────────────────────────────────────
const PERMISSIONS = [
  'END-TO-END ENCRYPTED',
  'SESSION LOGGING ACTIVE',
  '2FA REQUIRED',
];

// ── blob shapes ────────────────────────────────────────────────
function BlobLime() {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', top: '-70px', right: '-90px', width: '340px', opacity: 0.13, pointerEvents: 'none' }}>
      <path fill={C.lime}
        d="M330,220Q290,290,220,330Q150,370,100,310Q50,250,60,170Q70,90,150,60Q230,30,290,90Q350,150,330,220Z"/>
    </svg>
  );
}
function BlobOrange() {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', bottom: '-50px', left: '-70px', width: '300px', opacity: 0.13, pointerEvents: 'none' }}>
      <path fill={C.orange}
        d="M280,200Q260,280,180,300Q100,320,70,240Q40,160,90,100Q140,40,220,60Q300,80,300,160Q300,200,280,200Z"/>
    </svg>
  );
}

// ── shield icon ───────────────────────────────────────────────
function ShieldIcon({ size = 28, color = C.lime }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

// ── envelope icon ─────────────────────────────────────────────
function EnvelopeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={C.forest} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity: 0.3 }}>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 7l10 7 10-7"/>
    </svg>
  );
}

// ── lock icon ─────────────────────────────────────────────────
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={C.forest} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity: 0.3 }}>
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

// ── animated arrow ────────────────────────────────────────────
function ArrowRight({ animating }: { animating: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s ease', transform: animating ? 'translateX(4px)' : 'translateX(0)' }}>
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
export default function AdminAuth() {
  const navigate  = useNavigate();
  const { userProfile } = useStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [msg,      setMsg]      = useState('');
  const [loading,  setLoading]  = useState(false);
  const [ctaHover, setCtaHover] = useState(false);
  const [focused,  setFocused]  = useState('');

  // pulse animation state for the dot
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 900);
    return () => clearInterval(t);
  }, []);

  // redirect if already authenticated
  useEffect(() => {
    if (userProfile && !loading && !error) {
      if (userProfile.role === 'admin')           navigate('/admin',      { replace: true });
      else if (userProfile.role === 'restaurant') navigate('/restaurant', { replace: true });
      else                                        navigate('/discover',   { replace: true });
    }
  }, [userProfile, navigate, loading, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(authAdmin, email, password);
    } catch (err: any) {
      setError(
        err.message?.replace('Firebase: ', '')?.replace(/\(auth\/.*?\)\.?/, '').trim()
        || 'Authentication failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email above first.'); return; }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(authAdmin, email);
      setMsg('Reset link sent — check your inbox.');
    } catch (err: any) {
      setError(
        err.message?.replace('Firebase: ', '')?.replace(/\(auth\/.*?\)\.?/, '').trim()
        || 'Failed to send reset email.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── input style helper ───────────────────────────────────────
  const inputStyle = (name: string): React.CSSProperties => ({
    width: '100%',
    background: C.white,
    border: `1.5px solid ${focused === name ? C.forest : 'rgba(14,46,30,0.1)'}`,
    borderRadius: '10px',
    padding: '11px 14px 11px 40px',
    fontSize: '14px',
    color: '#1a1a1a',
    outline: 'none',
    transition: 'border-color 0.18s ease',
    ...dm,
    fontWeight: 400,
    boxSizing: 'border-box',
  });

  const labelStyle: React.CSSProperties = {
    ...mono,
    display: 'block',
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#6b6458',
    marginBottom: '6px',
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: '"DM Sans", system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
<div style={{
        width: '100%',
        maxWidth: '960px',
        display: 'flex',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
      }}>

        {/* ══════════════════════════════════════════════════
            LEFT PANEL
        ══════════════════════════════════════════════════ */}
        <div style={{
          width: '55%',
          background: '#0a2318',
          padding: '52px 48px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }} className="hidden lg:flex">

          <BlobLime />
          <BlobOrange />

          {/* pill tag */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(197,241,53,0.08)',
            border: '1px solid rgba(197,241,53,0.22)',
            borderRadius: '999px',
            padding: '6px 14px 6px 10px',
            width: 'fit-content',
            marginBottom: '40px',
          }}>
            <span style={{
              width: '7px', height: '7px',
              borderRadius: '50%',
              background: C.lime,
              boxShadow: pulse ? `0 0 0 4px rgba(197,241,53,0.18), 0 0 10px ${C.lime}` : `0 0 6px ${C.lime}`,
              display: 'block',
              flexShrink: 0,
              transition: 'box-shadow 0.5s ease',
            }}/>
            <span style={{
              ...mono,
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.lime,
            }}>Admin Access</span>
          </div>

          {/* shield container */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'rgba(197,241,53,0.07)',
            border: '1.5px solid rgba(197,241,53,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '28px',
            flexShrink: 0,
          }}>
            <ShieldIcon size={26} color={C.lime} />
          </div>

          {/* headline */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              ...playfair,
              fontSize: 'clamp(30px, 3.2vw, 44px)',
              lineHeight: 1.15,
              color: '#f5f0e8',
              margin: 0,
              fontWeight: 600,
            }}>
              Secure admin<br/>
              <em style={{ color: C.lime, fontStyle: 'italic', fontWeight: 400 }}>portal.</em>
            </h1>

            <p style={{
              ...dm,
              marginTop: '20px',
              color: 'rgba(245,240,232,0.5)',
              fontSize: '14px',
              fontWeight: 300,
              lineHeight: 1.65,
              maxWidth: '320px',
            }}>
              Authorized personnel only. All actions are logged and audited in real time.
            </p>
          </div>

          {/* permission lines */}
          <div style={{
            paddingTop: '28px',
            borderTop: '1px solid rgba(245,240,232,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {PERMISSIONS.map((line) => (
              <div key={line} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '5px', height: '5px',
                  borderRadius: '50%',
                  background: C.lime,
                  opacity: 0.7,
                  flexShrink: 0,
                  display: 'block',
                }}/>
                <span style={{
                  ...mono,
                  fontSize: '10px',
                  fontWeight: 400,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(245,240,232,0.35)',
                }}>{line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT PANEL
        ══════════════════════════════════════════════════ */}
        <div style={{
          flex: 1,
          background: C.cream,
          padding: '52px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>

          {/* title */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              ...playfair,
              fontSize: '30px',
              fontWeight: 600,
              color: C.forest,
              margin: 0,
              lineHeight: 1.2,
            }}>Welcome back.</h2>
            <p style={{
              ...dm,
              fontSize: '14px',
              fontWeight: 300,
              color: '#7a7268',
              marginTop: '7px',
            }}>Sign in to access the admin dashboard.</p>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* email */}
            <div>
              <label style={labelStyle}>Email address</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '13px', top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none',
                  display: 'flex', alignItems: 'center',
                }}>
                  <EnvelopeIcon />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  placeholder="admin@yugoda.com"
                  style={inputStyle('email')}
                />
              </div>
            </div>

            {/* password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    ...mono,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '10px', fontWeight: 400,
                    letterSpacing: '0.06em',
                    color: '#9e9589', padding: 0,
                    textTransform: 'uppercase',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.forest)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9e9589')}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '13px', top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none',
                  display: 'flex', alignItems: 'center',
                }}>
                  <LockIcon />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  placeholder="••••••••"
                  style={inputStyle('password')}
                />
              </div>
            </div>

            {/* 2FA badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(14,46,30,0.06)',
                border: '1px solid rgba(14,46,30,0.12)',
                borderRadius: '999px',
                padding: '4px 10px 4px 8px',
              }}>
                <ShieldIcon size={11} color={C.forest} />
                <span style={{
                  ...mono,
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(14,46,30,0.5)',
                }}>2FA enabled</span>
              </div>
            </div>

            {/* error / success */}
            {error && (
              <div style={{
                background: '#fef2f0',
                border: '1px solid #f5c6bc',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                color: '#c0392b',
                ...dm,
              }}>{error}</div>
            )}
            {msg && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                color: '#166534',
                ...dm,
              }}>{msg}</div>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              style={{
                ...dm,
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: loading ? '#2a5c3a' : ctaHover ? '#0a2016' : C.forest,
                color: C.lime,
                border: 'none',
                borderRadius: '12px',
                padding: '14px 20px',
                fontSize: '15px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.18s ease',
                letterSpacing: '0.01em',
                width: '100%',
              }}
            >
              {loading ? 'Authenticating…' : 'Secure Sign In'}
              {!loading && <ArrowRight animating={ctaHover} />}
            </button>
          </form>

          {/* footer version string */}
          <p style={{
            ...mono,
            marginTop: '36px',
            fontSize: '10px',
            fontWeight: 400,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(14,46,30,0.25)',
            textAlign: 'center',
          }}>
            YuGoDa Admin · v2.4.1
          </p>
        </div>

      </div>
    </div>
  );
}
