/* ============================================================
   THEME TOGGLE — dark / light with localStorage persistence
   ============================================================ */

(function initTheme() {
  const html    = document.documentElement;
  const btn     = document.getElementById('themeToggle');
  const STORAGE = 'sp-theme';

  // Apply saved preference (default: dark)
  const saved = localStorage.getItem(STORAGE) || 'dark';
  html.setAttribute('data-theme', saved);

  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE, next);
  });
})();


/* ============================================================
   NAVIGATION — scroll-aware state
   ============================================================ */

(function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  // Pages with is-scrolled forced on by default (non-homepage) don't need JS scroll handling
  if (nav.classList.contains('is-scrolled')) return;

  const THRESHOLD = 40;

  function update() {
    if (window.scrollY > THRESHOLD) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();


/* ============================================================
   SCROLL ANIMATIONS — Intersection Observer
   ============================================================ */

(function initScrollAnimations() {
  const elements = document.querySelectorAll('[data-animate]');
  if (!elements.length) return;

  // Respect reduced-motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // Animate once
        }
      });
    },
    {
      threshold: 0.08,
      rootMargin: '0px 0px -48px 0px',
    }
  );

  elements.forEach(el => observer.observe(el));
})();


/* ============================================================
   PROJECT FILTER — Work page
   ============================================================ */

(function initFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards      = document.querySelectorAll('.project-card[data-category]');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active button
      filterBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      // Show/hide cards with a brief fade
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;

        if (match) {
          card.classList.remove('is-hidden');
          // Re-trigger entrance animation
          card.classList.remove('is-visible');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => card.classList.add('is-visible'));
          });
        } else {
          card.classList.add('is-hidden');
        }
      });
    });
  });
})();


/* ============================================================
   PARALLAX — Case study hero
   ============================================================ */

