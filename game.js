// --- Canvas setup ---
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const stageLabelEl = document.getElementById("stage-label");
const debugLabelEl = document.getElementById("debug-label");
const powerupLabelEl = document.getElementById("powerup-label");
const waveStatusEl = document.getElementById("wave-status");
const waveLabelEl = document.getElementById("wave-label");
const waveCountdownEl = document.getElementById("wave-countdown");
const muteBtn = document.getElementById("mute-btn");
const startScreen = document.getElementById("start-screen");
const mobileControls = document.getElementById("mobile-controls");
const instructionsDesktop = document.getElementById("instructions-desktop");
const instructionsMobile = document.getElementById("instructions-mobile");
const startPromptDesktop = document.querySelector(".start-prompt-desktop");
const startPromptMobile = document.querySelector(".start-prompt-mobile");

let W = 960;
let H = 540;
const DESKTOP_H = 540;
let inputMode = "desktop";

// --- Game state ---
let score = 0;
let bestScore = 0;
let newBestShown = false;
let scoreMultiplier = 1;
let chainTimer = 0;
let nextLifeAt = 30000;
let lifeScoreGap = 30000;
let hitStopTimer = 0;
let lastLifePulse = 0;
const CHAIN_WINDOW = 2;
const CHAIN_MAX = 8;
const LIFE_SCORE_STEP = 30000;
const MAX_LIVES = 5;
const NEAR_MISS_SCORE = 50;
const NEAR_MISS_BAND = 16;
let gameOver = false;
let waitingToStart = true;
let screenShake = 0;
let particles = [];
let rocks = [];
let bullets = [];
let ufos = [];
let ufoSpawnTimer = 0;
let ufoNextSpawn = 0;
let ufoAudioState = "none";
let rockCount = 4;
let shipDebris = [];
let shipBreakActive = false;
let shipBreakTimer = 0;
let pendingRespawn = false;
let lives = 3;
let bossDebug = false;
let invincibleUntil = 0;
let hitFlash = 0;
let wave = 1;
let shockwaveUsedThisWave = false;
let waveBanner = 0;
let waveBannerDuration = 1;
let waveBannerText = "WAVE 1";
let waveBannerSub = "";
let controlsFadeAt = 0;
let pendingWaveEnemies = null;
const BOSS_NAME = "CRIMSON NUCLEUS";
const W10_BOSS_NAME = "CRIMSON HALO";
let scorePopups = [];
let clusters = [];
let clusterSeekers = [];
let boss = null;
let bossPulses = [];
let bossBullets = [];
let rockSpeedBonus = 0;
let pickups = [];
let bombs = [];
let bombWaves = [];
let rapidTimer = 0;
let tripleTimer = 0;
let slowTimer = 0;
let shieldCharges = 0;
let bombCharges = 0;

const START_LIVES = 3;
const LIFE_BREAK_DURATION = 0.35;
const INVINCIBLE_MS = 2000;
const WAVE_CLEAR_BONUS = 100;
const CLEAN_WAVE_BONUS = 150;
const CLUSTER_SPAWN_CHANCE = 0.25;
const CLUSTER2_SPAWN_CHANCE = 0.14;
const CLUSTER2_OUTER_R = 16;
const CLUSTER2_SPEED = 1.15;
const CLUSTER2_PULSE_GAP = 0.8;
const CLUSTER_CIRCLE_R = 5.6;
const CLUSTER_POP_SCORE = 20;
const CLUSTER_CLEAR_SCORE = 200;
const PICKUP_DURATION = 8;

const HIGH_SCORE_KEY = "asteroidsHighScores";
const MAX_HIGH_SCORES = 5;
let highScores = loadHighScores();

let lastFrameTime = performance.now();
const REFERENCE_FPS = 60;
const MAX_DELTA_TIME = 0.05;
const SHIP_BREAK_DURATION = 50 / REFERENCE_FPS;

function timeScale(dt) {
  return dt * REFERENCE_FPS;
}

const keys = {};

// --- Input mode & mobile controls ---
const mobileInput = { fire: false };
const joystick = {
  active: false,
  touchId: null,
  normX: 0,
  normY: 0,
  power: 0,
  angle: 0,
  centerX: 0,
  centerY: 0,
  maxRadius: 58,
};

const JOYSTICK_DEAD_ZONE = 0.12;
const MOBILE_MAX_TURN_SPEED = 2.8;

const mouse = {
  x: 0,
  y: 0,
  leftDown: false,
  tracking: false,
  power: 0,
  angle: 0,
};

const MOUSE_MAX_DISTANCE_RATIO = 0.35;
const MOUSE_DEAD_ZONE = 0.08;

// --- Shockwave ---
let shockwaves = [];
let shockwaveCooldownUntil = 0;
const SHOCKWAVE_COOLDOWN = 5000;
const SHOCKWAVE_EXPAND_SPEED = 4;
const BOMB_SPEED = 4.2;
const BOMB_RANGE = 760;
const BOMB_WAVE_MAX = 210;
const BOMB_WAVE_SPEED = 5.5;

// --- UFO enemy (hunter — no shooting) ---
const UFO_RADIUS = 22;
const UFO_VISUAL_RADIUS = 32;
const UFO_CRUISE_SPEED = 1.5;
const UFO_SPEED = 2.4;
const UFO_CHASE_RANGE = 180;
const UFO_SCORE = 500;
const UFO_SPAWN_MIN = 12;
const UFO_SPAWN_MAX = 28;

// --- Ship settings ---
const ship = {
  x: W / 2,
  y: H / 2,
  angle: -Math.PI / 2,
  vx: 0,
  vy: 0,
  radius: 14,
  thrustPower: 0.09,
  reversePower: 0.02,
  rotateSpeed: 0.06,
  maxSpeed: 7,
  friction: 0.992,
};

// --- Rock size definitions ---
const ROCK_SIZES = {
  large:  { radius: 45, score: 20, sides: 10 },
  medium: { radius: 28, score: 50, sides: 8 },
  small:  { radius: 16, score: 100, sides: 6 },
};

// --- Web Audio (retro SFX, no external files) ---
const sfx = {
  ctx: null,
  master: null,
  noiseBuffer: null,
  thrustOsc: null,
  thrustGain: null,
  thrustFilter: null,
  thrustActive: false,
  ufoPatrolOsc: null,
  ufoPatrolGain: null,
  ufoPatrolPulse: null,
  ufoPatrolPulseDepth: null,
  ufoPatrolActive: false,
  ufoChaseOsc: null,
  ufoChaseGain: null,
  ufoChasePulse: null,
  ufoChasePulseDepth: null,
  ufoChaseActive: false,
  muted: false,
  volume: 0.864,
  primed: false,
  ready: false,
  titleGain: null,
  titleOn: false,
  titleNext: 0,
  titleStep: 0,
  bossGain: null,
  bossOn: false,
  bossNext: 0,
  bossStep: 0,
};

function initAudio() {
  if (sfx.ready) return;
  sfx.ctx = new (window.AudioContext || window.webkitAudioContext)();
  sfx.master = sfx.ctx.createGain();
  sfx.master.gain.value = sfx.volume;
  sfx.master.connect(sfx.ctx.destination);

  const sampleRate = sfx.ctx.sampleRate;
  const noiseLength = sampleRate * 0.5;
  sfx.noiseBuffer = sfx.ctx.createBuffer(1, noiseLength, sampleRate);
  const noiseData = sfx.noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseLength; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  sfx.thrustOsc = sfx.ctx.createOscillator();
  sfx.thrustOsc.type = "sine";
  sfx.thrustOsc.frequency.value = 42;
  sfx.thrustFilter = sfx.ctx.createBiquadFilter();
  sfx.thrustFilter.type = "lowpass";
  sfx.thrustFilter.frequency.value = 120;
  sfx.thrustGain = sfx.ctx.createGain();
  sfx.thrustGain.gain.value = 0;
  sfx.thrustOsc.connect(sfx.thrustFilter);
  sfx.thrustFilter.connect(sfx.thrustGain);
  sfx.thrustGain.connect(sfx.master);
  sfx.thrustOsc.start();

  sfx.titleGain = sfx.ctx.createGain();
  sfx.titleGain.gain.value = 0.0001;
  sfx.titleGain.connect(sfx.master);

  sfx.bossGain = sfx.ctx.createGain();
  sfx.bossGain.gain.value = 0.0001;
  sfx.bossGain.connect(sfx.master);

  initUfoSoundNodes();

  sfx.ready = true;
}

function initUfoSoundNodes() {
  if (!sfx.ctx || sfx.ufoPatrolOsc) return;
  const ctx = sfx.ctx;

  sfx.ufoPatrolOsc = ctx.createOscillator();
  sfx.ufoPatrolOsc.type = "sine";
  sfx.ufoPatrolOsc.frequency.value = 75;
  sfx.ufoPatrolGain = ctx.createGain();
  sfx.ufoPatrolGain.gain.value = 0;
  sfx.ufoPatrolPulse = ctx.createOscillator();
  sfx.ufoPatrolPulse.type = "sine";
  sfx.ufoPatrolPulse.frequency.value = 2.2;
  sfx.ufoPatrolPulseDepth = ctx.createGain();
  sfx.ufoPatrolPulseDepth.gain.value = 0;
  sfx.ufoPatrolOsc.connect(sfx.ufoPatrolGain);
  sfx.ufoPatrolGain.connect(sfx.master);
  sfx.ufoPatrolPulse.connect(sfx.ufoPatrolPulseDepth);
  sfx.ufoPatrolPulseDepth.connect(sfx.ufoPatrolGain.gain);
  sfx.ufoPatrolOsc.start();
  sfx.ufoPatrolPulse.start();

  sfx.ufoChaseOsc = ctx.createOscillator();
  sfx.ufoChaseOsc.type = "square";
  sfx.ufoChaseOsc.frequency.value = 108;
  sfx.ufoChaseGain = ctx.createGain();
  sfx.ufoChaseGain.gain.value = 0;
  sfx.ufoChasePulse = ctx.createOscillator();
  sfx.ufoChasePulse.type = "sine";
  sfx.ufoChasePulse.frequency.value = 7;
  sfx.ufoChasePulseDepth = ctx.createGain();
  sfx.ufoChasePulseDepth.gain.value = 0;
  sfx.ufoChaseOsc.connect(sfx.ufoChaseGain);
  sfx.ufoChaseGain.connect(sfx.master);
  sfx.ufoChasePulse.connect(sfx.ufoChasePulseDepth);
  sfx.ufoChasePulseDepth.connect(sfx.ufoChaseGain.gain);
  sfx.ufoChaseOsc.start();
  sfx.ufoChasePulse.start();
}

const UFO_PATROL_VOLUME = 0.022;
const UFO_CHASE_VOLUME = 0.032;

function playUfoAppearSfx() {
  if (!sfx.ready || sfx.muted) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;
  [180, 360].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + i * 0.11;
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.08, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
    osc.connect(gain);
    gain.connect(sfx.master);
    osc.start(start);
    osc.stop(start + 0.12);
  });
}

function playUfoDestroyedSound() {
  if (!sfx.ready || sfx.muted) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;

  const zap = ctx.createOscillator();
  const zapGain = ctx.createGain();
  zap.type = "sawtooth";
  zap.frequency.setValueAtTime(720, now);
  zap.frequency.exponentialRampToValueAtTime(90, now + 0.28);
  zapGain.gain.setValueAtTime(0.11, now);
  zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  zap.connect(zapGain);
  zapGain.connect(sfx.master);
  zap.start(now);
  zap.stop(now + 0.32);

  const ping = ctx.createOscillator();
  const pingGain = ctx.createGain();
  ping.type = "square";
  ping.frequency.setValueAtTime(960, now);
  ping.frequency.exponentialRampToValueAtTime(180, now + 0.14);
  pingGain.gain.setValueAtTime(0.09, now);
  pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
  ping.connect(pingGain);
  pingGain.connect(sfx.master);
  ping.start(now);
  ping.stop(now + 0.18);

  playNoiseBurst(0.1, 0.07, 2600);
}

function playClusterPopSound() {
  if (!sfx.ready || sfx.muted) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(660, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);
  gain.gain.setValueAtTime(0.07, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  osc.connect(gain);
  gain.connect(sfx.master);
  osc.start(now);
  osc.stop(now + 0.08);
}

function playBossDeathSound() {
  if (!sfx.ready || sfx.muted) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(210, now);
  osc.frequency.exponentialRampToValueAtTime(36, now + BOSS_DEATH_SHAKE);
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + BOSS_DEATH_SHAKE);
  osc.connect(gain);
  gain.connect(sfx.master);
  osc.start(now);
  osc.stop(now + BOSS_DEATH_SHAKE + 0.02);
  playNoiseBurst(BOSS_DEATH_SHAKE, 0.16, 140);
}

function playClusterClearSound() {
  if (!sfx.ready || sfx.muted) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;
  [523, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + i * 0.07;
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.09, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
    osc.connect(gain);
    gain.connect(sfx.master);
    osc.start(start);
    osc.stop(start + 0.11);
  });
}

function attachUfoPulse(depth, gain) {
  try { depth.disconnect(); } catch (err) { /* pulse was already disconnected */ }
  depth.connect(gain.gain);
}

function muteUfoHum(gain, depth) {
  if (!sfx.ctx || !gain || !depth) return;
  const now = sfx.ctx.currentTime;
  try { depth.disconnect(); } catch (err) { /* pulse was already disconnected */ }
  depth.gain.cancelScheduledValues(now);
  depth.gain.setValueAtTime(0, now);
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0, now);
}

function startUfoPatrolHum() {
  if (!sfx.ready || sfx.muted || sfx.ufoPatrolActive) return;
  initUfoSoundNodes();
  stopUfoChaseHum();
  attachUfoPulse(sfx.ufoPatrolPulseDepth, sfx.ufoPatrolGain);
  const now = sfx.ctx.currentTime;
  sfx.ufoPatrolPulseDepth.gain.setValueAtTime(0.008, now);
  sfx.ufoPatrolGain.gain.cancelScheduledValues(now);
  sfx.ufoPatrolGain.gain.setValueAtTime(0, now);
  sfx.ufoPatrolGain.gain.linearRampToValueAtTime(UFO_PATROL_VOLUME, now + 0.3);
  sfx.ufoPatrolActive = true;
}

function stopUfoPatrolHum() {
  if (!sfx.ready || !sfx.ufoPatrolGain) return;
  muteUfoHum(sfx.ufoPatrolGain, sfx.ufoPatrolPulseDepth);
  sfx.ufoPatrolActive = false;
}

function startUfoChaseHum() {
  if (!sfx.ready || sfx.muted || sfx.ufoChaseActive) return;
  initUfoSoundNodes();
  stopUfoPatrolHum();
  attachUfoPulse(sfx.ufoChasePulseDepth, sfx.ufoChaseGain);
  const now = sfx.ctx.currentTime;
  sfx.ufoChasePulseDepth.gain.setValueAtTime(0.012, now);
  sfx.ufoChaseGain.gain.cancelScheduledValues(now);
  sfx.ufoChaseGain.gain.setValueAtTime(0, now);
  sfx.ufoChaseGain.gain.linearRampToValueAtTime(UFO_CHASE_VOLUME, now + 0.15);
  sfx.ufoChaseActive = true;
}

function stopUfoChaseHum() {
  if (!sfx.ready || !sfx.ufoChaseGain) return;
  muteUfoHum(sfx.ufoChaseGain, sfx.ufoChasePulseDepth);
  sfx.ufoChaseActive = false;
}

function setUfoAudioState(next) {
  if (ufoAudioState === next) return;
  if (ufoAudioState === "patrol") stopUfoPatrolHum();
  if (ufoAudioState === "chase") stopUfoChaseHum();
  ufoAudioState = next;
  if (next === "patrol") startUfoPatrolHum();
  else if (next === "chase") startUfoChaseHum();
}

function stopAllUfoSounds() {
  stopUfoPatrolHum();
  stopUfoChaseHum();
  ufoAudioState = "none";
}

function beginUfoChase(ufo) {
  if (ufo.chasing) return;
  ufo.chasing = true;
  setUfoAudioState("chase");
}

function onUfoRemoved() {
  if (ufos.length === 0) {
    stopAllUfoSounds();
    return;
  }
  if (ufos.some((ufo) => ufo.chasing)) setUfoAudioState("chase");
  else setUfoAudioState("patrol");
}

function silenceGameAudio() {
  if (!sfx.ready || !sfx.ctx) return;
  const now = sfx.ctx.currentTime;
  stopThrustSound();
  stopAllUfoSounds();
  sfx.thrustActive = false;
  sfx.ufoPatrolActive = false;
  sfx.ufoChaseActive = false;
  for (const node of [sfx.thrustGain, sfx.ufoPatrolGain, sfx.ufoChaseGain, sfx.ufoPatrolPulseDepth, sfx.ufoChasePulseDepth]) {
    if (!node) continue;
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(0, now);
  }
  if (sfx.ctx.state === "running") sfx.ctx.suspend();
}

function resumeAudio() {
  initAudio();
  const ctx = sfx.ctx;
  if (ctx.state !== "running") ctx.resume();
  if (sfx.primed) {
    if (waitingToStart && !sfx.muted) startTitleMusic();
    return;
  }
  const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  src.connect(gain);
  gain.connect(ctx.destination);
  try { src.start(0); } catch (err) {}
  sfx.primed = true;
  if (waitingToStart && !sfx.muted) startTitleMusic();
}

const TITLE_BPM = 92;
const TITLE_STEP = 60 / TITLE_BPM / 2;
const TITLE_BARS = 32;
const TITLE_LEAD = [
  [0, 69, 4],
  [4, 76, 2],
  [6, 72, 2],
  [8, 74, 4],
  [12, 71, 2],
  [14, 67, 2],
  [16, 69, 2],
  [18, 72, 2],
  [20, 76, 4],
  [24, 74, 2],
  [26, 72, 2],
  [28, 71, 2],
  [30, 69, 2],
];
const TITLE_BASS = [
  [0, 45, 8],
  [8, 41, 8],
  [16, 36, 4],
  [20, 43, 4],
  [24, 45, 8],
];

function startTitleMusic() {
  if (!waitingToStart || sfx.muted) return;
  initAudio();
  if (!sfx.titleGain || sfx.titleOn) return;
  sfx.titleOn = true;
  sfx.titleStep = 0;
  sfx.titleNext = sfx.ctx.currentTime + 0.06;
  const gain = sfx.titleGain.gain;
  const now = sfx.ctx.currentTime;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(0.0001, now);
  gain.linearRampToValueAtTime(0.42, now + 0.6);
}

function fadeTitleMusic() {
  if (!sfx.titleGain || !sfx.ctx) {
    sfx.titleOn = false;
    return;
  }
  sfx.titleOn = false;
  const gain = sfx.titleGain.gain;
  const now = sfx.ctx.currentTime;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(Math.max(0.0001, gain.value), now);
  gain.linearRampToValueAtTime(0.0001, now + 1.25);
}

function stopTitleMusic() {
  sfx.titleOn = false;
  if (!sfx.titleGain || !sfx.ctx) return;
  const gain = sfx.titleGain.gain;
  const now = sfx.ctx.currentTime;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(0.0001, now);
}

function scheduleTitleMusic() {
  if (!sfx.titleOn || !sfx.ctx || sfx.ctx.state !== "running") return;
  const horizon = sfx.ctx.currentTime + 0.25;
  while (sfx.titleNext < horizon) {
    const step = sfx.titleStep % TITLE_BARS;
    for (const note of TITLE_LEAD) {
      if (note[0] === step) playTitleTone(sfx.titleNext, note[1], note[2], "square", 0.09, 1100);
    }
    for (const note of TITLE_BASS) {
      if (note[0] === step) playTitleTone(sfx.titleNext, note[1], note[2], "triangle", 0.14, 0);
    }
    sfx.titleNext += TITLE_STEP;
    sfx.titleStep++;
  }
}

function playTitleTone(time, midi, steps, type, peak, lowpass) {
  const ctx = sfx.ctx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  const dur = Math.max(0.08, steps * TITLE_STEP);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.03);
  gain.gain.exponentialRampToValueAtTime(peak * 0.55, time + dur * 0.72);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  if (lowpass > 0) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lowpass;
    osc.connect(filter);
    filter.connect(gain);
  } else {
    osc.connect(gain);
  }
  gain.connect(sfx.titleGain);
  osc.start(time);
  osc.stop(time + dur + 0.02);
}

const BOSS_BPM = 132;
const BOSS_STEP = 60 / BOSS_BPM / 2;
const BOSS_BARS = 64;
const BOSS_LEAD = [
  [0, 62, 2], [2, 65, 2], [4, 69, 4],
  [12, 67, 2], [14, 65, 2],
  [16, 65, 2], [20, 72, 4],
  [24, 69, 2], [26, 67, 2], [28, 65, 4],
  [32, 74, 2], [36, 72, 2], [40, 69, 4],
  [44, 67, 2], [46, 65, 2],
  [48, 70, 4], [52, 69, 2], [54, 67, 2],
  [56, 65, 2], [58, 62, 2], [60, 62, 4],
];
const BOSS_BASS = [
  [0, 38, 1], [2, 38, 1], [4, 38, 1], [6, 50, 1],
  [8, 38, 1], [10, 38, 1], [12, 41, 1], [14, 38, 1],
  [16, 36, 1], [18, 36, 1], [20, 36, 1], [22, 43, 1],
  [24, 33, 1], [26, 33, 1], [28, 36, 1], [30, 38, 1],
  [32, 38, 1], [34, 38, 1], [36, 38, 1], [38, 50, 1],
  [40, 38, 1], [42, 41, 1], [44, 43, 1], [46, 38, 1],
  [48, 34, 1], [50, 34, 1], [52, 34, 1], [54, 41, 1],
  [56, 33, 1], [58, 36, 1], [60, 38, 1], [62, 38, 2],
];

