import React, { useState, useEffect, useRef } from 'react';
import bagImage from '../assets/bag.png';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COLORS, LANDING_STATS } from '@/lib/constants';
import {
  Menu, X, Leaf, ArrowRight, ChevronDown, Star,
  ShoppingBag, Users, TrendingUp, Heart,
  CheckCircle2,
  Pizza, Utensils, Soup,
  DollarSign, Gift, MapPin,
  Croissant, CakeSlice,
} from 'lucide-react';

// ── colour tokens ──────────────────────────────────────
const C = {
  teal:     '#1B5E52',
  tealDark: '#143f36',
  cream:    '#F5F0E8',
  coral:    '#E8674A',
  lime:     '#B8E04A',
};

// ── font helpers ───────────────────────────────────────
const bebas:  React.CSSProperties = { fontFamily: '"Bebas Neue", sans-serif' };
const nunito: React.CSSProperties = { fontFamily: '"Nunito", sans-serif' };

// ── nav items (translation key + target section id) ───
const NAV_ITEMS = [
  { labelKey: 'landing_nav_how',        sectionId: 'how-it-works'   },
  { labelKey: 'landing_nav_businesses', sectionId: 'for-businesses' },
  { labelKey: 'landing_nav_impact',     sectionId: 'impact'         },
  { labelKey: 'landing_nav_faq',        sectionId: 'faq'            },
] as const;

// ── ticker words ───────────────────────────────────────
const TICKER_WORDS = [
  'PASTRIES', 'BREADS', 'GROCERIES', 'SANDWICH', 'SUSHI', 'PIZZA',
  'MUFFINS', 'BURGERS', 'POKE', 'DONUTS', 'SALADS', 'WRAPS',
  'BURRITOS', 'RAMEN', 'BAGELS', 'TACOS',
];

