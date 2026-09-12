/**
 * Project Polaris
 * ============================================================
 * §1  CONFIG          配置
 * §2  QUALITY         性能分级
 * §3  UTILS           工具
 * §4  SPRITES         离屏精灵工厂
 * §5  RESOURCES       资源生命周期
 * §6  STATE           状态
 * §6.5 ORBITAL        弧形导航场景（Cover Flow / Vision Pro 空间装置）
 * §7  RENDER          渲染
 * §8  LOOP            主循环
 * §9  EVENTS          事件
 * §10 LIFECYCLE       初始化 / 销毁
 * §11 API             对外接口
 * ============================================================
 */

/* ==========================================================
   §1 CONFIG
   ========================================================== */

const CFG = {
  maxDPR: 2,
  targetFPS: 40,
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

  transitionDuration: 1000,
  transitionZoom: 18,

  /* 第二幕：进入后的自动轻推 + 弧线脊柱参数 */
  orbitalAutoDelay: 2200,
  orbitalAutoDuration: 2000,
  orbitalAutoTarget: 0.08,
  orbitalSpineSegments: 40,
  orbitalSpineFalloff: 0.16,
  orbitalSpineWidthBase: 1.0,
  orbitalSpineWidthAmp: 2.6,
  orbitalSpineAlphaBase: 0.05,
  orbitalSpineAlphaAmp: 0.60,

  /* ==========================================================
     空间相机（Virtual Camera）
     装置像一件悬浮在黑色空间里的实体雕塑，
     滚动时相机沿椭圆切线方向轻推 2%–4%，
     近景位移更大，远景位移更小 —— 形成 Cover Flow 式视差。
     ========================================================== */

  /* 相机基础姿态：从左前方向右后方斜拍 */
  camBaseRotX: 42,       // 俯角：底部转向镜头，顶部远离
  camBaseRotZ: -6,       // 轻微倾斜
  camBaseRotY: -8,       // 水平偏转
  camBaseScale: 1.30,    // 整体放大 30%

  /* 相机推进（dolly）：滚动 0→1 时，装置相对视口的反向平移 */
  camDollyX: -2.2,       // % of vmin（视觉上装置向左）
  camDollyY: 1.6,        // % of vmin（视觉上装置向下）
  camDollyRotZ: 1.8,     // deg，随推进轻微旋转
  camDollyRotY: 1.2,     // deg
  camDollyScale: 0.030,  // 缩放微变，远景稍缩

  /* 焦点拉移（Focus Pull）：当前节点最清晰，远景越来越虚 */
  focusSigma: 0.058,     // 高斯衰减半径（弧长比例）
  focusBlurMax: 2.0,     // 最远节点的模糊上限（px）

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
  free(sprites.starBright); sprites.starBright = null;
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
  transitionT0: 0,
  zoom: 1,

  frameTimes: new Float32Array(CFG.fpsSampleSize),
  frameIdx: 0,
  frameCount: 0,
  lastAdapt: 0,

  quality: 'mid',
};

let stars = [];
const meteors = [];

/* ==========================================================
   §6.5 ORBITAL NAVIGATION
   —— Cover Flow / Vision Pro 空间装置
   ========================================================== */

/* 弧形路径：与 index.html 中 SVG 的 d 属性完全一致。
   注意：这里的 Path 是“装置本体”的骨架，
   JS 只负责沿弧长摆放节点与卫星，绝不改动弧线本身。 */
const ROUTE_D = 'M 20 -40 C 134 340, 134 1060, 20 1440';

/* 5 个航点沿弧长的分布（与原实现完全一致） */
const NODE_RATIOS = [0.12, 0.31, 0.50, 0.69, 0.88];

let orbitalEl = null;
let satelliteEl = null;
let spineGroupEl = null;
let backBtn = null;
let arcHudValueEl = null;
let polarisAnchorEl = null;

/* 3D 装置的两层：
   - navArcLayerEl：透视容器（CSS 里配置 perspective / perspective-origin）
   - arcCameraEl：相机层，滚动时由 JS 驱动 3D 变换 */
