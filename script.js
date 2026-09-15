/**
 * Project Polaris
 * ============================================================
 * §1  CONFIG          配置
 * §2  QUALITY         性能分级
 * §3  UTILS           工具
 * §4  SPRITES         离屏精灵工厂
 * §5  RESOURCES       资源生命周期
 * §6  STATE           状态
 * §6.5 ORBITAL        弧形导航场景
 * §7  RENDER          渲染
 * §8  LOOP            主循环
 * §9  EVENTS          事件
 * §10 LIFECYCLE       初始化 / 销毁
 * §11 API             对外接口
 * ============================================================
 */

import { createOrbit3D } from './orbit3d.js';

/* ==========================================================
   §1 CONFIG
   ========================================================== */

const CFG = {
  maxDPR: 2,
  targetFPS: 60,
  minFPS: 24,
  fpsSampleSize: 60,
  fpsAdaptCooldown: 3000,
  resizeDebounce: 150,
  smoothFactor: 0.055,
  parallaxStrength: 1.0,

  starBase: 420,
  starMin: 140,
  starMax: 900,
  starLayerDist: [0.58, 0.87],
  parallaxStars: [4, 10, 18],
  starAlpha: { min: 0.22, range: 0.78 },
  starTwinkle: { base: 0.68, amp: 0.32, speedMin: 0.35, speedRange: 1.1 },
  starMinDrawAlpha: 0.015,
  starBrightRatio: 0.02,

  tStars: 0.15,
  tCore: 0.50,
  tOrbit: 0.95,
  tButton: 1.90,
  introStars: 1.1,
  introCore: 1.0,
  introOrbit: 1.2,

  coreRatio: 0.78,
  breathSpeed: 0.18,
  coreDotRadius: 3.2,
  parallaxScene: 8,
  parallaxCore: 3,
  hoverBoost: 0.25,

  azimuthLength: 0.85,
  azimuthWidth: 1,
  azimuthAlpha: 0.12,
  azimuthBreathSpeed: 0.15,

  nebulaPad: 80,
  nebulaParallax: 18,
  nebulaMainRadius: 0.62,
  nebulaSubOffset: [0.22, -0.18],
  nebulaSubRadius: 0.70,
  nebulaDriftSpeed: 0.008,
  nebulaNoiseAlpha: 0.035,

  orbitSegs: 24,
  orbitHeadRadius: 10,
  orbitBaseStrokeWidth: 2.4,
  orbitThinStrokeWidth: 1,
  orbitTailStrokeWidth: 1.4,
  orbitTailFade: 2.5,
  orbitTailBaseAlpha: 0.65,
  orbitBaseAlpha: 0.045,
  orbitThinAlpha: 0.09,
  orbitMinSegAlpha: 0.006,

  meteorEnabled: true,
  meteorRate: 0.0015,
  meteorMax: 3,
  meteorSpeed: [4, 8],
  meteorLife: [1.2, 2.0],
  meteorTailLength: 14,

  transitionDuration: 1200,
  returnDuration: 720,
  orbitalSmoothTime: 90,

  /* 第二幕：进入后的轻推 + 弧线脊柱参数 */
  orbitalAutoDelay: 900,
  orbitalAutoDuration: 1400,
  orbitalAutoTarget: 0.035,
  orbitalSpineSegments: 40,
  orbitalSpineFalloff: 0.16,
  orbitalSpineWidthBase: 1.0,
  orbitalSpineWidthAmp: 2.6,
  orbitalSpineAlphaBase: 0.04,
  orbitalSpineAlphaAmp: 0.68,
  orbitalTrackShiftRatio: 0.34,

  narrowViewport: 720,
  narrowRadiusRatio: 0.34,
  wideRadiusRatio: 0.32,
};

const PALETTES = {
  aurora: {
    bg: '#05070D',
    accent: '125,168,255',
    accentAlt: '168,145,255',
    accentCyan: '110,200,230',
    nebulaPrimary: '58,94,190',
    nebulaSecondary: '38,66,148',
    nebulaAccent: '92,58,168',
  },
  solar: {
    bg: '#0A0705',
    accent: '255,176,110',
    accentAlt: '255,110,140',
    accentCyan: '255,220,150',
    nebulaPrimary: '190,110,58',
    nebulaSecondary: '148,78,38',
    nebulaAccent: '168,88,58',
  },
  mono: {
    bg: '#07070A',
    accent: '220,228,245',
    accentAlt: '180,190,210',
    accentCyan: '200,210,230',
    nebulaPrimary: '90,100,130',
    nebulaSecondary: '60,68,90',
    nebulaAccent: '80,88,110',
  },
};

const COLOR = { ...PALETTES.aurora };

function buildRgbaTable() {
  return {
    accent: `rgba(${COLOR.accent},`,
    accentAlt: `rgba(${COLOR.accentAlt},`,
    accentCyan: `rgba(${COLOR.accentCyan},`,
    white: 'rgba(255,255,255,',
  };
}
let RGBA = buildRgbaTable();

const TAU = Math.PI * 2;

const BLOOM_LAYERS = [
  { scale: 1.55, alpha: 0.10, breathAmp: 0.12 },
  { scale: 1.00, alpha: 0.24, breathAmp: 0.14 },
  { scale: 0.56, alpha: 0.44, breathAmp: 0.17 },
  { scale: 0.24, alpha: 0.80, breathAmp: 0.20 },
];

const ORBITS = [
  { rx: 1.15, ry: 0.46, rot: -0.42, speed:  0.025, phase: 0.10, tail: 0.30,
    alpha: 1.00, tint: 'accent' },
  { rx: 0.78, ry: 0.78, rot:  0.28, speed: -0.017, phase: 0.55, tail: 0.24,
    alpha: 0.65, tint: 'accentAlt' },
  { rx: 1.42, ry: 0.66, rot:  0.92, speed:  0.013, phase: 0.82, tail: 0.34,
    alpha: 0.50, tint: 'accentCyan' },
];

/* ==========================================================
   §2 QUALITY
   ========================================================== */

