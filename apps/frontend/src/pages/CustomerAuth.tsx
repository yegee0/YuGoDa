import React, { useState, useEffect, useRef } from 'react';
import { authCustomer, signOutOtherProjects } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/app/store/useStore';
import { api } from '@/lib/api';

// ── colour tokens ──────────────────────────────────────────────
const C = {
  forest:  '#0e2e1e',
  forestMid: '#163d28',
  lime:    '#c5f135',
  orange:  '#e05a2b',
  cream:   '#f5f0e8',
  white:   '#ffffff',
};

// ── font helpers ───────────────────────────────────────────────
import { FONT_PLAYFAIR as playfair, FONT_DM as dm, LANDING_STATS } from '@/lib/constants';

// Auth page surfaces 3 of the 4 landing stats (CO₂ omitted — visual parity with design).
const STATS = LANDING_STATS.slice(0, 3);

// ── blob SVG paths (decorative, low opacity) ──────────────────
function BlobLime() {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', top: '-80px', right: '-100px', width: '380px', opacity: 0.12, pointerEvents: 'none' }}>
      <path fill={C.lime}
        d="M330,220Q290,290,220,330Q150,370,100,310Q50,250,60,170Q70,90,150,60Q230,30,290,90Q350,150,330,220Z"/>
    </svg>
  );
}
function BlobOrange() {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', bottom: '-60px', left: '-80px', width: '320px', opacity: 0.15, pointerEvents: 'none' }}>
      <path fill={C.orange}
        d="M280,200Q260,280,180,300Q100,320,70,240Q40,160,90,100Q140,40,220,60Q300,80,300,160Q300,200,280,200Z"/>
    </svg>
  );
}
function BlobLimeSmall() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', top: '45%', left: '10px', width: '140px', opacity: 0.07, pointerEvents: 'none' }}>
      <path fill={C.lime}
        d="M150,100Q140,160,90,160Q40,160,30,100Q20,40,80,30Q140,20,150,70Q160,100,150,100Z"/>
    </svg>
  );
}

// ── Google logo SVG ────────────────────────────────────────────
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

