/**
 * Shared project data, card rendering, filters, tabbed modal, and live GitHub stats.
 */

const PROJECTS = [
  {
    id: 'haat-bazzar',
    title: 'Haat Bazzar — हट बजार',
    category: 'web',
    categoryLabel: 'Marketplace / Web Application',
    status: 'Live',
    statusKey: 'live',
    description:
      'A farm-to-consumer marketplace concept designed to connect local farmers directly with customers in Nepal, reducing reliance on intermediaries.',
    tags: ['HTML', 'CSS', 'JavaScript', 'Vercel'],
    image: 'assets/images/aayam-paudel-haat-bazzar-marketplace.jpg',
    imageAlt: 'Haat Bazzar farm-to-consumer marketplace project by Aayam Paudel',
    demo: 'https://haat-bazzar-15hju1vsp-aayampaudel200-9685.vercel.app/',
    github: 'https://github.com/aayampaudel200-sketch/Haat-Bazzar',
    githubOwner: 'aayampaudel200-sketch',
    githubRepo: 'Haat-Bazzar',
    details: {
      overview:
        'Haat Bazzar is a marketplace concept built around a simple idea: farmers should be able to reach customers directly and keep more of the value they create.',
      problem:
        'Local farmers often depend on multiple intermediaries to reach buyers. This can reduce their margins and make pricing less transparent for customers looking for fresh produce.',
      architecture:
        'Static frontend marketplace with listing cards, category browsing, and direct-contact CTAs. Deployed as a Vercel static site with client-side routing of product views and responsive layout layers for mobile-first shoppers.',
      features: [
        'Farm-to-consumer listing browse experience',
        'Responsive product cards and category filters',
        'Clear call-to-action paths for buyer contact',
        'Lightweight deployment on Vercel',
      ],
      stack: ['HTML', 'CSS', 'JavaScript', 'Vercel'],
      contribution:
        'Designed and built the front-end experience, structured the listing and browsing flow, and deployed the live application.',
      learning:
        'Learned how product browsing, clear calls to action, and honest prototype framing can support an early marketplace idea.',
    },
  },
  {
    id: 'municipal-portal',
    title: 'Municipal Citizenship Recommendation Portal',
    category: 'civic',
    categoryLabel: 'Civic Technology / E-Governance',
    status: 'Prototype',
    statusKey: 'prototype',
    description:
      'A civic technology prototype developed during a 48-hour hackathon, focused on digitizing a municipal recommendation workflow for public service delivery.',
    tags: ['HTML', 'CSS', 'JavaScript', 'Civic Tech'],
    image: 'assets/images/aayam-paudel-citizenship-recommendation-portal.jpg',
    imageAlt: 'Municipal citizenship recommendation portal prototype by Aayam Paudel',
    demo: '',
    github: '',
    githubOwner: '',
    githubRepo: '',
    details: {
      overview:
        'This prototype was created in a time-boxed hackathon context to explore how a municipal recommendation process could be digitized.',
      problem:
        'Paper-based municipal workflows can be slow for citizens and difficult to track for administrators who need clear request status and document verification.',
      architecture:
        'Multi-step prototype UI modeling application intake, document upload, staff review, and status tracking. Client-side state simulates the workflow without a production backend.',
      features: [
        'Digitized recommendation request flow',
        'Document upload and review modeling',
        'Status tracking for applicants',
        'Hackathon-ready interface prototype',
      ],
      stack: ['HTML', 'CSS', 'JavaScript', 'Civic Tech'],
      contribution:
        'Contributed to the prototype concept, interface design, and front-end implementation within the hackathon timeframe.',
      learning:
        'Learned how to turn a public-service workflow into a focused interface under a short hackathon deadline.',
    },
  },
  {
    id: 'aayam-portfolio',
    title: 'Aayam Paudel Portfolio',
    category: 'web',
    categoryLabel: 'Personal Portfolio / Web Application',
    status: 'Live',
    statusKey: 'live',
    description:
      'A responsive developer portfolio featuring accessible project browsing, site search, a light and dark theme, and a server-backed contact workflow.',
    tags: ['HTML', 'CSS', 'JavaScript', 'Vercel'],
    image: 'assets/images/aayam-paudel-social-preview.jpg',
    imageAlt: 'Aayam Paudel developer portfolio website preview',
    demo: 'https://www.aayampaudel.com.np/',
    github: 'https://github.com/aayampaudel200-sketch/Aayam-Paudel-Portfolio',
    githubOwner: 'aayampaudel200-sketch',
    githubRepo: 'Aayam-Paudel-Portfolio',
    details: {
      overview:
        'The portfolio brings together Aayam Paudel’s work, background, and contact information in a responsive website.',
      problem:
        'A portfolio should make projects easy to discover while staying fast, usable on mobile, and accessible without a frontend framework.',
      architecture:
        'Static multi-page site (HTML/CSS/vanilla JS) with shared modules for projects, search, theming, and an interactive canvas. Contact submissions route through a Vercel serverless function to Resend.',
      features: [
        'Interactive starfield canvas and 3D card tilt',
        'Site-wide search across pages and projects',
        'Light/dark theme with persistent preference',
        'Serverless contact form with spam honeypot',
        'Live GitHub profile and repository metrics',
      ],
      stack: ['HTML', 'CSS', 'JavaScript', 'Vercel Functions', 'Resend'],
      contribution:
        'Designed and built the portfolio, project browser, accessibility features, crawler-friendly metadata, and contact workflow.',
      learning:
        'Learned how a multi-page static site can combine progressive enhancement, responsive design, and a small serverless endpoint.',
    },
  },
  {
    id: 'python-portfolio-audit',
    title: 'Python Portfolio Audit Utility',
    category: 'experiments',
    categoryLabel: 'Python / Developer Tooling',
    status: 'Learning Project',
    statusKey: 'prototype',
    description: 'A standard-library command-line utility that checks crawler rules, sitemap URLs, and local page consistency for this portfolio.',
    tags: ['Python', 'unittest', 'XML', 'SEO'],
    image: '',
    imageAlt: '',
    demo: '',
    github: 'https://github.com/aayampaudel200-sketch/Aayam-Paudel-Portfolio',
    githubOwner: 'aayampaudel200-sketch',
    githubRepo: 'Aayam-Paudel-Portfolio',
    details: {
      overview: 'A small Python utility used to keep the site’s robots policy and sitemap aligned with the actual files in the repository.',
      problem: 'Search metadata can drift as pages change, leaving broken sitemap entries or crawler rules that are difficult to spot manually.',
      architecture: 'A Python standard-library command-line tool parses robots.txt and XML sitemap data, verifies local pages, and is covered by unittest cases.',
      features: ['Crawler policy validation', 'Sitemap host and path checks', 'Local page existence checks', 'Standard-library unit tests'],
      stack: ['Python', 'unittest', 'xml.etree.ElementTree'],
      contribution: 'Built and maintain the utility as part of the portfolio’s quality checks.',
      learning: 'Practiced writing focused command-line checks and testing edge cases without adding external dependencies.',
    },
  },
  {
    id: 'playground-experiments',
    title: 'Playground Experiments',
    category: 'experiments',
    categoryLabel: 'JavaScript / Interactive Experiments',
    status: 'Ongoing',
    statusKey: 'prototype',
    description: 'A browser-based lab for a sorting visualizer, editable typewriter effect, and Neon Tap Rush reaction game.',
    tags: ['JavaScript', 'CSS', 'Web Audio', 'Interaction Design'],
    image: '',
    imageAlt: '',
    demo: 'playground.html',
    github: 'https://github.com/aayampaudel200-sketch/Aayam-Paudel-Portfolio',
    githubOwner: 'aayampaudel200-sketch',
    githubRepo: 'Aayam-Paudel-Portfolio',
    details: {
      overview: 'A space to test small browser interactions without presenting them as client work or production applications.',
      problem: 'Learning interactions is easier when ideas can be built, tested, and refined in small, focused experiments.',
      architecture: 'A static HTML page with modular vanilla JavaScript, local score storage for the game, and responsive controls for touch and pointer devices.',
      features: ['Bubble-sort animation', 'Editable looping typewriter', 'Touch-friendly reaction game', 'Optional Web Audio feedback'],
      stack: ['HTML', 'CSS', 'JavaScript', 'Web Audio API'],
      contribution: 'Designed and implemented the experiments as part of an ongoing learning space.',
      learning: 'Practiced animation timing, accessible controls, local browser storage, and touch-friendly interaction design.',
    },
  },
];

