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