function startBossMusic() {
  if (sfx.muted || !boss || boss.phase === "collapse") return;
  initAudio();
  if (!sfx.bossGain || sfx.bossOn) return;
  sfx.bossOn = true;
  sfx.bossStep = 0;
  sfx.bossNext = sfx.ctx.currentTime + 0.05;
  const gain = sfx.bossGain.gain;
  const now = sfx.ctx.currentTime;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(0.0001, now);
  gain.linearRampToValueAtTime(0.38, now + 0.5);
}

function fadeBossMusic() {
  if (!sfx.bossOn || !sfx.bossGain || !sfx.ctx) {
    sfx.bossOn = false;
    return;
  }
  sfx.bossOn = false;
  const gain = sfx.bossGain.gain;
  const now = sfx.ctx.currentTime;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(Math.max(0.0001, gain.value), now);
  gain.linearRampToValueAtTime(0.0001, now + 1);
}

function stopBossMusic() {
  sfx.bossOn = false;
  if (!sfx.bossGain || !sfx.ctx) return;
  const gain = sfx.bossGain.gain;
  const now = sfx.ctx.currentTime;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(0.0001, now);
}

function scheduleBossMusic() {
  if (!sfx.bossOn || !sfx.ctx || sfx.ctx.state !== "running") return;
  const horizon = sfx.ctx.currentTime + 0.25;
  while (sfx.bossNext < horizon) {
    const step = sfx.bossStep % BOSS_BARS;
    for (const note of BOSS_LEAD) {
      if (note[0] === step) playBossTone(sfx.bossNext, note[1], note[2], "square", 0.08, 1400);
    }
    for (const note of BOSS_BASS) {
      if (note[0] === step) playBossTone(sfx.bossNext, note[1], note[2], "triangle", 0.13, 0);
    }
    if (step % 2 === 0) playBossTick(sfx.bossNext);
    sfx.bossNext += BOSS_STEP;
    sfx.bossStep++;
  }
}

function playBossTone(time, midi, steps, type, peak, lowpass) {
  const ctx = sfx.ctx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  const dur = Math.max(0.05, steps * BOSS_STEP);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(peak * 0.5, time + dur * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  if (lowpass > 0) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lowpass;
    osc.connect(filter);
    filter.connect(gain);
  } else {
    osc.connect(gain);
  }
  gain.connect(sfx.bossGain);
  osc.start(time);
  osc.stop(time + dur + 0.02);
}

function playBossTick(time) {
  const ctx = sfx.ctx;
  const source = ctx.createBufferSource();
  source.buffer = sfx.noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1800;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.045, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(sfx.bossGain);
  source.start(time);
  source.stop(time + 0.06);
}

function setMuted(muted) {
  sfx.muted = muted;
  if (sfx.master) {
    sfx.master.gain.value = muted ? 0 : sfx.volume;
  }
  if (muted) {
    stopThrustSound();
    stopAllUfoSounds();
    stopTitleMusic(true);
    stopBossMusic();
  } else if (waitingToStart) {
    startTitleMusic();
  } else if (boss && boss.phase !== "collapse") {
    startBossMusic();
  }
  muteBtn.textContent = muted ? "SFX OFF" : "SFX ON";
}

function playNoiseBurst(duration, gainPeak, filterFreq) {
  if (!sfx.ready || sfx.muted) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = sfx.noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.8;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainPeak, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(sfx.master);
  source.start(now);
  source.stop(now + duration + 0.05);
}

function playLaserSound() {
  if (!sfx.ready || sfx.muted) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.07);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  osc.connect(gain);
  gain.connect(sfx.master);
  osc.start(now);
  osc.stop(now + 0.08);
}

function playRockHitSound() {
  if (!sfx.ready || sfx.muted) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  osc.connect(gain);
  gain.connect(sfx.master);
  osc.start(now);
  osc.stop(now + 0.06);
  playNoiseBurst(0.04, 0.1, 1800);
}

function playExplosionSound(size) {
  if (!sfx.ready || sfx.muted) return;
  const settings = {
    large:  { duration: 0.35, gain: 0.28, freq: 900 },
    medium: { duration: 0.22, gain: 0.18, freq: 1200 },
    small:  { duration: 0.12, gain: 0.1, freq: 1600 },
  };
  const config = settings[size] || settings.small;
  playNoiseBurst(config.duration, config.gain, config.freq);
}

const THRUST_HUM_VOLUME = 0.04;

function startThrustSound() {
  if (!sfx.ready || sfx.muted || sfx.thrustActive) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;
  sfx.thrustGain.gain.cancelScheduledValues(now);
  sfx.thrustGain.gain.setValueAtTime(0, now);
  sfx.thrustGain.gain.linearRampToValueAtTime(THRUST_HUM_VOLUME, now + 0.25);
  sfx.thrustActive = true;
}

function stopThrustSound() {
  if (!sfx.ready || !sfx.thrustActive) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;
  sfx.thrustGain.gain.cancelScheduledValues(now);
  sfx.thrustGain.gain.setValueAtTime(sfx.thrustGain.gain.value, now);
  sfx.thrustGain.gain.linearRampToValueAtTime(0, now + 0.2);
  sfx.thrustActive = false;
}

function playGameOverSound() {
  if (!sfx.ready || sfx.muted) return;
  stopThrustSound();
  const ctx = sfx.ctx;
  const now = ctx.currentTime;
  const notes = [440, 330, 220, 110];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + i * 0.14;
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.14, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
    osc.connect(gain);
    gain.connect(sfx.master);
    osc.start(start);
    osc.stop(start + 0.14);
  });
}

function playStartSound() {
  if (!sfx.ready || sfx.muted) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;
  const notes = [523, 659, 784];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + i * 0.07;
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.12, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
    osc.connect(gain);
    gain.connect(sfx.master);
    osc.start(start);
    osc.stop(start + 0.09);
  });
}

function playBombLaunchSound() {
  if (!sfx.ready || sfx.muted) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  osc.connect(gain);
  gain.connect(sfx.master);
  osc.start(now);
  osc.stop(now + 0.15);
}

function startBombFlightSound(bomb) {
  if (!sfx.ready || sfx.muted || bomb.flight) return;
  const ctx = sfx.ctx;
  const osc = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = 210;
  lfo.type = "sine";
  lfo.frequency.value = 14;
  lfoGain.gain.value = 28;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  filter.type = "bandpass";
  filter.frequency.value = 640;
  filter.Q.value = 3.2;
  gain.gain.value = 0.045;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(sfx.master);
  osc.start();
  lfo.start();
  bomb.flight = { osc, lfo, gain };
}

function stopBombFlightSound(bomb) {
  if (!bomb || !bomb.flight || !sfx.ctx) return;
  const now = sfx.ctx.currentTime;
  const gain = bomb.flight.gain.gain;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(Math.max(0.0001, gain.value), now);
  gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  try { bomb.flight.osc.stop(now + 0.06); } catch (err) {}
  try { bomb.flight.lfo.stop(now + 0.06); } catch (err) {}
  bomb.flight = null;
}

function stopAllBombFlightSounds() {
  for (const bomb of bombs) stopBombFlightSound(bomb);
}

function playShockwaveSound() {
  if (!sfx.ready || sfx.muted) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(gain);
  gain.connect(sfx.master);
  osc.start(now);
  osc.stop(now + 0.32);
  playNoiseBurst(0.2, 0.12, 500);
}

function playBombExplodeSound() {
  if (!sfx.ready || sfx.muted) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;

  const body = ctx.createOscillator();
  const bodyGain = ctx.createGain();
  body.type = "sawtooth";
  body.frequency.setValueAtTime(120, now);
  body.frequency.exponentialRampToValueAtTime(32, now + 0.42);
  bodyGain.gain.setValueAtTime(0.24, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
  body.connect(bodyGain);
  bodyGain.connect(sfx.master);
  body.start(now);
  body.stop(now + 0.5);

  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(70, now);
  sub.frequency.exponentialRampToValueAtTime(28, now + 0.55);
  subGain.gain.setValueAtTime(0.2, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
  sub.connect(subGain);
  subGain.connect(sfx.master);
  sub.start(now);
  sub.stop(now + 0.6);

  const noise = ctx.createBufferSource();
  noise.buffer = sfx.noiseBuffer;
  const rumble = ctx.createBiquadFilter();
  rumble.type = "lowpass";
  rumble.frequency.setValueAtTime(900, now);
  rumble.frequency.exponentialRampToValueAtTime(140, now + 0.45);
  const rumbleGain = ctx.createGain();
  rumbleGain.gain.setValueAtTime(0.32, now);
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  noise.connect(rumble);
  rumble.connect(rumbleGain);
  rumbleGain.connect(sfx.master);
  noise.start(now);
  noise.stop(now + 0.52);

  playNoiseBurst(0.08, 0.2, 1600);
}

function goToTitleScreen() {
  gameOver = false;
  waitingToStart = true;
  shipBreakActive = false;
  shipBreakTimer = 0;
  shipDebris = [];
  stopThrustSound();
  score = 0;
  scoreEl.textContent = "Score: 0";
  rocks = [];
  bullets = [];
  particles = [];
  shockwaves = [];
  resetUfoSpawning();
  resetArcadeRun(false);
  screenShake = 0;
  for (const key in keys) keys[key] = false;
  ship.x = W / 2;
  ship.y = H / 2;
  ship.angle = -Math.PI / 2;
  ship.vx = 0;
  ship.vy = 0;
  resetMouse();
  spawnInitialRocks(4);
  startScreen.classList.remove("hidden");
  if (sfx.ready && !sfx.muted) startTitleMusic();
}

function beginGame() {
  resumeAudio();
  fadeTitleMusic();
  if (sfx.muted) setMuted(true);
  waitingToStart = false;
  startScreen.classList.add("hidden");
  resetGame();
  const play = () => playStartSound();
  if (!sfx.ctx || sfx.ctx.state === "running") play();
  else {
    const pending = sfx.ctx.resume();
    if (pending && typeof pending.then === "function") pending.then(play).catch(() => {});
  }
}

// --- Input mode detection & responsive layout ---
function detectInputMode() {
  const isNarrow = window.innerWidth <= 768;
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  return isNarrow || hasTouch ? "mobile" : "desktop";
}

function isAppleDevice() {
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function apiFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function isFullscreen() {
  return apiFullscreen() || document.body.classList.contains("screen-expanded");
}

function enterAppleLayoutFullscreen() {
  document.body.classList.add("screen-expanded");
  resizeGame();
  syncFullscreenButton();
  const html = document.documentElement;
  html.classList.add("apple-scroll");
  window.scrollTo(0, 1);
  setTimeout(() => {
    window.scrollTo(0, 0);
    html.classList.remove("apple-scroll");
    resizeGame();
  }, 60);
}

function leaveFullscreen() {
  document.body.classList.remove("screen-expanded");
  document.documentElement.classList.remove("apple-scroll");
  window.scrollTo(0, 0);
  if (apiFullscreen()) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.webkitCancelFullScreen;
    if (exit) {
      try { exit.call(document); } catch (err) {}
    }
  }
  resizeGame();
  syncFullscreenButton();
}

function toggleFullscreen() {
  if (isFullscreen()) {
    leaveFullscreen();
    return;
  }
  const root = document.documentElement;
  const request = root.requestFullscreen || root.webkitRequestFullscreen || root.webkitRequestFullScreen;
  if (!request) {
    if (isAppleDevice()) enterAppleLayoutFullscreen();
    return;
  }
  try {
    const pending = request.call(root);
    if (pending && typeof pending.then === "function") {
      pending.then(() => {
        if (!apiFullscreen() && isAppleDevice()) enterAppleLayoutFullscreen();
        else syncFullscreenButton();
      }).catch(() => {
        if (isAppleDevice()) enterAppleLayoutFullscreen();
      });
      return;
    }
  } catch (err) {
    if (isAppleDevice()) enterAppleLayoutFullscreen();
    return;
  }
  if (isAppleDevice() && !apiFullscreen()) enterAppleLayoutFullscreen();
}

function syncFullscreenButton() {
  const btn = document.getElementById("fullscreen-btn");
  if (!btn) return;
  const on = isFullscreen();
  btn.textContent = on ? "EXIT FULL" : "FULL SCREEN";
  btn.setAttribute("aria-label", on ? "Exit full screen" : "Enter full screen");
}

function resizeGame() {
  inputMode = detectInputMode();
  document.body.classList.toggle("apple-device", isAppleDevice());
  document.body.classList.toggle("mobile-mode", inputMode === "mobile");
  document.body.classList.toggle("desktop-mode", inputMode === "desktop");

  const container = document.getElementById("game-container");
  const stage = document.getElementById("game-stage");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  if (inputMode === "mobile") {
    const portrait = window.innerHeight > window.innerWidth;
    document.body.classList.toggle("portrait-rotated", portrait);
    const displayW = portrait ? window.innerHeight : window.innerWidth;
    const displayH = portrait ? window.innerWidth : window.innerHeight;
    mobileControls.classList.remove("hidden");
    instructionsDesktop.classList.add("hidden");
    instructionsMobile.classList.remove("hidden");
    startPromptDesktop.classList.add("hidden");
    startPromptMobile.classList.remove("hidden");
    container.style.width = "";
    container.style.height = "";
    stage.style.width = "";
    stage.style.height = "";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width = Math.max(1, Math.round(displayW * dpr));
    canvas.height = Math.max(1, Math.round(displayH * dpr));
    H = DESKTOP_H;
    W = H * (displayW / displayH);
  } else {
    document.body.classList.remove("portrait-rotated");
    mobileControls.classList.add("hidden");
    instructionsDesktop.classList.remove("hidden");
    instructionsMobile.classList.add("hidden");
    startPromptDesktop.classList.remove("hidden");
    startPromptMobile.classList.add("hidden");

    const displayW = window.innerWidth;
    const displayH = window.innerHeight;
    container.style.width = displayW + "px";
    container.style.height = displayH + "px";
    stage.style.width = displayW + "px";
    stage.style.height = displayH + "px";
    canvas.style.width = displayW + "px";
    canvas.style.height = displayH + "px";
    canvas.width = Math.max(1, Math.round(displayW * dpr));
    canvas.height = Math.max(1, Math.round(displayH * dpr));
    H = DESKTOP_H;
    W = H * (canvas.width / canvas.height);
  }

  if (waitingToStart || gameOver) {
    ship.x = W / 2;
    ship.y = H / 2;
  }
  syncFullscreenButton();
  createStarfield();
}

function holdControl(el) {
  if (!el) return;
  clearTimeout(el._dimTimer);
  el.classList.add("pressed");
  el.classList.remove("held");
  el._dimTimer = setTimeout(() => el.classList.add("held"), 160);
}

function releaseControl(el) {
  if (!el) return;
  clearTimeout(el._dimTimer);
  el.classList.remove("pressed", "held");
}

function resetJoystick() {
  const base = document.getElementById("joystick-base");
  if (base && joystick.touchId != null && base.hasPointerCapture && base.hasPointerCapture(joystick.touchId)) {
    try { base.releasePointerCapture(joystick.touchId); } catch (err) {}
  }
  joystick.active = false;
  joystick.touchId = null;
  joystick.normX = 0;
  joystick.normY = 0;
  joystick.power = 0;
  joystick.angle = 0;
  releaseControl(base);
  const knob = document.getElementById("joystick-knob");
  if (knob) {
    knob.style.transform = "translate(0px, 0px)";
    knob.style.transition = "transform 0.08s ease-out";
  }
}

function shortestAngleDiff(from, to) {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function updateJoystickInput() {
  joystick.power = 0;
  joystick.angle = 0;

  if (inputMode !== "mobile" || !joystick.active) {
    joystick.normX = 0;
    joystick.normY = 0;
    return;
  }

  joystick.power = Math.min(1, Math.sqrt(
    joystick.normX * joystick.normX + joystick.normY * joystick.normY
  ));

  if (joystick.power > 0.001) {
    joystick.angle = Math.atan2(joystick.normY, joystick.normX);
  }
}

function updateMobileShip(dt) {
  let thrusting = false;
  const ts = timeScale(dt);

  if (!joystick.active || joystick.power <= JOYSTICK_DEAD_ZONE) {
    stopThrustSound();
    return thrusting;
  }

  const joyAngle = joystick.angle;
  const power = joystick.power;
  const angleDiff = shortestAngleDiff(ship.angle, joyAngle);

  // Smoothly rotate toward joystick direction (shortest path)
  const turnStep = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), MOBILE_MAX_TURN_SPEED * dt);
  ship.angle += turnStep;

  const facingAlign = Math.cos(shortestAngleDiff(ship.angle, joyAngle));
  const speed = shipSpeed();
  let braking = false;

  if (speed > 0.2) {
    const velAngle = Math.atan2(ship.vy, ship.vx);
    const velAlign = Math.cos(shortestAngleDiff(velAngle, joyAngle));

    // Joystick pushed opposite to drift direction — counter-thrust
    if (velAlign < -0.35) {
      const brakeStrength = power * Math.abs(velAlign) * ship.reversePower * ts;
      ship.vx -= Math.cos(velAngle) * brakeStrength;
      ship.vy -= Math.sin(velAngle) * brakeStrength;
      braking = true;
      thrusting = true;
      startThrustSound();
    }
  }

  if (!braking) {
    if (facingAlign > 0.6) {
      const thrustStrength = power * facingAlign * shipThrustPower() * ts;
      ship.vx += Math.cos(ship.angle) * thrustStrength;
      ship.vy += Math.sin(ship.angle) * thrustStrength;
      thrusting = true;
      startThrustSound();
    } else if (facingAlign > 0.15) {
      const thrustStrength = power * facingAlign * shipThrustPower() * ts * 0.35;
      ship.vx += Math.cos(ship.angle) * thrustStrength;
      ship.vy += Math.sin(ship.angle) * thrustStrength;
      thrusting = true;
      startThrustSound();
    }
  }

  return thrusting;
}

function resetMouse() {
  mouse.leftDown = false;
  mouse.tracking = false;
  mouse.power = 0;
  mouse.angle = 0;
}

function updateDesktopMouseInput() {
  mouse.power = 0;
  mouse.angle = 0;

  if (!mouse.tracking) return;

  const dx = mouse.x - ship.x;
  const dy = mouse.y - ship.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.max(40, Math.min(W, H) * MOUSE_MAX_DISTANCE_RATIO);
  mouse.power = Math.min(1, dist / maxDist);

  if (dist > 1) {
    mouse.angle = Math.atan2(dy, dx);
  }
}

function updateDesktopMouseShip(dt) {
  updateDesktopMouseInput();
  if (!mouse.tracking) return;
  const dx = mouse.x - ship.x;
  const dy = mouse.y - ship.y;
  if (dx * dx + dy * dy <= 1) return;
  const angleDiff = shortestAngleDiff(ship.angle, mouse.angle);
  const turnStep = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), MOBILE_MAX_TURN_SPEED * dt);
  ship.angle += turnStep;
}

function getCanvasMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function isDesktopGameplayActive() {
  return inputMode === "desktop" && !waitingToStart && !gameOver && !shipBreakActive;
}

function setupDesktopMouseControls() {
  canvas.addEventListener("mousemove", (e) => {
    if (!isDesktopGameplayActive()) return;
    const pos = getCanvasMousePos(e);
    mouse.x = pos.x;
    mouse.y = pos.y;
    mouse.tracking = true;
  });

  canvas.addEventListener("mouseleave", () => {
    mouse.tracking = false;
    mouse.leftDown = false;
    if (!keys.KeyW) stopThrustSound();
  });

  canvas.addEventListener("mousedown", (e) => {
    if (!isDesktopGameplayActive()) return;
    const pos = getCanvasMousePos(e);
    mouse.x = pos.x;
    mouse.y = pos.y;
    mouse.tracking = true;
    if (e.button === 0) {
      mouse.leftDown = true;
      shoot();
    } else if (e.button === 2) {
      e.preventDefault();
      activateShockwave();
    }
  });

  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  window.addEventListener("mouseup", (e) => {
    if (e.button === 0) mouse.leftDown = false;
  });
}