const QUALITY_PRESETS = {
  high: { dprCap: 2.0, starMul: 1.00, nebula: true,  meteors: true,  noise: true },
  mid:  { dprCap: 1.5, starMul: 0.70, nebula: true,  meteors: true,  noise: false },
  low:  { dprCap: 1.0, starMul: 0.45, nebula: false, meteors: false, noise: false },
};

function detectQualityLevel() {
  if (typeof window === 'undefined') return 'mid';

  const dpr = window.devicePixelRatio || 1;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '');

  let score = 3;
  if (isMobile) score -= 1;
  if (cores <= 4) score -= 1;
  if (mem <= 4) score -= 1;
  if (dpr >= 3) score -= 1;

  if (score >= 3) return 'high';
  if (score >= 1) return 'mid';
  return 'low';
}

/* ==========================================================
   §3 UTILS
   ========================================================== */

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp  = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const seg = (t, start, dur) => clamp((t - start) / dur, 0, 1);
const rand = (a, b) => a + Math.random() * (b - a);

function debounce(fn, wait) {
  let id;
  return function (...args) {
    clearTimeout(id);
    id = setTimeout(() => fn.apply(this, args), wait);
  };
}

function inViewport(x, y, margin, w, h) {
  return x > -margin && x < w + margin && y > -margin && y < h + margin;
}

/* ==========================================================
   §4 SPRITES
   ========================================================== */

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function makeStarSprite(radius, brightness) {
  const pad = 2;
  const size = Math.ceil((radius + pad) * 2);
  const c = makeCanvas(size, size);
  const g = c.getContext('2d');
  const o = size / 2;

  const grd = g.createRadialGradient(o, o, 0, o, o, radius + pad);
  grd.addColorStop(0,    `${RGBA.white}${brightness})`);
  grd.addColorStop(0.30, 'rgba(214,228,255,' + (brightness * 0.65).toFixed(3) + ')');
  grd.addColorStop(1,    'rgba(150,180,255,0)');

  g.fillStyle = grd;
  g.beginPath();
  g.arc(o, o, radius + pad, 0, TAU);
  g.fill();

  return { c, r: radius + pad };
}

function makeBloomSprite(size) {
  const c = makeCanvas(size, size);
  const g = c.getContext('2d');
  const r = size / 2;

  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0.00, 'rgba(255,255,255,1)');
  grd.addColorStop(0.06, `${RGBA.accent}0.98)`);
  grd.addColorStop(0.18, `${RGBA.accent}0.72)`);
  grd.addColorStop(0.38, `${RGBA.accent}0.32)`);
  grd.addColorStop(0.62, `${RGBA.accent}0.10)`);
  grd.addColorStop(0.85, `${RGBA.accent}0.025)`);
  grd.addColorStop(1.00, `${RGBA.accent}0)`);

  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

function makeDotSprite(size) {
  const c = makeCanvas(size, size);
  const g = c.getContext('2d');
  const r = size / 2;

  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0,   'rgba(255,255,255,1)');
  grd.addColorStop(0.3, 'rgba(220,235,255,0.70)');
  grd.addColorStop(0.7, 'rgba(170,200,255,0.15)');
  grd.addColorStop(1,   'rgba(150,180,255,0)');

  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

function applyNebulaNoise(g, w, h) {
  if (!QUALITY.noise) return;

  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const amt = CFG.nebulaNoiseAlpha * 255;

  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amt;
    d[i]     = clamp(d[i]     + n, 0, 255);
    d[i + 1] = clamp(d[i + 1] + n, 0, 255);
    d[i + 2] = clamp(d[i + 2] + n, 0, 255);
  }

  g.putImageData(img, 0, 0);
}

/* ==========================================================
   §5 RESOURCES
   ========================================================== */

const sprites = {
  stars: [],
  starBright: null,
  bloom: null,
  dot: null,
  nebula: null,
  nebulaW: 0,
  nebulaH: 0,
  nebulaDpr: 0,
  nebulaPalette: '',
};

let QUALITY = QUALITY_PRESETS.mid;

function buildSprites() {
  freeSprites();

  sprites.stars = [
    makeStarSprite(0.7, 0.50),
    makeStarSprite(1.1, 0.85),
    makeStarSprite(1.8, 1.00),
  ];
  sprites.bloom = makeBloomSprite(256);
  sprites.dot   = makeDotSprite(96);
  sprites.starBright = makeStarSprite(3.2, 1.0);
}

function freeSprites() {
  const free = (c) => {
    if (c && typeof c === 'object' && 'width' in c) {
      c.width = 0;
      c.height = 0;
    }
  };
  for (const s of sprites.stars) free(s.c);
  sprites.stars = [];
  free(sprites.starBright?.c); sprites.starBright = null;
  free(sprites.bloom);      sprites.bloom = null;
  free(sprites.dot);        sprites.dot = null;
  free(sprites.nebula);     sprites.nebula = null;
  sprites.nebulaW = sprites.nebulaH = sprites.nebulaDpr = 0;
  sprites.nebulaPalette = '';
}

function buildNebula() {
  if (!QUALITY.nebula) {
    freeNebula();
    return;
  }

  const pad = CFG.nebulaPad;
  const w = state.w + pad * 2;
  const h = state.h + pad * 2;
  const dpr = state.dpr;
  const paletteKey = state.paletteKey;

  if (
    sprites.nebula &&
    sprites.nebulaW === w &&
    sprites.nebulaH === h &&
    sprites.nebulaDpr === dpr &&
    sprites.nebulaPalette === paletteKey
  ) return;

  freeNebula();

  const c = makeCanvas(Math.floor(w * dpr), Math.floor(h * dpr));
  const g = c.getContext('2d');
  g.scale(dpr, dpr);

  const cx = w / 2;
  const cy = h / 2;
  const r  = Math.max(w, h) * CFG.nebulaMainRadius;

  const g1 = g.createRadialGradient(cx, cy, 0, cx, cy, r);
  g1.addColorStop(0,    `rgba(${COLOR.nebulaPrimary},0.18)`);
  g1.addColorStop(0.35, `rgba(${COLOR.nebulaSecondary},0.075)`);
  g1.addColorStop(1,    'rgba(0,0,0,0)');
  g.fillStyle = g1;
  g.fillRect(0, 0, w, h);

  const [ox, oy] = CFG.nebulaSubOffset;
  const sx = cx + w * ox;
  const sy = cy + h * oy;
  const sr = r * CFG.nebulaSubRadius;
  const g2 = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
  g2.addColorStop(0, `rgba(${COLOR.nebulaAccent},0.08)`);
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = g2;
  g.fillRect(0, 0, w, h);

  if (QUALITY.noise) {
    try { applyNebulaNoise(g, c.width, c.height); }
    catch (_) { /* 保护 */ }
  }

  sprites.nebula = c;
  sprites.nebulaW = w;
  sprites.nebulaH = h;
  sprites.nebulaDpr = dpr;
  sprites.nebulaPalette = paletteKey;
}

