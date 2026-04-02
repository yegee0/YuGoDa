import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authPartner } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useStore } from '@/app/store/useStore';
import { api } from '@/lib/api';

// ── palette ────────────────────────────────────────────────────
const C = {
  forest: '#0e2e1e',
  lime:   '#c5f135',
  cream:  '#f5f0e8',
  white:  '#ffffff',
};

// ── font helpers ───────────────────────────────────────────────
const playfair: React.CSSProperties = { fontFamily: '"Playfair Display", Georgia, serif' };
const dm:       React.CSSProperties = { fontFamily: '"DM Sans", system-ui, sans-serif' };
const mono:     React.CSSProperties = { fontFamily: '"DM Mono", "Courier New", monospace' };

// ── icons ──────────────────────────────────────────────────────
function MailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={C.cream} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity: 0.35 }}>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 7l10 7 10-7"/>
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={C.cream} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity: 0.35 }}>
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={C.cream} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity: 0.35 }}>
      <path d="M3 9l1-5h16l1 5"/>
      <path d="M3 9a2 2 0 002 2 2 2 0 002-2 2 2 0 002 2 2 2 0 002-2 2 2 0 002 2 2 2 0 002-2"/>
      <path d="M5 21V11M19 11v10M9 21v-6h6v6"/>
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={C.cream} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity: 0.35 }}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.14 1.19 2 2 0 012.13 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  );
}
function MapPinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={C.cream} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity: 0.35 }}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function ArrowRight({ on }: { on: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s ease', transform: on ? 'translateX(4px)' : 'translateX(0)' }}>
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
export default function RestaurantAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useStore();

  const [tab, setTab]         = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'login' ? 'signin' : 'signup'
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [msg,     setMsg]     = useState('');
  const [ctaHover, setCtaHover] = useState(false);
  const [focused,  setFocused]  = useState('');

  // tab underline
  const signinRef = useRef<HTMLButtonElement>(null);
  const signupRef = useRef<HTMLButtonElement>(null);
  const tabsRef   = useRef<HTMLDivElement>(null);
  const [tabLine, setTabLine] = useState<React.CSSProperties>({});

  useEffect(() => {
    const btn = tab === 'signin' ? signinRef.current : signupRef.current;
    const bar = tabsRef.current;
    if (!btn || !bar) return;
    const br = btn.getBoundingClientRect();
    const tr = bar.getBoundingClientRect();
    setTabLine({
      width: `${br.width}px`,
      left:  `${br.left - tr.left}px`,
      transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1)',
    });
  }, [tab]);

  const [form, setForm] = useState({
    firstName: '', lastName: '',
    email: '', password: '',
    phone: '', businessName: '',
    address: '', businessType: 'Restaurant',
  });
  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [field]: e.target.value }));

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
      if (tab === 'signin') {
        await signInWithEmailAndPassword(authPartner, form.email, form.password);
      } else {
        if (!form.email || !form.password || !form.businessName)
          throw new Error('Email, password and business name are required.');
        await createUserWithEmailAndPassword(authPartner, form.email, form.password);
        const displayName = `${form.firstName} ${form.lastName}`.trim() || form.email;
        await api.post('/users/register', {
          displayName, firstName: form.firstName, lastName: form.lastName,
          role: 'restaurant', phone: form.phone, businessName: form.businessName, address: form.address,
        });
        await api.post('/stores', {
          name: form.businessName, category: form.businessType,
          address: form.address, phone: form.phone, email: form.email,
        }).catch(() => {});
        setMsg('Account created! Redirecting…');
      }
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '')?.replace(/\(auth\/.*?\)\.?/, '').trim() || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // ── shared input style ─────────────────────────────────────
  const inp = (name: string, withIcon = true): React.CSSProperties => ({
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: `1.5px solid ${focused === name ? C.lime : 'rgba(255,255,255,0.14)'}`,
    borderRadius: '10px',
    padding: withIcon ? '11px 14px 11px 38px' : '11px 14px',
    fontSize: '14px',
    color: C.cream,
    outline: 'none',
    transition: 'border-color 0.18s ease',
    ...dm,
    fontWeight: 400,
    boxSizing: 'border-box' as const,
  });

  const lbl: React.CSSProperties = {
    ...mono,
    display: 'block',
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'rgba(197,241,53,0.6)',
    marginBottom: '6px',
  };

  const iconWrap: React.CSSProperties = {
    position: 'absolute', left: '12px', top: '50%',
    transform: 'translateY(-50%)', pointerEvents: 'none',
    display: 'flex', alignItems: 'center',
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex relative bg-cover bg-center bg-fixed w-full"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=2070')" }}
    >
      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 w-full flex flex-col lg:flex-row min-h-screen">

        {/* ══════════════════════════════════════════════════
            LEFT PANEL — keep exactly as before
        ══════════════════════════════════════════════════ */}
        <div className="w-full lg:w-1/2 flex flex-col p-8 md:py-16 md:px-20 text-white overflow-y-auto">
          <div className="max-w-2xl mt-8 lg:mt-12">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Reach Millions of Users with the #1 On-Demand Delivery App
            </h1>
            <p className="text-lg text-white/90 mb-10">
              Sign up to list your business on the YuGoDa platform. Reach more users, reduce food waste, and increase your revenue.
            </p>
            <div className="flex gap-4 items-center mb-16">
              <span className="w-12 h-1 bg-emerald-400" />
              <span className="text-sm font-bold uppercase tracking-widest text-white/80">
                Partner Portal
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT PANEL — modernised form
        ══════════════════════════════════════════════════ */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 overflow-y-auto">
          <div style={{
            width: '100%',
            maxWidth: '480px',
            background: 'rgba(15, 30, 20, 0.72)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderRadius: '20px',
            padding: '44px 40px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
            border: '1px solid rgba(197,241,53,0.08)',
            ...dm,
          }}>

            {/* tab switcher */}
            <div ref={tabsRef} style={{
              display: 'flex',
              position: 'relative',
              borderBottom: '1.5px solid rgba(255,255,255,0.12)',
              marginBottom: '32px',
            }}>
              {(['signup', 'signin'] as const).map(t => (
                <button
                  key={t}
                  ref={t === 'signin' ? signinRef : signupRef}
                  onClick={() => { setTab(t); setError(''); setMsg(''); }}
                  style={{
                    ...dm,
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '0 4px 14px 4px',
                    marginRight: '28px',
                    fontSize: '14px',
                    fontWeight: tab === t ? 500 : 400,
                    color: tab === t ? C.lime : 'rgba(255,255,255,0.4)',
                    transition: 'color 0.2s',
                  }}
                >
                  {t === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
              <div style={{
                position: 'absolute', bottom: '-1.5px',
                height: '2.5px', background: C.lime,
                borderRadius: '2px', ...tabLine,
              }}/>
            </div>

            {/* title */}
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ ...playfair, fontSize: '26px', fontWeight: 600, color: C.cream, margin: 0, lineHeight: 1.2 }}>
                {tab === 'signin' ? 'Welcome back.' : 'Join as a partner.'}
              </h2>
              <p style={{ ...dm, fontSize: '13px', fontWeight: 300, color: 'rgba(245,240,232,0.5)', marginTop: '6px' }}>
                {tab === 'signin'
                  ? 'Sign in to manage your restaurant dashboard.'
                  : 'List your business and start saving food today.'}
              </p>
            </div>

            {/* feedback */}
            {error && (
              <div style={{ background: '#fef2f0', border: '1px solid #f5c6bc', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#c0392b', marginBottom: '16px', ...dm }}>
                {error}
              </div>
            )}
            {msg && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#166534', marginBottom: '16px', ...dm }}>
                {msg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* sign-up only fields */}
              {tab === 'signup' && (
                <>
                  {/* first + last name */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={lbl}>First name</label>
                      <input type="text" value={form.firstName} onChange={set('firstName')}
                        onFocus={() => setFocused('firstName')} onBlur={() => setFocused('')}
                        placeholder="Ahmet" style={{ ...inp('firstName', false) }} />
                    </div>
                    <div>
                      <label style={lbl}>Last name</label>
                      <input type="text" value={form.lastName} onChange={set('lastName')}
                        onFocus={() => setFocused('lastName')} onBlur={() => setFocused('')}
                        placeholder="Yılmaz" style={{ ...inp('lastName', false) }} />
                    </div>
                  </div>

                  {/* phone */}
                  <div>
                    <label style={lbl}>Phone number</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        style={{
                          background: 'rgba(255,255,255,0.07)',
                          border: '1.5px solid rgba(255,255,255,0.14)',
                          borderRadius: '10px',
                          padding: '11px 10px',
                          fontSize: '13px',
                          color: C.cream,
                          outline: 'none',
                          ...dm,
                          flexShrink: 0,
                        }}
                      >
                        <option style={{ background: '#0e2e1e', color: '#f5f0e8' }}>TR +90</option>
                        <option style={{ background: '#0e2e1e', color: '#f5f0e8' }}>US +1</option>
                        <option style={{ background: '#0e2e1e', color: '#f5f0e8' }}>UK +44</option>
                      </select>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <span style={iconWrap}><PhoneIcon /></span>
                        <input type="tel" value={form.phone} onChange={set('phone')}
                          onFocus={() => setFocused('phone')} onBlur={() => setFocused('')}
                          placeholder="555 123 4567" style={inp('phone')} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* email */}
              <div>
                <label style={lbl}>Email address</label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrap}><MailIcon /></span>
                  <input type="email" required value={form.email} onChange={set('email')}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                    placeholder="you@restaurant.com" style={inp('email')} />
                </div>
              </div>

              {/* password */}
              <div>
                <label style={lbl}>Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrap}><LockIcon /></span>
                  <input type="password" required value={form.password} onChange={set('password')}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                    placeholder="••••••••" style={inp('password')} />
                </div>
              </div>

              {/* sign-up business fields */}
              {tab === 'signup' && (
                <>
                  {/* business name */}
                  <div>
                    <label style={lbl}>Business name *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={iconWrap}><StoreIcon /></span>
                      <input type="text" required value={form.businessName} onChange={set('businessName')}
                        onFocus={() => setFocused('businessName')} onBlur={() => setFocused('')}
                        placeholder="e.g. Sam's Bakery" style={inp('businessName')} />
                    </div>
                  </div>

                  {/* address */}
                  <div>
                    <label style={lbl}>Business address</label>
                    <div style={{ position: 'relative' }}>
                      <span style={iconWrap}><MapPinIcon /></span>
                      <input type="text" value={form.address} onChange={set('address')}
                        onFocus={() => setFocused('address')} onBlur={() => setFocused('')}
                        placeholder="Start typing…" style={inp('address')} />
                    </div>
                  </div>

                  {/* business type */}
                  <div>
                    <label style={lbl}>Business type</label>
                    <select value={form.businessType} onChange={set('businessType')}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1.5px solid rgba(255,255,255,0.14)',
                        borderRadius: '10px',
                        padding: '11px 14px',
                        fontSize: '14px',
                        color: C.cream,
                        outline: 'none',
                        ...dm,
                        appearance: 'none',
                        boxSizing: 'border-box',
                      }}>
                      <option style={{ background: '#0e2e1e', color: '#f5f0e8' }}>Restaurant</option>
                      <option style={{ background: '#0e2e1e', color: '#f5f0e8' }}>Bakery & Patisserie</option>
                      <option style={{ background: '#0e2e1e', color: '#f5f0e8' }}>Grocery Store</option>
                      <option style={{ background: '#0e2e1e', color: '#f5f0e8' }}>Cafe</option>
                    </select>
                  </div>
                </>
              )}

              {/* CTA */}
              <button
                type="submit"
                disabled={loading}
                onMouseEnter={() => setCtaHover(true)}
                onMouseLeave={() => setCtaHover(false)}
                style={{
                  ...dm,
                  marginTop: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: loading ? '#2a5c3a' : ctaHover ? '#0a2016' : C.forest,
                  color: C.lime,
                  border: 'none', borderRadius: '12px',
                  padding: '14px 20px',
                  fontSize: '15px', fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.18s ease',
                  width: '100%',
                }}
              >
                {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Partner Account'}
                {!loading && <ArrowRight on={ctaHover} />}
              </button>
            </form>

            {/* footer */}
            <p style={{ ...mono, marginTop: '24px', fontSize: '10px', color: 'rgba(255,255,255,0.22)', textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              By continuing you agree to YuGoDa's Terms & Conditions
            </p>

            <p style={{ ...dm, marginTop: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontWeight: 300 }}>
              <button
                onClick={() => navigate('/')}
                style={{ ...dm, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(197,241,53,0.7)', fontWeight: 500, fontSize: '13px', padding: 0, textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                ← Back to homepage
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
