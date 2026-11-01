/**
 * Shared site behaviour: header, mobile menu, scroll progress,
 * scroll reveals, year, configurable social links, image fallbacks,
 * and email clipboard helper.
 */
document.documentElement.classList.add('js-enabled');

/* ---------- Scroll reveal with IntersectionObserver ---------- */
let revealObserver = null;

function observeReveals() {
  const items = document.querySelectorAll('.reveal-up:not(.is-visible)');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
  }

  items.forEach((el) => revealObserver.observe(el));
}

// Expose globally so projects.js can re-observe dynamically rendered cards at any time
window.__observeReveals = observeReveals;

/* ---------- Toast Notification Helper ---------- */
function showToast(message) {
  let toast = document.querySelector('.copy-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toast.__timer);
  toast.__timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

/* ---------- Main Initialisation ---------- */
function initMain() {
  /* ---------- Current year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header scroll state & scroll progress ---------- */
  const header = document.getElementById('siteHeader');
  const progress = document.querySelector('.scroll-progress');

  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 12);
    if (progress) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
      progress.style.width = `${Math.min(Math.max(pct, 0), 100)}%`;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Homepage ambient motion responds to scrolling and pointer movement ---------- */
  const homeHero = document.querySelector('.hero');
  const heroAmbient = homeHero && homeHero.querySelector('.hero-ambient');
  if (homeHero && heroAmbient && !reducedMotion) {
    let pointerX = 0;
    let pointerY = 0;
    let motionFrame = null;

    function updateAmbientMotion() {
      if (motionFrame !== null) return;
      motionFrame = requestAnimationFrame(() => {
        motionFrame = null;
        const heroTop = homeHero.getBoundingClientRect().top;
        const scrollProgress = Math.min(Math.max(-heroTop, 0), homeHero.offsetHeight);
        heroAmbient.style.setProperty('--ambient-scroll-shift', `${scrollProgress * -0.04}px`);
        heroAmbient.style.setProperty('--ambient-pointer-x', `${pointerX}px`);
        heroAmbient.style.setProperty('--ambient-pointer-y', `${pointerY}px`);
      });
    }

    if (window.matchMedia('(pointer: fine)').matches) {
      homeHero.addEventListener('pointermove', (event) => {
        const bounds = homeHero.getBoundingClientRect();
        pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 20;
        pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 20;
        updateAmbientMotion();
      }, { passive: true });

      homeHero.addEventListener('pointerleave', () => {
        pointerX = 0;
        pointerY = 0;
        updateAmbientMotion();
      }, { passive: true });
    }

    window.addEventListener('scroll', updateAmbientMotion, { passive: true });
    window.addEventListener('resize', updateAmbientMotion, { passive: true });
    updateAmbientMotion();
  }

  /* ---------- Mobile menu ---------- */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  function closeMenu() {
    if (!hamburger || !mobileMenu) return;
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
    mobileMenu.hidden = true;
    document.body.style.overflow = '';
  }

  function openMenu() {
    if (!hamburger || !mobileMenu) return;
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close menu');
    mobileMenu.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMenu() : openMenu();
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Close menu when pressing Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        hamburger.focus();
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (hamburger.getAttribute('aria-expanded') === 'true') {
        if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
          closeMenu();
        }
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 820) closeMenu();
    });
  }

  /* ---------- Initial scroll reveal ---------- */
  observeReveals();

  /* ---------- Subtle 3D pointer tilt for selected visual cards ---------- */
  if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      const maxTilt = Number(card.dataset.tiltMax || 6);
      let frame = null;

      card.addEventListener('pointermove', (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        const rotateY = (x - 0.5) * maxTilt * 2;
        const rotateX = (0.5 - y) * maxTilt * 2;

        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
        });
      });

      card.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame);
        card.style.transform = '';
      });
    });
  }

  /* ---------- Configurable social links ---------- */
  const LINKEDIN_URL = ''; // e.g. 'https://www.linkedin.com/in/aayampaudel'

  document.querySelectorAll('[data-config="linkedin"]').forEach((el) => {
    if (LINKEDIN_URL) {
      el.href = LINKEDIN_URL;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  });

  /* ---------- Copy Email Button ---------- */
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  if (copyEmailBtn) {
    let copyFeedbackTimer;
    copyEmailBtn.addEventListener('click', async () => {
      const email = 'aayampaudel200@gmail.com';
      let copied = false;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(email);
          copied = true;
        }
      } catch (_) {
        // Fall back when clipboard permission is unavailable.
      }

      if (!copied) {
        const textarea = document.createElement('textarea');
        textarea.value = email;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          copied = document.execCommand('copy');
        } catch (_) {
          copied = false;
        } finally {
          textarea.remove();
        }
      }

      if (copied) {
        showToast('Email copied to clipboard!');
        copyEmailBtn.textContent = 'Copied!';
        copyEmailBtn.setAttribute('aria-label', 'Email copied to clipboard');
      } else {
        showToast('Copy failed. Please copy the email address directly.');
        copyEmailBtn.textContent = 'Copy failed';
        copyEmailBtn.setAttribute('aria-label', 'Copy failed; select the email address to copy it');
      }

      clearTimeout(copyFeedbackTimer);
      copyFeedbackTimer = setTimeout(() => {
        copyEmailBtn.textContent = 'Copy Email';
        copyEmailBtn.setAttribute('aria-label', 'Copy email address to clipboard');
      }, 1800);
    });
  }

  /* ---------- Fallback for inline images that fail ---------- */
  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => {
      const fb = img.getAttribute('data-fallback');
      if (fb) { img.src = fb; }
    }, { once: true });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMain);
} else {
  initMain();
}