function freeNebula() {
  if (sprites.nebula) {
    sprites.nebula.width = 0;
    sprites.nebula.height = 0;
    sprites.nebula = null;
  }
  sprites.nebulaW = sprites.nebulaH = sprites.nebulaDpr = 0;
  sprites.nebulaPalette = '';
}

/* ==========================================================
   §6 STATE
   ========================================================== */

const state = {
  w: 0, h: 0, dpr: 1, R: 0,
  t0: 0,
  pausedAt: 0,
  raf: 0,
  lastFrame: 0,
  reduced: false,
  btnShown: false,
  destroyed: false,
  px: 0, py: 0,
  cx: 0, cy: 0,
  hoverBoost: 0,
  targetBoost: 0,
  paletteKey: 'aurora',

  scene: 'hero',

  frameTimes: new Float32Array(CFG.fpsSampleSize),
  frameIdx: 0,
  frameCount: 0,
  lastAdapt: 0,

  quality: 'mid',
};

let stars = [];
const meteors = [];

/* ==========================================================
   §6.5 CINEMATIC SPATIAL NAVIGATION
   ========================================================== */

let orbitalEl = null;
let backBtn = null;
let orbit3DCanvasEl = null;
let orbit3D = null;
let orbit3DInit = null;
let sceneMeterCurrentEl = null;
let navNodeEls = [];

const panelEls = [];
const spineSegEls = []; // legacy-safe empty collection; no orbit spine is rendered.

let orbitalScrollRaf = 0;
let autoAdvanceToken = 0;
let autoAdvanceRaf = 0;
let autoAdvanceTimer = 0;
let sceneTimer = 0;
let userInteracted = false;

const orbitalMotion = {
  current: 0,
  target: 0,
  last: 0,
  maxScroll: 1,
  active: 0,
};

function sceneIndexForProgress(progress) {
  return clamp(Math.round(clamp(progress, 0, 1) * 4), 0, 4);
}

function syncScene(active) {
  const index = clamp(active, 0, Math.max(0, panelEls.length - 1));
  orbitalMotion.active = index;

  panelEls.forEach((panel, i) => {
    const isActive = i === index;
    panel.classList.toggle('is-active', isActive);
    panel.classList.toggle('is-before', i < index);
    panel.classList.toggle('is-after', i > index);
    panel.setAttribute('aria-hidden', String(!isActive));
    panel.inert = !isActive;
  });

  if (sceneMeterCurrentEl) {
    sceneMeterCurrentEl.textContent = String(index + 1).padStart(2, '0');
  }

  // v10 fixed left navigator: current lit, next dimly lit, rest quiet.
  navNodeEls.forEach((node, i) => {
    node.classList.toggle('is-current', i === index);
    node.classList.toggle('is-next', i === index + 1);
  });

  document.body.dataset.spatialScene = String(index + 1);
}

function ensureOrbit3D() {
  if (state.destroyed || !orbit3DCanvasEl) return Promise.resolve(false);

  if (!orbit3D) {
    orbit3D = createOrbit3D({
      canvas: orbit3DCanvasEl,
      getQuality: () => state.quality,
      getReducedMotion: () => state.reduced,
    });
  }

  if (!orbit3DInit) {
    orbit3DInit = orbit3D.init()
      .then((ok) => {
        if (!ok || state.destroyed) return false;
        document.body.classList.add('spatial-3d-ready');
        orbit3D.resize();
        orbit3D.setProgress(orbitalMotion.current);
        if ((state.scene === 'transitioning' || state.scene === 'orbital') && !document.hidden) {
          orbit3D.start();
        }
        return true;
      })
      .catch((err) => {
        console.warn('[Polaris] Spatial 3D unavailable:', err);
        document.body.classList.add('spatial-3d-fallback');
        return false;
      });
  }

  return orbit3DInit;
}

function renderOrbitalAt(progress) {
  const p = clamp(progress, 0, 1);
  orbit3D?.setProgress?.(p);

  const active = sceneIndexForProgress(p);
  if (active !== orbitalMotion.active) syncScene(active);
}

function stopOrbitalMotion() {
  cancelAnimationFrame(orbitalScrollRaf);
  orbitalScrollRaf = 0;
  orbitalMotion.last = 0;
}

function animateOrbital(now) {
  orbitalScrollRaf = 0;
  if (state.scene !== 'orbital' && state.scene !== 'transitioning') return;

  const dt = orbitalMotion.last ? Math.min(now - orbitalMotion.last, 64) : 16.67;
  orbitalMotion.last = now;
  const amount = 1 - Math.exp(-dt / Math.max(1, CFG.orbitalSmoothTime));
  orbitalMotion.current = lerp(orbitalMotion.current, orbitalMotion.target, amount);

  if (Math.abs(orbitalMotion.target - orbitalMotion.current) < 0.00005) {
    orbitalMotion.current = orbitalMotion.target;
    orbitalMotion.last = 0;
  } else {
    orbitalScrollRaf = requestAnimationFrame(animateOrbital);
  }

  renderOrbitalAt(orbitalMotion.current);
}

function onOrbitalScroll() {
  if (!orbitalEl || (state.scene !== 'orbital' && state.scene !== 'transitioning')) return;

  orbitalMotion.target = clamp(
    orbitalEl.scrollTop / Math.max(1, orbitalMotion.maxScroll),
    0,
    1
  );

  if (state.reduced) {
    stopOrbitalMotion();
    orbitalMotion.current = orbitalMotion.target;
    renderOrbitalAt(orbitalMotion.current);
  } else if (!orbitalScrollRaf) {
    orbitalScrollRaf = requestAnimationFrame(animateOrbital);
  }
}

