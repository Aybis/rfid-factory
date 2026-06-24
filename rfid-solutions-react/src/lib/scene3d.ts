/**
 * RFID Solutions — Full-Page 3D Experience
 * Persistent Three.js scene that transitions between views as the user scrolls.
 *
 * Faithful TypeScript port of the original scene3d.js. Three.js is now an npm
 * import (`three`) rather than a CDN global, and the IIFE is an init function
 * returning a cleanup callback. All scene-building logic is unchanged.
 */

import * as THREE from 'three';
import type { RfidCameraState } from '../global';

export function initScene3D(): () => void {
  'use strict';

  const container = document.getElementById('scene-3d-global');
  if (!container) return () => {};

  // ============================================
  // SCENE SETUP
  // ============================================

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1b2a);
  scene.fog = new THREE.FogExp2(0x0d1b2a, 0.006);
  const fog = scene.fog as THREE.FogExp2;

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(55, 40, 55);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  container.appendChild(renderer.domElement);

  // ============================================
  // CAMERA STATES (per section)
  // ============================================

  const cameraStates: Record<string, RfidCameraState> = {
    hero: {
      pos: { x: 65, y: 45, z: 65 },
      lookAt: { x: 0, y: 3, z: 0 },
      fogDensity: 0.005,
    },
    video: {
      pos: { x: 50, y: 35, z: 50 },
      lookAt: { x: 0, y: 2, z: 0 },
      fogDensity: 0.006,
    },
    phase1: {
      // Focus on the entire facility — site assessment overview
      pos: { x: 45, y: 55, z: 30 },
      lookAt: { x: 0, y: 0, z: 0 },
      fogDensity: 0.004,
    },
    phase2: {
      // Focus on RFID gates and conveyor — hardware/architecture
      pos: { x: 15, y: 18, z: -20 },
      lookAt: { x: 5, y: 2, z: -5 },
      fogDensity: 0.008,
    },
    phase3: {
      // Focus on conveyor belt and server room — integration
      pos: { x: -25, y: 20, z: 15 },
      lookAt: { x: -10, y: 3, z: 0 },
      fogDensity: 0.007,
    },
    phase4: {
      // Full operational view — everything lit up
      pos: { x: -40, y: 35, z: -40 },
      lookAt: { x: 0, y: 5, z: 0 },
      fogDensity: 0.004,
    },
    services: {
      pos: { x: 55, y: 50, z: -30 },
      lookAt: { x: 0, y: 0, z: 0 },
      fogDensity: 0.005,
    },
    specs: {
      pos: { x: -20, y: 12, z: -25 },
      lookAt: { x: -15, y: 4, z: -5 },
      fogDensity: 0.01,
    },
    cta: {
      pos: { x: 60, y: 40, z: 60 },
      lookAt: { x: 0, y: 5, z: 0 },
      fogDensity: 0.003,
    },
  };

  let currentState = 'hero';
  const targetCamPos = new THREE.Vector3(65, 45, 65);
  const targetLookAt = new THREE.Vector3(0, 3, 0);
  let targetFog = 0.005;
  let sceneOpacity = 1;
  let targetOpacity = 1;

  // ============================================
  // LIGHTING
  // ============================================

  const ambientLight = new THREE.AmbientLight(0x4488aa, 0.5);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffeedd, 1.0);
  sunLight.position.set(30, 50, 20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 150;
  sunLight.shadow.camera.left = -60;
  sunLight.shadow.camera.right = 60;
  sunLight.shadow.camera.top = 60;
  sunLight.shadow.camera.bottom = -60;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0x00d4ff, 0.25);
  fillLight.position.set(-20, 20, -10);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x00e5a0, 0.15);
  rimLight.position.set(-10, 10, 30);
  scene.add(rimLight);

  // Point lights for RFID glow effect
  const rfidLight1 = new THREE.PointLight(0x00d4ff, 1, 15);
  rfidLight1.position.set(8, 4, -8);
  scene.add(rfidLight1);

  const rfidLight2 = new THREE.PointLight(0x00e5a0, 0.8, 12);
  rfidLight2.position.set(-8, 3, 5);
  scene.add(rfidLight2);

  const serverGlow = new THREE.PointLight(0x00ff88, 0.6, 10);
  serverGlow.position.set(-20, 4, -5);
  scene.add(serverGlow);

  // ============================================
  // MATERIALS
  // ============================================

  const mat = {
    ground: new THREE.MeshStandardMaterial({ color: 0x1a3a2a, roughness: 0.9 }),
    groundPad: new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.7, metalness: 0.2 }),
    road: new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.85 }),
    roadMark: new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 }),
    building: new THREE.MeshStandardMaterial({ color: 0xbbc8d4, roughness: 0.5, metalness: 0.3 }),
    buildingDark: new THREE.MeshStandardMaterial({ color: 0x667788, roughness: 0.6, metalness: 0.4 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.6, metalness: 0.3 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x889999, roughness: 0.3, metalness: 0.8 }),
    metalDark: new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.4, metalness: 0.7 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x88ccee, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.5 }),
    rfidCyan: new THREE.MeshStandardMaterial({ color: 0x00d4ff, roughness: 0.3, metalness: 0.5, emissive: 0x00d4ff, emissiveIntensity: 0.4 }),
    rfidGreen: new THREE.MeshStandardMaterial({ color: 0x00e5a0, roughness: 0.3, metalness: 0.5, emissive: 0x00e5a0, emissiveIntensity: 0.4 }),
    door: new THREE.MeshStandardMaterial({ color: 0x00aacc, roughness: 0.4, metalness: 0.5, emissive: 0x004455, emissiveIntensity: 0.15 }),
    crate: new THREE.MeshStandardMaterial({ color: 0xccaa77, roughness: 0.8 }),
    crateTag: new THREE.MeshStandardMaterial({ color: 0xeeeedd, roughness: 0.5 }),
    antenna: new THREE.MeshStandardMaterial({ color: 0xaabbcc, roughness: 0.4, metalness: 0.6 }),
    server: new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.3, metalness: 0.7 }),
    srvLed: new THREE.MeshStandardMaterial({ color: 0x00ff88, roughness: 0.2, emissive: 0x00ff88, emissiveIntensity: 0.5 }),
    conveyor: new THREE.MeshStandardMaterial({ color: 0x556666, roughness: 0.6, metalness: 0.5 }),
    belt: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 }),
    truck: new THREE.MeshStandardMaterial({ color: 0xccddee, roughness: 0.5, metalness: 0.3 }),
    truckBody: new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.6 }),
    tree: new THREE.MeshStandardMaterial({ color: 0x2d6b3a, roughness: 0.9 }),
    treeDark: new THREE.MeshStandardMaterial({ color: 0x1d4a2a, roughness: 0.9 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x5a3d2b, roughness: 0.9 }),
    fence: new THREE.MeshStandardMaterial({ color: 0x667777, roughness: 0.5, metalness: 0.6 }),
    solar: new THREE.MeshStandardMaterial({ color: 0x223355, roughness: 0.3, metalness: 0.6 }),
    scanLine: new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
    dataLine: new THREE.MeshBasicMaterial({ color: 0x00e5a0, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }),
  };

  // ============================================
  // HELPERS
  // ============================================

  function box(
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
  ): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function cyl(
    rT: number,
    rB: number,
    h: number,
    seg: number,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
  ): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg), material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // ============================================
  // BUILD THE FACILITY
  // ============================================

  // --- Ground ---
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const ground = new THREE.Mesh(groundGeo, mat.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  scene.add(ground);

  // Concrete pad
  scene.add(box(55, 0.2, 45, mat.groundPad, 0, 0, 0));

  // Roads
  scene.add(box(55, 0.25, 3, mat.road, 0, 0.05, -12));
  scene.add(box(3, 0.25, 45, mat.road, -15, 0.05, 0));
  scene.add(box(55, 0.25, 3, mat.road, 0, 0.05, 18));

  for (let i = -24; i <= 24; i += 4) {
    scene.add(box(1.5, 0.02, 0.3, mat.roadMark, i, 0.28, -12));
    scene.add(box(1.5, 0.02, 0.3, mat.roadMark, i, 0.28, 18));
  }

  // --- Main Warehouse ---
  scene.add(box(22, 8, 16, mat.building, 8, 4, 2));
  scene.add(box(23, 0.5, 17, mat.roof, 8, 8.25, 2));
  scene.add(box(23, 1.5, 0.5, mat.metalDark, 8, 9, 2));

  // Windows
  for (let i = -2; i <= 18; i += 4) {
    scene.add(box(2.5, 2, 0.1, mat.glass, i, 5, -5.95));
    scene.add(box(2.5, 2, 0.1, mat.glass, i, 5, 9.95));
  }

  // Loading dock doors
  for (let i = 1; i <= 15; i += 5) {
    scene.add(box(3.5, 4, 0.3, mat.door, i, 2, -6.1));
  }

  // --- RFID Gate Portals ---
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

  scene.add(createGate(3, 0.1, -8, 0));
  scene.add(createGate(8, 0.1, -8, 0));
  scene.add(createGate(13, 0.1, -8, 0));
  scene.add(createGate(-8, 0.1, 5, Math.PI / 2));

  // --- Server Room ---
  scene.add(box(10, 6, 8, mat.buildingDark, -20, 3, -5));
  scene.add(box(11, 0.4, 9, mat.roof, -20, 6.2, -5));

  for (let i = -23; i <= -17; i += 3) scene.add(box(1.5, 1.5, 0.1, mat.glass, i, 4, -9.05));

  // Server racks
  const serverLeds: THREE.Mesh[] = [];
  for (let i = -23; i <= -17; i += 2) {
    scene.add(box(0.8, 4, 1.5, mat.server, i, 2.5, -6));
    for (let j = 1; j <= 4; j++) {
      const led = box(0.3, 0.08, 0.08, mat.srvLed, i, j, -5.2);
      scene.add(led);
      serverLeds.push(led);
    }
  }

  // Satellite dish
  scene.add(cyl(0.2, 0.3, 2, 8, mat.metal, -17, 7.2, -3));
  const dish = cyl(1.2, 0.3, 0.3, 16, mat.antenna, -17, 8.5, -3);
  dish.rotation.x = -0.4;
  scene.add(dish);

  // --- Conveyor Belt ---
  scene.add(box(20, 0.3, 2, mat.conveyor, -5, 1.2, 5));
  scene.add(box(19, 0.08, 1.6, mat.belt, -5, 1.38, 5));

  for (let i = -13; i <= 3; i += 4) {
    scene.add(box(0.3, 1.2, 0.3, mat.metalDark, i, 0.6, 4.2));
    scene.add(box(0.3, 1.2, 0.3, mat.metalDark, i, 0.6, 5.8));
  }

  // Tagged boxes on conveyor
  const conveyorBoxes: THREE.Mesh[] = [];
  [-12, -8, -4, 0, 3].forEach((bx) => {
    const b = box(1.2, 1, 1, mat.crate, bx, 2, 5);
    scene.add(b);
    conveyorBoxes.push(b);
    scene.add(box(0.5, 0.3, 0.04, mat.crateTag, bx, 2.2, 4.46));
  });

  // --- Pallet Racks ---
  function createRack(rx: number, rz: number): THREE.Group {
    const g = new THREE.Group();
    g.add(box(0.15, 5, 0.15, mat.metalDark, -1.5, 2.5, 0));
    g.add(box(0.15, 5, 0.15, mat.metalDark, 1.5, 2.5, 0));
    for (let i = 1; i <= 4; i += 1.5) g.add(box(3.2, 0.08, 1.2, mat.metal, 0, i, 0));
    for (let i = 1.2; i <= 3.5; i += 1.5) {
      g.add(box(1.2, 0.8, 0.8, mat.crate, -0.5, i + 0.4, 0));
      g.add(box(1, 0.6, 0.8, mat.crate, 0.8, i + 0.3, 0));
    }
    g.position.set(rx, 0, rz);
    return g;
  }

  for (let z = -2; z <= 8; z += 4) {
    scene.add(createRack(3, z));
    scene.add(createRack(18, z));
  }

  // --- Antenna Towers ---
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
  scene.add(createTower(-25, 20, 10));
  scene.add(createTower(25, 20, 11));

  // --- Trucks ---
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

  scene.add(createTruck(3, -16, 0));
  scene.add(createTruck(13, -17, 0.1));

  // --- Guard Booth ---
  scene.add(box(3, 3, 3, mat.building, -25, 1.5, -12));
  scene.add(box(3.5, 0.3, 3.5, mat.roof, -25, 3.15, -12));
  scene.add(box(2, 1.5, 0.1, mat.glass, -25, 2, -13.55));
  scene.add(cyl(0.12, 0.12, 3, 8, mat.metalDark, -22, 1.5, -12));
  scene.add(box(5, 0.12, 0.12, mat.rfidGreen, -19.5, 3, -12));
  scene.add(box(0.5, 1.5, 0.5, mat.rfidCyan, -22, 1.5, -13));

  // --- Solar Panels ---
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group();
    const p = box(3, 0.08, 2, mat.solar, 0, 1.5, 0);
    p.rotation.x = -0.3;
    g.add(p);
    g.add(cyl(0.08, 0.08, 1.5, 6, mat.metalDark, 0, 0.75, 0));
    g.position.set(5 + i * 4, 0, 16);
    scene.add(g);
  }

  // --- Trees (Low-Poly Data Trees) ---
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
      [-30, -20, 1.2], [-33, -15, 0.9], [-30, -8, 1.1],
      [-32, 0, 1.0], [-30, 8, 1.3], [-33, 15, 0.8],
      [-30, 22, 1.1], [-28, 25, 0.9],
      [30, -18, 1.0], [32, -10, 1.2], [30, -3, 0.9],
      [33, 5, 1.1], [30, 13, 1.0], [32, 20, 1.3],
      [-10, 25, 0.9], [0, 27, 1.1], [10, 25, 1.0], [20, 26, 0.8],
      [-15, -22, 1.0], [-5, -24, 0.9], [5, -23, 1.1], [15, -22, 0.8],
    ] as Array<[number, number, number]>
  ).forEach(([tx, tz, ts]) => scene.add(createTree(tx, tz, ts)));

  // --- Fence ---
  function fence(x1: number, z1: number, x2: number, z2: number): void {
    const dx = x2 - x1,
      dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    const ang = Math.atan2(dx, dz);
    const n = Math.floor(len / 4) + 1;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      scene.add(cyl(0.06, 0.06, 2.5, 6, mat.fence, x1 + dx * t, 1.25, z1 + dz * t));
    }
    const mx = (x1 + x2) / 2,
      mz = (z1 + z2) / 2;
    const r1 = box(len, 0.06, 0.06, mat.fence, mx, 0.8, mz);
    r1.rotation.y = ang;
    scene.add(r1);
    const r2 = box(len, 0.06, 0.06, mat.fence, mx, 1.8, mz);
    r2.rotation.y = ang;
    scene.add(r2);
  }

  fence(-27, -20, 27, -20);
  fence(27, -20, 27, 22);
  fence(27, 22, -27, 22);
  fence(-27, 22, -27, -20);

  // ============================================
  // ANIMATED ELEMENTS
  // ============================================

  // --- RFID Signal Waves ---
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
  addWave(25, 11, -18);
  addWave(-25, 9, 20);
  addWave(25, 10, 20);

  // --- Scan Plane (for Phase 1 - site assessment visualization) ---
  const scanPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(56, 46),
    new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0, side: THREE.DoubleSide }),
  );
  scanPlane.rotation.x = -Math.PI / 2;
  scanPlane.position.set(0, 0.3, 0);
  scene.add(scanPlane);
  const scanPlaneMat = scanPlane.material as THREE.MeshBasicMaterial;

  // Scan line that sweeps across (Phase 1)
  const scanLineGeo = new THREE.PlaneGeometry(56, 0.3);
  const scanLineMesh = new THREE.Mesh(scanLineGeo, mat.scanLine);
  scanLineMesh.rotation.x = -Math.PI / 2;
  scanLineMesh.position.set(0, 0.35, 0);
  scene.add(scanLineMesh);

  // --- Data flow lines (Animated GLSL Tubes) ---
  const dataFlowLines: Array<THREE.Mesh<THREE.TubeGeometry, THREE.ShaderMaterial>> = [];
  function addDataLine(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
  ): THREE.Mesh<THREE.TubeGeometry, THREE.ShaderMaterial> {
    const curve = new THREE.LineCurve3(new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2));
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.15, 8, false);

    const tubeMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x00e5a0) },
        opacity: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          float pulse = sin((vUv.x * 15.0) - (time * 8.0)) * 0.5 + 0.5;
          pulse = pow(pulse, 4.0); // Make the pulse sharper like a packet
          gl_FragColor = vec4(color, pulse * opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tube);
    dataFlowLines.push(tube);
    return tube;
  }

  // Data lines from gates to server room
  addDataLine(3, 4, -8, -15, 5, -5);
  addDataLine(8, 4, -8, -15, 5, -5);
  addDataLine(13, 4, -8, -15, 5, -5);
  addDataLine(-8, 4, 5, -15, 5, -5);
  // From server to antenna towers
  addDataLine(-20, 6, -5, 25, 11, -18);
  addDataLine(-20, 6, -5, -25, 9, 20);
  addDataLine(-20, 6, -5, 25, 10, 20);

  // --- Highlight boxes (glowing outlines for focused elements) ---
  function createHighlightBox(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
  ): THREE.LineSegments<THREE.EdgesGeometry, THREE.LineBasicMaterial> {
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0 }));
    line.position.set(x, y, z);
    scene.add(line);
    return line;
  }

  // Highlight for warehouse
  const hlWarehouse = createHighlightBox(24, 10, 18, 8, 4, 2);
  // Highlight for server room
  const hlServer = createHighlightBox(12, 8, 10, -20, 3, -5);
  // Highlight for conveyor area
  const hlConveyor = createHighlightBox(22, 4, 5, -5, 2, 5);

  // ============================================
  // PUBLIC API — Called by the pins module
  // ============================================

  window.rfidScene = {
    transitionTo: function (cameraState: RfidCameraState) {
      if (!cameraState) return;
      targetCamPos.set(cameraState.pos.x, cameraState.pos.y, cameraState.pos.z);
      targetLookAt.set(cameraState.lookAt.x, cameraState.lookAt.y, cameraState.lookAt.z);
      targetFog = cameraState.fogDensity || 0.005;

      // Determine which phase-specific animations to show
      // based on which area the camera is focused on
      const lx = cameraState.lookAt.x;
      const px = cameraState.pos.x;

      // Heuristic: if camera is close to gates area → phase2 mode
      if (px < 20 && px > 5) {
        currentState = 'phase2';
      } else if (lx < -5) {
        currentState = 'phase3';
      } else if (cameraState.fogDensity <= 0.004) {
        currentState = 'phase4';
      } else {
        currentState = 'phase1';
      }
    },

    getCurrentState: function () {
      return currentState;
    },
  };

  // Simplified scroll handler — only manages scene opacity
  function updateOpacityFromScroll() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      const contactTop = contactEl.offsetTop;
      if (scrollY + vh * 0.5 >= contactTop) {
        targetOpacity = 0;
      } else {
        targetOpacity = 1;
      }
    }

    // Also show 3D when in immersive section
    const immersive = document.getElementById('immersive');
    if (immersive) {
      const rect = immersive.getBoundingClientRect();
      const inImmersive = rect.top < vh && rect.bottom > 0;
      if (inImmersive) {
        // Make the 3D scene fully visible and bring it above sections
        container!.style.zIndex = '2';
      } else {
        container!.style.zIndex = '-1';
      }
    }
  }

  let scrollTicking = false;
  const onScroll = () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        updateOpacityFromScroll();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Initial
  updateOpacityFromScroll();

  // ============================================
  // ANIMATION LOOP
  // ============================================

  const clock = new THREE.Clock();
  const currentLookAt = new THREE.Vector3(0, 3, 0);
  const lerpSpeed = 0.02;
  let rafId = 0;

  function animate() {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth camera movement
    camera.position.lerp(targetCamPos, lerpSpeed);
    currentLookAt.lerp(targetLookAt, lerpSpeed);
    camera.lookAt(currentLookAt);

    // Smooth fog
    fog.density += (targetFog - fog.density) * 0.03;

    // Smooth opacity
    sceneOpacity += (targetOpacity - sceneOpacity) * 0.05;
    container!.style.opacity = String(sceneOpacity);

    // --- Animate RFID signal waves ---
    waves.forEach((w) => {
      const ud = w.userData as WaveData;
      const p = (t * ud.speed + ud.phase) % 1;
      const s = 0.3 + 2.7 * p;
      w.scale.set(s, s, 1);
      (w.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - p);
      w.position.y = ud.baseY + p * 0.5;
    });

    // --- Animate server LEDs ---
    serverLeds.forEach((led) => {
      (led.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.2 + 0.8 * Math.abs(Math.sin(t * 3 + led.position.x * 5));
    });

    // --- Phase-specific animations ---

    // Phase 1: Scan line sweeps
    if (currentState === 'phase1') {
      scanPlaneMat.opacity += (0.04 - scanPlaneMat.opacity) * 0.05;
      const scanZ = -20 + ((t * 5) % 44);
      scanLineMesh.position.z = scanZ;
      mat.scanLine.opacity += (0.5 - mat.scanLine.opacity) * 0.05;
      hlWarehouse.material.opacity += (0.6 - hlWarehouse.material.opacity) * 0.05;
    } else {
      scanPlaneMat.opacity += (0 - scanPlaneMat.opacity) * 0.05;
      mat.scanLine.opacity += (0 - mat.scanLine.opacity) * 0.05;
      hlWarehouse.material.opacity += (0 - hlWarehouse.material.opacity) * 0.05;
    }

    // Phase 2: Highlight RFID gates and hardware
    if (currentState === 'phase2') {
      rfidLight1.intensity = 2 + Math.sin(t * 2) * 1;
      rfidLight2.intensity = 1.5 + Math.sin(t * 2.5) * 0.8;
    } else {
      rfidLight1.intensity += (1 - rfidLight1.intensity) * 0.03;
      rfidLight2.intensity += (0.8 - rfidLight2.intensity) * 0.03;
    }

    // Phase 3: Data flow lines glow
    if (currentState === 'phase3') {
      dataFlowLines.forEach((line, i) => {
        line.material.uniforms.time.value = t + i * 0.5;
        line.material.uniforms.opacity.value += (0.8 - line.material.uniforms.opacity.value) * 0.08;
      });
      hlServer.material.opacity += (0.6 - hlServer.material.opacity) * 0.05;
      hlConveyor.material.opacity += (0.6 - hlConveyor.material.opacity) * 0.05;
    } else {
      dataFlowLines.forEach((line) => {
        line.material.uniforms.opacity.value += (0 - line.material.uniforms.opacity.value) * 0.05;
      });
      hlServer.material.opacity += (0 - hlServer.material.opacity) * 0.05;
      hlConveyor.material.opacity += (0 - hlConveyor.material.opacity) * 0.05;
    }

    // Phase 4: Everything glows brighter
    if (currentState === 'phase4') {
      sunLight.intensity += (1.5 - sunLight.intensity) * 0.03;
      serverGlow.intensity += (1.2 - serverGlow.intensity) * 0.03;
      fillLight.intensity += (0.5 - fillLight.intensity) * 0.03;
    } else {
      sunLight.intensity += (1.0 - sunLight.intensity) * 0.03;
      serverGlow.intensity += (0.6 - serverGlow.intensity) * 0.03;
      fillLight.intensity += (0.25 - fillLight.intensity) * 0.03;
    }

    // Slow auto-rotation drift for the lookAt target (subtle)
    if (currentState === 'hero' || currentState === 'video' || currentState === 'services' || currentState === 'cta') {
      const drift = Math.sin(t * 0.15) * 3;
      targetCamPos.x = cameraStates[currentState].pos.x + drift;
      targetCamPos.z = cameraStates[currentState].pos.z + drift * 0.7;
    }

    renderer.render(scene, camera);
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
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    if (window.rfidScene) delete window.rfidScene;
    renderer.domElement.remove();
    renderer.dispose();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const m = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
      else if (m) m.dispose();
    });
  };
}