// ── animated counter ───────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let current = 0;
    const step = Math.ceil(to / 60);
    const timer = setInterval(() => {
      current += step;
      if (current >= to) { setVal(to); clearInterval(timer); }
      else setVal(current);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── FAQ item ───────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0" style={{ borderColor: 'rgba(27,94,82,0.12)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span style={{ ...nunito, fontWeight: 800, fontSize: '1rem', color: '#1B1B1B' }}>{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-5 h-5 shrink-0" style={{ color: C.coral }} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed" style={{ color: '#555', ...nunito }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── main component ─────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const toggleLang = () => i18n.changeLanguage(i18n.language === 'en' ? 'tr' : 'en');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  return (
    <div style={{ backgroundColor: C.cream, ...nunito }}>

      {/* ════════════════════════════════════ STICKY NAV */}
      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'rgba(27,94,82,0.97)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.18)' : 'none',
        }}
      >
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.logoBg }}>
              <Leaf className="w-5 h-5" style={{ color: COLORS.logoIcon }} />
            </div>
            <span style={{ ...bebas, fontSize: '1.5rem', color: '#fff', letterSpacing: '0.05em' }}>
              Yu<span style={{ color: COLORS.logoAccent }}>Go</span>Da
            </span>
          </button>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map(({ labelKey, sectionId }) => (
              <li key={labelKey}>
                <button
                  onClick={() => scrollTo(sectionId)}
                  className="text-sm font-extrabold uppercase tracking-widest hover:opacity-70 transition-opacity"
                  style={{ color: '#fff', ...nunito }}
                >
                  {t(labelKey)}
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop CTA + language toggle */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="px-3 py-1.5 rounded-full text-xs font-extrabold border border-white/30 hover:border-white/70 transition-colors"
              style={{ color: '#fff', ...nunito, letterSpacing: '0.1em' }}
              aria-label="Toggle language"
            >
              {t('lang_switch_label')}
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="text-sm font-extrabold hover:opacity-70 transition-opacity"
              style={{ color: '#fff', ...nunito }}
            >
              {t('landing_nav_signin')}
            </button>
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="px-5 py-2 rounded-full text-sm font-extrabold hover:opacity-90 transition-opacity active:scale-95"
              style={{ backgroundColor: C.coral, color: '#fff', ...nunito }}
            >
              {t('landing_nav_signup')}
            </button>
          </div>

          {/* Mobile burger */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </nav>

        {/* Mobile drawer */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden md:hidden"
              style={{ backgroundColor: C.teal }}
            >
              <div className="px-6 pb-6 pt-2 space-y-4">
                {NAV_ITEMS.map(({ labelKey, sectionId }) => (
                  <button
                    key={labelKey}
                    onClick={() => scrollTo(sectionId)}
                    className="block w-full text-left text-sm font-extrabold uppercase tracking-widest text-white py-2"
                  >
                    {t(labelKey)}
                  </button>
                ))}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={toggleLang}
                    className="py-3 px-4 rounded-full text-xs font-extrabold text-white border-2 border-white/40 hover:border-white/70 transition-colors"
                    style={{ letterSpacing: '0.1em' }}
                  >
                    {t('lang_switch_label')}
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/auth'); }}
                    className="flex-1 py-3 rounded-full text-sm font-extrabold text-white border-2 border-white/40"
                  >{t('landing_nav_signin')}</button>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/auth?mode=signup'); }}
                    className="flex-1 py-3 rounded-full text-sm font-extrabold"
                    style={{ backgroundColor: C.coral, color: '#fff' }}
                  >{t('landing_nav_signup')}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ════════════════════════════════════ HERO */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ backgroundColor: C.teal }}
      >
        {/* bg decorations */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none" style={{ backgroundColor: C.lime }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10 pointer-events-none" style={{ backgroundColor: C.coral }} />

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 w-full grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest mb-6"
              style={{ backgroundColor: C.lime, color: C.teal }}
            >
              <Leaf className="w-3.5 h-3.5" /> {t('landing_hero_eyebrow')}
            </div>

            <h1
              className="text-white leading-none mb-6"
              style={{ ...bebas, fontSize: 'clamp(3.5rem, 8vw, 6.5rem)', lineHeight: 0.95 }}
            >
              {t('landing_hero_l1')}<br />
              {t('landing_hero_l2pre')}<span style={{ color: C.lime }}>{t('landing_hero_l2accent')}</span><br />
              {t('landing_hero_l3')}<br />
              <span style={{ color: C.coral }}>{t('landing_hero_l4accent')}</span>
            </h1>

            <p className="text-white/80 mb-8 max-w-md" style={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.6 }}>
              {t('landing_hero_desc')}
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <button
                onClick={() => navigate('/auth?mode=signup')}
                className="flex items-center gap-2 px-8 py-4 rounded-full font-extrabold text-sm hover:opacity-90 transition-opacity active:scale-95 group"
                style={{ backgroundColor: C.coral, color: '#fff' }}
              >
                {t('landing_hero_cta_primary')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => scrollTo('how-it-works')}
                className="flex items-center gap-2 px-8 py-4 rounded-full font-extrabold text-sm border-2 border-white/30 text-white hover:border-white/60 transition-colors"
              >
                {t('landing_hero_cta_secondary')}
              </button>
            </div>

          </motion.div>

          {/* Right – bag illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="relative flex items-center justify-center px-8 md:px-0"
          >
            <div className="relative w-52 h-64 md:w-64 md:h-80 flex items-center justify-center">
              <img
                src={bagImage}
                alt="YuGoDa surprise bag"
                className="w-full h-full object-contain"
                style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.35))' }}
              />
              <div
                className="absolute -top-3 -right-3 md:-top-4 md:-right-4 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-lg"
                style={{ backgroundColor: C.coral, color: '#fff' }}
              >
                {t('landing_hero_badge')}
              </div>
            </div>

            {/* Floating food cards — hidden on very small screens */}
            <div className="hidden sm:block">
              {([
                { icon: <Croissant className="w-4 h-4" />, labelKey: 'landing_food_pastries', style: { top: '0%',    left: '-22%'  }, delay: 0.3,  accent: C.coral },
                { icon: <Pizza     className="w-4 h-4" />, labelKey: 'landing_food_pizza',    style: { top: '15%',   right: '-22%' }, delay: 0.45, accent: C.teal },
                { icon: <Utensils  className="w-4 h-4" />, labelKey: 'landing_food_salads',   style: { bottom: '12%',left: '-20%'  }, delay: 0.6,  accent: C.teal },
                { icon: <Soup      className="w-4 h-4" />, labelKey: 'landing_food_bento',    style: { bottom: '0%', right: '-18%' }, delay: 0.75, accent: C.coral },
              ] as const).map(({ icon, labelKey, style, delay, accent }) => (
                <motion.div
                  key={labelKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay }}
                  className="absolute px-3 md:px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg"
                  style={{ ...style, backgroundColor: 'rgba(255,255,255,0.95)' }}
                >
                  <span style={{ color: accent }}>{icon}</span>
                  <span className="text-xs font-extrabold" style={{ color: C.teal }}>{t(labelKey)}</span>
                </motion.div>
              ))}
            </div>

            {/* CO₂ badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-4 md:px-6 py-3 rounded-2xl text-center shadow-xl whitespace-nowrap"
              style={{ backgroundColor: C.tealDark, border: `2px solid ${C.lime}` }}
            >
              <p className="text-white text-lg md:text-xl font-extrabold">{t('landing_hero_co2_amount')}</p>
              <p className="text-white/70 text-xs font-extrabold">{t('landing_hero_co2_label')}</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 inset-x-0 overflow-hidden leading-none pointer-events-none">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12">
            <path d="M0,40 C360,0 1080,80 1440,40 L1440,60 L0,60 Z" fill={C.cream} />
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════ STATS BAR */}
      <section style={{ backgroundColor: C.tealDark }} className="pt-14 pb-28">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          {LANDING_STATS.map(({ value, suffix, labelKey }) => (
            <div key={labelKey} className="min-w-0">
              <p className="text-white" style={{ ...bebas, fontSize: 'clamp(1.75rem, 6vw, 3.5rem)', lineHeight: 1 }}>
                <Counter to={value} suffix={suffix} />
              </p>
              <p className="text-white/60 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest mt-1.5">
                {t(labelKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════ WHY YUGODA */}
      <div style={{ position: 'relative', zIndex: 3, marginTop: '-80px' }}>

      {/* ── Cream: headline ── */}
      <div style={{ backgroundColor: C.cream, paddingTop: '80px', paddingBottom: '80px' }}>
        <div className="text-center px-6">
          <p className="text-sm font-extrabold uppercase tracking-widest mb-3" style={{ color: C.coral }}>
            {t('landing_why_eyebrow')}
          </p>
          <h2 style={{ ...bebas, fontSize: 'clamp(2.8rem, 6vw, 5rem)', color: C.teal, lineHeight: 1 }}>
            {t('landing_why_title_l1')}<br />
            <span style={{ color: C.coral }}>{t('landing_why_title_l2')}</span> {t('landing_why_title_l3')}
          </h2>
        </div>
      </div>

      {/* ── Green: features + bag image ── */}
      <div style={{ backgroundColor: '#1a3d2b', position: 'relative' }} className="py-12 md:py-0 md:h-[280px]">

        {/* Bag image — desktop: centered straddling boundary; mobile: smaller, above features */}
        <div className="hidden md:block" style={{
          position: 'absolute',
          top: '-80px',
          left: '49%',
          transform: 'translateX(-50%)',
          width: '370px',
          zIndex: 2,
          lineHeight: 0,
          pointerEvents: 'none',
        }}>
          <motion.img
            src={bagImage}
            alt="YuGoDa surprise bag"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{ width: '100%', display: 'block', filter: 'drop-shadow(0 28px 48px rgba(0,0,0,0.4))' }}
          />
        </div>

        {/* Mobile bag image */}
        <div className="md:hidden flex justify-center mb-8 px-6">
          <motion.img
            src={bagImage}
            alt="YuGoDa surprise bag"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{ maxWidth: '200px', filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.4))' }}
          />
        </div>

        {/* Features — desktop: 3-col grid around bag; mobile: 2x2 grid */}
        <div className="md:hidden max-w-sm mx-auto px-6 grid grid-cols-2 gap-6">
          {[
            { icon: <DollarSign className="w-5 h-5" />, titleKey: 'landing_why_f1_title', descKey: 'landing_why_f1_desc' },
            { icon: <Leaf       className="w-5 h-5" />, titleKey: 'landing_why_f2_title', descKey: 'landing_why_f2_desc' },
            { icon: <Gift       className="w-5 h-5" />, titleKey: 'landing_why_f3_title', descKey: 'landing_why_f3_desc' },
            { icon: <MapPin     className="w-5 h-5" />, titleKey: 'landing_why_f4_title', descKey: 'landing_why_f4_desc' },
          ].map(({ icon, titleKey, descKey }, i) => (
            <motion.div
              key={titleKey}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: C.lime, color: '#1a3d2b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
              </div>
              <h3 style={{ ...nunito, fontWeight: 800, fontSize: '0.9rem', color: '#fff', margin: 0 }}>{t(titleKey)}</h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>{t(descKey)}</p>
            </motion.div>
          ))}
        </div>

        {/* Desktop 3-col features */}
        <div
          className="hidden md:grid"
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 48px',
            height: '280px',
            gridTemplateColumns: '1fr 480px 1fr',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', gap: '40px', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: '24px', paddingTop: '24px' }}>
            {[
              { icon: <DollarSign className="w-5 h-5" />, titleKey: 'landing_why_f1_title', descKey: 'landing_why_f1_desc' },
              { icon: <Leaf       className="w-5 h-5" />, titleKey: 'landing_why_f2_title', descKey: 'landing_why_f2_desc' },
            ].map(({ icon, titleKey, descKey }, i) => (
              <motion.div
                key={titleKey}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '10px', width: '148px', flexShrink: 0 }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '14px', backgroundColor: C.lime, color: '#1a3d2b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </div>
                <h3 style={{ ...nunito, fontWeight: 800, fontSize: '0.95rem', color: '#fff', margin: 0 }}>{t(titleKey)}</h3>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>{t(descKey)}</p>
              </motion.div>
            ))}
          </div>
          <div />
          <div style={{ display: 'flex', flexDirection: 'row', gap: '40px', alignItems: 'flex-start', justifyContent: 'flex-start', paddingLeft: '24px', paddingTop: '24px' }}>
            {[
              { icon: <Gift   className="w-5 h-5" />, titleKey: 'landing_why_f3_title', descKey: 'landing_why_f3_desc' },
              { icon: <MapPin className="w-5 h-5" />, titleKey: 'landing_why_f4_title', descKey: 'landing_why_f4_desc' },
            ].map(({ icon, titleKey, descKey }, i) => (
              <motion.div
                key={titleKey}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '10px', width: '148px', flexShrink: 0 }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '14px', backgroundColor: C.lime, color: '#1a3d2b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </div>
                <h3 style={{ ...nunito, fontWeight: 800, fontSize: '0.95rem', color: '#fff', margin: 0 }}>{t(titleKey)}</h3>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>{t(descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cream gap strip between green bar and food ticker ── */}
      <div style={{ height: '48px', backgroundColor: C.cream }} />

      </div>{/* end WHY YUGODA wrapper */}

      {/* ════════════════════════════════════ TICKER */}
      <div
        className="py-5 overflow-hidden"
        style={{ backgroundColor: C.tealDark }}
        aria-hidden="true"
      >
        {/* Two duplicate sets side by side → seamless 50% loop */}
        <div className="ticker-track">
          {[...TICKER_WORDS, ...TICKER_WORDS].map((word, i) => (
            <span
              key={i}
              className="inline-flex items-center select-none whitespace-nowrap"
              style={{ padding: '0 28px' }}
            >
              <span
                style={{
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  letterSpacing: '0.15em',
                  color: i % 3 === 0 ? C.lime : i % 3 === 1 ? C.coral : '#fff',
                }}
              >
                {word}
              </span>
              <span style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '1.4rem',
                lineHeight: 1,
                marginLeft: '28px',
              }}>•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════ HOW IT WORKS */}
      <section id="how-it-works" className="py-16 md:py-24" style={{ backgroundColor: C.cream }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-10 md:mb-16">
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest mb-3" style={{ color: C.coral }}>
              {t('landing_how_eyebrow')}
            </p>
            <h2 style={{ ...bebas, fontSize: 'clamp(2.25rem, 6vw, 4rem)', color: C.teal, lineHeight: 1 }}>
              {t('landing_how_title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
            {[
              {
                step: '01',
                icon: <ShoppingBag className="w-7 h-7 md:w-8 md:h-8" />,
                title: t('landing_how_step1_title'),
                desc: t('landing_how_step1_desc'),
              },
              {
                step: '02',
                icon: <Heart className="w-7 h-7 md:w-8 md:h-8" />,
                title: t('landing_how_step2_title'),
                desc: t('landing_how_step2_desc'),
              },
              {
                step: '03',
                icon: <Leaf className="w-7 h-7 md:w-8 md:h-8" />,
                title: t('landing_how_step3_title'),
                desc: t('landing_how_step3_desc'),
              },
            ].map(({ step, icon, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative p-6 md:p-8 rounded-3xl overflow-hidden"
                style={{ backgroundColor: '#fff', boxShadow: '0 4px 30px rgba(27,94,82,0.08)' }}
              >
                <span
                  className="absolute -top-3 -right-1 md:-top-4 md:-right-2 font-extrabold select-none pointer-events-none"
                  style={{ ...bebas, fontSize: 'clamp(4.5rem, 14vw, 6rem)', color: 'rgba(27,94,82,0.06)', lineHeight: 1 }}
                >
                  {step}
                </span>
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-4 md:mb-5"
                  style={{ backgroundColor: C.teal, color: C.lime }}
                >
                  {icon}
                </div>
                <h3 className="font-extrabold text-base md:text-lg mb-2" style={{ color: C.teal }}>{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ FOR BUSINESSES */}
      <section
        id="for-businesses"
        className="py-24 relative overflow-hidden"
        style={{ backgroundColor: C.teal }}
      >
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ backgroundColor: C.lime, transform: 'translate(30%, -30%)' }}
        />

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: C.lime }}>
              {t('landing_biz_eyebrow')}
            </p>
            <h2 className="text-white leading-none mb-6" style={{ ...bebas, fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
              {t('landing_biz_title_l1')}<br />
              {t('landing_biz_title_l2')}<span style={{ color: C.coral }}>{t('landing_biz_title_accent')}</span>
            </h2>
            <p className="text-white/70 mb-8 leading-relaxed font-extrabold text-sm">
              {t('landing_biz_desc')}
            </p>
            <ul className="space-y-3 mb-8">
              {(['landing_biz_f1','landing_biz_f2','landing_biz_f3','landing_biz_f4','landing_biz_f5'] as const).map(key => (
                <li key={key} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: C.lime }} />
                  <span className="text-white/85 text-sm font-extrabold">{t(key)}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/business-auth')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-extrabold text-sm hover:opacity-90 transition-opacity active:scale-95"
              style={{ backgroundColor: C.coral, color: '#fff' }}
            >
              {t('landing_biz_cta')} <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Right – testimonials */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-4"
          >
            {[
              { quoteKey: 'landing_testimonial_1_quote', name: 'Elif K.',  roleKey: 'landing_testimonial_1_role', rating: 5 },
              { quoteKey: 'landing_testimonial_2_quote', name: 'Murat T.', roleKey: 'landing_testimonial_2_role', rating: 5 },
              { quoteKey: 'landing_testimonial_3_quote', name: 'Selin Ö.', roleKey: 'landing_testimonial_3_role', rating: 5 },
            ].map(({ quoteKey, name, roleKey, rating }) => (
              <div
                key={name}
                className="p-5 rounded-2xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.12)' }}
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: C.lime }} />
                  ))}
                </div>
                <p className="text-white/90 text-sm font-extrabold leading-relaxed mb-3">"{t(quoteKey)}"</p>
                <p className="text-white/60 text-xs font-extrabold">{name} · {t(roleKey)}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* ════════════════════════════════════ IMPACT */}
      <section id="impact" className="py-24" style={{ backgroundColor: C.tealDark }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: C.lime }}>
              {t('landing_impact_eyebrow')}
            </p>
            <h2 className="text-white leading-none" style={{ ...bebas, fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
              {t('landing_impact_title_l1')}<span style={{ color: C.coral }}>{t('landing_impact_title_accent')}</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Leaf      className="w-8 h-8" />, titleKey: 'landing_impact_1_title', descKey: 'landing_impact_1_desc', statKey: 'landing_impact_1_stat_val', statLabelKey: 'landing_impact_1_stat_label' },
              { icon: <Users     className="w-8 h-8" />, titleKey: 'landing_impact_2_title', descKey: 'landing_impact_2_desc', statKey: 'landing_impact_2_stat_val', statLabelKey: 'landing_impact_2_stat_label' },
              { icon: <TrendingUp className="w-8 h-8" />, titleKey: 'landing_impact_3_title', descKey: 'landing_impact_3_desc', statKey: 'landing_impact_3_stat_val', statLabelKey: 'landing_impact_3_stat_label' },
            ].map(({ icon, titleKey, descKey, statKey, statLabelKey }, i) => (
              <motion.div
                key={titleKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="p-7 rounded-3xl"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: 'rgba(184,224,74,0.15)', color: C.lime }}
                >
                  {icon}
                </div>
                <h3 className="text-white font-extrabold text-lg mb-2">{t(titleKey)}</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-5">{t(descKey)}</p>
                <p style={{ ...bebas, fontSize: '2rem', color: C.lime }}>{t(statKey)}</p>
                <p className="text-white/50 text-xs font-extrabold uppercase tracking-widest">{t(statLabelKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ FAQ */}
      <section id="faq" className="py-24" style={{ backgroundColor: C.cream }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: C.coral }}>
              {t('faq_eyebrow')}
            </p>
            <h2 style={{ ...bebas, fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: C.teal }}>
              FAQ
            </h2>
          </div>

          <div
            className="rounded-3xl overflow-hidden p-5 md:p-8"
            style={{ backgroundColor: '#fff', boxShadow: '0 8px 40px rgba(27,94,82,0.08)' }}
          >
            {[
              { id: 'faq1', q: t('faq_q1'), a: t('faq_a1') },
              { id: 'faq2', q: t('faq_q2'), a: t('faq_a2') },
              { id: 'faq3', q: t('faq_q3'), a: t('faq_a3') },
              { id: 'faq4', q: t('faq_q4'), a: t('faq_a4') },
              { id: 'faq5', q: t('faq_q5'), a: t('faq_a5') },
              { id: 'faq6', q: t('faq_q6'), a: t('faq_a6') },
              { id: 'faq7', q: t('faq_q7'), a: t('faq_a7') },
              { id: 'faq8', q: t('faq_q8'), a: t('faq_a8') },
              { id: 'faq9', q: t('faq_q9'), a: t('faq_a9') },
            ].map(({ id, q, a }) => (
              // @ts-expect-error React 19 key prop type narrowing — key is a React special attribute, not a component prop
              <FaqItem key={id} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ FINAL CTA */}
      <section className="py-16 px-6">
        <div
          className="max-w-4xl mx-auto rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
          style={{ backgroundColor: C.teal }}
        >
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-15 pointer-events-none" style={{ backgroundColor: C.lime }} />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-15 pointer-events-none" style={{ backgroundColor: C.coral }} />

          <p className="text-xs font-extrabold uppercase tracking-widest mb-3 relative z-10" style={{ color: C.lime }}>
            {t('landing_cta_eyebrow')}
          </p>
          <h2
            className="text-white leading-none mb-6 relative z-10"
            style={{ ...bebas, fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            {t('landing_cta_title_l1')}<br />
            {t('landing_cta_title_l2')}<span style={{ color: C.coral }}>{t('landing_cta_title_accent')}</span>
          </h2>
          <p className="text-white/70 font-extrabold mb-8 relative z-10">
            {t('landing_cta_desc')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 relative z-10">
            <button
              onClick={() => navigate('/discover')}
              className="flex items-center gap-2 px-8 py-4 rounded-full font-extrabold text-sm hover:opacity-90 transition-opacity active:scale-95"
              style={{ backgroundColor: C.coral, color: '#fff' }}
            >
              {t('landing_cta_primary')} <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="flex items-center gap-2 px-8 py-4 rounded-full font-extrabold text-sm border-2 border-white/30 text-white hover:border-white/60 transition-colors"
            >
              {t('landing_cta_secondary')}
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ FOOTER */}
      <footer style={{ backgroundColor: C.tealDark }}>
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.logoBg }}>
                <Leaf className="w-5 h-5" style={{ color: COLORS.logoIcon }} />
              </div>
              <span style={{ ...bebas, fontSize: '1.5rem', color: '#fff', letterSpacing: '0.05em' }}>
                Yu<span style={{ color: COLORS.logoAccent }}>Go</span>Da
              </span>
            </div>
            <p className="text-white/50 text-xs leading-relaxed font-extrabold">
              {t('landing_footer_tagline')}
            </p>
          </div>

          {/* Link columns */}
          {[
            {
              headingKey: 'landing_footer_product',
              links: [
                { labelKey: 'landing_footer_howitworks', action: () => scrollTo('how-it-works') },
                { labelKey: 'landing_footer_forbiz',     action: () => scrollTo('for-businesses') },
              ],
            },
            {
              headingKey: 'landing_footer_company',
              links: [
                { labelKey: 'landing_footer_about', action: () => navigate('/about') },
              ],
            },
            {
              headingKey: 'landing_footer_legal',
              links: [
                { labelKey: 'landing_footer_privacy', action: () => navigate('/privacy') },
                { labelKey: 'landing_footer_terms',   action: () => navigate('/terms') },
                { labelKey: 'landing_footer_admin',   action: () => navigate('/admin-auth') },
              ],
            },
          ].map(({ headingKey, links }) => (
            <div key={headingKey}>
              <h4 className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: C.lime }}>
                {t(headingKey)}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ labelKey, action }) => (
                  <li key={labelKey}>
                    <button
                      onClick={action}
                      className="text-white/50 text-xs font-extrabold hover:text-white/90 transition-colors"
                    >
                      {t(labelKey)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t px-6 py-5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-white/30 text-xs font-extrabold">
              © {new Date().getFullYear()} YuGoDa. All rights reserved.
            </p>
            <div
              className="px-4 py-1.5 rounded-full text-xs font-extrabold border"
              style={{ borderColor: C.lime, color: C.lime }}
            >
              {t('landing_footer_eco')}
            </div>
          </div>
        </div>

        {/* Giant footer word */}
        <div className="overflow-hidden pb-0 select-none pointer-events-none" aria-hidden="true">
          <p
            className="text-center leading-none -mb-4"
            style={{ ...bebas, fontSize: 'clamp(5rem, 20vw, 16rem)', color: C.cream, opacity: 0.04, letterSpacing: '0.02em' }}
          >
            YUGODA
          </p>
        </div>
      </footer>

    </div>
  );
}
