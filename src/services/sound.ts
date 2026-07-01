// Tiny WebAudio chime for notifications — no audio asset needed. Browsers gate audio behind a user
// gesture, so we resume the context on the first interaction.

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = ctx ?? new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Play a short two-note "ping". Safe no-op where WebAudio is unavailable or blocked. */
export function playChime(): void {
  const ac = context();
  if (!ac) return;
  const now = ac.currentTime;
  [880, 1320].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = now + i * 0.11;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.16, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.26);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + 0.28);
  });
}

// Unlock/resume the audio context on the first user gesture so later chimes are audible.
if (typeof window !== 'undefined') {
  const unlock = () => context();
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}
