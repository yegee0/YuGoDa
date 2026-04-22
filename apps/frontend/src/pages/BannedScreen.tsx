import { useTranslation } from 'react-i18next';
import { Ban } from 'lucide-react';
import { StatusScreen } from '@/components/shared';

export default function BannedScreen() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen app-leaf-bg flex items-center justify-center">
      <StatusScreen
        tone="danger"
        icon={<Ban className="w-10 h-10" />}
        title={t('banned_screen_title')}
        description={t('banned_screen_body')}
        action={{ label: t('banned_screen_contact'), onClick: () => window.location.assign('mailto:support@yugoda.com') }}
      />
    </div>
  );
}