function cancelAutoAdvance() {
  ++autoAdvanceToken;
  clearTimeout(autoAdvanceTimer);
  cancelAnimationFrame(autoAdvanceRaf);
  autoAdvanceTimer = 0;
  autoAdvanceRaf = 0;
}

function onOrbitalInput(e) {
  if (e.type === 'keydown' && !['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) return;
  userInteracted = true;
  cancelAutoAdvance();
}

// Kept as a compatibility no-op. Cinematic scenes should move only when the user scrolls.
function autoAdvanceOrbital() {
  cancelAutoAdvance();
}

function setHeroAvailable(available) {
  if (!heroEl) return;
  heroEl.inert = !available;
  heroEl.setAttribute('aria-hidden', String(!available));
}

function finishEnter() {
  clearTimeout(sceneTimer);
  sceneTimer = 0;
  if (state.scene !== 'transitioning') return;

  state.scene = 'orbital';
  document.body.classList.add('scene-orbital');
  document.body.classList.remove('scene-entering');
  syncScene(sceneIndexForProgress(orbitalMotion.current));

  if (!userInteracted) backBtn?.focus({ preventScroll: true });
  startBackdropLoop();
  orbit3D?.start();
}

function enterOrbital() {
  if (state.scene !== 'hero' || state.destroyed) return;

  state.scene = 'transitioning';
  stopLoop();
  cancelAutoAdvance();
  stopOrbitalMotion();
  userInteracted = false;

  orbitalMotion.current = 0;
  orbitalMotion.target = 0;
  orbitalMotion.active = 0;

  drawOrbitalBackdrop();
  setHeroAvailable(false);
  syncScene(0);

  if (orbitalEl) {
    orbitalEl.inert = false;
    orbitalEl.setAttribute('aria-hidden', 'false');
    orbitalEl.scrollTop = 0;
    orbitalMotion.maxScroll = Math.max(1, orbitalEl.scrollHeight - orbitalEl.clientHeight);
  }

  document.body.classList.add('scene-entering');
  orbitalEl?.classList.add('is-visible');

  // Load WebGL in parallel with the existing scene transition. Text remains usable if loading fails.
  ensureOrbit3D();

  if (state.reduced) finishEnter();
  else sceneTimer = setTimeout(finishEnter, CFG.transitionDuration);
}

function finishReturn() {
  clearTimeout(sceneTimer);
  sceneTimer = 0;
  if (state.scene !== 'returning') return;

  state.scene = 'hero';
  document.body.classList.remove('scene-returning');
  delete document.body.dataset.spatialScene;
  setHeroAvailable(true);
  button?.focus({ preventScroll: true });

  if (state.reduced) renderStatic();
  else if (!document.hidden) startLoop();
}

function returnToHero() {
  if (state.scene !== 'orbital' && state.scene !== 'transitioning') return;

  stopBackdropLoop();
  orbit3D?.stop();
  clearTimeout(sceneTimer);
  cancelAutoAdvance();
  stopOrbitalMotion();
  state.scene = 'returning';

  if (ctx) render(performance.now(), 0);
  document.body.classList.add('scene-returning', 'hero-revisited');
  document.body.classList.remove('scene-entering', 'scene-orbital');

  if (orbitalEl) {
    orbitalEl.classList.remove('is-visible');
    orbitalEl.inert = true;
    orbitalEl.setAttribute('aria-hidden', 'true');
  }

  if (state.reduced) finishReturn();
  else sceneTimer = setTimeout(finishReturn, CFG.returnDuration);
}

/* ==========================================================
   §7 RENDER
   ========================================================== */

let ctx = null;
let canvas = null;
let button = null;
let heroEl = null;
let headerEl = null;
let backdropCanvas = null;
let backdropCtx = null;
const backdropMotion = { raf: 0, last: 0, time: 0 };

function drawNebula(t, target = ctx, staticView = false) {
  if (!sprites.nebula) return;

  target.globalCompositeOperation = 'source-over';
  target.globalAlpha = 1;

  const pad = CFG.nebulaPad;
  const drift = t * CFG.nebulaDriftSpeed;
  const dx = Math.cos(drift) * 8;
  const dy = Math.sin(drift * 0.8) * 6;

  const px = -pad + (staticView ? 0 : state.cx) * CFG.nebulaParallax + dx;
  const py = -pad + (staticView ? 0 : state.cy) * CFG.nebulaParallax + dy;

  target.drawImage(sprites.nebula, px, py, sprites.nebulaW, sprites.nebulaH);
}

function drawStars(t, target = ctx, staticView = false, driftTime = 0) {
  const intro = easeOut(seg(t, CFG.tStars, CFG.introStars));
  if (intro <= 0) return;

  const w = state.w, h = state.h;
  const cx = (staticView ? 0 : state.cx), cy = (staticView ? 0 : state.cy);
  const par = CFG.parallaxStars;
  const minA = CFG.starMinDrawAlpha;
  const list = sprites.stars;
  const { base: twBase, amp: twAmp } = CFG.starTwinkle;

  const px0 = cx * par[0], py0 = cy * par[0];
  const px1 = cx * par[1], py1 = cy * par[1];
  const px2 = cx * par[2], py2 = cy * par[2];

  target.globalCompositeOperation = 'source-over';

  for (let i = 0, n = stars.length; i < n; i++) {
    const s = stars[i];
    const layer = s.layer;

    const ox = layer === 0 ? px0 : layer === 1 ? px1 : px2;
    const oy = layer === 0 ? py0 : layer === 1 ? py1 : py2;

    // 仅第二幕传入漂移时间；首页星空维持原样。
    const driftX = Math.sin(driftTime * 0.06) * (layer + 1) * 10;
    const driftY = (Math.cos(driftTime * 0.045) - 1) * (layer + 1) * 5;
    const x = s.x * w + ox + driftX;
    const y = s.y * h + oy + driftY;

    if (!inViewport(x, y, 40, w, h)) continue;

    const twinkle = twBase + twAmp * Math.sin(t * s.ts + s.tw);
    const a = s.a * intro * twinkle;
    if (a < minA) continue;

    if (s.bright && sprites.starBright) {
      const r = sprites.starBright.r;
      target.globalAlpha = a * 0.85;
      target.drawImage(sprites.starBright.c, x - r, y - r, r * 2, r * 2);
      continue;
    }

    const sp = list[layer];
    const r = sp.r;

    target.globalAlpha = a;
    target.drawImage(sp.c, x - r, y - r, r * 2, r * 2);
  }

  target.globalAlpha = 1;
}

function drawAzimuth(t) {
  const intro = easeOut(seg(t, CFG.tCore, CFG.introCore));
  if (intro <= 0 || state.R <= 0) return;

  const cx = state.w / 2 + state.cx * CFG.parallaxCore;
  const cy = state.h / 2 + state.cy * CFG.parallaxCore;
  const len = state.R * CFG.azimuthLength;

  const breath = 0.5 + 0.5 * Math.sin(t * CFG.azimuthBreathSpeed);
  const alpha = CFG.azimuthAlpha * intro * (0.72 + breath * 0.28);

  const topY = cy - len;
  const botY = cy + len;

  const grd = ctx.createLinearGradient(0, topY, 0, botY);
  grd.addColorStop(0.00, `${RGBA.accent}0)`);
  grd.addColorStop(0.22, `${RGBA.accent}${(alpha * 0.35).toFixed(4)})`);
  grd.addColorStop(0.50, `${RGBA.accent}${alpha.toFixed(4)})`);
  grd.addColorStop(0.78, `${RGBA.accent}${(alpha * 0.35).toFixed(4)})`);
  grd.addColorStop(1.00, `${RGBA.accent}0)`);

  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = grd;
  ctx.lineWidth = CFG.azimuthWidth;
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx, botY);
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}

function drawCore(t) {
  const intro = easeOut(seg(t, CFG.tCore, CFG.introCore));
  if (intro <= 0) return;

  const cx = state.w / 2 + state.cx * CFG.parallaxCore;
  const cy = state.h / 2 + state.cy * CFG.parallaxCore;

  const breath = 0.5 + 0.5 * Math.sin(t * CFG.breathSpeed);
  const bScale = 0.94 + breath * 0.10;
  const boost = 1 + state.hoverBoost * CFG.hoverBoost;
  const baseR = state.R * CFG.coreRatio * boost;

  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0, n = BLOOM_LAYERS.length; i < n; i++) {
    const layer = BLOOM_LAYERS[i];
    const r = baseR * layer.scale * bScale * intro;
    const lb = 0.88 + breath * layer.breathAmp;
    const a = layer.alpha * intro * lb;

    ctx.globalAlpha = a;
    ctx.drawImage(sprites.bloom, cx - r, cy - r, r * 2, r * 2);
  }

  ctx.globalAlpha = 1;

  const dotR = CFG.coreDotRadius * intro;
  ctx.beginPath();
  ctx.arc(cx, cy, dotR, 0, TAU);
  ctx.fillStyle = `${RGBA.white}${intro})`;
  ctx.fill();

  ctx.globalCompositeOperation = 'source-over';
}

