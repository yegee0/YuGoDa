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
      {/* Header */}
      <header className="border-b sticky top-0 z-10" style={{ backgroundColor: '#1b5e52', borderColor: 'rgba(0,0,0,0.12)' }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/15"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="font-black text-white text-lg">{title}</h1>
          </div>
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.logoBg }}>
              <Leaf className="w-4 h-4" style={{ color: COLORS.logoIcon }} />
            </div>
            <span className="text-sm font-black text-white">
              Yu<span style={{ color: COLORS.logoAccent }}>Go</span>Da
            </span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E8E0D5]">
          <div className="prose prose-sm max-w-none prose-headings:text-[#1B1B1B] prose-p:text-[#5C6B63] prose-li:text-[#5C6B63]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
