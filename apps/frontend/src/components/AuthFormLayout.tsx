import React from 'react';

interface AuthFormLayoutProps {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

export default function AuthFormLayout({ children, headerContent }: AuthFormLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E8E0D5] overflow-hidden">
        {headerContent && (
          <div className="bg-[#1B5E52] p-6 md:p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="relative z-10">
              {headerContent}
            </div>
          </div>
        )}
        <div className="p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
