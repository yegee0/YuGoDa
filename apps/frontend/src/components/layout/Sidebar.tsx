import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Leaf, X } from 'lucide-react';
import { Link } from 'react-router-dom';

// ── Inline brand icons (safe — no dependency on lucide brand pack) ──
const IconInstagram = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconXTwitter = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconLinkedin = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

// ── Sidebar section label ─────────────────────────────────────────
export function SidebarSection({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="px-3 pt-5 pb-1 text-[10px] font-black uppercase tracking-widest select-none" style={{ color: 'rgba(255,255,255,0.6)' }}>
      {label}
    </div>
  );
}

// ── Nav item ──────────────────────────────────────────────────────
export function SidebarItem({
  icon,
  label,
  active,
  collapsed,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group font-bold text-sm ${
        active ? 'text-white shadow-lg' : ''
      }`}
      style={
        active
          ? { backgroundColor: '#1e2a20', boxShadow: '0 4px 16px rgba(0,0,0,0.28)', color: '#fff' }
          : { color: 'rgba(255,255,255,0.92)' }
      }
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.14)';
          (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
        }
      }}
    >
      <span
        className="shrink-0 transition-colors"
        style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.82)' }}
      >
        {icon}
      </span>
      {!collapsed && (
        <span className="tracking-tight flex-1 text-left truncate">{label}</span>
      )}
      {!collapsed && badge ? (
        <span className="w-5 h-5 text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#1e2a20' }}>
          {badge}
        </span>
      ) : null}
    </button>
  );
}

// ── About Us ──────────────────────────────────────────────────────
function SidebarAboutUs({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={`shrink-0 ${collapsed ? 'p-3' : 'p-4'}`}
      style={{ borderTop: '1px solid rgba(0,0,0,0.18)' }}
    >
      {!collapsed && (
        <>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
            About YuGoDa
          </p>
          <div className="flex items-center gap-2.5 mb-3.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
            >
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-black leading-none text-white">5,000+</p>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>meals rescued</p>
            </div>
          </div>
        </>
      )}

      <div className={`flex gap-1 ${collapsed ? 'flex-col items-center' : 'items-center'}`}>
        {[
          { href: 'https://instagram.com/yugoda', Icon: IconInstagram, title: 'Instagram' },
          { href: 'https://x.com/yugoda', Icon: IconXTwitter, title: 'X (Twitter)' },
          { href: 'https://linkedin.com/company/yugoda', Icon: IconLinkedin, title: 'LinkedIn' },
        ].map(({ href, Icon, title }) => (
          <a
            key={title}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={title}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
            style={{ color: 'rgba(255,255,255,0.75)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(0,0,0,0.14)';
              (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.75)';
            }}
          >
            <Icon className="w-4 h-4" />
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar shell ─────────────────────────────────────────────────
export function Sidebar({
  children,
  mobileOpen,
  onMobileClose,
}: {
  children: (collapsed: boolean) => React.ReactNode;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          flex flex-col z-50 transition-all duration-300 shrink-0
          fixed inset-y-0 left-0 md:relative md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isSidebarCollapsed ? 'w-[72px]' : 'w-64'}
        `}
        style={{ backgroundColor: '#ad3115', borderRight: '1px solid rgba(0,0,0,0.18)' }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center px-3 justify-between shrink-0"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.18)' }}
        >
          <Link to="/" className="flex items-center gap-3 min-w-0 overflow-hidden">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#1e2a20', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
            >
              <Leaf className="w-4 h-4 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <span
                className="text-xl font-black tracking-tight truncate"
                style={{ fontFamily: "'Nunito', sans-serif", color: '#ffffff' }}
              >
                Yu<span style={{ color: '#1e2a20' }}>Go</span>Da
              </span>
            )}
          </Link>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-xl transition-colors shrink-0"
              style={{ color: 'rgba(255,255,255,0.85)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.14)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
          {children(isSidebarCollapsed)}
        </nav>

        {/* About Us */}
        <SidebarAboutUs collapsed={isSidebarCollapsed} />

        {/* Collapse toggle — desktop only */}
        <div
          className="p-2.5 hidden md:block shrink-0"
          style={{ borderTop: '1px solid rgba(0,0,0,0.18)' }}
        >
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl transition-all duration-150"
            style={{ color: 'rgba(255,255,255,0.7)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.14)';
              (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)';
            }}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>
    </>
  );
}
