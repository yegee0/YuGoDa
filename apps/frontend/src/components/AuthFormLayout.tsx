import React from 'react';

interface AuthFormLayoutProps {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

export default function AuthFormLayout({ children, headerContent }: AuthFormLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9] dark:bg-[#0A0A0A] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {headerContent && (
          <div className="bg-[#1A4D2E] p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="relative z-10">
              {headerContent}
            </div>
          </div>
        )}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
