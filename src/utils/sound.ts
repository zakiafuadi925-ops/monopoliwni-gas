// Web Audio API zero-dependency sound synthesizer with dynamic Macroeconomic Ambient System

export type MacroTrend = 'STABLE' | 'RISING' | 'VOLATILE' | 'CRISIS';

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let ambientEnabled = true;
const ambientMasterVolume = 0.18; // Atmospheric, non-intrusive background volume

// Ambient synthesis state
interface ActiveAmbientTrack {
  trend: MacroTrend;
  gainNode: GainNode;
  cleanup: () => void;
}

let activeAmbient: ActiveAmbientTrack | null = null;
let currentTargetTrend: MacroTrend = 'STABLE';
let noiseBuffer: AudioBuffer | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Generate organic pink noise buffer for crowd murmur, traffic drone & wind
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) {
    return noiseBuffer;
  }
  const bufferSize = ctx.sampleRate * 2.5; // 2.5 seconds loop
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Pink noise filter algorithm
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
    b6 = white * 0.115926;
  }
  noiseBuffer = buffer;
  return buffer;
}

// -------------------------------------------------------------
// 1. STABLE AMBIENT: Bustling city crowd, pedestrian murmur & bells
// -------------------------------------------------------------
function createStableAmbient(ctx: AudioContext, masterGain: GainNode): () => void {
  const nodesToStop: { stop?: () => void; disconnect: () => void }[] = [];
  const intervals: ReturnType<typeof setInterval>[] = [];

  // Low gentle crowd murmur noise
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = getNoiseBuffer(ctx);
  noiseSource.loop = true;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(500, ctx.currentTime);
  bandpass.Q.setValueAtTime(1.8, ctx.currentTime);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(1100, ctx.currentTime);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);

  // Slow LFO simulating human murmur modulation
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.3, ctx.currentTime);
  lfoGain.gain.setValueAtTime(90, ctx.currentTime);
  lfo.connect(bandpass.frequency);

  noiseSource.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(noiseGain);
  noiseGain.connect(masterGain);

  noiseSource.start();
  lfo.start();
  nodesToStop.push(noiseSource, lfo, noiseGain, bandpass, lowpass, lfoGain);

  // Gentle periodic market/pedestrian chime (warm C5, E5, G5)
  const chimeInterval = setInterval(() => {
    if (!ctx || ctx.state !== 'running' || !soundEnabled || !ambientEnabled) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99];
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.02, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 1.2);
    } catch {}
  }, 6500);
  intervals.push(chimeInterval);

  return () => {
    intervals.forEach(clearInterval);
    nodesToStop.forEach(n => {
      try {
        if (n.stop) n.stop();
        n.disconnect();
      } catch {}
    });
  };
}

// -------------------------------------------------------------
// 2. RISING AMBIENT: Congested traffic drone & distant vehicle horns
// -------------------------------------------------------------
function createRisingAmbient(ctx: AudioContext, masterGain: GainNode): () => void {
  const nodesToStop: { stop?: () => void; disconnect: () => void }[] = [];
  const intervals: ReturnType<typeof setInterval>[] = [];

  // Asphalt rumble noise
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = getNoiseBuffer(ctx);
  noiseSource.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(220, ctx.currentTime);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.12, ctx.currentTime);

  noiseSource.connect(lowpass);
  lowpass.connect(noiseGain);
  noiseGain.connect(masterGain);
  noiseSource.start();

  // Engine hum drone (triangle 95Hz)
  const engineOsc = ctx.createOscillator();
  const engineGain = ctx.createGain();
  engineOsc.type = 'triangle';
  engineOsc.frequency.setValueAtTime(95, ctx.currentTime);
  engineGain.gain.setValueAtTime(0.045, ctx.currentTime);
  engineOsc.connect(engineGain);
  engineGain.connect(masterGain);
  engineOsc.start();

  nodesToStop.push(noiseSource, lowpass, noiseGain, engineOsc, engineGain);

  // Occasional distant dual-tone vehicle horn
  const hornInterval = setInterval(() => {
    if (!ctx || ctx.state !== 'running' || !soundEnabled || !ambientEnabled) return;
    try {
      const now = ctx.currentTime;
      const hornPairs = [[349.23, 440], [311.13, 392], [370, 466.16]];
      const pair = hornPairs[Math.floor(Math.random() * hornPairs.length)];
      pair.forEach(f => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.02, now + 0.1);
        g.gain.linearRampToValueAtTime(0.001, now + 0.45);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.45);
      });
    } catch {}
  }, 5200);
  intervals.push(hornInterval);

  return () => {
    intervals.forEach(clearInterval);
    nodesToStop.forEach(n => {
      try {
        if (n.stop) n.stop();
        n.disconnect();
      } catch {}
    });
  };
}

