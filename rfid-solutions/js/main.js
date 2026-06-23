/**
 * RFID Solutions — Scroll Engine & Interactions
 * Handles scroll-driven animations, menu, progress dots, and phase reveals
 */

(function () {
  'use strict';

  // ============================================
  // INITIALIZATION
  // ============================================
  
  const state = {
    menuOpen: false,
    currentPhase: 0,
    scrollY: 0,
    windowHeight: 0,
    sections: [],
    initialized: false,
  };

  // Wait for DOM
  document.addEventListener('DOMContentLoaded', init);

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
        const contentRect = menuContent.getBoundingClientRect();
        const totalHeight = contentRect.height + 10;
        const totalWidth = Math.max(contentRect.width + 10, 320);
        menuBg.style.width = totalWidth + 'px';
        menuBg.style.height = totalHeight + 'px';
      } else {
        menuBg.style.width = '';
        menuBg.style.height = '';
      }
    };

    hamburger.addEventListener('click', toggleMenu);
    menuLabel.addEventListener('click', toggleMenu);

    // Close menu on link click
    const menuLinks = document.querySelectorAll('.nav__menu-link');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (state.menuOpen) {
          state.menuOpen = false;
          document.body.classList.remove('menu-open');
          menuBg.style.width = '';
          menuBg.style.height = '';
        }
      });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.menuOpen) {
        state.menuOpen = false;
        document.body.classList.remove('menu-open');
        menuBg.style.width = '';
        menuBg.style.height = '';
      }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (state.menuOpen && !e.target.closest('.nav__menu-btn')) {
        state.menuOpen = false;
        document.body.classList.remove('menu-open');
        menuBg.style.width = '';
        menuBg.style.height = '';
      }
    });
  }

  // ============================================
  // INTERSECTION OBSERVERS
  // ============================================

  function setupIntersectionObservers() {
    // Phase title animations
    const phaseTitleObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
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
    }, {
      threshold: 0.3,
      rootMargin: '-10% 0px -10% 0px'
    });

    document.querySelectorAll('.phase-title').forEach(el => {
      el.classList.add('anim'); // Start hidden
      phaseTitleObserver.observe(el);
    });

    // General section animations
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -5% 0px'
    });

    // Observe phases
    document.querySelectorAll('.phase').forEach(el => sectionObserver.observe(el));

    // Observe services section
    const services = document.querySelector('.services');
    if (services) sectionObserver.observe(services);

    // Observe specs section
    const specs = document.querySelector('.specs');
    if (specs) sectionObserver.observe(specs);

    // Video content observer
    const videoContentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
        }
      });
    }, {
      threshold: 0.3,
    });

    const videoContent = document.getElementById('video-content');
    if (videoContent) videoContentObserver.observe(videoContent);

    // Fade-in elements
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
        }
      });
    }, {
      threshold: 0.2,
    });

    document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));
  }

  // ============================================
  // SCROLL LISTENER
  // ============================================

  function setupScrollListener() {
    let ticking = false;

    window.addEventListener('scroll', () => {
      state.scrollY = window.scrollY;

      if (!ticking) {
        requestAnimationFrame(() => {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  function onScroll() {
    updateNavStyle();
    updateProgressDots();
    updatePhaseIndicator();
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

    darkSections.forEach(section => {
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
      dots.forEach(dot => {
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
    const dots = document.querySelectorAll('.progress__dot');
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const index = parseInt(dot.dataset.index);
        if (state.sections[index] && state.sections[index].el) {
          state.sections[index].el.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  function updateProgressDots() {
    const dots = document.querySelectorAll('.progress__dot');
    if (!dots.length) return;

    let activeIndex = 0;
    const scrollCenter = state.scrollY + state.windowHeight * 0.4;

    state.sections.forEach((section, i) => {
      if (section.el) {
        const top = section.el.offsetTop;
        if (scrollCenter >= top) {
          activeIndex = i;
        }
      }
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIndex);
    });
  }

  // ============================================
  // PHASE INDICATOR (Nav)
  // ============================================

  function updatePhaseIndicator() {
    const navPhase = document.getElementById('nav-phase');
    const navPhaseDot = document.getElementById('nav-phase-dot');
    const navPhaseLabel = document.getElementById('nav-phase-label');

    if (!navPhase) return;

    const phases = [
      { id: 'phase-1', num: 1, label: 'Site Assessment' },
      { id: 'phase-2', num: 2, label: 'System Architecture' },
      { id: 'phase-3', num: 3, label: 'Integration' },
      { id: 'phase-4', num: 4, label: 'Go-Live' },
    ];

    let currentPhase = null;
    const scrollCenter = state.scrollY + state.windowHeight * 0.4;

    phases.forEach(phase => {
      const el = document.getElementById(phase.id);
      if (el) {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (scrollCenter >= top && scrollCenter < bottom) {
          currentPhase = phase;
        }
      }
    });

    if (currentPhase) {
      navPhase.classList.add('visible');
      navPhaseDot.textContent = currentPhase.num;
      navPhaseLabel.textContent = currentPhase.label;
    } else {
      navPhase.classList.remove('visible');
    }

    // Update active menu link
    const menuLinks = document.querySelectorAll('.nav__menu-link');
    let activeTarget = 'hero';

    state.sections.forEach(section => {
      if (section.el) {
        const top = section.el.offsetTop;
        if (scrollCenter >= top) {
          activeTarget = section.id;
        }
      }
    });

    menuLinks.forEach(link => {
      const target = link.dataset.target;
      link.classList.toggle('active', target === activeTarget);
    });
  }

  // ============================================
  // NAVIGATION & SMOOTH SCROLL
  // ============================================

  function setupNavigation() {
    // Logo click -> scroll to top
    const logo = document.getElementById('nav-logo');
    if (logo) {
      logo.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Hero CTA
    const heroCta = document.getElementById('hero-cta');
    if (heroCta) {
      heroCta.addEventListener('click', () => {
        const contact = document.getElementById('contact');
        if (contact) contact.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Explore button
    const heroExplore = document.getElementById('hero-explore');
    if (heroExplore) {
      heroExplore.addEventListener('click', () => {
        const immersiveSection = document.getElementById('immersive');
        if (immersiveSection) immersiveSection.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Menu CTA button
    const menuCta = document.getElementById('menu-cta-btn');
    if (menuCta) {
      menuCta.addEventListener('click', () => {
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
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href').substring(1);
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

  window.addEventListener('resize', () => {
    state.windowHeight = window.innerHeight;
  }, { passive: true });

})();