function setupMobileControls() {
  const base = document.getElementById("joystick-base");
  const knob = document.getElementById("joystick-knob");
  const fireBtn = document.getElementById("fire-btn");
  const waveBtn = document.getElementById("wave-btn");
  const bombBtn = document.getElementById("bomb-btn");

  function joystickCenter() {
    const rect = base.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      radius: Math.min(rect.width, rect.height) / 2,
    };
  }

  function touchOnJoystick(touch) {
    const center = joystickCenter();
    const dx = touch.clientX - center.x;
    const dy = touch.clientY - center.y;
    return dx * dx + dy * dy <= center.radius * center.radius;
  }

  function getJoystickMaxRadius() {
    const baseRect = base.getBoundingClientRect();
    const knobRect = knob.getBoundingClientRect();
    const baseRadius = Math.min(baseRect.width, baseRect.height) / 2;
    const knobRadius = Math.min(knobRect.width, knobRect.height) / 2;
    return Math.max(8, baseRadius - knobRadius - 2);
  }

  function moveKnob(touch) {
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = getJoystickMaxRadius();

    joystick.centerX = centerX;
    joystick.centerY = centerY;
    joystick.maxRadius = maxRadius;

    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    if (document.body.classList.contains("portrait-rotated")) {
      const screenX = dx;
      dx = dy;
      dy = -screenX;
    }
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    joystick.normX = dx / maxRadius;
    joystick.normY = dy / maxRadius;
    knob.style.transition = "none";
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  base.addEventListener("pointerdown", (e) => {
    if (waitingToStart || gameOver || joystick.active) return;
    if (!touchOnJoystick(e)) return;
    joystick.active = true;
    joystick.touchId = e.pointerId;
    holdControl(base);
    moveKnob(e);
    if (base.setPointerCapture) {
      try { base.setPointerCapture(e.pointerId); } catch (err) {}
    }
  });

  base.addEventListener("pointermove", (e) => {
    if (!joystick.active || e.pointerId !== joystick.touchId) return;
    moveKnob(e);
  });

  function endJoystick(e) {
    if (!joystick.active || e.pointerId !== joystick.touchId) return;
    resetJoystick();
    stopThrustSound();
  }

  base.addEventListener("pointerup", endJoystick);
  base.addEventListener("pointercancel", endJoystick);

  fireBtn.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    holdControl(fireBtn);
    if (waitingToStart || gameOver || shipBreakActive) return;
    mobileInput.fire = true;
    shoot();
    if (fireBtn.setPointerCapture) {
      try { fireBtn.setPointerCapture(e.pointerId); } catch (err) {}
    }
  });

  function endFire(e) {
    if (fireBtn.hasPointerCapture && fireBtn.hasPointerCapture(e.pointerId)) {
      try { fireBtn.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    releaseControl(fireBtn);
    mobileInput.fire = false;
  }

  fireBtn.addEventListener("pointerup", endFire);
  fireBtn.addEventListener("pointercancel", endFire);

  bombBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    holdControl(bombBtn);
    if (waitingToStart || gameOver || shipBreakActive) return;
    fireClusterBomb();
  }, { passive: false });
  bombBtn.addEventListener("touchend", () => releaseControl(bombBtn));
  bombBtn.addEventListener("touchcancel", () => releaseControl(bombBtn));

  waveBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    holdControl(waveBtn);
    if (waitingToStart || gameOver || shipBreakActive) return;
    activateShockwave();
  }, { passive: false });
  waveBtn.addEventListener("touchend", () => releaseControl(waveBtn));
  waveBtn.addEventListener("touchcancel", () => releaseControl(waveBtn));

  startScreen.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (waitingToStart && inputMode === "mobile") beginGame();
  }, { passive: false });

  canvas.addEventListener("touchstart", (e) => {
    if (gameOver && inputMode === "mobile") {
      e.preventDefault();
      goToTitleScreen();
    }
  }, { passive: false });
}

function isShockwaveReady() {
  return Date.now() >= shockwaveCooldownUntil;
}

function getWaveCooldownSeconds() {
  const remainingMs = shockwaveCooldownUntil - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

function syncControlFade() {
  const playing = inputMode === "mobile" && !waitingToStart && !gameOver && waveBanner <= 0;
  if (!playing) {
    controlsFadeAt = 0;
    document.body.classList.remove("controls-settled");
    return;
  }
  if (controlsFadeAt === 0) controlsFadeAt = performance.now() + 1000;
  document.body.classList.toggle("controls-settled", performance.now() >= controlsFadeAt);
}

function updateWaveUI() {
  const ready = isShockwaveReady();
  const secondsLeft = getWaveCooldownSeconds();

  if (waveStatusEl) {
    waveStatusEl.classList.toggle("on-cooldown", !ready);
    if (waveLabelEl) waveLabelEl.textContent = "SHOCKWAVE READY";
    if (waveCountdownEl) {
      waveCountdownEl.textContent = ready ? "" : String(secondsLeft);
    }
  }

  const waveBtn = document.getElementById("wave-btn");
  if (waveBtn) {
    waveBtn.classList.toggle("on-cooldown", !ready);
    if (inputMode === "mobile") {
      waveBtn.textContent = ready ? "WAVE" : String(secondsLeft);
    } else {
      waveBtn.textContent = "WAVE";
    }
  }
}

function dampShipOnShockwave() {
  const hx = Math.cos(ship.angle);
  const hy = Math.sin(ship.angle);
  const forward = ship.vx * hx + ship.vy * hy;
  const sideX = ship.vx - hx * forward;
  const sideY = ship.vy - hy * forward;
  ship.vx = hx * forward * 0.35 + sideX * 0.7;
  ship.vy = hy * forward * 0.35 + sideY * 0.7;
}

function activateShockwave() {
  if (!isShockwaveReady()) return false;
  if (waitingToStart || gameOver || shipBreakActive) return false;

  shockwaveCooldownUntil = Date.now() + SHOCKWAVE_COOLDOWN;
  shockwaveUsedThisWave = true;
  dampShipOnShockwave();
  shockwaves.push({
    x: ship.x,
    y: ship.y,
    radius: ship.radius * 0.5,
    maxRadius: ship.radius * 5,
    speed: SHOCKWAVE_EXPAND_SPEED,
    hitSet: new WeakSet(),
  });
  playShockwaveSound();
  updateWaveUI();
  return true;
}

function updateShockwaves(dt) {
  const ts = timeScale(dt);
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const wave = shockwaves[i];
    wave.radius += wave.speed * ts;
    if (wave.radius >= wave.maxRadius) {
      shockwaves.splice(i, 1);
    }
  }
  checkShockwaveRockCollisions(ts);
}

function checkShockwaveRockCollisions(ts) {
  for (const wave of shockwaves) {
    for (let j = rocks.length - 1; j >= 0; j--) {
      const rock = rocks[j];
      if (wave.hitSet.has(rock)) continue;

      const dist = distance(wave.x, wave.y, rock.x, rock.y);
      const ringTouchesRock =
        wave.radius >= dist - rock.radius &&
        wave.radius <= dist + rock.radius + wave.speed * ts;

      if (ringTouchesRock) {
        wave.hitSet.add(rock);
        breakRock(rock, j);
      }
    }

    for (let k = ufos.length - 1; k >= 0; k--) {
      const ufo = ufos[k];
      if (wave.hitSet.has(ufo)) continue;
      const dist = distance(wave.x, wave.y, ufo.x, ufo.y);
      const ringTouchesUfo =
        wave.radius >= dist - ufo.radius &&
        wave.radius <= dist + ufo.radius + wave.speed * ts;
      if (ringTouchesUfo) {
        wave.hitSet.add(ufo);
        destroyUfo(k);
      }
    }

    for (let c = clusters.length - 1; c >= 0; c--) {
      const cluster = clusters[c];
      for (let n = cluster.circles.length - 1; n >= 0; n--) {
        const circle = cluster.circles[n];
        if (wave.hitSet.has(circle)) continue;
        const pos = circleWorldPos(cluster, circle);
        const dist = distance(wave.x, wave.y, pos.x, pos.y);
        const touches =
          wave.radius >= dist - CLUSTER_CIRCLE_R &&
          wave.radius <= dist + CLUSTER_CIRCLE_R + wave.speed * ts;
        if (!touches) continue;
        wave.hitSet.add(circle);
        popClusterCircle(cluster, n, c);
        if (clusters[c] !== cluster) break;
      }
    }

    for (let s = clusterSeekers.length - 1; s >= 0; s--) {
      const seeker = clusterSeekers[s];
      if (wave.hitSet.has(seeker)) continue;
      const dist = distance(wave.x, wave.y, seeker.x, seeker.y);
      const touches = wave.radius >= dist - seeker.radius
        && wave.radius <= dist + seeker.radius + wave.speed * ts;
      if (!touches) continue;
      wave.hitSet.add(seeker);
      popClusterSeeker(s);
    }

    damageBossWithWave(wave, ts);
    damageBossBulletsWithWave(wave, ts);
  }
}

function drawShockwaves() {
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 7]);
  for (const wave of shockwaves) {
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

// --- Input ---
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") e.preventDefault();

  if (waitingToStart) {
    if (e.code === "Space") beginGame();
    return;
  }

  if (gameOver) {
    if (e.code === "Space") goToTitleScreen();
    return;
  }

  if (e.code === "Space" && !e.repeat && !shipBreakActive) {
    fireClusterBomb();
  }

  if (e.code === "KeyE" && !e.repeat && inputMode === "desktop") {
    activateShockwave();
    return;
  }

  keys[e.code] = true;
  if (e.code === "KeyW") startThrustSound();
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
  if (e.code === "KeyW" && !mouse.leftDown) stopThrustSound();
});

muteBtn.addEventListener("click", () => {
  if (!sfx.ready) {
    sfx.muted = !sfx.muted;
    muteBtn.textContent = sfx.muted ? "SFX OFF" : "SFX ON";
    return;
  }
  setMuted(!sfx.muted);
});
// --- Helpers ---
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function wrapPosition(obj) {
  if (obj.x < -obj.radius) obj.x = W + obj.radius;
  if (obj.x > W + obj.radius) obj.x = -obj.radius;
  if (obj.y < -obj.radius) obj.y = H + obj.radius;
  if (obj.y > H + obj.radius) obj.y = -obj.radius;
}

function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function shipSpeed() {
  return Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
}

function scoreValue(entry) {
  if (entry == null) return null;
  return typeof entry === "number" ? entry : entry.score;
}

function scoreWave(entry) {
  if (!entry || typeof entry !== "object") return null;
  return entry.wave;
}

function loadHighScores() {
  try {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    if (!saved) return [];
    const scores = JSON.parse(saved);
    return Array.isArray(scores) ? scores.slice(0, MAX_HIGH_SCORES) : [];
  } catch {
    return [];
  }
}

function saveHighScores() {
  localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(highScores));
}

function addHighScore(newScore, newWave) {
  highScores.push({ score: newScore, wave: newWave });
  highScores.sort((a, b) => scoreValue(b) - scoreValue(a));
  highScores = highScores.slice(0, MAX_HIGH_SCORES);
  saveHighScores();
}

function syncStageLabel() {
  if (stageLabelEl) {
    let text = boss ? "W" + wave + " BOSS" : "WAVE " + wave;
    if (!boss && wave % 5 !== 0) text += "\nBOSS IN " + (5 - (wave % 5));
    stageLabelEl.textContent = text;
  }
  if (debugLabelEl) debugLabelEl.textContent = bossDebug ? "Debug Mode" : "";
}

function syncScoreLabel() {
  const chain = scoreMultiplier > 1 ? "   x" + scoreMultiplier : "";
  const bestText = bestScore > 0 ? String(bestScore) : "----";
  scoreEl.textContent = "Score: " + score + chain + "\nBest: " + bestText;
}

function playTone(freq, duration, peak, type) {
  if (!sfx.ready || sfx.muted || !sfx.ctx) return;
  const ctx = sfx.ctx;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || "square";
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(peak, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(sfx.master);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function noteScoreMilestones(before) {
  if (!newBestShown && bestScore > 0 && before < bestScore && score >= bestScore) {
    newBestShown = true;
    scorePopups.push({ x: ship.x, y: ship.y - 28, text: "NEW BEST", life: 1.4 });
    playTone(880, 0.18, 0.08);
  }
  while (score >= nextLifeAt) {
    lifeScoreGap += 20000;
    nextLifeAt += lifeScoreGap;
    if (lives >= MAX_LIVES) continue;
    lives += 1;
    scorePopups.push({ x: ship.x, y: ship.y - 36, text: "EXTRA SHIP", life: 1.4 });
    playTone(660, 0.22, 0.1);
  }
}

function addScore(points, x, y, label) {
  const before = score;
  score += points;
  noteScoreMilestones(before);
  syncScoreLabel();
  scorePopups.push({
    x,
    y,
    text: label || ("+" + points),
    life: 1,
  });
}

function addChainScore(points, x, y) {
  if (chainTimer > 0 && scoreMultiplier < CHAIN_MAX) scoreMultiplier += 1;
  chainTimer = CHAIN_WINDOW;
  const gained = points * scoreMultiplier;
  addScore(gained, x, y, scoreMultiplier > 1 ? "+" + gained + "  x" + scoreMultiplier : "+" + gained);
  syncScoreLabel();
  hitStopTimer = 2 / 60;
  playTone(520 + scoreMultiplier * 40, 0.05, 0.04);
}

function syncPowerupLabel() {
  if (!powerupLabelEl) return;
  const lines = [];
  if (rapidTimer > 0) lines.push("RAPID " + Math.ceil(rapidTimer) + "s");
  if (tripleTimer > 0) lines.push("TRIPLE " + Math.ceil(tripleTimer) + "s");
  if (slowTimer > 0) lines.push("SLOW " + Math.ceil(slowTimer) + "s");
  if (shieldCharges > 1) lines.push("SHIELD 2");
  else if (shieldCharges > 0) lines.push("SHIELD");
  if (bombCharges > 0) lines.push(bombCharges > 1 ? "BOMB " + bombCharges : "BOMB");
  powerupLabelEl.textContent = lines.join("\n");
  const bombBtn = document.getElementById("bomb-btn");
  if (bombBtn) {
    bombBtn.disabled = bombCharges <= 0;
    bombBtn.textContent = "BOMB";
  }
}


function shipCanBeHit() {
  return !gameOver && !shipBreakActive && !waitingToStart && performance.now() >= invincibleUntil;
}

function nudgeShipFrom(ox, oy, minDist) {
  let dx = ship.x - ox;
  let dy = ship.y - oy;
  let dist = Math.hypot(dx, dy);
  if (dist >= minDist) return;
  if (dist < 0.01) {
    dx = Math.cos(ship.angle + Math.PI);
    dy = Math.sin(ship.angle + Math.PI);
    dist = 1;
  }
  const step = Math.min(minDist - dist, 2.2);
  const nx = dx / dist;
  const ny = dy / dist;
  ship.x += nx * step;
  ship.y += ny * step;
  const into = ship.vx * nx + ship.vy * ny;
  if (into < 0) {
    ship.vx -= nx * into;
    ship.vy -= ny * into;
  }
}

function hazardClearance(x, y) {
  let gap = Infinity;
  for (const rock of rocks) {
    gap = Math.min(gap, distance(x, y, rock.x, rock.y) - rock.radius);
  }
  for (const ufo of ufos) {
    gap = Math.min(gap, distance(x, y, ufo.x, ufo.y) - ufo.radius);
  }
  for (const cluster of clusters) {
    gap = Math.min(gap, distance(x, y, cluster.x, cluster.y) - cluster.radius);
  }
  if (boss) gap = Math.min(gap, distance(x, y, boss.x, boss.y) - boss.radius);
  for (const seeker of clusterSeekers) {
    gap = Math.min(gap, distance(x, y, seeker.x, seeker.y) - seeker.radius);
  }
  for (const shot of bossBullets) {
    gap = Math.min(gap, distance(x, y, shot.x, shot.y) - shot.radius);
  }
  return gap;
}

function findRespawnPosition() {
  const margin = 70;
  const needed = ship.radius + 90;
  const center = { x: W / 2, y: H / 2 };
  if (hazardClearance(center.x, center.y) >= needed) return center;

  let best = center;
  let bestGap = hazardClearance(center.x, center.y);
  for (let ring = 1; ring <= 7; ring++) {
    const radius = ring * 55;
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius * 0.72;
      if (x < margin || x > W - margin || y < margin || y > H - margin) continue;
      const gap = hazardClearance(x, y);
      if (gap >= needed) return { x, y };
      if (gap > bestGap) {
        bestGap = gap;
        best = { x, y };
      }
    }
  }
  return best;
}

function separateShipFromHazards() {
  for (let pass = 0; pass < 3; pass++) {
    for (const rock of rocks) {
      nudgeShipFrom(rock.x, rock.y, rock.radius + ship.radius - 4);
    }
    for (const ufo of ufos) {
      nudgeShipFrom(ufo.x, ufo.y, ufo.radius + ship.radius - 4);
    }
    for (const cluster of clusters) {
      if (cluster.grace > 0) continue;
      for (const circle of cluster.circles) {
        const pos = circleWorldPos(cluster, circle);
        nudgeShipFrom(pos.x, pos.y, CLUSTER_CIRCLE_R + ship.radius - 2);
      }
    }
    for (const seeker of clusterSeekers) {
      nudgeShipFrom(seeker.x, seeker.y, seeker.radius + ship.radius - 2);
    }
    if (boss) {
      for (const circle of boss.circles) {
        if (!bossCircleReady(circle)) continue;
        const pos = circleWorldPos(boss, circle);
        nudgeShipFrom(pos.x, pos.y, CLUSTER_CIRCLE_R + ship.radius - 2);
      }
    }
  }
  wrapPosition(ship);
}

function shipThrustPower() {
  return ship.thrustPower * (slowTimer > 0 ? 0.58 : 1);
}

function shipMaxSpeed() {
  return ship.maxSpeed * (slowTimer > 0 ? 0.62 : 1);
}

function applyDesktopMoveKeys(ts) {
  let forwardInput = 0;
  let strafeInput = 0;
  if (keys.KeyW) forwardInput += 1;
  if (keys.KeyS) forwardInput -= 1;
  if (keys.KeyA) strafeInput -= 1;
  if (keys.KeyD) strafeInput += 1;

  const mag = Math.hypot(forwardInput, strafeInput);
  if (mag === 0) {
    stopThrustSound();
    return false;
  }

  forwardInput /= mag;
  strafeInput /= mag;

  const noseX = Math.cos(ship.angle);
  const noseY = Math.sin(ship.angle);
  const rightX = Math.cos(ship.angle + Math.PI / 2);
  const rightY = Math.sin(ship.angle + Math.PI / 2);
  const forward = shipThrustPower();
  const reverse = forward * 0.45;
  const slide = forward * 0.7;
  const along = forwardInput > 0 ? forwardInput * forward : forwardInput * reverse;

  ship.vx += (noseX * along + rightX * strafeInput * slide) * ts;
  ship.vy += (noseY * along + rightY * strafeInput * slide) * ts;
  startThrustSound();
  return true;
}

function clearRunHazards() {
  rocks = [];
  bullets = [];
  shockwaves = [];
  clusters = [];
  clusterSeekers = [];
  pickups = [];
  stopAllBombFlightSounds();
  bombs = [];
  bombWaves = [];
  boss = null;
  bossPulses = [];
  bossBullets = [];
  stopBossMusic();
  ufos = [];
  ufoSpawnTimer = 0;
  ufoNextSpawn = rand(UFO_SPAWN_MIN, UFO_SPAWN_MAX);
  stopAllUfoSounds();
}

function hurtShip() {
  if (!shipCanBeHit()) return;

  hitFlash = 1;
  screenShake = 12;
  addExplosionParticles(ship.x, ship.y, 12, "#fff");
  addDestroyBurst(ship.x, ship.y, "#fff", 1.3);

  if (shieldCharges > 0) {
    shieldCharges -= 1;
    scorePopups.push({ x: ship.x, y: ship.y - 16, text: "SHIELD", life: 1 });
    invincibleUntil = performance.now() + 700;
    return;
  }

  if (!bossDebug) lives -= 1;
  scoreMultiplier = 1;
  chainTimer = 0;
  syncScoreLabel();
  createShipDebris();
  shipBreakActive = true;
  shipBreakTimer = 0;
  ship.vx = 0;
  ship.vy = 0;
  pendingRespawn = bossDebug || lives > 0;

  if (!pendingRespawn) {
    playGameOverSound();
    clearRunHazards();
  }
}

function triggerGameOver() {
  hurtShip();
}

// --- Rock creation ---
function createRockShape(sides, radius) {
  const points = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const r = radius * rand(0.7, 1.0);
    points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  return points;
}

function randomVelocity(speedMin, speedMax) {
  const angle = rand(0, Math.PI * 2);
  const speed = rand(speedMin, speedMax);
  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  };
}

function createRock(x, y, size, vx, vy) {
  const config = ROCK_SIZES[size];
  let rockVx = vx;
  let rockVy = vy;

  if (rockVx === undefined || rockVy === undefined) {
    const vel = randomVelocity(0.2, 0.5);
    rockVx = vel.vx;
    rockVy = vel.vy;
  }

  const speedScale = rockSpeedScale();
  rockVx *= speedScale;
  rockVy *= speedScale;

  return {
    x,
    y,
    size,
    radius: config.radius,
    score: config.score,
    points: createRockShape(config.sides, config.radius),
    vx: rockVx,
    vy: rockVy,
    spin: rand(-0.03, 0.03),
    angle: rand(0, Math.PI * 2),
  };
}

const ROCK_BOUNCE_DRAG = 0.01;

function rockSpeed(rock) {
  return Math.sqrt(rock.vx * rock.vx + rock.vy * rock.vy);
}

function reduceRockSpeed(rock, amount) {
  const speed = rockSpeed(rock);
  if (speed === 0) return;
  const newSpeed = Math.max(0, speed - amount);
  rock.vx = (rock.vx / speed) * newSpeed;
  rock.vy = (rock.vy / speed) * newSpeed;
}