function drawOrbits(t) {
  const intro = easeOut(seg(t, CFG.tOrbit, CFG.introOrbit));
  if (intro <= 0 || state.R <= 0) return;

  const cx = state.w / 2 + state.cx * CFG.parallaxScene;
  const cy = state.h / 2 + state.cy * CFG.parallaxScene;
  const R = state.R;
  const segs = CFG.orbitSegs;
  const minA = CFG.orbitMinSegAlpha;

  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0, n = ORBITS.length; i < n; i++) {
    const o = ORBITS[i];
    const rx = R * o.rx;
    const ry = R * o.ry;
    const oIntro = o.alpha * intro;

    if (cx + rx < -20 || cx - rx > state.w + 20 ||
        cy + ry < -20 || cy - ry > state.h + 20) continue;

    const tint = RGBA[o.tint] || RGBA.accent;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(o.rot);

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.strokeStyle = tint + (CFG.orbitBaseAlpha * oIntro).toFixed(4) + ')';
    ctx.lineWidth = CFG.orbitBaseStrokeWidth;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.strokeStyle = tint + (CFG.orbitThinAlpha * oIntro).toFixed(4) + ')';
    ctx.lineWidth = CFG.orbitThinStrokeWidth;
    ctx.stroke();

    const head = (o.phase + t * o.speed) % 1;
    const tail = o.tail;
    const headAngle = -Math.PI / 2 + TAU * head;

    ctx.lineWidth = CFG.orbitTailStrokeWidth;

    for (let k = 0; k < segs; k++) {
      const f0 = k / segs;
      const f1 = (k + 1) / segs;
      const fMid = (f0 + f1) * 0.5;

      const fade = Math.pow(1 - fMid, CFG.orbitTailFade);
      const a = CFG.orbitTailBaseAlpha * oIntro * fade;
      if (a < minA) continue;

      const a0 = -Math.PI / 2 + TAU * (head - tail * f1);
      const a1 = -Math.PI / 2 + TAU * (head - tail * f0);

      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, a0, a1);
      ctx.strokeStyle = tint + a.toFixed(4) + ')';
      ctx.stroke();
    }

    const hx = rx * Math.cos(headAngle);
    const hy = ry * Math.sin(headAngle);
    const hr = CFG.orbitHeadRadius * intro;

    ctx.globalAlpha = 0.85 * intro;
    ctx.drawImage(sprites.dot, hx - hr, hy - hr, hr * 2, hr * 2);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  ctx.globalCompositeOperation = 'source-over';
}

function spawnMeteor() {
  if (meteors.length >= CFG.meteorMax) return;

  const fromLeft = Math.random() < 0.5;
  const angle = rand(0.35, 0.75) * (fromLeft ? 1 : -1);
  const speed = rand(CFG.meteorSpeed[0], CFG.meteorSpeed[1]);

  const startX = fromLeft ? rand(-100, state.w * 0.3) : rand(state.w * 0.7, state.w + 100);
  const startY = rand(-50, state.h * 0.5);

  meteors.push({
    x: startX,
    y: startY,
    vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: rand(CFG.meteorLife[0], CFG.meteorLife[1]),
    alpha: rand(0.6, 1),
  });
}

