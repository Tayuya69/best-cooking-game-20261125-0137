// audio.js — every sound is synthesized with WebAudio. No audio files.
// The context is created lazily on the first user gesture (browsers block
// audio before one); in shot mode nothing ever unlocks it, so renders stay
// silent. M toggles mute.

const AudioSys = {
  ctx: null,
  master: null,
  muted: false,
  musicTimer: null,
  musicStep: 0,
  rush: false,

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch (e) {
      this.ctx = null;
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  },

  // A short oscillator blip: freq slides from `from` to `to` over `dur`.
  blip(from, to, dur, type, vol) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
    gain.gain.setValueAtTime(vol || 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },

  // A burst of filtered noise (chop thunk, sizzle, coin shimmer).
  noise(dur, filterFreq, vol, type) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type || 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol || 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t);
    src.stop(t + dur);
  },

  chop() { this.noise(0.08, 900, 0.35); this.blip(160, 70, 0.09, 'triangle', 0.25); },
  pickup() { this.blip(300, 520, 0.08, 'sine', 0.15); },
  place() { this.blip(220, 140, 0.07, 'triangle', 0.15); },
  sizzleStart() { this.noise(0.5, 4500, 0.12, 'highpass'); },
  ding() { this.blip(880, 880, 0.25, 'sine', 0.22); this.blip(1320, 1320, 0.3, 'sine', 0.12); },
  coin() {
    this.blip(988, 988, 0.1, 'square', 0.1);
    setTimeout(() => this.blip(1319, 1319, 0.18, 'square', 0.1), 70);
  },
  refused() { this.blip(220, 160, 0.2, 'sawtooth', 0.12); },
  lost() { this.blip(330, 110, 0.5, 'sawtooth', 0.12); },
  rushHorn() { this.blip(440, 660, 0.3, 'square', 0.12); this.blip(660, 880, 0.3, 'square', 0.1); },

  // A simple walking bass loop. The main loop calls tick() once a second;
  // the step advances and a note plays when the game is running.
  startMusic() {
    if (this.musicTimer || !this.ctx) return;
    const bass = [110, 0, 130.8, 0, 98, 0, 146.8, 0, 110, 0, 130.8, 0, 164.8, 0, 146.8, 0];
    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const note = bass[this.musicStep % bass.length];
      this.musicStep += 1;
      if (note > 0) this.blip(note, note, this.rush ? 0.16 : 0.28, 'triangle', 0.14);
    }, this.rush ? 180 : 260);
  },

  setRush(on) {
    if (this.rush === on) return;
    this.rush = on;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
      this.startMusic();
    }
  },
};
