/**
 * Namaste Suman Communication - Interactive Hub Features
 * Handles live open/closed status, animated statistic counters,
 * hero background parallax, visa category filters, smooth scrolling, and 3D card tilt.
 */

// Smooth number counter for Visa statistics
function initVisaCounters() {
  const counters = document.querySelectorAll('[data-counter-target]');
  if (!counters.length) return;
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        obs.unobserve(el);
        const target = parseInt(el.getAttribute('data-counter-target'), 10);
        const prefix = el.getAttribute('data-counter-prefix') || '';
        const suffix = el.getAttribute('data-counter-suffix') || '';
        const duration = 1600;
        const startTime = performance.now();
        function update(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(ease * target);
          el.textContent = `${prefix}${current.toLocaleString()}${suffix}`;
          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            el.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
          }
        }
        requestAnimationFrame(update);
      }
    });
  }, { threshold: 0.2 });

  counters.forEach((c) => observer.observe(c));
}

// Hero Background Parallax Effect
function initHeroParallax() {
  const bg = document.getElementById('heroBg');
  const hero = document.getElementById('topHero');
  if (!bg || !hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < hero.offsetHeight + 80) {
      bg.style.transform = `scale(1.05) translateY(${y * 0.28}px)`;
    }
  }, { passive: true });

  if (window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      bg.style.setProperty('--mouse-shift-x', `${x * 16}px`);
      bg.style.setProperty('--mouse-shift-y', `${y * 16}px`);
    }, { passive: true });
  }
}

// Live Business Status Calculator for Nepal Time (UTC+5:45)
function updateLiveStatus() {
  const pill = document.getElementById('nsLivePill');
  const text = document.getElementById('nsLiveStatusText');
  if (!pill || !text) return;

  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const npt = new Date(utc + (3600000 * 5.75));
  const day = npt.getDay(); // 0 is Sun, 6 is Sat
  const hour = npt.getHours() + (npt.getMinutes() / 60);

  // Business hours: Sunday (0) to Friday (5), 7:30 AM to 8:00 PM
  const isOpen = (day >= 0 && day <= 5) && (hour >= 7.5 && hour < 20);

  if (isOpen) {
    pill.classList.remove('is-closed');
    pill.classList.add('is-open');
    text.textContent = 'Open Today until 8:00 PM';
    pill.title = 'Namaste Suman Communication is currently open (7:30 AM - 8:00 PM)';
  } else {
    pill.classList.remove('is-open');
    pill.classList.add('is-closed');
    if (day === 6) {
      text.textContent = 'Opens Sunday at 7:30 AM';
    } else if (hour >= 20) {
      text.textContent = (day === 5) ? 'Opens Sunday at 7:30 AM' : 'Opens Tomorrow at 7:30 AM';
    } else {
      text.textContent = 'Opens Today at 7:30 AM';
    }
    pill.title = 'Namaste Suman Communication is currently closed';
  }
}

// Visa Category Filter Tabs
function initVisaFilter() {
  const filterBtns = document.querySelectorAll('[data-visa-filter]');
  const cards = document.querySelectorAll('.ns-visa-card[data-visa-type]');
  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-visa-filter');
      filterBtns.forEach((b) => b.classList.toggle('active', b === btn));
      cards.forEach((card) => {
        const cardType = card.getAttribute('data-visa-type');
        const match = filter === 'all' || cardType === filter;
        card.classList.toggle('is-highlighted', match && filter !== 'all');
        card.classList.toggle('is-dimmed', !match);
      });
    });
  });
}

// Scroll Down Button Smooth Scroll
function initScrollDown() {
  const btn = document.getElementById('scrollDownBtn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById('visa-documentation');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

// 3D Tilt for Visa and Showcase Cards
function initCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const cards = document.querySelectorAll('.ns-visa-card, .ns-showcase-card, .ns-info-card');
  cards.forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

function initPage() {
  initVisaCounters();
  initHeroParallax();
  updateLiveStatus();
  initVisaFilter();
  initScrollDown();
  initCardTilt();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPage);
} else {
  initPage();
}
