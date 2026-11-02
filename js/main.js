/**
 * Shared site behaviour: header, mobile menu, scroll progress,
 * scroll reveals, year, configurable social links, image fallbacks,
 * and email clipboard helper.
 */

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

  async function playGreeting(showError) {
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
  portrait.addEventListener('click', () => playGreeting(true));
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
  const pages = ['index.html', 'about.html', 'projects.html'];
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMain);
} else {
  initMain();
}