// ── arrow icon ────────────────────────────────────────────────
function ArrowRight({ animating }: { animating: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s ease', transform: animating ? 'translateX(4px)' : 'translateX(0)' }}>
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
export default function Auth() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userProfile } = useStore();

  const [tab, setTab] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [tabLineStyle, setTabLineStyle] = useState<React.CSSProperties>({});
  const signinRef  = useRef<HTMLButtonElement>(null);
  const signupRef  = useRef<HTMLButtonElement>(null);
  const tabsRef    = useRef<HTMLDivElement>(null);

  // form fields
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [error,       setError]       = useState('');
  const [msg,         setMsg]         = useState('');
  const [loading,     setLoading]     = useState(false);
  const [ctaHover,    setCtaHover]    = useState(false);

  // Focus state for inputs
  const [focused, setFocused] = useState<string>('');

  // ── sync tab underline position ───────────────────────────
  useEffect(() => {
    const btn = tab === 'signin' ? signinRef.current : signupRef.current;
    const bar = tabsRef.current;
    if (!btn || !bar) return;
    const btnRect = btn.getBoundingClientRect();
    const barRect = bar.getBoundingClientRect();
    setTabLineStyle({
      width:  `${btnRect.width}px`,
      left:   `${btnRect.left - barRect.left}px`,
      transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1)',
    });
  }, [tab]);

  useEffect(() => {
    setTab(searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  }, [searchParams]);

  // ── handle Google redirect result on page load ────────────
  useEffect(() => {
    getRedirectResult(authCustomer).catch(() => {/* no redirect pending */});
  }, []);

  // ── redirect only if already logged in as the SAME role (customer) ─
  // A different-role session does NOT redirect; the user can sign in to switch.
  useEffect(() => {
    if (userProfile?.role === 'customer' && !loading && !error) {
      navigate('/discover', { replace: true });
    }
  }, [userProfile, navigate, loading, error]);

  // ── form submit ───────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    try {
      // Purge any other-role Firebase sessions first so the incoming principal
      // is unambiguous and `useAuthInit` never holds two live roles at once.
      await signOutOtherProjects('customer');
      if (tab === 'signin') {
        await signInWithEmailAndPassword(authCustomer, email, password);
      } else {
        const displayName = [firstName, lastName].filter(Boolean).join(' ') || email;
        await createUserWithEmailAndPassword(authCustomer, email, password);
        try {
          const data = await api.post('/users/register', {
            displayName,
            firstName,
            lastName,
            role: 'customer',
          });
          if (data.user) {
            const store = useStore.getState();
            store.setUserProfile({
              ...data.user,
              favorites: data.user.favorites || [],
              addresses: data.user.addresses || [],
              notificationsEnabled: data.user.notificationsEnabled ?? true,
              preferredLanguage: data.user.preferredLanguage || 'en',
            });
          }
        } catch (apiErr) {
          console.error('Backend registration failed:', apiErr);
        }
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/user-disabled') {
        setError(t('auth_user_disabled'));
      } else if (code === 'auth/email-already-in-use') {
        setError(t('auth_error_email_in_use'));
      } else {
        const message = err instanceof Error ? err.message : '';
        setError(message?.replace('Firebase: ', '')?.replace(/\(auth\/.*?\)\.?/, '').trim() || t('auth_error_generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Google sign-in ────────────────────────────────────────
  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    // Explicit scopes so Google always returns email + basic profile fields,
    // which the backend uses for cross-provider account linking. Without these,
    // some Firebase project configurations omit the email claim from the
    // resulting ID token and the backend can't resolve the user back to their
    // existing email/password row.
    provider.addScope('email');
    provider.addScope('profile');
    try {
      // Sign out other-role sessions BEFORE OAuth so a returning redirect can
      // only resolve against the customer principal.
      await signOutOtherProjects('customer');
      await signInWithPopup(authCustomer, provider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      // Popup blocked or closed — fall back to redirect flow
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(authCustomer, provider);
          return; // page will reload after redirect
        } catch (redirectErr: unknown) {
          const redirectMessage = redirectErr instanceof Error ? redirectErr.message : '';
          setError(redirectMessage?.replace('Firebase: ', '')?.replace(/\(auth\/.*?\)\.?/, '').trim() || t('auth_error_google_signin_failed'));
        }
      } else {
        const msg = err instanceof Error ? err.message?.replace('Firebase: ', '')?.replace(/\(auth\/.*?\)\.?/, '').trim() : '';
        setError(
          code === 'auth/user-disabled'
            ? t('auth_user_disabled')
            : code === 'auth/unauthorized-domain'
            ? t('auth_error_google_unauthorized_domain')
            : code === 'auth/operation-not-allowed'
            ? t('auth_error_google_not_enabled')
            : msg || t('auth_error_google_signin_failed')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ── forgot password ───────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email) { setError(t('auth_error_email_first')); return; }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(authCustomer, email);
      setMsg(t('auth_success_reset_sent'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setError(message?.replace('Firebase: ', '')?.replace(/\(auth\/.*?\)\.?/, '').trim() || t('auth_error_reset_failed'));
    } finally {
      setLoading(false);
    }
  };

  // ── input style helper ────────────────────────────────────
  const inputStyle = (name: string): React.CSSProperties => ({
    width: '100%',
    background: C.white,
    border: `1.5px solid ${focused === name ? C.forest : '#d9d3c7'}`,
    borderRadius: '10px',
    padding: '11px 14px',
    fontSize: '14px',
    color: '#1a1a1a',
    outline: 'none',
    transition: 'border-color 0.18s ease',
    fontFamily: '"DM Sans", system-ui, sans-serif',
    fontWeight: 400,
  });

  const labelStyle: React.CSSProperties = {
    ...dm,
    display: 'block',
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#6b6458',
    marginBottom: '6px',
  };

  // ─────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: C.forest,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: '"DM Sans", system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '960px',
        display: 'flex',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
      }}>

        {/* ══════════════════════════════════════════════════
            LEFT PANEL  (55%)
        ══════════════════════════════════════════════════ */}
        <div style={{
          width: '55%',
          background: C.forest,
          padding: '52px 48px',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }} className="hidden lg:flex">

          {/* decorative blobs */}
          <BlobLime />
          <BlobOrange />
          <BlobLimeSmall />

          {/* pill tag */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(197,241,53,0.1)',
            border: '1px solid rgba(197,241,53,0.25)',
            borderRadius: '999px',
            padding: '6px 14px 6px 10px',
            width: 'fit-content',
            marginBottom: '48px',
          }}>
            <span style={{
              width: '7px', height: '7px',
              borderRadius: '50%',
              background: C.lime,
              boxShadow: `0 0 8px ${C.lime}`,
              display: 'block',
              flexShrink: 0,
            }}/>
            <span style={{
              ...dm,
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.lime,
            }}>{t('auth_hero_pill')}</span>
          </div>

          {/* headline */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              ...playfair,
              fontSize: 'clamp(36px, 3.8vw, 52px)',
              lineHeight: 1.1,
              color: C.cream,
              margin: 0,
              fontWeight: 600,
            }}>
              {t('auth_hero_headline_1')}<br/>
              <em style={{ color: C.lime, fontStyle: 'italic', fontWeight: 400 }}>{t('auth_hero_headline_2')}</em><br/>
              {t('auth_hero_headline_3')}
            </h1>

            <p style={{
              ...dm,
              marginTop: '24px',
              color: 'rgba(245,240,232,0.55)',
              fontSize: '15px',
              fontWeight: 300,
              lineHeight: 1.65,
              maxWidth: '340px',
            }}>
              {t('auth_hero_subtitle')}
            </p>
          </div>

          {/* stats row — bottom anchored */}
          <h2 style={{
            ...playfair,
            fontSize: 'clamp(18px, 2vw, 24px)',
            fontWeight: 600,
            color: C.cream,
            margin: 0,
            marginBottom: '8px',
            lineHeight: 1.3,
          }}>
            {t('auth_hero_impact_heading_1')}{' '}
            <em style={{ color: C.lime, fontStyle: 'italic', fontWeight: 400 }}>{t('auth_hero_impact_heading_2')}</em>
          </h2>
          <p style={{
            ...dm,
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            color: 'rgba(197,241,53,0.5)',
            marginBottom: '16px',
          }}>
            {t('auth_hero_impact_label')}
          </p>
          <div style={{
            display: 'flex',
            gap: '32px',
            paddingTop: '40px',
            borderTop: '1px solid rgba(245,240,232,0.1)',
          }}>
            {STATS.map((s) => (
              <div key={s.labelKey}>
                <div style={{
                  ...playfair,
                  fontSize: '26px',
                  fontWeight: 600,
                  color: C.lime,
                  lineHeight: 1,
                }}>{s.value}{s.suffix}</div>
                <div style={{
                  ...dm,
                  fontSize: '11px',
                  fontWeight: 300,
                  color: 'rgba(245,240,232,0.45)',
                  marginTop: '4px',
                  letterSpacing: '0.03em',
                }}>{t(s.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT PANEL  (45%)
        ══════════════════════════════════════════════════ */}
        <div style={{
          flex: 1,
          background: C.cream,
          padding: 'clamp(28px, 6vw, 48px) clamp(20px, 5vw, 44px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}>

          {/* tab switcher */}
          <div ref={tabsRef} style={{
            display: 'flex',
            gap: '0',
            position: 'relative',
            borderBottom: '1.5px solid #d9d3c7',
            marginBottom: '36px',
          }}>
            {(['signin', 'signup'] as const).map((tabKey) => (
              <button
                key={tabKey}
                ref={tabKey === 'signin' ? signinRef : signupRef}
                onClick={() => setTab(tabKey)}
                style={{
                  ...dm,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 4px 14px 4px',
                  marginRight: '28px',
                  fontSize: '14px',
                  fontWeight: tab === tabKey ? 500 : 400,
                  color: tab === tabKey ? C.forest : '#9e9589',
                  transition: 'color 0.2s',
                }}
              >
                {tabKey === 'signin' ? t('auth_signin_tab') : t('auth_signup_tab')}
              </button>
            ))}

            {/* sliding underline */}
            <div style={{
              position: 'absolute',
              bottom: '-1.5px',
              height: '2.5px',
              background: C.forest,
              borderRadius: '2px',
              ...tabLineStyle,
            }}/>
          </div>

          {/* form title */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{
              ...playfair,
              fontSize: '28px',
              fontWeight: 600,
              color: C.forest,
              margin: 0,
              lineHeight: 1.2,
            }}>
              {tab === 'signin' ? t('auth_signin_heading_customer') : t('auth_signup_heading_customer')}
            </h2>
            <p style={{
              ...dm,
              fontSize: '14px',
              fontWeight: 300,
              color: '#7a7268',
              marginTop: '6px',
            }}>
              {tab === 'signin'
                ? t('auth_signin_subtitle_customer')
                : t('auth_signup_subtitle_customer')}
            </p>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Sign Up: first + last name grid */}
            {tab === 'signup' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>{t('auth_field_first_name')}</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onFocus={() => setFocused('firstName')}
                    onBlur={() => setFocused('')}
                    placeholder={t('auth_field_first_name_placeholder')}
                    style={inputStyle('firstName')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{t('auth_field_last_name')}</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onFocus={() => setFocused('lastName')}
                    onBlur={() => setFocused('')}
                    placeholder={t('auth_field_last_name_placeholder')}
                    style={inputStyle('lastName')}
                  />
                </div>
              </div>
            )}

            {/* email */}
            <div>
              <label style={labelStyle}>{t('auth_field_email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                placeholder="you@example.com"
                style={inputStyle('email')}
              />
            </div>

            {/* password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>{t('auth_field_password')}</label>
                {tab === 'signin' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    style={{
                      ...dm,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#9e9589',
                      padding: 0,
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.forest)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9e9589')}
                  >
                    {t('auth_link_forgot_password')}
                  </button>
                )}
              </div>
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

            {/* CTA button */}
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
              }}
            >
              {loading ? t('auth_button_loading') : tab === 'signin' ? t('auth_button_signin') : t('auth_button_create_account')}
              {!loading && <ArrowRight animating={ctaHover} />}
            </button>
          </form>

          {/* divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '24px 0',
          }}>
            <div style={{ flex: 1, height: '1px', background: '#d9d3c7' }}/>
            <span style={{ ...dm, fontSize: '12px', color: '#b0a89e', fontWeight: 400 }}>{t('auth_divider_or')}</span>
            <div style={{ flex: 1, height: '1px', background: '#d9d3c7' }}/>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            style={{
              ...dm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: C.white,
              border: '1.5px solid #d9d3c7',
              borderRadius: '12px',
              padding: '13px 20px',
              fontSize: '14px',
              fontWeight: 400,
              color: '#1a1a1a',
              cursor: 'pointer',
              transition: 'border-color 0.18s, box-shadow 0.18s',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#a09890';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d9d3c7';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <GoogleLogo />
            {t('auth_continue_with_google')}
          </button>

          {/* footer switch */}
          <p style={{
            ...dm,
            marginTop: '28px',
            fontSize: '13px',
            color: '#9e9589',
            textAlign: 'center',
            fontWeight: 300,
          }}>
            {tab === 'signin' ? `${t('auth_footer_no_account')} ` : `${t('auth_footer_have_account')} `}
            <button
              onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
              style={{
                ...dm,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: C.forest,
                fontWeight: 500,
                fontSize: '13px',
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              {tab === 'signin' ? t('auth_footer_signup_free') : t('auth_footer_signin')}
            </button>
          </p>

          <p style={{ ...dm, marginTop: '8px', fontSize: '12px', color: '#b0a89e', textAlign: 'center', fontWeight: 300 }}>
            <button
              onClick={() => navigate('/business-auth')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#b0a89e', fontSize: '12px', padding: 0,
                ...dm,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#7a7268')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#b0a89e')}
            >
              {t('auth_link_restaurant_partner')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
