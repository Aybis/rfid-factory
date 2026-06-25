/**
 * RFID Solutions — Cinematic Warehouse Scene
 *
 * A persistent Three.js scene that follows a hero pallet through the 6-stage
 * RFID journey (Inbound -> Storage -> Picking -> Outbound -> Transit ->
 * Distributor Receiving). The camera tracks the pallet like a film dolly; scroll
 * drives journey progress; the overlay module projects pins onto 3D features.
 *
 * Built on the original facility scene, enhanced with: a hero pallet, a moving
 * shipment truck, a smart forklift, a distributor receiving area, and a
 * journey-driven follow camera.
 */

import * as THREE from 'three';
import { STAGES, WAYPOINTS, STAGE_COUNT, heroAt, camOffsetAt, stageIndexAt } from './journey';
import { setStage, projectPins } from './overlay';

// Shared scroll-driven journey progress in [0,1].
let journeyProgress = 0;
// Smoothed progress: lerped toward journeyProgress every frame for cinematic feel.
let smoothedProgress = 0;

// Dual-view mode: true when #warehouse-view section is the active viewport section.
let dualViewActive = false;

export function initScene3D(): () => void {
  'use strict';

  const container = document.getElementById('scene-3d-global');
  if (!container) return () => {};

  // ============================================
  // SCENE SETUP
  // ============================================

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // daytime sky blue
  scene.fog = new THREE.FogExp2(0xb8d5e8, 0.0025); // soft daytime haze
  const fog = scene.fog as THREE.FogExp2;

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 600);
  camera.position.set(24, 11, 0);
  camera.lookAt(8, 2, -16);

  // ── Dual-view cameras (used only in warehouse-overview section) ──
  // LEFT — Inbound: cinematic view of south dock — trucks arriving from left (west)
  const cameraLeft = new THREE.PerspectiveCamera(52, 0.5, 0.1, 600);
  cameraLeft.position.set(-14, 10, 28);
  cameraLeft.lookAt(6, 2, 13);

  // RIGHT — Outbound: north face RFID gates — pallets departing toward distributor
  const cameraRight = new THREE.PerspectiveCamera(52, 0.5, 0.1, 600);
  cameraRight.position.set(30, 8, -24);
  cameraRight.lookAt(8, 2, -10);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35; // bright daytime
  container.appendChild(renderer.domElement);

  // ============================================
  // INTERACTIVE CAMERA (drag-to-orbit, Ctrl+scroll-to-zoom, dbl-click reset)
  // ============================================

  let orbitYaw = 0;    // accumulated horizontal drag (radians)
  let orbitPitch = 0;  // accumulated vertical drag (radians)
  let orbitZoom = 2.0; // zoom multiplier — 2.0 = camera starts 2× further from pallet
  let dragActive = false;
  let isPanDrag = false; // true = right drag (pan), false = left drag (orbit)
  let dragLastX = 0;
  let dragLastY = 0;
  let pinchLastDist = 0;
  const panOffset = new THREE.Vector3(0, 0, 0); // world-space pan accumulator
  const PAN_SENS = 0.035;  // world units per pixel
  const ORBIT_SENS = 0.006;
  const ZOOM_SENS = 0.0012;

  // UI element selector — clicks on these should NOT start orbit
  const UI_SELECTOR = 'button, a, input, select, label, .nav, .pin, .immersive__card, .immersive__step, .immersive__cam-hint, .immersive__scroll-hint, .wv, .hero__content';

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0 && e.button !== 2) return;
    const target = e.target as HTMLElement;
    if (target.closest(UI_SELECTOR)) return; // skip UI clicks
    dragActive = true;
    isPanDrag = e.button === 2; // right = pan, left = orbit
    dragLastX = e.clientX;
    dragLastY = e.clientY;
    if (e.button === 2) e.preventDefault(); // suppress context menu
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!dragActive) return;
    const dx = e.clientX - dragLastX;
    const dy = e.clientY - dragLastY;
    if (isPanDrag) {
      // Right drag — PAN: translate camera+target in camera's local XZ plane
      const dir = new THREE.Vector3().subVectors(targetLookAt, targetCamPos).normalize();
      const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
      const forward = new THREE.Vector3(dir.x, 0, dir.z).normalize();
      panOffset.addScaledVector(right, -dx * PAN_SENS);
      panOffset.addScaledVector(forward, dy * PAN_SENS);
    } else {
      // Left drag — ORBIT: rotate camera around target
      orbitYaw -= dx * ORBIT_SENS;
      orbitPitch -= dy * ORBIT_SENS;
      orbitPitch = Math.max(-1.1, Math.min(1.1, orbitPitch));
    }
    dragLastX = e.clientX;
    dragLastY = e.clientY;
  };
  const onMouseUp = () => { dragActive = false; };

  // Ctrl/Cmd+scroll OR scroll-while-dragging → zoom. Normal scroll untouched for page journey.
  const onWheel = (e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey || dragActive)) return;
    e.preventDefault();
    orbitZoom *= 1 + e.deltaY * ZOOM_SENS;
    orbitZoom = Math.max(0.3, Math.min(8.0, orbitZoom));
  };

  // Double-click → reset all interactive offsets to defaults
  const onDblClick = () => {
    orbitYaw = 0; orbitPitch = 0; orbitZoom = 2.0; // reset zoom to the 2× default
    panOffset.set(0, 0, 0);
  };

  // Touch: single finger = orbit, two-finger pinch = zoom
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      dragActive = true;
      dragLastX = e.touches[0].clientX;
      dragLastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      dragActive = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchLastDist = Math.hypot(dx, dy);
    }
  };
  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && pinchLastDist > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy);
      orbitZoom *= pinchLastDist / d;
      orbitZoom = Math.max(0.25, Math.min(4.0, orbitZoom));
      pinchLastDist = d;
      e.preventDefault();
    } else if (e.touches.length === 1 && dragActive) {
      // Single-finger touch = ORBIT (matches left-drag behaviour)
      const dx = e.touches[0].clientX - dragLastX;
      const dy = e.touches[0].clientY - dragLastY;
      orbitYaw -= dx * ORBIT_SENS;
      orbitPitch -= dy * ORBIT_SENS;
      orbitPitch = Math.max(-1.1, Math.min(1.1, orbitPitch));
      dragLastX = e.touches[0].clientX;
      dragLastY = e.touches[0].clientY;
      e.preventDefault();
    }
  };
  const onTouchEnd = () => { dragActive = false; pinchLastDist = 0; };

  const domEl = renderer.domElement;
  // All pointer/wheel listeners on window so they fire even though the canvas
  // sits behind page overlays at zIndex:-1 and would otherwise never receive events.
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('dblclick', onDblClick);
  window.addEventListener('contextmenu', (e) => { if (dragActive) e.preventDefault(); });
  domEl.addEventListener('touchstart', onTouchStart, { passive: true });
  domEl.addEventListener('touchmove', onTouchMove, { passive: false });
  domEl.addEventListener('touchend', onTouchEnd);

  // Cursor feedback on the immersive sticky container (visible layer)
  const immersiveEl = document.getElementById('immersive');
  if (immersiveEl) immersiveEl.style.cursor = 'grab';
  window.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest(UI_SELECTOR)) return;
    if (immersiveEl) immersiveEl.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', () => {
    if (immersiveEl) immersiveEl.style.cursor = 'grab';
  });

  // ============================================
  // LIGHTING
  // ============================================

  const ambientLight = new THREE.AmbientLight(0xffe8c0, 2.2); // warm daytime sky
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff5e0, 3.0); // strong midday sun
  sunLight.position.set(30, 50, 20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 200;
  sunLight.shadow.camera.left = -90;
  sunLight.shadow.camera.right = 90;
  sunLight.shadow.camera.top = 60;
  sunLight.shadow.camera.bottom = -90;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0xaaccee, 0.6); // blue-sky fill
  fillLight.position.set(-20, 20, -10);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.3); // white rim
  rimLight.position.set(-10, 10, 30);
  scene.add(rimLight);

  const rfidLight1 = new THREE.PointLight(0x00d4ff, 1, 15);
  rfidLight1.position.set(8, 4, -8);
  scene.add(rfidLight1);

  const rfidLight2 = new THREE.PointLight(0x00e5a0, 0.8, 12);
  rfidLight2.position.set(-8, 3, 5);
  scene.add(rfidLight2);

  // Inbound zone light — illuminates dock apron and reader poles
  const inboundGateLight = new THREE.PointLight(0x00d4ff, 1.0, 20);
  inboundGateLight.position.set(9, 3, 13); // at conveyor RFID gate
  scene.add(inboundGateLight);

  const serverGlow = new THREE.PointLight(0x00ff88, 0.6, 10);
  serverGlow.position.set(-20, 4, -5);
  scene.add(serverGlow);

  // Interior warehouse ceiling lights — illuminate racks and floor from above
  const interiorLight1 = new THREE.PointLight(0xfff5e0, 1.5, 25);
  interiorLight1.position.set(8, 7, 2);
  scene.add(interiorLight1);
  const interiorLight2 = new THREE.PointLight(0xfff5e0, 1.2, 20);
  interiorLight2.position.set(14, 7, 5);
  scene.add(interiorLight2);
  const interiorLight3 = new THREE.PointLight(0xfff5e0, 1.2, 20);
  interiorLight3.position.set(4, 7, -3);
  scene.add(interiorLight3);

  // ============================================
  // MATERIALS
  // ============================================

  const mat = {
    ground: new THREE.MeshStandardMaterial({ color: 0x2e7a2e, roughness: 0.9 }),    // bright lawn green
    groundPad: new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.7, metalness: 0.2 }),
    road: new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.85 }),    // dark asphalt
    roadMark: new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 }),
    building: new THREE.MeshStandardMaterial({ color: 0xbbc8d4, roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide }),
    buildingDark: new THREE.MeshStandardMaterial({ color: 0x667788, roughness: 0.6, metalness: 0.4, side: THREE.DoubleSide }),
    roof: new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.6, metalness: 0.3, transparent: true, opacity: 0.25, side: THREE.FrontSide }),
    metal: new THREE.MeshStandardMaterial({ color: 0x889999, roughness: 0.3, metalness: 0.8 }),
    metalDark: new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.4, metalness: 0.7 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x88ccee, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.5 }),
    rfidCyan: new THREE.MeshStandardMaterial({ color: 0x00d4ff, roughness: 0.3, metalness: 0.5, emissive: 0x00d4ff, emissiveIntensity: 0.4 }),
    rfidGreen: new THREE.MeshStandardMaterial({ color: 0x00e5a0, roughness: 0.3, metalness: 0.5, emissive: 0x00e5a0, emissiveIntensity: 0.4 }),
    door: new THREE.MeshStandardMaterial({ color: 0x00aacc, roughness: 0.4, metalness: 0.5, emissive: 0x004455, emissiveIntensity: 0.15 }),
    crate: new THREE.MeshStandardMaterial({ color: 0xccaa77, roughness: 0.8 }),
    crateTag: new THREE.MeshStandardMaterial({ color: 0xeeeedd, roughness: 0.5 }),
    pallet: new THREE.MeshStandardMaterial({ color: 0x9c7a4d, roughness: 0.85 }),
    heroCrate: new THREE.MeshStandardMaterial({ color: 0xd9b676, roughness: 0.7 }),
    antenna: new THREE.MeshStandardMaterial({ color: 0xaabbcc, roughness: 0.4, metalness: 0.6 }),
    server: new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.3, metalness: 0.7 }),
    srvLed: new THREE.MeshStandardMaterial({ color: 0x00ff88, roughness: 0.2, emissive: 0x00ff88, emissiveIntensity: 0.5 }),
    conveyor: new THREE.MeshStandardMaterial({ color: 0x556666, roughness: 0.6, metalness: 0.5 }),
    belt: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 }),
    truck: new THREE.MeshStandardMaterial({ color: 0xccddee, roughness: 0.5, metalness: 0.3 }),
    truckBody: new THREE.MeshStandardMaterial({ color: 0x3a5a7a, roughness: 0.6 }),
    tree: new THREE.MeshStandardMaterial({ color: 0x2d6b3a, roughness: 0.9 }),
    treeDark: new THREE.MeshStandardMaterial({ color: 0x1d4a2a, roughness: 0.9 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x5a3d2b, roughness: 0.9 }),
    fence: new THREE.MeshStandardMaterial({ color: 0x667777, roughness: 0.5, metalness: 0.6 }),
    solar: new THREE.MeshStandardMaterial({ color: 0x223355, roughness: 0.3, metalness: 0.6 }),
    forklift: new THREE.MeshStandardMaterial({ color: 0xf5a623, roughness: 0.5, metalness: 0.3 }),
    scanLine: new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
    workerBody: new THREE.MeshStandardMaterial({ color: 0x2255aa, roughness: 0.8 }),
    workerSkin: new THREE.MeshStandardMaterial({ color: 0xf5c5a0, roughness: 0.9 }),
    workerVest: new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.7, emissive: 0xff4400, emissiveIntensity: 0.12 }),
    workerHelmet: new THREE.MeshStandardMaterial({ color: 0xf5a623, roughness: 0.5, metalness: 0.3, emissive: 0xf5a623, emissiveIntensity: 0.1 }),
    workerHelmetHub: new THREE.MeshStandardMaterial({ color: 0x33cc55, roughness: 0.5, metalness: 0.3 }),
    workerPants: new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.85 }),
  };

  // ============================================
  // HELPERS
  // ============================================

  function box(w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function cyl(rT: number, rB: number, h: number, seg: number, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg), material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // ============================================
  // BUILD THE MAIN FACILITY (Gudang Utama)
  // ============================================

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), mat.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  scene.add(ground);

  scene.add(box(55, 0.2, 45, mat.groundPad, 0, 0, 0));

  scene.add(box(55, 0.25, 3, mat.road, 0, 0.05, -12));
  scene.add(box(3, 0.25, 45, mat.road, -15, 0.05, 0));
  // South inbound road — diperpanjang ke timur agar truck x=60 tetap di aspal
  scene.add(box(100, 0.25, 14, mat.road, 12, 0.05, 18));
  // Edge lines (diperpanjang sesuai road)
  scene.add(box(100, 0.02, 0.2, mat.roadMark, 12, 0.28, 11.2));  // warehouse-side edge
  scene.add(box(100, 0.02, 0.2, mat.roadMark, 12, 0.28, 24.8));  // outer edge
  // Centre dashed line (extended to x=58)
  for (let i = -38; i <= 58; i += 4) {
    scene.add(box(1.8, 0.02, 0.25, mat.roadMark, i, 0.28, 18));
    scene.add(box(1.5, 0.02, 0.3, mat.roadMark, i, 0.28, -12));
  }

  // Highway to the distributor (runs north along x=8)
  scene.add(box(5, 0.25, 76, mat.road, 8, 0.05, -50));
  for (let z = -18; z >= -84; z -= 4) {
    scene.add(box(0.3, 0.02, 1.5, mat.roadMark, 8, 0.28, z));
  }

  // Main Warehouse — 5-panel DoubleSide construction; north face segmented for open doorways
  const matWall = mat.building.clone();
  (matWall as THREE.MeshStandardMaterial).side = THREE.DoubleSide; // visible inside & outside
  // South wall — segmented with 4 open dock bays at dx=2,9,16,23 (each 4-unit wide, h=5.5)
  scene.add(box(38, 6.5, 0.5, matWall, 8, 9.25, 10));     // top strip above all doors
  scene.add(box(11, 5.5, 0.5, matWall, -5.5, 2.75, 10)); // left pier x=-11..0
  scene.add(box(3,  5.5, 0.5, matWall, 5.5,  2.75, 10)); // pier between bay1 & bay2 (x=4..7)
  scene.add(box(3,  5.5, 0.5, matWall, 12.5, 2.75, 10)); // pier between bay2 & bay3 (x=11..14)
  scene.add(box(3,  5.5, 0.5, matWall, 19.5, 2.75, 10)); // pier between bay3 & bay4 (x=18..21)
  scene.add(box(2,  5.5, 0.5, matWall, 26,   2.75, 10)); // right pier x=25..27
  scene.add(box(0.5, 12, 16, matWall, 27, 6, 2));           // east wall (x=27)
  scene.add(box(0.5, 12, 16, matWall, -11, 6, 2));          // west wall (x=-11)
  scene.add(box(38, 0.4, 16, matWall, 8, 12, 2));           // ceiling
  scene.add(box(38, 0.3, 16, mat.buildingDark, 8, 0.15, 2)); // interior floor
  // North wall — segmented (door openings at x=1,7,13,19, each 4-unit wide, h=5.5)
  scene.add(box(38, 6.5, 0.5, matWall, 8, 9.25, -6));      // top strip above all doors
  scene.add(box(10, 5.5, 0.5, matWall, -6, 2.75, -6));     // left pier x=-11..-1
  scene.add(box(2,  5.5, 0.5, matWall, 4,  2.75, -6));     // pier between door1 & door2 (x=3..5)
  scene.add(box(2,  5.5, 0.5, matWall, 10, 2.75, -6));     // pier between door2 & door3 (x=9..11)
  scene.add(box(2,  5.5, 0.5, matWall, 16, 2.75, -6));     // pier between door3 & door4 (x=15..17)
  scene.add(box(6,  5.5, 0.5, matWall, 24, 2.75, -6));     // right pier x=21..27
  scene.add(box(39, 0.6, 17, mat.roof, 8, 12.3, 2));
  scene.add(box(39, 2, 0.5, mat.metalDark, 8, 13.2, 2));
  // High-band windows — outside new 0.5-thick wall faces (north: z=-6.4, south: z=10.4)
  for (let i = -10; i <= 26; i += 4) {
    scene.add(box(2.5, 3, 0.1, mat.glass, i, 8.5, -6.4));  // north face exterior
    scene.add(box(2.5, 3, 0.1, mat.glass, i, 8.5, 10.4));  // south face exterior
  }
  // Outbound dock doors — genuine open frames, no blocking panels
  for (const dx of [1, 7, 13, 19]) {
    scene.add(box(0.3, 6.0, 0.35, mat.metalDark, dx - 2.2, 3.0, -6.2)); // left jamb
    scene.add(box(0.3, 6.0, 0.35, mat.metalDark, dx + 2.2, 3.0, -6.2)); // right jamb
    scene.add(box(4.6, 0.6, 0.45, mat.door, dx, 5.8, -6.2));             // rolled-up door header
    scene.add(box(4.9, 0.3, 0.35, mat.metalDark, dx, 6.2, -6.2));        // top frame bar
  }

  // RFID Gate Portals
  function createGate(x: number, y: number, z: number, rotY: number): THREE.Group {
    const g = new THREE.Group();
    g.add(box(0.35, 4.2, 0.35, mat.metalDark, -1.5, 2.1, 0));
    g.add(box(0.35, 4.2, 0.35, mat.metalDark, 1.5, 2.1, 0));
    g.add(box(3.35, 0.25, 0.35, mat.metalDark, 0, 4.15, 0));
    g.add(box(0.08, 2.8, 0.7, mat.rfidCyan, -1.3, 2.6, 0));
    g.add(box(0.08, 2.8, 0.7, mat.rfidCyan, 1.3, 2.6, 0));
    g.add(box(2, 0.08, 0.7, mat.rfidCyan, 0, 4.05, 0));
    g.add(cyl(0.12, 0.12, 0.25, 8, mat.rfidGreen, 0, 4.4, 0));
    g.position.set(x, y, z);
    if (rotY) g.rotation.y = rotY;
    return g;
  }
  scene.add(createGate(1, 0.1, -8, 0));
  scene.add(createGate(7, 0.1, -8, 0));
  scene.add(createGate(13, 0.1, -8, 0));
  scene.add(createGate(19, 0.1, -8, 0));   // 4th gate for wider warehouse
  scene.add(createGate(-8, 0.1, 5, Math.PI / 2));

  // ============================================
  // INBOUND DOCK AREA — South (Back) Face of Warehouse
  // Trucks approach from the left (west) along the south road and
  // back into the dock for inbound receiving — mirrored opposite outbound.
  // ============================================

  // South road extends to warehouse wall — no separate groundPad needed

  // Dock bumper rail — full south face width
  scene.add(box(38, 0.4, 0.4, mat.metalDark, 8, 0.2, 10.2));

  // Loading dock doors — 4 bays, shown OPEN
  // Dark interior plane simulates depth through open opening (avoids needing CSG holes)
  // Inbound dock bays — open frames only (no blocking panels; bays are truly hollow)
  for (const dx of [2, 9, 16, 23]) {
    scene.add(box(0.3, 6.0, 0.35, mat.metalDark, dx - 2.2, 3.0, 10.2));  // left jamb
    scene.add(box(0.3, 6.0, 0.35, mat.metalDark, dx + 2.2, 3.0, 10.2));  // right jamb
    scene.add(box(4.6, 0.6, 0.45, mat.door, dx, 5.8, 10.2));              // rolled-up door header
    scene.add(box(4.9, 0.3, 0.35, mat.metalDark, dx, 6.2, 10.2));         // top frame bar
  }

  // Dock canopies — cantilever design (no front columns in truck lane)
  for (const dx of [2, 9, 16, 23]) {
    scene.add(box(5.5, 0.28, 5.5, mat.metalDark, dx, 6.4, 12.8)); // canopy roof
    scene.add(box(0.22, 2.0, 0.22, mat.metal, dx - 2, 5.5, 10.3)); // left wall bracket
    scene.add(box(0.22, 2.0, 0.22, mat.metal, dx + 2, 5.5, 10.3)); // right wall bracket
    scene.add(box(5.5, 0.12, 0.18, mat.metal, dx, 6.25, 10.4));   // horizontal bracket beam
  }

  // ── Inbound dock conveyor — N-S belt from dock door to truck parking zone ──
  // Truck parks at z=18, dock wall at z=10; conveyor bridges the gap at dock bay x=9
  scene.add(box(2, 0.3, 7.0, mat.conveyor, 9, 1.2, 14.0));      // belt frame (z=10.5→17.5)
  scene.add(box(1.6, 0.08, 6.5, mat.belt, 9, 1.38, 14.0));     // belt surface
  for (let iz = 11.5; iz <= 16.5; iz += 2) {
    scene.add(box(0.3, 1.2, 0.3, mat.metalDark, 8.1, 0.6, iz)); // left leg
    scene.add(box(0.3, 1.2, 0.3, mat.metalDark, 9.9, 0.6, iz)); // right leg
  }
  // ── RFID reader gate (palang) over inbound conveyor ──
  // Posts straddle the belt (belt width 1.6, posts at ±1.3 from centre x=9)
  const conveyorGate = new THREE.Group();
  conveyorGate.add(box(0.22, 3.2, 0.22, mat.metalDark, -1.3, 1.6, 0)); // left post
  conveyorGate.add(box(0.22, 3.2, 0.22, mat.metalDark,  1.3, 1.6, 0)); // right post
  conveyorGate.add(box(2.85, 0.22, 0.28, mat.metalDark, 0, 3.1, 0));   // top beam
  conveyorGate.add(box(0.07, 1.8, 0.5, mat.rfidCyan, -1.1, 2.1, 0));   // left RFID panel
  conveyorGate.add(box(0.07, 1.8, 0.5, mat.rfidCyan,  1.1, 2.1, 0));   // right RFID panel
  conveyorGate.add(box(1.8, 0.07, 0.5, mat.rfidCyan,   0,  3.05, 0));  // top RFID panel
  conveyorGate.add(cyl(0.09, 0.09, 0.18, 8, mat.rfidGreen, 0, 3.25, 0)); // status indicator light
  conveyorGate.position.set(9, 0, 13); // at z=13, on top of conveyor structure
  scene.add(conveyorGate);

  // Crates on conveyor — hidden until truck arrives (shown by scroll-driven logic)
  const dockCratesGroup = new THREE.Group();
  dockCratesGroup.add(box(1.2, 1.0, 1.0, mat.crate, 9, 2.0, 16.5));
  dockCratesGroup.add(box(0.5, 0.3, 0.04, mat.crateTag, 9, 2.2, 16.0));
  dockCratesGroup.add(box(1.0, 0.8, 1.0, mat.crate, 9, 1.9, 13.5));
  dockCratesGroup.add(box(1.2, 1.0, 1.0, mat.crate, 9, 2.0, 11.5));
  dockCratesGroup.visible = false;
  scene.add(dockCratesGroup);

  // ── Inbound hero RFID pallet — appears on belt when truck stops at conveyor ──
  // Positioned approaching the RFID gate (z=15.5, south of gate at z=13)
  const inboundHeroPallet = new THREE.Group();
  inboundHeroPallet.add(box(1.8, 0.22, 1.8, mat.pallet, 0, 0.11, 0));          // pallet board
  inboundHeroPallet.add(box(1.5, 1.5, 1.5, mat.heroCrate, 0, 0.97, 0));        // main crate
  inboundHeroPallet.add(box(0.6, 0.42, 0.05, mat.rfidGreen, 0, 1.15, 0.77));   // glowing RFID tag
  inboundHeroPallet.add(box(1.2, 0.04, 1.2, mat.crateTag, 0, 1.75, 0));        // top label band
  const inboundPalletGlow = new THREE.PointLight(0x00e5a0, 0.8, 6);
  inboundPalletGlow.position.set(0, 1.2, 0);
  inboundHeroPallet.add(inboundPalletGlow);
  inboundHeroPallet.visible = false;
  scene.add(inboundHeroPallet);

  // RFID pallet portal moved off road — small reader post beside road near trees
  scene.add(box(0.2, 3.0, 0.2, mat.metalDark, -2, 1.5, 25));  // post near tree x=0,z=27
  scene.add(box(0.8, 0.3, 0.4, mat.door, -2, 3.1, 25));        // reader head

  // Truck lane clear — static dock crates dihapus (digantikan oleh dockCratesGroup + inboundHeroPallet)

  // Street lamps — roadside on grass edge (z=27), arm faces road (rotY=PI/2)
  scene.add(createStreetLamp(-20, 27, Math.PI / 2));
  scene.add(createStreetLamp(-5,  27, Math.PI / 2));
  scene.add(createStreetLamp(13,  27, Math.PI / 2));
  scene.add(createStreetLamp(28,  27, Math.PI / 2));

  // Server Room
  scene.add(box(10, 6, 8, mat.buildingDark, -20, 3, -5));
  scene.add(box(11, 0.4, 9, mat.roof, -20, 6.2, -5));
  for (let i = -23; i <= -17; i += 3) scene.add(box(1.5, 1.5, 0.1, mat.glass, i, 4, -9.05));
  const serverLeds: THREE.Mesh[] = [];
  for (let i = -23; i <= -17; i += 2) {
    scene.add(box(0.8, 4, 1.5, mat.server, i, 2.5, -6));
    for (let j = 1; j <= 4; j++) {
      const led = box(0.3, 0.08, 0.08, mat.srvLed, i, j, -5.2);
      scene.add(led);
      serverLeds.push(led);
    }
  }
  scene.add(cyl(0.2, 0.3, 2, 8, mat.metal, -17, 7.2, -3));
  const dish = cyl(1.2, 0.3, 0.3, 16, mat.antenna, -17, 8.5, -3);
  dish.rotation.x = -0.4;
  scene.add(dish);

  // Interior conveyor dihapus — tengah gudang kosong sebagai aisle

  // Pallet Racks — kiri (x=3) dan kanan (x=22) saja, tengah lowong untuk forklift
  function createRack(rx: number, rz: number): THREE.Group {
    const g = new THREE.Group();
    g.add(box(0.18, 6, 0.18, mat.metalDark, -1.5, 3, 0));   // left upright
    g.add(box(0.18, 6, 0.18, mat.metalDark, 1.5, 3, 0));    // right upright
    for (let i = 1; i <= 5.5; i += 1.5) g.add(box(3.4, 0.1, 1.3, mat.metal, 0, i, 0));
    for (let i = 1.2; i <= 5; i += 1.5) {
      g.add(box(1.3, 0.9, 0.9, mat.crate, -0.5, i + 0.45, 0));
      g.add(box(1.1, 0.7, 0.9, mat.crate, 0.9, i + 0.35, 0));
    }
    g.position.set(rx, 0, rz);
    return g;
  }
  // Kiri (x=3) dan Kanan (x=22) — tengah warehouse kosong
  for (let z = -5; z <= 7; z += 3) {
    scene.add(createRack(3, z));   // rak kiri
    scene.add(createRack(22, z));  // rak kanan
  }

  // Antenna Towers
  function createStreetLamp(tx: number, tz: number, rotY = 0): THREE.Group {
    const g = new THREE.Group();
    // Pole
    g.add(cyl(0.1, 0.14, 6, 8, mat.metalDark, 0, 3, 0));
    // Base
    g.add(cyl(0.35, 0.45, 0.25, 8, mat.metalDark, 0, 0.12, 0));
    // Arm (horizontal bracket pointing in local +x)
    g.add(box(1.6, 0.1, 0.1, mat.metalDark, 0.8, 6.1, 0));
    // Lamp head
    g.add(box(0.75, 0.25, 0.55, mat.metalDark, 1.6, 5.9, 0));
    // Lamp glass (warm yellow)
    const lampGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.12, 0.38),
      new THREE.MeshStandardMaterial({ color: 0xffe580, emissive: 0xffcc44, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 })
    );
    lampGlass.position.set(1.6, 5.82, 0);
    g.add(lampGlass);
    g.position.set(tx, 0, tz);
    g.rotation.y = rotY;
    return g;
  }

  function createTower(tx: number, tz: number, h: number): THREE.Group {
    const g = new THREE.Group();
    g.add(cyl(0.12, 0.18, h, 8, mat.metal, 0, h / 2, 0));
    g.add(cyl(0.5, 0.7, 0.3, 8, mat.groundPad, 0, 0.15, 0));
    const p1 = box(0.7, 1, 0.12, mat.antenna, 0, h - 0.7, 0.25);
    g.add(p1);
    const p2 = box(0.7, 1, 0.12, mat.antenna, 0.25, h - 0.7, 0);
    p2.rotation.y = Math.PI / 3;
    g.add(p2);
    const p3 = box(0.7, 1, 0.12, mat.antenna, -0.25, h - 0.7, 0);
    p3.rotation.y = -Math.PI / 3;
    g.add(p3);
    g.add(cyl(0.08, 0.08, 0.2, 8, mat.rfidGreen, 0, h + 0.1, 0));
    g.position.set(tx, 0, tz);
    return g;
  }
  scene.add(createTower(25, -18, 12));
  // (removed road-center lamps — now all on roadside above)

  // Inbound truck material variant (green cab for visual distinction)
  const matInboundCab = new THREE.MeshStandardMaterial({ color: 0x3a6a4a, roughness: 0.6 });

  // Parked scenery trucks
  function createTruck(tx: number, tz: number, ry: number): THREE.Group {
    const g = new THREE.Group();
    g.add(box(2.5, 2.5, 3, mat.truck, 0, 1.5, -2.5));
    g.add(box(2.2, 1, 0.1, mat.glass, 0, 2.2, -4));
    g.add(box(2.8, 3, 7, mat.truckBody, 0, 1.8, 2));
    (
      [
        [-1.2, -2.5],
        [-1.2, 1],
        [1.2, -2.5],
        [1.2, 1],
      ] as Array<[number, number]>
    ).forEach(([wx, wz]) => {
      const w = cyl(0.4, 0.4, 0.3, 12, mat.metalDark, wx, 0.4, wz);
      w.rotation.z = Math.PI / 2;
      g.add(w);
    });
    g.position.set(tx, 0, tz);
    if (ry) g.rotation.y = ry;
    return g;
  }
  scene.add(createTruck(16, -16, 0));

  // ── Realistic container truck (green cab) ──────────────────────────────────
  function createInboundTruck(tx: number, tz: number, ry: number): THREE.Group {
    const g = new THREE.Group();

    // === CAB ===
    // Lower cab body
    g.add(box(2.7, 2.0, 3.4, matInboundCab, 0, 1.2, -2.7));
    // Upper cab sleeper/roof
    g.add(box(2.6, 1.4, 2.8, matInboundCab, 0, 2.9, -2.4));
    // Roof aero fairing
    g.add(box(2.5, 0.5, 1.6, mat.metalDark, 0, 3.7, -2.0));
    // Windshield (angled)
    g.add(box(2.3, 1.3, 0.12, mat.glass, 0, 2.5, -4.2));
    // Side windows
    g.add(box(0.12, 0.85, 1.1, mat.glass, -1.32, 2.6, -2.9));
    g.add(box(0.12, 0.85, 1.1, mat.glass,  1.32, 2.6, -2.9));
    // Side mirrors
    g.add(box(0.55, 0.28, 0.18, mat.metalDark, -1.65, 2.8, -3.9));
    g.add(box(0.55, 0.28, 0.18, mat.metalDark,  1.65, 2.8, -3.9));
    // Front grille / bumper
    g.add(box(2.7, 0.55, 0.22, mat.metalDark, 0, 0.6, -4.3));
    g.add(box(2.0, 0.35, 0.14, mat.metal, 0, 1.0, -4.32));
    // Headlights
    g.add(box(0.5, 0.3, 0.1, mat.rfidCyan, -0.9, 0.85, -4.35));
    g.add(box(0.5, 0.3, 0.1, mat.rfidCyan,  0.9, 0.85, -4.35));
    // Exhaust stacks
    const ex1 = cyl(0.1, 0.1, 2.0, 8, mat.metalDark, -1.15, 3.2, -1.6); g.add(ex1);
    const ex2 = cyl(0.1, 0.1, 2.0, 8, mat.metalDark,  1.15, 3.2, -1.6); g.add(ex2);
    // Chassis / frame rails
    g.add(box(0.18, 0.3, 14.5, mat.metalDark, -1.1, 0.35, 0));
    g.add(box(0.18, 0.3, 14.5, mat.metalDark,  1.1, 0.35, 0));
    // Fuel tanks
    g.add(box(0.4, 0.9, 2.0, mat.metal, -1.3, 0.85, -0.8));
    g.add(box(0.4, 0.9, 2.0, mat.metal,  1.3, 0.85, -0.8));
    // Fifth-wheel plate
    g.add(box(1.4, 0.2, 1.1, mat.metalDark, 0, 1.25, -1.0));

    // === CONTAINER BODY ===
    // Main box
    g.add(box(2.85, 3.2, 9.5, mat.truckBody, 0, 2.15, 3.25));
    // Horizontal ribs (structural detail)
    for (let rz = -1.0; rz <= 7.5; rz += 1.6) {
      g.add(box(2.92, 0.1, 0.1, mat.metalDark, 0, 0.7, rz));
      g.add(box(2.92, 0.1, 0.1, mat.metalDark, 0, 3.7, rz));
    }
    // Vertical corner posts
    g.add(box(0.14, 3.5, 0.14, mat.metalDark, -1.42, 2.15, -0.95));
    g.add(box(0.14, 3.5, 0.14, mat.metalDark,  1.42, 2.15, -0.95));
    g.add(box(0.14, 3.5, 0.14, mat.metalDark, -1.42, 2.15,  7.45));
    g.add(box(0.14, 3.5, 0.14, mat.metalDark,  1.42, 2.15,  7.45));
    // Rear doors
    g.add(box(1.3, 2.9, 0.1, mat.metalDark, -0.72, 2.15, 7.55));
    g.add(box(1.3, 2.9, 0.1, mat.metalDark,  0.72, 2.15, 7.55));
    g.add(box(0.06, 2.6, 0.22, mat.metal, 0, 2.15, 7.65));  // centre door seal

    // === CARGO INSIDE CONTAINER ===
    // Pallets stacked at rear of container (local z ≈ 4..7, visible when rear door opens)
    g.add(box(1.1, 0.15, 1.0, mat.metalDark, -0.5, 0.85, 5.5));  // pallet board
    g.add(box(1.1, 0.15, 1.0, mat.metalDark,  0.5, 0.85, 5.5));
    g.add(box(1.0, 0.9,  0.9, mat.crate, -0.5, 1.5, 5.5));
    g.add(box(1.0, 0.9,  0.9, mat.crate,  0.5, 1.5, 5.5));
    g.add(box(1.0, 0.9,  0.9, mat.crate, -0.5, 2.4, 5.5));
    g.add(box(0.5, 0.3, 0.04, mat.crateTag, -0.5, 1.55, 5.07));  // RFID tag sticker
    g.add(box(0.5, 0.3, 0.04, mat.crateTag,  0.5, 1.55, 5.07));
    g.add(box(1.1, 0.15, 1.0, mat.metalDark, -0.5, 0.85, 3.8));
    g.add(box(1.0, 0.9,  0.9, mat.crate, -0.5, 1.5, 3.8));
    g.add(box(1.0, 0.9,  0.9, mat.crate,  0.5, 0.85, 3.8));
    g.add(box(1.1, 0.15, 1.0, mat.metalDark,  0.5, 0.15, 3.8));

    // === WHEELS ===
    // Front steer axle (2 wheels)
    ([ [-1.3, -3.6], [1.3, -3.6] ] as Array<[number,number]>).forEach(([wx, wz]) => {
      const w = cyl(0.46, 0.46, 0.32, 14, mat.metalDark, wx, 0.46, wz);
      w.rotation.z = Math.PI / 2; g.add(w);
      const h = cyl(0.2, 0.2, 0.34, 8, mat.metal, wx, 0.46, wz);
      h.rotation.z = Math.PI / 2; g.add(h);
    });
    // Drive axles (dual rear wheels, 3 axle positions)
    ([0.9, 2.2, 4.5] as number[]).forEach(wz => {
      ([-1.2, -1.55, 1.2, 1.55] as number[]).forEach(wx => {
        const w = cyl(0.44, 0.44, 0.28, 14, mat.metalDark, wx, 0.44, wz);
        w.rotation.z = Math.PI / 2; g.add(w);
      });
    });

    g.position.set(tx, 0, tz);
    if (ry) g.rotation.y = ry;
    return g;
  }

  // ============================================
  // WORKER HUMANOIDS
  // ============================================

  interface WorkerRefs {
    group: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    carryCrate: THREE.Mesh;
    scanner: THREE.Mesh;
  }

  function createWorker(helmetMat: THREE.Material): WorkerRefs {
    const g = new THREE.Group();

    // Legs (pivot at hip)
    const leftLeg = new THREE.Group();
    leftLeg.add(box(0.17, 0.54, 0.19, mat.workerPants, 0, -0.27, 0));
    leftLeg.position.set(-0.11, 0.97, 0);
    g.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.add(box(0.17, 0.54, 0.19, mat.workerPants, 0, -0.27, 0));
    rightLeg.position.set(0.11, 0.97, 0);
    g.add(rightLeg);

    // Torso + vest
    g.add(box(0.44, 0.58, 0.27, mat.workerBody, 0, 1.3, 0));
    g.add(box(0.46, 0.36, 0.29, mat.workerVest, 0, 1.2, 0)); // hi-vis vest band

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 8, 7), mat.workerSkin);
    head.position.set(0, 1.74, 0);
    head.castShadow = true;
    g.add(head);

    // Helmet
    const helm = cyl(0.175, 0.165, 0.14, 10, helmetMat, 0, 1.87, 0);
    g.add(helm);

    // Arms (pivot at shoulder)
    const leftArm = new THREE.Group();
    leftArm.add(box(0.15, 0.48, 0.15, mat.workerBody, 0, -0.24, 0));
    leftArm.position.set(-0.3, 1.57, 0);
    g.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.add(box(0.15, 0.48, 0.15, mat.workerBody, 0, -0.24, 0));
    rightArm.position.set(0.3, 1.57, 0);
    g.add(rightArm);

    // Scanner (small handheld device, attached to right arm)
    const scanner = box(0.1, 0.22, 0.07, mat.rfidCyan, 0.05, -0.55, 0.07);
    scanner.visible = false;
    rightArm.add(scanner);

    // Carry crate (held in front when carrying)
    const carryCrate = box(0.6, 0.55, 0.55, mat.heroCrate, 0, 1.28, -0.45);
    carryCrate.visible = false;
    g.add(carryCrate);

    return { group: g, leftArm, rightArm, leftLeg, rightLeg, carryCrate, scanner };
  }

  const worker1 = createWorker(mat.workerHelmet);
  worker1.group.position.set(8, 0, -60); // hidden initially
  scene.add(worker1.group);

  const worker2 = createWorker(mat.workerHelmet);
  worker2.group.position.set(0, -60, 0);
  scene.add(worker2.group);

  const hubWorker = createWorker(mat.workerHelmetHub);
  hubWorker.group.position.set(8, 0, -60); // hidden initially
  scene.add(hubWorker.group);

  // Guard Booth
  scene.add(box(3, 3, 3, mat.building, -25, 1.5, -12));
  scene.add(box(3.5, 0.3, 3.5, mat.roof, -25, 3.15, -12));
  scene.add(box(2, 1.5, 0.1, mat.glass, -25, 2, -13.55));

  // Trees
  function createTree(tx: number, tz: number, s: number): THREE.Group {
    const g = new THREE.Group();
    g.add(cyl(0.12 * s, 0.2 * s, 2 * s, 6, mat.trunk, 0, s, 0));
    const f1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 * s, 1), mat.tree);
    f1.position.set(0, 2.3 * s, 0);
    f1.castShadow = true;
    g.add(f1);
    const f2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 * s, 1), mat.treeDark);
    f2.position.set(0.4 * s, 3 * s, 0.2 * s);
    f2.castShadow = true;
    g.add(f2);
    g.position.set(tx, 0, tz);
    return g;
  }
  (
    [
      [-30, -20, 1.2], [-33, -15, 0.9], [-30, -8, 1.1], [-32, 0, 1.0], [-30, 8, 1.3],
      [-33, 15, 0.8], [-30, 22, 1.1], [30, -3, 0.9], [33, 5, 1.1], [30, 13, 1.0],
      [32, 20, 1.3], [-10, 25, 0.9], [0, 27, 1.1], [10, 25, 1.0], [20, 26, 0.8],
      // line the highway to the distributor
      [-2, -30, 1.0], [18, -34, 0.9], [-2, -50, 1.1], [18, -54, 1.0], [-2, -70, 0.9], [18, -74, 1.1],
    ] as Array<[number, number, number]>
  ).forEach(([tx, tz, ts]) => scene.add(createTree(tx, tz, ts)));

  // ============================================
  // NEIGHBORING COMPANY BUILDINGS
  // ============================================

  /** Create a small company building with a floating canvas label. */
  function createCompanyBuilding(
    cx: number, cz: number,
    w: number, h: number, d: number,
    wallColor: number, roofColor: number,
    label: string,
    accentColor: number = 0x2255aa
  ): THREE.Group {
    const g = new THREE.Group();

    // Ground pad
    const padMat = new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.7 });
    g.add(box(w + 4, 0.18, d + 4, padMat, 0, 0.09, 0));

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.5, metalness: 0.2 });
    g.add(box(w, h, d, wallMat, 0, h / 2, 0));

    // Roof panel
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.55, metalness: 0.25 });
    g.add(box(w + 0.4, 0.4, d + 0.4, roofMat, 0, h + 0.2, 0));

    // Accent band (facade stripe)
    const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.4, metalness: 0.5 });
    g.add(box(w, 0.6, 0.15, accentMat, 0, h * 0.55, d / 2 + 0.08));

    // Door
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.4 });
    g.add(box(1.4, 2.5, 0.12, doorMat, 0, 1.25, d / 2 + 0.07));

    // Windows (2 each side)
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccee, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.75 });
    for (const wx of [-w * 0.28, w * 0.28]) {
      g.add(box(1.4, 1.2, 0.09, glassMat, wx, h * 0.6, d / 2 + 0.06));
    }

    // Floating text label via canvas sprite
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx2 = canvas.getContext('2d')!;
    // Background pill
    ctx2.fillStyle = `#${accentColor.toString(16).padStart(6, '0')}cc`;
    ctx2.beginPath();
    ctx2.roundRect(8, 8, 496, 112, 20);
    ctx2.fill();
    // Text
    ctx2.fillStyle = '#ffffff';
    ctx2.font = 'bold 64px Arial, sans-serif';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillText(label, 256, 64);
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(6, 1.5, 1);
    sprite.position.set(0, h + 2.2, 0);
    g.add(sprite);

    g.position.set(cx, 0, cz);
    return g;
  }

  // ── Company buildings (all clear of main road z=11–25) ──────

  // TOYOTA — north-east corner, very large red-accent campus
  // Main hall
  scene.add(createCompanyBuilding(62, 56, 34, 12, 20, 0xdce4ec, 0x222222, 'Toyota', 0xcc1111));
  // Side annex
  {
    const annexMat = new THREE.MeshStandardMaterial({ color: 0xc8d0d8, roughness: 0.5 });
    const roofMat  = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
    scene.add(box(16, 8, 14, annexMat, 84, 4, 56));
    scene.add(box(16.4, 0.4, 14.4, roofMat, 84, 8.2, 56));
  }
  // Parking pad
  scene.add(box(50, 0.15, 10, new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 }), 68, 0.08, 39));
  // Trees around Toyota
  scene.add(createTree(42, 50, 1.2)); scene.add(createTree(90, 50, 1.1));
  scene.add(createTree(44, 62, 1.0)); scene.add(createTree(90, 62, 1.3));
  scene.add(createTree(62, 70, 0.9));

  // DAIHATSU — north-west, large orange-accent
  scene.add(createCompanyBuilding(-28, 54, 30, 11, 18, 0xeee8dc, 0x333322, 'Daihatsu', 0xdd6600));
  // Annex
  {
    const aM = new THREE.MeshStandardMaterial({ color: 0xe0dcd0, roughness: 0.5 });
    const rM = new THREE.MeshStandardMaterial({ color: 0x333322, roughness: 0.6 });
    scene.add(box(14, 7, 13, aM, -50, 3.5, 54));
    scene.add(box(14.4, 0.4, 13.4, rM, -50, 7.2, 54));
  }
  scene.add(box(44, 0.15, 9, new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 }), -30, 0.08, 41));
  scene.add(createTree(-10, 50, 1.1)); scene.add(createTree(-50, 48, 1.2));
  scene.add(createTree(-12, 62, 1.0)); scene.add(createTree(-50, 62, 1.0));
  scene.add(createTree(-30, 68, 1.3));

  // UDSO — far east, north of road (z=46 >> road ends at z=25), green-accent
  // Building spans z=46±9 = z37–55, x=75±13 = x62–88 → no road conflict
  scene.add(createCompanyBuilding(75, 46, 26, 10, 18, 0xe0ece0, 0x223322, 'UDSO', 0x229944));
  // Annex
  {
    const aM = new THREE.MeshStandardMaterial({ color: 0xd4e4d4, roughness: 0.5 });
    scene.add(box(13, 7, 12, aM, 96, 3.5, 46));
    scene.add(box(13.4, 0.4, 12.4, new THREE.MeshStandardMaterial({ color: 0x223322, roughness: 0.6 }), 96, 7.2, 46));
  }
  scene.add(box(30, 0.15, 8, new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 }), 80, 0.08, 34));
  scene.add(createTree(62, 40, 1.1)); scene.add(createTree(100, 42, 1.0));
  scene.add(createTree(64, 54, 1.2)); scene.add(createTree(100, 56, 1.1));

  // ISO 9001 — far west, blue-accent, south of warehouse
  scene.add(createCompanyBuilding(-62, -5, 28, 10, 17, 0xdce4f0, 0x223344, 'ISO 9001', 0x1155aa));
  // Annex
  {
    const aM = new THREE.MeshStandardMaterial({ color: 0xd0d8e8, roughness: 0.5 });
    scene.add(box(13, 7, 12, aM, -62, 3.5, 14));
    scene.add(box(13.4, 0.4, 12.4, new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.6 }), -62, 7.2, 14));
  }
  scene.add(box(32, 0.15, 8, new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 }), -50, 0.08, -12));
  scene.add(createTree(-46, -8, 1.0)); scene.add(createTree(-78, -8, 1.2));
  scene.add(createTree(-46, 8, 1.1));  scene.add(createTree(-78, 6, 1.0));

  // ============================================
  // DISTRIBUTOR RECEIVING FACILITY (north, z ~ -86)
  // ============================================

  scene.add(box(30, 0.2, 26, mat.groundPad, 8, 0, -84));
  scene.add(box(16, 7, 12, mat.building, 8, 3.5, -88));
  scene.add(box(17, 0.5, 13, mat.roof, 8, 7.25, -88));
  for (let i = 2; i <= 14; i += 6) scene.add(box(3.2, 3.5, 0.3, mat.door, i, 1.75, -82.1));
  for (let i = 2; i <= 14; i += 6) scene.add(box(2, 1.6, 0.1, mat.glass, i, 4.5, -82.1));
  scene.add(createGate(8, 0.1, -80, 0));
  scene.add(createTower(-8, -86, 9));

  // ============================================
  // HERO PALLET (the followed shipment)
  // ============================================

  const heroPallet = new THREE.Group();
  heroPallet.add(box(2.2, 0.3, 2.2, mat.pallet, 0, 0.15, 0));
  const heroCrate = box(1.8, 1.7, 1.8, mat.heroCrate, 0, 1.15, 0);
  heroPallet.add(heroCrate);
  heroPallet.add(box(0.6, 0.42, 0.05, mat.rfidGreen, 0, 1.3, 0.92)); // glowing RFID tag
  heroPallet.add(box(1.4, 0.04, 1.4, mat.crateTag, 0, 2.02, 0)); // top label band
  const heroGlow = new THREE.PointLight(0x00e5a0, 0.7, 7);
  heroGlow.position.set(0, 1.4, 0);
  heroPallet.add(heroGlow);
  scene.add(heroPallet);

  // ============================================
  // SHIPMENT TRUCK (moves during transit)
  // ============================================

  const shipmentTruck = createTruck(8, -16, 0);
  scene.add(shipmentTruck);

  // ============================================
  // SMART FORKLIFT (storage / picking)
  // ============================================

  const forklift = new THREE.Group();
  forklift.add(box(1.6, 1.3, 2.6, mat.forklift, 0, 0.9, 0.2));
  forklift.add(box(1.2, 1.1, 0.1, mat.metalDark, 0, 1.9, 0.9)); // cage back
  forklift.add(box(0.12, 2.6, 0.12, mat.metalDark, -0.5, 1.4, -1.3)); // mast L
  forklift.add(box(0.12, 2.6, 0.12, mat.metalDark, 0.5, 1.4, -1.3)); // mast R
  forklift.add(box(0.12, 0.1, 1.3, mat.metal, -0.45, 0.35, -2)); // fork L
  forklift.add(box(0.12, 0.1, 1.3, mat.metal, 0.45, 0.35, -2)); // fork R
  (
    [
      [-0.75, 1],
      [0.75, 1],
      [-0.75, -0.8],
      [0.75, -0.8],
    ] as Array<[number, number]>
  ).forEach(([wx, wz]) => {
    const w = cyl(0.35, 0.35, 0.25, 12, mat.metalDark, wx, 0.35, wz);
    w.rotation.z = Math.PI / 2;
    forklift.add(w);
  });
  forklift.position.set(0, -60, 0); // hidden until storage
  scene.add(forklift);

  // ============================================
  // ANIMATED INBOUND TRUCK — approaches from left (west) along south road
  // ============================================

  // Single animated inbound truck — multi-phase: approach (maju dari timur) → park → leave
  // rotation.y=Math.PI/2: cab faces WEST (−x) = arah gerak = maju ✓
  // Rear (local +z) faces EAST (+x); parked at x=1.5 so rear aligns with conveyor at x≈9
  const inboundTruckMover = createInboundTruck(60, 20, Math.PI / 2); // start off-screen east
  scene.add(inboundTruckMover);

  // ============================================
  // ANIMATED RFID SIGNAL WAVES (gates)
  // ============================================

  interface WaveData {
    speed: number;
    phase: number;
    baseY: number;
  }
  const waves: THREE.Mesh[] = [];
  function addWave(x: number, y: number, z: number): void {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.6, 32),
      new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    ring.position.set(x, y, z);
    ring.rotation.x = -Math.PI / 2;
    ring.userData = { speed: 0.4 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2, baseY: y } as WaveData;
    scene.add(ring);
    waves.push(ring);
  }
  addWave(3, 3, -8);
  addWave(8, 3, -8);
  addWave(13, 3, -8);
  addWave(-8, 3, 5);
  addWave(8, 3, -80); // distributor gate
  // Inbound — wave at dock entrance
  addWave(1, 3, -8);   // outbound gate x=1
  addWave(19, 3, -8);  // outbound gate x=19
  addWave(9, 3, 13);   // inbound conveyor RFID gate

  // --- Radar ring (picking) ---
  const radarRing = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.85, 40),
    new THREE.MeshBasicMaterial({ color: 0x00e5a0, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  radarRing.rotation.x = -Math.PI / 2;
  radarRing.position.set(0, -60, 0);
  scene.add(radarRing);
  const radarMat = radarRing.material as THREE.MeshBasicMaterial;

  // --- Scan plane + sweep line (storage) ---
  const scanPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(56, 46),
    new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0, side: THREE.DoubleSide }),
  );
  scanPlane.rotation.x = -Math.PI / 2;
  scanPlane.position.set(8, 0.3, 2);
  scene.add(scanPlane);
  const scanPlaneMat = scanPlane.material as THREE.MeshBasicMaterial;

  const scanLineMesh = new THREE.Mesh(new THREE.PlaneGeometry(56, 0.3), mat.scanLine);
  scanLineMesh.rotation.x = -Math.PI / 2;
  scanLineMesh.position.set(8, 0.35, 2);
  scene.add(scanLineMesh);

  // --- Data flow lines (transit) ---
  const dataFlowLines: Array<THREE.Mesh<THREE.TubeGeometry, THREE.ShaderMaterial>> = [];
  function addDataLine(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): void {
    const curve = new THREE.LineCurve3(new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2));
    const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.18, 8, false);
    const tubeMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, color: { value: new THREE.Color(0x00e5a0) }, opacity: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform float time; uniform vec3 color; uniform float opacity; varying vec2 vUv;
        void main(){ float pulse=sin((vUv.x*15.0)-(time*8.0))*0.5+0.5; pulse=pow(pulse,4.0); gl_FragColor=vec4(color,pulse*opacity); }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tube);
    dataFlowLines.push(tube);
  }
  // Gudang utama server -> distributor (ASN in transit)
  addDataLine(-20, 6, -5, 8, 6, -40);
  addDataLine(8, 6, -40, 8, 6, -86);
  addDataLine(8, 5, -20, 8, 5, -70);

  // --- Warehouse highlight (storage) ---
  const hlWarehouse = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(24, 10, 18)),
    new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0 }),
  );
  hlWarehouse.position.set(8, 4, 2);
  scene.add(hlWarehouse);

  // ============================================
  // SCROLL -> JOURNEY PROGRESS
  // ============================================

  let sceneOpacity = 1;
  let targetOpacity = 1;

  function updateProgressFromScroll() {
    const wv = document.getElementById('warehouse-view');
    const immersive = document.getElementById('immersive');
    const vh = window.innerHeight;

    // Dual-view: active while #warehouse-view is on screen.
    // Canvas goes to z=2 so the 3D is visible; .wv DOM overlay is at z=3 (above canvas).
    if (wv) {
      const wvRect = wv.getBoundingClientRect();
      const inWV = wvRect.top < vh && wvRect.bottom > 0;
      dualViewActive = inWV;
      if (inWV) {
        container!.style.zIndex = '2';
      }
    }

    if (immersive) {
      const rect = immersive.getBoundingClientRect();
      const scrolled = -rect.top;
      const denom = immersive.offsetHeight - vh;
      journeyProgress = denom > 0 ? Math.max(0, Math.min(1, scrolled / denom)) : 0;

      const inImmersive = rect.top < vh && rect.bottom > 0;
      if (inImmersive) {
        dualViewActive = false;
        container!.style.zIndex = '2';
      } else if (!dualViewActive) {
        container!.style.zIndex = '-1';
      }
    }

    // Fade scene out as the contact section approaches
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      const contactTop = contactEl.offsetTop;
      targetOpacity = window.scrollY + vh * 0.5 >= contactTop ? 0 : 1;
    }
  }

  // Scroll state is now synced every animation frame in animate() — no separate scroll listener needed.
  updateProgressFromScroll();

  // ============================================
  // ANIMATION LOOP
  // ============================================

  const clock = new THREE.Clock();
  const targetCamPos = new THREE.Vector3();
  const currentLookAt = new THREE.Vector3(8, 2, -16);
  const targetLookAt = new THREE.Vector3();
  const heroVec = new THREE.Vector3();
  let targetFog = 0.004;
  let lastStage = -1;
  let rafId = 0;

  // Prime the overlay with the first stage.
  setStage(0);

  function animate() {
    rafId = requestAnimationFrame(animate);
    // Sync scroll-driven state every frame — more reliable than rAF-on-scroll
    updateProgressFromScroll();
    const t = clock.getElapsedTime();

    // Smooth the journey progress: lerp at ~6% per frame → ~1s cinematic ease-in
    // Clamp tiny residuals to avoid eternal micro-updates
    const lerpFactor = 0.055;
    smoothedProgress += (journeyProgress - smoothedProgress) * lerpFactor;
    if (Math.abs(journeyProgress - smoothedProgress) < 0.0002) smoothedProgress = journeyProgress;
    const p = smoothedProgress;

    // --- Hero pallet position ---
    const hero = heroAt(p);
    heroVec.set(hero.x, hero.y, hero.z);
    heroPallet.position.set(hero.x, hero.y, hero.z);
    heroPallet.rotation.y = Math.sin(t * 0.3) * 0.04;
    // Stage 0 approach: sembunyikan hero pallet sampai truck benar-benar parkir
    heroPallet.visible = !(stageIndexAt(p) === 0 && p * STAGE_COUNT < 0.62);

    // --- Shipment truck ---
    const transitStart = 4 / STAGE_COUNT; // stage 4 (transit)
    const receivingStart = 5 / STAGE_COUNT; // stage 5 (receiving)
    let truckZ: number;
    if (p < transitStart) truckZ = -16;
    else if (p < receivingStart) truckZ = hero.z; // carry the pallet
    else truckZ = WAYPOINTS[5].z; // parked at distributor
    shipmentTruck.position.set(8, 0, truckZ);

    // --- Inbound truck: scroll-driven in Stage 0 ---
    // Stage 0 = p in [0, 1/STAGE_COUNT]. s0 = 0..1 within that stage.
    {
      const ss = (v: number) => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
      const STAGE_0_END = 1 / STAGE_COUNT;
      const s0 = Math.max(0, Math.min(1, p / STAGE_0_END));

      if (p <= STAGE_0_END) {
        // Stage 0: truck datang dari timur (x=60) → parkir x=1.5 (MAJU — cab menghadap barat)
        // Rear truck (local +z) = world +x; saat x=1.5, rear ada di x≈9 (align conveyor)
        const PARK_THRESHOLD = 0.60;
        if (s0 < PARK_THRESHOLD) {
          inboundTruckMover.position.x = 60 - ss(s0 / PARK_THRESHOLD) * 58.5; // 60 → 1.5
          dockCratesGroup.visible = false;
          inboundHeroPallet.visible = false;
        } else {
          inboundTruckMover.position.x = 1.5; // parkir — rear sejajar conveyor x≈9
          // Hero RFID pallet muncul di belt saat truck benar-benar berhenti
          inboundHeroPallet.visible = s0 > PARK_THRESHOLD + 0.04;
          inboundHeroPallet.position.set(9, 1.38, 15.5); // di belt, menuju RFID gate (z=13)
          // Crates ikut muncul setelah pallet
          dockCratesGroup.visible = s0 > PARK_THRESHOLD + 0.08;
        }
        inboundTruckMover.position.z = 20;
      } else {
        // Selesai stage 0: truck lanjut ke BARAT (maju terus, tidak balik)
        const exitT = ss(Math.min((p - STAGE_0_END) / (STAGE_0_END * 0.5), 1));
        inboundTruckMover.position.x = 1.5 - exitT * 65; // terus ke barat
        inboundTruckMover.position.z = 20;
        dockCratesGroup.visible = false;
        inboundHeroPallet.visible = false;
      }
      inboundTruckMover.rotation.y = Math.PI / 2; // cab faces west = arah gerak = MAJU ✓
    }

    // --- Camera follows the pallet ---
    const off = camOffsetAt(p);
    targetCamPos.set(hero.x + off.x, hero.y + off.y, hero.z + off.z);
    targetLookAt.set(hero.x, hero.y + 1, hero.z);

    // ── Stage 0 override: kamera ikut truck saat pendekatan, lalu blend ke palet ──
    // Sub-phases (s0 = progress dalam stage 0, 0..1):
    //   0.00 – 0.58  → kamera di belakang/timur truck (follow cam)
    //   0.58 – 0.74  → blend kamera dari truck ke palet di conveyor
    //   0.74 – 1.00  → kamera ikut palet masuk warehouse (normal hero follow)
    if (stageIndexAt(p) === 0) {
      const STAGE_0_END_C = 1 / STAGE_COUNT;
      const s0c = Math.max(0, Math.min(1, p / STAGE_0_END_C));
      const TRUCK_END = 0.58;
      const BLEND_END = 0.74;

      // Mirror the truck x position (same formula as truck animation block)
      const ssc = (v: number) => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
      const txc = s0c < TRUCK_END ? 60 - ssc(s0c / TRUCK_END) * 58.5 : 1.5;

      // Camera: belakang (timur) + atas + sedikit utara dari truck — melihat ke barat (arah dock)
      const truckLook = new THREE.Vector3(txc, 2.2, 20);
      const truckCam  = new THREE.Vector3(txc + 12, 7, 12);

      if (s0c < TRUCK_END) {
        // Full truck follow
        targetCamPos.copy(truckCam);
        targetLookAt.copy(truckLook);
      } else if (s0c < BLEND_END) {
        // Blend dari truck ke hero pallet
        const bl = (s0c - TRUCK_END) / (BLEND_END - TRUCK_END);
        const heroCamTgt = new THREE.Vector3(hero.x + off.x, hero.y + off.y, hero.z + off.z);
        const heroLookTgt = new THREE.Vector3(hero.x, hero.y + 1, hero.z);
        targetCamPos.lerpVectors(truckCam, heroCamTgt, bl);
        targetLookAt.lerpVectors(truckLook, heroLookTgt, bl);
      }
      // s0c >= BLEND_END: targetCamPos/targetLookAt sudah di-set ke hero di atas — tidak diubah lagi
    }

    // Apply interactive orbit + zoom (always run — default orbitZoom=2.0 keeps camera further back)
    {
      const toCamera = new THREE.Vector3().subVectors(targetCamPos, targetLookAt);
      if (orbitYaw !== 0) toCamera.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbitYaw);
      if (orbitPitch !== 0) {
        const rightAxis = new THREE.Vector3().crossVectors(toCamera, new THREE.Vector3(0, 1, 0)).normalize();
        toCamera.applyAxisAngle(rightAxis, orbitPitch);
      }
      toCamera.multiplyScalar(orbitZoom); // default 2.0 = 2× further than scroll-driven distance
      targetCamPos.copy(targetLookAt).add(toCamera);
    }

    // Apply pan offset — translates the whole camera+target pair in world space
    targetCamPos.add(panOffset);
    targetLookAt.add(panOffset);

    camera.position.lerp(targetCamPos, 0.028);
    currentLookAt.lerp(targetLookAt, 0.038);
    camera.lookAt(currentLookAt);

    // --- Stage bookkeeping ---
    const stageIdx = stageIndexAt(p);
    if (stageIdx !== lastStage) {
      setStage(stageIdx);
      lastStage = stageIdx;
    }
    targetFog = STAGES[stageIdx].fogDensity;
    fog.density += (targetFog - fog.density) * 0.04;

    // --- Scene opacity ---
    sceneOpacity += (targetOpacity - sceneOpacity) * 0.05;
    container!.style.opacity = String(sceneOpacity);

    // --- Project pins onto the moving camera ---
    projectPins(camera);

    // --- Signal waves ---
    waves.forEach((w) => {
      const ud = w.userData as WaveData;
      const ph = (t * ud.speed + ud.phase) % 1;
      const s = 0.3 + 2.7 * ph;
      w.scale.set(s, s, 1);
      (w.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - ph);
      w.position.y = ud.baseY + ph * 0.5;
    });

    // --- Server LEDs ---
    serverLeds.forEach((led) => {
      (led.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + 0.8 * Math.abs(Math.sin(t * 3 + led.position.x * 5));
    });

    // --- Stage 0 / 3 / 5: gate read pulse ---
    if (stageIdx === 0 || stageIdx === 3 || stageIdx === 5) {
      rfidLight1.intensity = 2 + Math.sin(t * 3) * 1.2;
      // Stage 0 = south inbound gate (z=13), Stage 3 = north outbound gate (z=-8), Stage 5 = distributor (z=-80)
      rfidLight1.position.set(8, 4, stageIdx === 5 ? -80 : stageIdx === 0 ? 13 : -8);
      rfidLight2.intensity = 1.4 + Math.sin(t * 2.5) * 0.7;
    } else {
      rfidLight1.intensity += (1 - rfidLight1.intensity) * 0.04;
      rfidLight2.intensity += (0.8 - rfidLight2.intensity) * 0.04;
    }

    // Inbound gate light — brighter pulse during Stage 0, ambient glow otherwise
    inboundGateLight.intensity = stageIdx === 0
      ? 2.2 + Math.sin(t * 3.2) * 1.0
      : 0.8 + Math.sin(t * 1.5) * 0.3;
    // Hero inbound pallet glow — pulse saat stage 0 dan pallet visible
    if (stageIdx === 0 && inboundHeroPallet.visible) {
      inboundPalletGlow.intensity = 1.2 + Math.sin(t * 4.5) * 0.8;
    } else {
      inboundPalletGlow.intensity = 0;
    }

    // --- Worker animations per stage ---
    // Stage 0 (Inbound): worker1 at south inbound gate scanning arriving pallet
    if (stageIdx === 0) {
      worker1.group.position.set(12, 0, 13);
      worker1.group.rotation.y = Math.PI * 0.5; // facing west, toward incoming trucks
      worker1.scanner.visible = true;
      worker1.carryCrate.visible = false;
      // Scanning gesture: right arm raised toward gate
      worker1.rightArm.rotation.x = -0.9 + Math.sin(t * 1.5) * 0.15;
      worker1.leftArm.rotation.x = Math.sin(t * 1.2) * 0.1;
      worker1.leftLeg.rotation.x = 0;
      worker1.rightLeg.rotation.x = 0;
      // Bob slightly
      worker1.group.position.y = Math.sin(t * 1.8) * 0.02;
    }
    // Stage 1 (Putaway): worker1 carries box east to RIGHT rack (x=22)
    else if (stageIdx === 1) {
      // Slightly behind hero (west side), facing east toward right rack
      worker1.group.position.set(hero.x - 1.2, 0, hero.z + 1.2);
      worker1.group.rotation.y = -Math.PI / 2; // faces EAST (+x), direction of travel
      worker1.scanner.visible = false;
      worker1.carryCrate.visible = true;
      // Arms up carrying crate
      worker1.rightArm.rotation.x = -1.3 + Math.sin(t * 2) * 0.05;
      worker1.leftArm.rotation.x = -1.3 + Math.sin(t * 2 + 0.5) * 0.05;
      // Walk cycle
      worker1.leftLeg.rotation.x = Math.sin(t * 3.5) * 0.35;
      worker1.rightLeg.rotation.x = -Math.sin(t * 3.5) * 0.35;
      worker1.group.position.y = Math.abs(Math.sin(t * 3.5)) * 0.05;
    }
    // Stage 2 (Picking): worker1 tanpa barang, berjalan dari rak kanan ke rak kiri (sebrang) untuk ambil paket
    else if (stageIdx === 2) {
      // Worker di aisle tengah (x~12), bergerak dari kanan (x=20) ke kiri (x=4) mengikuti hero
      // hero.x turun dari 22→8, worker offset ke sisi kiri (lebih kecil dari hero.x)
      worker1.group.position.set(hero.x - 4, 0, hero.z + 0.8);
      // Hadap ke rak kiri (x=3) = menghadap barat (-x)
      worker1.group.rotation.y = Math.PI / 2;
      worker1.scanner.visible = true;
      worker1.carryCrate.visible = false; // tangan kosong, belum ambil barang
      // Tangan kanan angkat scanner, tangan kiri natural swing
      worker1.rightArm.rotation.x = -1.5 + Math.sin(t * 1.1) * 0.25; // scanner terarah ke rak
      worker1.leftArm.rotation.x = -0.3 + Math.sin(t * 0.9 + 1.0) * 0.15;
      // Walk cycle — agak lambat (scanning sambil jalan)
      worker1.leftLeg.rotation.x = Math.sin(t * 2.4) * 0.30;
      worker1.rightLeg.rotation.x = -Math.sin(t * 2.4) * 0.30;
      worker1.group.position.y = Math.abs(Math.sin(t * 2.4)) * 0.04;
    }
    // Stage 3 (Outbound): worker2 loads boxes onto truck at dock
    else if (stageIdx === 3) {
      worker1.group.position.set(0, -60, 0); // hide worker1
      worker2.group.position.set(hero.x - 1.5, 0, hero.z + 1);
      worker2.group.rotation.y = Math.PI;
      worker2.scanner.visible = false;
      worker2.carryCrate.visible = true;
      // Loading motion: arms moving up then down
      const loadPhase = (t * 0.9) % (Math.PI * 2);
      worker2.rightArm.rotation.x = -0.8 - Math.abs(Math.sin(loadPhase)) * 0.9;
      worker2.leftArm.rotation.x = -0.8 - Math.abs(Math.sin(loadPhase + 0.3)) * 0.9;
      worker2.leftLeg.rotation.x = Math.sin(t * 2.2) * 0.2;
      worker2.rightLeg.rotation.x = -Math.sin(t * 2.2) * 0.2;
      worker2.group.position.y = Math.abs(Math.sin(t * 2.2)) * 0.03;
    }
    // Stage 4 (Transit): hide workers
    else if (stageIdx === 4) {
      worker1.group.position.set(0, -60, 0);
      worker2.group.position.set(0, -60, 0);
      hubWorker.group.position.set(0, -60, 0);
    }
    // Stage 5 (Receiving/Hub): hub worker at distributor gate
    else if (stageIdx === 5) {
      worker1.group.position.set(0, -60, 0);
      worker2.group.position.set(0, -60, 0);
      hubWorker.group.position.set(5, 0, -82);
      hubWorker.group.rotation.y = Math.PI * 0.4;
      hubWorker.scanner.visible = true;
      hubWorker.carryCrate.visible = false;
      hubWorker.rightArm.rotation.x = -1.1 + Math.sin(t * 1.3) * 0.18;
      hubWorker.leftArm.rotation.x = Math.sin(t * 1.1) * 0.12;
      hubWorker.leftLeg.rotation.x = 0;
      hubWorker.rightLeg.rotation.x = 0;
      hubWorker.group.position.y = Math.sin(t * 1.6) * 0.02;
    }

    // Reset non-active workers smoothly when stage changes away
    if (stageIdx !== 3) {
      worker2.group.position.set(0, -60, 0);
    }
    if (stageIdx !== 5) {
      hubWorker.group.position.lerp(new THREE.Vector3(hubWorker.group.position.x, -60, hubWorker.group.position.z), 0.1);
    }
    if (stageIdx !== 0 && stageIdx !== 1 && stageIdx !== 2) {
      worker1.scanner.visible = false;
      worker1.carryCrate.visible = false;
    }

    // --- Stage 1: storage scan + highlight + forklift ---
    if (stageIdx === 1 || stageIdx === 2) {
      forklift.position.set(hero.x - 0.2, 0, hero.z + 2.6);
      forklift.rotation.y = Math.PI;
    } else {
      forklift.position.set(0, -60, 0);
    }
    if (stageIdx === 1) {
      scanPlaneMat.opacity += (0.05 - scanPlaneMat.opacity) * 0.05;
      scanLineMesh.position.z = 2 - 23 + ((t * 6) % 46);
      mat.scanLine.opacity += (0.5 - mat.scanLine.opacity) * 0.05;
      hlWarehouse.material.opacity += (0.55 - hlWarehouse.material.opacity) * 0.05;
    } else {
      scanPlaneMat.opacity += (0 - scanPlaneMat.opacity) * 0.05;
      mat.scanLine.opacity += (0 - mat.scanLine.opacity) * 0.05;
      hlWarehouse.material.opacity += (0 - hlWarehouse.material.opacity) * 0.05;
    }

    // --- Stage 2: radar pulse on the hero pallet ---
    if (stageIdx === 2) {
      radarRing.position.set(hero.x, 0.4, hero.z);
      const rp = (t * 0.8) % 1;
      const rs = 1 + rp * 3;
      radarRing.scale.set(rs, rs, 1);
      radarMat.opacity = 0.8 * (1 - rp);
    } else {
      radarMat.opacity += (0 - radarMat.opacity) * 0.08;
    }

    // --- Stage 4: data flow / ASN ---
    if (stageIdx === 4 || stageIdx === 5) {
      dataFlowLines.forEach((line, i) => {
        line.material.uniforms.time.value = t + i * 0.5;
        line.material.uniforms.opacity.value += (0.85 - line.material.uniforms.opacity.value) * 0.08;
      });
      serverGlow.intensity += (1.1 - serverGlow.intensity) * 0.04;
    } else {
      dataFlowLines.forEach((line) => {
        line.material.uniforms.opacity.value += (0 - line.material.uniforms.opacity.value) * 0.05;
      });
      serverGlow.intensity += (0.6 - serverGlow.intensity) * 0.04;
    }

    if (dualViewActive) {
      // ── Dual-view: scissor each half with its own camera ──
      const W = window.innerWidth;
      const H = window.innerHeight;
      const half = Math.floor(W / 2);

      // Ensure full canvas is cleared to opaque dark before scissored passes
      renderer.setViewport(0, 0, W, H);
      renderer.setScissorTest(false);
      const prevExposure = renderer.toneMappingExposure;
      renderer.toneMappingExposure = 1.3;
      renderer.setClearColor(0x0d1b2a, 1);
      renderer.clear(true, true, false);

      renderer.setScissorTest(true);

      // LEFT — Inbound: south dock view — trucks arriving from the west
      renderer.setViewport(0, 0, half, H);
      renderer.setScissor(0, 0, half, H);
      cameraLeft.aspect = half / H;
      cameraLeft.updateProjectionMatrix();
      cameraLeft.position.x = -14 + Math.sin(t * 0.10) * 2;
      cameraLeft.position.z = 28 + Math.cos(t * 0.08) * 2.5;
      cameraLeft.position.y = 10 + Math.sin(t * 0.06) * 1.0;
      cameraLeft.lookAt(6, 2, 13);
      renderer.render(scene, cameraLeft);

      // RIGHT — Outbound: north face RFID gates, pallets departing toward distributor
      renderer.setViewport(half, 0, W - half, H);
      renderer.setScissor(half, 0, W - half, H);
      cameraRight.aspect = (W - half) / H;
      cameraRight.updateProjectionMatrix();
      cameraRight.position.x = 30 + Math.sin(t * 0.11 + 1) * 3;
      cameraRight.position.z = -24 + Math.cos(t * 0.08 + 0.5) * 2;
      cameraRight.position.y = 8 + Math.sin(t * 0.06 + 1) * 0.8;
      cameraRight.lookAt(8, 2, -10);
      renderer.render(scene, cameraRight);

      renderer.setScissorTest(false);
      renderer.toneMappingExposure = prevExposure;
      // Always restore full viewport after dual-view, so single-camera renders aren't clipped
      renderer.setViewport(0, 0, W, H);
    } else {
      // Ensure full-canvas viewport before single-camera render (guard against stale scissor state)
      renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
      renderer.render(scene, camera);
    }
  }

  // ============================================
  // RESIZE
  // ============================================

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  animate();

  // ============================================
  // CLEANUP
  // ============================================

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('dblclick', onDblClick);
    domEl.removeEventListener('touchstart', onTouchStart);
    domEl.removeEventListener('touchmove', onTouchMove);
    domEl.removeEventListener('touchend', onTouchEnd);
    renderer.domElement.remove();
    renderer.dispose();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
      else if (m) m.dispose();
    });
  };
}