function updateMeteors(dt) {
  if (!QUALITY.meteors || !CFG.meteorEnabled) return;

  if (Math.random() < CFG.meteorRate * 60 * dt) {
    spawnMeteor();
  }

  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.x += m.vx * dt * 60;
    m.y += m.vy * dt * 60;
    m.life += dt;

    if (m.life > m.maxLife ||
        m.x < -200 || m.x > state.w + 200 ||
        m.y > state.h + 200) {
      meteors.splice(i, 1);
    }
  }
}

function drawMeteors() {
  if (!meteors.length) return;

  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';

  for (let i = 0, n = meteors.length; i < n; i++) {
    const m = meteors[i];
    const progress = m.life / m.maxLife;
    const fade = 1 - Math.pow(progress, 2);
    const a = m.alpha * fade;

    const tl = CFG.meteorTailLength;
    const tx = m.x - m.vx * tl * 0.6;
    const ty = m.y - m.vy * tl * 0.6;

    const grd = ctx.createLinearGradient(tx, ty, m.x, m.y);
    grd.addColorStop(0, `${RGBA.accent}0)`);
    grd.addColorStop(1, `rgba(220,235,255,${a * 0.9})`);

    ctx.strokeStyle = grd;
    ctx.lineWidth = 1.6;

    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();

    const hr = 6;
    ctx.globalAlpha = a * 0.8;
    ctx.drawImage(sprites.dot, m.x - hr, m.y - hr, hr * 2, hr * 2);
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function render(now, dt) {
  if (!state.t0) state.t0 = now;
  const t = (now - state.t0) / 1000;



  const sm = 1 - Math.pow(1 - CFG.smoothFactor, dt * 60);
  state.cx = lerp(state.cx, state.px, sm);
  state.cy = lerp(state.cy, state.py, sm);
  state.hoverBoost = lerp(state.hoverBoost, state.targetBoost, 1 - Math.pow(0.88, dt * 60));

  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, state.w, state.h);



  drawNebula(t);
  drawStars(t);
  drawAzimuth(t);
  drawCore(t);
  drawOrbits(t);
  updateMeteors(dt);
  drawMeteors();


  if (t > CFG.tButton && state.scene === 'hero') showButton();
}

/* 第二幕背景：固定星云 + 缓慢漂移、闪烁的星空。
   刻意不含轨道环 / 核心 / 方位光带 / 流星——
   第二幕的视觉脊柱是左侧 SVG 弧线导航，Canvas 只做安静的深空底 */
function drawOrbitalBackdrop() {
  if (!backdropCtx) return;
  backdropCtx.fillStyle = COLOR.bg;
  backdropCtx.fillRect(0, 0, state.w, state.h);
  drawNebula(0, backdropCtx, true);
  drawStars(999 + backdropMotion.time, backdropCtx, true, backdropMotion.time);
}

function startBackdropLoop() {
  if (backdropMotion.raf || !backdropCtx || state.destroyed || state.reduced ||
      document.hidden || state.scene !== 'orbital') return;
  backdropMotion.last = 0;
  backdropMotion.raf = requestAnimationFrame(animateBackdrop);
}

function stopBackdropLoop() {
  cancelAnimationFrame(backdropMotion.raf);
  backdropMotion.raf = 0;
  backdropMotion.last = 0;
}

function animateBackdrop(now) {
  backdropMotion.raf = 0;
  if (!backdropCtx || state.destroyed || state.reduced || document.hidden ||
      state.scene !== 'orbital') return;
  if (!backdropMotion.last) backdropMotion.last = now;
  const elapsed = now - backdropMotion.last;
  if (elapsed + 0.5 >= currentFrameBudget()) {
    backdropMotion.time += Math.min(elapsed, 100) / 1000;
    backdropMotion.last = now;
    drawOrbitalBackdrop();
  }
  backdropMotion.raf = requestAnimationFrame(animateBackdrop);
}

function renderStatic() {
  if (!ctx) return;
  state.cx = state.cy = 0;

  /* 场景感知：第二幕用其专属背景 */
  if (state.scene === 'orbital' || state.scene === 'transitioning') {
    drawOrbitalBackdrop();
    return;
  }

  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, state.w, state.h);

  drawNebula(0);
  drawStars(999);
  drawAzimuth(999);
  drawCore(999);
  drawOrbits(999);
  drawMeteors();
}

/* ==========================================================
   §8 LOOP
   ========================================================== */

function currentFrameBudget() {
  return 1000 / CFG.targetFPS;
}

function measureFrame(dt) {
  const idx = state.frameIdx;
  state.frameTimes[idx] = dt;
  state.frameIdx = (idx + 1) % CFG.fpsSampleSize;
  if (state.frameCount < CFG.fpsSampleSize) state.frameCount++;
}

function averageFrameTime() {
  const n = state.frameCount;
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += state.frameTimes[i];
  return sum / n;
}

function adaptQuality(now) {
  if (now - state.lastAdapt < CFG.fpsAdaptCooldown) return;
  if (state.frameCount < CFG.fpsSampleSize) return;

  const avg = averageFrameTime();
  if (avg <= 0) return;

  const fps = 1000 / avg;

  if (fps < CFG.minFPS && state.quality !== 'low') {
    const next = state.quality === 'high' ? 'mid' : 'low';
    setQuality(next, true);
    state.lastAdapt = now;
    return;
  }

  if (fps > CFG.targetFPS * 0.95 && state.quality === 'low') {
    setQuality('mid', true);
    state.lastAdapt = now;
    return;
  }

  state.lastAdapt = now;
}

function loop(now) {
  if (state.destroyed) {
    state.raf = 0;
    return;
  }
  state.raf = requestAnimationFrame(loop);

  if (state.lastFrame === 0) {
    state.lastFrame = now;
    return;
  }

  const dt = now - state.lastFrame;
  const budget = currentFrameBudget();
  if (dt + 0.5 < budget) return;

  if (dt > 1000) {
    state.lastFrame = now;
    return;
  }

  state.lastFrame = now - (dt >= budget ? dt % budget : 0);

  try {
    render(now, Math.min(dt / 1000, 0.1));
  } catch (err) {
    if (typeof console !== 'undefined') {
      console.warn('[Polaris] render error:', err);
    }
  }

  measureFrame(dt);
  adaptQuality(now);
}

