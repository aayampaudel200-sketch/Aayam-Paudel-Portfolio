/**
 * Shared site behaviour: header, mobile menu, scroll progress,
 * scroll reveals, year, configurable social links, image fallbacks,
 * and email clipboard helper.
 */

/* ---------- Scroll reveal with IntersectionObserver & Dynamic Staggering ---------- */
let revealObserver = null;

function observeReveals() {
  // Automatically apply staggered delay indexes to grid items and card collections
  const staggeredContainers = document.querySelectorAll(
    '.strip-grid, .project-grid, .project-grid--full, .skills-grid, .academic-grid, .experience-grid, .build-principles, .focus-stats, .business-services, .tag-row, .github-stats-grid'
  );
  staggeredContainers.forEach((container) => {
    const children = Array.from(container.children).filter((el) => el.nodeType === 1);
    children.forEach((child, idx) => {
      if (!child.style.getPropertyValue('--stagger-index')) {
        child.style.setProperty('--stagger-index', idx);
      }
      child.classList.add('reveal-up');
    });
  });

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
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
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

window.showToast = showToast;

/* ---------- Persistent light/dark theme ---------- */
function initThemeToggle() {
  const toggles = document.querySelectorAll('.theme-toggle');
  if (!toggles.length) return;

  function applyTheme(theme) {
    const isLight = theme === 'light';
    document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
    toggles.forEach((toggle) => {
      const label = `Switch to ${isLight ? 'dark' : 'light'} theme`;
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
    });
  }

  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('site-theme') === 'light' ? 'light' : 'dark';
  } catch (error) {
    console.warn('Unable to read the saved color theme:', error);
  }
  applyTheme(savedTheme);
  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
      try {
        localStorage.setItem('site-theme', nextTheme);
      } catch (error) {
        console.warn('Unable to save the selected color theme:', error);
      }
    });
  });
}

/* ---------- A spoken greeting, started only when the portrait is activated ---------- */
function initPortraitGreeting() {
  const portrait = document.getElementById('sayHelloButton');
  const greetingAudio = document.getElementById('helloGreetingAudio');
  if (!portrait || !(greetingAudio instanceof HTMLAudioElement)) return;
  const muteToggle = document.getElementById('portraitMuteToggle');
  greetingAudio.muted = false;

  async function playGreeting(showError) {
    if (greetingAudio.muted) return;
    if (!greetingAudio.paused && !greetingAudio.ended) return;
    try {
      if (greetingAudio.ended) greetingAudio.currentTime = 0;
      await greetingAudio.play();
    } catch (error) {
      if (showError) {
        console.error('Unable to play the greeting audio:', error);
        showToast('Could not play the greeting. Please check your device audio.');
      }
    }
  }

  portrait.addEventListener('pointerenter', () => playGreeting(false));
  portrait.addEventListener('click', (event) => {
    if (event.target.closest('#portraitMuteToggle')) return;
    playGreeting(true);
  });
  portrait.addEventListener('keydown', (event) => {
    if (event.target.closest('button')) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    playGreeting(true);
  });
  muteToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    greetingAudio.muted = !greetingAudio.muted;
    muteToggle.setAttribute('aria-pressed', String(greetingAudio.muted));
    const label = `${greetingAudio.muted ? 'Unmute' : 'Mute'} greeting audio`;
    muteToggle.setAttribute('aria-label', label);
    muteToggle.title = label;
  });
}

/* ---------- Search indexed sections across the static site pages ---------- */
let siteSearchIndexPromise = null;