let navArcLayerEl = null;
let arcCameraEl = null;

const nodeEls = [];
const panelEls = [];
const spineSegEls = [];

/* 滚动渲染的 rAF 节流 */
let orbitalScrollRaf = 0;

/* 离屏 path，用于弧长采样 */
const SVG_NS = 'http://www.w3.org/2000/svg';
const routePath = document.createElementNS(SVG_NS, 'path');
routePath.setAttribute('d', ROUTE_D);
let routeLength = 0;

/* 自动推进取消标记 */
let autoAdvanceToken = 0;

function routeAt(t) {
  const len = routeLength * clamp(t, 0, 1);
  return routePath.getPointAtLength(len);
}

function routeSlice(t0, t1, steps) {
  const a = clamp(t0, 0, 1);
  const b = clamp(t1, 0, 1);
  if (b <= a) return '';

  const lenA = routeLength * a;
  const lenB = routeLength * b;
  const n = Math.max(2, steps);

  let d = '';
  for (let i = 0; i <= n; i++) {
    const len = lenA + (lenB - lenA) * (i / n);
    const pt = routePath.getPointAtLength(len);
    d += (i === 0 ? 'M' : 'L') +
         pt.x.toFixed(2) + ' ' + pt.y.toFixed(2) + ' ';
  }
  return d.trim();
}

function buildSpineSegments() {
  if (!spineGroupEl) return;

  while (spineGroupEl.firstChild) {
    spineGroupEl.removeChild(spineGroupEl.firstChild);
  }
  spineSegEls.length = 0;

  const count = CFG.orbitalSpineSegments;

  for (let i = 0; i < count; i++) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('class', 'nav-arc-spine-seg');
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-width', '1');
    p.setAttribute('stroke-opacity', '0');
    spineGroupEl.appendChild(p);
    spineSegEls.push(p);
  }
}

function placeNodes() {
  for (let i = 0; i < nodeEls.length; i++) {
    const pt = routeAt(NODE_RATIOS[i]);
    nodeEls[i].setAttribute(
      'transform',
      `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`
    );
  }
}

/* 弧线脊柱：整条弧由 N 段组成。
   靠近卫星的段落更粗更亮，远离卫星逐渐变细并消失在黑暗中。 */
function renderSpine(p) {
  const count = spineSegEls.length;
  if (!count) return;

  const sigma = CFG.orbitalSpineFalloff;
  const wBase = CFG.orbitalSpineWidthBase;
  const wAmp  = CFG.orbitalSpineWidthAmp;
  const aBase = CFG.orbitalSpineAlphaBase;
  const aAmp  = CFG.orbitalSpineAlphaAmp;

  const invVar = 1 / (2 * sigma * sigma);

  for (let i = 0; i < count; i++) {
    const f0 = i / count;
    const f1 = (i + 1) / count;
    const mid = (f0 + f1) * 0.5;

    const d = mid - p;
    const prox = Math.exp(-(d * d) * invVar);

    const edge = Math.min(1, mid / 0.06, (1 - mid) / 0.06);

    const el = spineSegEls[i];
    el.setAttribute('d', routeSlice(f0, f1, 1));
    el.setAttribute('stroke-width', (wBase + wAmp * prox).toFixed(2));
    el.setAttribute('stroke-opacity', ((aBase + aAmp * prox) * edge).toFixed(3));
  }
}