(function initParallax() {
  const el = document.getElementById('cs-parallax');
  if (!el) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  function onScroll() {
    const scrollY = window.scrollY;
    // Move the background layer at 30% of scroll speed for depth
    el.style.transform = `translateY(${scrollY * 0.28}px)`;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ============================================================
   SMOOTH HOVER — project grid sibling dimming
   (CSS :has() handles modern browsers; this is a JS fallback)
   ============================================================ */

(function initGridHover() {
  const grid = document.querySelector('.project-grid');
  if (!grid) return;

  // CSS :has() handles this in modern browsers — skip if supported
  try {
    document.querySelector('.project-grid:has(.project-card:hover)');
    return; // :has() works, CSS handles it
  } catch (_) {
    // Fallback for older browsers
  }

  const cards = grid.querySelectorAll('.project-card');

  grid.addEventListener('mouseover', e => {
    const card = e.target.closest('.project-card');
    if (!card) return;
    cards.forEach(c => {
      c.style.opacity = c === card ? '1' : '0.5';
    });
  });

  grid.addEventListener('mouseleave', () => {
    cards.forEach(c => { c.style.opacity = ''; });
  });
})();


/* ============================================================
   HERO TEXT — stagger on load (homepage only)
   ============================================================ */

(function initHeroEntrance() {
  // Elements with data-animate are handled by IntersectionObserver,
  // but hero elements start in viewport — trigger them on load
  const heroElements = document.querySelectorAll('.hero [data-animate]');
  if (!heroElements.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    heroElements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  // Small initial delay so the page paint completes first
  setTimeout(() => {
    heroElements.forEach(el => el.classList.add('is-visible'));
  }, 80);
})();


/* ============================================================
   ACTIVE NAV LINK — highlight based on current page
   ============================================================ */

(function initActiveNav() {
  const links = document.querySelectorAll('.nav__link');
  const path  = window.location.pathname;

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    // Normalise: strip leading "../" for case study pages
    const normalHref = href.replace(/^\.\.\//, '/');
    const normalPath = path.replace(/\/index\.html$/, '/');

    if (normalPath.includes(normalHref.replace('.html', '')) && normalHref !== '/') {
      link.classList.add('is-active');
    }
  });
})();


/* ============================================================
   MARQUEE — pause on reduced motion
   ============================================================ */

(function initMarquee() {
  const track = document.querySelector('.marquee__track');
  if (!track) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    track.style.animationPlayState = 'paused';
  }
})();


/* ============================================================
   FEATURED GALLERY — perspective carousel with drag/swipe
   ============================================================ */

(function initFeaturedGallery() {
  const root = document.querySelector('.featured-gallery');
  if (!root) return;

  const stage   = root.querySelector('.gallery__stage');
  const cards   = [...root.querySelectorAll('.gallery__card')];
  const dots    = [...root.querySelectorAll('.gallery__dot')];
  const prevBtn = root.querySelector('.gallery__nav--prev');
  const nextBtn = root.querySelector('.gallery__nav--next');

  if (!cards.length) return;

  // Start with the middle card (index 1) centered
  let current = Math.floor(cards.length / 2);
  let cardWidth = 0;
  let dragOffset = 0;
  let isDragging = false;
  let startX = 0;
  let velocity = 0;
  let lastX = 0;
  let lastTime = 0;
  let suppressClick = false;

  function measure() {
    const rect = stage.getBoundingClientRect();
    cardWidth = Math.min(rect.width * 0.55, 460);
  }

  function applyTransforms(animate) {
    const offsetCards = dragOffset / cardWidth;

    cards.forEach((card, i) => {
      const dist = (i - current) - offsetCards;
      const abs  = Math.min(Math.abs(dist), 3);

      // Horizontal placement, with cards overlapping toward the center
      const x        = dist * cardWidth * 0.62;
      // Push side cards back in 3D space for parallax depth
      const z        = -abs * 90;
      // Scale: center card largest
      const scale    = 1 - abs * 0.10;
      // Opacity: side cards faded
      const opacity  = Math.max(0, 1 - abs * 0.38);
      // Blur: side cards softened
      const blur     = abs * 3.2;
      // Rotate Y: side cards tilted toward center
      const rotateY  = -dist * 11;

      if (!animate) card.classList.add('is-dragging');
      else card.classList.remove('is-dragging');

      card.style.transform = `translate3d(calc(-50% + ${x}px), -50%, ${z}px) scale(${scale}) rotateY(${rotateY}deg)`;
      card.style.opacity   = opacity.toFixed(3);
      card.style.filter    = `blur(${blur.toFixed(2)}px)`;
      card.style.zIndex    = String(Math.round(100 - abs * 20));
      card.style.pointerEvents = abs < 0.5 ? 'auto' : 'none';
      card.classList.toggle('is-center', Math.abs(i - current) === 0 && Math.abs(offsetCards) < 0.1);
    });

    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
  }

  function goTo(index) {
    current = Math.max(0, Math.min(cards.length - 1, index));
    dragOffset = 0;
    applyTransforms(true);
  }

  // ---------- Drag / swipe ----------

  function pointerStart(e) {
    isDragging = true;
    suppressClick = false;
    const point = e.touches ? e.touches[0] : e;
    startX = lastX = point.clientX;
    lastTime = performance.now();
    velocity = 0;
  }

  function pointerMove(e) {
    if (!isDragging) return;
    const point = e.touches ? e.touches[0] : e;
    const now = performance.now();
    const dt = Math.max(1, now - lastTime);
    velocity = (point.clientX - lastX) / dt;
    lastX = point.clientX;
    lastTime = now;

    dragOffset = point.clientX - startX;
    if (Math.abs(dragOffset) > 6) suppressClick = true;
    applyTransforms(false);
  }

  function pointerEnd() {
    if (!isDragging) return;
    isDragging = false;

    // Inertia: factor velocity into snap decision
    const inertia = velocity * 120;
    const projected = dragOffset + inertia;
    const threshold = cardWidth * 0.18;

    if (projected > threshold && current > 0) {
      goTo(current - 1);
    } else if (projected < -threshold && current < cards.length - 1) {
      goTo(current + 1);
    } else {
      goTo(current);
    }

    // Suppress click on cards if drag was significant
    if (suppressClick) {
      const blockClick = (e) => { e.preventDefault(); e.stopPropagation(); };
      cards.forEach(c => c.addEventListener('click', blockClick, { capture: true, once: true }));
    }
  }

  // Pointer / touch listeners
  stage.addEventListener('mousedown',  pointerStart);
  stage.addEventListener('touchstart', pointerStart, { passive: true });
  window.addEventListener('mousemove', pointerMove);
  window.addEventListener('touchmove', pointerMove, { passive: true });
  window.addEventListener('mouseup',   pointerEnd);
  window.addEventListener('touchend',  pointerEnd);
  stage.addEventListener('dragstart',  e => e.preventDefault());

  // ---------- Nav controls ----------

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  // Keyboard nav when gallery is in viewport
  window.addEventListener('keydown', (e) => {
    const inView = root.getBoundingClientRect();
    if (inView.bottom < 0 || inView.top > window.innerHeight) return;
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  // ---------- Init ----------

  measure();
  applyTransforms(true);
  window.addEventListener('resize', () => { measure(); applyTransforms(true); });
})();
