/* Unified bilingual (English + Nepali) portfolio search, voice agent, and Gemini assistant. */
(() => {
  const page = window.location.pathname.toLowerCase();
  const isBusinessPage = page.endsWith('/namaste-suman.html') || page === '/namaste-suman.html';
  const assistantName = isBusinessPage ? 'Namaste AI' : 'Aayam AI';

  const copy = {
    en: {
      subtitle: isBusinessPage ? 'Namaste Suman Communication voice & text guide' : 'Voice & text portfolio assistant',
      greeting: isBusinessPage
        ? 'Namaste! I’m Namaste AI. Ask in English or Nepali by voice or text about documentation, visa support, printing, photography, or send a message.'
        : 'Hi! Ask in English or Nepali by voice or text about Aayam’s projects, skills, Namaste Suman Communication, open any page, or send him an email.',
      chips: isBusinessPage
        ? ['What services do you offer?', 'नेपालीमा सेवाहरू बताउनुहोस्', 'Send a message']
        : ['Why hire Aayam?', 'आयामका प्रोजेक्टहरू देखाऊ', 'Send email to Aayam'],
      placeholder: 'Ask in English or नेपाली…',
      quickLabel: 'Try asking',
      send: 'Send',
      listening: 'Listening… speak now',
      speaking: 'Speaking response…',
      stopSpeaking: 'Stop speaking',
      thinking: 'Thinking…',
      micBlocked: 'Microphone unavailable — text assistant is active.',
      noSpeech: 'No speech detected. Tap mic to retry or type below.',
    },
    ne: {
      subtitle: isBusinessPage ? 'नमस्ते सुमन कम्युनिकेसन आवाज र टेक्स्ट सहायक' : 'आवाज र टेक्स्ट पोर्टफोलियो सहायक',
      greeting: isBusinessPage
        ? 'नमस्ते! म नमस्ते एआई हुँ। तपाईं नेपाली वा अंग्रेजीमा बोलेर वा लेखेर कागजात, भिसा सहयोग, प्रिन्टिङ, फोटोग्राफीबारे सोध्न वा सन्देश पठाउन सक्नुहुन्छ।'
        : 'नमस्ते! म आयाम एआई हुँ। तपाईं नेपाली वा अंग्रेजीमा बोलेर वा लेखेर आयामका प्रोजेक्ट, सीप, नमस्ते सुमन कम्युनिकेसनबारे सोध्न, कुनै पेज खोल्न वा इमेल पठाउन सक्नुहुन्छ।',
      chips: isBusinessPage
        ? ['कस्ता सेवाहरू उपलब्ध छन्?', 'पसल कहाँ छ?', 'सन्देश पठाउनुहोस्']
        : ['आयाम को हुन्?', 'प्रोजेक्ट पेज खोल', 'आयामलाई इमेल पठाउ'],
      placeholder: 'नेपाली वा English मा सोध्नुहोस्…',
      quickLabel: 'सोधेर हेर्नुहोस्',
      send: 'पठाउनुहोस्',
      listening: 'सुन्दैछु… अब बोल्नुहोस्',
      speaking: 'जवाफ सुनाउँदैछु…',
      stopSpeaking: 'रोक्नुहोस्',
      thinking: 'सोच्दैछु…',
      micBlocked: 'माइक्रोफोन उपलब्ध छैन — लेखेर सोध्न सक्नुहुन्छ।',
      noSpeech: 'आवाज सुनिएन। फेरि माइक थिच्नुहोस् वा लेख्नुहोस्।',
    },
  };

  const actionRoutes = {
    OPEN_HOME: '/index.html',
    OPEN_ABOUT: '/about.html',
    OPEN_PROJECTS: '/projects.html',
    OPEN_EXPERIENCE: '/experience.html',
    OPEN_BUSINESS: '/namaste-suman.html',
    OPEN_PLAYGROUND: '/playground.html',
    OPEN_STUDIO: '/studio.html',
  };

  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const speechSynth = 'speechSynthesis' in window ? window.speechSynthesis : null;

  const TTS_PREF_KEY = 'aayam-ai-voice-reply';
  const LANG_PREF_KEY = 'aayam-ai-lang';

  let voiceRepliesEnabled = true;
  let preferredLang = 'en';
  try {
    if (localStorage.getItem(TTS_PREF_KEY) === 'false') voiceRepliesEnabled = false;
    if (localStorage.getItem(LANG_PREF_KEY) === 'ne') preferredLang = 'ne';
  } catch (_) {}

  let recognition = null;
  let isListening = false;
  let micAvailable = Boolean(SpeechRecognitionAPI);
  let lastInputWasVoice = false;
  let activeEmailDraft = null;
  let cachedVoices = [];

  function refreshVoices() {
    if (!speechSynth || !speechSynth.getVoices) return;
    const list = speechSynth.getVoices();
    if (list && list.length) cachedVoices = list;
  }
  refreshVoices();
  if (speechSynth && 'onvoiceschanged' in speechSynth) {
    speechSynth.onvoiceschanged = refreshVoices;
  }

  function detectNepaliText(text) {
    const raw = String(text || '');
    if (/[\u0900-\u097F]/.test(raw)) return true;
    const q = raw.toLowerCase();
    return /\b(namaste|kasto|kaha|kata|khola|kholnus|dekhau|dekhaunus|pathau|pathaunus|bhana|bhannus|timi|tapai|mero|aayamko|samparka|griha|anubhav|khel|parichay|ke ho|ko ho|kati|kasari)\b/.test(q);
  }

  const style = document.createElement('style');
  style.textContent = `
    .aayam-ai-trigger{position:fixed;right:max(1rem,env(safe-area-inset-right));bottom:max(1rem,env(safe-area-inset-bottom));z-index:1100;display:inline-flex;align-items:center;gap:.55rem;border:1px solid rgba(125,211,252,.75);border-radius:999px;padding:.8rem 1.1rem;background:linear-gradient(135deg,#0284c7,#4f46e5);box-shadow:0 12px 34px rgba(2,132,199,.38),0 0 0 5px rgba(56,189,248,.12);color:#fff;font:700 .9rem/1 Inter,system-ui,sans-serif;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;transition:box-shadow .2s,opacity .15s;animation:aayam-ai-pulse 2.6s ease-in-out infinite}
    .aayam-ai-trigger:active{cursor:grabbing}
    .aayam-ai-trigger.is-dragging{animation:none;opacity:.9;box-shadow:0 20px 48px rgba(2,132,199,.55),0 0 0 7px rgba(56,189,248,.22);transition:none}
    .aayam-ai-trigger:hover:not(.is-dragging){box-shadow:0 16px 40px rgba(2,132,199,.48),0 0 0 7px rgba(56,189,248,.16)}
    .aayam-ai-trigger:focus-visible,.aayam-ai-close:focus-visible,.aayam-ai-chip:focus-visible,.aayam-ai-send:focus-visible,.aayam-ai-mic:focus-visible,.aayam-ai-tts-toggle:focus-visible,.aayam-ai-lang-toggle:focus-visible{outline:3px solid #7dd3fc;outline-offset:3px}
    @keyframes aayam-ai-pulse{50%{box-shadow:0 12px 34px rgba(2,132,199,.38),0 0 0 9px rgba(56,189,248,.04)}}
    @keyframes aayam-ai-mic-pulse{0%,100%{box-shadow:0 0 0 0 rgba(244,63,94,.55)}50%{box-shadow:0 0 0 8px rgba(244,63,94,0)}}
    .aayam-ai-drawer[hidden]{display:none}
    .aayam-ai-drawer{position:fixed;inset:0;z-index:1200;background:rgba(2,6,23,.64);display:flex;justify-content:flex-end}
    .aayam-ai-panel{display:flex;flex-direction:column;width:min(440px,100%);height:100%;background:#0b1220;color:#e5eefb;border-left:1px solid rgba(125,211,252,.3);box-shadow:-18px 0 50px rgba(0,0,0,.36)}
    .aayam-ai-header{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:1rem 1.05rem;border-bottom:1px solid rgba(148,163,184,.18);background:linear-gradient(120deg,rgba(14,165,233,.16),rgba(99,102,241,.12))}
    .aayam-ai-title{margin:0;font-size:1.02rem}
    .aayam-ai-subtitle{margin:.2rem 0 0;color:#9fb2cc;font-size:.76rem}
    .aayam-ai-header-actions{display:flex;align-items:center;gap:.38rem;flex-shrink:0}
    .aayam-ai-lang-toggle,.aayam-ai-tts-toggle{border:1px solid rgba(125,211,252,.35);border-radius:.55rem;padding:.38rem .55rem;background:rgba(14,165,233,.14);color:#bde9ff;font:700 .74rem/1 Inter,system-ui,sans-serif;cursor:pointer;white-space:nowrap}
    .aayam-ai-lang-toggle[data-lang="ne"]{background:rgba(16,185,129,.18);border-color:rgba(52,211,153,.45);color:#a7f3d0}
    .aayam-ai-tts-toggle[aria-pressed="false"]{background:rgba(148,163,184,.12);border-color:rgba(148,163,184,.25);color:#94a3b8}
    .aayam-ai-close{border:0;border-radius:.55rem;padding:.32rem .52rem;background:rgba(148,163,184,.14);color:#e5eefb;font-size:1.3rem;line-height:1;cursor:pointer}
    .aayam-ai-voice-bar{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.48rem 1rem;background:rgba(15,23,42,.92);border-bottom:1px solid rgba(148,163,184,.14);font-size:.76rem;color:#9fb2cc}
    .aayam-ai-voice-bar[hidden]{display:none}
    .aayam-ai-stop-speech{border:1px solid rgba(125,211,252,.35);border-radius:999px;padding:.22rem .58rem;background:rgba(56,189,248,.14);color:#bae6fd;font:600 .72rem/1.1 Inter,system-ui,sans-serif;cursor:pointer}
    .aayam-ai-stop-speech[hidden]{display:none}
    .aayam-ai-messages{flex:1;overflow:auto;padding:1rem 1rem .5rem;display:flex;flex-direction:column;gap:.75rem}
    .aayam-ai-message{max-width:88%;padding:.72rem .85rem;border-radius:.85rem;font:400 .9rem/1.55 Inter,system-ui,sans-serif;white-space:pre-wrap}
    .aayam-ai-message--assistant{align-self:flex-start;background:rgba(30,41,59,.82);border:1px solid rgba(148,163,184,.18)}
    .aayam-ai-message--user{align-self:flex-end;background:linear-gradient(135deg,#0369a1,#4338ca);color:#fff}
    .aayam-ai-email-card{align-self:stretch;background:rgba(15,23,42,.95);border:1px solid rgba(56,189,248,.38);border-radius:.85rem;padding:.85rem;display:flex;flex-direction:column;gap:.55rem;font:400 .84rem/1.4 Inter,system-ui,sans-serif}
    .aayam-ai-email-card h3{margin:0;font-size:.9rem;color:#7dd3fc}
    .aayam-ai-email-card input,.aayam-ai-email-card textarea{width:100%;box-sizing:border-box;border:1px solid rgba(148,163,184,.28);border-radius:.55rem;padding:.52rem .65rem;background:#111c2e;color:#f8fafc;font:400 .84rem Inter,system-ui,sans-serif}
    .aayam-ai-email-card textarea{min-height:72px;resize:vertical}
    .aayam-ai-email-actions{display:flex;gap:.5rem;justify-content:flex-end}
    .aayam-ai-email-submit{border:0;border-radius:.55rem;padding:.5rem .85rem;background:#38bdf8;color:#082f49;font-weight:700;cursor:pointer}
    .aayam-ai-email-submit:disabled{opacity:.6;cursor:wait}
    .aayam-ai-email-cancel{border:1px solid rgba(148,163,184,.3);border-radius:.55rem;padding:.5rem .75rem;background:transparent;color:#cbd5e1;cursor:pointer}
    .aayam-ai-quick{padding:.65rem 1rem;border-top:1px solid rgba(148,163,184,.15)}
    .aayam-ai-quick-label{display:block;margin-bottom:.45rem;color:#9fb2cc;font-size:.73rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
    .aayam-ai-chips{display:flex;flex-wrap:wrap;gap:.45rem}
    .aayam-ai-chip{border:1px solid rgba(56,189,248,.36);border-radius:999px;padding:.42rem .65rem;background:rgba(14,165,233,.09);color:#bde9ff;font:600 .76rem/1.2 Inter,system-ui,sans-serif;cursor:pointer}
    .aayam-ai-composer{display:flex;gap:.45rem;padding:.9rem 1rem;border-top:1px solid rgba(148,163,184,.18);background:#0a101c;align-items:center}
    .aayam-ai-input{min-width:0;flex:1;border:1px solid rgba(148,163,184,.28);border-radius:.7rem;padding:.72rem .8rem;background:#111c2e;color:#f8fafc;font:400 .9rem Inter,system-ui,sans-serif}
    .aayam-ai-input::placeholder{color:#94a3b8}
    .aayam-ai-mic{border:1px solid rgba(56,189,248,.4);border-radius:.7rem;padding:.68rem .78rem;background:rgba(14,165,233,.14);color:#7dd3fc;font:700 .9rem/1 Inter,system-ui,sans-serif;cursor:pointer;flex-shrink:0}
    .aayam-ai-mic.is-listening{background:#e11d48;border-color:#fda4af;color:#fff;animation:aayam-ai-mic-pulse 1.3s infinite}
    .aayam-ai-mic[disabled]{opacity:.45;cursor:not-allowed}
    .aayam-ai-send{border:0;border-radius:.7rem;padding:.7rem .85rem;background:#38bdf8;color:#082f49;font-weight:800;cursor:pointer;flex-shrink:0}
    .aayam-ai-send:disabled{opacity:.6;cursor:wait}
    .aayam-ai-contact-highlight{outline:3px solid #38bdf8!important;outline-offset:6px;border-radius:.5rem;transition:outline-color .3s}
    @media(max-width:520px){.aayam-ai-panel{width:100%;border-left:0}.aayam-ai-trigger{padding:.62rem .85rem;font-size:.78rem;max-width:calc(100vw - 1.5rem)}}
    @media(prefers-reduced-motion:reduce){.aayam-ai-trigger,.aayam-ai-mic.is-listening{animation:none}.aayam-ai-trigger:hover:not(.is-dragging){transform:none}}
  `;
  document.head.appendChild(style);

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'aayam-ai-trigger';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', 'aayamAiDrawer');
  trigger.setAttribute('title', 'Click to open assistant, or drag to move');
  trigger.innerHTML = `<span aria-hidden="true">🎙️</span> Ask ${assistantName}`;

  const drawer = document.createElement('div');
  drawer.id = 'aayamAiDrawer';
  drawer.className = 'aayam-ai-drawer';
  drawer.hidden = true;
  drawer.innerHTML = `
    <section class="aayam-ai-panel" role="dialog" aria-modal="true" aria-labelledby="aayamAiTitle">
      <header class="aayam-ai-header">
        <div>
          <h2 class="aayam-ai-title" id="aayamAiTitle">Ask ${assistantName} ✨</h2>
          <p class="aayam-ai-subtitle">${copy[preferredLang].subtitle}</p>
        </div>
        <div class="aayam-ai-header-actions">
          <button class="aayam-ai-lang-toggle" type="button" data-lang="${preferredLang}" title="Switch voice & reply language (English / Nepali)">${preferredLang === 'ne' ? 'नेपाली' : 'EN'}</button>
          <button class="aayam-ai-tts-toggle" type="button" aria-pressed="${voiceRepliesEnabled ? 'true' : 'false'}" title="Toggle spoken voice replies">${voiceRepliesEnabled ? '🔊' : '🔇'}</button>
          <button class="aayam-ai-close" type="button" aria-label="Close assistant">×</button>
        </div>
      </header>
      <div class="aayam-ai-voice-bar" hidden>
        <span class="aayam-ai-voice-status">Ready</span>
        <button class="aayam-ai-stop-speech" type="button" hidden>${copy[preferredLang].stopSpeaking}</button>
      </div>
      <div class="aayam-ai-messages" aria-live="polite"><div class="aayam-ai-message aayam-ai-message--assistant">${copy[preferredLang].greeting}</div></div>
      <div class="aayam-ai-quick"><span class="aayam-ai-quick-label">${copy[preferredLang].quickLabel}</span><div class="aayam-ai-chips"></div></div>
      <form class="aayam-ai-composer">
        <label class="visually-hidden" for="aayamAiInput">Ask ${assistantName}</label>
        <input class="aayam-ai-input" id="aayamAiInput" maxlength="800" autocomplete="off" placeholder="${copy[preferredLang].placeholder}">
        <button class="aayam-ai-mic" type="button" aria-label="Speak your question" title="Speak in English or Nepali">🎙️</button>
        <button class="aayam-ai-send" type="submit">${copy[preferredLang].send}</button>
      </form>
    </section>`;
  document.body.append(trigger, drawer);

  // ── Movable / Draggable Floating Button (Desktop + Mobile Touch) ──────────
  (function makeDraggable() {
    const STORAGE_KEY = 'aayam-ai-fab-pos';
    let isDragging = false;
    let dragStarted = false;
    let startX = 0;
    let startY = 0;
    let originRight = 0;
    let originBottom = 0;

    function getClientPoint(e) {
      if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    function clampPos(right, bottom) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = trigger.getBoundingClientRect();
      const w = rect.width || 150;
      const h = rect.height || 46;
      return {
        right: Math.max(8, Math.min(right, vw - w - 8)),
        bottom: Math.max(8, Math.min(bottom, vh - h - 8)),
      };
    }

    function applyPos(right, bottom, animate) {
      trigger.style.transition = animate ? 'right .2s,bottom .2s' : 'none';
      trigger.style.right = `${right}px`;
      trigger.style.bottom = `${bottom}px`;
      trigger.style.left = 'auto';
      trigger.style.top = 'auto';
    }

    function savePos(right, bottom) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ right, bottom }));
      } catch (_) {}
    }

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved.right === 'number' && typeof saved.bottom === 'number') {
        const clamped = clampPos(saved.right, saved.bottom);
        applyPos(clamped.right, clamped.bottom, false);
      }
    } catch (_) {}

    function onDragStart(e) {
      if (e.type === 'mousedown' && e.button !== 0) return;
      const pt = getClientPoint(e);
      if (typeof pt.x !== 'number' || typeof pt.y !== 'number') return;
      isDragging = true;
      dragStarted = false;
      startX = pt.x;
      startY = pt.y;
      const rect = trigger.getBoundingClientRect();
      originRight = window.innerWidth - rect.right;
      originBottom = window.innerHeight - rect.bottom;
      if (trigger.setPointerCapture && e.pointerId != null) {
        try { trigger.setPointerCapture(e.pointerId); } catch (_) {}
      }
    }

    function onDragMove(e) {
      if (!isDragging) return;
      const pt = getClientPoint(e);
      if (typeof pt.x !== 'number' || typeof pt.y !== 'number') return;
      const dx = pt.x - startX;
      const dy = pt.y - startY;
      if (!dragStarted && Math.hypot(dx, dy) > 6) {
        dragStarted = true;
        trigger.classList.add('is-dragging');
        trigger.style.animation = 'none';
      }
      if (!dragStarted) return;
      if (e.cancelable) e.preventDefault();
      const { right, bottom } = clampPos(originRight - dx, originBottom - dy);
      applyPos(right, bottom, false);
    }

    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      if (dragStarted) {
        trigger.classList.remove('is-dragging');
        trigger.style.animation = '';
        const rect = trigger.getBoundingClientRect();
        const finalPos = clampPos(window.innerWidth - rect.right, window.innerHeight - rect.bottom);
        applyPos(finalPos.right, finalPos.bottom, true);
        savePos(finalPos.right, finalPos.bottom);
      }
    }

    if (window.PointerEvent) {
      trigger.addEventListener('pointerdown', onDragStart);
      window.addEventListener('pointermove', onDragMove, { passive: false });
      window.addEventListener('pointerup', onDragEnd);
      window.addEventListener('pointercancel', onDragEnd);
    } else {
      trigger.addEventListener('touchstart', onDragStart, { passive: true });
      window.addEventListener('touchmove', onDragMove, { passive: false });
      window.addEventListener('touchend', onDragEnd);
      window.addEventListener('touchcancel', onDragEnd);
    }

    window.addEventListener('resize', () => {
      const rect = trigger.getBoundingClientRect();
      const clamped = clampPos(window.innerWidth - rect.right, window.innerHeight - rect.bottom);
      applyPos(clamped.right, clamped.bottom, false);
    });

    trigger.addEventListener('click', (e) => {
      if (dragStarted) {
        e.stopImmediatePropagation();
        dragStarted = false;
      }
    }, true);
  })();

  const panel = drawer.querySelector('.aayam-ai-panel');
  const subtitleEl = drawer.querySelector('.aayam-ai-subtitle');
  const langToggle = drawer.querySelector('.aayam-ai-lang-toggle');
  const ttsToggle = drawer.querySelector('.aayam-ai-tts-toggle');
  const closeButton = drawer.querySelector('.aayam-ai-close');
  const voiceBar = drawer.querySelector('.aayam-ai-voice-bar');
  const voiceStatus = drawer.querySelector('.aayam-ai-voice-status');
  const stopSpeechButton = drawer.querySelector('.aayam-ai-stop-speech');
  const messageList = drawer.querySelector('.aayam-ai-messages');
  const quickLabel = drawer.querySelector('.aayam-ai-quick-label');
  const chipList = drawer.querySelector('.aayam-ai-chips');
  const form = drawer.querySelector('.aayam-ai-composer');
  const input = drawer.querySelector('.aayam-ai-input');
  const micButton = drawer.querySelector('.aayam-ai-mic');
  const sendButton = drawer.querySelector('.aayam-ai-send');
  let lastFocus = null;

  function renderChips() {
    chipList.innerHTML = '';
    copy[preferredLang].chips.forEach((label) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'aayam-ai-chip';
      chip.textContent = label;
      chip.addEventListener('click', () => {
        lastInputWasVoice = false;
        submitQuestion(label, false);
      });
      chipList.appendChild(chip);
    });
  }

  function applyLanguageUI(lang, persist = true) {
    preferredLang = lang === 'ne' ? 'ne' : 'en';
    if (persist) {
      try { localStorage.setItem(LANG_PREF_KEY, preferredLang); } catch (_) {}
    }
    langToggle.dataset.lang = preferredLang;
    langToggle.textContent = preferredLang === 'ne' ? 'नेपाली' : 'EN';
    subtitleEl.textContent = copy[preferredLang].subtitle;
    quickLabel.textContent = copy[preferredLang].quickLabel;
    input.placeholder = copy[preferredLang].placeholder;
    sendButton.textContent = copy[preferredLang].send;
    stopSpeechButton.textContent = copy[preferredLang].stopSpeaking;
    if (recognition) {
      recognition.lang = preferredLang === 'ne' ? 'ne-NP' : 'en-US';
    }
    renderChips();
  }

  renderChips();

  langToggle.addEventListener('click', () => {
    const next = preferredLang === 'ne' ? 'en' : 'ne';
    applyLanguageUI(next, true);
    const notice = next === 'ne'
      ? 'नेपाली भाषा सक्रिय भयो। अब तपाईं नेपालीमा बोल्न वा लेख्न सक्नुहुन्छ।'
      : 'Switched to English mode. You can speak or type in English.';
    addMessage(notice, 'assistant');
    speakText(notice, next);
  });

  function setVoiceStatus(text, speaking = false) {
    if (!text) {
      voiceBar.hidden = true;
      return;
    }
    voiceBar.hidden = false;
    voiceStatus.textContent = text;
    stopSpeechButton.hidden = !speaking;
  }

  function stopSpeaking() {
    if (speechSynth) {
      try { speechSynth.cancel(); } catch (_) {}
    }
    stopSpeechButton.hidden = true;
    if (!isListening && !voiceBar.hidden && (voiceStatus.textContent === copy.en.speaking || voiceStatus.textContent === copy.ne.speaking)) {
      setVoiceStatus('');
    }
  }

  function cleanTextForSpeech(text) {
    return String(text || '')
      .replace(/https?:\/\/[^\s)]+/g, '')
      .replace(/[*_`#>~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function pickVoiceForLanguage(lang) {
    refreshVoices();
    const voices = cachedVoices;
    if (!voices.length) return null;
    if (lang === 'ne') {
      return (
        voices.find((v) => /^ne(-|_|$)/i.test(v.lang) || /nepali/i.test(v.name))
        || voices.find((v) => /^hi(-|_)IN/i.test(v.lang) || /hindi/i.test(v.name))
        || null
      );
    }
    return (
      voices.find((v) => /en(-|_)(US|GB|IN)/i.test(v.lang) && !/compact/i.test(v.name))
      || voices.find((v) => /^en/i.test(v.lang))
      || null
    );
  }

  function speakText(text, langOverride, onDone) {
    let cb = onDone;
    let targetLang = langOverride;
    if (typeof langOverride === 'function') {
      cb = langOverride;
      targetLang = null;
    }

    const spoken = cleanTextForSpeech(text);
    const isNepaliText = /[\u0900-\u097F]/.test(spoken);
    const effectiveLang = targetLang || (isNepaliText ? 'ne' : preferredLang);
    const shouldSpeak = speechSynth && spoken && (voiceRepliesEnabled || lastInputWasVoice);

    if (!shouldSpeak) {
      if (typeof cb === 'function') window.setTimeout(cb, 260);
      return;
    }

    stopSpeaking();
    let finished = false;
    const finishOnce = () => {
      if (finished) return;
      finished = true;
      if (!isListening) setVoiceStatus('');
      if (typeof cb === 'function') cb();
    };

    try {
      const utterance = new SpeechSynthesisUtterance(spoken);
      const matchedVoice = pickVoiceForLanguage(effectiveLang);
      utterance.lang = effectiveLang === 'ne' ? (matchedVoice?.lang || 'ne-NP') : 'en-US';
      utterance.rate = effectiveLang === 'ne' ? 0.96 : 1.02;
      utterance.pitch = 1;
      if (matchedVoice) utterance.voice = matchedVoice;

      utterance.onstart = () => setVoiceStatus(copy[effectiveLang].speaking, true);
      utterance.onend = finishOnce;
      utterance.onerror = finishOnce;
      speechSynth.speak(utterance);

      const fallbackMs = Math.min(16000, Math.max(2800, spoken.length * 75));
      window.setTimeout(finishOnce, fallbackMs);
    } catch (_) {
      finishOnce();
    }
  }

  ttsToggle.addEventListener('click', () => {
    voiceRepliesEnabled = !voiceRepliesEnabled;
    ttsToggle.setAttribute('aria-pressed', voiceRepliesEnabled ? 'true' : 'false');
    ttsToggle.textContent = voiceRepliesEnabled ? '🔊' : '🔇';
    try { localStorage.setItem(TTS_PREF_KEY, String(voiceRepliesEnabled)); } catch (_) {}
    if (!voiceRepliesEnabled) stopSpeaking();
  });

  stopSpeechButton.addEventListener('click', stopSpeaking);

  // ── Browser Speech Recognition (English + Nepali ne-NP with Text Fallback) ─
  if (!SpeechRecognitionAPI) {
    micButton.disabled = true;
    micButton.title = 'Voice input not supported in this browser — type your question below';
  } else {
    try {
      recognition = new SpeechRecognitionAPI();
      recognition.lang = preferredLang === 'ne' ? 'ne-NP' : 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListening = true;
        stopSpeaking();
        micButton.classList.add('is-listening');
        micButton.setAttribute('aria-label', 'Stop listening');
        setVoiceStatus(copy[preferredLang].listening);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const transcript = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) finalTranscript += transcript;
          else interim += transcript;
        }
        if (interim) input.value = interim;
        if (finalTranscript.trim()) {
          input.value = finalTranscript.trim();
          lastInputWasVoice = true;
          submitQuestion(finalTranscript.trim(), true);
        }
      };

      recognition.onerror = (event) => {
        isListening = false;
        micButton.classList.remove('is-listening');
        micButton.setAttribute('aria-label', 'Speak your question');
        const err = event?.error || 'error';
        if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture') {
          micAvailable = false;
          micButton.disabled = true;
          setVoiceStatus(copy[preferredLang].micBlocked);
        } else if (err === 'no-speech') {
          setVoiceStatus(copy[preferredLang].noSpeech);
        } else if (err !== 'aborted') {
          setVoiceStatus(copy[preferredLang].micBlocked);
        }
      };

      recognition.onend = () => {
        isListening = false;
        micButton.classList.remove('is-listening');
        micButton.setAttribute('aria-label', 'Speak your question');
        if (voiceStatus.textContent === copy.en.listening || voiceStatus.textContent === copy.ne.listening) {
          setVoiceStatus('');
        }
      };
    } catch (_) {
      micAvailable = false;
      micButton.disabled = true;
    }
  }

  function toggleListening() {
    if (!recognition || !micAvailable) {
      setVoiceStatus(copy[preferredLang].micBlocked);
      input.focus();
      return;
    }
    if (isListening) {
      try { recognition.stop(); } catch (_) {}
      return;
    }
    try {
      stopSpeaking();
      recognition.lang = preferredLang === 'ne' ? 'ne-NP' : 'en-US';
      recognition.start();
    } catch (_) {
      setVoiceStatus(copy[preferredLang].micBlocked);
    }
  }

  micButton.addEventListener('click', toggleListening);

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
    if (query) input.value = query;
    window.setTimeout(() => input.focus(), 0);
  }

  function closeAssistant() {
    if (isListening && recognition) {
      try { recognition.stop(); } catch (_) {}
    }
    stopSpeaking();
    drawer.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  }

  function parseSiteUrl(path) {
    try {
      return new URL(path, window.location.origin);
    } catch {
      return null;
    }
  }

  function samePage(path) {
    const url = parseSiteUrl(path);
    if (!url) return false;
    const current = window.location.pathname.replace(/\/$/, '') || '/';
    const targetPath = url.pathname.replace(/\/$/, '') || '/';
    const currentHome = current === '/' || current.endsWith('/index.html');
    const targetHome = targetPath === '/' || targetPath.endsWith('/index.html');
    return current === targetPath || (currentHome && targetHome);
  }

  function navigate(path) {
    const url = parseSiteUrl(path);
    if (!url) return;
    if (samePage(path)) {
      if (url.hash) {
        const section = document.querySelector(url.hash);
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    window.location.href = `${url.pathname}${url.search}${url.hash}`;
  }

  function highlightContact() {
    const target = document.querySelector('#contact, .contact-cta, .ns-map-cta, .ns-info-grid');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('aayam-ai-contact-highlight');
      window.setTimeout(() => target.classList.remove('aayam-ai-contact-highlight'), 2600);
    }
  }

  // ── Direct Email / Contact Workflow (English + Nepali Voice & Text) ────────
  async function sendEmailToAayam(payload) {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        subject: payload.subject || 'Message via Website AI Assistant',
        message: payload.message,
      }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || !result.success) {
      throw new Error(result?.error || 'Could not send email right now. Please try again.');
    }
    return true;
  }

  function renderInlineEmailCard(prefill = {}, lang = preferredLang) {
    const existing = messageList.querySelector('.aayam-ai-email-card');
    if (existing) existing.remove();

    const isNe = lang === 'ne';
    const card = document.createElement('form');
    card.className = 'aayam-ai-email-card';
    card.innerHTML = isNe
      ? `
        <h3>✉️ आयामलाई इमेल पठाउनुहोस्</h3>
        <input type="text" name="name" placeholder="तपाईंको नाम" maxlength="100" required>
        <input type="email" name="email" placeholder="तपाईंको इमेल ठेगाना" maxlength="254" required>
        <input type="text" name="subject" placeholder="विषय" maxlength="160" required>
        <textarea name="message" placeholder="आयामलाई पठाउने सन्देश लेख्नुहोस्…" maxlength="5000" required></textarea>
        <div class="aayam-ai-email-actions">
          <button type="button" class="aayam-ai-email-cancel">रद्द गर्नुहोस्</button>
          <button type="submit" class="aayam-ai-email-submit">इमेल पठाउनुहोस्</button>
        </div>
      `
      : `
        <h3>✉️ Send Email to Aayam</h3>
        <input type="text" name="name" placeholder="Your name" maxlength="100" required>
        <input type="email" name="email" placeholder="Your email address" maxlength="254" required>
        <input type="text" name="subject" placeholder="Subject" maxlength="160" required>
        <textarea name="message" placeholder="Write your message for Aayam…" maxlength="5000" required></textarea>
        <div class="aayam-ai-email-actions">
          <button type="button" class="aayam-ai-email-cancel">Cancel</button>
          <button type="submit" class="aayam-ai-email-submit">Send Email</button>
        </div>
      `;

    card.elements.name.value = prefill.name || '';
    card.elements.email.value = prefill.email || '';
    card.elements.subject.value = prefill.subject || (isNe ? 'वेबसाइट सहायकमार्फत सन्देश' : 'Portfolio Inquiry');
    card.elements.message.value = prefill.message || '';

    card.querySelector('.aayam-ai-email-cancel').addEventListener('click', () => {
      const draftLang = activeEmailDraft?.lang || lang;
      activeEmailDraft = null;
      card.remove();
      const msg = draftLang === 'ne'
        ? 'इमेल रद्द गरियो। अरू केही मद्दत चाहिन्छ भने भन्नुहोस्।'
        : 'Email cancelled. Let me know if you need anything else.';
      addMessage(msg, 'assistant');
      speakText(msg, draftLang);
    });

    card.addEventListener('submit', async (e) => {
      e.preventDefault();
      const draftLang = activeEmailDraft?.lang || lang;
      const submitBtn = card.querySelector('.aayam-ai-email-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = draftLang === 'ne' ? 'पठाउँदैछु…' : 'Sending…';
      try {
        await sendEmailToAayam({
          name: card.elements.name.value.trim(),
          email: card.elements.email.value.trim(),
          subject: card.elements.subject.value.trim(),
          message: card.elements.message.value.trim(),
        });
        activeEmailDraft = null;
        card.remove();
        const okMsg = draftLang === 'ne'
          ? 'तपाईंको इमेल आयामलाई सफलतापूर्वक पठाइयो!'
          : 'Your email has been sent to Aayam successfully!';
        addMessage(okMsg, 'assistant');
        speakText(okMsg, draftLang);
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = draftLang === 'ne' ? 'इमेल पठाउनुहोस्' : 'Send Email';
        const errMsg = draftLang === 'ne'
          ? 'अहिले इमेल पठाउन सकिएन। कृपया फेरि प्रयास गर्नुहोस्।'
          : (err instanceof Error ? err.message : 'Failed to send email.');
        addMessage(errMsg, 'assistant');
        speakText(errMsg, draftLang);
      }
    });

    messageList.appendChild(card);
    messageList.scrollTop = messageList.scrollHeight;
  }

  function startEmailComposer(prefill = {}, lang = preferredLang) {
    activeEmailDraft = {
      lang,
      step: prefill.name ? (prefill.email ? (prefill.message ? 'confirm' : 'message') : 'email') : 'name',
      name: prefill.name || '',
      email: prefill.email || '',
      subject: prefill.subject || (lang === 'ne' ? 'वेबसाइट सहायकमार्फत सन्देश' : 'Message via Website AI Assistant'),
      message: prefill.message || '',
    };
    renderInlineEmailCard(activeEmailDraft, lang);
  }

  async function handleEmailDraftTurn(userText) {
    const clean = userText.trim();
    const isNe = activeEmailDraft?.lang === 'ne' || detectNepaliText(clean);
    const draftLang = isNe ? 'ne' : 'en';

    if (/^(cancel|stop|never mind|nevermind|quit)$/i.test(clean) || /^(रद्द|रोक|पर्दैन|छोड)$/.test(clean)) {
      activeEmailDraft = null;
      const existing = messageList.querySelector('.aayam-ai-email-card');
      if (existing) existing.remove();
      const msg = isNe ? 'इमेल रद्द गरियो। अरू के मद्दत गर्न सक्छु?' : 'Email cancelled. How else can I help?';
      addMessage(msg, 'assistant');
      speakText(msg, draftLang);
      return;
    }

    const card = messageList.querySelector('.aayam-ai-email-card');

    if (activeEmailDraft.step === 'name') {
      activeEmailDraft.name = clean;
      if (card) card.elements.name.value = clean;
      activeEmailDraft.step = 'email';
      const prompt = isNe
        ? `धन्यवाद, ${clean}। अब तपाईंको इमेल ठेगाना के हो?`
        : `Thanks, ${clean}. What is your email address?`;
      addMessage(prompt, 'assistant');
      speakText(prompt, draftLang);
      return;
    }

    if (activeEmailDraft.step === 'email') {
      const normalizedEmail = clean
        .replace(/\s+(at|एट)\s+/gi, '@')
        .replace(/\s+(dot|डट)\s+/gi, '.')
        .replace(/\s+/g, '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        const retry = isNe
          ? 'यो इमेल ठेगाना मिलेन जस्तो छ। कृपया फेरि आफ्नो इमेल भन्नुहोस् वा लेख्नुहोस्।'
          : 'That does not look like a valid email address. Please say or type your email again.';
        addMessage(retry, 'assistant');
        speakText(retry, draftLang);
        return;
      }
      activeEmailDraft.email = normalizedEmail;
      if (card) card.elements.email.value = normalizedEmail;
      activeEmailDraft.step = 'message';
      const prompt = isNe
        ? 'राम्रो। आयामलाई के सन्देश पठाउन चाहनुहुन्छ?'
        : 'Got it. What message would you like to send to Aayam?';
      addMessage(prompt, 'assistant');
      speakText(prompt, draftLang);
      return;
    }

    if (activeEmailDraft.step === 'message') {
      activeEmailDraft.message = clean;
      if (card) card.elements.message.value = clean;
      activeEmailDraft.step = 'confirm';
      const prompt = isNe
        ? 'इमेल पठाउन तयार छ। पठाउनको लागि "पठाउनुहोस्" वा "send" भन्नुहोस्, वा माथि सच्याउनुहोस्।'
        : 'Ready to send your email to Aayam. Say "send" to confirm, or edit the fields above.';
      addMessage(prompt, 'assistant');
      speakText(prompt, draftLang);
      return;
    }

    if (activeEmailDraft.step === 'confirm') {
      const confirmed = /\b(send|yes|confirm|submit|go ahead|pathau|pathaunus|hunchha|ho)\b/i.test(clean)
        || /(पठा|हुन्छ|हो|ठिक छ)/.test(clean);
      if (confirmed) {
        const pending = addMessage(isNe ? 'आयामलाई इमेल पठाउँदैछु…' : 'Sending your email to Aayam…', 'assistant');
        try {
          await sendEmailToAayam(activeEmailDraft);
          activeEmailDraft = null;
          if (card) card.remove();
          const done = isNe
            ? 'तपाईंको इमेल आयामलाई सफलतापूर्वक पठाइयो!'
            : 'Your email has been sent to Aayam successfully!';
          pending.textContent = done;
          speakText(done, draftLang);
        } catch (err) {
          const fail = isNe
            ? 'अहिले इमेल पठाउन सकिएन। कृपया फेरि प्रयास गर्नुहोस्।'
            : (err instanceof Error ? err.message : 'Could not send email right now.');
          pending.textContent = fail;
          speakText(fail, draftLang);
        }
      } else {
        activeEmailDraft.message = clean;
        if (card) card.elements.message.value = clean;
        const prompt = isNe
          ? 'सन्देश अपडेट गरियो। पठाउन तयार भएपछि "पठाउनुहोस्" भन्नुहोस्।'
          : 'Updated your message. Say "send" when you are ready to send it.';
        addMessage(prompt, 'assistant');
        speakText(prompt, draftLang);
      }
    }
  }

  // ── Client-Side Explicit Command Detector (English + Nepali Voice & Text) ─
  function detectExplicitClientIntent(text) {
    const raw = text.trim();
    const q = raw.toLowerCase();
    const isNe = preferredLang === 'ne' || detectNepaliText(raw);

    const wantsEmail = /\b(send (an )?email|email (him|aayam)|write (an )?email|send (a )?message to aayam|message aayam|contact aayam via email|email pathau|mail pathau|message pathau|sandesh pathau)\b/.test(q)
      || /(इमेल पठा|मेल पठा|सन्देश पठा|म्यासेज पठा|आयामलाई इमेल|आयामलाई सन्देश)/.test(raw);
    if (wantsEmail) {
      return {
        reply: isNe
          ? 'अवश्य! तलको इमेल फारम भर्नुहोस्, वा पहिले तपाईंको नाम भन्नुहोस्—म इमेल पठाइदिन्छु।'
          : 'Sure! Fill in the quick email card below, or tell me your name first and I will send it for you.',
        action: 'COMPOSE_EMAIL',
        target: '/api/contact',
        lang: isNe ? 'ne' : 'en',
      };
    }

    const explicitNav = /\b(open|go to|navigate to|take me to|show me|visit|khola|kholnus|dekhau|dekhaunus|jaau|janus)\b/.test(q)
      || /(खोल|खोल्नुहोस्|देखाऊ|देखाउनुहोस्|जाऊ|जानुहोस्|लैजाऊ)/.test(raw);
    if (!explicitNav) return null;

    if (/\b(home|main page|index|griha)\b/.test(q) || /(गृह|होम|मुख्य पृष्ठ)/.test(raw)) {
      return { reply: isNe ? 'गृहपृष्ठ खोल्दैछु।' : 'Opening the Home page.', action: 'OPEN_HOME', target: '/index.html', lang: isNe ? 'ne' : 'en' };
    }
    if (/\b(about|parichay)\b/.test(q) || /(बारेमा|परिचय)/.test(raw)) {
      return { reply: isNe ? 'आयामको परिचय पृष्ठ खोल्दैछु।' : 'Opening the About page.', action: 'OPEN_ABOUT', target: '/about.html', lang: isNe ? 'ne' : 'en' };
    }
    if (/\b(project|projects|portfolio work)\b/.test(q) || /(प्रोजेक्ट|परियोजना)/.test(raw)) {
      return { reply: isNe ? 'प्रोजेक्ट पृष्ठ खोल्दैछु।' : 'Opening the Projects page.', action: 'OPEN_PROJECTS', target: '/projects.html', lang: isNe ? 'ne' : 'en' };
    }
    if (/\b(experience|journey|anubhav)\b/.test(q) || /(अनुभव|यात्रा)/.test(raw)) {
      return { reply: isNe ? 'अनुभव पृष्ठ खोल्दैछु।' : 'Opening the Experience page.', action: 'OPEN_EXPERIENCE', target: '/experience.html', lang: isNe ? 'ne' : 'en' };
    }
    if (/\b(namaste suman|business|shop|pasal)\b/.test(q) || /(नमस्ते सुमन|पसल|व्यवसाय)/.test(raw)) {
      return { reply: isNe ? 'नमस्ते सुमन कम्युनिकेसन पृष्ठ खोल्दैछु।' : 'Opening the Namaste Suman Communication page.', action: 'OPEN_BUSINESS', target: '/namaste-suman.html', lang: isNe ? 'ne' : 'en' };
    }
    if (/\b(playground|games|game|khel)\b/.test(q) || /(प्लेग्राउन्ड|खेल|गेम)/.test(raw)) {
      return { reply: isNe ? 'गेम प्लेग्राउन्ड खोल्दैछु।' : 'Opening the Game Playground.', action: 'OPEN_PLAYGROUND', target: '/playground.html', lang: isNe ? 'ne' : 'en' };
    }
    if (/\b(studio)\b/.test(q) || /स्टुडियो/.test(raw)) {
      return { reply: isNe ? 'स्टुडियो पृष्ठ खोल्दैछु।' : 'Opening the Studio page.', action: 'OPEN_STUDIO', target: '/studio.html', lang: isNe ? 'ne' : 'en' };
    }
    if (/\b(github)\b/.test(q) || /गिटहब/.test(raw)) {
      return { reply: isNe ? 'आयामको गिटहब प्रोफाइल खोल्दैछु।' : 'Opening Aayam’s GitHub profile.', action: 'OPEN_GITHUB', target: 'https://github.com/aayampaudel200-sketch', lang: isNe ? 'ne' : 'en' };
    }
    if (/\b(contact|samparka)\b/.test(q) || /सम्पर्क/.test(raw)) {
      return { reply: isNe ? 'सम्पर्क खण्डमा लैजाँदैछु।' : 'Taking you to the Contact section.', action: 'SCROLL_CONTACT', target: '/index.html#contact', lang: isNe ? 'ne' : 'en' };
    }
    return null;
  }

  function executeAction(action, target, lang = preferredLang) {
    try {
      if (!action || typeof action !== 'string') return;
      if (action === 'COMPOSE_EMAIL') {
        startEmailComposer({}, lang);
        return;
      }
      if (actionRoutes[action]) {
        const route = typeof target === 'string' && target.startsWith('/') ? target : actionRoutes[action];
        navigate(route);
        return;
      }
      if (action === 'OPEN_GITHUB') {
        window.open(typeof target === 'string' && target.startsWith('https://') ? target : 'https://github.com/aayampaudel200-sketch', '_blank', 'noopener,noreferrer');
        return;
      }
      if (action === 'SCROLL_CONTACT') {
        if (document.querySelector('#contact')) {
          highlightContact();
          return;
        }
        navigate(typeof target === 'string' && target.includes('#contact') ? target : '/index.html#contact');
        return;
      }
      if (action === 'SCROLL_SERVICES') {
        if (isBusinessPage) {
          const section = document.querySelector('#visa-documentation, #visas, #civic-docs');
          if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        navigate('/namaste-suman.html#visa-documentation');
        return;
      }
      if (action === 'COPY_PHONE_OR_EMAIL') highlightContact();
    } catch (error) {
      console.error('Unable to run assistant page action:', error);
    }
  }

  async function submitQuestion(question = input.value, fromVoice = false) {
    const message = String(question || '').trim();
    if (!message || sendButton.disabled) return;
    lastInputWasVoice = Boolean(fromVoice);

    // Auto-switch assistant & voice mode to Nepali when user types or speaks Nepali
    if (detectNepaliText(message) && preferredLang !== 'ne') {
      applyLanguageUI('ne', true);
    }

    const requestLang = detectNepaliText(message) ? 'ne' : preferredLang;

    openAssistant();
    input.value = '';
    addMessage(message, 'user');

    if (activeEmailDraft) {
      await handleEmailDraftTurn(message);
      return;
    }

    const directIntent = detectExplicitClientIntent(message);
    if (directIntent) {
      addMessage(directIntent.reply, 'assistant');
      if (directIntent.action === 'COMPOSE_EMAIL') {
        executeAction(directIntent.action, directIntent.target, directIntent.lang);
        speakText(directIntent.reply, directIntent.lang);
      } else {
        speakText(directIntent.reply, directIntent.lang, () => executeAction(directIntent.action, directIntent.target, directIntent.lang));
      }
      return;
    }

    sendButton.disabled = true;
    const pending = addMessage(copy[requestLang].thinking, 'assistant');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, page: window.location.pathname, lang: requestLang }),
      });
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      const replyLang = data?.lang === 'ne' || /[\u0900-\u097F]/.test(data?.reply || '') ? 'ne' : requestLang;
      const reply = data?.reply || copy[replyLang].greeting;
      pending.textContent = reply;

      if (data?.action) {
        if (data.action === 'COMPOSE_EMAIL') {
          executeAction(data.action, data.target, replyLang);
          speakText(reply, replyLang);
        } else {
          speakText(reply, replyLang, () => executeAction(data.action, data.target, replyLang));
        }
      } else {
        speakText(reply, replyLang);
      }
    } catch (_) {
      pending.textContent = copy[requestLang].greeting;
      speakText(copy[requestLang].greeting, requestLang);
    } finally {
      sendButton.disabled = false;
      input.focus();
    }
  }

  trigger.addEventListener('click', () => openAssistant());
  closeButton.addEventListener('click', closeAssistant);
  drawer.addEventListener('click', (event) => { if (event.target === drawer) closeAssistant(); });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    lastInputWasVoice = false;
    submitQuestion(input.value, false);
  });

  document.addEventListener('submit', (event) => {
    const searchForm = event.target instanceof HTMLFormElement ? event.target.closest('.site-search') : null;
    if (!searchForm) return;
    const searchInput = searchForm.querySelector('input[type="search"], input[name="q"]');
    const query = searchInput?.value.trim();
    if (!query) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    lastInputWasVoice = false;
    openAssistant(query);
    submitQuestion(query, false);
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
      const focusable = [...panel.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled])')];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
})();