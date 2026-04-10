import React from 'react';

export function StatCard({ label, value, icon, color, sub }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E0D5] shadow-sm flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#8FA396] font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-black text-[#1B1B1B] leading-none">{value}</p>
        {sub && <p className="text-xs text-[#8FA396] mt-1">{sub}</p>}
      </div>
    </div>
  );
}
