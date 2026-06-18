let ctx = null;
let master = null;
let musicGain = null;
let sfxGain = null;
let musicOsc = null;
let musicLfo = null;
let enabled = false;
let musicEnabled = true;
let sfxEnabled = true;
let volume = 0.45;

export function setupAudioControls() {
  const audioToggle = document.getElementById("audioToggle");
  const audioHud = document.getElementById("audioHud");
  const panel = document.getElementById("audioPanel");
  const slider = document.getElementById("volumeSlider");
  const musicToggle = document.getElementById("musicToggle");
  const sfxToggle = document.getElementById("sfxToggle");

  const toggleAudio = async () => {
    if (!enabled) await enableAudio();
    else openPanel(panel);
    updateLabels();
  };

  if (audioToggle) audioToggle.onclick = toggleAudio;
  if (audioHud) audioHud.onclick = toggleAudio;

  if (slider) {
    slider.oninput = () => {
      volume = Number(slider.value) / 100;
      if (master) master.gain.setTargetAtTime(volume, now(), 0.03);
    };
  }

  if (musicToggle) {
    musicToggle.onchange = () => {
      musicEnabled = musicToggle.checked;
      if (musicEnabled && enabled) startMusic();
      else stopMusic();
    };
  }

  if (sfxToggle) {
    sfxToggle.onchange = () => {
      sfxEnabled = sfxToggle.checked;
    };
  }

  document.addEventListener("pointerdown", () => {
    if (!ctx) primeAudio();
  }, { once: true });

  updateLabels();
}

export async function enableAudio() {
  primeAudio();
  if (ctx && ctx.state === "suspended") await ctx.resume();
  enabled = true;
  if (musicEnabled) startMusic();
  playSfx("positive");
  updateLabels();
}

export function playSfx(type = "info") {
  if (!enabled || !sfxEnabled || !ctx || !sfxGain) return;

  if (type === "positive") return arpeggio([523.25, 659.25, 783.99], 0.055, 0.035);
  if (type === "negative") return hit(130, 0.18, "sawtooth", 0.16);
  if (type === "warning") return arpeggio([392, 370, 392], 0.06, 0.045);
  if (type === "click") return click();
  return arpeggio([440, 554.37], 0.045, 0.03);
}

export function setAudioMood(mood = "neutral") {
  if (!musicGain || !musicOsc || !ctx) return;
  const target = mood === "crisis" ? 0.09 : mood === "election" ? 0.07 : 0.055;
  musicGain.gain.setTargetAtTime(target, now(), 0.25);
}

function primeAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  musicGain = ctx.createGain();
  sfxGain = ctx.createGain();

  master.gain.value = volume;
  musicGain.gain.value = 0.055;
  sfxGain.gain.value = 0.28;

  musicGain.connect(master);
  sfxGain.connect(master);
  master.connect(ctx.destination);
}

function startMusic() {
  if (!ctx || musicOsc) return;

  musicOsc = ctx.createOscillator();
  const bass = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const lfoGain = ctx.createGain();

  musicLfo = ctx.createOscillator();

  musicOsc.type = "sine";
  bass.type = "triangle";
  musicOsc.frequency.value = 110;
  bass.frequency.value = 55;

  filter.type = "lowpass";
  filter.frequency.value = 520;
  filter.Q.value = 0.8;

  musicLfo.type = "sine";
  musicLfo.frequency.value = 0.07;
  lfoGain.gain.value = 90;
  musicLfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  const localGain = ctx.createGain();
  localGain.gain.value = 0.55;

  musicOsc.connect(localGain);
  bass.connect(localGain);
  localGain.connect(filter);
  filter.connect(musicGain);

  musicOsc.start();
  bass.start();
  musicLfo.start();

  musicOsc._bass = bass;
  musicOsc._filter = filter;
  musicOsc._localGain = localGain;
}

function stopMusic() {
  if (!musicOsc) return;
  try {
    musicOsc.stop();
    if (musicOsc._bass) musicOsc._bass.stop();
    if (musicLfo) musicLfo.stop();
  } catch (e) {}
  musicOsc = null;
  musicLfo = null;
}

function arpeggio(freqs, step, gainValue) {
  freqs.forEach((freq, index) => {
    const t = now() + index * step;
    tone(freq, t, step * 1.7, "sine", gainValue);
  });
}

function hit(freq, duration, type, gainValue) {
  const t = now();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.55), t + duration);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, t);
  filter.frequency.exponentialRampToValueAtTime(150, t + duration);

  gain.gain.setValueAtTime(gainValue, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGain);
  osc.start(t);
  osc.stop(t + duration + 0.03);
}

function click() {
  tone(880, now(), 0.035, "triangle", 0.025);
}

function tone(freq, start, duration, type, gainValue) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(gainValue, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function openPanel(panel) {
  if (!panel) return;
  panel.classList.toggle("open");
  setTimeout(() => panel.classList.remove("open"), 5000);
}

function updateLabels() {
  const audioToggle = document.getElementById("audioToggle");
  const audioHud = document.getElementById("audioHud");
  if (audioToggle) audioToggle.textContent = enabled ? "ÁUDIO: ON" : "ÁUDIO: OFF";
  if (audioHud) audioHud.textContent = enabled ? "ÁUDIO ON" : "ÁUDIO";
}

function now() {
  return ctx ? ctx.currentTime : 0;
}