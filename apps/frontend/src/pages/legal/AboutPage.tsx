import React from 'react';
import { Target, Zap, Globe2, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/shared';
import LegalLayout from './LegalLayout';

interface Section {
  icon: React.ReactNode;
  titleKey: string;
  bodyKey: string;
}

const SECTIONS: Section[] = [
  { icon: <Target  className="w-5 h-5" />, titleKey: 'legal_about_mission_title', bodyKey: 'legal_about_mission_body' },
  { icon: <Zap     className="w-5 h-5" />, titleKey: 'legal_about_what_title',    bodyKey: 'legal_about_what_body' },
  { icon: <Globe2  className="w-5 h-5" />, titleKey: 'legal_about_impact_title',  bodyKey: 'legal_about_impact_body' },
  { icon: <Mail    className="w-5 h-5" />, titleKey: 'legal_about_contact_title', bodyKey: 'legal_about_contact_body' },
];

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <LegalLayout title={t('legal_about_heading')}>
      <div className="space-y-4 not-prose">
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