function bounceTwoBodies(a, massA, b, massB, dragA, dragB) {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  let dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = a.radius + b.radius;

  if (dist >= minDist) return false;

  if (dist === 0) {
    const angle = rand(0, Math.PI * 2);
    dx = Math.cos(angle);
    dy = Math.sin(angle);
    dist = 1;
  }

  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  a.x -= nx * overlap * 0.5;
  a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.y += ny * overlap * 0.5;

  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const velAlongNormal = rvx * nx + rvy * ny;

  if (velAlongNormal > 0) return true;

  const impulse = (2 * velAlongNormal) / (massA + massB);
  a.vx += impulse * massB * nx;
  a.vy += impulse * massB * ny;
  b.vx -= impulse * massA * nx;
  b.vy -= impulse * massA * ny;

  if (dragA) reduceRockSpeed(a, dragA);
  if (dragB) reduceRockSpeed(b, dragB);
  return true;
}

function resolveRockCollisions() {
  for (let i = 0; i < rocks.length; i++) {
    for (let j = i + 1; j < rocks.length; j++) {
      const a = rocks[i];
      const b = rocks[j];
      bounceTwoBodies(
        a, a.radius * a.radius,
        b, b.radius * b.radius,
        ROCK_BOUNCE_DRAG, ROCK_BOUNCE_DRAG
      );
    }
  }
}

function pushRockOutOf(rock, other, otherRadius) {
  let dx = rock.x - other.x;
  let dy = rock.y - other.y;
  let dist = Math.hypot(dx, dy);
  const minDist = rock.radius + otherRadius;
  if (dist >= minDist) return;
  if (dist < 0.01) {
    const angle = rand(0, Math.PI * 2);
    dx = Math.cos(angle);
    dy = Math.sin(angle);
    dist = 1;
  }
  const nx = dx / dist;
  const ny = dy / dist;
  rock.x += nx * (minDist - dist);
  rock.y += ny * (minDist - dist);
  const into = rock.vx * nx + rock.vy * ny;
  if (into < 0) {
    rock.vx -= nx * into;
    rock.vy -= ny * into;
  }
}

function bodyVelocity(body) {
  if (body.kind === "seeker") {
    return { vx: body.vx + body.pushX, vy: body.vy + body.pushY };
  }
  if (body.pushX != null) {
    let speed = 0;
    if (body.kind === "boss") {
      if (body.phase === "chase") speed = BOSS_SPEED;
    } else if (!(body.kind === "cluster2" && body.phase === "pulse")) {
      speed = clusterSpeed(body);
    }
    const angle = speed > 0 ? Math.atan2(ship.y - body.y, ship.x - body.x) : 0;
    return {
      vx: Math.cos(angle) * speed + body.pushX,
      vy: Math.sin(angle) * speed + body.pushY,
    };
  }
  return { vx: body.vx || 0, vy: body.vy || 0 };
}

function addBodyVelocity(body, dvx, dvy) {
  if (body.kind === "seeker" || body.pushX != null) {
    body.pushX += dvx;
    body.pushY += dvy;
    return;
  }
  body.vx = (body.vx || 0) + dvx;
  body.vy = (body.vy || 0) + dvy;
}

function bounceBodies(a, aRadius, b, bRadius) {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  let dist = Math.hypot(dx, dy);
  const minDist = aRadius + bRadius;
  if (dist >= minDist) return;
  if (dist < 0.01) {
    const angle = rand(0, Math.PI * 2);
    dx = Math.cos(angle);
    dy = Math.sin(angle);
    dist = 1;
  }
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  a.x -= nx * overlap * 0.5;
  a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.y += ny * overlap * 0.5;

  const va = bodyVelocity(a);
  const vb = bodyVelocity(b);
  const velAlongNormal = (vb.vx - va.vx) * nx + (vb.vy - va.vy) * ny;
  if (velAlongNormal > 0) return;

  const massA = aRadius * aRadius;
  const massB = bRadius * bRadius;
  const impulse = (2 * velAlongNormal) / (massA + massB);
  addBodyVelocity(a, impulse * massB * nx, impulse * massB * ny);
  addBodyVelocity(b, -impulse * massA * nx, -impulse * massA * ny);
  if (a.points) reduceRockSpeed(a, ROCK_BOUNCE_DRAG);
  if (b.points) reduceRockSpeed(b, ROCK_BOUNCE_DRAG);
}

function pushOutOf(body, bodyRadius, other, otherRadius) {
  let dx = body.x - other.x;
  let dy = body.y - other.y;
  let dist = Math.hypot(dx, dy);
  const minDist = bodyRadius + otherRadius;
  if (dist >= minDist) return;
  if (dist < 0.01) {
    const angle = rand(0, Math.PI * 2);
    dx = Math.cos(angle);
    dy = Math.sin(angle);
    dist = 1;
  }
  const nx = dx / dist;
  const ny = dy / dist;
  body.x += nx * (minDist - dist);
  body.y += ny * (minDist - dist);
  const vel = bodyVelocity(body);
  const into = vel.vx * nx + vel.vy * ny;
  if (into < 0) addBodyVelocity(body, -nx * into, -ny * into);
}

function separateRocksFromHazards() {
  for (let i = clusterSeekers.length - 1; i >= 0; i--) {
    const seeker = clusterSeekers[i];
    for (const rock of rocks) {
      if (distance(seeker.x, seeker.y, rock.x, rock.y) >= rock.radius + seeker.radius) continue;
      popClusterSeeker(i);
      break;
    }
  }
  for (let pass = 0; pass < 4; pass++) {
    for (const ufo of ufos) {
      for (const rock of rocks) pushRockOutOf(rock, ufo, ufo.radius);
      for (const cluster of clusters) pushOutOf(cluster, cluster.radius, ufo, ufo.radius);
      for (const seeker of clusterSeekers) pushOutOf(seeker, seeker.radius, ufo, ufo.radius);
      if (boss) pushOutOf(boss, boss.radius, ufo, ufo.radius);
    }
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      for (let j = i + 1; j < clusters.length; j++) {
        const other = clusters[j];
        bounceBodies(cluster, cluster.radius, other, other.radius);
      }
      for (const rock of rocks) bounceBodies(cluster, cluster.radius, rock, rock.radius);
      for (const seeker of clusterSeekers) bounceBodies(cluster, cluster.radius, seeker, seeker.radius);
      if (boss) bounceBodies(cluster, cluster.radius, boss, boss.radius);
    }
    if (boss) {
      for (const rock of rocks) bounceBodies(boss, boss.radius, rock, rock.radius);
      for (const seeker of clusterSeekers) bounceBodies(boss, boss.radius, seeker, seeker.radius);
    }
    for (let i = 0; i < clusterSeekers.length; i++) {
      const seeker = clusterSeekers[i];
      for (let j = i + 1; j < clusterSeekers.length; j++) {
        bounceBodies(seeker, seeker.radius, clusterSeekers[j], clusterSeekers[j].radius);
      }
    }
    resolveRockCollisions();
  }
  for (const rock of rocks) wrapPosition(rock);
  for (const cluster of clusters) wrapPosition(cluster);
  for (const seeker of clusterSeekers) wrapPosition(seeker);
  if (boss) wrapPosition(boss);
}

function rockSpeedScale() {
  const steps = Math.max(0, wave - 4);
  return Math.min(1.65, 1 + steps * 0.07 + rockSpeedBonus);
}

function spawnRocks(count) {
  const margin = Math.max(20, Math.min(50, W * 0.08));
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(margin, W - margin);
      y = rand(margin, H - margin);
    } while (distance(x, y, ship.x, ship.y) < 150);
    const rock = createRock(x, y, "large");
    if (wave <= 1 || wave === 4) {
      rock.hidesCluster = false;
      rock.hidesCluster2 = false;
    } else if (wave === 2 && i === 0) {
      rock.hidesCluster = true;
    } else if (wave === 3 && i === 0) {
      rock.hidesCluster2 = true;
    } else if (wave >= 5) {
      const roll = Math.random();
      if (roll < CLUSTER2_SPAWN_CHANCE) rock.hidesCluster2 = true;
      else rock.hidesCluster = roll < CLUSTER2_SPAWN_CHANCE + CLUSTER_SPAWN_CHANCE;
    }
    for (const blast of bombWaves) blast.hitSet.add(rock);
    rocks.push(rock);
  }
}

function spawnInitialRocks(count) {
  rocks = [];
  rockCount = count;
  spawnRocks(count);
}

function awardWaveClear() {
  addScore(WAVE_CLEAR_BONUS * wave, W / 2, H * 0.4);
  if (!shockwaveUsedThisWave) {
    addScore(CLEAN_WAVE_BONUS, W / 2, H * 0.4 + 26, "CLEAN +" + CLEAN_WAVE_BONUS);
  }
}

function beginWaveIntro(title, sub, spawnKind) {
  waveBannerText = title;
  waveBannerSub = sub || "";
  waveBannerDuration = 2.2;
  waveBanner = waveBannerDuration;
  pendingWaveEnemies = spawnKind;
}

function releasePendingWave() {
  const kind = pendingWaveEnemies;
  pendingWaveEnemies = null;
  if (kind === "rocks") {
    spawnRocks(rockCount);
    if (wave === 4 && ufos.length === 0) spawnUfo();
  } else if (kind === "boss") spawnBoss();
  else if (kind === "afterBoss") spawnNextWave();
}

function spawnNextWave() {
  if (pendingWaveEnemies) return;
  const clearedBossWave = wave % 5 === 0 && !boss;
  awardWaveClear();
  if (clearedBossWave) {
    rockSpeedBonus = Math.min(0.4, rockSpeedBonus + 0.02);
  }
  wave += 1;
  rockCount += 1;
  shockwaveUsedThisWave = false;
  const bossWave = wave % 5 === 0;
  beginWaveIntro(
    bossWave ? "WAVE " + wave + " . BOSS" : "WAVE " + wave,
    bossWave ? bossNameForWave(wave) : "",
    bossWave ? "boss" : "rocks"
  );
  syncStageLabel();
}

function resetArcadeRun(showBanner) {
  lives = START_LIVES;
  pendingRespawn = false;
  invincibleUntil = 0;
  hitFlash = 0;
  wave = 1;
  shockwaveUsedThisWave = false;
  waveBannerText = "WAVE 1";
  waveBannerSub = "";
  waveBanner = 0;
  waveBannerDuration = 1;
  pendingWaveEnemies = null;
  scorePopups = [];
  clusters = [];
  clusterSeekers = [];
  pickups = [];
  stopAllBombFlightSounds();
  bombs = [];
  bombWaves = [];
  boss = null;
  bossPulses = [];
  bossBullets = [];
  stopBossMusic();
  rockSpeedBonus = 0;
  scoreMultiplier = 1;
  chainTimer = 0;
  nextLifeAt = LIFE_SCORE_STEP;
  lifeScoreGap = LIFE_SCORE_STEP;
  newBestShown = false;
  bestScore = scoreValue(highScores[0]) || 0;
  hitStopTimer = 0;
  lastLifePulse = 0;
  syncScoreLabel();
  rapidTimer = 0;
  tripleTimer = 0;
  slowTimer = 0;
  shieldCharges = 0;
  bombCharges = 0;
  bossDebug = false;
  syncStageLabel();
  syncPowerupLabel();
}

function ufoSpawnDelay() {
  const steps = Math.min(6, Math.max(0, wave - 4));
  return {
    min: Math.max(6, UFO_SPAWN_MIN - steps),
    max: Math.max(14, UFO_SPAWN_MAX - steps * 1.5),
  };
}

function maxUfos() {
  return wave >= 5 ? 2 : 1;
}

// --- UFO enemy ---
function resetUfoSpawning() {
  stopAllUfoSounds();
  ufos = [];
  ufoSpawnTimer = 0;
  ufoNextSpawn = rand(UFO_SPAWN_MIN, UFO_SPAWN_MAX);
}

function spawnUfo(force = false) {
  if (!force && ufos.length >= maxUfos()) return;
  if (force) {
    stopAllUfoSounds();
    ufos.length = 0;
  }

  const side = Math.floor(rand(0, 4));
  const pad = UFO_RADIUS - 1;
  let x, y, vx, vy;

  // Enter from a random edge and cruise straight toward the opposite side.
  if (side === 0) {
    x = rand(pad, W - pad);
    y = -pad;
    vx = 0;
    vy = UFO_CRUISE_SPEED;
  } else if (side === 1) {
    x = W + pad;
    y = rand(pad, H - pad);
    vx = -UFO_CRUISE_SPEED;
    vy = 0;
  } else if (side === 2) {
    x = rand(pad, W - pad);
    y = H + pad;
    vx = 0;
    vy = -UFO_CRUISE_SPEED;
  } else {
    x = -pad;
    y = rand(pad, H - pad);
    vx = UFO_CRUISE_SPEED;
    vy = 0;
  }

  ufos.push({
    x,
    y,
    vx,
    vy,
    cruiseVx: vx,
    cruiseVy: vy,
    radius: UFO_RADIUS,
    visualRadius: UFO_VISUAL_RADIUS,
    speed: UFO_SPEED,
    chasing: false,
    bobPhase: rand(0, Math.PI * 2),
  });

  playUfoAppearSfx();
  if (!ufos.some((ufo) => ufo.chasing)) setUfoAudioState("patrol");
}

function updateUfoSpawning(dt) {
  if (wave < 5) return;
  if (ufos.length >= maxUfos()) return;
  ufoSpawnTimer += dt;
  if (ufoSpawnTimer >= ufoNextSpawn) {
    ufoSpawnTimer = 0;
    const delay = ufoSpawnDelay();
    ufoNextSpawn = rand(delay.min, delay.max);
    spawnUfo();
  }
}

function normalizeUfoSpeed(ufo) {
  const sp = Math.sqrt(ufo.vx * ufo.vx + ufo.vy * ufo.vy);
  if (sp === 0) return;
  ufo.vx = (ufo.vx / sp) * ufo.speed;
  ufo.vy = (ufo.vy / sp) * ufo.speed;
}

function steerUfoAroundHazards(ufo) {
  let ax = 0;
  let ay = 0;

  for (const rock of rocks) {
    const dx = ufo.x - rock.x;
    const dy = ufo.y - rock.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const limit = rock.radius + ufo.radius + 48;
    if (dist >= limit) continue;
    const strength = (limit - dist) / limit;
    ax += (dx / dist) * strength;
    ay += (dy / dist) * strength;
  }

  for (const cluster of clusters) {
    const dx = ufo.x - cluster.x;
    const dy = ufo.y - cluster.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const limit = cluster.radius + ufo.radius + 40;
    if (dist >= limit) continue;
    const strength = (limit - dist) / limit;
    ax += (dx / dist) * strength * 1.25;
    ay += (dy / dist) * strength * 1.25;
  }

  if (ax === 0 && ay === 0) return;

  const cruise = Math.sqrt(ufo.cruiseVx * ufo.cruiseVx + ufo.cruiseVy * ufo.cruiseVy) || UFO_CRUISE_SPEED;
  const keepSpeed = ufo.chasing ? ufo.speed : cruise;
  ufo.vx += ax * 2.2;
  ufo.vy += ay * 2.2;
  const sp = Math.sqrt(ufo.vx * ufo.vx + ufo.vy * ufo.vy);
  if (sp === 0) return;
  ufo.vx = (ufo.vx / sp) * keepSpeed;
  ufo.vy = (ufo.vy / sp) * keepSpeed;
}

function isUfoOffScreen(ufo) {
  return ufo.x < -ufo.radius || ufo.x > W + ufo.radius || ufo.y < -ufo.radius || ufo.y > H + ufo.radius;
}

function resolveUfoRockCollisions() {
  const ufoMass = UFO_RADIUS * UFO_RADIUS * 4;

  for (const ufo of ufos) {
    for (const rock of rocks) {
      const hit = bounceTwoBodies(
        rock, rock.radius * rock.radius,
        ufo, ufoMass,
        ROCK_BOUNCE_DRAG, 0
      );
      if (hit && ufo.chasing) {
        normalizeUfoSpeed(ufo);
      }
    }
  }
}

function updateUfos(dt) {
  const ts = timeScale(dt);

  for (let i = ufos.length - 1; i >= 0; i--) {
    const ufo = ufos[i];
    const distToShip = distance(ufo.x, ufo.y, ship.x, ship.y);

    // Latch onto the hero once they enter detection range.
    if (distToShip < UFO_CHASE_RANGE) {
      beginUfoChase(ufo);
    }

    if (ufo.chasing) {
      const angle = Math.atan2(ship.y - ufo.y, ship.x - ufo.x);
      ufo.vx = Math.cos(angle) * ufo.speed;
      ufo.vy = Math.sin(angle) * ufo.speed;
    } else {
      // Far from the hero: keep cruising across the play area.
      ufo.vx = ufo.cruiseVx;
      ufo.vy = ufo.cruiseVy;
    }

    steerUfoAroundHazards(ufo);

    ufo.x += ufo.vx * ts;
    ufo.y += ufo.vy * ts;

    // Weave across the flight path like a cartoon saucer.
    const travel = Math.atan2(ufo.vy, ufo.vx);
    const side = travel + Math.PI / 2;
    const wave = Math.cos(performance.now() * 0.004 + (ufo.bobPhase || 0)) * 0.9;
    ufo.x += Math.cos(side) * wave * ts;
    ufo.y += Math.sin(side) * wave * ts;

    if (Math.random() < Math.min(0.9, 0.55 * ts)) addUfoSmoke(ufo);

    if (isUfoOffScreen(ufo)) {
      ufos.splice(i, 1);
      onUfoRemoved();
    }
  }

  resolveUfoRockCollisions();
}

function destroyUfo(index, chain) {
  const ufo = ufos[index];
  if (chain) addChainScore(UFO_SCORE, ufo.x, ufo.y);
  else addScore(UFO_SCORE, ufo.x, ufo.y);
  addExplosionParticles(ufo.x, ufo.y, 22, "#33ff66");
  addDestroyBurst(ufo.x, ufo.y, "#33ff66", 1.6);
  playUfoDestroyedSound();
  screenShake = 16;
  ufos.splice(index, 1);
  onUfoRemoved();
}

function getUfoDrawScale(ufo) {
  if (ufo.visualRadius != null) return ufo.visualRadius;
  if (ufo.size != null) return ufo.size;
  if (ufo.radius != null) return ufo.radius;
  return 32;
}

function drawUFO(renderCtx, ufo) {
  const s = (ufo.visualRadius || Math.max(getUfoDrawScale(ufo), 32)) * 0.5;

  renderCtx.save();
  renderCtx.translate(ufo.x, ufo.y);

  const bob = Math.sin(performance.now() * 0.004 + (ufo.bobPhase || 0)) * 1.2;
  renderCtx.translate(0, bob);

  renderCtx.strokeStyle = "#33ff66";
  renderCtx.lineWidth = 2;
  renderCtx.lineCap = "round";
  renderCtx.lineJoin = "round";

  const rx = s * 1.25;
  const ry = s * 0.28;
  const domeR = rx * 0.34;
  const domeBaseY = -ry * 0.35;

  // Pointed saucer: top curve and bottom curve
  renderCtx.beginPath();
  renderCtx.moveTo(-rx, 0);
  renderCtx.quadraticCurveTo(0, -ry, rx, 0);
  renderCtx.stroke();
  renderCtx.beginPath();
  renderCtx.moveTo(-rx, 0);
  renderCtx.quadraticCurveTo(0, ry * 0.72, rx, 0);
  renderCtx.stroke();

  // Dome sitting on the upper hull
  renderCtx.beginPath();
  renderCtx.arc(0, domeBaseY, domeR, Math.PI, 0);
  renderCtx.stroke();

  // Three windows inside the dome
  [-0.46, 0, 0.46].forEach((off) => {
    renderCtx.beginPath();
    renderCtx.ellipse(off * domeR, domeBaseY - domeR * 0.42, s * 0.055, s * 0.075, 0, 0, Math.PI * 2);
    renderCtx.stroke();
  });

  // Two landing legs with oval feet
  [-0.42, 0.42].forEach((off) => {
    const x0 = off * rx;
    const y0 = ry * 0.18;
    const x1 = x0 + Math.sign(off) * s * 0.06;
    const y1 = y0 + s * 0.32;
    renderCtx.beginPath();
    renderCtx.moveTo(x0, y0);
    renderCtx.lineTo(x1, y1);
    renderCtx.stroke();
    renderCtx.beginPath();
    renderCtx.ellipse(x1, y1 + s * 0.07, s * 0.04, s * 0.075, 0, 0, Math.PI * 2);
    renderCtx.stroke();
  });

  renderCtx.restore();
}

function drawUfos() {
  for (const ufo of ufos) {
    drawUFO(ctx, ufo);
  }
}

// --- Particles ---
function addBombSmoke(bomb) {
  const behind = bomb.angle + Math.PI;
  const spread = rand(-0.25, 0.25);
  const dist = rand(5, 9);
  particles.push({
    x: bomb.x + Math.cos(behind + spread) * dist,
    y: bomb.y + Math.sin(behind + spread) * dist,
    vx: Math.cos(behind) * rand(0.02, 0.08),
    vy: Math.sin(behind) * rand(0.02, 0.08),
    life: 1,
    decay: rand(0.012, 0.02),
    size: rand(1.3, 2.1),
    type: "bombSmoke",
  });
}

