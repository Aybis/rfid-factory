/**
 * RFID Solutions — Scroll Engine & Interactions
 * Handles scroll-driven animations, menu, progress dots, and phase reveals.
 *
 * Faithful TypeScript port of the original main.js. Behavior is identical;
 * the IIFE is now an init function that returns a cleanup callback so React
 * can tear everything down on unmount.
 */

interface SectionRef {
  id: string;
  el: HTMLElement | null;
}

interface ScrollState {
  menuOpen: boolean;
  currentPhase: number;
  scrollY: number;
  windowHeight: number;
  sections: SectionRef[];
  initialized: boolean;
}

export function initScrollEngine(): () => void {
  'use strict';

  // Tracks every listener so we can remove them all on cleanup.
  const cleanups: Array<() => void> = [];
  function on<K extends keyof DocumentEventMap>(
    target: Document,
    type: K,
    handler: (ev: DocumentEventMap[K]) => void,
    opts?: AddEventListenerOptions,
  ): void;
  function on<K extends keyof WindowEventMap>(
    target: Window,
    type: K,
    handler: (ev: WindowEventMap[K]) => void,
    opts?: AddEventListenerOptions,
  ): void;
  function on(
    target: EventTarget,
    type: string,
    handler: EventListenerOrEventListenerObject,
    opts?: AddEventListenerOptions,
  ): void {
    target.addEventListener(type, handler, opts);
    cleanups.push(() => target.removeEventListener(type, handler, opts));
  }

  function onEl(
    el: Element | null,
    type: string,
    handler: EventListenerOrEventListenerObject,
  ): void {
    if (!el) return;
    el.addEventListener(type, handler);
    cleanups.push(() => el.removeEventListener(type, handler));
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  const state: ScrollState = {
    menuOpen: false,
    currentPhase: 0,
    scrollY: 0,
    windowHeight: 0,
    sections: [],
    initialized: false,
  };

  function init() {
    state.windowHeight = window.innerHeight;

    // Remove loading state
    requestAnimationFrame(() => {
      document.body.classList.remove('loading');
      // Trigger hero animation after a brief delay
      setTimeout(() => {
        const hero = document.getElementById('hero');
        if (hero) hero.classList.add('in');
      }, 300);
    });

    // Collect sections for progress tracking
    state.sections = [
      { id: 'hero', el: document.getElementById('hero') },
      { id: 'immersive', el: document.getElementById('immersive') },
      { id: 'services', el: document.getElementById('services') },
    ];

    setupMenu();
    setupIntersectionObservers();
    setupScrollListener();
    setupProgressDots();
    setupNavigation();
    setupSmoothScroll();

    state.initialized = true;
  }

  // ============================================
  // MENU
  // ============================================

  function setupMenu() {
    const hamburger = document.getElementById('hamburger');
    const menuLabel = document.getElementById('menu-label');
    const menuBg = document.getElementById('menu-bg');
    const menuContent = document.getElementById('menu-content');

    if (!hamburger) return;

    const toggleMenu = () => {
      state.menuOpen = !state.menuOpen;
      document.body.classList.toggle('menu-open', state.menuOpen);

      if (state.menuOpen) {
        // Calculate expanded size
        const contentRect = menuContent!.getBoundingClientRect();
        const totalHeight = contentRect.height + 10;
        const totalWidth = Math.max(contentRect.width + 10, 320);
        menuBg!.style.width = totalWidth + 'px';
        menuBg!.style.height = totalHeight + 'px';
      } else {
        menuBg!.style.width = '';
        menuBg!.style.height = '';
      }
    };

    onEl(hamburger, 'click', toggleMenu);
    onEl(menuLabel, 'click', toggleMenu);

    // Close menu on link click
    const menuLinks = document.querySelectorAll('.nav__menu-link');
    menuLinks.forEach((link) => {
      onEl(link, 'click', () => {
        if (state.menuOpen) {
          state.menuOpen = false;
          document.body.classList.remove('menu-open');
          menuBg!.style.width = '';
          menuBg!.style.height = '';
        }
      });
    });

    // Close on Escape
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && state.menuOpen) {
        state.menuOpen = false;
        document.body.classList.remove('menu-open');
        menuBg!.style.width = '';
        menuBg!.style.height = '';
      }
    });

    // Close on click outside
    on(document, 'click', (e) => {
      const target = e.target as HTMLElement;
      if (state.menuOpen && !target.closest('.nav__menu-btn')) {
        state.menuOpen = false;
        document.body.classList.remove('menu-open');
        menuBg!.style.width = '';
        menuBg!.style.height = '';
      }
    });
  }

  // ============================================
  // INTERSECTION OBSERVERS
  // ============================================

  const observers: IntersectionObserver[] = [];

  function setupIntersectionObservers() {
    // Phase title animations
    const phaseTitleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const title = entry.target;
          if (entry.isIntersecting) {
            // Add anim class first if not present
            if (!title.classList.contains('anim') && !title.classList.contains('in')) {
              title.classList.add('anim');
            }
            // Trigger entrance
            requestAnimationFrame(() => {
              title.classList.remove('anim');
              title.classList.remove('out');
              title.classList.add('in');
              // Settle after animation completes
              setTimeout(() => {
                title.classList.add('settled');
              }, 1400);
            });
          } else {
            // Only add out if it was previously in
            if (title.classList.contains('in') || title.classList.contains('settled')) {
              title.classList.remove('in');
              title.classList.remove('settled');
              title.classList.add('out');
            }
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '-10% 0px -10% 0px',
      },
    );

    document.querySelectorAll('.phase-title').forEach((el) => {
      el.classList.add('anim'); // Start hidden
      phaseTitleObserver.observe(el);
    });
    observers.push(phaseTitleObserver);

    // General section animations
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -5% 0px',
      },
    );

    // Observe phases
    document.querySelectorAll('.phase').forEach((el) => sectionObserver.observe(el));

    // Observe services section
    const services = document.querySelector('.services');
    if (services) sectionObserver.observe(services);

    // Observe specs section
    const specs = document.querySelector('.specs');
    if (specs) sectionObserver.observe(specs);
    observers.push(sectionObserver);

    // Video content observer
    const videoContentObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
          }
        });
      },
      {
        threshold: 0.3,
      },
    );

    const videoContent = document.getElementById('video-content');
    if (videoContent) videoContentObserver.observe(videoContent);
    observers.push(videoContentObserver);

    // Fade-in elements
    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
          }
        });
      },
      {
        threshold: 0.2,
      },
    );

    document.querySelectorAll('.fade-in').forEach((el) => fadeObserver.observe(el));
    observers.push(fadeObserver);
  }

  // ============================================
  // SCROLL LISTENER
  // ============================================

  function setupScrollListener() {
    let ticking = false;

    on(
      window,
      'scroll',
      () => {
        state.scrollY = window.scrollY;

        if (!ticking) {
          requestAnimationFrame(() => {
            onScroll();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true },
    );
  }

  function onScroll() {
    // Progress-dot active state and the nav phase chip are owned by the
    // cinematic overlay (driven by journey progress), so the scroll engine only
    // handles the light/dark nav styling here.
    updateNavStyle();
  }

  // ============================================
  // NAV STYLE UPDATES
  // ============================================

  function updateNavStyle() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    const scrollY = state.scrollY;
    const heroHeight = document.getElementById('hero')?.offsetHeight || 0;

    // Check if we're over a dark section
    const darkSections = document.querySelectorAll('.phase--dark, .phase--gradient, .specs, .cta-section');
    let overDark = false;

    darkSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 80 && rect.bottom >= 80) {
        overDark = true;
      }
    });

    // Also check immersive section
    const immersiveSection = document.getElementById('immersive');
    if (immersiveSection) {
      const rect = immersiveSection.getBoundingClientRect();
      if (rect.top <= 80 && rect.bottom >= 80) {
        overDark = true;
      }
    }

    if (overDark) {
      nav.classList.remove('nav--light');
    } else {
      nav.classList.add('nav--light');
    }

    // Show progress dots when scrolled past hero
    const progress = document.getElementById('progress');
    if (progress) {
      if (scrollY > heroHeight * 0.5) {
        progress.classList.add('visible');
      } else {
        progress.classList.remove('visible');
      }

      // Update dot colors based on background
      const dots = progress.querySelectorAll('.progress__dot');
      dots.forEach((dot) => {
        if (overDark) {
          dot.classList.remove('progress__dot--dark');
        } else {
          dot.classList.add('progress__dot--dark');
        }
      });
    }
  }

  // ============================================
  // PROGRESS DOTS
  // ============================================

  function setupProgressDots() {
    const dots = document.querySelectorAll<HTMLElement>('.progress__dot');
    dots.forEach((dot) => {
      onEl(dot, 'click', () => {
        const index = parseInt(dot.dataset.index || '0');
        if (state.sections[index] && state.sections[index].el) {
          state.sections[index].el!.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // ============================================
  // NAVIGATION & SMOOTH SCROLL
  // ============================================

  function setupNavigation() {
    // Logo click -> scroll to top
    const logo = document.getElementById('nav-logo');
    if (logo) {
      onEl(logo, 'click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Hero CTA
    const heroCta = document.getElementById('hero-cta');
    if (heroCta) {
      onEl(heroCta, 'click', () => {
        const contact = document.getElementById('contact');
        if (contact) contact.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Explore button
    const heroExplore = document.getElementById('hero-explore');
    if (heroExplore) {
      onEl(heroExplore, 'click', () => {
        const immersiveSection = document.getElementById('immersive');
        if (immersiveSection) immersiveSection.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Menu CTA button
    const menuCta = document.getElementById('menu-cta-btn');
    if (menuCta) {
      onEl(menuCta, 'click', () => {
        const contact = document.getElementById('contact');
        if (contact) {
          // Close menu first
          state.menuOpen = false;
          document.body.classList.remove('menu-open');
          const menuBg = document.getElementById('menu-bg');
          if (menuBg) {
            menuBg.style.width = '';
            menuBg.style.height = '';
          }
          setTimeout(() => {
            contact.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        }
      });
    }
  }

  function setupSmoothScroll() {
    // Handle all anchor links
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
      onEl(anchor, 'click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href')!.substring(1);
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // ============================================
  // WINDOW RESIZE
  // ============================================

  on(
    window,
    'resize',
    () => {
      state.windowHeight = window.innerHeight;
    },
    { passive: true },
  );

  // The original waited for DOMContentLoaded; here React guarantees the DOM
  // is mounted before this runs, so we initialize immediately.
  init();

  // ============================================
  // CLEANUP
  // ============================================

  return () => {
    cleanups.forEach((fn) => fn());
    observers.forEach((o) => o.disconnect());
  };
}