window.__portfolioSearchEntries = PROJECTS.map((project) => ({
  title: project.title,
  text: [
    project.categoryLabel,
    project.status,
    project.description,
    ...project.tags,
    project.details.overview,
    project.details.problem,
    project.details.architecture,
    ...(project.details.features || []),
    ...(project.details.stack || []),
    project.details.contribution,
  ].join(' '),
  url: new URL(`projects.html#${encodeURIComponent(project.id)}`, window.location.href).href,
}));

const CATEGORY_FILTERS = {
  all: () => true,
  web: (p) => p.category === 'web',
  civic: (p) => p.category === 'civic',
  experiments: (p) => p.category === 'experiments',
};

const githubStatsCache = new Map();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRelativeTime(isoDate) {
  if (!isoDate) return 'Unavailable';
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return 'Unavailable';
  const seconds = Math.round((Date.now() - then) / 1000);
  const units = [
    { label: 'year', secs: 31536000 },
    { label: 'month', secs: 2592000 },
    { label: 'week', secs: 604800 },
    { label: 'day', secs: 86400 },
    { label: 'hour', secs: 3600 },
    { label: 'minute', secs: 60 },
  ];
  for (const unit of units) {
    const value = Math.floor(seconds / unit.secs);
    if (value >= 1) return `${value} ${unit.label}${value === 1 ? '' : 's'} ago`;
  }
  return 'just now';
}

