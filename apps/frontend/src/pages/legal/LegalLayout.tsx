import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Leaf } from 'lucide-react';
import { COLORS } from '@/lib/constants';

interface LegalLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, children }: LegalLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1b5e52' }}>

      {/* ── Navigation bar ── */}
      <header
        className="sticky top-0 z-10"
        style={{ backgroundColor: '#1b5e52', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
          >
            <ChevronLeft className="w-5 h-5 text-white/80" />
          </button>
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: COLORS.logoBg }}
            >
              <Leaf className="w-4 h-4" style={{ color: COLORS.logoIcon }} />
            </div>
            <span className="text-sm font-black text-white">
              Yu<span style={{ color: COLORS.logoAccent }}>Go</span>Da
            </span>
          </button>
        </div>
      </header>

      {/* ── Page title hero ── */}
      <div className="max-w-3xl mx-auto px-6 pt-10 pb-8">
        <p className="text-[0.65rem] font-black uppercase tracking-widest text-white/40 mb-2">
          YuGoDa
        </p>
        <h1 className="text-3xl font-black text-white leading-tight">{title}</h1>
        <div
          className="mt-4 h-1 w-10 rounded-full"
          style={{ backgroundColor: '#B8E04A' }}
        />
      </div>

      {/* ── Cards ── */}
      <main className="max-w-3xl mx-auto px-6 pb-16">
        {children}
      </main>

    </div>
  );
}
