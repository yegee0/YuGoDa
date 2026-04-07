import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

export function Card({ children, className = '', padding = 'p-5' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm ${padding} ${className}`}>
      {children}
    </div>
  );
}