function normalizeSearchText(value) {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function getSearchSectionTitle(section, pageTitle) {
  const heading = section.querySelector('h1, h2, h3');
  const labelledBy = section.getAttribute('aria-labelledby');
  const labelledHeading = labelledBy
    ? section.ownerDocument.getElementById(labelledBy)?.textContent.trim()
    : '';
  return (heading && heading.textContent.trim())
    || labelledHeading
    || section.getAttribute('aria-label')
    || section.querySelector('.eyebrow')?.textContent.trim()
    || pageTitle;
}

async function loadSiteSearchIndex() {
  const pages = ['index.html', 'about.html', 'projects.html', 'playground.html'];
  const pageResults = await Promise.allSettled(pages.map(async (path) => {
    const pageUrl = new URL(path, window.location.href);
    const response = await fetch(pageUrl, { headers: { Accept: 'text/html' } });
    if (!response.ok) throw new Error(`Search index request failed for ${path}: ${response.status}`);

    const pageDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    const pageTitle = pageDocument.title.split(/[—|]/, 1)[0].trim();
    const pageSlug = path.replace(/\.html$/i, '').replace(/[^a-z0-9-]+/gi, '-');
    const sections = [...pageDocument.querySelectorAll('main section')];

    sections.forEach((section, index) => {
      if (section.id) return;
      const headingSlug = normalizeSearchText(getSearchSectionTitle(section, pageTitle))
        .replace(/\s+/g, '-')
        .slice(0, 40) || 'section';
      section.id = `search-${pageSlug}-${headingSlug}-${index + 1}`;
    });

    return sections.map((section) => {
      const title = getSearchSectionTitle(section, pageTitle);
      const extraText = [...section.querySelectorAll('img[alt], video[aria-label]')]
        .map((media) => media.getAttribute('alt') || media.getAttribute('aria-label'))
        .filter(Boolean)
        .join(' ');
      const text = `${title} ${section.textContent} ${extraText}`.replace(/\s+/g, ' ').trim();
      const url = new URL(pageUrl);
      if (section.id) url.hash = section.id;

      return { title, text, normalizedText: normalizeSearchText(text), url: url.href };
    }).filter((entry) => entry.normalizedText.length > 0);
  }));

  const entries = [];
  const failedPages = [];
  pageResults.forEach((result, index) => {
    if (result.status === 'fulfilled') entries.push(...result.value);
    else {
      failedPages.push(pages[index]);
      console.error(`Unable to index ${pages[index]} for site search:`, result.reason);
    }
  });

  if (Array.isArray(window.__portfolioSearchEntries)) {
    window.__portfolioSearchEntries.forEach((entry) => {
      const text = `${entry.title} ${entry.text}`.replace(/\s+/g, ' ').trim();
      entries.push({
        title: entry.title,
        text,
        normalizedText: normalizeSearchText(text),
        url: entry.url,
      });
    });
  }

  if (!entries.length) throw new Error('No site pages could be indexed for search.');
  return { entries, failedPages };
}

function initSiteSearch() {
  const forms = [...document.querySelectorAll('.site-search')];
  if (!forms.length) return;

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const pageSlug = currentPage.replace(/\.html$/i, '');
  [...document.querySelectorAll('main section')].forEach((section, index) => {
    if (section.id) return;
    const pageTitle = document.title.split(/[—|]/, 1)[0].trim();
    const headingSlug = normalizeSearchText(getSearchSectionTitle(section, pageTitle))
      .replace(/\s+/g, '-')
      .slice(0, 40) || 'section';
    section.id = `search-${pageSlug}-${headingSlug}-${index + 1}`;
  });

  function closeResults(form) {
    const input = form.querySelector('input[type="search"]');
    const results = form.querySelector('.site-search-results');
    results.hidden = true;
    input.setAttribute('aria-expanded', 'false');
  }

  function showMessage(form, message) {
    const results = form.querySelector('.site-search-results');
    const input = form.querySelector('input[type="search"]');
    form.querySelector('.site-search-status').textContent = message;
    results.replaceChildren();
    const messageElement = document.createElement('p');
    messageElement.className = 'site-search-empty';
    messageElement.textContent = message;
    results.append(messageElement);
    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function findMatches(index, query) {
    const normalizedQuery = normalizeSearchText(query);
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];

    return index.entries
      .map((entry) => {
        if (!terms.every((term) => entry.normalizedText.includes(term))) return null;
        const titleText = normalizeSearchText(entry.title);
        const score = (entry.normalizedText.includes(normalizedQuery) ? 10 : 0)
          + terms.reduce((total, term) => total + (titleText.includes(term) ? 5 : 0), 0);
        return { ...entry, score };
      })
      .filter(Boolean)
      .sort((left, right) => right.score - left.score)
      .slice(0, 6);
  }

  function renderMatches(form, matches, failedPages) {
    const results = form.querySelector('.site-search-results');
    const input = form.querySelector('input[type="search"]');
    const status = form.querySelector('.site-search-status');
    results.replaceChildren();

    if (!matches.length) {
      showMessage(form, 'No matches found. Try another search.');
      status.textContent = 'No search results found.';
      return;
    }

    matches.forEach((match) => {
      const link = document.createElement('a');
      link.className = 'site-search-result';
      const destination = new URL(match.url);
      destination.searchParams.set('search', '1');
      link.href = destination.href;
      link.setAttribute('role', 'option');

      const title = document.createElement('strong');
      title.textContent = match.title;
      const excerpt = document.createElement('span');
      const lowerText = match.text.toLocaleLowerCase();
      const terms = form.querySelector('input[type="search"]').value
        .toLocaleLowerCase()
        .split(/\s+/);
      const matchPosition = terms
        .map((term) => lowerText.indexOf(term))
        .filter((position) => position >= 0)
        .sort((a, b) => a - b)[0] ?? 0;
      let start = matchPosition > 55 ? matchPosition - 55 : 0;
      if (start > 0) {
        const nextWord = match.text.indexOf(' ', start);
        if (nextWord > start && nextWord < matchPosition) start = nextWord + 1;
      }
      let end = Math.min(match.text.length, start + 160);
      if (end < match.text.length) {
        const lastWord = match.text.lastIndexOf(' ', end);
        if (lastWord > start) end = lastWord;
      }
      excerpt.textContent = `${start > 0 ? '…' : ''}${match.text.slice(start, end).trim()}${end < match.text.length ? '…' : ''}`;
      link.append(title, excerpt);
      results.append(link);
    });

    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    status.textContent = `${matches.length} search result${matches.length === 1 ? '' : 's'} found${failedPages.length ? '. Some pages could not be searched.' : '.'}`;
  }

  async function search(form, query, isCurrent = () => true) {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      if (isCurrent()) showMessage(form, 'Enter at least 2 characters to search.');
      return { matches: [], failedPages: [] };
    }

    if (isCurrent()) showMessage(form, 'Searching…');
    try {
      if (!siteSearchIndexPromise) siteSearchIndexPromise = loadSiteSearchIndex();
      const index = await siteSearchIndexPromise;
      const matches = findMatches(index, trimmedQuery);
      if (isCurrent()) renderMatches(form, matches, index.failedPages);
      return { matches, failedPages: index.failedPages };
    } catch (error) {
      siteSearchIndexPromise = null;
      console.error('Unable to complete site search:', error);
      if (isCurrent()) {
        showMessage(form, 'Search is temporarily unavailable. Please try again.');
        form.querySelector('.site-search-status').textContent = 'Search is temporarily unavailable.';
      }
      return { matches: [], failedPages: [] };
    }
  }

  forms.forEach((form) => {
    const input = form.querySelector('input[type="search"]');
    let activeSearch = 0;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-haspopup', 'listbox');
    input.setAttribute('autocomplete', 'off');
    const results = form.querySelector('.site-search-results');
    if (results.id) input.setAttribute('aria-controls', results.id);

    input.addEventListener('input', async () => {
      const searchNumber = ++activeSearch;
      if (!input.value.trim()) {
        closeResults(form);
        form.querySelector('.site-search-status').textContent = '';
        return;
      }
      const { matches } = await search(form, input.value, () => searchNumber === activeSearch);
      if (searchNumber !== activeSearch) return;
      if (matches.length) form.querySelector('.site-search-results').hidden = false;
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const searchNumber = ++activeSearch;
      const { matches } = await search(form, input.value, () => searchNumber === activeSearch);
      if (searchNumber === activeSearch && matches.length) window.location.assign(matches[0].url);
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeResults(form);
      } else if (event.key === 'ArrowDown') {
        const firstResult = form.querySelector('.site-search-result');
        if (firstResult && !form.querySelector('.site-search-results').hidden) {
          event.preventDefault();
          firstResult.focus();
        }
      }
    });

    form.addEventListener('keydown', (event) => {
      if (!event.target.classList.contains('site-search-result')) return;
      const links = [...form.querySelectorAll('.site-search-result')];
      const currentIndex = links.indexOf(event.target);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = (currentIndex + direction + links.length) % links.length;
        links[nextIndex].focus();
      } else if (event.key === 'Escape') {
        closeResults(form);
        input.focus();
      }
    });
  });

  document.addEventListener('pointerdown', (event) => {
    forms.forEach((form) => {
      if (!form.contains(event.target)) closeResults(form);
    });
  });
}

