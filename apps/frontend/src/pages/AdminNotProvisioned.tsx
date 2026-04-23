import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, AlertCircle } from 'lucide-react';
import { StatusScreen } from '@/components/shared';

export default function AdminNotProvisioned() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reason = params.get('reason');

  if (reason === 'retry') {
    return (
      <div className="min-h-screen app-leaf-bg flex items-center justify-center">
        <StatusScreen
          tone="danger"
          icon={<AlertCircle className="w-10 h-10" />}
          title={t('admin_auth_error_title')}
          description={t('admin_auth_error_body')}
          action={{ label: t('admin_auth_retry'), onClick: () => window.location.assign('/admin') }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen app-leaf-bg flex items-center justify-center">
      <StatusScreen
        tone="danger"
        icon={<ShieldAlert className="w-10 h-10" />}
        title={t('admin_not_provisioned_title')}
        description={t('admin_not_provisioned_body')}
        action={{ label: t('admin_not_provisioned_contact'), onClick: () => navigate('/admin-auth') }}
      />
    </div>
  );
}
