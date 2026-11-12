/* Unified portfolio search and Gemini assistant. No credentials are stored in the browser. */
(() => {
  const page = window.location.pathname.toLowerCase();
  const isBusinessPage = page.endsWith('/namaste-suman.html') || page === '/namaste-suman.html';
  const chips = isBusinessPage
    ? ['What services do you offer?', 'Where is the shop located?', 'Book or contact now']
    : ['Why hire Aayam?', 'Show his projects', 'Open Game Playground'];

  const actionRoutes = {
    OPEN_HOME: '/index.html',
    OPEN_ABOUT: '/about.html',
    OPEN_PROJECTS: '/projects.html',
    OPEN_EXPERIENCE: '/experience.html',
    OPEN_BUSINESS: '/namaste-suman.html',
    OPEN_PLAYGROUND: '/playground.html',
  };

  const style = document.createElement('style');
  style.textContent = `
    .aayam-ai-trigger{position:fixed;right:max(1rem,env(safe-area-inset-right));bottom:max(1rem,env(safe-area-inset-bottom));z-index:1100;display:inline-flex;align-items:center;gap:.55rem;border:1px solid rgba(125,211,252,.75);border-radius:999px;padding:.8rem 1.1rem;background:linear-gradient(135deg,#0284c7,#4f46e5);box-shadow:0 12px 34px rgba(2,132,199,.38),0 0 0 5px rgba(56,189,248,.12);color:#fff;font:700 .9rem/1 Inter,system-ui,sans-serif;cursor:pointer;transition:transform .2s,box-shadow .2s;animation:aayam-ai-pulse 2.6s ease-in-out infinite}.aayam-ai-trigger:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(2,132,199,.48),0 0 0 7px rgba(56,189,248,.16)}.aayam-ai-trigger:focus-visible,.aayam-ai-close:focus-visible,.aayam-ai-chip:focus-visible,.aayam-ai-send:focus-visible{outline:3px solid #7dd3fc;outline-offset:3px}@keyframes aayam-ai-pulse{50%{box-shadow:0 12px 34px rgba(2,132,199,.38),0 0 0 9px rgba(56,189,248,.04)}}.aayam-ai-drawer[hidden]{display:none}.aayam-ai-drawer{position:fixed;inset:0;z-index:1200;background:rgba(2,6,23,.64);display:flex;justify-content:flex-end}.aayam-ai-panel{display:flex;flex-direction:column;width:min(440px,100%);height:100%;background:#0b1220;color:#e5eefb;border-left:1px solid rgba(125,211,252,.3);box-shadow:-18px 0 50px rgba(0,0,0,.36)}.aayam-ai-header{display:flex;align-items:center;justify-content:space-between;padding:1.15rem 1.2rem;border-bottom:1px solid rgba(148,163,184,.18);background:linear-gradient(120deg,rgba(14,165,233,.16),rgba(99,102,241,.12))}.aayam-ai-title{margin:0;font-size:1.05rem}.aayam-ai-subtitle{margin:.2rem 0 0;color:#9fb2cc;font-size:.78rem}.aayam-ai-close{border:0;border-radius:.55rem;padding:.35rem .55rem;background:rgba(148,163,184,.14);color:#e5eefb;font-size:1.35rem;line-height:1;cursor:pointer}.aayam-ai-messages{flex:1;overflow:auto;padding:1rem 1rem .5rem;display:flex;flex-direction:column;gap:.75rem}.aayam-ai-message{max-width:88%;padding:.72rem .85rem;border-radius:.85rem;font:400 .9rem/1.5 Inter,system-ui,sans-serif;white-space:pre-wrap}.aayam-ai-message--assistant{align-self:flex-start;background:rgba(30,41,59,.82);border:1px solid rgba(148,163,184,.18)}.aayam-ai-message--user{align-self:flex-end;background:linear-gradient(135deg,#0369a1,#4338ca);color:#fff}.aayam-ai-quick{padding:.65rem 1rem;border-top:1px solid rgba(148,163,184,.15)}.aayam-ai-quick-label{display:block;margin-bottom:.45rem;color:#9fb2cc;font-size:.73rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase}.aayam-ai-chips{display:flex;flex-wrap:wrap;gap:.45rem}.aayam-ai-chip{border:1px solid rgba(56,189,248,.36);border-radius:999px;padding:.42rem .65rem;background:rgba(14,165,233,.09);color:#bde9ff;font:600 .76rem/1.2 Inter,system-ui,sans-serif;cursor:pointer}.aayam-ai-composer{display:flex;gap:.55rem;padding:1rem;border-top:1px solid rgba(148,163,184,.18);background:#0a101c}.aayam-ai-input{min-width:0;flex:1;border:1px solid rgba(148,163,184,.28);border-radius:.7rem;padding:.72rem .8rem;background:#111c2e;color:#f8fafc;font:400 .9rem Inter,system-ui,sans-serif}.aayam-ai-input::placeholder{color:#94a3b8}.aayam-ai-send{border:0;border-radius:.7rem;padding:.7rem .9rem;background:#38bdf8;color:#082f49;font-weight:800;cursor:pointer}.aayam-ai-send:disabled{opacity:.6;cursor:wait}.aayam-ai-contact-highlight{outline:3px solid #38bdf8!important;outline-offset:6px;border-radius:.5rem;transition:outline-color .3s}@media(max-width:520px){.aayam-ai-panel{width:100%;border-left:0}.aayam-ai-trigger{padding:.72rem .9rem;font-size:.82rem}}@media(prefers-reduced-motion:reduce){.aayam-ai-trigger{animation:none;transition:none}.aayam-ai-trigger:hover{transform:none}}
  `;
  document.head.appendChild(style);

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'aayam-ai-trigger';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', 'aayamAiDrawer');
  trigger.innerHTML = '<span aria-hidden="true">✨</span> Ask Aayam AI';

  const drawer = document.createElement('div');
  drawer.id = 'aayamAiDrawer';
  drawer.className = 'aayam-ai-drawer';
  drawer.hidden = true;
  drawer.innerHTML = `
    <section class="aayam-ai-panel" role="dialog" aria-modal="true" aria-labelledby="aayamAiTitle">
      <header class="aayam-ai-header"><div><h2 class="aayam-ai-title" id="aayamAiTitle">Ask Aayam AI ✨</h2><p class="aayam-ai-subtitle">Portfolio guide and smart search</p></div><button class="aayam-ai-close" type="button" aria-label="Close assistant">×</button></header>
      <div class="aayam-ai-messages" aria-live="polite"><div class="aayam-ai-message aayam-ai-message--assistant">Hi! Ask about Aayam’s projects, web development work, or Namaste Suman Communication.</div></div>
      <div class="aayam-ai-quick"><span class="aayam-ai-quick-label">Try asking</span><div class="aayam-ai-chips"></div></div>
      <form class="aayam-ai-composer"><label class="visually-hidden" for="aayamAiInput">Ask Aayam AI</label><input class="aayam-ai-input" id="aayamAiInput" maxlength="800" autocomplete="off" placeholder="Search site or ask AI…"><button class="aayam-ai-send" type="submit">Send</button></form>
    </section>`;
  document.body.append(trigger, drawer);

  const panel = drawer.querySelector('.aayam-ai-panel');
  const closeButton = drawer.querySelector('.aayam-ai-close');
  const messageList = drawer.querySelector('.aayam-ai-messages');
  const form = drawer.querySelector('.aayam-ai-composer');
  const input = drawer.querySelector('.aayam-ai-input');
  const sendButton = drawer.querySelector('.aayam-ai-send');
  const chipList = drawer.querySelector('.aayam-ai-chips');
  let lastFocus = null;

  chips.forEach((label) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'aayam-ai-chip';
    chip.textContent = label;
    chip.addEventListener('click', () => submitQuestion(label));
    chipList.appendChild(chip);
  });

  function addMessage(text, role) {
    const message = document.createElement('div');
    message.className = `aayam-ai-message aayam-ai-message--${role}`;
    message.textContent = text;
    messageList.appendChild(message);
    messageList.scrollTop = messageList.scrollHeight;
    return message;
  }

  function openAssistant(query = '') {
    if (drawer.hidden) lastFocus = document.activeElement;
    drawer.hidden = false;
    document.body.style.overflow = 'hidden';
    input.value = query;
    window.setTimeout(() => input.focus(), 0);
  }

  function closeAssistant() {
    drawer.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  }

  function navigate(path) {
    if (window.location.pathname === path) return;
    window.location.assign(path);
  }

  function highlightContact() {
    const target = document.querySelector('#contact, .contact-cta, .ns-map-cta, .ns-info-grid');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('aayam-ai-contact-highlight');
      window.setTimeout(() => target.classList.remove('aayam-ai-contact-highlight'), 2600);
    }
  }

  function executeAction(action) {
    if (!action) return;
    if (actionRoutes[action]) return navigate(actionRoutes[action]);
    if (action === 'OPEN_GITHUB') return window.open('https://github.com/aayampaudel200-sketch', '_blank', 'noopener,noreferrer');
    if (action === 'SCROLL_CONTACT') {
      if (document.querySelector('#contact')) return highlightContact();
      return navigate('/index.html#contact');
    }
    if (action === 'SCROLL_SERVICES') {
      if (isBusinessPage) {
        const target = document.querySelector('#visa-documentation, #visas, #civic-docs');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      return navigate('/namaste-suman.html#visa-documentation');
    }
    if (action === 'COPY_PHONE_OR_EMAIL') highlightContact();
  }

  async function submitQuestion(question = input.value) {
    const message = String(question || '').trim();
    if (!message || sendButton.disabled) return;
    openAssistant();
    input.value = '';
    addMessage(message, 'user');
    sendButton.disabled = true;
    const pending = addMessage('Thinking…', 'assistant');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, page: window.location.pathname }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'The assistant is unavailable.');
      pending.textContent = data.reply;
      window.setTimeout(() => executeAction(data.action), 250);
    } catch (error) {
      pending.textContent = error instanceof Error ? error.message : 'The assistant is unavailable right now.';
    } finally {
      sendButton.disabled = false;
      input.focus();
    }
  }

  trigger.addEventListener('click', () => openAssistant());
  closeButton.addEventListener('click', closeAssistant);
  drawer.addEventListener('click', (event) => { if (event.target === drawer) closeAssistant(); });
  form.addEventListener('submit', (event) => { event.preventDefault(); submitQuestion(); });

  document.addEventListener('submit', (event) => {
    const searchForm = event.target instanceof HTMLFormElement ? event.target.closest('.site-search') : null;
    if (!searchForm) return;
    const searchInput = searchForm.querySelector('input[type="search"], input[name="q"]');
    const query = searchInput?.value.trim();
    if (!query) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openAssistant(query);
    submitQuestion(query);
  }, true);

  document.addEventListener('keydown', (event) => {
    const typing = event.target instanceof HTMLElement && (event.target.matches('input, textarea, select') || event.target.isContentEditable);
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openAssistant();
    } else if (event.key === '/' && !typing && drawer.hidden) {
      event.preventDefault();
      openAssistant();
    } else if (event.key === 'Escape' && !drawer.hidden) {
      closeAssistant();
    } else if (event.key === 'Tab' && !drawer.hidden) {
      const focusable = [...panel.querySelectorAll('button:not([disabled]), input:not([disabled])')];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
})();
