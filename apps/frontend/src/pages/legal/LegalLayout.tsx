import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Leaf } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, children }: LegalLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-white/5 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h1 className="font-bold text-gray-900 dark:text-white text-lg">{title}</h1>
          </div>
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1A4D2E] flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black text-gray-900 dark:text-white">
              Yu<span className="text-[#FF9F1C]">Go</span>Da
            </span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-[#111] rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-white/5">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-li:text-gray-600 dark:prose-li:text-gray-400">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
