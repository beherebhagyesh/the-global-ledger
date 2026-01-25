
// Simple Web Audio API Synthesizer
// No external files required.

let audioCtx: AudioContext | null = null;

type SoundType = 'SUCCESS' | 'ERROR' | 'CLICK' | 'LEVEL_UP' | 'COIN' | 'VICTORY' | 'HAMMER';

export const playSound = (type: SoundType) => {
  // Lazy initialization on first user interaction
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(e => console.error(e));
  }

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  switch (type) {
    case 'SUCCESS':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;

    case 'ERROR':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;

    case 'CLICK':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;

    case 'COIN':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(1600, now + 0.1);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;

    case 'LEVEL_UP':
      // Arpeggio
      const notes = [440, 554, 659, 880]; // A Major
      notes.forEach((freq, i) => {
        if (!audioCtx) return;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        
        o.type = 'square';
        o.frequency.value = freq;
        
        const startTime = now + (i * 0.1);
        g.gain.setValueAtTime(0.05, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        
        o.start(startTime);
        o.stop(startTime + 0.4);
      });
      break;

    case 'VICTORY':
      // Victory Fanfare
      const vNotes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50]; // C Major Arpeggio with flourish
      vNotes.forEach((freq, i) => {
        if (!audioCtx) return;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        
        o.type = 'triangle';
        o.frequency.value = freq;
        
        const startTime = now + (i * 0.15);
        // Make last note longer
        const duration = i === vNotes.length - 1 ? 1.0 : 0.3;
        
        g.gain.setValueAtTime(0.08, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        o.start(startTime);
        o.stop(startTime + duration);
      });
      break;

    case 'HAMMER':
      osc.type = 'square';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
  }
};