/* 找到离卫星最近的节点索引 */
function nearestNodeIndex(p) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < NODE_RATIOS.length; i++) {
    const d = Math.abs(p - NODE_RATIOS[i]);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

/* ==========================================================
   相机推进：滚动时沿椭圆切线方向轻推整个装置。
   相机向右上方推进 → 装置相对视口向左下方平移。
   远景位移更小，近景位移更大 —— 这是 Cover Flow 的关键。
   ========================================================== */
function applyCamera(p) {
  if (!arcCameraEl) return;

  /* reduced-motion：直接保持静态初始姿态 */
  if (state.reduced) {
    arcCameraEl.style.transform =
      `translate3d(0, 0, 0) ` +
      `rotateX(${CFG.camBaseRotX}deg) ` +
      `rotateZ(${CFG.camBaseRotZ}deg) ` +
      `rotateY(${CFG.camBaseRotY}deg) ` +
      `scale(${CFG.camBaseScale})`;
    return;
  }

  /* 用 easeOut 让推进更 Apple：起步柔和，到位稳 */
  const eased = easeOut(clamp(p, 0, 1));

  /* 视口最小边作为单位，保证响应式 */
  const vmin = Math.min(state.w, state.h) || 1;

  /* 装置相对平移（反向即相机推进方向） */
  const tx = eased * CFG.camDollyX * vmin * 0.01;
  const ty = eased * CFG.camDollyY * vmin * 0.01;

  /* 推进时轻微转向（Cover Flow 感） */
  const rz = CFG.camBaseRotZ + eased * CFG.camDollyRotZ;
  const ry = CFG.camBaseRotY + eased * CFG.camDollyRotY;

  /* 远景稍缩，近景稍大 */
  const sc = CFG.camBaseScale + eased * CFG.camDollyScale;

  arcCameraEl.style.transform =
    `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) ` +
    `rotateX(${CFG.camBaseRotX}deg) ` +
    `rotateZ(${rz.toFixed(3)}deg) ` +
    `rotateY(${ry.toFixed(3)}deg) ` +
    `scale(${sc.toFixed(4)})`;
}

/* ==========================================================
   焦点拉移：当前节点完全清晰，
   邻近节点轻微模糊（0.5–1px），
   更远的节点继续模糊（1.5–2px）。
   使用高斯衰减，确保过渡连续、不跳变。
   ========================================================== */
function focusBlurFor(p, nodeRatio) {
  const d = p - nodeRatio;
  const sigma = CFG.focusSigma;
  const prox = Math.exp(-(d * d) / (2 * sigma * sigma));
  return (1 - prox) * CFG.focusBlurMax;
}

function renderOrbitalAt(p) {
  p = clamp(p, 0, 1);

  /* ---------- 卫星位置：沿椭圆弧长摆放 ---------- */
  const satPt = routeAt(p);
  if (satelliteEl) {
    satelliteEl.setAttribute(
      'transform',
      `translate(${satPt.x.toFixed(2)} ${satPt.y.toFixed(2)})`
    );
  }

  /* ---------- 弧线脊柱（靠近卫星粗亮，远离渐隐） ---------- */
  renderSpine(p);

  /* ---------- 北极星：远处锚点，随进度极缓慢漂移 ---------- */
  if (polarisAnchorEl && !state.reduced) {
    const drift = (p - 0.5) * 22;
    polarisAnchorEl.style.transform = `translateY(${drift.toFixed(1)}px)`;
  }

  /* ---------- 相机推进：每帧写入 transform ---------- */
  applyCamera(p);

  /* ---------- 节点三态 + 焦点拉移 ---------- */
  const activeIdx = nearestNodeIndex(p);

  for (let i = 0; i < nodeEls.length; i++) {
    const el = nodeEls[i];
    const isCurrent = i === activeIdx;
    const isPast = i < activeIdx;

    el.classList.toggle('is-active', isCurrent);
    el.classList.toggle('is-past', isPast && !isCurrent);
    el.classList.toggle('is-future', !isPast && !isCurrent);

    /* 透明度：当前最亮，已过微亮，未到极淡 */
    let op;
    if (isCurrent) {
      const near = Math.max(0, 1 - Math.abs(p - NODE_RATIOS[i]) / 0.16);
      op = 0.82 + near * 0.18;
    } else if (isPast) {
      op = 0.42;
    } else {
      op = 0.15;
    }

    /* 焦点拉移：按与当前进度的弧长距离，连续计算模糊值 */
    const blur = focusBlurFor(p, NODE_RATIOS[i]);

    el.style.opacity = op.toFixed(3);

    if (blur > 0.04) {
      el.style.filter = `blur(${blur.toFixed(2)}px)`;
    } else {
      el.style.filter = 'none';
    }
  }

  /* ---------- HUD：Where am I ---------- */
  if (arcHudValueEl) {
    arcHudValueEl.textContent =
      String(activeIdx + 1).padStart(2, '0') + ' / 05';
  }

  /* ---------- 右侧面板：Blur → Sharp，位置保持不变 ---------- */
  for (let i = 0; i < panelEls.length; i++) {
    panelEls[i].classList.toggle('is-active', i === activeIdx);
  }
}

function onOrbitalScroll() {
  if (state.scene !== 'orbital' || !orbitalEl) return;
  if (orbitalScrollRaf) return;

  /* rAF 节流：滚动事件一帧可能触发多次，只渲染最后一次状态 */
  orbitalScrollRaf = requestAnimationFrame(() => {
    orbitalScrollRaf = 0;

    const maxScroll = orbitalEl.scrollHeight - orbitalEl.clientHeight;
    const p = maxScroll > 0
      ? clamp(orbitalEl.scrollTop / maxScroll, 0, 1)
      : 0;

    renderOrbitalAt(p);
  });
}

/** 进入第二幕后的自动轻推：让用户看到卫星“起步”，但不强迫 */
function autoAdvanceOrbital() {
  if (!orbitalEl) return;

  const token = ++autoAdvanceToken;
  const maxScroll = orbitalEl.scrollHeight - orbitalEl.clientHeight;
  const targetScroll = CFG.orbitalAutoTarget * maxScroll;

  const startTime = performance.now();

  function step(now) {
    if (token !== autoAdvanceToken) return;
    if (state.scene !== 'orbital') return;

    const elapsed = now - startTime;

    if (elapsed < CFG.orbitalAutoDelay) {
      requestAnimationFrame(step);
      return;
    }

    const t = clamp(
      (elapsed - CFG.orbitalAutoDelay) / CFG.orbitalAutoDuration,
      0, 1
    );
    const eased = easeOut(t);

    /* 用户手动滚动超过阈值 → 取消自动推进 */
    if (eased > 0.02 && eased < 0.98 &&
        Math.abs(orbitalEl.scrollTop - eased * targetScroll) > 14) {
      return;
    }

    orbitalEl.scrollTop = eased * targetScroll;
    renderOrbitalAt(eased * CFG.orbitalAutoTarget);

    if (t < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function enterOrbital() {
  if (state.scene === 'orbital') return;
  state.scene = 'orbital';

  document.body.classList.add('scene-orbital');

  if (overlayEl) {
    overlayEl.style.transition = 'none';
    overlayEl.style.opacity = '1';
  }

  if (heroEl) {
    heroEl.style.transition = 'opacity 0.35s ease';
    heroEl.style.opacity = '0';
    heroEl.style.pointerEvents = 'none';
  }

  if (orbitalEl) {
    orbitalEl.classList.add('is-visible');
    orbitalEl.setAttribute('aria-hidden', 'false');
    orbitalEl.scrollTop = 0;
  }

  stopLoop();

  /* 第二幕背景：星云 + 星空（静态渲染省电） */
  drawOrbitalBackdrop();

  /* 初始相机姿态 + 初始节点状态 */
  renderOrbitalAt(0);

  requestAnimationFrame(() => {
    if (overlayEl) {
      overlayEl.style.transition = 'opacity 0.7s ease';
      overlayEl.style.opacity = '0';
    }

    if (!state.reduced) {
      autoAdvanceOrbital();
    } else {
      renderOrbitalAt(CFG.orbitalAutoTarget);
    }
  });
}

function returnToHero() {
  if (state.scene !== 'orbital') return;
  state.scene = 'hero';
  state.zoom = 1;

  autoAdvanceToken++;
  if (orbitalScrollRaf) {
    cancelAnimationFrame(orbitalScrollRaf);
    orbitalScrollRaf = 0;
  }

  document.body.classList.remove('scene-orbital');

  if (orbitalEl) {
    orbitalEl.classList.remove('is-visible');
    orbitalEl.setAttribute('aria-hidden', 'true');
    orbitalEl.scrollTop = 0;
  }

  if (heroEl) {
    heroEl.style.transition = 'opacity 0.6s ease';
    heroEl.style.opacity = '1';
    heroEl.style.pointerEvents = '';
  }

  if (overlayEl) {
    overlayEl.style.transition = 'none';
    overlayEl.style.opacity = '0';
  }

  if (state.reduced) {
    renderStatic();
  } else {
    state.lastFrame = 0;
    startLoop();
  }
}

/* ==========================================================
   §7 RENDER
   ========================================================== */

let ctx = null;
let canvas = null;
let button = null;
let heroEl = null;
let headerEl = null;
let overlayEl = null;

function drawNebula(t) {
  if (!sprites.nebula) return;

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  const pad = CFG.nebulaPad;
  const drift = t * CFG.nebulaDriftSpeed;
  const dx = Math.cos(drift) * 8;
  const dy = Math.sin(drift * 0.8) * 6;

  const px = -pad + state.cx * CFG.nebulaParallax + dx;
  const py = -pad + state.cy * CFG.nebulaParallax + dy;

  ctx.drawImage(sprites.nebula, px, py, sprites.nebulaW, sprites.nebulaH);
}

function drawStars(t) {
  const intro = easeOut(seg(t, CFG.tStars, CFG.introStars));
  if (intro <= 0) return;

  const w = state.w, h = state.h;
  const cx = state.cx, cy = state.cy;
  const par = CFG.parallaxStars;
  const minA = CFG.starMinDrawAlpha;
  const list = sprites.stars;
  const { base: twBase, amp: twAmp } = CFG.starTwinkle;

  const px0 = cx * par[0], py0 = cy * par[0];
  const px1 = cx * par[1], py1 = cy * par[1];
  const px2 = cx * par[2], py2 = cy * par[2];

  ctx.globalCompositeOperation = 'source-over';

  for (let i = 0, n = stars.length; i < n; i++) {
    const s = stars[i];
    const layer = s.layer;

    const ox = layer === 0 ? px0 : layer === 1 ? px1 : px2;
    const oy = layer === 0 ? py0 : layer === 1 ? py1 : py2;

    const x = s.x * w + ox;
    const y = s.y * h + oy;

    if (!inViewport(x, y, 40, w, h)) continue;

    const twinkle = twBase + twAmp * Math.sin(t * s.ts + s.tw);
    const a = s.a * intro * twinkle;
    if (a < minA) continue;

    if (s.bright && sprites.starBright) {
      const r = sprites.starBright.r;
      ctx.globalAlpha = a * 0.85;
      ctx.drawImage(sprites.starBright.c, x - r, y - r, r * 2, r * 2);
      continue;
    }

    const sp = list[layer];
    const r = sp.r;

    ctx.globalAlpha = a;
    ctx.drawImage(sp.c, x - r, y - r, r * 2, r * 2);
  }

  ctx.globalAlpha = 1;
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

  if (state.scene === 'transitioning') {
    const elapsed = now - state.transitionT0;
    const p = clamp(elapsed / CFG.transitionDuration, 0, 1);
    const eased = Math.pow(p, 2.5);
    state.zoom = 1 + eased * (CFG.transitionZoom - 1);

    if (overlayEl && p > 0.75) {
      overlayEl.style.opacity = ((p - 0.75) / 0.25).toFixed(3);
    }

    if (p >= 1) {
      enterOrbital();
      return;
    }
  }

  const sm = CFG.smoothFactor;
  state.cx = lerp(state.cx, state.px, sm);
  state.cy = lerp(state.cy, state.py, sm);
  state.hoverBoost = lerp(state.hoverBoost, state.targetBoost, 0.12);

  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, state.w, state.h);

  const z = state.zoom;
  if (z !== 1) {
    const cx = state.w / 2;
    const cy = state.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(z, z);
    ctx.translate(-cx, -cy);
  }

  drawNebula(t);
  drawStars(t);
  drawAzimuth(t);
  drawCore(t);
  drawOrbits(t);
  updateMeteors(dt);
  drawMeteors();

  if (z !== 1) ctx.restore();

  if (t > CFG.tButton && state.scene === 'hero') showButton();
}

/* 第二幕静态背景：星云 + 星空。
   第二幕的视觉脊柱是左侧 SVG 弧线导航，Canvas 只做安静的深空底 */
function drawOrbitalBackdrop() {
  if (!ctx) return;

  state.cx = 0;
  state.cy = 0;

  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, state.w, state.h);

  drawNebula(0);
  drawStars(999);
}

function renderStatic() {
  state.cx = state.cy = 0;

  if (state.scene === 'orbital') {
    drawOrbitalBackdrop();
    /* 静态时也把相机姿态落到初始位置 */
    if (state.reduced) {
      renderOrbitalAt(CFG.orbitalAutoTarget);
    }
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

  if (fps > CFG.targetFPS * 1.35 && state.quality === 'low') {
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
  if (dt < currentFrameBudget()) return;

  if (dt > 1000) {
    state.lastFrame = now;
    return;
  }

  state.lastFrame = now;

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
  if (state.raf || state.destroyed || state.reduced) return;
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
  /* 第二幕中：重绘静态背景 + 按当前滚动位置重新应用相机 */
  if (state.scene === 'orbital') {
    const maxScroll = orbitalEl.scrollHeight - orbitalEl.clientHeight;
    const p = maxScroll > 0 ? clamp(orbitalEl.scrollTop / maxScroll, 0, 1) : 0;
    renderOrbitalAt(p);
  }
}, CFG.resizeDebounce);

function onVisibility() {
  if (state.destroyed) return;

  if (document.hidden) {
    if (state.t0 && state.scene !== 'orbital') {
      state.pausedAt = performance.now() - state.t0;
    }
    stopLoop();
  } else if (!state.reduced && state.scene !== 'orbital') {
    if (state.pausedAt) {
      state.t0 = performance.now() - state.pausedAt;
    }
    state.lastFrame = 0;
    startLoop();
  }
}

function onReducedChange(e) {
  if (state.destroyed) return;
  state.reduced = e.matches;

  if (state.reduced) {
    stopLoop();
    renderStatic();
    showButton();
    /* 相机归位 */
    applyCamera(0);
  } else if (state.scene !== 'orbital') {
    state.t0 = state.pausedAt
      ? performance.now() - state.pausedAt
      : performance.now();
    state.lastFrame = 0;
    startLoop();
  } else {
    /* 从 reduced 恢复时，重新按当前滚动位置应用相机 */
    const maxScroll = orbitalEl.scrollHeight - orbitalEl.clientHeight;
    const p = maxScroll > 0 ? clamp(orbitalEl.scrollTop / maxScroll, 0, 1) : 0;
    renderOrbitalAt(p);
  }
}

function onBtnEnter() { state.targetBoost = 1; }
function onBtnLeave() { state.targetBoost = 0; }
function onBtnDown()  { state.targetBoost = 1.4; }
function onBtnUp()    { state.targetBoost = state.hoverBoost > 0.5 ? 1 : 0; }

function onUnload() { destroy(); }

/* ==========================================================
   §10 LIFECYCLE
   ========================================================== */

function startTransition() {
  if (state.scene !== 'hero') return;

  /* reduced-motion：跳过缩放转场，直接切到第二幕 */
  if (state.reduced) {
    enterOrbital();
    return;
  }

  state.scene = 'transitioning';
  state.transitionT0 = performance.now();
  state.lastFrame = 0;
}

function resize() {
  state.w = window.innerWidth;
  state.h = window.innerHeight;

  const cap = Math.min(QUALITY.dprCap, CFG.maxDPR);
  state.dpr = Math.min(window.devicePixelRatio || 1, cap);

  canvas.width  = Math.floor(state.w * state.dpr);
  canvas.height = Math.floor(state.h * state.dpr);
  canvas.style.width  = state.w + 'px';
  canvas.style.height = state.h + 'px';

  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

  const m = Math.min(state.w, state.h);
  const narrow = state.w < CFG.narrowViewport;
  state.R = m * (narrow ? CFG.narrowRadiusRatio : CFG.wideRadiusRatio);

  buildStars();
  buildNebula();

  if (state.scene === 'orbital') {
    drawOrbitalBackdrop();
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
  state.destroyed = true;

  stopLoop();
  autoAdvanceToken++;
  if (orbitalScrollRaf) {
    cancelAnimationFrame(orbitalScrollRaf);
    orbitalScrollRaf = 0;
  }

  window.removeEventListener('resize', onResize);
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('mousemove', onPointerMove);
  window.removeEventListener('pagehide', onUnload);
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

function setQuality(level, isRuntime) {
  if (!QUALITY_PRESETS[level]) return;

  state.quality = level;
  QUALITY = QUALITY_PRESETS[level];

  if (!isRuntime) return;

  buildSprites();
  resize();
}

function setPalette(name) {
  if (!PALETTES[name]) return;

  state.paletteKey = name;
  Object.assign(COLOR, PALETTES[name]);
  RGBA = buildRgbaTable();

  buildSprites();
  buildNebula();
}

function setConfig(partial) {
  if (!partial || typeof partial !== 'object') return;

  Object.assign(CFG, partial);

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

  /* 相机参数变化时，按当前滚动位置重新应用 */
  if (state.scene === 'orbital' && orbitalEl) {
    const maxScroll = orbitalEl.scrollHeight - orbitalEl.clientHeight;
    const p = maxScroll > 0 ? clamp(orbitalEl.scrollTop / maxScroll, 0, 1) : 0;
    renderOrbitalAt(p);
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
  overlayEl = document.getElementById('transitionOverlay');

  /* 第二幕元素 */
  backBtn = document.getElementById('backBtn');
  orbitalEl = document.getElementById('orbitalTimeline');
  satelliteEl = document.getElementById('satellite');
  spineGroupEl = document.getElementById('navArcSpineGroup');
  arcHudValueEl = document.getElementById('arcHudValue');
  polarisAnchorEl = document.querySelector('.polaris-anchor');

  /* 3D 空间装置的两层 */
  navArcLayerEl = document.getElementById('navArcLayer');
  arcCameraEl = document.getElementById('arcCamera');

  nodeEls.length = 0;
  document.querySelectorAll('.nav-node').forEach((el) => nodeEls.push(el));

  panelEls.length = 0;
  document.querySelectorAll('.nav-panel').forEach((el) => panelEls.push(el));

  routeLength = routePath.getTotalLength();
  placeNodes();
  buildSpineSegments();

  if (!canvas || typeof canvas.getContext !== 'function') {
    document.body.classList.add('no-canvas');
    if (button) button.classList.add('show');
    return;
  }

  ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    document.body.classList.add('no-canvas');
    if (button) button.classList.add('show');
    return;
  }

  state.quality = detectQualityLevel();
  QUALITY = QUALITY_PRESETS[state.quality];

  mqlReduce = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  state.reduced = !!(mqlReduce && mqlReduce.matches);

  buildSprites();
  resize();

  /* 初始化相机姿态（即使还没进入第二幕，也让 JS 掌握相机） */
  applyCamera(0);

  window.addEventListener('resize', onResize, { passive: true });

  if (state.reduced) {
    renderStatic();
    showButton();
  } else {
    if ('onpointermove' in window) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    } else {
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('mousemove', onPointerMove, { passive: true });
    }

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onUnload);

    if (mqlReduce && mqlReduce.addEventListener) {
      mqlReduce.addEventListener('change', onReducedChange);
    }

    state.t0 = performance.now();
    startLoop();
  }

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
  }

  bound = true;
}

if (typeof window !== 'undefined') {
  window.Polaris = api;
}

init();

export default api;