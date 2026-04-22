import { useTranslation } from 'react-i18next';
import type { AdminPresenceState } from '@/types';

interface AdminPresenceToggleProps {
  state: AdminPresenceState;
  onChange: (next: AdminPresenceState) => void;
}

const STATE_CONFIG: Record<AdminPresenceState, { dot: string; labelKey: string }> = {
  available: { dot: 'bg-[#748f2b]', labelKey: 'admin_presence_available' },
  away:      { dot: 'bg-amber-500', labelKey: 'admin_presence_away' },
  offline:   { dot: 'bg-gray-400',  labelKey: 'admin_presence_offline' },
};

export default function AdminPresenceToggle({ state, onChange }: AdminPresenceToggleProps) {
  const { t } = useTranslation();
  const cfg = STATE_CONFIG[state];

  const next: AdminPresenceState = state === 'available' ? 'away' : 'available';

  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      title={t('admin_presence_toggle_hint')}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      <span className="text-[11px] font-black uppercase tracking-wider">{t(cfg.labelKey)}</span>
    </button>
  );
}
