import React from 'react';

type StatusTone = 'info' | 'success' | 'warning' | 'danger';

export interface StatusScreenProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tone?: StatusTone;
  action?: { label: string; onClick: () => void };
  className?: string;
}

const TONE: Record<StatusTone, { iconBg: string; iconFg: string }> = {
  info:    { iconBg: 'bg-[#1B5E52]/10 dark:bg-[#1B5E52]/25', iconFg: 'text-[#1B5E52]' },
  success: { iconBg: 'bg-[#748f2b]/15 dark:bg-[#748f2b]/25', iconFg: 'text-[#5a7a1a]' },
  warning: { iconBg: 'bg-amber-100 dark:bg-amber-500/25',     iconFg: 'text-amber-600' },
  danger:  { iconBg: 'bg-eco-secondary/10 dark:bg-eco-secondary/25', iconFg: 'text-eco-secondary' },
};

export function StatusScreen({
  icon,
  title,
  description,
  tone = 'info',
  action,
  className = '',
}: StatusScreenProps) {
  const t = TONE[tone];
  return (
    <div className={`h-full w-full flex items-center justify-center p-6 ${className}`}>
      <div className="max-w-md w-full text-center">
        <div className={`w-20 h-20 rounded-full ${t.iconBg} ${t.iconFg} flex items-center justify-center mx-auto mb-5`}>
          {icon}
        </div>
        <h3 className="text-xl font-black text-[#1B1B1B] dark:text-white">{title}</h3>
        {description && (
          <p className="text-sm text-[#8FA396] dark:text-white/60 mt-2 leading-relaxed">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#1B5E52] text-white rounded-2xl font-bold text-sm hover:bg-[#164d43] transition-colors shadow-sm"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
