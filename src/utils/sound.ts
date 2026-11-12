/** Sons de l'interface (tintement « argent » à la validation), désactivables dans les réglages. */
import { getSettings } from '@/store/settings';

interface Player {
  isLoaded: boolean;
  volume: number;
  seekTo: (s: number) => Promise<void> | void;
  play: () => void;
  addListener: (
    event: 'playbackStatusUpdate',
    cb: (status: { isLoaded: boolean }) => void,
  ) => { remove: () => void };
}
interface AudioModule {
  createAudioPlayer: (src: number) => Player;
  setAudioModeAsync?: (mode: Record<string, unknown>) => Promise<void>;
}

let player: Player | null = null;
let failed = false;
let pending = false;

/** Précharge le lecteur (appelé au démarrage) pour que le premier tintement parte sans délai. */
export function preloadSounds(): void {
  if (player || failed) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const audio = require('expo-audio') as AudioModule;
    // Sonner même si l'interrupteur « silencieux » iOS est actif ; ne pas couper la musique en cours.
    void audio
      .setAudioModeAsync?.({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
      })
      .catch(() => undefined);
    player = audio.createAudioPlayer(require('../../assets/sounds/cash.wav') as number);
    player.volume = 1;
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.isLoaded && pending) {
        pending = false;
        player?.play();
      }
    });
  } catch {
    failed = true;
  }
}

/** Joue le tintement de validation si les sons sont activés. */
export function playCash(): void {
  if (!getSettings().soundEnabled) return;
  preloadSounds();
  const p = player;
  if (!p) return;
  try {
    if (!p.isLoaded) {
      pending = true;
      return;
    }
    const seek = p.seekTo(0);
    if (seek && typeof (seek as Promise<void>).then === 'function') {
      void (seek as Promise<void>).then(() => p.play()).catch(() => p.play());
    } else {
      p.play();
    }
  } catch {
    // silencieux
  }
}