function addUfoSmoke(ufo) {
  const travel = Math.atan2(ufo.vy, ufo.vx);
  const behind = travel + Math.PI + rand(-0.4, 0.4);
  const dist = ufo.radius + rand(14, 24);

  particles.push({
    x: ufo.x + Math.cos(behind) * dist,
    y: ufo.y + Math.sin(behind) * dist,
    vx: Math.cos(behind) * rand(0.15, 0.5),
    vy: Math.sin(behind) * rand(0.15, 0.5),
    life: 1,
    decay: rand(0.025, 0.05),
    size: rand(1, 2.2),
    type: "smoke",
  });
}

function addSmokeParticle() {
  const speed = shipSpeed();
  const behindAngle = ship.angle + Math.PI + rand(-0.4, 0.4);
  const offsetDist = ship.radius + rand(2, 8);

  particles.push({
    x: ship.x + Math.cos(behindAngle) * offsetDist,
    y: ship.y + Math.sin(behindAngle) * offsetDist,
    vx: Math.cos(behindAngle) * rand(0.2, 0.8) - ship.vx * 0.1,
    vy: Math.sin(behindAngle) * rand(0.2, 0.8) - ship.vy * 0.1,
    life: 1,
    decay: rand(0.02, 0.04),
    size: rand(1, 2.5),
    type: "smoke",
  });
}

function addExplosionParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(1, 5);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: rand(0.03, 0.06),
      size: rand(1.5, 3.5),
      type: "explosion",
      color: color || "#fff",
    });
  }
}

function addSplashBurst(x, y, radius, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const offset = rand(0, radius);
    const speed = rand(0.8, 3.6);
    particles.push({
      x: x + Math.cos(angle) * offset,
      y: y + Math.sin(angle) * offset,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + rand(0.15, 0.7),
      life: 1,
      decay: rand(0.02, 0.045),
      size: rand(1.1, 2.8),
      type: "explosion",
      color,
    });
  }
}

function addRockDotBurst(x, y, radius, count) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const offset = rand(0, radius * 0.9);
    const speed = rand(0.4, 2.8);
    particles.push({
      x: x + Math.cos(angle) * offset,
      y: y + Math.sin(angle) * offset,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: rand(0.018, 0.04),
      size: rand(1.2, 2.6),
      type: "explosion",
      color: "#fff",
    });
  }
}

function addDestroyBurst(x, y, color, power) {
  const sparks = Math.max(5, Math.round(8 * power));
  for (let i = 0; i < sparks; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(1.5, 4.5) * power;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: rand(0.035, 0.06),
      len: rand(6, 14) * power,
      type: "spark",
      color,
    });
  }
  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 3,
    grow: 2.4 * power,
    life: 1,
    decay: 0.04,
    type: "ring",
    color,
  });
}

function updateParticles(dt) {
  const ts = timeScale(dt);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * ts;
    p.y += p.vy * ts;
    p.life -= p.decay * ts;
    if (p.type === "smoke") {
      const drag = Math.pow(0.95, ts);
      p.vx *= drag;
      p.vy *= drag;
    }
    if (p.type === "ring") p.radius += p.grow * ts;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    const color = p.color || "#fff";
    if (p.type === "ring") {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }
    if (p.type === "spark") {
      const mag = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
      const len = p.len * p.life;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - (p.vx / mag) * len, p.y - (p.vy / mag) * len);
      ctx.stroke();
      continue;
    }
    const age = Math.max(0, p.life);
    const puff = p.type === "bombSmoke" ? age * age : age;
    if (p.type === "bombSmoke") ctx.globalAlpha = age * 0.45;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * puff, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// --- Circle cluster enemy ---
const CLUSTER_SPIN = 0.006;

function createCluster(x, y, kind) {
  const circles = [];
  if (kind === "cluster2") {
    for (let i = 0; i < 5; i++) {
      circles.push({ ring: 1, angle: (i / 5) * Math.PI * 2, r: CLUSTER2_OUTER_R });
    }
    circles.push({ ring: 0, angle: 0, r: 0 });
    return {
      x,
      y,
      pushX: 0,
      pushY: 0,
      rot: rand(0, Math.PI * 2),
      spin: (Math.random() < 0.5 ? -1 : 1) * CLUSTER_SPIN,
      circles,
      radius: CLUSTER2_OUTER_R + CLUSTER_CIRCLE_R,
      grace: 0.7,
      kind: "cluster2",
      phase: "pulse",
      pulsesLeft: 5,
      pulseTimer: 0.35,
      pulses: [],
    };
  }
  for (let i = 0; i < 8; i++) {
    circles.push({ ring: 2, angle: (i / 8) * Math.PI * 2, r: 27.2 });
  }
  for (let i = 0; i < 5; i++) {
    circles.push({ ring: 1, angle: (i / 5) * Math.PI * 2 + 0.3, r: 14.4 });
  }
  circles.push({ ring: 0, angle: 0, r: 0 });
  return {
    x,
    y,
    pushX: 0,
    pushY: 0,
    rot: rand(0, Math.PI * 2),
    spin: (Math.random() < 0.5 ? -1 : 1) * CLUSTER_SPIN,
    circles,
    radius: 27.2 + CLUSTER_CIRCLE_R,
    grace: 0.7,
    kind: "cluster",
  };
}

function clusterOuterRing(cluster) {
  let ring = 0;
  for (const circle of cluster.circles) {
    if (circle.ring > ring) ring = circle.ring;
  }
  return ring;
}

function clusterSpeed(cluster) {
  const ring = clusterOuterRing(cluster);
  if (ring >= 2) return 1.2;
  if (ring === 1) return 1.7;
  return 2.2;
}

function circleWorldPos(cluster, circle) {
  const angle = circle.angle + cluster.rot;
  return {
    x: cluster.x + Math.cos(angle) * circle.r,
    y: cluster.y + Math.sin(angle) * circle.r,
  };
}

function popClusterCircle(cluster, circleIndex, clusterIndex, chain) {
  const circle = cluster.circles[circleIndex];
  const pos = circleWorldPos(cluster, circle);
  const last = cluster.circles.length === 1;
  cluster.circles.splice(circleIndex, 1);
  addSplashBurst(pos.x, pos.y, CLUSTER_CIRCLE_R * 1.4, last ? 26 : 14, "#ff3333");
  if (last) {
    if (chain) addChainScore(CLUSTER_CLEAR_SCORE, cluster.x, cluster.y);
    else addScore(CLUSTER_CLEAR_SCORE, cluster.x, cluster.y);
    playClusterClearSound();
    screenShake = 8;
    clusters.splice(clusterIndex, 1);
  } else {
    let reach = 0;
    for (const remain of cluster.circles) reach = Math.max(reach, remain.r);
    cluster.radius = reach + CLUSTER_CIRCLE_R;
    if (chain) addChainScore(CLUSTER_POP_SCORE, cluster.x, cluster.y);
    else addScore(CLUSTER_POP_SCORE, cluster.x, cluster.y);
    playClusterPopSound();
  }
}

function pointSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0) {
    t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
  }
  const sx = x1 + dx * t;
  const sy = y1 + dy * t;
  return distance(px, py, sx, sy);
}

function bulletHitsCluster(bullet) {
  const x1 = bullet.prevX != null ? bullet.prevX : bullet.x;
  const y1 = bullet.prevY != null ? bullet.prevY : bullet.y;
  const x2 = bullet.x;
  const y2 = bullet.y;

  for (let i = clusters.length - 1; i >= 0; i--) {
    const cluster = clusters[i];
    const ring = clusterOuterRing(cluster);
    let bestIndex = -1;
    let bestDist = Infinity;

    for (let c = 0; c < cluster.circles.length; c++) {
      const circle = cluster.circles[c];
      if (cluster.kind !== "cluster2" && circle.ring !== ring) continue;
      const pos = circleWorldPos(cluster, circle);
      const dist = pointSegmentDistance(pos.x, pos.y, x1, y1, x2, y2);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = c;
      }
    }

    const crossedBody = pointSegmentDistance(cluster.x, cluster.y, x1, y1, x2, y2) <= cluster.radius + 4;
    const hitCircle = bestIndex >= 0 && bestDist <= CLUSTER_CIRCLE_R + 8;
    if ((hitCircle || crossedBody) && bestIndex >= 0) {
      popClusterCircle(cluster, bestIndex, i, true);
      return true;
    }
  }
  return false;
}

function bulletHitsSeeker(bullet) {
  const x1 = bullet.prevX != null ? bullet.prevX : bullet.x;
  const y1 = bullet.prevY != null ? bullet.prevY : bullet.y;
  for (let i = clusterSeekers.length - 1; i >= 0; i--) {
    const seeker = clusterSeekers[i];
    if (pointSegmentDistance(seeker.x, seeker.y, x1, y1, bullet.x, bullet.y) > seeker.radius + 8) continue;
    popClusterSeeker(i, true);
    return true;
  }
  return false;
}

function shipShieldRadius() {
  return ship.radius + 8;
}

function shipHitsCluster(cluster) {
  if (cluster.grace > 0) return false;
  for (const circle of cluster.circles) {
    const pos = circleWorldPos(cluster, circle);
    if (distance(ship.x, ship.y, pos.x, pos.y) < CLUSTER_CIRCLE_R + ship.radius - 2) {
      return true;
    }
  }
  return false;
}

function popCirclesTouchedByShield(cluster, clusterIndex) {
  if (cluster.grace > 0 || shieldCharges <= 0) return false;
  const ring = clusterOuterRing(cluster);
  const reach = shipShieldRadius() + CLUSTER_CIRCLE_R;
  const hits = [];
  cluster.circles.forEach((circle, index) => {
    if (cluster.kind !== "cluster2" && circle.ring !== ring) return;
    const pos = circleWorldPos(cluster, circle);
    if (distance(ship.x, ship.y, pos.x, pos.y) < reach) hits.push(index);
  });
  if (hits.length === 0) return false;
  for (let i = hits.length - 1; i >= 0; i--) {
    if (clusters[clusterIndex] !== cluster) break;
    popClusterCircle(cluster, hits[i], clusterIndex);
  }
  return true;
}

function releaseCluster2(cluster) {
  const cells = cluster.circles;
  for (let i = 0; i < cells.length; i++) {
    const pos = circleWorldPos(cluster, cells[i]);
    let dx = pos.x - cluster.x;
    let dy = pos.y - cluster.y;
    let out = Math.atan2(dy, dx);
    const fromCenter = Math.hypot(dx, dy);
    if (fromCenter < 4) out = (i / Math.max(1, cells.length)) * Math.PI * 2;
    const burst = 2.6;
    clusterSeekers.push({
      x: cluster.x + Math.cos(out) * (fromCenter + 8),
      y: cluster.y + Math.sin(out) * (fromCenter + 8),
      vx: Math.cos(out) * burst,
      vy: Math.sin(out) * burst,
      radius: CLUSTER_CIRCLE_R,
      smoke: rand(0, 0.04),
      burst: 0.55,
      pushX: 0,
      pushY: 0,
      kind: "seeker",
    });
  }
  const index = clusters.indexOf(cluster);
  if (index >= 0) clusters.splice(index, 1);
}

function addSeekerSmoke(seeker) {
  const travel = Math.atan2(seeker.vy + seeker.pushY, seeker.vx + seeker.pushX);
  const behind = travel + Math.PI + rand(-0.35, 0.35);
  const dist = seeker.radius + rand(2, 7);
  particles.push({
    x: seeker.x + Math.cos(behind) * dist,
    y: seeker.y + Math.sin(behind) * dist,
    vx: Math.cos(behind) * rand(0.2, 0.7) - seeker.vx * 0.1,
    vy: Math.sin(behind) * rand(0.2, 0.7) - seeker.vy * 0.1,
    life: 1,
    decay: rand(0.02, 0.04),
    size: rand(1, 2.2),
    type: "smoke",
  });
}

function updateClusterSeekers(dt) {
  const ts = timeScale(dt);
  for (const seeker of clusterSeekers) {
    if (seeker.burst > 0) seeker.burst -= dt;
    const aim = Math.atan2(ship.y - seeker.y, ship.x - seeker.x);
    const desiredX = Math.cos(aim) * CLUSTER2_SPEED;
    const desiredY = Math.sin(aim) * CLUSTER2_SPEED;
    const turn = seeker.burst > 0 ? 0.03 : 0.08;
    seeker.vx += (desiredX - seeker.vx) * turn * ts;
    seeker.vy += (desiredY - seeker.vy) * turn * ts;
    let speed = Math.hypot(seeker.vx, seeker.vy);
    const cap = seeker.burst > 0 ? 2.8 : CLUSTER2_SPEED;
    const floor = seeker.burst > 0 ? 1.2 : CLUSTER2_SPEED;
    if (speed < 0.01) {
      seeker.vx = desiredX;
      seeker.vy = desiredY;
      speed = CLUSTER2_SPEED;
    }
    if (speed > cap) {
      seeker.vx = (seeker.vx / speed) * cap;
      seeker.vy = (seeker.vy / speed) * cap;
    } else if (speed < floor) {
      seeker.vx = (seeker.vx / speed) * floor;
      seeker.vy = (seeker.vy / speed) * floor;
    }
    const decay = Math.pow(0.96, ts);
    seeker.pushX *= decay;
    seeker.pushY *= decay;
    seeker.x += (seeker.vx + seeker.pushX) * ts;
    seeker.y += (seeker.vy + seeker.pushY) * ts;
    wrapPosition(seeker);
    keepSeekerOffShip(seeker);
    seeker.smoke += dt;
    if (seeker.smoke >= 0.05) {
      seeker.smoke = 0;
      addSeekerSmoke(seeker);
    }
  }
}

function popClusterSeeker(index, chain) {
  const seeker = clusterSeekers[index];
  if (!seeker) return;
  addSplashBurst(seeker.x, seeker.y, CLUSTER_CIRCLE_R * 1.4, 12, "#ff3333");
  if (chain) addChainScore(CLUSTER_POP_SCORE, seeker.x, seeker.y);
  else addScore(CLUSTER_POP_SCORE, seeker.x, seeker.y);
  playClusterPopSound();
  clusterSeekers.splice(index, 1);
}

function updateClusters(dt) {
  const ts = timeScale(dt);
  const decay = Math.pow(0.96, ts);
  for (let i = clusters.length - 1; i >= 0; i--) {
    const cluster = clusters[i];
    if (cluster.grace > 0) cluster.grace -= dt;
    cluster.rot += cluster.spin * ts;
    cluster.pushX *= decay;
    cluster.pushY *= decay;
    if (cluster.kind === "cluster2" && cluster.phase === "pulse") {
      for (let p = cluster.pulses.length - 1; p >= 0; p--) {
        cluster.pulses[p].radius += 2.4 * ts;
        if (cluster.pulses[p].radius >= cluster.pulses[p].max) cluster.pulses.splice(p, 1);
      }
      cluster.x += cluster.pushX * ts;
      cluster.y += cluster.pushY * ts;
      wrapPosition(cluster);
      cluster.pulseTimer -= dt;
      if (cluster.pulseTimer > 0) continue;
      cluster.pulses.push({ radius: 6, max: cluster.radius + 40 });
      cluster.pulsesLeft -= 1;
      if (cluster.pulsesLeft <= 0) {
        releaseCluster2(cluster);
        continue;
      }
      cluster.pulseTimer = CLUSTER2_PULSE_GAP;
      continue;
    }
    const angle = Math.atan2(ship.y - cluster.y, ship.x - cluster.x);
    const speed = clusterSpeed(cluster);
    cluster.x += (Math.cos(angle) * speed + cluster.pushX) * ts;
    cluster.y += (Math.sin(angle) * speed + cluster.pushY) * ts;
    wrapPosition(cluster);
  }
  updateClusterSeekers(dt);
}

function livingCellScale(angle, ring) {
  let along = angle / (Math.PI * 2) - performance.now() * 0.00042 - (ring || 0) * 0.11;
  along -= Math.floor(along);
  const dist = along > 0.5 ? 1 - along : along;
  const width = 0.055;
  if (dist >= width) return 1;
  const pinch = 1 - dist / width;
  return 1 - 0.32 * pinch * pinch;
}

