import React from 'react';
import { Info, Database, Cpu, Share2, UserCheck, Shield, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/shared';
import LegalLayout from './LegalLayout';

interface Section {
  icon: React.ReactNode;
  titleKey: string;
  bodyKey: string;
}

const SECTIONS: Section[] = [
  { icon: <Database  className="w-5 h-5" />, titleKey: 'legal_privacy_collect_title',  bodyKey: 'legal_privacy_collect_body' },
  { icon: <Cpu       className="w-5 h-5" />, titleKey: 'legal_privacy_use_title',      bodyKey: 'legal_privacy_use_body' },
  { icon: <Share2    className="w-5 h-5" />, titleKey: 'legal_privacy_share_title',    bodyKey: 'legal_privacy_share_body' },
  { icon: <UserCheck className="w-5 h-5" />, titleKey: 'legal_privacy_rights_title',   bodyKey: 'legal_privacy_rights_body' },
  { icon: <Shield    className="w-5 h-5" />, titleKey: 'legal_privacy_security_title', bodyKey: 'legal_privacy_security_body' },
  { icon: <Mail      className="w-5 h-5" />, titleKey: 'legal_privacy_contact_title',  bodyKey: 'legal_privacy_contact_body' },
];

export default function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <LegalLayout title={t('legal_privacy_heading')}>
      <div className="space-y-4 not-prose">
        <div className="flex items-start gap-3 px-1 pb-1">
          <Info className="w-4 h-4 text-[#8FA396] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#8FA396] italic m-0">
            {t('legal_privacy_last_updated')}: 2026-04
          </p>
        </div>
        <Card>
          <p className="text-sm text-[#5C6B63] leading-relaxed m-0">{t('legal_privacy_intro')}</p>
        </Card>
        {SECTIONS.map(({ icon, titleKey, bodyKey }) => (
          <div key={titleKey}>
            <Card>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#1B5E52]/10 text-[#1B5E52] flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
                <h2 className="text-lg font-black text-[#1B1B1B] m-0">{t(titleKey)}</h2>
              </div>
              <p className="text-sm text-[#5C6B63] leading-relaxed m-0">{t(bodyKey)}</p>
            </Card>
          </div>
        ))}
      </div>
    </LegalLayout>
  );
}
