// ── Currency ──────────────────────────────────────────────────
export const TL = (n: number): string => `₺${(n || 0).toFixed(2)}`;

// ── Date ──────────────────────────────────────────────────────
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── Time (HH:MM) ──────────────────────────────────────────────
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
