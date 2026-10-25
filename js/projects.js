/**
 * Shared project data + rendering + filtering + modal logic.
 * Both index.html and projects.html consume this file.
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
    image: 'assets/images/project-haat-bazzar.jpg',
    demo: 'https://haat-bazzar-15hju1vsp-aayampaudel200-9685.vercel.app/',
    github: 'https://github.com/aayampaudel200-sketch/Haat-Bazzar',
    details: {
      overview:
        'Haat Bazzar is a marketplace concept built around a simple idea: farmers should be able to reach customers directly and keep more of the value they create.',
      problem:
        'Local farmers often depend on multiple intermediaries to reach buyers. This can reduce their margins and make pricing less transparent.',
      users:
        'Small and mid-sized farmers, local customers, and community buyers looking for fresher produce with clearer provenance.',
      solution:
        'A lightweight web marketplace where farmers can list produce and customers can browse and connect. The project explores a direct farm-to-consumer flow.',
      stack: 'HTML, CSS, JavaScript, deployed on Vercel.',
      contribution:
        'Designed and built the front-end experience, structured the listing and browsing flow, and deployed the live application.',
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
    image: 'assets/images/project-municipal.jpg',
    demo: '',
    github: '',
    details: {
      overview:
        'This prototype was created in a time-boxed hackathon context to explore how a municipal recommendation process could be digitized.',
      problem:
        'Paper-based municipal workflows can be slow for citizens and difficult to track for administrators.',
      users:
        'Citizens requesting recommendations and municipal staff handling verification and issuance.',
      solution:
        'A prototype interface that models the key steps of a recommendation request: application, document upload, review, and status tracking.',
      stack: 'HTML, CSS, JavaScript. Prototype only — not deployed or officially adopted.',
      contribution:
        'Contributed to the prototype concept, interface design, and front-end implementation within the hackathon timeframe.',
    },
  },
  // Add future projects here following the same shape.
];

const CATEGORY_FILTERS = {
  all: () => true,
  web: (p) => p.category === 'web',
  civic: (p) => p.category === 'civic',
  experiments: (p) => p.category === 'experiments',
};

/* ---------- Card rendering ---------- */

function createProjectCard(project, isFiltered = false) {
  const card = document.createElement('article');
  card.className = isFiltered ? 'project-card reveal-up is-visible' : 'project-card reveal-up';
  card.dataset.category = project.category;

  const demoBtn = project.demo
    ? `<a href="${project.demo}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">Live Demo</a>`
    : `<span class="btn btn-outline" aria-disabled="true">Demo coming soon</span>`;

  const githubBtn = project.github
    ? `<a href="${project.github}" class="btn btn-outline" target="_blank" rel="noopener noreferrer">GitHub</a>`
    : '';

  // Safe image rendering: preserve status badge and handle image error gracefully
  let mediaHtml = '';
  if (project.image) {
    mediaHtml = `
      <img src="${project.image}" alt="${project.title} screenshot" loading="lazy" class="project-img"
        onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">
      <div class="project-media-placeholder" style="display:none;" aria-hidden="true">Screenshot coming soon</div>
    `;
  } else {
    mediaHtml = `<div class="project-media-placeholder">Screenshot coming soon</div>`;
  }

  card.innerHTML = `
    <div class="project-media">
      ${mediaHtml}
      <span class="project-status" data-status="${project.statusKey}">${project.status}</span>
    </div>
    <div class="project-body">
      <p class="project-category">${project.categoryLabel}</p>
      <h3 class="project-title">${project.title}</h3>
      <p class="project-desc">${project.description}</p>
      <div class="project-tags">${project.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
      <div class="project-actions">
        ${demoBtn}
        ${githubBtn}
        <button type="button" class="btn btn-outline details-btn" data-project-id="${project.id}" aria-label="View details for ${project.title}">Details</button>
        <span class="card-arrow" aria-hidden="true">→</span>
      </div>
    </div>
  `;

  // Whole-card click (except links/buttons) opens details
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

function renderFeaturedProjects() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const featured = PROJECTS.slice(0, 2);
  grid.innerHTML = '';
  featured.forEach((p) => grid.appendChild(createProjectCard(p, false)));
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
}

/* ---------- Filtering ---------- */

function initFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderAllProjects(btn.dataset.filter, true);
      // Re-observe newly rendered cards
      if (typeof window.__observeReveals === 'function') {
        window.__observeReveals();
      }
    });
  });
}

/* ---------- Modal Logic ---------- */

let lastFocusedElement = null;

function openProjectModal(projectId) {
  const project = PROJECTS.find((p) => p.id === projectId);
  const modal = document.getElementById('projectModal');
  const body = document.getElementById('modalBody');
  if (!project || !modal || !body) return;

  lastFocusedElement = document.activeElement;

  const d = project.details || {};
  body.innerHTML = `
    <p class="modal-category">${project.categoryLabel}</p>
    <h2 id="modalTitle">${project.title}</h2>
    <p style="color:var(--text-muted);margin-bottom:var(--space-md);">${project.description}</p>

    ${d.overview ? `<div class="modal-section"><h4>Overview</h4><p>${d.overview}</p></div>` : ''}
    ${d.problem ? `<div class="modal-section"><h4>Problem</h4><p>${d.problem}</p></div>` : ''}
    ${d.users ? `<div class="modal-section"><h4>Intended users</h4><p>${d.users}</p></div>` : ''}
    ${d.solution ? `<div class="modal-section"><h4>Solution approach</h4><p>${d.solution}</p></div>` : ''}
    ${d.stack ? `<div class="modal-section"><h4>Technology stack</h4><p>${d.stack}</p></div>` : ''}
    ${d.contribution ? `<div class="modal-section"><h4>My contribution</h4><p>${d.contribution}</p></div>` : ''}

    <div class="modal-actions">
      ${project.demo ? `<a href="${project.demo}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">Live Demo</a>` : ''}
      ${project.github ? `<a href="${project.github}" class="btn btn-outline" target="_blank" rel="noopener noreferrer">GitHub Repository</a>` : ''}
    </div>
  `;

  modal.hidden = false;
  document.body.style.overflow = 'hidden';

  // Set focus to the modal dialog or close button
  const closeBtn = document.getElementById('modalClose');
  if (closeBtn) {
    closeBtn.focus();
  } else {
    const modalEl = modal.querySelector('.modal');
    if (modalEl) modalEl.focus();
  }
}

function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

function trapModalFocus(e) {
  const modal = document.getElementById('projectModal');
  if (!modal || modal.hidden) return;

  if (e.key === 'Escape') {
    closeProjectModal();
    return;
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
  if (closeBtn) {
    closeBtn.addEventListener('click', closeProjectModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeProjectModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (modal && !modal.hidden) {
      trapModalFocus(e);
    }
  });
}

/* ---------- Initialise ---------- */

function initProjectsModule() {
  renderFeaturedProjects();
  renderAllProjects('all', false);
  initFilters();
  initModal();

  // Re-observe reveal elements after dynamic render
  if (typeof window.__observeReveals === 'function') {
    window.__observeReveals();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectsModule);
} else {
  initProjectsModule();
}