function highlightSearchDestination() {
  if (new URLSearchParams(window.location.search).get('search') !== '1' || !window.location.hash) return;
  let targetId;
  try {
    targetId = decodeURIComponent(window.location.hash.slice(1));
  } catch (error) {
    console.warn('Unable to decode the search destination:', error);
    return;
  }

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ block: 'start' });
    target.classList.add('search-target-highlight');
    window.setTimeout(() => target.classList.remove('search-target-highlight'), 2200);
  }));
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
      if (window.innerWidth > 1024) closeMenu();
    });
  }

  /* ---------- Initial scroll reveal ---------- */
  observeReveals();
  initThemeToggle();
  initPortraitGreeting();
  initSiteSearch();
  highlightSearchDestination();

  /* ---------- Subtle 3D pointer tilt for selected visual cards ---------- */
  function initTiltCards(root = document) {
    if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return;

    root.querySelectorAll('[data-tilt]').forEach((card) => {
      if (card.dataset.tiltBound === '1') return;
      card.dataset.tiltBound = '1';
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

  window.__initTiltCards = initTiltCards;
  initTiltCards();

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

  /* ---------- Magnetic Button Hover Effect (Desktop Fine Pointer Only) ---------- */
  function initMagneticButtons() {
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isFinePointer || reducedMotion) return;

    const magneticTargets = document.querySelectorAll(
      '.btn-primary, .header-cta, .contact-submit, #copyEmailBtn, .mobile-cta'
    );

    magneticTargets.forEach((btn) => {
      let frame = null;

      btn.addEventListener('pointermove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          btn.style.transform = `translate3d(${x * 0.22}px, ${y * 0.22}px, 0)`;
          btn.style.transition = 'transform 0.12s ease-out';
        });
      });

      btn.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame);
        btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        btn.style.transform = 'translate3d(0, 0, 0)';
        setTimeout(() => {
          btn.style.transition = '';
          btn.style.transform = '';
        }, 400);
      });
    });
  }

  /* ---------- Live GitHub API Widget ---------- */
  async function initGitHubWidget() {
    const widgets = document.querySelectorAll('.github-card-widget');
    if (!widgets.length) return;

    widgets.forEach(async (widget) => {
      const username = widget.dataset.user || 'aayampaudel200-sketch';
      const cacheKey = `gh_user_${username}`;
      const cacheTimeKey = `gh_time_${username}`;
      const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 mins cache

      let userData = null;
      try {
        const cachedTime = localStorage.getItem(cacheTimeKey);
        const cachedJson = localStorage.getItem(cacheKey);
        if (cachedJson && cachedTime && Date.now() - Number(cachedTime) < CACHE_DURATION_MS) {
          userData = JSON.parse(cachedJson);
        }
      } catch {}

      if (!userData) {
        try {
          const res = await fetch(`https://api.github.com/users/${username}`, {
            headers: { Accept: 'application/vnd.github.v3+json' },
          });
          if (res.ok) {
            userData = await res.json();
            try {
              localStorage.setItem(cacheKey, JSON.stringify(userData));
              localStorage.setItem(cacheTimeKey, String(Date.now()));
            } catch {}
          }
        } catch (e) {
          console.warn('Unable to reach GitHub API:', e);
        }
      }

      if (userData) {
        const reposEl = widget.querySelector('.github-repos-count');
        const followersEl = widget.querySelector('.github-followers-count');
        const locationEl = widget.querySelector('.github-location');
        const avatarEl = widget.querySelector('.github-avatar');
        const syncStatusEl = widget.querySelector('.github-sync-status');
        const joinDateEl = widget.querySelector('.github-join-date');

        if (reposEl && userData.public_repos !== undefined) {
          reposEl.textContent = userData.public_repos;
        }
        if (followersEl && userData.followers !== undefined) {
          followersEl.textContent = userData.followers;
        }
        if (locationEl && userData.location) {
          locationEl.textContent = userData.location;
        }
        if (avatarEl && userData.avatar_url) {
          avatarEl.src = userData.avatar_url;
        }
        if (syncStatusEl) {
          syncStatusEl.textContent = 'Live GitHub Verified';
        }
        if (joinDateEl && userData.created_at) {
          const year = new Date(userData.created_at).getFullYear();
          joinDateEl.textContent = `Active since ${year}`;
        }
      }
    });
  }

  /* ---------- Dynamic System Operational Status Badge ---------- */
  function initSystemStatusBadge() {
    const badges = document.querySelectorAll('.footer-status-badge');
    if (!badges.length) return;

    function updateStatus(isOnline) {
      badges.forEach((badge) => {
        const text = badge.querySelector('.status-text') || badge.querySelector('.status-indicator-text');
        if (isOnline) {
          badge.classList.remove('status--offline');
          badge.classList.add('status--operational');
          if (text) text.textContent = 'All Systems Operational';
          badge.title = 'Site services and API endpoints are fully operational';
        } else {
          badge.classList.remove('status--operational');
          badge.classList.add('status--offline');
          if (text) text.textContent = 'Offline Mode Active';
          badge.title = 'Network connection offline';
        }
      });
    }

    window.addEventListener('online', () => updateStatus(true));
    window.addEventListener('offline', () => updateStatus(false));
    updateStatus(navigator.onLine !== false);
  }

  /* ---------- Fallback for inline images that fail ---------- */
  document.querySelectorAll('.portrait-img').forEach((img) => {
    img.addEventListener('error', () => {
      img.hidden = true;
      img.closest('.portrait-frame')?.classList.add('img-fallback');
    }, { once: true });
  });

  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => {
      const fb = img.getAttribute('data-fallback');
      if (fb) { img.src = fb; }
    }, { once: true });
  });

  /* ---------- Interactive hero terminal ---------- */
  function initHeroTerminal() {
    const terminal = document.getElementById('heroTerminal');
    if (!terminal) return;

    const output = terminal.querySelector('.terminal-output');
    const form = terminal.querySelector('.terminal-form');
    const input = terminal.querySelector('.terminal-input');
    if (!output || !form || !input) return;

    const aboutText = [
      'Aayam Paudel — B.Sc. CSIT student & full-stack web developer from Nepal.',
      'I write HTML, CSS, JavaScript, PHP, Python, and SQL.',
      'Currently building practical web apps and shipping them on Vercel.',
    ];

    const projectLines = [
      'haat-bazzar/          Live marketplace concept',
      'municipal-portal/     Civic tech hackathon prototype',
      'aayam-portfolio/      This interactive portfolio site',
      '',
      'Tip: open projects.html for full details.',
    ];

    function appendLine(text, className = '') {
      const line = document.createElement('p');
      if (className) line.className = className;
      line.textContent = text;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }

    function appendBlock(lines, className = '') {
      lines.forEach((line) => appendLine(line, className));
    }

    function runCommand(raw) {
      const command = raw.trim().toLowerCase();
      appendLine(`guest@aayam:~$ ${raw}`, 'terminal-cmd');

      if (!command) return;

      if (command === 'help') {
        appendBlock([
          'Available commands:',
          '  cat about.txt     — short bio',
          '  list projects     — featured projects',
          '  clear             — clear the terminal',
          '  help              — show this list',
        ], 'terminal-ok');
        return;
      }

      if (command === 'cat about.txt' || command === 'cat about') {
        appendBlock(aboutText, 'terminal-ok');
        return;
      }

      if (command === 'list projects' || command === 'ls projects' || command === 'ls') {
        appendBlock(projectLines, 'terminal-ok');
        return;
      }

      if (command === 'clear' || command === 'cls') {
        output.replaceChildren();
        appendLine('Terminal cleared. Type help to begin.', 'terminal-muted');
        return;
      }

      appendLine(`Command not found: ${raw}. Type help for available commands.`, 'terminal-error');
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = input.value;
      input.value = '';
      runCommand(value);
    });

    terminal.addEventListener('click', () => input.focus());
  }

  /* ---------- Tech stack filtering + proficiency tooltips ---------- */
  function initSkillTags() {
    const filterBar = document.getElementById('skillFilterBar');
    const skillTags = [...document.querySelectorAll('.skill-tag[data-skill]')];
    if (!skillTags.length) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'skill-tooltip';
    tooltip.hidden = true;
    tooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltip);

    function hideTooltip() {
      tooltip.hidden = true;
    }

    function showTooltip(tag) {
      const years = tag.dataset.years || '1';
      const level = tag.dataset.level || 'Familiar';
      const name = tag.dataset.skill || tag.textContent.trim();
      tooltip.innerHTML = `<strong>${name}</strong><span>${years} yr${years === '1' ? '' : 's'} experience</span><span>Proficiency: ${level}</span>`;
      tooltip.hidden = false;

      const rect = tag.getBoundingClientRect();
      const tipWidth = tooltip.offsetWidth;
      const left = Math.min(
        Math.max(12, rect.left + rect.width / 2 - tipWidth / 2),
        window.innerWidth - tipWidth - 12
      );
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 10}px`;
    }

    skillTags.forEach((tag) => {
      tag.setAttribute('tabindex', '0');
      tag.addEventListener('pointerenter', () => showTooltip(tag));
      tag.addEventListener('pointerleave', hideTooltip);
      tag.addEventListener('focus', () => showTooltip(tag));
      tag.addEventListener('blur', hideTooltip);
    });

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!tooltip.contains(target) && !skillTags.some((tag) => tag.contains(target))) hideTooltip();
    });

    window.addEventListener('scroll', hideTooltip, { passive: true });

    if (!filterBar) return;

    const buttons = [...filterBar.querySelectorAll('[data-skill-filter]')];
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.dataset.skillFilter;
        buttons.forEach((btn) => btn.classList.toggle('active', btn === button));

        skillTags.forEach((tag) => {
          const category = tag.dataset.category || 'all';
          const match = filter === 'all' || category === filter || category.split(' ').includes(filter);
          tag.classList.toggle('is-dimmed', !match);
          tag.classList.toggle('is-highlighted', match && filter !== 'all');
        });
      });
    });
  }

  /* ---------- Landing page typewriter ---------- */
  function initLandingTypewriter() {
    const output = document.getElementById('heroTypewriter');
    if (!output) return;
    if (reducedMotion) {
      output.textContent = 'useful web experiences.';
      return;
    }

    const phrases = [
      'useful web experiences.',
      'clean interfaces for real people.',
      'ideas from Nepal to the web.',
      'small details that feel alive.',
    ];
    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let timer = null;

    function tick() {
      const phrase = phrases[phraseIndex];
      characterIndex += deleting ? -1 : 1;
      output.textContent = phrase.slice(0, Math.max(0, characterIndex));

      if (!deleting && characterIndex === phrase.length) {
        deleting = true;
        timer = window.setTimeout(tick, 1500);
        return;
      }
      if (deleting && characterIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        timer = window.setTimeout(tick, 280);
        return;
      }
      timer = window.setTimeout(tick, deleting ? 28 : 52);
    }

    tick();
    window.addEventListener('pagehide', () => window.clearTimeout(timer), { once: true });
  }

  // Initialize new interactive enhancements
  initMagneticButtons();
  initGitHubWidget();
  initSystemStatusBadge();
  initHeroTerminal();
  initSkillTags();
  initLandingTypewriter();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMain);
} else {
  initMain();
}