async function fetchGitHubRepoStats(owner, repo) {
  const key = `${owner}/${repo}`;
  if (githubStatsCache.has(key)) return githubStatsCache.get(key);

  const cacheKey = `gh_repo_${key}`;
  const cacheTimeKey = `gh_repo_time_${key}`;
  const CACHE_MS = 15 * 60 * 1000;

  try {
    const cached = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    if (cached && cachedTime && Date.now() - Number(cachedTime) < CACHE_MS) {
      const parsed = JSON.parse(cached);
      githubStatsCache.set(key, parsed);
      return parsed;
    }
  } catch (_) {
    /* ignore storage errors */
  }

  const result = { stars: null, forks: null, pushedAt: null, ok: false };

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (res.ok) {
      const data = await res.json();
      result.stars = data.stargazers_count ?? 0;
      result.forks = data.forks_count ?? 0;
      result.pushedAt = data.pushed_at || data.updated_at || null;
      result.ok = true;
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
        localStorage.setItem(cacheTimeKey, String(Date.now()));
      } catch (_) {
        /* ignore */
      }
    }
  } catch (error) {
    console.warn(`Unable to fetch GitHub stats for ${key}:`, error);
  }

  githubStatsCache.set(key, result);
  return result;
}

function createProjectCard(project, isFiltered = false) {
  const card = document.createElement('article');
  card.className = isFiltered ? 'project-card reveal-up is-visible' : 'project-card reveal-up';
  card.id = project.id;
  card.dataset.category = project.category;
  card.dataset.tilt = '';
  card.dataset.tiltMax = '5';

  const demoBtn = project.demo
    ? `<a href="${escapeHtml(project.demo)}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">Live Demo</a>`
    : `<span class="btn btn-outline" aria-disabled="true">Demo coming soon</span>`;

  const githubBtn = project.github
    ? `<a href="${escapeHtml(project.github)}" class="btn btn-outline" target="_blank" rel="noopener noreferrer">GitHub</a>`
    : '';

  let mediaHtml = '';
  if (project.image) {
    mediaHtml = `
      <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.imageAlt)}" loading="lazy" class="project-img">
      <div class="project-media-placeholder" hidden aria-hidden="true">Screenshot coming soon</div>
    `;
  } else {
    mediaHtml = `<div class="project-media-placeholder">Screenshot coming soon</div>`;
  }

  const githubMeta = project.githubOwner && project.githubRepo
    ? `<div class="project-github-stats" data-gh-owner="${escapeHtml(project.githubOwner)}" data-gh-repo="${escapeHtml(project.githubRepo)}" aria-label="Live GitHub repository stats">
        <span class="gh-stat" title="Stars"><span class="gh-stat-icon" aria-hidden="true">★</span> <span class="gh-stars">…</span></span>
        <span class="gh-stat" title="Forks"><span class="gh-stat-icon" aria-hidden="true">⑂</span> <span class="gh-forks">…</span></span>
        <span class="gh-stat gh-stat--wide" title="Last commit"><span class="gh-pushed">…</span></span>
      </div>`
    : '';

  card.innerHTML = `
    <div class="project-media">
      ${mediaHtml}
      <span class="project-status" data-status="${escapeHtml(project.statusKey)}">${escapeHtml(project.status)}</span>
    </div>
    <div class="project-body">
      <p class="project-category">${escapeHtml(project.categoryLabel)}</p>
      <h3 class="project-title">${escapeHtml(project.title)}</h3>
      <p class="project-desc">${escapeHtml(project.description)}</p>
      <div class="project-tags">${project.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      ${githubMeta}
      <div class="project-actions">
        ${demoBtn}
        ${githubBtn}
        <button type="button" class="btn btn-outline details-btn" data-project-id="${escapeHtml(project.id)}" aria-label="View details for ${escapeHtml(project.title)}">Details</button>
        <span class="card-arrow" aria-hidden="true">→</span>
      </div>
    </div>
  `;

  const projectImage = card.querySelector('.project-img');
  const imagePlaceholder = card.querySelector('.project-media-placeholder');
  if (projectImage && imagePlaceholder) {
    projectImage.addEventListener('error', () => {
      projectImage.hidden = true;
      imagePlaceholder.hidden = false;
    }, { once: true });
  }

  card.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return;
    openProjectModal(project.id);
  });

  const detailsBtn = card.querySelector('.details-btn');
  if (detailsBtn) {
    detailsBtn.addEventListener('click', () => openProjectModal(project.id));
  }

  return card;
}

