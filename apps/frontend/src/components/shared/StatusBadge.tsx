import { STATUS_CONFIG } from '@/lib/constants';

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['pending'];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