function startLoop() {
  if (state.raf || state.destroyed || state.reduced || !ctx || document.hidden || state.scene !== 'hero') return;
  state.lastFrame = 0;
  state.raf = requestAnimationFrame(loop);
}

function stopLoop() {
  if (state.raf) {
    cancelAnimationFrame(state.raf);
    state.raf = 0;
  }
}

/* ==========================================================
   §9 EVENTS
   ========================================================== */

function onPointerMove(e) {
  if (state.scene !== 'hero') return;
  if (state.w === 0 || state.h === 0) return;
  const s = CFG.parallaxStrength;
  state.px = ((e.clientX / state.w) * 2 - 1) * s;
  state.py = ((e.clientY / state.h) * 2 - 1) * s;
}

function onTouchMove(e) {
  if (state.scene !== 'hero') return;
  const t = e.touches && e.touches[0];
  if (!t || state.w === 0 || state.h === 0) return;
  const s = CFG.parallaxStrength * 0.7;
  state.px = ((t.clientX / state.w) * 2 - 1) * s;
  state.py = ((t.clientY / state.h) * 2 - 1) * s;
}

const onResize = debounce(() => {
  if (state.destroyed) return;
  resize();
  if (state.reduced) renderStatic();
}, CFG.resizeDebounce);

function onVisibility() {
  if (state.destroyed) return;
  if (document.hidden) {
    stopBackdropLoop();
    orbit3D?.stop();
    if (state.t0) state.pausedAt = performance.now() - state.t0;
    stopLoop();
    cancelAutoAdvance();
    stopOrbitalMotion();
    if (state.scene === 'transitioning') finishEnter();
    if (state.scene === 'returning') finishReturn();
    cancelAutoAdvance();
  } else {
    if (state.pausedAt) state.t0 = performance.now() - state.pausedAt;
    state.pausedAt = 0;
    if (state.scene === 'orbital') {
      onOrbitalScroll();
      startBackdropLoop();
      orbit3D?.start();
    }
    else if (!state.reduced) startLoop();
  }
}

function onReducedChange(e) {
  if (state.destroyed) return;
  state.reduced = e.matches;
  orbit3D?.setReduced();
  if (state.reduced) {
    stopBackdropLoop();
    stopLoop();
    cancelAutoAdvance();
    stopOrbitalMotion();
    if (state.scene === 'transitioning') finishEnter();
    if (state.scene === 'returning') finishReturn();
    if (state.scene === 'orbital') onOrbitalScroll();
    renderStatic();
    showButton();
  } else {
    startLoop();
    startBackdropLoop();
    if (state.scene === 'orbital' || state.scene === 'transitioning') orbit3D?.start();
  }
}

function onBtnEnter() { state.targetBoost = 1; }
function onBtnLeave() { state.targetBoost = 0; }
function onBtnDown()  { state.targetBoost = 1.4; }
function onBtnUp()    { state.targetBoost = state.hoverBoost > 0.5 ? 1 : 0; }

function onUnload(e) {
  stopBackdropLoop();
  orbit3D?.stop();
  if (e.persisted) {
    stopLoop();
    cancelAutoAdvance();
    stopOrbitalMotion();
  } else destroy();
}
function onPageShow(e) { if (e.persisted) onVisibility(); }

/* ==========================================================
   §10 LIFECYCLE
   ========================================================== */

function startTransition() {
  enterOrbital();
}