async function hydrateGitHubStats(root = document) {
  const nodes = root.querySelectorAll('[data-gh-owner][data-gh-repo]');
  await Promise.all([...nodes].map(async (node) => {
    const owner = node.dataset.ghOwner;
    const repo = node.dataset.ghRepo;
    if (!owner || !repo) return;
    const stats = await fetchGitHubRepoStats(owner, repo);
    const starsEl = node.querySelector('.gh-stars');
    const forksEl = node.querySelector('.gh-forks');
    const pushedEl = node.querySelector('.gh-pushed');
    if (starsEl) starsEl.textContent = stats.ok ? String(stats.stars) : '—';
    if (forksEl) forksEl.textContent = stats.ok ? String(stats.forks) : '—';
    if (pushedEl) {
      pushedEl.textContent = stats.ok
        ? `Updated ${formatRelativeTime(stats.pushedAt)}`
        : 'Stats unavailable';
    }
  }));
}

function renderFeaturedProjects() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const featured = PROJECTS.slice(0, 2);
  grid.innerHTML = '';
  featured.forEach((p) => grid.appendChild(createProjectCard(p, false)));
  hydrateGitHubStats(grid);
  if (typeof window.__initTiltCards === 'function') window.__initTiltCards(grid);
}

function renderAllProjects(filterKey = 'all', isUserFilter = false) {
  const grid = document.getElementById('allProjectsGrid');
  const emptyState = document.getElementById('emptyState');
  if (!grid) return;

  const filterFn = CATEGORY_FILTERS[filterKey] || CATEGORY_FILTERS.all;
  const filtered = PROJECTS.filter(filterFn);

  grid.innerHTML = '';
  filtered.forEach((p) => grid.appendChild(createProjectCard(p, isUserFilter)));

  if (emptyState) {
    emptyState.hidden = filtered.length !== 0;
  }

  hydrateGitHubStats(grid);
  if (typeof window.__initTiltCards === 'function') window.__initTiltCards(grid);
}

function initFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderAllProjects(btn.dataset.filter, true);
      if (typeof window.__observeReveals === 'function') {
        window.__observeReveals();
      }
    });
  });
}

let lastFocusedElement = null;
let activeModalTab = 'problem';
let previousBodyOverflow = '';

