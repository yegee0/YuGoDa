import React from 'react';
import { Target, Zap, Globe2, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
      <div className="space-y-3">
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
