import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

export function Card({ children, className = '', padding = 'p-5' }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E8E0D5] shadow-sm ${padding} ${className}`}>
      {children}
    </div>
  );
}