function buildArchitectureDiagram(project) {
  const layers = project.details.stack || project.tags;
  return `
    <div class="arch-diagram" role="img" aria-label="Architecture diagram for ${escapeHtml(project.title)}">
      <div class="arch-layer arch-layer--client">
        <span class="arch-layer-label">Client</span>
        <strong>Browser UI</strong>
        <p>Responsive pages, interactions, and presentation layer</p>
      </div>
      <div class="arch-connector" aria-hidden="true">↓</div>
      <div class="arch-layer arch-layer--app">
        <span class="arch-layer-label">Application</span>
        <strong>${escapeHtml(project.title.split('—')[0].trim())}</strong>
        <p>${escapeHtml(project.details.architecture.slice(0, 140))}${project.details.architecture.length > 140 ? '…' : ''}</p>
      </div>
      <div class="arch-connector" aria-hidden="true">↓</div>
      <div class="arch-layer arch-layer--stack">
        <span class="arch-layer-label">Stack</span>
        <div class="arch-stack-tags">
          ${layers.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function buildModalTabPanels(project) {
  const d = project.details || {};
  const features = Array.isArray(d.features) ? d.features : [];
  const stack = Array.isArray(d.stack) ? d.stack : (d.stack ? [d.stack] : project.tags);

  return {
    problem: `
      <div class="modal-tab-panel" data-tab-panel="problem" role="tabpanel">
        <h4>Problem</h4>
        <p>${escapeHtml(d.problem || 'No problem statement available.')}</p>
        ${d.overview ? `<h4 class="modal-subhead">Overview</h4><p>${escapeHtml(d.overview)}</p>` : ''}
      </div>
    `,
    architecture: `
      <div class="modal-tab-panel" data-tab-panel="architecture" role="tabpanel" hidden>
        <h4>Architecture</h4>
        <p>${escapeHtml(d.architecture || '')}</p>
        ${buildArchitectureDiagram(project)}
      </div>
    `,
    technologies: `
      <div class="modal-tab-panel" data-tab-panel="technologies" role="tabpanel" hidden>
        <h4>Technologies Used</h4>
        <div class="modal-tech-list">
          ${stack.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join('')}
        </div>
        ${d.contribution ? `<h4 class="modal-subhead">Contribution</h4><p>${escapeHtml(d.contribution)}</p>` : ''}
      </div>
    `,
    features: `
      <div class="modal-tab-panel" data-tab-panel="features" role="tabpanel" hidden>
        <h4>Key Features</h4>
        <ul class="modal-feature-list">
          ${features.map((item) => `<li>${escapeHtml(item)}</li>`).join('') || '<li>Feature details coming soon.</li>'}
        </ul>
        ${d.learning ? `<h4 class="modal-subhead">What I Learned</h4><p>${escapeHtml(d.learning)}</p>` : ''}
      </div>
    `,
    links: `
      <div class="modal-tab-panel" data-tab-panel="links" role="tabpanel" hidden>
        <h4>Live Demo &amp; GitHub</h4>
        <div class="modal-link-cards">
          ${project.demo
            ? `<a class="modal-link-card" href="${escapeHtml(project.demo)}" target="_blank" rel="noopener noreferrer">
                <span class="modal-link-kicker">Live Demo</span>
                <strong>Open the deployed project</strong>
                <span aria-hidden="true">↗</span>
              </a>`
            : `<div class="modal-link-card modal-link-card--disabled"><span class="modal-link-kicker">Live Demo</span><strong>Demo not available yet</strong></div>`}
          ${project.github
            ? `<a class="modal-link-card" href="${escapeHtml(project.github)}" target="_blank" rel="noopener noreferrer">
                <span class="modal-link-kicker">GitHub</span>
                <strong>View source repository</strong>
                <span aria-hidden="true">↗</span>
              </a>`
            : `<div class="modal-link-card modal-link-card--disabled"><span class="modal-link-kicker">GitHub</span><strong>Repository not public yet</strong></div>`}
        </div>
        <div class="project-github-stats modal-github-stats" ${project.githubOwner && project.githubRepo
          ? `data-gh-owner="${escapeHtml(project.githubOwner)}" data-gh-repo="${escapeHtml(project.githubRepo)}"`
          : ''}>
          <span class="gh-stat"><span class="gh-stat-icon" aria-hidden="true">★</span> <span class="gh-stars">…</span> stars</span>
          <span class="gh-stat"><span class="gh-stat-icon" aria-hidden="true">⑂</span> <span class="gh-forks">…</span> forks</span>
          <span class="gh-stat gh-stat--wide"><span class="gh-pushed">…</span></span>
        </div>
      </div>
    `,
  };
}

function setActiveModalTab(tabId) {
  activeModalTab = tabId;
  const modal = document.getElementById('projectModal');
  if (!modal) return;

  modal.querySelectorAll('.modal-tab').forEach((tab) => {
    const isActive = tab.dataset.tab === tabId;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  modal.querySelectorAll('[data-tab-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.tabPanel !== tabId;
  });
}

function openProjectModal(projectId) {
  const project = PROJECTS.find((p) => p.id === projectId);
  const modal = document.getElementById('projectModal');
  const body = document.getElementById('modalBody');
  if (!project || !modal || !body) return;

  lastFocusedElement = document.activeElement;
  previousBodyOverflow = document.body.style.overflow;
  const panels = buildModalTabPanels(project);

  body.innerHTML = `
    <p class="modal-category">${escapeHtml(project.categoryLabel)}</p>
    <h2 id="modalTitle">${escapeHtml(project.title)}</h2>
    <p class="modal-lede">${escapeHtml(project.description)}</p>

    <div class="modal-tabs" role="tablist" aria-label="Project detail sections">
      <button type="button" class="modal-tab active" role="tab" data-tab="problem" aria-selected="true">Problem</button>
      <button type="button" class="modal-tab" role="tab" data-tab="architecture" aria-selected="false" tabindex="-1">Architecture</button>
      <button type="button" class="modal-tab" role="tab" data-tab="technologies" aria-selected="false" tabindex="-1">Technologies</button>
      <button type="button" class="modal-tab" role="tab" data-tab="features" aria-selected="false" tabindex="-1">Key Features</button>
      <button type="button" class="modal-tab" role="tab" data-tab="links" aria-selected="false" tabindex="-1">Demo / GitHub</button>
    </div>

    <div class="modal-tab-panels">
      ${panels.problem}
      ${panels.architecture}
      ${panels.technologies}
      ${panels.features}
      ${panels.links}
    </div>

    <div class="modal-actions">
      ${project.demo ? `<a href="${escapeHtml(project.demo)}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">Live Demo</a>` : ''}
      ${project.github ? `<a href="${escapeHtml(project.github)}" class="btn btn-outline" target="_blank" rel="noopener noreferrer">GitHub Repository</a>` : ''}
    </div>
  `;

  body.querySelectorAll('.modal-tab').forEach((tab) => {
    tab.addEventListener('click', () => setActiveModalTab(tab.dataset.tab));
  });

  setActiveModalTab('problem');
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  hydrateGitHubStats(body);

  const closeBtn = document.getElementById('modalClose');
  if (closeBtn) closeBtn.focus();
  else modal.querySelector('.modal')?.focus();
}

function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = previousBodyOverflow;
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

window.__closeProjectModal = closeProjectModal;

function trapModalFocus(e) {
  const modal = document.getElementById('projectModal');
  if (!modal || modal.hidden) return;

  if (e.key === 'Escape') {
    closeProjectModal();
    return;
  }

  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const tabs = [...modal.querySelectorAll('.modal-tab')];
    const currentIndex = tabs.findIndex((tab) => tab.dataset.tab === activeModalTab);
    if (currentIndex >= 0) {
      const nextIndex = e.key === 'ArrowRight'
        ? (currentIndex + 1) % tabs.length
        : (currentIndex - 1 + tabs.length) % tabs.length;
      setActiveModalTab(tabs[nextIndex].dataset.tab);
      tabs[nextIndex].focus();
      e.preventDefault();
      return;
    }
  }

  if (e.key !== 'Tab') return;

  const focusable = modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function initModal() {
  const modal = document.getElementById('projectModal');
  if (!modal) return;

  const closeBtn = document.getElementById('modalClose');
  if (closeBtn) closeBtn.addEventListener('click', closeProjectModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeProjectModal();
  });

  document.addEventListener('keydown', (e) => {
    if (modal && !modal.hidden) trapModalFocus(e);
  });
}

function openHashProject() {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return;
  if (PROJECTS.some((project) => project.id === hash)) {
    openProjectModal(hash);
  }
}

function initProjectsModule() {
  renderFeaturedProjects();
  renderAllProjects('all', false);
  initFilters();
  initModal();
  openHashProject();

  if (typeof window.__observeReveals === 'function') {
    window.__observeReveals();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectsModule);
} else {
  initProjectsModule();
}
