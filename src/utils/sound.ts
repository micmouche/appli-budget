/** Sons de l'interface (tintement « argent » à la validation), désactivables dans les réglages. */
import { getSettings } from '@/store/settings';

type Player = { seekTo: (s: number) => Promise<void> | void; play: () => void; volume: number };
let player: Player | null = null;
let failed = false;

function getPlayer(): Player | null {
  if (player || failed) return player;
  try {
    // Chargement différé : l'absence du module natif (Expo Go) ne doit pas faire planter l'app.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const audio = require('expo-audio') as { createAudioPlayer: (src: number) => Player };
    player = audio.createAudioPlayer(require('../../assets/sounds/cash.wav') as number);
    player.volume = 0.9;
  } catch {
    failed = true;
  }
  return player;
}

/** Joue le tintement de validation si les sons sont activés. */
export function playCash(): void {
  if (!getSettings().soundEnabled) return;
  const p = getPlayer();
  if (!p) return;
  try {
    void p.seekTo(0);
    p.play();
  } catch {
    // silencieux
  }
}
