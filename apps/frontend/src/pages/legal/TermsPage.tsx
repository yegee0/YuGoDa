import React from 'react';
import { Info, UserCog, ShoppingCart, Store, ShieldAlert, RefreshCw, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LegalLayout from './LegalLayout';

interface Section {
  icon: React.ReactNode;
  titleKey: string;
  bodyKey: string;
}

const SECTIONS: Section[] = [
  { icon: <UserCog      className="w-5 h-5" />, titleKey: 'legal_terms_account_title',   bodyKey: 'legal_terms_account_body' },
  { icon: <ShoppingCart className="w-5 h-5" />, titleKey: 'legal_terms_orders_title',    bodyKey: 'legal_terms_orders_body' },
  { icon: <Store        className="w-5 h-5" />, titleKey: 'legal_terms_partner_title',   bodyKey: 'legal_terms_partner_body' },
  { icon: <ShieldAlert  className="w-5 h-5" />, titleKey: 'legal_terms_liability_title', bodyKey: 'legal_terms_liability_body' },
  { icon: <RefreshCw    className="w-5 h-5" />, titleKey: 'legal_terms_changes_title',   bodyKey: 'legal_terms_changes_body' },
  { icon: <Mail         className="w-5 h-5" />, titleKey: 'legal_terms_contact_title',   bodyKey: 'legal_terms_contact_body' },
];

export default function TermsPage() {
  const { t } = useTranslation();
  return (
    <LegalLayout title={t('legal_terms_heading')}>
      <div className="space-y-3">

        {/* Last updated badge */}
        <div className="flex items-center gap-2 pb-1 px-1">
          <Info className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
          <p className="text-xs text-white/50 italic m-0">
            {t('legal_terms_last_updated')}: 2026-04
          </p>
        </div>

        {/* Intro card */}
        <div className="bg-white/10 rounded-2xl p-5 border border-white/15">
          <p className="text-sm text-white/80 leading-relaxed m-0">{t('legal_terms_intro')}</p>
        </div>

        {/* Section cards */}
        {SECTIONS.map(({ icon, titleKey, bodyKey }) => (
          <div
            key={titleKey}
            className="bg-white rounded-2xl p-6 shadow-sm border-l-4"
            style={{ borderLeftColor: '#1B5E52' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(27,94,82,0.08)', color: '#1B5E52' }}
              >
                {icon}
              </div>
              <h2 className="text-base font-black text-[#111827] m-0">{t(titleKey)}</h2>
            </div>
            <p className="text-sm text-[#374151] leading-relaxed m-0">{t(bodyKey)}</p>
          </div>
        ))}

      </div>
    </LegalLayout>
  );
}
