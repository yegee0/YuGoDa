import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import type { AccountStatus } from '@/types';

interface AccountStatusBannerProps {
  status: AccountStatus | undefined;
}

/**
 * Thin top-of-layout banner shown to users whose backend account state is
 * `suspended`. Banned users are force-logged-out by `api.ts` so they never
 * render this; active users see nothing.
 */
export function AccountStatusBanner({ status }: AccountStatusBannerProps) {
  const { t } = useTranslation();

  if (status !== 'suspended') return null;

  return (
    <div className="w-full bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-black">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>{t('account_banner_suspended')}</span>
    </div>
  );
}
