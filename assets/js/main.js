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
   STACK CARDS — sticky cards that scale-stack on scroll
   ============================================================ */

var StackCards = function(element) {
  this.element = element;
  this.items = this.element.getElementsByClassName('js-stack-cards__item');
  this.scrollingListener = false;
  this.scrolling = false;
  this.gap = 0;
  this.stickyTop = 0;
  initStackCardsEffect(this);
};

function initStackCardsEffect(element) {
  measureStackCards(element);
  animateStackCards(element);

  window.addEventListener('resize', function() {
    measureStackCards(element);
    animateStackCards(element);
  });

  window.addEventListener('scroll', function() {
    if (element.scrollingListener) return;
    element.scrollingListener = true;
    window.requestAnimationFrame(function() {
      animateStackCards(element);
      element.scrollingListener = false;
    });
  });
}

function measureStackCards(stack) {
  if (!stack.items.length) return;
  var listStyles = getComputedStyle(stack.element);
  stack.gap = parseInt(listStyles.rowGap) || parseInt(listStyles.gridRowGap) || 0;
  var firstStyle = getComputedStyle(stack.items[0]);
  stack.stickyTop = parseInt(firstStyle.top) || 0;
}

function animateStackCards(stack) {
  // For each card, scale it down based on cumulative coverage from cards stacking on top of it.
  for (var i = 0; i < stack.items.length; i++) {
    var thisRect = stack.items[i].getBoundingClientRect();
    var reduction = 0;

    // Look at all later cards — each one that's covering this card adds scale-down
    for (var j = i + 1; j < stack.items.length; j++) {
      var nextRect = stack.items[j].getBoundingClientRect();
      // Coverage from below: how far has next card's top crossed below the top of this card
      var coverage = (stack.stickyTop + thisRect.height + stack.gap) - nextRect.top;
      if (coverage > 0) {
        var ratio = Math.min(1, coverage / (thisRect.height + stack.gap));
        reduction += ratio * 0.04;
      }
    }

    var scale = Math.max(0.84, 1 - reduction);
    stack.items[i].style.transform = 'scale(' + scale + ')';
    // Slight opacity fade for deeply-buried cards
    stack.items[i].style.opacity = Math.max(0.65, 1 - reduction * 1.2).toFixed(3);
  }
}

(function initAllStackCards() {
  var stackCards = document.getElementsByClassName('js-stack-cards');
  var intersectionObserverSupported = ('IntersectionObserver' in window
    && 'IntersectionObserverEntry' in window
    && 'intersectionRatio' in window.IntersectionObserverEntry.prototype);
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (stackCards.length > 0 && intersectionObserverSupported && !reducedMotion) {
    for (var i = 0; i < stackCards.length; i++) {
      new StackCards(stackCards[i]);
    }
  }
})();