function resize() {
  state.w = window.innerWidth;
  state.h = window.innerHeight;

  if (orbitalEl) {
    orbitalMotion.maxScroll = Math.max(1, orbitalEl.scrollHeight - orbitalEl.clientHeight);
    onOrbitalScroll();
  }

  const cap = Math.min(QUALITY.dprCap, CFG.maxDPR);
  state.dpr = Math.min(window.devicePixelRatio || 1, cap);

  orbit3D?.resize();

  if (!ctx) return;

  canvas.width  = Math.floor(state.w * state.dpr);
  canvas.height = Math.floor(state.h * state.dpr);
  canvas.style.width  = state.w + 'px';
  canvas.style.height = state.h + 'px';

  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  if (backdropCtx) {
    backdropCanvas.width = canvas.width;
    backdropCanvas.height = canvas.height;
    backdropCtx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  const m = Math.min(state.w, state.h);
  const narrow = state.w < CFG.narrowViewport;
  state.R = m * (narrow ? CFG.narrowRadiusRatio : CFG.wideRadiusRatio);

  buildStars();
  buildNebula();

  /* 第二幕中调整窗口：重绘静态背景 */
  if (state.scene !== 'hero') {
    drawOrbitalBackdrop();
    if (state.scene === 'returning' || state.scene === 'transitioning') render(performance.now(), 0);
  }
}

function buildStars() {
  const area = state.w * state.h;
  const ref = 1920 * 1080;
  const k = clamp(Math.sqrt(area / ref), 0.5, 1.3);
  const base = CFG.starBase * QUALITY.starMul * k;
  const count = Math.round(clamp(base, CFG.starMin, CFG.starMax));

  const old = stars;
  if (old.length === count) return;

  if (old.length < count) {
    const next = new Array(count);
    for (let i = 0; i < old.length; i++) next[i] = old[i];
    for (let i = old.length; i < count; i++) next[i] = createStar();
    stars = next;
  } else {
    stars.length = count;
  }
}

function createStar() {
  const d = Math.random();
  const [t0, t1] = CFG.starLayerDist;
  const layer = d < t0 ? 0 : d < t1 ? 1 : 2;
  const { min, range } = CFG.starAlpha;
  const { speedMin, speedRange } = CFG.starTwinkle;

  return {
    x: Math.random(),
    y: Math.random(),
    layer,
    a: min + Math.random() * range,
    tw: Math.random() * TAU,
    ts: speedMin + Math.random() * speedRange,
    bright: Math.random() < CFG.starBrightRatio,
  };
}

function showButton() {
  if (state.btnShown) return;
  state.btnShown = true;
  if (button) button.classList.add('show');
}

function destroy() {
  if (state.destroyed) return;
  stopBackdropLoop();
  state.destroyed = true;

  stopLoop();
  cancelAutoAdvance();
  stopOrbitalMotion();
  orbit3D?.destroy();
  orbit3D = null;
  orbit3DInit = null;
  clearTimeout(sceneTimer);

  window.removeEventListener('resize', onResize);
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('mousemove', onPointerMove);
  window.removeEventListener('pagehide', onUnload);
  window.removeEventListener('pageshow', onPageShow);
  document.removeEventListener('visibilitychange', onVisibility);

  if (button) {
    button.removeEventListener('click', startTransition);
    button.removeEventListener('mouseenter', onBtnEnter);
    button.removeEventListener('mouseleave', onBtnLeave);
    button.removeEventListener('mousedown', onBtnDown);
    button.removeEventListener('mouseup', onBtnUp);
    button.removeEventListener('touchstart', onBtnDown);
    button.removeEventListener('touchend', onBtnUp);
  }

  if (backBtn) {
    backBtn.removeEventListener('click', returnToHero);
  }

  if (orbitalEl) {
    orbitalEl.removeEventListener('scroll', onOrbitalScroll);
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(type => orbitalEl.removeEventListener(type, onOrbitalInput));
  }

  if (mqlReduce && mqlReduce.removeEventListener) {
    mqlReduce.removeEventListener('change', onReducedChange);
  }

  freeSprites();
  meteors.length = 0;
  stars = [];
  spineSegEls.length = 0;
}

/* ==========================================================
   §11 API
   ========================================================== */

let mqlReduce = null;
let bound = false;

function setQuality(level, isRuntime = true) {
  if (state.destroyed || !QUALITY_PRESETS[level]) return;

  state.quality = level;
  QUALITY = QUALITY_PRESETS[level];

  if (!isRuntime || !ctx) return;

  buildSprites();
  resize();
  orbit3D?.resize();
  if (state.reduced) renderStatic();
}

function setPalette(name) {
  if (state.destroyed || !ctx || !PALETTES[name]) return;

  state.paletteKey = name;
  Object.assign(COLOR, PALETTES[name]);
  RGBA = buildRgbaTable();

  buildSprites();
  buildNebula();
  if (state.scene !== 'hero') drawOrbitalBackdrop();
  if (state.reduced) renderStatic();
}

function setConfig(partial) {
  if (state.destroyed || !partial || typeof partial !== 'object') return;

  Object.assign(CFG, partial);

  document.documentElement.style.setProperty('--scene-duration', CFG.transitionDuration + 'ms');
  document.documentElement.style.setProperty('--return-duration', CFG.returnDuration + 'ms');
  if (!ctx) return;

  if (partial.starBase !== undefined ||
      partial.starMin !== undefined ||
      partial.starMax !== undefined) {
    buildStars();
  }

  if (partial.maxDPR !== undefined) {
    resize();
  }

  if (partial.nebulaNoiseAlpha !== undefined ||
      partial.nebulaMainRadius !== undefined) {
    freeNebula();
    buildNebula();
  }
}

const api = {
  init,
  destroy,
  pause: stopLoop,
  resume: startLoop,
  setConfig,
  setQuality,
  setPalette,
  getConfig: () => ({ ...CFG }),
  getState: () => ({
    scene: state.scene,
    quality: state.quality,
    dpr: state.dpr,
    stars: stars.length,
    meteors: meteors.length,
    reduced: state.reduced,
  }),
};

/* ==========================================================
   INIT
   ========================================================== */

function init() {
  if (bound) return;

  canvas = document.getElementById('spaceCanvas');
  button = document.getElementById('exploreBtn');
  heroEl = document.getElementById('hero');
  headerEl = document.getElementById('header');
  backdropCanvas = document.getElementById('orbitalBackdrop');
  orbit3DCanvasEl = document.getElementById('orbit3DCanvas');

  backBtn = document.getElementById('backBtn');
  orbitalEl = document.getElementById('orbitalTimeline');
  sceneMeterCurrentEl = document.getElementById('sceneMeterCurrent');

  panelEls.length = 0;
  document.querySelectorAll('.nav-panel').forEach((el) => panelEls.push(el));

  navNodeEls = Array.from(document.querySelectorAll('.spatial-nav-node'));
  syncScene(0);

  try {
    ctx = canvas?.getContext('2d', { alpha: false });
    backdropCtx = backdropCanvas?.getContext('2d', { alpha: false });
  } catch (_) { ctx = backdropCtx = null; }
  if (!ctx || !backdropCtx) {
    document.body.classList.add('no-canvas');
    ctx = backdropCtx = null;
  }

  state.quality = detectQualityLevel();
  QUALITY = QUALITY_PRESETS[state.quality];

  mqlReduce = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  state.reduced = !!(mqlReduce && mqlReduce.matches);

  document.documentElement.style.setProperty('--scene-duration', CFG.transitionDuration + 'ms');
  document.documentElement.style.setProperty('--return-duration', CFG.returnDuration + 'ms');
  if (ctx) {
    buildSprites();
    resize();
  }
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onUnload);
  window.addEventListener('pageshow', onPageShow);
  mqlReduce?.addEventListener('change', onReducedChange);
  state.t0 = performance.now();
  if (state.reduced || !ctx) {
    renderStatic();
    showButton();
  } else startLoop();

  if (button) {
    button.addEventListener('click', startTransition);
    button.addEventListener('mouseenter', onBtnEnter);
    button.addEventListener('mouseleave', onBtnLeave);
    button.addEventListener('mousedown', onBtnDown);
    button.addEventListener('mouseup', onBtnUp);
    button.addEventListener('touchstart', onBtnDown, { passive: true });
    button.addEventListener('touchend', onBtnUp, { passive: true });
  }

  if (backBtn) {
    backBtn.addEventListener('click', returnToHero);
  }

  if (orbitalEl) {
    orbitalEl.addEventListener('scroll', onOrbitalScroll, { passive: true });
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(type => orbitalEl.addEventListener(type, onOrbitalInput, { passive: true }));
  }

  bound = true;
}

if (typeof window !== 'undefined') {
  window.Polaris = api;
}

init();

export default api;
