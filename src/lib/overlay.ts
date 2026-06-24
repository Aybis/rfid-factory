/**
 * RFID Solutions — Cinematic Overlay
 *
 * Owns the 2D DOM layer that sits on top of the 3D scene: the pins, the detail
 * card, the bottom-right step narration, the nav phase chip, and the progress
 * dots. Pins are anchored to 3D world coordinates (from journey.ts) and the
 * scene module calls `projectPins()` every frame to keep them glued to features
 * as the camera flies.
 */

import * as THREE from 'three';
import { STAGES, STAGE_COUNT, type JourneyPin } from './journey';

interface ActivePin {
  el: HTMLDivElement;
  world: THREE.Vector3;
  data: JourneyPin;
}

let ready = false;
let currentStageIndex = -1;
let cardOpen = false;
let activePins: ActivePin[] = [];
const cleanups: Array<() => void> = [];

// DOM refs (resolved on init)
let pinsContainer: HTMLElement | null = null;
let card: HTMLElement | null = null;
let cardTitle: HTMLElement | null = null;
let cardDesc: HTMLElement | null = null;
let cardImg: HTMLElement | null = null;
let stepLabel: HTMLElement | null = null;
let stepText: HTMLElement | null = null;
let navPhase: HTMLElement | null = null;
let navPhaseDot: HTMLElement | null = null;
let navPhaseLabel: HTMLElement | null = null;
let progressDots: NodeListOf<HTMLElement> | null = null;

const _v = new THREE.Vector3();

export function initOverlay(): () => void {
  pinsContainer = document.getElementById('immersive-pins');
  card = document.getElementById('immersive-card');
  cardTitle = document.getElementById('card-title');
  cardDesc = document.getElementById('card-desc');
  cardImg = document.getElementById('card-img');
  stepLabel = document.getElementById('step-label');
  stepText = document.getElementById('step-text');
  navPhase = document.getElementById('nav-phase');
  navPhaseDot = document.getElementById('nav-phase-dot');
  navPhaseLabel = document.getElementById('nav-phase-label');
  progressDots = document.querySelectorAll<HTMLElement>('.progress__dot');

  const cardClose = document.getElementById('card-close');

  if (!pinsContainer) {
    return () => {};
  }

  // Close card on outside click
  const onDocClick = (e: MouseEvent) => {
    const targetEl = e.target as HTMLElement;
    if (cardOpen && card && !card.contains(targetEl) && !targetEl.closest('.pin')) {
      closeCard();
    }
  };
  document.addEventListener('click', onDocClick);
  cleanups.push(() => document.removeEventListener('click', onDocClick));

  const onCardClose = (e: Event) => {
    e.stopPropagation();
    closeCard();
  };
  if (cardClose) {
    cardClose.addEventListener('click', onCardClose);
    cleanups.push(() => cardClose.removeEventListener('click', onCardClose));
  }

  ready = true;
  return () => {
    cleanups.forEach((fn) => fn());
    cleanups.length = 0;
    ready = false;
    currentStageIndex = -1;
    activePins = [];
  };
}

function closeCard() {
  if (!card) return;
  card.classList.remove('open');
  cardOpen = false;
}

function openCard(data: JourneyPin, pinEl: HTMLElement) {
  if (!card || !cardTitle || !cardDesc || !cardImg) return;

  if (cardOpen && cardTitle.textContent === data.title) {
    closeCard();
    return;
  }

  cardTitle.textContent = data.title;
  cardDesc.textContent = data.desc;
  cardImg.innerHTML = `
    <div style="width:100%;height:100%;background:${data.imgBg};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;left:0;width:100%;height:100%;background-image:linear-gradient(rgba(0,212,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.04) 1px,transparent 1px);background-size:20px 20px;"></div>
      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:0.25;position:relative;">
        <path d="M12 2a2.5 2.5 0 012.5 2.5v15a2.5 2.5 0 01-5 0v-15A2.5 2.5 0 0112 2z" fill="rgba(255,255,255,0.5)"/>
        <path d="M7.5 6.5a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-3 0V8a1.5 1.5 0 011.5-1.5z" fill="rgba(255,255,255,0.5)"/>
        <path d="M16.5 6.5a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-3 0V8a1.5 1.5 0 011.5-1.5z" fill="rgba(255,255,255,0.5)"/>
      </svg>
    </div>
  `;

  const pinRect = pinEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let cardX = pinRect.left + pinRect.width / 2;
  let cardY = pinRect.top - 10;
  const cardW = Math.min(vw * 0.3, 360);
  const cardH = vh * 0.45;

  if (cardX + cardW > vw - 40) cardX = vw - cardW - 40;
  if (cardX < 40) cardX = 40;
  if (cardY + cardH > vh - 40) cardY = vh - cardH - 40;
  if (cardY < 80) cardY = 80;

  card.style.left = cardX + 'px';
  card.style.top = cardY + 'px';
  card.classList.add('open');
  cardOpen = true;
}

/** Rebuild the pin DOM for a stage and update narration/nav/progress. */
export function setStage(index: number) {
  if (!ready || !pinsContainer) return;
  if (index === currentStageIndex) return;
  const first = currentStageIndex === -1;
  currentStageIndex = index;
  const stage = STAGES[index];

  closeCard();

  // Fade out existing pins, then rebuild.
  activePins.forEach((p) => p.el.classList.remove('visible'));

  const rebuild = () => {
    pinsContainer!.innerHTML = '';
    activePins = [];

    stage.pins.forEach((pinData, i) => {
      const el = document.createElement('div');
      el.className = 'pin';
      el.dataset.pinId = pinData.id;
      el.style.transitionDelay = i * 110 + 'ms';
      el.innerHTML = `
        <div class="pin__icon">✦</div>
        <span class="pin__label">${pinData.label}</span>
      `;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openCard(pinData, el);
      });
      pinsContainer!.appendChild(el);
      activePins.push({ el, world: new THREE.Vector3(pinData.world.x, pinData.world.y, pinData.world.z), data: pinData });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add('visible'));
      });
    });
  };

  if (first) rebuild();
  else setTimeout(rebuild, 280);

  // Step narration
  if (stepText && stepLabel) {
    stepText.style.opacity = '0';
    stepLabel.style.opacity = '0';
    setTimeout(() => {
      stepLabel!.textContent = stage.label;
      stepText!.textContent = stage.text;
      stepText!.style.opacity = '1';
      stepLabel!.style.opacity = '1';
    }, 260);
  }

  // Nav phase chip
  if (navPhaseDot) navPhaseDot.textContent = String(stage.phase);
  if (navPhaseLabel) navPhaseLabel.textContent = stage.phaseLabel;
  if (navPhase) navPhase.classList.add('visible');

  // Progress dots
  if (progressDots) {
    progressDots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }
}

/**
 * Project every active pin's 3D anchor to screen space and reposition it.
 * Called once per animation frame by the scene module.
 */
export function projectPins(camera: THREE.Camera) {
  if (!ready || !activePins.length) return;
  const w = window.innerWidth;
  const h = window.innerHeight;

  for (const p of activePins) {
    _v.copy(p.world).project(camera);
    const behind = _v.z > 1;
    if (behind) {
      p.el.style.display = 'none';
      continue;
    }
    p.el.style.display = '';
    const x = (_v.x * 0.5 + 0.5) * w;
    const y = (-_v.y * 0.5 + 0.5) * h;
    p.el.style.left = x + 'px';
    p.el.style.top = y + 'px';
  }
}

export { STAGE_COUNT };
