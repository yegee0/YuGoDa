import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SidebarItem({ icon, label, active, collapsed, onClick }: {
  icon: React.ReactNode,
  label: string,
  active: boolean,
  collapsed: boolean,
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all group ${active
        ? 'bg-[#1A4D2E] text-white shadow-lg shadow-[#1A4D2E]/20'
        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
    >
      <div className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-[#1A4D2E] dark:group-hover:text-[#2D6A4F]'} transition-colors`}>
        {icon}
      </div>
      {!collapsed && <span className="font-bold text-sm tracking-tight">{label}</span>}
    </button>
  );
}

export function Sidebar({ children }: { children: (collapsed: boolean) => React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <aside
      className={`bg-eco-surface border-r border-eco-border transition-all duration-300 flex flex-col z-50 ${isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div className="h-16 flex items-center px-6 border-b border-eco-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-eco-primary flex items-center justify-center text-white font-bold shrink-0">
            E
          </div>
          {!isSidebarCollapsed && (
            <span className="text-xl font-bold text-eco-primary dark:text-[#2D6A4F] tracking-tight">YuGoDa</span>
          )}
        </Link>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        {children(isSidebarCollapsed)}
      </nav>

      <div className="p-4 border-t border-eco-border">
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