function drawClusters() {
  ctx.strokeStyle = "#ff3333";
  ctx.lineWidth = 2;
  for (const cluster of clusters) {
    if (cluster.pulses) {
      for (const pulse of cluster.pulses) {
        ctx.globalAlpha = Math.max(0.25, 1 - pulse.radius / pulse.max);
        ctx.beginPath();
        ctx.arc(cluster.x, cluster.y, pulse.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    for (const circle of cluster.circles) {
      const pos = circleWorldPos(cluster, circle);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, CLUSTER_CIRCLE_R * livingCellScale(circle.angle, circle.ring), 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawClusterSeekers() {
  ctx.strokeStyle = "#ff3333";
  ctx.lineWidth = 2;
  for (const seeker of clusterSeekers) {
    ctx.beginPath();
    ctx.arc(seeker.x, seeker.y, seeker.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// --- Wave boss (wave 5 form, wave 10 adds three shell rings and a throw) ---
const BOSS_SPEED = 0.32;
const BOSS_SPIN = 0.008;
const BOSS_BOMB_REACH = 58;
const BOSS_SHOT_INTERVAL = 4;
const BOSS_SHOT_WARN = 0.7;
const BOSS_SHOT_ARC = (80 * Math.PI) / 180;
const BOSS_BULLET_SPEED = 2.8;
const BOSS_DEATH_SHAKE = 0.9;

function bossNameForWave(waveNumber) {
  return waveNumber % 10 === 0 ? W10_BOSS_NAME : BOSS_NAME;
}

function angleDiff(a, b) {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

function bossCircleReady(circle) {
  return circle.alive && circle.appearDelay <= 0 && circle.grow > 0.2;
}

function createBoss(x, y, variant) {
  const circles = [];
  const shellLayers = variant === "w10" ? 8 : 5;
  const coreLayers = [
    { ring: 0, count: 1, r: 0 },
    { ring: 1, count: 5, r: 14.4 },
    { ring: 2, count: 8, r: 27.2 },
  ];
  for (const layer of coreLayers) {
    for (let i = 0; i < layer.count; i++) {
      circles.push({
        ring: layer.ring,
        angle: (i / layer.count) * Math.PI * 2,
        r: layer.r,
        core: true,
        alive: true,
        grow: 1,
        appearDelay: 0,
      });
    }
  }
  let outer = 27.2;
  for (let layer = 0; layer < shellLayers; layer++) {
    const r = 40 + layer * 13;
    outer = r;
    const count = Math.max(12, Math.round((Math.PI * 2 * r) / 15));
    for (let i = 0; i < count; i++) {
      circles.push({
        ring: 3 + layer,
        angle: (i / count) * Math.PI * 2 + layer * 0.17,
        r,
        core: false,
        alive: true,
        grow: 1,
        appearDelay: 0,
      });
    }
  }
  return {
    x,
    y,
    rot: rand(0, Math.PI * 2),
    radius: outer + CLUSTER_CIRCLE_R,
    circles,
    variant: variant === "w10" ? "w10" : "w5",
    phase: "chase",
    pulseTimer: 0,
    pulsesLeft: 0,
    needsRebuild: false,
    rebuilds: 0,
    coreRebuilds: 0,
    coreTotal: 14,
    shellTotal: circles.filter((circle) => !circle.core).length,
    attackTimer: BOSS_SHOT_INTERVAL,
    attackPhase: "idle",
    attackTime: 0,
    shake: 0,
    attackCircles: [],
    pushX: 0,
    pushY: 0,
    kind: "boss",
    tremorX: 0,
    tremorY: 0,
    tremorVX: 0,
    tremorVY: 0,
    kickWait: 0,
  };
}

function spawnBoss() {
  const variant = wave % 10 === 0 ? "w10" : "w5";
  const side = Math.floor(rand(0, 4));
  const pad = variant === "w10" ? 170 : 110;
  let x = rand(pad, W - pad);
  let y = rand(pad, H - pad);
  if (side === 0) y = -pad;
  else if (side === 1) x = W + pad;
  else if (side === 2) y = H + pad;
  else x = -pad;
  boss = createBoss(x, y, variant);
  bossPulses = [];
  bossBullets = [];
  syncStageLabel();
  startBossMusic();
}

function bossCoreAlive() {
  let count = 0;
  for (const circle of boss.circles) {
    if (circle.core && circle.alive) count++;
  }
  return count;
}

function bossShellAlive() {
  let count = 0;
  for (const circle of boss.circles) {
    if (!circle.core && circle.alive) count++;
  }
  return count;
}

function bossRebuildReady() {
  const coreLow = bossCoreAlive() < boss.coreTotal * 0.5;
  const shellsLow = bossShellAlive() < boss.shellTotal * 0.5;
  if (boss.variant === "w10") {
    return (boss.coreRebuilds < 1 && coreLow) || shellsLow;
  }
  if (boss.rebuilds < 1) return coreLow;
  return shellsLow;
}

function randomPickupType() {
  const types = ["rapid", "slow", "shield", "doubleShield", "bomb", "triple"];
  let type = types[Math.floor(Math.random() * types.length)];
  if (wave % 5 === 0 && type === "bomb" && Math.random() < 0.7) {
    type = ["rapid", "slow", "shield", "doubleShield", "triple"][Math.floor(Math.random() * 5)];
  }
  return type;
}

const PICKUP_CAP = 10;
const PICKUP_LIFETIME = 30;
const PICKUP_FADE = 8;

function pickupCount(type) {
  let count = 0;
  for (const item of pickups) {
    if (item.type === type) count++;
  }
  return count;
}

function spawnPickup(x, y, type) {
  if (pickupCount(type) >= PICKUP_CAP) return;
  const vel = randomVelocity(0.3, 0.8);
  pickups.push({
    x,
    y,
    vx: vel.vx,
    vy: vel.vy,
    radius: 14,
    spin: rand(0, Math.PI * 2),
    type,
    age: 0,
  });
}

function pickupAlpha(item) {
  const left = PICKUP_LIFETIME - item.age;
  if (left >= PICKUP_FADE) return 1;
  const fade = Math.max(0, left / PICKUP_FADE);
  const blink = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(item.age * 16));
  return fade * blink;
}

function dropBossPickup(x, y) {
  if (Math.random() > 0.14) return;
  spawnPickup(x, y, randomPickupType());
}

function defeatBoss() {
  if (!boss) return;
  addScore(1000, boss.x, boss.y, "BOSS +1000");
  playClusterClearSound();
  screenShake = 14;
  boss = null;
  bossPulses = [];
  bossBullets = [];
  syncStageLabel();
  beginWaveIntro("WAVE " + wave + " . BOSS", "DEFEATED", "afterBoss");
}

function beginBossCollapse() {
  if (!boss || boss.phase === "collapse") return;
  cancelBossAttack();
  boss.phase = "collapse";
  boss.needsRebuild = false;
  boss.collapseShake = BOSS_DEATH_SHAKE;
  boss.collapseTimer = BOSS_DEATH_SHAKE;
  boss.tremorX = 0;
  boss.tremorY = 0;
  playBossDeathSound();
  fadeBossMusic();
}

function keepSeekerOffShip(seeker) {
  const minDist = seeker.radius + ship.radius + 10;
  if (distance(seeker.x, seeker.y, ship.x, ship.y) >= minDist) return;
  const vx = seeker.vx + seeker.pushX;
  const vy = seeker.vy + seeker.pushY;
  if (Math.abs(vx) >= Math.abs(vy)) seeker.x = vx >= 0 ? -seeker.radius : W + seeker.radius;
  else seeker.y = vy >= 0 ? -seeker.radius : H + seeker.radius;
}

function popBossCircle(circle, chain) {
  if (!boss || !circle.alive) return;
  const collapsing = boss.phase === "collapse";
  const pos = circleWorldPos(boss, circle);
  circle.alive = false;
  circle.grow = 0;
  circle.appearDelay = 0;
  circle.charging = false;
  addSplashBurst(pos.x, pos.y, CLUSTER_CIRCLE_R * 1.3, circle.core ? 14 : 8, "#ff3333");
  if (!collapsing) {
    const points = circle.core ? 40 : 20;
    if (chain) addChainScore(points, pos.x, pos.y);
    else addScore(points, pos.x, pos.y);
    playClusterPopSound();
    dropBossPickup(pos.x, pos.y);
  } else {
    playClusterPopSound();
  }
  if (!boss) return;
  if (collapsing) {
    let any = false;
    for (const remain of boss.circles) {
      if (remain.alive) any = true;
    }
    if (!any) defeatBoss();
    return;
  }
  if (bossCoreAlive() === 0) {
    beginBossCollapse();
    return;
  }
  if (boss.phase === "chase" && bossRebuildReady()) {
    boss.needsRebuild = true;
  }
}

function cancelBossAttack() {
  if (!boss) return;
  for (const circle of boss.attackCircles) circle.charging = false;
  boss.attackPhase = "idle";
  boss.attackTime = 0;
  boss.shake = 0;
  boss.attackCircles = [];
}

function circleOnOuterEdge(circle, shells) {
  for (const other of shells) {
    if (other === circle || other.r <= circle.r) continue;
    const cover = (15 / other.r) * 0.55;
    if (angleDiff(circle.angle, other.angle) <= cover) return false;
  }
  return true;
}

function beginBossWindup() {
  const aim = Math.atan2(ship.y - boss.y, ship.x - boss.x);
  const shells = [];
  for (const circle of boss.circles) {
    if (!circle.core && bossCircleReady(circle)) shells.push(circle);
  }
  const chosen = [];
  for (const circle of shells) {
    if (angleDiff(circle.angle + boss.rot, aim) > BOSS_SHOT_ARC / 2) continue;
    if (!circleOnOuterEdge(circle, shells)) continue;
    circle.charging = true;
    chosen.push(circle);
  }
  if (chosen.length === 0) {
    boss.attackTimer = 1.5;
    return;
  }
  boss.attackPhase = "windup";
  boss.attackTime = 0;
  boss.shake = 0;
  boss.attackCircles = chosen;
}

function releaseBossShot() {
  for (const circle of boss.attackCircles) {
    if (!boss || !bossCircleReady(circle)) continue;
    const pos = circleWorldPos(boss, circle);
    const world = circle.angle + boss.rot;
    bossBullets.push({
      x: pos.x,
      y: pos.y,
      vx: Math.cos(world) * BOSS_BULLET_SPEED,
      vy: Math.sin(world) * BOSS_BULLET_SPEED,
      radius: CLUSTER_CIRCLE_R,
    });
    circle.alive = false;
    circle.grow = 0;
    circle.appearDelay = 0;
  }
  cancelBossAttack();
  if (boss && boss.phase === "chase") boss.attackTimer = BOSS_SHOT_INTERVAL;
  if (boss && boss.phase === "chase" && bossRebuildReady()) boss.needsRebuild = true;
}

function updateBossTremor(dt) {
  const shake = boss.attackPhase === "windup" ? boss.shake : 0;
  boss.kickWait -= dt;
  if (shake > 0 && boss.kickWait <= 0) {
    const kick = (1.4 + shake * shake * 11) * rand(0.55, 1.35);
    const ang = rand(0, Math.PI * 2);
    boss.tremorVX += Math.cos(ang) * kick;
    boss.tremorVY += Math.sin(ang) * kick;
    boss.kickWait = Math.max(0.016, 0.07 - shake * 0.055);
  }
  boss.tremorVX += -boss.tremorX * 0.42;
  boss.tremorVY += -boss.tremorY * 0.42;
  boss.tremorVX *= 0.74;
  boss.tremorVY *= 0.74;
  boss.tremorX += boss.tremorVX * timeScale(dt) * 0.22;
  boss.tremorY += boss.tremorVY * timeScale(dt) * 0.22;
  const cap = 2 + shake * 8;
  boss.tremorX = Math.max(-cap, Math.min(cap, boss.tremorX));
  boss.tremorY = Math.max(-cap, Math.min(cap, boss.tremorY));
  if (shake === 0) {
    boss.tremorX *= 0.8;
    boss.tremorY *= 0.8;
  }
}

function updateBossAttack(dt) {
  if (boss.attackPhase === "idle") {
    boss.attackTimer -= dt;
    if (boss.attackTimer <= 0) beginBossWindup();
    return;
  }
  boss.attackTime += dt;
  const t = Math.min(1, boss.attackTime / BOSS_SHOT_WARN);
  boss.shake = t * t;
  if (boss.attackTime >= BOSS_SHOT_WARN) releaseBossShot();
}

function updateBossBullets(dt) {
  const ts = timeScale(dt);
  for (let i = bossBullets.length - 1; i >= 0; i--) {
    const bullet = bossBullets[i];
    bullet.x += bullet.vx * ts;
    bullet.y += bullet.vy * ts;
    const off = bullet.x < -bullet.radius || bullet.x > W + bullet.radius
      || bullet.y < -bullet.radius || bullet.y > H + bullet.radius;
    if (off) bossBullets.splice(i, 1);
  }
}

function damageBossBulletsWithWave(wave, ts) {
  for (let i = bossBullets.length - 1; i >= 0; i--) {
    const bullet = bossBullets[i];
    if (wave.hitSet.has(bullet)) continue;
    const dist = distance(wave.x, wave.y, bullet.x, bullet.y);
    const touches = wave.radius >= dist - bullet.radius
      && wave.radius <= dist + bullet.radius + wave.speed * ts;
    if (!touches) continue;
    wave.hitSet.add(bullet);
    addSplashBurst(bullet.x, bullet.y, bullet.radius * 1.4, 6, "#ff3333");
    bossBullets.splice(i, 1);
  }
}

function beginBossFill() {
  if (!boss) return;
  cancelBossAttack();
  boss.phase = "fill";
  const missing = boss.circles.filter((circle) => !circle.core && !circle.alive);
  missing.sort((a, b) => a.ring - b.ring || a.angle - b.angle);
  let ringStart = 0;
  let lastRing = -1;
  let indexInRing = 0;
  for (const circle of missing) {
    if (circle.ring !== lastRing) {
      if (lastRing !== -1) ringStart += 0.42;
      lastRing = circle.ring;
      indexInRing = 0;
    }
    circle.alive = true;
    circle.grow = 0;
    circle.appearDelay = ringStart + indexInRing * 0.028;
    indexInRing++;
  }
}

function updateBossPulses(dt) {
  const ts = timeScale(dt);
  for (let i = bossPulses.length - 1; i >= 0; i--) {
    const pulse = bossPulses[i];
    pulse.radius += pulse.speed * ts;
    if (!pulse.pushedShip && !gameOver && !waitingToStart && !shipBreakActive) {
      const dist = distance(pulse.x, pulse.y, ship.x, ship.y);
      if (dist <= pulse.radius + ship.radius) {
        pulse.pushedShip = true;
        let dx = ship.x - pulse.x;
        let dy = ship.y - pulse.y;
        let len = Math.hypot(dx, dy);
        if (len < 0.01) {
          dx = Math.cos(ship.angle);
          dy = Math.sin(ship.angle);
          len = 1;
        }
        ship.x += (dx / len) * 36;
        ship.y += (dy / len) * 36;
        ship.vx += (dx / len) * 3.1;
        ship.vy += (dy / len) * 3.1;
        wrapPosition(ship);
      }
    }
    if (pulse.radius >= pulse.maxRadius) bossPulses.splice(i, 1);
  }
}

function updateBossCollapse(dt) {
  boss.rot += BOSS_SPIN * 0.4 * timeScale(dt);
  if (boss.collapseShake > 0) {
    boss.collapseShake -= dt;
    const build = 1 - Math.max(0, boss.collapseShake / BOSS_DEATH_SHAKE);
    const shaped = build * build;
    const amp = 0.8 + shaped * 18;
    const rate = 0.045 + shaped * 0.16;
    const t = performance.now();
    boss.tremorX = Math.sin(t * rate) * amp + Math.sin(t * rate * 2.7) * amp * 0.28;
    boss.tremorY = Math.sin(t * rate * 1.43 + 0.8) * amp * 0.72;
    if (boss.collapseShake > 0) return;
    boss.tremorX = 0;
    boss.tremorY = 0;
    boss.collapseTimer = 0.04;
  }
  boss.collapseTimer -= dt;
  if (boss.collapseTimer > 0) return;
  const living = [];
  for (const circle of boss.circles) {
    if (circle.alive) living.push(circle);
  }
  if (living.length === 0) {
    defeatBoss();
    return;
  }
  const batch = Math.min(living.length, living.length > 36 ? 2 : 1);
  for (let n = 0; n < batch; n++) {
    const pool = [];
    for (const circle of boss.circles) {
      if (circle.alive) pool.push(circle);
    }
    if (pool.length === 0 || !boss) break;
    popBossCircle(pool[Math.floor(Math.random() * pool.length)]);
  }
  if (!boss) return;
  boss.collapseTimer = 0.04 + Math.random() * 0.05;
}

function updateBoss(dt) {
  updateBossPulses(dt);
  updateBossBullets(dt);
  if (!boss) return;
  const ts = timeScale(dt);
  const decay = Math.pow(0.96, ts);
  boss.pushX *= decay;
  boss.pushY *= decay;

  if (boss.phase === "collapse") {
    boss.x += boss.pushX * ts;
    boss.y += boss.pushY * ts;
    wrapPosition(boss);
    updateBossCollapse(dt);
    return;
  }

  updateBossTremor(dt);
  if (boss.phase === "chase") {
    if (boss.attackPhase !== "windup") boss.rot += BOSS_SPIN * ts;
    const angle = Math.atan2(ship.y - boss.y, ship.x - boss.x);
    boss.x += (Math.cos(angle) * BOSS_SPEED + boss.pushX) * ts;
    boss.y += (Math.sin(angle) * BOSS_SPEED + boss.pushY) * ts;
    wrapPosition(boss);
    if (boss.needsRebuild && bossRebuildReady()) {
      cancelBossAttack();
      boss.phase = "pulse";
      boss.pulsesLeft = 5;
      boss.pulseTimer = 0;
      boss.needsRebuild = false;
    } else if (boss.variant === "w10") {
      updateBossAttack(dt);
    }
  } else if (boss.phase === "pulse") {
    boss.x += boss.pushX * ts;
    boss.y += boss.pushY * ts;
    wrapPosition(boss);
    boss.pulseTimer += dt;
    if (boss.pulseTimer >= 1) {
      boss.pulseTimer -= 1;
      bossPulses.push({
        x: boss.x,
        y: boss.y,
        radius: 12,
        maxRadius: 150,
        speed: 4.2,
        pushedShip: false,
      });
      boss.pulsesLeft--;
      if (boss.pulsesLeft <= 0) beginBossFill();
    }
  } else if (boss.phase === "fill") {
    boss.x += boss.pushX * ts;
    boss.y += boss.pushY * ts;
    wrapPosition(boss);
    let waiting = false;
    for (const circle of boss.circles) {
      if (!circle.alive || circle.grow >= 1) continue;
      if (circle.appearDelay > 0) {
        circle.appearDelay -= dt;
        waiting = true;
        continue;
      }
      circle.grow = Math.min(1, circle.grow + dt / 0.22);
      if (circle.grow < 1) waiting = true;
    }
    if (!waiting) {
      boss.phase = "chase";
      boss.rebuilds += 1;
      if (boss.variant === "w10" && bossCoreAlive() < boss.coreTotal * 0.5) boss.coreRebuilds = 1;
      boss.attackTimer = BOSS_SHOT_INTERVAL;
      if (bossRebuildReady()) boss.needsRebuild = true;
    }
  }
}

function bulletHitsBoss(bullet) {
  if (!boss) return false;
  const x1 = bullet.prevX != null ? bullet.prevX : bullet.x;
  const y1 = bullet.prevY != null ? bullet.prevY : bullet.y;
  const x2 = bullet.x;
  const y2 = bullet.y;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let best = null;
  let bestAlong = Infinity;

  for (const circle of boss.circles) {
    if (!bossCircleReady(circle)) continue;
    const pos = circleWorldPos(boss, circle);
    const dist = pointSegmentDistance(pos.x, pos.y, x1, y1, x2, y2);
    if (dist > CLUSTER_CIRCLE_R + 2) continue;
    let along = 0;
    if (len2 > 0) along = ((pos.x - x1) * dx + (pos.y - y1) * dy) / len2;
    if (along < bestAlong) {
      bestAlong = along;
      best = circle;
    }
  }

  if (!best) return false;
  popBossCircle(best, true);
  return true;
}

function damageBossWithWave(wave, ts, reach) {
  if (!boss) return;
  const limit = reach == null ? Infinity : reach + CLUSTER_CIRCLE_R;
  for (const circle of boss.circles) {
    if (!bossCircleReady(circle) || wave.hitSet.has(circle)) continue;
    const pos = circleWorldPos(boss, circle);
    const dist = distance(wave.x, wave.y, pos.x, pos.y);
    if (dist > limit) continue;
    const touches = wave.radius >= dist - CLUSTER_CIRCLE_R && wave.radius <= dist + CLUSTER_CIRCLE_R + wave.speed * ts;
    if (!touches) continue;
    wave.hitSet.add(circle);
    popBossCircle(circle);
    if (!boss) return;
  }
}

function shieldHitsBoss() {
  if (!boss || boss.phase === "collapse" || shieldCharges <= 0) return false;
  const reach = shipShieldRadius() + CLUSTER_CIRCLE_R;
  const hits = [];
  for (const circle of boss.circles) {
    if (!bossCircleReady(circle)) continue;
    const pos = circleWorldPos(boss, circle);
    if (distance(ship.x, ship.y, pos.x, pos.y) < reach) hits.push(circle);
  }
  if (hits.length === 0) return false;
  for (const circle of hits) {
    popBossCircle(circle);
    if (!boss) break;
  }
  return true;
}

function shipHitsBoss() {
  if (!boss || boss.phase === "collapse") return false;
  for (const circle of boss.circles) {
    if (!bossCircleReady(circle)) continue;
    const pos = circleWorldPos(boss, circle);
    if (distance(ship.x, ship.y, pos.x, pos.y) < CLUSTER_CIRCLE_R + ship.radius - 2) return true;
  }
  return false;
}

function drawBoss() {
  for (const pulse of bossPulses) {
    ctx.strokeStyle = "#ff3333";
    ctx.lineWidth = 2;
    ctx.globalAlpha = Math.max(0.3, 1 - pulse.radius / pulse.maxRadius);
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (const bullet of bossBullets) {
    ctx.strokeStyle = "#ff3333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (!boss) return;
  ctx.save();
  ctx.translate(boss.x + boss.tremorX, boss.y + boss.tremorY);
  ctx.rotate(boss.rot);
  ctx.lineWidth = 2;
  const strain = boss.shake || 0;
  for (const circle of boss.circles) {
    if (!circle.alive || circle.appearDelay > 0 || circle.core) continue;
    const scale = Math.max(0.05, circle.grow) * livingCellScale(circle.angle, circle.ring);
    const pull = circle.charging ? 6.5 : 1.4;
    const flex = Math.sin(circle.angle * 9 + performance.now() * 0.02) * strain * (circle.charging ? 1.6 : 0.45);
    const ox = Math.cos(circle.angle) * (strain * pull + flex);
    const oy = Math.sin(circle.angle) * (strain * pull + flex);
    ctx.globalAlpha = circle.charging ? 1 : 0.4 + 0.6 * circle.grow;
    ctx.strokeStyle = circle.charging ? "#ffb3b3" : circle.grow < 1 ? "#ff8888" : "#ff3333";
    ctx.lineWidth = circle.charging ? 2.75 : 2;
    ctx.beginPath();
    ctx.arc(Math.cos(circle.angle) * circle.r + ox, Math.sin(circle.angle) * circle.r + oy, CLUSTER_CIRCLE_R * scale, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ff3333";
  for (const circle of boss.circles) {
    if (!circle.alive || circle.appearDelay > 0 || !circle.core) continue;
    const scale = Math.max(0.05, circle.grow) * livingCellScale(circle.angle, circle.ring);
    ctx.globalAlpha = 0.45 + 0.55 * circle.grow;
    ctx.beginPath();
    ctx.arc(Math.cos(circle.angle) * circle.r, Math.sin(circle.angle) * circle.r, CLUSTER_CIRCLE_R * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// --- Pickups ---
function maybeDropPickup(x, y) {
  if (Math.random() > 0.3) return;
  spawnPickup(x, y, randomPickupType());
}

function collectPickup() {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const item = pickups[i];
    if (distance(ship.x, ship.y, item.x, item.y) > item.radius + ship.radius) continue;
    pickups.splice(i, 1);
    if (item.type === "shield" || item.type === "doubleShield") {
      shieldCharges = Math.max(shieldCharges, item.type === "doubleShield" ? 2 : 1);
      scorePopups.push({
        x: ship.x,
        y: ship.y - 18,
        text: item.type === "doubleShield" ? "SHIELD 2" : "SHIELD",
        life: 1,
      });
      continue;
    }
    if (item.type === "bomb") {
      bombCharges += 1;
      scorePopups.push({ x: ship.x, y: ship.y - 18, text: "BOMB", life: 1 });
      continue;
    }
    if (item.type === "rapid") rapidTimer += PICKUP_DURATION;
    else if (item.type === "triple") tripleTimer += PICKUP_DURATION;
    else slowTimer = PICKUP_DURATION;
    const pickupLabel = item.type === "rapid" ? "RAPID" : item.type === "triple" ? "TRIPLE" : "SLOW";
    scorePopups.push({
      x: ship.x,
      y: ship.y - 18,
      text: pickupLabel,
      life: 1,
    });
  }
}

function updatePickup(dt) {
  if (rapidTimer > 0) {
    rapidTimer -= dt;
    if (rapidTimer < 0) rapidTimer = 0;
  }
  if (tripleTimer > 0) {
    tripleTimer -= dt;
    if (tripleTimer < 0) tripleTimer = 0;
  }
  if (slowTimer > 0) {
    slowTimer -= dt;
    if (slowTimer < 0) slowTimer = 0;
  }
  const ts = timeScale(dt);
  for (let i = pickups.length - 1; i >= 0; i--) {
    const item = pickups[i];
    item.age += dt;
    if (item.age >= PICKUP_LIFETIME) {
      pickups.splice(i, 1);
      continue;
    }
    item.spin += 0.03 * ts;
    item.x += item.vx * ts;
    item.y += item.vy * ts;
    wrapPosition(item);
  }
}

function drawPickupIcon(type) {
  ctx.beginPath();
  if (type === "rapid" || type === "triple") {
    ctx.moveTo(0, -11);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(-8, 0);
    ctx.closePath();
  } else if (type === "slow") {
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.moveTo(-4, 0);
    ctx.lineTo(4, 0);
  } else if (type === "bomb") {
    ctx.moveTo(0, -11);
    ctx.lineTo(9, 8);
    ctx.lineTo(-9, 8);
    ctx.closePath();
  } else if (type === "doubleShield") {
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.moveTo(7, 0);
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.moveTo(-4.8, 0);
    ctx.lineTo(4.8, 0);
    ctx.moveTo(0, -4.8);
    ctx.lineTo(0, 4.8);
  } else {
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
  }
  ctx.stroke();
}

function drawPickup() {
  ctx.strokeStyle = "#4da3ff";
  ctx.lineWidth = 2;
  for (const item of pickups) {
    const alpha = pickupAlpha(item);
    if (alpha <= 0.02) continue;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(item.x, item.y);
    ctx.rotate(item.spin);
    drawPickupIcon(item.type);
    drawPickupLetter(item.type);
    ctx.restore();
  }
}

function updateScorePopups(dt) {
  const ts = timeScale(dt);
  for (const popup of scorePopups) {
    popup.y -= 0.35 * ts;
    popup.life -= 0.018 * ts;
  }
  scorePopups = scorePopups.filter((popup) => popup.life > 0);
  if (waveBanner > 0) {
    waveBanner -= dt;
    if (waveBanner <= 0) {
      waveBanner = 0;
      releasePendingWave();
    }
  }
}

function drawScorePopups() {
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "14px Courier New";
  for (const popup of scorePopups) {
    ctx.globalAlpha = Math.max(0, popup.life);
    ctx.fillText(popup.text, popup.x, popup.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

function localBox(el) {
  const stage = canvas.parentElement;
  const box = el.getBoundingClientRect();
  const stageBox = stage.getBoundingClientRect();
  if (!document.body.classList.contains("portrait-rotated")) {
    return {
      x: box.left - stageBox.left,
      y: box.top - stageBox.top,
      w: box.width,
      h: box.height,
    };
  }
  // The playfield is rotated 90° clockwise, so viewport deltas are swapped.
  return {
    x: box.top - stageBox.top,
    y: stageBox.right - box.right,
    w: box.height,
    h: box.width,
  };
}

function drawLives() {
  if (waitingToStart || gameOver) return;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (cssW < 1 || cssH < 1) return;
  const scoreBox = localBox(scoreEl);
  const canvasBox = localBox(canvas);
  const toX = W / cssW;
  const toY = H / cssH;
  const iconH = Math.max(10, scoreBox.h * 0.72);
  const iconW = iconH * 0.8;
  const gap = 6;
  const left = scoreBox.x - canvasBox.x;
  const top = scoreBox.y + scoreBox.h - canvasBox.y + 6;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5 * toY;
  const shown = Math.min(lives, MAX_LIVES);
  for (let i = 0; i < shown; i++) {
    const x = (left + i * (iconW + gap) + iconW / 2) * toX;
    const y = (top + iconH / 2) * toY;
    const hw = (iconW / 2) * toX;
    const hh = (iconH / 2) * toY;
    ctx.beginPath();
    ctx.moveTo(x, y - hh);
    ctx.lineTo(x - hw, y + hh);
    ctx.lineTo(x + hw, y + hh);
    ctx.closePath();
    ctx.stroke();
  }
  if (lives >= MAX_LIVES) {
    const x = (left + shown * (iconW + gap)) * toX;
    const y = (top + iconH / 2) * toY;
    ctx.fillStyle = "#fff";
    ctx.font = Math.max(8, iconH * 0.55 * toY) + "px Courier New";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("max", x, y);
  }
}

function startBossTest(which) {
  const waveNumber = which === 10 ? 10 : 5;
  if (gameOver) return;
  if (waveNumber === 5 && bossDebug) {
    bossDebug = false;
    syncStageLabel();
    return;
  }
  if (waitingToStart) beginGame();
  rocks = [];
  clusters = [];
  clusterSeekers = [];
  bullets = [];
  stopAllBombFlightSounds();
  bombs = [];
  bombWaves = [];
  ufos = [];
  stopAllUfoSounds();
  boss = null;
  bossPulses = [];
  bossBullets = [];
  stopBossMusic();
  wave = waveNumber;
  shockwaveUsedThisWave = false;
  bossDebug = true;
  beginWaveIntro("WAVE " + wave + " . BOSS", bossNameForWave(wave), "boss");
  syncStageLabel();
}

function drawWaveBanner() {
  if (waveBanner <= 0 || waitingToStart) return;
  ctx.save();
  ctx.globalAlpha = waveBannerDuration > 0 ? Math.max(0, waveBanner / waveBannerDuration) : 0;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const textHalf = 24;
  const subHalf = 12;
  const shipTop = H / 2 - ship.radius;
  const blockBelow = waveBannerSub ? 46 + subHalf : textHalf;
  const titleY = Math.max(textHalf + 8, shipTop - 28 - blockBelow);
  ctx.fillStyle = "#fff";
  ctx.font = "46px Courier New";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "3px";
  ctx.fillText(waveBannerText, W / 2, titleY);
  if (waveBannerSub) {
    ctx.fillStyle = "#ff3333";
    ctx.font = "18px Courier New";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "7px";
    ctx.fillText(waveBannerSub, W / 2, titleY + 46);
  }
  ctx.restore();
}

function drawHitFlash() {
  if (hitFlash <= 0) return;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillRect(-10, -10, W + 20, H + 20);
  hitFlash = 0;
}

// --- Bullets ---
let lastShot = 0;
const SHOT_COOLDOWN = 200;

function drawPickupLetter(type) {
  const letter = type === "rapid" ? "R" : type === "triple" ? "3" : type === "bomb" ? "B" : "";
  if (!letter) return;
  ctx.fillStyle = "#4da3ff";
  ctx.font = "bold 12px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, 0, type === "bomb" ? 2 : 0);
}

function spawnBullet(spread) {
  const angle = ship.angle + spread;
  const noseX = ship.x + Math.cos(ship.angle) * (ship.radius + 6);
  const noseY = ship.y + Math.sin(ship.angle) * (ship.radius + 6);
  bullets.push({
    x: noseX,
    y: noseY,
    prevX: noseX,
    prevY: noseY,
    vx: Math.cos(angle) * 10 + ship.vx * 0.5,
    vy: Math.sin(angle) * 10 + ship.vy * 0.5,
    life: 80,
  });
}

function shoot() {
  const now = Date.now();
  const cooldown = rapidTimer > 0 ? SHOT_COOLDOWN * 0.45 : SHOT_COOLDOWN;
  if (now - lastShot < cooldown) return;
  lastShot = now;

  if (tripleTimer > 0) {
    spawnBullet(-0.16);
    spawnBullet(0);
    spawnBullet(0.16);
  } else {
    spawnBullet(0);
  }
  playLaserSound();
}

function updateBullets(dt) {
  const ts = timeScale(dt);
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.prevX = b.x;
    b.prevY = b.y;
    b.x += b.vx * ts;
    b.y += b.vy * ts;
    b.life -= ts;
    if (b.life <= 0 || b.x < 0 || b.x > W || b.y < 0 || b.y > H) {
      bullets.splice(i, 1);
    }
  }
}

function fireClusterBomb() {
  if (bombCharges <= 0) return false;
  if (waitingToStart || gameOver || shipBreakActive) return false;
  bombCharges -= 1;
  launchClusterBomb();
  return true;
}

function launchClusterBomb() {
  const angle = ship.angle;
  const x = ship.x + Math.cos(angle) * (ship.radius + 12);
  const y = ship.y + Math.sin(angle) * (ship.radius + 12);
  bombs.push({
    x,
    y,
    angle,
    speed: BOMB_SPEED,
    wiggle: rand(0, Math.PI * 2),
    traveled: 0,
    radius: 7,
  });
  playBombLaunchSound();
  startBombFlightSound(bombs[bombs.length - 1]);
}

function bombHitsObject(bomb) {
  for (const rock of rocks) {
    if (distance(bomb.x, bomb.y, rock.x, rock.y) < rock.radius + bomb.radius) return true;
  }
  for (const ufo of ufos) {
    if (distance(bomb.x, bomb.y, ufo.x, ufo.y) < ufo.radius + bomb.radius) return true;
  }
  for (const cluster of clusters) {
    for (const circle of cluster.circles) {
      const pos = circleWorldPos(cluster, circle);
      if (distance(bomb.x, bomb.y, pos.x, pos.y) < CLUSTER_CIRCLE_R + bomb.radius) return true;
    }
  }
  if (boss) {
    for (const circle of boss.circles) {
      if (!bossCircleReady(circle)) continue;
      const pos = circleWorldPos(boss, circle);
      if (distance(bomb.x, bomb.y, pos.x, pos.y) < CLUSTER_CIRCLE_R + bomb.radius) return true;
    }
  }
  return false;
}

function detonateBomb(bomb) {
  bombWaves.push({
    x: bomb.x,
    y: bomb.y,
    radius: 6,
    maxRadius: BOMB_WAVE_MAX,
    speed: BOMB_WAVE_SPEED,
    hitSet: new WeakSet(),
  });
  screenShake = 10;
  playBombExplodeSound();
}

function destroyClusterAt(index) {
  const cluster = clusters[index];
  addSplashBurst(cluster.x, cluster.y, cluster.radius, 30, "#ff3333");
  addScore(CLUSTER_CLEAR_SCORE, cluster.x, cluster.y);
  playClusterClearSound();
  clusters.splice(index, 1);
}

function pushShipFromBombWave(wave) {
  if (wave.pushedShip || gameOver || waitingToStart || shipBreakActive) return;
  const dist = distance(wave.x, wave.y, ship.x, ship.y);
  const touches = dist <= wave.radius + ship.radius;
  if (!touches) return;
  wave.pushedShip = true;
  let dx = ship.x - wave.x;
  let dy = ship.y - wave.y;
  let len = Math.hypot(dx, dy);
  if (len < 0.01) {
    dx = Math.cos(ship.angle);
    dy = Math.sin(ship.angle);
    len = 1;
  }
  const nx = dx / len;
  const ny = dy / len;
  ship.x += nx * 52;
  ship.y += ny * 52;
  ship.vx += nx * 4.6;
  ship.vy += ny * 4.6;
  wrapPosition(ship);
}

function applyBombWave(wave, ts) {
  pushShipFromBombWave(wave);
  damageBossWithWave(wave, ts, BOSS_BOMB_REACH);
  damageBossBulletsWithWave(wave, ts);
  for (let j = rocks.length - 1; j >= 0; j--) {
    const rock = rocks[j];
    if (wave.hitSet.has(rock)) continue;
    const dist = distance(wave.x, wave.y, rock.x, rock.y);
    const touches =
      wave.radius >= dist - rock.radius &&
      wave.radius <= dist + rock.radius + wave.speed * ts;
    if (!touches) continue;
    wave.hitSet.add(rock);
    breakRock(rock, j);
  }

  for (let k = ufos.length - 1; k >= 0; k--) {
    const ufo = ufos[k];
    if (wave.hitSet.has(ufo)) continue;
    const dist = distance(wave.x, wave.y, ufo.x, ufo.y);
    const touches =
      wave.radius >= dist - ufo.radius &&
      wave.radius <= dist + ufo.radius + wave.speed * ts;
    if (!touches) continue;
    wave.hitSet.add(ufo);
    destroyUfo(k);
  }

  for (let c = clusters.length - 1; c >= 0; c--) {
    const cluster = clusters[c];
    if (wave.hitSet.has(cluster)) continue;
    let touches = wave.radius >= distance(wave.x, wave.y, cluster.x, cluster.y) - cluster.radius
      && wave.radius <= distance(wave.x, wave.y, cluster.x, cluster.y) + cluster.radius + wave.speed * ts;
    if (!touches) {
      for (const circle of cluster.circles) {
        const pos = circleWorldPos(cluster, circle);
        const dist = distance(wave.x, wave.y, pos.x, pos.y);
        if (wave.radius >= dist - CLUSTER_CIRCLE_R && wave.radius <= dist + CLUSTER_CIRCLE_R + wave.speed * ts) {
          touches = true;
          break;
        }
      }
    }
    if (!touches) continue;
    wave.hitSet.add(cluster);
    destroyClusterAt(c);
  }

  for (let s = clusterSeekers.length - 1; s >= 0; s--) {
    const seeker = clusterSeekers[s];
    if (wave.hitSet.has(seeker)) continue;
    const dist = distance(wave.x, wave.y, seeker.x, seeker.y);
    const touches = wave.radius >= dist - seeker.radius
      && wave.radius <= dist + seeker.radius + wave.speed * ts;
    if (!touches) continue;
    wave.hitSet.add(seeker);
    popClusterSeeker(s);
  }
}

function updateBombs(dt) {
  const ts = timeScale(dt);
  for (let i = bombs.length - 1; i >= 0; i--) {
    const bomb = bombs[i];
    bomb.wiggle += 0.22 * ts;
    const side = bomb.angle + Math.PI / 2;
    const wobble = Math.sin(bomb.wiggle) * 1.7;
    const step = bomb.speed * ts;
    bomb.x += (Math.cos(bomb.angle) * bomb.speed + Math.cos(side) * wobble) * ts;
    bomb.y += (Math.sin(bomb.angle) * bomb.speed + Math.sin(side) * wobble) * ts;
    bomb.traveled += step;
    if (bomb.x < 0) bomb.x += W;
    else if (bomb.x > W) bomb.x -= W;
    if (bomb.y < 0) bomb.y += H;
    else if (bomb.y > H) bomb.y -= H;
    addBombSmoke(bomb);
    if (bomb.traveled >= BOMB_RANGE || bombHitsObject(bomb)) {
      stopBombFlightSound(bomb);
      detonateBomb(bomb);
      bombs.splice(i, 1);
    }
  }

  for (let i = bombWaves.length - 1; i >= 0; i--) {
    const wave = bombWaves[i];
    wave.radius += wave.speed * ts;
    applyBombWave(wave, ts);
    if (wave.radius >= wave.maxRadius) bombWaves.splice(i, 1);
  }
}

function drawBombs() {
  ctx.strokeStyle = "#4da3ff";
  ctx.lineWidth = 2;
  for (const bomb of bombs) {
    ctx.save();
    ctx.translate(bomb.x, bomb.y);
    ctx.rotate(bomb.angle);
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-6, 4.5);
    ctx.lineTo(-6, -4.5);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

function drawBombWaves() {
  ctx.strokeStyle = "#4da3ff";
  ctx.lineWidth = 3;
  for (const wave of bombWaves) {
    ctx.globalAlpha = Math.max(0.25, 1 - wave.radius / wave.maxRadius);
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawBullets() {
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  for (const b of bullets) {
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.vx * 0.5, b.y - b.vy * 0.5);
    ctx.stroke();
  }
}

// --- Ship ---
function updateShip(dt) {
  updateJoystickInput();
  const ts = timeScale(dt);

  let thrusting = false;

  if (inputMode === "mobile") {
    thrusting = updateMobileShip(dt);
  } else {
    updateDesktopMouseShip(dt);
    thrusting = applyDesktopMoveKeys(ts);
  }

  // Light friction keeps drift manageable
  const friction = Math.pow(ship.friction, ts);
  ship.vx *= friction;
  ship.vy *= friction;

  // Cap max speed
  const speed = shipSpeed();
  if (speed > shipMaxSpeed()) {
    ship.vx = (ship.vx / speed) * shipMaxSpeed();
    ship.vy = (ship.vy / speed) * shipMaxSpeed();
  }

  ship.x += ship.vx * ts;
  ship.y += ship.vy * ts;
  wrapPosition(ship);

  // Smoke trail — intensity scales with thrust strength and speed
  if (thrusting) {
    const thrustIntensity = inputMode === "mobile" ? joystick.power : 1;
    const speedRatio = speed / shipMaxSpeed();
    const spawnChance = (0.3 + speedRatio * 0.7) * thrustIntensity * ts;
    const spawnCount = speedRatio > 0.5 ? 2 : 1;
    if (Math.random() < spawnChance) {
      for (let i = 0; i < spawnCount; i++) addSmokeParticle();
    }
  }

  if (inputMode === "desktop" && (keys.Space || mouse.leftDown)) shoot();
  if (inputMode === "mobile" && mobileInput.fire) shoot();
}

function getShipVertices() {
  const tipX = ship.x + Math.cos(ship.angle) * ship.radius;
  const tipY = ship.y + Math.sin(ship.angle) * ship.radius;
  const leftX = ship.x + Math.cos(ship.angle + 2.5) * ship.radius * 0.7;
  const leftY = ship.y + Math.sin(ship.angle + 2.5) * ship.radius * 0.7;
  const rightX = ship.x + Math.cos(ship.angle - 2.5) * ship.radius * 0.7;
  const rightY = ship.y + Math.sin(ship.angle - 2.5) * ship.radius * 0.7;
  return [
    { x: tipX, y: tipY },
    { x: leftX, y: leftY },
    { x: rightX, y: rightY },
  ];
}

function createShipDebris() {
  const [tip, left, right] = getShipVertices();
  const edges = [
    [tip, left],
    [left, right],
    [right, tip],
  ];

  shipDebris = edges.map(([a, b]) => {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const outwardAngle = Math.atan2(my - ship.y, mx - ship.x);
    const speed = rand(1.5, 3.5);
    return {
      x: mx,
      y: my,
      ax: a.x - mx,
      ay: a.y - my,
      bx: b.x - mx,
      by: b.y - my,
      angle: ship.angle,
      spin: rand(-0.1, 0.1),
      vx: Math.cos(outwardAngle) * speed + ship.vx * 0.4,
      vy: Math.sin(outwardAngle) * speed + ship.vy * 0.4,
      life: 1,
      decay: 0.008,
      canSplit: true,
    };
  });
}

function debrisWorldPoint(piece, lx, ly) {
  const cos = Math.cos(piece.angle);
  const sin = Math.sin(piece.angle);
  return {
    x: piece.x + lx * cos - ly * sin,
    y: piece.y + lx * sin + ly * cos,
  };
}

function makeDebrisSegment(a, b, vx, vy, life) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  return {
    x: mx,
    y: my,
    ax: a.x - mx,
    ay: a.y - my,
    bx: b.x - mx,
    by: b.y - my,
    angle: 0,
    spin: rand(-0.14, 0.14),
    vx,
    vy,
    life,
    decay: 0.00594,
    canSplit: false,
  };
}

function splitDebrisPiece(piece) {
  const a = debrisWorldPoint(piece, piece.ax, piece.ay);
  const b = debrisWorldPoint(piece, piece.bx, piece.by);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const side = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
  const kick = 0.9;
  return [
    makeDebrisSegment(a, mid, piece.vx + Math.cos(side) * kick, piece.vy + Math.sin(side) * kick, 0.95),
    makeDebrisSegment(mid, b, piece.vx - Math.cos(side) * kick, piece.vy - Math.sin(side) * kick, 0.95),
  ];
}

function updateShipDebris(dt) {
  const ts = timeScale(dt);
  const drag = Math.pow(0.985, ts);
  const next = [];
  for (const piece of shipDebris) {
    piece.x += piece.vx * ts;
    piece.y += piece.vy * ts;
    piece.angle += piece.spin * ts;
    piece.vx *= drag;
    piece.vy *= drag;
    piece.life -= piece.decay * ts;
    if (piece.life <= 0) continue;
    if (piece.canSplit && piece.life <= 0.86) {
      next.push(...splitDebrisPiece(piece));
    } else {
      next.push(piece);
    }
  }
  shipDebris = next;
}

function drawShipDebris() {
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  for (const piece of shipDebris) {
    ctx.save();
    ctx.globalAlpha = piece.life;
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.angle);
    ctx.beginPath();
    ctx.moveTo(piece.ax, piece.ay);
    ctx.lineTo(piece.bx, piece.by);
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawShip() {
  if (performance.now() < invincibleUntil && Math.floor(performance.now() / 90) % 2 === 0) return;
  const [tip, left, right] = getShipVertices();

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  if (shieldCharges > 0) {
    ctx.strokeStyle = "#4da3ff";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, shipShieldRadius(), 0, Math.PI * 2);
    if (shieldCharges > 1) {
      const inner = shipShieldRadius() - 5;
      ctx.moveTo(ship.x + inner, ship.y);
      ctx.arc(ship.x, ship.y, inner, 0, Math.PI * 2);
    }
    ctx.stroke();
    ctx.strokeStyle = "#fff";
  }
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(right.x, right.y);
  ctx.closePath();
  ctx.stroke();
}

// --- Rocks ---
function updateRocks(dt) {
  const ts = timeScale(dt);
  for (const rock of rocks) {
    rock.x += rock.vx * ts;
    rock.y += rock.vy * ts;
    rock.angle += rock.spin * ts;
    wrapPosition(rock);
  }
  resolveRockCollisions();
}

function drawRocks() {
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  for (const rock of rocks) {
    ctx.save();
    ctx.translate(rock.x, rock.y);
    ctx.rotate(rock.angle);
    ctx.beginPath();
    const pts = rock.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    if (rock.hidesCluster2) {
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, rock.radius * 0.42, 0, Math.PI * 2);
      ctx.moveTo(2.2, 0);
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (rock.hidesCluster) {
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, rock.radius * 0.48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
}

function clearSpawnFromShip(obj) {
  if (shipBreakActive || gameOver || waitingToStart) return;
  const reach = (obj.radius || 0) + ship.radius + 8;
  let dx = obj.x - ship.x;
  let dy = obj.y - ship.y;
  let dist = Math.hypot(dx, dy);
  if (dist >= reach) return;
  if (dist < 0.01) {
    dx = Math.cos(ship.angle + Math.PI);
    dy = Math.sin(ship.angle + Math.PI);
    dist = 1;
  }
  obj.x = ship.x + (dx / dist) * reach;
  obj.y = ship.y + (dy / dist) * reach;
  if (obj.pushX != null) {
    obj.pushX += (dx / dist) * 1.4;
    obj.pushY += (dy / dist) * 1.4;
  } else {
    obj.vx = (obj.vx || 0) + (dx / dist) * 1.4;
    obj.vy = (obj.vy || 0) + (dy / dist) * 1.4;
  }
  wrapPosition(obj);
}

function breakRock(rock, index, chain) {
  if (chain) addChainScore(rock.score, rock.x, rock.y);
  else addScore(rock.score, rock.x, rock.y);

  const x = rock.x;
  const y = rock.y;

  playRockHitSound();
  playExplosionSound(rock.size);

  if (rock.size === "large") {
    screenShake = 16;
    let cluster = null;
    if (rock.hidesCluster2) cluster = createCluster(x, y, "cluster2");
    else if (rock.hidesCluster) cluster = createCluster(x, y);
    if (cluster) {
      clusters.push(cluster);
      clearSpawnFromShip(cluster);
    }
    maybeDropPickup(x, y);
    addRockDotBurst(x, y, rock.radius, 28);
    const pieceCount = Math.floor(rand(2, 4));
    for (let i = 0; i < pieceCount; i++) {
      const vel = randomVelocity(0.4, 1.2);
      let px = x;
      let py = y;
      if (cluster) {
        const ang = rand(0, Math.PI * 2);
        const dist = cluster.radius + ROCK_SIZES.medium.radius + 6;
        px += Math.cos(ang) * dist;
        py += Math.sin(ang) * dist;
        vel.vx += Math.cos(ang) * 0.8;
        vel.vy += Math.sin(ang) * 0.8;
      }
      const piece = createRock(px, py, "medium", vel.vx, vel.vy);
      clearSpawnFromShip(piece);
      rocks.push(piece);
    }
  } else if (rock.size === "medium") {
    addRockDotBurst(x, y, rock.radius, 16);
    for (let i = 0; i < 2; i++) {
      const vel = randomVelocity(0.8, 2.0);
      const piece = createRock(
        x, y, "small",
        vel.vx,
        vel.vy
      );
      clearSpawnFromShip(piece);
      rocks.push(piece);
    }
  } else {
    addRockDotBurst(x, y, rock.radius, 8);
  }

  rocks.splice(index, 1);
}

function markNearMiss(obj, x, y, touchDist) {
  if (!shipCanBeHit() || obj.nearMissed) return;
  const dist = distance(ship.x, ship.y, x, y);
  if (dist < touchDist || dist > touchDist + NEAR_MISS_BAND) return;
  obj.nearMissed = true;
  addScore(NEAR_MISS_SCORE, ship.x, ship.y - 14, "CLOSE");
  hitFlash = Math.max(hitFlash, 0.35);
}

function updateNearMisses() {
  if (!shipCanBeHit()) return;
  for (const rock of rocks) {
    markNearMiss(rock, rock.x, rock.y, rock.radius + ship.radius - 4);
  }
  for (const ufo of ufos) {
    markNearMiss(ufo, ufo.x, ufo.y, ufo.radius + ship.radius - 4);
  }
  for (const seeker of clusterSeekers) {
    markNearMiss(seeker, seeker.x, seeker.y, seeker.radius + ship.radius - 2);
  }
  for (const shot of bossBullets) {
    markNearMiss(shot, shot.x, shot.y, shot.radius + ship.radius - 2);
  }
  for (const cluster of clusters) {
    if (cluster.grace > 0) continue;
    for (const circle of cluster.circles) {
      const pos = circleWorldPos(cluster, circle);
      markNearMiss(circle, pos.x, pos.y, CLUSTER_CIRCLE_R + ship.radius - 2);
    }
  }
}

function checkCollisions() {
  // Bullet vs rock
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    let hit = false;

    for (let j = rocks.length - 1; j >= 0; j--) {
      const rock = rocks[j];
      if (distance(b.x, b.y, rock.x, rock.y) < rock.radius) {
        bullets.splice(i, 1);
        breakRock(rock, j, true);
        hit = true;
        break;
      }
    }
    if (hit) continue;

    if (bulletHitsCluster(b) || bulletHitsBoss(b) || bulletHitsSeeker(b)) {
      bullets.splice(i, 1);
      continue;
    }

    for (let n = bossBullets.length - 1; n >= 0; n--) {
      const shot = bossBullets[n];
      if (distance(b.x, b.y, shot.x, shot.y) >= shot.radius + 2) continue;
      bullets.splice(i, 1);
      addSplashBurst(shot.x, shot.y, shot.radius * 1.4, 6, "#ff3333");
      bossBullets.splice(n, 1);
      hit = true;
      break;
    }
    if (hit) continue;

    for (let k = ufos.length - 1; k >= 0; k--) {
      const ufo = ufos[k];
      if (distance(b.x, b.y, ufo.x, ufo.y) < ufo.radius) {
        bullets.splice(i, 1);
        destroyUfo(k, true);
        break;
      }
    }
  }

  collectPickup();
  updateNearMisses();

  if (gameOver || shipBreakActive || waitingToStart) return;

  if (!shipCanBeHit()) {
    separateShipFromHazards();
    for (let i = bossBullets.length - 1; i >= 0; i--) {
      const bullet = bossBullets[i];
      if (distance(ship.x, ship.y, bullet.x, bullet.y) < bullet.radius + ship.radius) {
        bossBullets.splice(i, 1);
      }
    }
    for (let s = clusterSeekers.length - 1; s >= 0; s--) {
      const seeker = clusterSeekers[s];
      if (distance(ship.x, ship.y, seeker.x, seeker.y) < seeker.radius + ship.radius) {
        clusterSeekers.splice(s, 1);
      }
    }
    return;
  }

  for (const rock of rocks) {
    if (distance(ship.x, ship.y, rock.x, rock.y) < rock.radius + ship.radius - 4) {
      hurtShip();
      return;
    }
  }

  for (let i = ufos.length - 1; i >= 0; i--) {
    const ufo = ufos[i];
    if (distance(ship.x, ship.y, ufo.x, ufo.y) < ufo.radius + ship.radius - 4) {
      destroyUfo(i);
      hurtShip();
      return;
    }
  }

  for (let c = clusters.length - 1; c >= 0; c--) {
    const cluster = clusters[c];
    if (popCirclesTouchedByShield(cluster, c)) {
      hurtShip();
      return;
    }
    if (shipHitsCluster(cluster)) {
      hurtShip();
      return;
    }
  }

  if (shieldHitsBoss()) {
    hurtShip();
    return;
  }
  if (shipHitsBoss()) {
    hurtShip();
    return;
  }

  for (let i = bossBullets.length - 1; i >= 0; i--) {
    const bullet = bossBullets[i];
    if (distance(ship.x, ship.y, bullet.x, bullet.y) >= bullet.radius + ship.radius - 2) continue;
    bossBullets.splice(i, 1);
    hurtShip();
    return;
  }

  for (let s = clusterSeekers.length - 1; s >= 0; s--) {
    const seeker = clusterSeekers[s];
    if (distance(ship.x, ship.y, seeker.x, seeker.y) >= seeker.radius + ship.radius - 2) continue;
    popClusterSeeker(s);
    hurtShip();
    return;
  }
}

// --- Drawing ---
function drawGameOver() {
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";

  const mobile = inputMode === "mobile";
  let titleSize = mobile ? Math.max(16, H * 0.055) : 36;
  let scoreSize = mobile ? Math.max(11, H * 0.032) : 22;
  let headingSize = mobile ? Math.max(10, H * 0.028) : 20;
  let entrySize = mobile ? Math.max(9, H * 0.025) : 18;
  let hintSize = mobile ? Math.max(9, H * 0.024) : 18;
  let lineGap = mobile ? Math.max(14, H * 0.048) : 30;
  let afterTitle = mobile ? H * 0.07 : 42;
  let afterScore = mobile ? H * 0.06 : 46;
  let afterHeading = mobile ? H * 0.055 : 34;
  let beforeHint = mobile ? H * 0.06 : 44;

  const blockHeight = () => titleSize + afterTitle + afterScore + afterHeading
    + lineGap * (MAX_HIGH_SCORES - 1) + beforeHint + hintSize;
  const limit = H * 0.86;
  if (blockHeight() > limit) {
    const scale = limit / blockHeight();
    titleSize *= scale;
    scoreSize *= scale;
    headingSize *= scale;
    entrySize *= scale;
    hintSize *= scale;
    lineGap *= scale;
    afterTitle *= scale;
    afterScore *= scale;
    afterHeading *= scale;
    beforeHint *= scale;
  }

  let y = (H - blockHeight()) / 2 + titleSize;

  ctx.font = `${titleSize}px Courier New`;
  ctx.fillText("GAME OVER", W / 2, y);

  y += afterTitle;
  ctx.font = `${scoreSize}px Courier New`;
  ctx.fillText("Score: " + score, W / 2, y);

  y += afterScore;
  ctx.font = `${headingSize}px Courier New`;
  ctx.fillText("HIGH SCORES", W / 2, y);

  y += afterHeading;
  ctx.font = `${entrySize}px Courier New`;
  ctx.textAlign = "left";
  const rows = [];
  for (let i = 0; i < MAX_HIGH_SCORES; i++) {
    const entry = highScores[i];
    const value = scoreValue(entry);
    const waveReached = scoreWave(entry);
    rows.push({
      rank: (i + 1) + ".",
      score: value == null ? "---" : String(value),
      wave: waveReached == null ? "" : "WAVE " + waveReached,
      latest: value === score && score > 0,
    });
  }
  const gap = mobile ? 18 : 36;
  const colW = [0, 0, ctx.measureText("WAVE 00").width];
  for (const row of rows) {
    colW[0] = Math.max(colW[0], ctx.measureText(row.rank).width);
    colW[1] = Math.max(colW[1], ctx.measureText(row.score).width);
    if (row.wave) colW[2] = Math.max(colW[2], ctx.measureText(row.wave).width);
  }
  const gridW = colW[0] + colW[1] + colW[2] + gap * 2;
  const gridX = (W - gridW) / 2;
  const colX = [gridX, gridX + colW[0] + gap, gridX + colW[0] + gap + colW[1] + gap];
  for (const row of rows) {
    const cells = [row.rank, row.score, row.wave];
    for (let c = 0; c < 3; c++) {
      if (!cells[c]) continue;
      const textW = ctx.measureText(cells[c]).width;
      ctx.fillText(cells[c], colX[c] + (colW[c] - textW) / 2, y);
    }
    if (row.latest) ctx.fillText("*", gridX + gridW + (mobile ? 10 : 16), y);
    y += lineGap;
  }
  y -= lineGap;
  ctx.textAlign = "center";

  y += beforeHint;
  ctx.font = `${hintSize}px Courier New`;
  const restartHint = mobile
    ? "Tap screen to return to title"
    : "Press SPACE to return to title";
  ctx.fillText(restartHint, W / 2, y);
  ctx.textAlign = "left";
}

let stars = [];

function createStarfield() {
  stars = [];
  const count = Math.max(36, Math.round((W * H) / 7500));
  for (let i = 0; i < count; i++) {
    const near = i >= count * 0.62;
    stars.push({
      x: rand(0, W),
      y: rand(0, H),
      speed: near ? rand(16, 28) : rand(6, 12),
      drift: rand(-0.18, 0.18),
      size: near ? rand(1.4, 2) : 1,
      alpha: near ? rand(0.55, 0.9) : rand(0.22, 0.42),
    });
  }
}

function updateStars(dt) {
  if (!stars.length) createStarfield();
  for (const star of stars) {
    star.x -= star.speed * dt;
    star.y += star.speed * star.drift * dt;
    if (star.x < 0) star.x += W;
    else if (star.x >= W) star.x -= W;
    if (star.y < 0) star.y += H;
    else if (star.y >= H) star.y -= H;
  }
}

function pointInTri(px, py, a, b, c) {
  const ab = (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x);
  const bc = (c.x - b.x) * (py - b.y) - (c.y - b.y) * (px - b.x);
  const ca = (a.x - c.x) * (py - c.y) - (a.y - c.y) * (px - c.x);
  return (ab >= 0 && bc >= 0 && ca >= 0) || (ab <= 0 && bc <= 0 && ca <= 0);
}

function starInsideRock(rock, x, y) {
  const dx = x - rock.x;
  const dy = y - rock.y;
  if (dx * dx + dy * dy > rock.radius * rock.radius) return false;
  const cos = Math.cos(rock.angle);
  const sin = Math.sin(rock.angle);
  const lx = dx * cos + dy * sin;
  const ly = -dx * sin + dy * cos;
  const pts = rock.points;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x;
    const yi = pts[i].y;
    const xj = pts[j].x;
    const yj = pts[j].y;
    if ((yi > ly) !== (yj > ly) && lx < ((xj - xi) * (ly - yi)) / (yj - yi + 0.00001) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function starInsideShip(x, y) {
  if (shipBreakActive || gameOver) return false;
  const pad = 3;
  const grown = getShipVertices().map((v) => {
    const dx = v.x - ship.x;
    const dy = v.y - ship.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: v.x + (dx / len) * pad, y: v.y + (dy / len) * pad };
  });
  return pointInTri(x, y, grown[0], grown[1], grown[2]);
}

function starIsCovered(x, y) {
  for (const rock of rocks) {
    if (starInsideRock(rock, x, y)) return true;
  }
  for (const ufo of ufos) {
    const reach = Math.max(ufo.radius, ((ufo.visualRadius || 32) * 0.5) * 1.25);
    if (distance(x, y, ufo.x, ufo.y) < reach) return true;
  }
  for (const cluster of clusters) {
    for (const circle of cluster.circles) {
      const pos = circleWorldPos(cluster, circle);
      if (distance(x, y, pos.x, pos.y) < CLUSTER_CIRCLE_R) return true;
    }
  }
  if (boss) {
    for (const circle of boss.circles) {
      if (!circle.alive) continue;
      const pos = circleWorldPos(boss, circle);
      if (distance(x, y, pos.x, pos.y) < CLUSTER_CIRCLE_R * (circle.grow || 1)) return true;
    }
  }
  return starInsideShip(x, y);
}

function drawStars() {
  ctx.fillStyle = "#fff";
  for (const star of stars) {
    if (starIsCovered(star.x, star.y)) continue;
    ctx.globalAlpha = star.alpha;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  ctx.globalAlpha = 1;
}

function updateScreenShake(dt) {
  if (screenShake <= 0) return;
  const ts = timeScale(dt);
  screenShake *= Math.pow(0.85, ts);
  if (screenShake < 0.5) screenShake = 0;
}

function draw() {
  const pixelScale = canvas.width / W;
  ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
  ctx.save();

  // Screen shake
  if (screenShake > 0) {
    const shakeX = rand(-screenShake, screenShake);
    const shakeY = rand(-screenShake, screenShake);
    ctx.translate(shakeX, shakeY);
  }

  ctx.fillStyle = "#000";
  ctx.fillRect(-10, -10, W + 20, H + 20);
  drawStars();

  if (shipBreakActive && !pendingRespawn) {
    drawParticles();
    drawShipDebris();
  } else if (!gameOver) {
    drawRocks();
    drawClusters();
    drawBoss();
    drawUfos();
    drawPickup();
    drawBullets();
    drawBombs();
    drawParticles();
    drawClusterSeekers();
    drawShockwaves();
    drawBombWaves();
    if (!shipBreakActive) drawShip();
    drawShipDebris();
    drawScorePopups();
    drawWaveBanner();
    drawHitFlash();
    if (lives === 1 && !shipBreakActive) {
      const pulse = 0.08 + Math.abs(Math.sin(performance.now() * 0.006)) * 0.08;
      const edge = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
      edge.addColorStop(0, "rgba(0,0,0,0)");
      edge.addColorStop(1, "rgba(120,0,0," + pulse.toFixed(3) + ")");
      ctx.fillStyle = edge;
      ctx.fillRect(-10, -10, W + 20, H + 20);
    }
  } else {
    drawGameOver();
    drawShipDebris();
  }

  ctx.restore();
  if (!waitingToStart && !gameOver) drawLives();
}

// --- Game loop ---
function update(currentTime) {
  const dt = Math.min((currentTime - lastFrameTime) / 1000, MAX_DELTA_TIME);
  lastFrameTime = currentTime;
  updateStars(dt);
  scheduleTitleMusic();
  scheduleBossMusic();

  if (!waitingToStart && !gameOver && hitStopTimer > 0) {
    hitStopTimer = Math.max(0, hitStopTimer - dt);
  } else if (!waitingToStart && !gameOver) {
    if (chainTimer > 0) {
      chainTimer -= dt;
      if (chainTimer <= 0) {
        chainTimer = 0;
        if (scoreMultiplier !== 1) {
          scoreMultiplier = 1;
          syncScoreLabel();
        }
      }
    }
    if (lives === 1 && !shipBreakActive) {
      lastLifePulse -= dt;
      if (lastLifePulse <= 0) {
        lastLifePulse = 0.85;
        playTone(92, 0.08, 0.05, "sine");
      }
    }
    if (!shipBreakActive) updateShip(dt);
    updateRocks(dt);
    updateUfos(dt);
    if (waveBanner <= 0) updateUfoSpawning(dt);
    updateClusters(dt);
    updateBoss(dt);
    separateRocksFromHazards();
    updatePickup(dt);
    updateBullets(dt);
    updateBombs(dt);
    updateShockwaves(dt);
    checkCollisions();
    if (!shipBreakActive && rocks.length === 0 && !boss && !pendingWaveEnemies && waveBanner <= 0) spawnNextWave();
  }

  if (shipBreakActive) {
    shipBreakTimer += dt;
    const debrisGone = shipDebris.length === 0 && shipBreakTimer > 0.2;
    if (pendingRespawn && debrisGone) {
      shipBreakActive = false;
      pendingRespawn = false;
      const spawn = findRespawnPosition();
      ship.x = spawn.x;
      ship.y = spawn.y;
      ship.angle = -Math.PI / 2;
      ship.vx = 0;
      ship.vy = 0;
      invincibleUntil = performance.now() + INVINCIBLE_MS;
      screenShake = 0;
      separateShipFromHazards();
    } else if (!pendingRespawn && shipBreakTimer >= SHIP_BREAK_DURATION) {
      shipBreakActive = false;
      gameOver = true;
      addHighScore(score, wave);
      particles = [];
      shockwaves = [];
      screenShake = 0;
    }
  }

  updateScreenShake(dt);
  updateWaveUI();
  syncControlFade();
  syncPowerupLabel();
  updateScorePopups(dt);
  updateShipDebris(dt);
  updateParticles(dt);
  draw();
  requestAnimationFrame(update);
}

function resetGame() {
  stopThrustSound();
  score = 0;
  gameOver = false;
  shipBreakActive = false;
  shipBreakTimer = 0;
  shipDebris = [];
  shockwaves = [];
  shockwaveCooldownUntil = 0;
  screenShake = 0;
  particles = [];
  bullets = [];
  stopAllBombFlightSounds();
  bombs = [];
  bombWaves = [];
  ship.x = W / 2;
  ship.y = H / 2;
  ship.angle = -Math.PI / 2;
  ship.vx = 0;
  ship.vy = 0;
  scoreEl.textContent = "Score: 0";
  for (const key in keys) keys[key] = false;
  resetJoystick();
  resetMouse();
  resetUfoSpawning();
  resetArcadeRun(true);
  rocks = [];
  rockCount = 4;
  beginWaveIntro("WAVE 1", "", "rocks");
  updateWaveUI();
}

// --- Start ---
document.addEventListener("visibilitychange", () => {
  if (document.hidden) silenceGameAudio();
  else if (sfx.ctx && sfx.ctx.state === "suspended" && !sfx.muted) {
    sfx.ctx.resume();
    if (ufos.length) onUfoRemoved();
  }
});
window.addEventListener("pagehide", silenceGameAudio);

resizeGame();
setupMobileControls();
setupDesktopMouseControls();
window.addEventListener("resize", resizeGame);
window.addEventListener("orientationchange", () => setTimeout(resizeGame, 80));
document.addEventListener("fullscreenchange", () => {
  if (!apiFullscreen()) document.body.classList.remove("screen-expanded");
  resizeGame();
  syncFullscreenButton();
});
document.addEventListener("webkitfullscreenchange", () => {
  if (!apiFullscreen()) document.body.classList.remove("screen-expanded");
  resizeGame();
  syncFullscreenButton();
});
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resizeGame);
}
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("touchstart", (e) => {
  if (e.target.closest && e.target.closest("#mobile-controls, #game")) e.preventDefault();
}, { passive: false, capture: true });
window.addEventListener("pointerdown", (e) => {
  if (e.target.closest && e.target.closest("#fullscreen-btn")) return;
  resumeAudio();
});
document.getElementById("fullscreen-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  toggleFullscreen();
  resumeAudio();
});
spawnInitialRocks(4);
resetUfoSpawning();
lastFrameTime = performance.now();
requestAnimationFrame(update);