// -------------------------------------------------------------
// 3. VOLATILE AMBIENT: Fluctuating market ticker & financial sweep
// -------------------------------------------------------------
function createVolatileAmbient(ctx: AudioContext, masterGain: GainNode): () => void {
  const nodesToStop: { stop?: () => void; disconnect: () => void }[] = [];
  const intervals: ReturnType<typeof setInterval>[] = [];

  // Modulating financial sweep drone
  const osc1 = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(240, ctx.currentTime);

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'triangle';
  lfo.frequency.setValueAtTime(0.4, ctx.currentTime);
  lfoGain.gain.setValueAtTime(45, ctx.currentTime);
  lfo.connect(osc1.frequency);

  oscGain.gain.setValueAtTime(0.05, ctx.currentTime);
  osc1.connect(oscGain);
  oscGain.connect(masterGain);

  osc1.start();
  lfo.start();
  nodesToStop.push(osc1, lfo, oscGain, lfoGain);

  // Rapid electronic ticker ticks (0.28s intervals)
  const tickerInterval = setInterval(() => {
    if (!ctx || ctx.state !== 'running' || !soundEnabled || !ambientEnabled) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(920 + Math.random() * 260, now);
      g.gain.setValueAtTime(0.015, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }, 280);
  intervals.push(tickerInterval);

  return () => {
    intervals.forEach(clearInterval);
    nodesToStop.forEach(n => {
      try {
        if (n.stop) n.stop();
        n.disconnect();
      } catch {}
    });
  };
}

// -------------------------------------------------------------
// 4. CRISIS AMBIENT: Constant oscillating police / raid sirens & sub drone
// -------------------------------------------------------------
function createCrisisAmbient(ctx: AudioContext, masterGain: GainNode): () => void {
  const nodesToStop: { stop?: () => void; disconnect: () => void }[] = [];

  // --- Dual-Tone Continuous Emergency Police / OTT Siren ---
  const sirenOsc1 = ctx.createOscillator();
  sirenOsc1.type = 'sawtooth';
  sirenOsc1.frequency.setValueAtTime(750, ctx.currentTime);

  const sirenOsc2 = ctx.createOscillator();
  sirenOsc2.type = 'sine';
  sirenOsc2.frequency.setValueAtTime(758, ctx.currentTime); // Slight detune for haunting resonance

  // LFO continuously sweeping pitch between ~580Hz and ~920Hz (0.45Hz period)
  const sirenLFO = ctx.createOscillator();
  sirenLFO.type = 'sine';
  sirenLFO.frequency.setValueAtTime(0.45, ctx.currentTime);

  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(170, ctx.currentTime);
  sirenLFO.connect(lfoGain);
  lfoGain.connect(sirenOsc1.frequency);
  lfoGain.connect(sirenOsc2.frequency);

  // Warm lowpass filter to evoke authentic emergency siren presence
  const sirenFilter = ctx.createBiquadFilter();
  sirenFilter.type = 'lowpass';
  sirenFilter.frequency.setValueAtTime(1400, ctx.currentTime);

  const sirenGain = ctx.createGain();
  sirenGain.gain.setValueAtTime(0.12, ctx.currentTime);

  sirenOsc1.connect(sirenFilter);
  sirenOsc2.connect(sirenFilter);
  sirenFilter.connect(sirenGain);
  sirenGain.connect(masterGain);

  sirenOsc1.start();
  sirenOsc2.start();
  sirenLFO.start();

  // --- Threatening Dark Sub-Drone (55Hz) ---
  const subDrone = ctx.createOscillator();
  const subFilter = ctx.createBiquadFilter();
  const subGain = ctx.createGain();
  subDrone.type = 'sawtooth';
  subDrone.frequency.setValueAtTime(55, ctx.currentTime);
  subFilter.type = 'lowpass';
  subFilter.frequency.setValueAtTime(110, ctx.currentTime);
  subGain.gain.setValueAtTime(0.06, ctx.currentTime);

  subDrone.connect(subFilter);
  subFilter.connect(subGain);
  subGain.connect(masterGain);
  subDrone.start();

  nodesToStop.push(
    sirenOsc1, sirenOsc2, sirenLFO, lfoGain, sirenFilter, sirenGain,
    subDrone, subFilter, subGain
  );

  return () => {
    nodesToStop.forEach(n => {
      try {
        if (n.stop) n.stop();
        n.disconnect();
      } catch {}
    });
  };
}

// -------------------------------------------------------------
// Cross-Fading Ambient Engine Controller
// -------------------------------------------------------------
function startAmbientForTrend(trend: MacroTrend, ctx: AudioContext): ActiveAmbientTrack {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  // Smoothly ramp in volume over 1.5 seconds
  masterGain.gain.linearRampToValueAtTime(ambientMasterVolume, ctx.currentTime + 1.5);
  masterGain.connect(ctx.destination);

  let cleanupFn: () => void = () => {};

  if (trend === 'CRISIS') {
    cleanupFn = createCrisisAmbient(ctx, masterGain);
  } else if (trend === 'VOLATILE') {
    cleanupFn = createVolatileAmbient(ctx, masterGain);
  } else if (trend === 'RISING') {
    cleanupFn = createRisingAmbient(ctx, masterGain);
  } else {
    cleanupFn = createStableAmbient(ctx, masterGain);
  }

  return {
    trend,
    gainNode: masterGain,
    cleanup: () => {
      try {
        cleanupFn();
        masterGain.disconnect();
      } catch {}
    }
  };
}

function switchAmbient(targetTrend: MacroTrend) {
  currentTargetTrend = targetTrend;
  if (!soundEnabled || !ambientEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // If already playing this trend, avoid restarting
  if (activeAmbient && activeAmbient.trend === targetTrend) {
    return;
  }

  // Crossfade: Ramp out active ambient over 1.2s
  if (activeAmbient) {
    const prev = activeAmbient;
    try {
      prev.gainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      setTimeout(() => {
        prev.cleanup();
      }, 1300);
    } catch {
      prev.cleanup();
    }
  }

  // Start new ambient track
  activeAmbient = startAmbientForTrend(targetTrend, ctx);
}

// -------------------------------------------------------------
// Exported Sound Manager Object
// -------------------------------------------------------------
export const soundManager = {
  isEnabled: () => soundEnabled,
  isAmbientEnabled: () => ambientEnabled,

  unlockAudio: () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (soundEnabled && ambientEnabled && !activeAmbient) {
          switchAmbient(currentTargetTrend);
        }
      }).catch(() => {});
    } else if (soundEnabled && ambientEnabled && !activeAmbient) {
      switchAmbient(currentTargetTrend);
    }
  },

  toggle: () => {
    soundEnabled = !soundEnabled;
    if (!soundEnabled) {
      soundManager.stopAmbient();
    } else {
      soundManager.resumeAmbient();
    }
    return soundEnabled;
  },

  toggleAmbient: () => {
    ambientEnabled = !ambientEnabled;
    if (!ambientEnabled) {
      soundManager.stopAmbient();
    } else if (soundEnabled) {
      soundManager.resumeAmbient();
    }
    return ambientEnabled;
  },

  setMacroeconomicState: (trend: MacroTrend, _inflationRate?: number) => {
    currentTargetTrend = trend;
    if (soundEnabled && ambientEnabled) {
      switchAmbient(trend);
    }
  },

  getMacroeconomicTrend: () => currentTargetTrend,

  getAmbientDescription: () => {
    switch (currentTargetTrend) {
      case 'CRISIS':
        return 'Sirene Polisi OTT & Darurat Krisis';
      case 'VOLATILE':
        return 'Ticker Bursa & Pasar Panik';
      case 'RISING':
        return 'Lalu Lintas Padat & Klakson Jalanan';
      case 'STABLE':
      default:
        return 'Kerumunan Kota Produktif & Damai';
    }
  },

  stopAmbient: () => {
    if (activeAmbient) {
      activeAmbient.cleanup();
      activeAmbient = null;
    }
  },

  resumeAmbient: () => {
    if (soundEnabled && ambientEnabled) {
      switchAmbient(currentTargetTrend);
    }
  },

  // One-shot game audio effects
  playClick: () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignore
    }
  },

  playDiceRoll: () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220 + Math.random() * 160, ctx.currentTime);
          gain.gain.setValueAtTime(0.14, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.05);
        }, i * 65);
      }
    } catch {
      // Ignore
    }
  },

  playDiceLand: () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);

      setTimeout(() => {
        if (!ctx) return;
        const bOsc = ctx.createOscillator();
        const bGain = ctx.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(210, ctx.currentTime);
        bGain.gain.setValueAtTime(0.12, ctx.currentTime);
        bGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        bOsc.connect(bGain);
        bGain.connect(ctx.destination);
        bOsc.start();
        bOsc.stop(ctx.currentTime + 0.08);
      }, 70);
    } catch {
      // Ignore
    }
  },

  playPawnStep: (stepIndex = 0) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = 320 + ((stepIndex % 8) * 28);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, now + 0.035);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  },

  playPawnLand: () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Ignore
    }
  },

  playCash: () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.1, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.25);
      });
    } catch {
      // Ignore
    }
  },

  playSirenOTT: () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.2);
      osc.frequency.linearRampToValueAtTime(700, now + 0.4);
      osc.frequency.linearRampToValueAtTime(950, now + 0.6);
      osc.frequency.linearRampToValueAtTime(700, now + 0.8);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.85);
    } catch {
      // Ignore
    }
  },

  playCardDraw: () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Ignore
    }
  },

  playBuzzer: () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignore
    }
  },

  playVictory: () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.15, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });
    } catch {
      // Ignore
    }
  }
};

