/**
 * RFID Solutions — Interactive Pin System
 * Scroll-driven step progression with clickable pins on the 3D model.
 *
 * Faithful TypeScript port of the original pins.js. The IIFE is now an init
 * function returning a cleanup callback; logic and the STEPS data are unchanged.
 */

import type { RfidCameraState } from '../global';

interface PinData {
  id: string;
  label: string;
  x: number;
  y: number;
  title: string;
  desc: string;
  imgBg: string;
}

interface Step {
  phase: number;
  step: number;
  phaseLabel: string;
  label: string;
  text: string;
  camera: RfidCameraState;
  pins: PinData[];
}

export function initPins(): () => void {
  'use strict';

  // ============================================
  // STEP DEFINITIONS — 10 steps across 4 phases
  // ============================================

  const STEPS: Step[] = [
    // ── PHASE 1: Site Assessment ──
    {
      phase: 1, step: 1,
      phaseLabel: 'Site Assessment',
      label: 'STEP 01',
      text: 'Map your facility layout and identify RFID coverage zones for optimal tag visibility.',
      camera: { pos: { x: 45, y: 55, z: 30 }, lookAt: { x: 0, y: 0, z: 0 }, fogDensity: 0.004 },
      pins: [
        { id: 'warehouse', label: 'Warehouse Zone', x: 38, y: 38, title: 'Warehouse Zone', desc: 'Primary storage area requiring full RFID coverage for pallet and case-level tracking across all aisles.', imgBg: 'linear-gradient(135deg, #1a3a5c 0%, #0d1b2a 100%)' },
        { id: 'dock', label: 'Loading Dock', x: 55, y: 52, title: 'Loading Dock', desc: 'High-throughput receiving and shipping area where portal readers capture inbound and outbound movements.', imgBg: 'linear-gradient(135deg, #2d4a5c 0%, #1b3040 100%)' },
        { id: 'server', label: 'Server Room', x: 22, y: 45, title: 'Server Room', desc: 'Edge computing hub housing RFID middleware, data aggregation servers, and network switching infrastructure.', imgBg: 'linear-gradient(135deg, #0a2540 0%, #162032 100%)' },
      ],
    },
    {
      phase: 1, step: 2,
      phaseLabel: 'Site Assessment',
      label: 'STEP 02',
      text: 'Analyze RF interference — metal surfaces, liquids, and competing signals that could degrade read accuracy.',
      camera: { pos: { x: 35, y: 40, z: 40 }, lookAt: { x: 5, y: 2, z: 0 }, fogDensity: 0.005 },
      pins: [
        { id: 'metal', label: 'Metal Shelving', x: 60, y: 35, title: 'Metal Shelving', desc: 'Evaluate signal reflection and attenuation caused by steel racking to determine optimal tag orientation.', imgBg: 'linear-gradient(135deg, #3d5a6e 0%, #1b2d45 100%)' },
        { id: 'liquid', label: 'Liquid Storage', x: 35, y: 55, title: 'Liquid Storage', desc: 'Assess RF absorption from water and chemical containers that can create read dead zones.', imgBg: 'linear-gradient(135deg, #1a4a6e 0%, #0d2840 100%)' },
        { id: 'rfzone', label: 'RF Dead Zone', x: 75, y: 50, title: 'RF Interference Zone', desc: 'Identify competing wireless signals from WiFi, BLE, and industrial equipment that may overlap UHF frequencies.', imgBg: 'linear-gradient(135deg, #4a2040 0%, #2d1030 100%)' },
      ],
    },
    {
      phase: 1, step: 3,
      phaseLabel: 'Site Assessment',
      label: 'STEP 03',
      text: 'Define tag types and read-range requirements for each operational zone.',
      camera: { pos: { x: 50, y: 30, z: 45 }, lookAt: { x: 5, y: 3, z: 5 }, fogDensity: 0.006 },
      pins: [
        { id: 'uhf', label: 'UHF Tag Zone', x: 45, y: 40, title: 'UHF Tag Zone', desc: 'Long-range passive UHF tags (860–960 MHz) for pallet and case tracking with read distances up to 15 meters.', imgBg: 'linear-gradient(135deg, #00667a 0%, #003d4d 100%)' },
        { id: 'nfc', label: 'NFC Checkpoint', x: 25, y: 55, title: 'NFC Checkpoint', desc: 'Near-field communication points for item-level authentication and high-security access verification.', imgBg: 'linear-gradient(135deg, #2a5a3a 0%, #1a3a2a 100%)' },
        { id: 'active', label: 'Active Tag Zone', x: 68, y: 32, title: 'Active Tag Zone', desc: 'Battery-powered active tags for real-time location tracking of high-value assets across the facility.', imgBg: 'linear-gradient(135deg, #5a3a1a 0%, #3d2a0d 100%)' },
      ],
    },

    // ── PHASE 2: System Architecture ──
    {
      phase: 2, step: 1,
      phaseLabel: 'System Architecture',
      label: 'STEP 04',
      text: 'Select and position RFID readers and antennas for maximum coverage across all zones.',
      camera: { pos: { x: 15, y: 18, z: -20 }, lookAt: { x: 5, y: 2, z: -5 }, fogDensity: 0.008 },
      pins: [
        { id: 'gate', label: 'RFID Gate Portal', x: 40, y: 45, title: 'RFID Gate Portal', desc: 'Four-antenna portal reader system at loading docks capturing 1,000+ tags per second during bulk shipments.', imgBg: 'linear-gradient(135deg, #00445a 0%, #002a3a 100%)' },
        { id: 'ceiling', label: 'Ceiling Antenna', x: 58, y: 30, title: 'Ceiling Antenna', desc: 'Overhead-mounted circular polarized antennas providing zone-level tracking across open warehouse floor areas.', imgBg: 'linear-gradient(135deg, #1a3050 0%, #0d1b2a 100%)' },
        { id: 'handheld', label: 'Handheld Station', x: 25, y: 60, title: 'Handheld Station', desc: 'Mobile RFID reader stations for cycle counting, picking verification, and exception handling.', imgBg: 'linear-gradient(135deg, #3a4a2a 0%, #2a3a1a 100%)' },
      ],
    },
    {
      phase: 2, step: 2,
      phaseLabel: 'System Architecture',
      label: 'STEP 05',
      text: 'Design the middleware layer to filter, aggregate, and route tag data into business events.',
      camera: { pos: { x: -25, y: 20, z: 15 }, lookAt: { x: -10, y: 3, z: 0 }, fogDensity: 0.007 },
      pins: [
        { id: 'edge', label: 'Edge Server', x: 22, y: 42, title: 'Edge Server', desc: 'On-premise edge computing node that filters noise, deduplicates reads, and applies business logic in real time.', imgBg: 'linear-gradient(135deg, #0d2a40 0%, #061520 100%)' },
        { id: 'pipeline', label: 'Data Pipeline', x: 50, y: 35, title: 'Data Pipeline', desc: 'Event-driven streaming architecture processing tag events through transformation, enrichment, and routing stages.', imgBg: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)' },
        { id: 'cloud', label: 'Cloud Gateway', x: 72, y: 50, title: 'Cloud Gateway', desc: 'Secure cloud integration endpoint connecting on-premise RFID data to enterprise analytics and reporting platforms.', imgBg: 'linear-gradient(135deg, #2a3a5a 0%, #1a2a40 100%)' },
      ],
    },
    {
      phase: 2, step: 3,
      phaseLabel: 'System Architecture',
      label: 'STEP 06',
      text: 'Plan network infrastructure — PoE switches, fiber backbone, and failover redundancy paths.',
      camera: { pos: { x: -40, y: 35, z: -40 }, lookAt: { x: 0, y: 5, z: 0 }, fogDensity: 0.004 },
      pins: [
        { id: 'switch', label: 'Network Switch', x: 30, y: 45, title: 'Network Switch', desc: 'Industrial managed PoE+ switches providing power and data connectivity to all fixed RFID readers.', imgBg: 'linear-gradient(135deg, #2a4050 0%, #1a2a3a 100%)' },
        { id: 'poe', label: 'PoE Injector', x: 55, y: 38, title: 'PoE Injector', desc: 'Power-over-Ethernet midspans delivering 30W per port to ceiling antennas and portal readers.', imgBg: 'linear-gradient(135deg, #3a5040 0%, #2a3a2a 100%)' },
        { id: 'fiber', label: 'Fiber Backbone', x: 42, y: 60, title: 'Fiber Backbone', desc: 'Multi-mode fiber optic backbone connecting reader clusters to the edge server with sub-millisecond latency.', imgBg: 'linear-gradient(135deg, #4a3060 0%, #2a1a40 100%)' },
      ],
    },

    // ── PHASE 3: Integration & Deploy ──
    {
      phase: 3, step: 1,
      phaseLabel: 'Integration',
      label: 'STEP 07',
      text: 'Connect RFID data streams to your ERP, WMS, and enterprise platforms via secure APIs.',
      camera: { pos: { x: 55, y: 50, z: -30 }, lookAt: { x: 0, y: 0, z: 0 }, fogDensity: 0.005 },
      pins: [
        { id: 'erp', label: 'ERP Connector', x: 28, y: 40, title: 'ERP Connector', desc: 'Native integration with SAP, Oracle, and Microsoft Dynamics for automatic inventory reconciliation.', imgBg: 'linear-gradient(135deg, #2a3a6a 0%, #1a2a4a 100%)' },
        { id: 'wms', label: 'WMS Link', x: 55, y: 35, title: 'WMS Integration', desc: 'Real-time warehouse management system updates — automatic receiving, put-away, and shipping confirmation.', imgBg: 'linear-gradient(135deg, #3a4a2a 0%, #2a3a1a 100%)' },
        { id: 'api', label: 'API Gateway', x: 70, y: 55, title: 'API Gateway', desc: 'RESTful and webhook-based API gateway enabling custom integrations with any third-party platform.', imgBg: 'linear-gradient(135deg, #1a4a5a 0%, #0d3040 100%)' },
      ],
    },
    {
      phase: 3, step: 2,
      phaseLabel: 'Integration',
      label: 'STEP 08',
      text: 'Install readers, mount antennas, run cabling, and calibrate every component for peak performance.',
      camera: { pos: { x: 30, y: 25, z: 35 }, lookAt: { x: 5, y: 3, z: 5 }, fogDensity: 0.006 },
      pins: [
        { id: 'mount', label: 'Reader Mount', x: 35, y: 38, title: 'Reader Mount', desc: 'Professional mounting of fixed readers at dock doors and conveyor checkpoints with IP65-rated enclosures.', imgBg: 'linear-gradient(135deg, #4a5a3a 0%, #3a4a2a 100%)' },
        { id: 'align', label: 'Antenna Alignment', x: 60, y: 45, title: 'Antenna Alignment', desc: 'Precision alignment of antenna beam patterns using real-time heatmap visualization for optimal read zones.', imgBg: 'linear-gradient(135deg, #2a5060 0%, #1a3a4a 100%)' },
        { id: 'cable', label: 'Cable Infrastructure', x: 42, y: 58, title: 'Cable Infrastructure', desc: 'Low-loss coaxial cabling and Cat6A network runs with proper shielding and strain relief for industrial environments.', imgBg: 'linear-gradient(135deg, #5a4a3a 0%, #3a3020 100%)' },
      ],
    },

    // ── PHASE 4: Go-Live & Optimize ──
    {
      phase: 4, step: 1,
      phaseLabel: 'Go-Live',
      label: 'STEP 09',
      text: 'Launch your system with real-time monitoring dashboards and intelligent alerting.',
      camera: { pos: { x: 60, y: 40, z: 60 }, lookAt: { x: 0, y: 5, z: 0 }, fogDensity: 0.003 },
      pins: [
        { id: 'dashboard', label: 'Live Dashboard', x: 30, y: 35, title: 'Live Dashboard', desc: 'Real-time web dashboard showing read rates, asset counts, system health, and operational KPIs at a glance.', imgBg: 'linear-gradient(135deg, #0d3050 0%, #061a30 100%)' },
        { id: 'alerts', label: 'Alert System', x: 55, y: 48, title: 'Alert System', desc: 'Configurable alerts for read-rate drops, reader offline events, unauthorized tag movements, and SLA breaches.', imgBg: 'linear-gradient(135deg, #6a2a2a 0%, #4a1a1a 100%)' },
        { id: 'analytics', label: 'Analytics Engine', x: 72, y: 32, title: 'Analytics Engine', desc: 'Historical trend analysis, throughput forecasting, and anomaly detection powered by machine learning models.', imgBg: 'linear-gradient(135deg, #2a2a5a 0%, #1a1a3a 100%)' },
      ],
    },
    {
      phase: 4, step: 2,
      phaseLabel: 'Go-Live',
      label: 'STEP 10',
      text: 'Continuously optimize — firmware updates, capacity scaling, and performance tuning as your operation grows.',
      camera: { pos: { x: 50, y: 45, z: 50 }, lookAt: { x: 0, y: 3, z: 0 }, fogDensity: 0.004 },
      pins: [
        { id: 'tuning', label: 'Performance Tuning', x: 35, y: 42, title: 'Performance Tuning', desc: 'Ongoing read-rate optimization, antenna power adjustment, and tag sensitivity calibration based on operational data.', imgBg: 'linear-gradient(135deg, #2a4a3a 0%, #1a3a2a 100%)' },
        { id: 'firmware', label: 'Firmware Update', x: 58, y: 35, title: 'Firmware Updates', desc: 'Managed firmware lifecycle with staged rollouts, rollback capability, and zero-downtime update procedures.', imgBg: 'linear-gradient(135deg, #3a3a5a 0%, #2a2a40 100%)' },
        { id: 'scale', label: 'Capacity Scaling', x: 48, y: 58, title: 'Capacity Scaling', desc: 'Modular expansion architecture allowing you to add readers, zones, and integrations without system redesign.', imgBg: 'linear-gradient(135deg, #1a5a4a 0%, #0d3a30 100%)' },
      ],
    },
  ];

  // ============================================
  // DOM REFERENCES
  // ============================================

  const immersive = document.getElementById('immersive');
  const pinsContainer = document.getElementById('immersive-pins');
  const card = document.getElementById('immersive-card');
  const cardTitle = document.getElementById('card-title');
  const cardDesc = document.getElementById('card-desc');
  const cardImg = document.getElementById('card-img');
  const cardClose = document.getElementById('card-close');
  const stepLabel = document.getElementById('step-label');
  const stepText = document.getElementById('step-text');
  const navPhaseDot = document.getElementById('nav-phase-dot');
  const navPhaseLabel = document.getElementById('nav-phase-label');
  const navPhase = document.getElementById('nav-phase');
  const progressDots = document.querySelectorAll<HTMLElement>('.progress__dot');
  const progress = document.getElementById('progress');

  if (!immersive || !pinsContainer) return () => {};

  // ============================================
  // STATE
  // ============================================

  let currentStepIndex = -1;
  let cardOpen = false;
  let activePins: HTMLElement[] = [];

  // ============================================
  // PIN RENDERING
  // ============================================

  function clearPins() {
    // Fade out existing pins
    activePins.forEach((pin) => {
      pin.classList.remove('visible');
    });
    // Empty container after fade-out completes
    setTimeout(() => {
      pinsContainer!.innerHTML = '';
      activePins = [];
    }, 300);
  }

  function renderPins(step: Step) {
    // Wait for clearPins to finish emptying (300ms) + safety margin
    setTimeout(
      () => {
        pinsContainer!.innerHTML = '';
        activePins = [];

        step.pins.forEach((pinData, i) => {
          const pin = document.createElement('div');
          pin.className = 'pin';
          pin.style.left = pinData.x + '%';
          pin.style.top = pinData.y + '%';
          pin.dataset.pinId = pinData.id;
          pin.innerHTML = `
          <div class="pin__icon">✦</div>
          <span class="pin__label">${pinData.label}</span>
        `;

          // Staggered entrance
          pin.style.transitionDelay = i * 120 + 'ms';

          pin.addEventListener('click', (e) => {
            e.stopPropagation();
            openCard(pinData, pin);
          });

          pinsContainer!.appendChild(pin);
          activePins.push(pin);

          // Trigger visible class after a frame
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              pin.classList.add('visible');
            });
          });
        });
      },
      currentStepIndex === -1 ? 0 : 450,
    );
  }

  // ============================================
  // DETAIL CARD
  // ============================================

  function openCard(pinData: PinData, pinEl: HTMLElement) {
    if (cardOpen && cardTitle!.textContent === pinData.title) {
      closeCard();
      return;
    }

    cardTitle!.textContent = pinData.title;
    cardDesc!.textContent = pinData.desc;

    // Image placeholder with gradient background and RFID icon
    cardImg!.innerHTML = `
      <div style="width:100%;height:100%;background:${pinData.imgBg};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background-image:linear-gradient(rgba(0,212,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.03) 1px,transparent 1px);background-size:20px 20px;"></div>
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:0.25;position:relative;">
          <path d="M12 2a2.5 2.5 0 012.5 2.5v15a2.5 2.5 0 01-5 0v-15A2.5 2.5 0 0112 2z" fill="rgba(255,255,255,0.5)"/>
          <path d="M7.5 6.5a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-3 0V8a1.5 1.5 0 011.5-1.5z" fill="rgba(255,255,255,0.5)"/>
          <path d="M16.5 6.5a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-3 0V8a1.5 1.5 0 011.5-1.5z" fill="rgba(255,255,255,0.5)"/>
        </svg>
      </div>
    `;

    // Position card near the pin
    const pinRect = pinEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let cardX = pinRect.left + pinRect.width / 2;
    let cardY = pinRect.top - 10;

    // Card width is ~320px at standard rem
    const cardW = vw * 0.22; // approximate 32rem
    const cardH = vh * 0.45;

    // Keep card on screen
    if (cardX + cardW > vw - 40) cardX = vw - cardW - 40;
    if (cardX < 40) cardX = 40;
    if (cardY + cardH > vh - 40) cardY = vh - cardH - 40;
    if (cardY < 80) cardY = 80;

    card!.style.left = cardX + 'px';
    card!.style.top = cardY + 'px';

    card!.classList.add('open');
    cardOpen = true;
  }

  function closeCard() {
    card!.classList.remove('open');
    cardOpen = false;
  }

  // Close card on outside click
  const onDocClick = (e: MouseEvent) => {
    const target = e.target as Node;
    const targetEl = e.target as HTMLElement;
    if (cardOpen && !card!.contains(target) && !targetEl.closest('.pin')) {
      closeCard();
    }
  };
  document.addEventListener('click', onDocClick);

  const onCardClose = (e: Event) => {
    e.stopPropagation();
    closeCard();
  };
  if (cardClose) {
    cardClose.addEventListener('click', onCardClose);
  }

  // ============================================
  // STEP TEXT UPDATE
  // ============================================

  function updateStepText(step: Step) {
    // Fade out
    stepText!.style.opacity = '0';
    stepLabel!.style.opacity = '0';

    setTimeout(() => {
      stepLabel!.textContent = step.label;
      stepText!.textContent = step.text;

      // Fade in
      stepText!.style.opacity = '1';
      stepLabel!.style.opacity = '1';
    }, 300);
  }

  // ============================================
  // NAV & PROGRESS UPDATES
  // ============================================

  function updateNav(step: Step, stepIndex: number) {
    if (navPhaseDot) navPhaseDot.textContent = String(step.phase);
    if (navPhaseLabel) navPhaseLabel.textContent = step.phaseLabel;
    if (navPhase) navPhase.classList.add('visible');

    // Update progress dots
    progressDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === stepIndex);
    });
  }

  // ============================================
  // 3D CAMERA BRIDGE
  // ============================================

  function transitionCamera(cameraState: RfidCameraState) {
    // Bridge to scene3d via global API
    if (window.rfidScene && window.rfidScene.transitionTo) {
      window.rfidScene.transitionTo(cameraState);
    }
  }

  // ============================================
  // SCROLL ENGINE
  // ============================================

  function getStepFromScroll() {
    const rect = immersive!.getBoundingClientRect();
    const sectionHeight = immersive!.offsetHeight;
    const scrolled = -rect.top; // How far past the top of the section
    const progressRatio = Math.max(0, Math.min(1, scrolled / (sectionHeight - window.innerHeight)));

    // Map progress to step index (0–9)
    const stepIndex = Math.min(STEPS.length - 1, Math.floor(progressRatio * STEPS.length));
    return stepIndex;
  }

  function onScrollHandler() {
    const rect = immersive!.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;

    if (!inView) {
      // Hide progress dots when not in immersive
      if (progress) progress.classList.remove('visible');
      if (navPhase) navPhase.classList.remove('visible');
      return;
    }

    // Show progress + nav
    if (progress) progress.classList.add('visible');

    const stepIndex = getStepFromScroll();

    if (stepIndex !== currentStepIndex && stepIndex >= 0 && stepIndex < STEPS.length) {
      const step = STEPS[stepIndex];

      // Close any open card on step change
      closeCard();

      // Clear old pins and render new ones
      clearPins();
      renderPins(step);

      // Update text
      updateStepText(step);

      // Update nav
      updateNav(step, stepIndex);

      // Transition 3D camera
      transitionCamera(step.camera);

      currentStepIndex = stepIndex;
    }
  }

  // Throttled scroll
  let scrollTicking = false;
  const onScroll = () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        onScrollHandler();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // ============================================
  // INIT
  // ============================================

  // Run once on load
  const initTimeout = setTimeout(() => {
    onScrollHandler();
    // If we're at the top, show step 0
    if (currentStepIndex === -1) {
      currentStepIndex = 0;
      const step = STEPS[0];
      renderPins(step);
      updateStepText(step);
      updateNav(step, 0);
      transitionCamera(step.camera);
    }
  }, 500);

  // ============================================
  // CLEANUP
  // ============================================

  return () => {
    clearTimeout(initTimeout);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('click', onDocClick);
    if (cardClose) cardClose.removeEventListener('click', onCardClose);
  };
}
