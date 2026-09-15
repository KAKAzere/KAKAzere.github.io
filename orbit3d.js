/**
 * Project Polaris — Cinematic Spatial Navigation v9 — Continuous Flight
 * ---------------------------------------------------------------------
 * Five fixed Space Beacons; the camera flies a single continuous route through them.
 *
 * v8 仍把 5 个构图点当成「四段独立 cubic Bézier + 各自 ease」，
 * smoothstep 在段端点导数≈0 → 相机在 02/03/04 速度归零 → 人脑判定「到站」。
 *
 * v9 的唯一改动：相机对全局进度不再分段、不再 ease、不再接缝。
 *   - 位置  cameraRoute : 一条全局 CatmullRomCurve3，getPointAt(t) 按弧长前进
 *   - 朝向  targetRoute : 另一条全局曲线，getPointAt(t + LOOK_AHEAD)
 *     视线始终略超前——经过某站是「扫过」它，而非「锁住」它。
 *   - fov / roll：过 5 个关键值的连续样条，节奏与位置一致。
 * 本版故意不做「站心速度谷」，先把连续轨迹本身跑通再谈速度编排。
 */

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// How far the look-ahead point leads the camera along the global timeline (in progress units).
const LOOK_AHEAD = 0.075;

export function createOrbit3D({ canvas, getQuality, getReducedMotion }) {
  let THREE;
  let renderer = null;
  let scene = null;
  let camera = null;
  let root = null;
  let dust = null;
  let initialized = false;
  let destroyed = false;
  let running = false;
  let raf = 0;
  let last = 0;
  let elapsed = 0;
  let progress = 0;
  let active = 0;
  let initPromise = null;

  const beacons = [];
  const disposableTextures = [];

  // v9 continuous flight routes (built once in build()).
  let cameraRoute = null; // camera position, global spline
  let targetRoute = null; // camera aim point, global spline
  let fovCurve = null;    // fov over progress, scalar spline (x holds the value)
  let rollCurve = null;   // roll over progress, scalar spline (x holds the value)

  // Irregular 3D constellation. Nodes stay fixed; the camera does the travelling.
  const beaconPositions = [
    [-3.05, -1.48,   0.20], // 01 Launch — near / lower-left
    [ 0.58,  1.02,  -4.85], // 02 Course — right/up / deeper
    [-2.42,  2.58,  -9.35], // 03 Orbit — upper-left / deep space
    [-0.92, -0.48,  -6.35], // 04 Ascent — directional turn
    [ 0.62,  3.72, -13.75], // 05 Polaris — distant anchor
  ];

  // Each scene is a composed camera shot rather than a point on a linear rail.
  // The first three shots are intentionally more distinct to establish the new language.
  const cameraFrames = [
    { pos: [-4.78, -1.92,  5.10], target: [-2.78, -1.42,  0.05], fov: 42.0, roll:  0.006 },
    { pos: [-0.92,  0.08,  0.35], target: [ 0.56,  1.01, -4.82], fov: 48.5, roll: -0.050 },
    { pos: [-4.10,  1.62, -4.45], target: [-2.40,  2.55, -9.30], fov: 41.5, roll:  0.042 },
    { pos: [-3.42, -1.08, -1.30], target: [-0.90, -0.45, -6.30], fov: 46.0, roll: -0.024 },
    { pos: [-1.55,  1.98, -6.15], target: [ 0.60,  3.67,-13.68], fov: 39.0, roll:  0.000 },
  ];

  // v9: five composition points become ONE global spline, not four stitched segments.
  // centripetal avoids overshoot/loops; getPointAt later travels by arc length, so a
  // sparse control cluster does NOT make the camera lurch and a dense one does NOT stall it.
  function buildFlightRoutes() {
    const mkSpline = (points) => {
      const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
      curve.arcLengthDivisions = 600;
      curve.updateArcLengths();
      return curve;
    };

    cameraRoute = mkSpline(cameraFrames.map((f) => new THREE.Vector3(f.pos[0], f.pos[1], f.pos[2])));
    targetRoute = mkSpline(cameraFrames.map((f) => new THREE.Vector3(f.target[0], f.target[1], f.target[2])));

    // fov / roll ride the same arc-length timeline: put the scalar on the x axis, read .x back.
    fovCurve = mkSpline(cameraFrames.map((f) => new THREE.Vector3(f.fov, 0, 0)));
    rollCurve = mkSpline(cameraFrames.map((f) => new THREE.Vector3(f.roll, 0, 0)));
  }

  function makeBeaconTexture(index) {
    const c = document.createElement('canvas');
    c.width = 384;
    c.height = 192;
    const g = c.getContext('2d');
    const cx = 94;
    const cy = 96;

    g.clearRect(0, 0, c.width, c.height);

    // v10: no ring, no ticks, no number. The 3D beacon is now only a faint ambient spark —
    // navigation identity moved to the fixed left navigator, so it must not re-grab attention.
    const halo = g.createRadialGradient(cx, cy, 0, cx, cy, 26);
    halo.addColorStop(0, 'rgba(200,220,255,0.10)');
    halo.addColorStop(1, 'rgba(125,168,255,0)');
    g.fillStyle = halo;
    g.beginPath();
    g.arc(cx, cy, 26, 0, Math.PI * 2);
    g.fill();

    // quiet spark
    g.fillStyle = 'rgba(226,236,255,0.55)';
    g.beginPath();
    g.arc(cx, cy, 3, 0, Math.PI * 2);
    g.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    disposableTextures.push(tex);
    return tex;
  }

  function createBeacon(index) {
    const material = new THREE.SpriteMaterial({
      map: makeBeaconTexture(index),
      transparent: true,
      opacity: index === 0 ? 1 : 0,
      depthWrite: false,
      depthTest: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.42, 0.42, 1);
    sprite.position.set(...beaconPositions[index]);
    sprite.renderOrder = 4;
    sprite.userData.baseScale = 1;
    return sprite;
  }

  function buildDust() {
    const count = getQuality?.() === 'low' ? 55 : getQuality?.() === 'mid' ? 90 : 130;
    const positions = new Float32Array(count * 3);
    const seed = 0.61803398875;

    for (let i = 0; i < count; i++) {
      // deterministic-ish distribution so resizing does not visually reshuffle everything
      const a = (i * seed) % 1;
      const b = (i * seed * 1.73) % 1;
      const c = (i * seed * 2.31) % 1;
      positions[i * 3]     = -6.2 + a * 9.2;
      positions[i * 3 + 1] = -4.2 + b * 9.5;
      positions[i * 3 + 2] = -15.5 + c * 19.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xc9d8f2,
      size: 0.028,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      sizeAttenuation: true,
    });
    dust = new THREE.Points(geometry, material);
    root.add(dust);
  }

  function build() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(43, 1, 0.1, 80);
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, getQuality?.() === 'low' ? 1 : 1.6));

    root = new THREE.Group();
    scene.add(root);

    for (let i = 0; i < beaconPositions.length; i++) {
      const beacon = createBeacon(i);
      beacons.push(beacon);
      root.add(beacon);
    }

    buildDust();
    buildFlightRoutes();
    applyScene(0, true);
    resize();
  }

  // One continuous camera state for any global progress p.
  // Position travels the global route by ARC LENGTH; aim leads by LOOK_AHEAD on the same route.
  // No per-segment easing, no stop at a node: position and aim are both C0->C1 smooth functions of p.
  function frameAt(p) {
    const t = clamp(p, 0, 1);
    const pos = cameraRoute.getPointAt(t);
    const target = targetRoute.getPointAt(Math.min(1, t + LOOK_AHEAD));
    const fov = fovCurve.getPointAt(t).x;
    const roll = rollCurve.getPointAt(t).x;
    const seg = clamp(Math.floor(t * 4), 0, 3); // kept only so dust rhythm is unchanged
    return { pos, target, fov, roll, seg };
  }

  function visibilityFor(index, p) {
    const sceneFloat = p * 4;
    const distance = Math.abs(index - sceneFloat);

    // Current + next beacon form the readable composition; passed beacons fall away quickly.
    let opacity = Math.max(0, 1 - distance * 0.54);
    if (index > sceneFloat + 1.90) opacity *= 0.08;
    if (index < sceneFloat - 1.10) opacity *= 0.10;

    // Opening shot: Launch is clear, Course is a destination, Orbit is only a distant hint.
    if (p < 0.055) {
      const start = [1, 0.34, 0.065, 0, 0];
      opacity = start[index];
    }

    // While flying 01→02 and 02→03, keep the destination visible before it becomes active.
    const seg = Math.min(3, Math.floor(sceneFloat));
    const local = sceneFloat - seg;
    if (index === seg + 1 && local > 0.18 && local < 0.92) {
      opacity = Math.max(opacity, 0.24 + local * 0.48);
    }

    return clamp(opacity, 0, 1);
  }

  function applyScene(p, immediate = false) {
    if (!camera || !beacons.length) return;
    progress = clamp(p, 0, 1);
    active = clamp(Math.round(progress * 4), 0, 4);

    const f = frameAt(progress);
    camera.position.copy(f.pos);
    camera.fov = f.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(f.target);
    camera.rotateZ(f.roll);

    beacons.forEach((beacon, index) => {
      const base = visibilityFor(index, progress);
      const sceneDistance = Math.abs(index - progress * 4);
      const focus = Math.max(0, 1 - sceneDistance);
      // v10: faint ambient spark. Scale changes only a little; brightness held low.
      const scale = 0.7 + focus * 0.12;

      beacon.material.opacity = base * 0.30;
      beacon.scale.set(0.42 * scale, 0.42 * scale, 1);
    });

    if (dust) {
      const travel = f.seg < 2 ? 0.09 : 0.05;
      dust.material.opacity = 0.15 + Math.sin(progress * Math.PI) * travel;
      dust.rotation.z = progress * 0.018;
      dust.position.x = Math.sin(progress * Math.PI * 1.4) * 0.06;
      dust.position.y = Math.sin(progress * Math.PI * 0.9) * 0.04;
    }

    if (immediate) render();
  }

  async function init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      THREE = await Promise.race([
        import(THREE_URL),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Three.js load timeout')), 7000)),
      ]);
      if (destroyed) return false;
      build();
      initialized = true;
      render();
      return true;
    })();
    return initPromise;
  }

  function render() {
    if (!renderer || !scene || !camera || destroyed) return;
    renderer.render(scene, camera);
  }

  function frame(now) {
    if (!running || destroyed) return;
    if (!last) last = now;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;

    // Very restrained idle motion. The scene should feel alive, never floaty.
    beacons.forEach((beacon, index) => {
      if (!beacon.material) return;
      const base = visibilityFor(index, progress);
      const pulse = index === active ? 0.012 * (0.5 + 0.5 * Math.sin(elapsed * 1.25)) : 0;
      beacon.material.opacity = clamp(base * 0.30 + pulse, 0, 1);
    });

    if (dust && !getReducedMotion?.()) {
      dust.rotation.y += dt * 0.0018;
    }

    render();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || destroyed || !initialized || getReducedMotion?.()) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  }

  function resize() {
    if (!renderer || !camera || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, getQuality?.() === 'low' ? 1 : 1.6));
    renderer.setSize(rect.width, rect.height, false);
    render();
  }

  function setProgress(p) {
    if (!initialized) {
      progress = clamp(p, 0, 1);
      active = clamp(Math.round(progress * 4), 0, 4);
      return;
    }
    applyScene(p);
    render();
  }

  function setReduced() {
    if (getReducedMotion?.()) stop();
    applyScene(progress, true);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();

    beacons.forEach((beacon) => {
      beacon.material?.dispose?.();
    });
    dust?.geometry?.dispose?.();
    dust?.material?.dispose?.();
    disposableTextures.forEach((texture) => texture.dispose?.());
    renderer?.dispose?.();

    beacons.length = 0;
    disposableTextures.length = 0;
    renderer = scene = camera = root = dust = null;
  }

  return {
    init,
    start,
    stop,
    resize,
    setProgress,
    setReduced,
    destroy,
    get ready() { return initialized; },
  };
}
