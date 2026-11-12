/** Natures d'abonnement proposées à la saisie (le libellé choisi est stocké dans la note). */
export interface SubscriptionPreset {
  id: string;
  label: string;
  icon: string;
}

export const SUBSCRIPTION_PRESETS: readonly SubscriptionPreset[] = [
  { id: 'netflix', label: 'Netflix', icon: 'Clapperboard' },
  { id: 'spotify', label: 'Spotify', icon: 'Headphones' },
  { id: 'applemusic', label: 'Apple Music', icon: 'Headphones' },
  { id: 'deezer', label: 'Deezer', icon: 'Headphones' },
  { id: 'disney', label: 'Disney+', icon: 'Clapperboard' },
  { id: 'prime', label: 'Amazon Prime', icon: 'Package' },
  { id: 'canal', label: 'Canal+', icon: 'Tv' },
  { id: 'youtube', label: 'YouTube Premium', icon: 'Play' },
  { id: 'box', label: 'Box internet', icon: 'Wifi' },
  { id: 'mobile', label: 'Forfait mobile', icon: 'Smartphone' },
  { id: 'gym', label: 'Salle de sport', icon: 'Dumbbell' },
  { id: 'cloud', label: 'Stockage cloud', icon: 'Cloud' },
  { id: 'press', label: 'Presse / magazine', icon: 'Newspaper' },
  { id: 'games', label: 'Jeux vidéo', icon: 'Gamepad2' },
  { id: 'insurance', label: 'Assurance', icon: 'Shield' },
  { id: 'other', label: 'Autre', icon: 'CircleEllipsis' },
];

/** Regroupe des dépenses d'abonnement par nature (note), avec leur total. */
export function groupSubscriptions<T extends { note: string | null; amountCents: number }>(rows: readonly T[]): { label: string; totalCents: number; count: number }[] {
  const map = new Map<string, { label: string; totalCents: number; count: number }>();
  for (const r of rows) {
    const label = r.note?.trim() || 'Autre';
    const cur = map.get(label.toLowerCase()) ?? { label, totalCents: 0, count: 0 };
    cur.totalCents += r.amountCents;
    cur.count += 1;
    map.set(label.toLowerCase(), cur);
  }
  return [...map.values()].sort((a, b) => b.totalCents - a.totalCents);
}
