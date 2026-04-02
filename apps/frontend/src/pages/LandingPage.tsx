import React, { useState, useEffect, useRef } from 'react';
import bagImage from '../assets/bag.png';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, X, Leaf, ArrowRight, ChevronDown, Star,
  ShoppingBag, Users, TrendingUp, Heart,
  CheckCircle2, Apple, Play,
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

// ── nav links ──────────────────────────────────────────
const NAV_LINKS = ['How It Works', 'For Businesses', 'Impact', 'FAQ'];

const sectionIds: Record<string, string> = {
  'How It Works':   'how-it-works',
  'For Businesses': 'for-businesses',
  'Impact':         'impact',
  'FAQ':            'faq',
};

// ── ticker words ───────────────────────────────────────
const TICKER_WORDS = [
  'PASTRIES', 'BREADS', 'GROCERIES', 'SANDWICH', 'SUSHI', 'PIZZA',
  'MUFFINS', 'BURGERS', 'POKE', 'DONUTS', 'BURGER KING', "DUNKIN'",
  "McDONALD'S", 'STARBUCKS', 'SALADS', 'WRAPS', 'BURRITOS', 'RAMEN',
];

// ── partner brands (text-only marquee) ────────────────
const PARTNER_BRANDS = [
  "Greggs", "Starbucks", "Yo! Sushi", "Burger King", "M&B",
  "Greene King", "Pret", "Wagamama", "Nando's", "Costa",
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

// ── partner marquee component ──────────────────────────
function PartnerMarquee() {
  // One full set of brands with · separators
  const set = PARTNER_BRANDS.flatMap((brand, i) => [
    <span
      key={`b${i}`}
      style={{
        fontFamily: '"Archivo Black", sans-serif',
        fontSize: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: '#e8604c',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {brand}
    </span>,
    <span
      key={`d${i}`}
      style={{
        fontFamily: '"Archivo Black", sans-serif',
        fontSize: '1.1rem',
        color: 'rgba(232,96,76,0.3)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        padding: '0 22px',
        display: 'inline-block',
      }}
    >
      ·
    </span>,
  ]);

  return (
    <div style={{ backgroundColor: '#f5f0e8', padding: '22px 0 20px' }}>
      {/* label — outside the overflow container so it's never clipped */}
      <p style={{
        textAlign: 'center',
        fontFamily: '"Archivo Black", sans-serif',
        fontSize: '10px',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'rgba(232,96,76,0.35)',
        marginBottom: '16px',
        userSelect: 'none',
      }}>
        Trusted by stores &amp; restaurants
      </p>

      {/* overflow wrapper — contains only the scrolling strip */}
      <div style={{ overflow: 'hidden' }}>
        {/* 4 copies so the track always fills the viewport at every animation frame */}
        <div className="partner-track">
          {set.map((el) => React.cloneElement(el, { key: `A-${el.key}` }))}
          {set.map((el) => React.cloneElement(el, { key: `B-${el.key}` }))}
          {set.map((el) => React.cloneElement(el, { key: `C-${el.key}` }))}
          {set.map((el) => React.cloneElement(el, { key: `D-${el.key}` }))}
        </div>
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.lime }}>
              <Leaf className="w-5 h-5" style={{ color: C.teal }} />
            </div>
            <span style={{ ...bebas, fontSize: '1.5rem', color: '#fff', letterSpacing: '0.05em' }}>
              Yu<span style={{ color: C.coral }}>Go</span>Da
            </span>
          </button>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <li key={l}>
                <button
                  onClick={() => scrollTo(sectionIds[l])}
                  className="text-sm font-extrabold uppercase tracking-widest hover:opacity-70 transition-opacity"
                  style={{ color: '#fff', ...nunito }}
                >
                  {l}
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/auth')}
              className="text-sm font-extrabold hover:opacity-70 transition-opacity"
              style={{ color: '#fff', ...nunito }}
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="px-5 py-2 rounded-full text-sm font-extrabold hover:opacity-90 transition-opacity active:scale-95"
              style={{ backgroundColor: C.coral, color: '#fff', ...nunito }}
            >
              Get started
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
                {NAV_LINKS.map(l => (
                  <button
                    key={l}
                    onClick={() => scrollTo(sectionIds[l])}
                    className="block w-full text-left text-sm font-extrabold uppercase tracking-widest text-white py-2"
                  >
                    {l}
                  </button>
                ))}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/auth'); }}
                    className="flex-1 py-3 rounded-full text-sm font-extrabold text-white border-2 border-white/40"
                  >Sign in</button>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/auth?mode=signup'); }}
                    className="flex-1 py-3 rounded-full text-sm font-extrabold"
                    style={{ backgroundColor: C.coral, color: '#fff' }}
                  >Get started</button>
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

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 w-full grid md:grid-cols-2 gap-12 items-center">
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
              <Leaf className="w-3.5 h-3.5" /> Fight food waste
            </div>

            <h1
              className="text-white leading-none mb-6"
              style={{ ...bebas, fontSize: 'clamp(3.5rem, 8vw, 6.5rem)', lineHeight: 0.95 }}
            >
              SAVE FOOD.<br />
              SAVE <span style={{ color: C.lime }}>MONEY.</span><br />
              SAVE THE<br />
              <span style={{ color: C.coral }}>PLANET.</span>
            </h1>

            <p className="text-white/80 mb-8 max-w-md" style={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.6 }}>
              Rescue surprise bags of unsold food from local restaurants
              and stores — at up to 70% off. Good for your wallet.
              Great for the Earth.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <button
                onClick={() => navigate('/auth?mode=signup')}
                className="flex items-center gap-2 px-8 py-4 rounded-full font-extrabold text-sm hover:opacity-90 transition-opacity active:scale-95 group"
                style={{ backgroundColor: C.coral, color: '#fff' }}
              >
                Start saving food
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => scrollTo('how-it-works')}
                className="flex items-center gap-2 px-8 py-4 rounded-full font-extrabold text-sm border-2 border-white/30 text-white hover:border-white/60 transition-colors"
              >
                See how it works
              </button>
            </div>

            {/* App store buttons */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: <Apple className="w-5 h-5 text-white" />, line1: 'Download on', line2: 'App Store' },
                { icon: <Play className="w-5 h-5 text-white fill-current" />, line1: 'Get it on', line2: 'Google Play' },
              ].map(({ icon, line1, line2 }) => (
                <div
                  key={line2}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)' }}
                >
                  {icon}
                  <div>
                    <p className="text-white/60 text-[10px] font-extrabold uppercase tracking-widest">{line1}</p>
                    <p className="text-white text-sm font-extrabold">{line2}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right – bag illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="relative flex items-center justify-center"
          >
            <div
              className="relative w-64 h-80 rounded-3xl flex items-center justify-center shadow-2xl"
              style={{ backgroundColor: C.lime }}
            >
              <ShoppingBag className="w-32 h-32" style={{ color: C.teal, opacity: 0.9 }} />
              <div
                className="absolute -top-4 -right-4 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-lg"
                style={{ backgroundColor: C.coral, color: '#fff' }}
              >
                Up to 70% OFF
              </div>
            </div>

            {/* Floating food cards */}
            {([
              { icon: <Croissant className="w-4 h-4" />, label: 'Pastries',  style: { top: '0%',    left: '-22%'  }, delay: 0.3,  accent: C.coral },
              { icon: <Pizza     className="w-4 h-4" />, label: 'Pizza',     style: { top: '15%',   right: '-22%' }, delay: 0.45, accent: C.teal },
              { icon: <Utensils  className="w-4 h-4" />, label: 'Salads',    style: { bottom: '12%',left: '-20%'  }, delay: 0.6,  accent: C.teal },
              { icon: <Soup      className="w-4 h-4" />, label: 'Bento',     style: { bottom: '0%', right: '-18%' }, delay: 0.75, accent: C.coral },
            ] as const).map(({ icon, label, style, delay, accent }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay }}
                className="absolute px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg"
                style={{ ...style, backgroundColor: 'rgba(255,255,255,0.95)' }}
              >
                <span style={{ color: accent }}>{icon}</span>
                <span className="text-xs font-extrabold" style={{ color: C.teal }}>{label}</span>
              </motion.div>
            ))}

            {/* CO₂ badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-center shadow-xl"
              style={{ backgroundColor: C.tealDark, border: `2px solid ${C.lime}` }}
            >
              <p className="text-white text-xl font-extrabold">2.5 kg</p>
              <p className="text-white/70 text-xs font-extrabold">CO₂ saved per bag</p>
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
      <section style={{ backgroundColor: C.tealDark }} className="py-14">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 10000, suffix: '+', label: 'Bags saved daily' },
            { value: 3200,  suffix: '+', label: 'Partner stores' },
            { value: 70,    suffix: '%', label: 'Avg. discount' },
            { value: 25000, suffix: 't', label: 'CO₂ avoided' },
          ].map(({ value, suffix, label }) => (
            <div key={label}>
              <p className="text-white" style={{ ...bebas, fontSize: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
                <Counter to={value} suffix={suffix} />
              </p>
              <p className="text-white/60 text-xs font-extrabold uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════ WHY YUGODA */}
      {/* Whole section pulled up over the stats bar via negative marginTop + zIndex */}
      <div style={{ position: 'relative', zIndex: 3, marginTop: '-80px' }}>

      {/* ── Cream: headline ── */}
      <div style={{ backgroundColor: C.cream, paddingTop: '80px', paddingBottom: '160px' }}>
        <div className="text-center px-6">
          <p className="text-sm font-extrabold uppercase tracking-widest mb-3" style={{ color: C.coral }}>
            Why choose YuGoDa
          </p>
          <h2 style={{ ...bebas, fontSize: 'clamp(2.8rem, 6vw, 5rem)', color: C.teal, lineHeight: 1 }}>
            GOOD FOR YOU.<br />
            <span style={{ color: C.coral }}>GREAT</span> FOR THE WORLD.
          </h2>
        </div>
      </div>

      {/* ── Green: height ≈ half bag rendered height so dividing line bisects bag ── */}
      <div style={{ backgroundColor: '#1a3d2b', position: 'relative', overflow: 'visible', height: '280px' }}>

        <div style={{
          position: 'absolute',
          top: '-160px',
          left: '49%',
          transform: 'translateX(-50%)',
          width: '590px',
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

        {/* Features row — two equal halves, bag column is a transparent gap */}
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 48px',
            height: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 480px 1fr',
            alignItems: 'center',
          }}
        >
          {/* ── Left: 2 features, top-aligned, equal gap ── */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '40px', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: '24px', paddingTop: '24px' }}>
            {[
              { icon: <DollarSign className="w-5 h-5" />, title: 'Save up to 70%', desc: 'Restaurant-quality food at a fraction of the price.' },
              { icon: <Leaf       className="w-5 h-5" />, title: 'Reduce waste',   desc: 'Every bag rescued means less food in landfill.' },
            ].map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '10px', width: '148px', flexShrink: 0 }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '14px', backgroundColor: C.lime, color: '#1a3d2b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </div>
                <h3 style={{ ...nunito, fontWeight: 800, fontSize: '0.95rem', color: '#fff', margin: 0 }}>{title}</h3>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Centre gap ── */}
          <div />

          {/* ── Right: 2 features, top-aligned, equal gap — mirror of left ── */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '40px', alignItems: 'flex-start', justifyContent: 'flex-start', paddingLeft: '24px', paddingTop: '24px' }}>
            {[
              { icon: <Gift   className="w-5 h-5" />, title: 'Surprise every time', desc: 'A mystery selection unique to every visit.' },
              { icon: <MapPin className="w-5 h-5" />, title: 'Shops near you',      desc: 'Bakeries, cafés and grocers in your area.' },
            ].map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '10px', width: '148px', flexShrink: 0 }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '14px', backgroundColor: C.lime, color: '#1a3d2b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </div>
                <h3 style={{ ...nunito, fontWeight: 800, fontSize: '0.95rem', color: '#fff', margin: 0 }}>{title}</h3>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
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
      <section id="how-it-works" className="py-24" style={{ backgroundColor: C.cream }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-extrabold uppercase tracking-widest mb-3" style={{ color: C.coral }}>
              Simple &amp; fast
            </p>
            <h2 style={{ ...bebas, fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: C.teal }}>
              HOW IT WORKS
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: <ShoppingBag className="w-8 h-8" />,
                title: 'Browse stores',
                desc: 'Discover local restaurants, bakeries and stores offering surprise bags near you.',
              },
              {
                step: '02',
                icon: <Heart className="w-8 h-8" />,
                title: 'Reserve your bag',
                desc: 'Pick a bag, pay in the app, and get a confirmation with your pickup window.',
              },
              {
                step: '03',
                icon: <Leaf className="w-8 h-8" />,
                title: 'Pick up & enjoy',
                desc: 'Show your order, collect your surprise bag, and feel great about saving food.',
              },
            ].map(({ step, icon, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative p-8 rounded-3xl overflow-hidden"
                style={{ backgroundColor: '#fff', boxShadow: '0 4px 30px rgba(27,94,82,0.08)' }}
              >
                <span
                  className="absolute -top-4 -right-2 font-extrabold select-none pointer-events-none"
                  style={{ ...bebas, fontSize: '6rem', color: 'rgba(27,94,82,0.06)', lineHeight: 1 }}
                >
                  {step}
                </span>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: C.teal, color: C.lime }}
                >
                  {icon}
                </div>
                <h3 className="font-extrabold text-lg mb-2" style={{ color: C.teal }}>{title}</h3>
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
              For restaurants &amp; stores
            </p>
            <h2 className="text-white leading-none mb-6" style={{ ...bebas, fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
              TURN SURPLUS<br />
              INTO <span style={{ color: C.coral }}>REVENUE.</span>
            </h2>
            <p className="text-white/70 mb-8 leading-relaxed font-extrabold text-sm">
              Join thousands of businesses already using YuGoDa to recover value from
              unsold inventory, reach new customers, and build a sustainability story
              your guests will love.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Zero upfront cost — pay only when you sell',
                'Reach eco-conscious customers in your area',
                'Dashboard analytics to track performance',
                'Easy bag management from any device',
                'Boost your brand with sustainability credentials',
              ].map(item => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: C.lime }} />
                  <span className="text-white/85 text-sm font-extrabold">{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/business-auth')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-extrabold text-sm hover:opacity-90 transition-opacity active:scale-95"
              style={{ backgroundColor: C.coral, color: '#fff' }}
            >
              Join as a business <ArrowRight className="w-4 h-4" />
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
              {
                quote: 'We recover $400 extra per month from food we used to throw away. YuGoDa has been a game changer.',
                name: 'Sophie L.',
                role: 'Bakery owner, Istanbul',
                rating: 5,
              },
              {
                quote: 'Our new customer acquisition doubled after joining. People who find us through YuGoDa become regulars.',
                name: 'Marco T.',
                role: 'Restaurant manager, Ankara',
                rating: 5,
              },
              {
                quote: "Setup took 10 minutes. The dashboard is clean and we get payouts weekly. Couldn't be simpler.",
                name: 'Aisha M.',
                role: 'Cafe owner, Izmir',
                rating: 5,
              },
            ].map(({ quote, name, role, rating }) => (
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
                <p className="text-white/90 text-sm font-extrabold leading-relaxed mb-3">"{quote}"</p>
                <p className="text-white/60 text-xs font-extrabold">{name} · {role}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════ PARTNER MARQUEE */}
      <PartnerMarquee />

      {/* ════════════════════════════════════ IMPACT */}
      <section id="impact" className="py-24" style={{ backgroundColor: C.tealDark }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: C.lime }}>
              Our impact
            </p>
            <h2 className="text-white leading-none" style={{ ...bebas, fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
              MAKING A REAL <span style={{ color: C.coral }}>DIFFERENCE</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Leaf className="w-8 h-8" />,
                title: 'Climate impact',
                desc: 'Food waste accounts for ~8% of global greenhouse gas emissions. Every bag rescued is a direct contribution to a healthier climate.',
                stat: '2.5 kg CO₂', statLabel: 'saved per bag',
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: 'Community access',
                desc: 'We make quality food accessible to everyone, regardless of budget — building more equitable, resilient communities.',
                stat: '500K+', statLabel: 'customers served',
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: 'Business resilience',
                desc: "Restaurants recover margin on food they'd otherwise discard — helping small businesses stay profitable and sustainable.",
                stat: '$1.2M+', statLabel: 'revenue recovered',
              },
            ].map(({ icon, title, desc, stat, statLabel }, i) => (
              <motion.div
                key={title}
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
                <h3 className="text-white font-extrabold text-lg mb-2">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-5">{desc}</p>
                <p style={{ ...bebas, fontSize: '2rem', color: C.lime }}>{stat}</p>
                <p className="text-white/50 text-xs font-extrabold uppercase tracking-widest">{statLabel}</p>
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
              Questions
            </p>
            <h2 style={{ ...bebas, fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: C.teal }}>
              FAQ
            </h2>
          </div>

          <div
            className="rounded-3xl overflow-hidden p-8"
            style={{ backgroundColor: '#fff', boxShadow: '0 8px 40px rgba(27,94,82,0.08)' }}
          >
            {[
              {
                q: "What's inside a surprise bag?",
                a: "Surprise bags contain a random selection of unsold food from that store — it could be pastries, sandwiches, hot meals, groceries, or prepared foods. You choose a store you like and trust the surprise!",
              },
              {
                q: 'How much do I save?',
                a: 'Typical savings are 50–70% off the original retail value. A $3 bag might contain $10 worth of food. The exact value depends on the store.',
              },
              {
                q: 'Where do I pick up my bag?',
                a: 'Each store has a defined pickup window (usually 30–90 minutes before closing). Your order confirmation will show the address and time. Just show up and show your QR code.',
              },
              {
                q: "Can I choose what's inside?",
                a: 'No — the surprise is part of the concept! Stores pack whatever is left over that day. However, you can filter by dietary type (vegetarian, vegan, etc.) when browsing.',
              },
              {
                q: 'How do I become a partner store?',
                a: "Click 'Join as a business' above, register, and complete your store profile. Our team will verify your listing within 24 hours and you can start selling bags immediately after.",
              },
            ].map(item => (
              <FaqItem key={item.q} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ FINAL CTA */}
      <section className="py-16 px-6">
        <div
          className="max-w-4xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden"
          style={{ backgroundColor: C.teal }}
        >
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-15 pointer-events-none" style={{ backgroundColor: C.lime }} />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-15 pointer-events-none" style={{ backgroundColor: C.coral }} />

          <p className="text-xs font-extrabold uppercase tracking-widest mb-3 relative z-10" style={{ color: C.lime }}>
            Join the movement
          </p>
          <h2
            className="text-white leading-none mb-6 relative z-10"
            style={{ ...bebas, fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            READY TO RESCUE<br />
            SOME <span style={{ color: C.coral }}>FOOD?</span>
          </h2>
          <p className="text-white/70 font-extrabold mb-8 relative z-10">
            Download the app or browse on web — it's free to join.
          </p>
          <div className="flex flex-wrap justify-center gap-4 relative z-10">
            <button
              onClick={() => navigate('/discover')}
              className="flex items-center gap-2 px-8 py-4 rounded-full font-extrabold text-sm hover:opacity-90 transition-opacity active:scale-95"
              style={{ backgroundColor: C.coral, color: '#fff' }}
            >
              Browse bags now <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="flex items-center gap-2 px-8 py-4 rounded-full font-extrabold text-sm border-2 border-white/30 text-white hover:border-white/60 transition-colors"
            >
              Create free account
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
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.lime }}>
                <Leaf className="w-5 h-5" style={{ color: C.teal }} />
              </div>
              <span style={{ ...bebas, fontSize: '1.5rem', color: '#fff', letterSpacing: '0.05em' }}>
                Yu<span style={{ color: C.coral }}>Go</span>Da
              </span>
            </div>
            <p className="text-white/50 text-xs leading-relaxed font-extrabold mb-5">
              Fight food waste. Save money.<br />Save the planet.
            </p>
            <div className="flex gap-3">
              {['🐦', '📸', '💼', '▶️'].map((icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base hover:opacity-70 transition-opacity"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {[
            { heading: 'Product',  links: ['How it works', 'Browse bags', 'For businesses', 'Pricing'] },
            { heading: 'Company',  links: ['About us', 'Blog', 'Careers', 'Press'] },
            { heading: 'Legal',    links: ['Privacy policy', 'Terms of service', 'Cookie settings', 'Admin'] },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <h4 className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: C.lime }}>
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link}>
                    <button
                      onClick={() => {
                        if (link === 'Admin') navigate('/admin-auth');
                        else if (link === 'Browse bags') navigate('/discover');
                        else if (link === 'For businesses') scrollTo('for-businesses');
                      }}
                      className="text-white/50 text-xs font-extrabold hover:text-white/90 transition-colors"
                    >
                      {link}
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
              🌱 Certified Eco-Friendly Platform
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
