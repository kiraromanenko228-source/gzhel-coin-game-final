
import { SOUNDS } from '../constants';

class SoundManager {
  private pools: Map<string, HTMLAudioElement[]> = new Map();
  private volume: number = 1.0;
  private unlocked: boolean = false;

  constructor() {
    // Preload sounds
    Object.entries(SOUNDS).forEach(([key, url]) => {
      const pool: HTMLAudioElement[] = [];
      // Create pool of 3 instances per sound for overlapping
      for(let i=0; i<3; i++) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        pool.push(audio);
      }
      this.pools.set(key, pool);
    });
  }

  loadAll() {
      // Logic handled in constructor
  }

  // IOS Audio Unlocker
  unlockAudio() {
    if (this.unlocked) return;
    
    // Try to play a silent sound or brief sound to unlock the audio thread on iOS
    const sound = this.pools.get('CLICK')?.[0];
    if (sound) {
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                sound.pause();
                sound.currentTime = 0;
                this.unlocked = true;
            }).catch(() => {
                // Ignore initial play errors
            });
        }
    }
  }

  play(key: keyof typeof SOUNDS) {
    const pool = this.pools.get(key);
    if (!pool) return;

    // Find first available (ended or paused) audio
    const audio = pool.find(a => a.paused || a.ended) || pool[0];
    
    // Reset and play
    audio.currentTime = 0;
    audio.volume = this.volume;
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        // Ignore AbortError (interrupted by pause), NotAllowedError (autoplay), and NotSupportedError (bad format)
        if (e.name === 'AbortError' || e.name === 'NotAllowedError' || e.name === 'NotSupportedError') return;
        console.warn("Play error:", e);
      });
    }
  }

  setVolume(v: number) {
    this.volume = v;
  }
}

export const soundManager = new SoundManager();
