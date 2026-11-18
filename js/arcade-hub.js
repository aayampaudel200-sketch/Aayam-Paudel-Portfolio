/**
 * Arcade Hub: Premium Retro Gaming Shell for Type Blaster & Nokia Snake
 * 
 * Features:
 * - High-contrast futuristic typing arcade with realistic directed laser targeting & particle physics.
 * - Authentic Nokia monochrome LCD snake with input buffer, directional eye graphics, and swipe controls.
 * - Built-in zero-dependency Web Audio API retro sound synthesizer with user mute toggle.
 * - Strict lifecycle management: 0% CPU when idle, paused, tab-switched, or window minimized.
 * - Solves listener loss: DOM controls bound permanently in setup(); game modes activate/deactivate cleanly.
 * - Mobile-first touch & keyboard optimization with zero unwanted page scroll.
 * - Type Blaster & Nokia Snake are independent playground tabs (no sub-tab switcher).
 */

(() => {
  'use strict';

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ SHARED STORAGE Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const ArcadeStorage = {
    read(key, fallback = 0) {
      try {
        const val = localStorage.getItem(key);
        return val !== null ? Number.parseInt(val, 10) || 0 : fallback;
      } catch {
        return fallback;
      }
    },
    write(key, value) {
      try {
        localStorage.setItem(key, String(value));
        return true;
      } catch {
        return false;
      }
    },
    getDifficulty(key, fallback = 'medium', valid = ['easy', 'medium', 'hard', 'veryhard']) {
      try {
        const val = localStorage.getItem(key);
        return valid.includes(val) ? val : fallback;
      } catch {
        return fallback;
      }
    },
    setDifficulty(key, val) {
      try {
        localStorage.setItem(key, val);
      } catch {}
    },
    isSoundEnabled() {
      try {
        return localStorage.getItem('arcadeSoundEnabled') !== 'false';
      } catch {
        return true;
      }
    },
    setSoundEnabled(enabled) {
      try {
        localStorage.setItem('arcadeSoundEnabled', enabled ? 'true' : 'false');
      } catch {}
    }
  };


  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ PURE WEB AUDIO SYNTHESIZER (ZERO EXTERNAL ASSETS) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const ArcadeAudio = (() => {
    let ctx = null;
    let enabled = ArcadeStorage.isSoundEnabled();

    function getContext() {
      if (!enabled) return null;
      if (!ctx) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass) {
          ctx = new AudioClass();
        }
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      return ctx;
    }

    function toggle() {
      enabled = !enabled;
      ArcadeStorage.setSoundEnabled(enabled);
      if (enabled) {
        getContext();
        playClick();
      }
      return enabled;
    }

    function isEnabled() {
      return enabled;
    }

    function playLaser() {
      const a = getContext();
      if (!a) return;
      const now = a.currentTime;
      const osc = a.createOscillator();
      const gain = a.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.09);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(a.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    }

    function playExplosion() {
      const a = getContext();
      if (!a) return;
      const now = a.currentTime;
      const osc = a.createOscillator();
      const gain = a.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(a.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }

    function playMiss() {
      const a = getContext();
      if (!a) return;
      const now = a.currentTime;
      const osc = a.createOscillator();
      const gain = a.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(a.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }

    function playCombo(streak) {
      const a = getContext();
      if (!a) return;
      const now = a.currentTime;
      const osc = a.createOscillator();
      const gain = a.createGain();

      const pitch = Math.min(440 + streak * 45, 1200);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.25, now + 0.12);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(a.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }

    function playSnakeBite() {
      const a = getContext();
      if (!a) return;
      const now = a.currentTime;
      const osc = a.createOscillator();
      const gain = a.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(587, now);
      osc.frequency.setValueAtTime(880, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(a.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    }

    function playSnakeDie() {
      const a = getContext();
      if (!a) return;
      const now = a.currentTime;
      const osc = a.createOscillator();
      const gain = a.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.28);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(a.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    }

    function playClick() {
      const a = getContext();
      if (!a) return;
      const now = a.currentTime;
      const osc = a.createOscillator();
      const gain = a.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(a.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    }

    return {
      toggle,
      isEnabled,
      playLaser,
      playExplosion,
      playMiss,
      playCombo,
      playSnakeBite,
      playSnakeDie,
      playClick
    };
  })();


  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ MOBILE DETECTION Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  const MAX_PARTICLES = isMobile ? 100 : 500;


  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ TYPE BLASTER: PREMIUM TYPING ARCADE MODULE Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const TypeBlasterGame = (() => {
    let container, canvas, ctx;
    let startBtn, pauseBtn, soundBtn, mobileInput;
    let scoreEl, comboEl, wpmEl, accuracyEl, timeEl, bestEl, statusEl;
    let diffContainer;

    // Meaningful Developer Sentence Pools by Difficulty
    const SENTENCE_POOLS = {
      easy: [
        'CODE IS ART',
        'CLEAN CODE',
        'SHIP FAST',
        'LEARN DAILY',
        'STAY CALM',
        'BUILD WEB APPS',
        'THINK FIRST',
        'FOCUS AND WIN',
        'GIT PUSH ORIGIN',
        'SOLVE PROBLEMS'
      ],
      medium: [
        'VANILLA JAVASCRIPT IS FAST',
        'CLEAN ARCHITECTURE SCALES',
        'RESPONSIVE DESIGN FOR LAPTOP AND MOBILE',
        'SOLVE PROBLEMS WITH CLEAN LOGIC',
        'MASTER THE FUNDAMENTALS FIRST',
        'BUILD TESTS BEFORE DEPLOYING',
        'OPTIMIZE PERFORMANCE AND LATENCY',
        'ALWAYS HANDLE ERRORS GRACEFULLY'
      ],
      hard: [
        'CONST [STATE, SETSTATE] = USESTATE(0);',
        'ASYNC FUNCTION DEPLOY() { AWAIT SHIP(); }',
        'WHILE (CODING) { DRINKCOFFEE(); }',
        'GIT COMMIT -M "SHIP FEATURES"',
        'IF (BUGS === 0) LAUNCHAPP();',
        'ITEMS.FILTER(X => X.ACTIVE);',
        'FETCH("/API/STATUS").THEN(RES => RES.JSON());',
        'EXPORT DEFAULT FUNCTION HANDLER(REQ, RES) {}'
      ],
      veryhard: [
        'CONST HANDLER = ASYNC (REQ) => { RETURN RESPONSE.JSON(); }',
        'FOR (LET I = 0; I < ARR.LENGTH; I++) { SUM += ARR[I]; }',
        'EXPORT CLASS CONTROLLER EXTENDS BASE { CONSTRUCTOR() { SUPER(); } }',
        'TRY { AWAIT DB.QUERY(SQL); } CATCH (ERR) { LOG(ERR.STACK); }',
        'CONST [DATA, SET] = USESTATE({ LOADING: TRUE, ERROR: NULL });',
      ]
    };

    // Difficulty Settings
    const settings = {
      easy: {
        duration: 45000,
        spawn: 3.6,
        speedMin: 36,
        speedMax: 46,
        maxRocks: 3,
        integrity: 8,
        letterPool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      },
      medium: {
        duration: 45000,
        spawn: 2.2,
        speedMin: 78,
        speedMax: 96,
        maxRocks: 4,
        integrity: 6,
        letterPool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      },
      hard: {
        duration: 45000,
        spawn: 0.95,
        speedMin: 140,
        speedMax: 175,
        maxRocks: 6,
        integrity: 3,
        letterPool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ{};()=><=_!+-."'
      },
      veryhard: {
        duration: 45000,
        spawn: 0.85,
        speedMin: 150,
        speedMax: 195,
        maxRocks: 5,
        integrity: 4,
        letterPool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ{};()=><=_!+-."\'',
      }
    };

    let difficulty = 'easy';
    let bestScore = 0;
    let rocks = [];
    let bullets = [];
    let particles = [];
    let popups = [];
    let isPlaying = false;
    let isPaused = false;
    let isFinished = false;
    let roundStartedAt = 0;
    let elapsedBeforePause = 0;
    let lastFrameTime = 0;
    let spawnTimer = 0;
    let score = 0;
    let combo = 0;
    let maxCombo = 0;
    let totalTyped = 0;
    let totalHits = 0;
    let escapedRocks = 0;
    let animFrameId = 0;
    let nextRockId = 1;
    let turretAngle = -Math.PI / 2;
    let turretTargetAngle = -Math.PI / 2;
    let screenShake = 0;
    let isKeyActive = false;
    let isSetupDone = false;

    // Sentence progression state
    let currentSentence = '';
    let sentenceIndex = 0;
    let sentencePoolIndex = 0;

    // WPM/Accuracy tracking Ã¢â‚¬â€ array of {time, correct}
    let keypressTimes = [];
    let firstKeypressTime = 0;

    // Cached backdrop gradient (reused across frames)
    let cachedBackdropGrad = null;
    let cachedBackdropW = 0;
    let cachedBackdropH = 0;

    // Starfield particles (cached)
    const stars = Array.from({ length: 42 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.6 + 0.2
    }));

    function storageKey() {
      return `type-blaster-best:${difficulty}`;
    }

    function loadBest() {
      bestScore = ArcadeStorage.read(storageKey(), 0);
      if (bestEl) bestEl.textContent = String(bestScore);
    }

    function syncDifficultyUI() {
      if (!diffContainer) return;
      diffContainer.querySelectorAll('[data-difficulty]').forEach((btn) => {
        const active = btn.dataset.difficulty === difficulty;
        btn.setAttribute('aria-pressed', String(active));
      });
    }

    function syncSoundUI() {
      if (!soundBtn) return;
      const on = ArcadeAudio.isEnabled();
      soundBtn.textContent = on ? 'Ã°Å¸â€Å  Sound' : 'Ã°Å¸â€â€¡ Muted';
      soundBtn.setAttribute('aria-pressed', String(on));
    }

    function initSentence() {
      const pool = SENTENCE_POOLS[difficulty] || SENTENCE_POOLS.easy;
      currentSentence = pool[sentencePoolIndex % pool.length];
      sentenceIndex = 0;
    }

    function advanceToNextSentence() {
      const pool = SENTENCE_POOLS[difficulty] || SENTENCE_POOLS.easy;
      sentencePoolIndex = (sentencePoolIndex + 1) % pool.length;
      currentSentence = pool[sentencePoolIndex];
      sentenceIndex = 0;
    }

    function getActiveTargetChar() {
      if (!currentSentence) return null;
      // Auto-skip spaces so typing flows naturally across words
      while (sentenceIndex < currentSentence.length && currentSentence[sentenceIndex] === ' ') {
        sentenceIndex++;
      }
      if (sentenceIndex >= currentSentence.length) return null;
      return currentSentence[sentenceIndex].toUpperCase();
    }

    function updateMetrics(now = performance.now()) {
      const elapsed = isPlaying ? elapsedBeforePause + (now - roundStartedAt) : elapsedBeforePause;
      const duration = settings[difficulty].duration;

      // WPM from first keypress to now
      let wpm = 0;
      if (keypressTimes.length > 0 && firstKeypressTime > 0) {
        const correctChars = keypressTimes.filter(k => k.correct).length;
        const elapsedFromFirst = (now - firstKeypressTime) / 60000; // minutes
        if (elapsedFromFirst > 0) {
          wpm = Math.round((correctChars / 5) / elapsedFromFirst);
        }
      }

      // Accuracy
      const accuracy = keypressTimes.length > 0
        ? Math.round((keypressTimes.filter(k => k.correct).length / keypressTimes.length) * 100)
        : 100;

      if (scoreEl) scoreEl.textContent = String(score);
      if (comboEl) comboEl.textContent = `${combo}x`;
      if (wpmEl) wpmEl.textContent = `${wpm} WPM`;
      if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
      if (timeEl) timeEl.textContent = `${Math.max(0, Math.ceil((duration - elapsed) / 1000))}s`;
      return elapsed;
    }

    function createRockPolygon(seed, radius) {
      const points = [];
      const numVertices = 7;
      for (let i = 0; i < numVertices; i++) {
        const angle = (i / numVertices) * Math.PI * 2;
        const pseudo = Math.sin(seed * 3.7 + i * 2.1) * 0.16;
        const r = radius * (1 + pseudo);
        points.push({
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r
        });
      }
      return points;
    }

    function spawnRock() {
      const cfg = settings[difficulty];
      if (rocks.length >= cfg.maxRocks) return;

      const activeTarget = getActiveTargetChar();
      const currentLetters = new Set(rocks.map((r) => r.letter.toUpperCase()));

      // Always ensure the active target is on-screen. If it already is, don't duplicate.
      let chosenLetter = '';
      let isTargetRock = false;
      if (activeTarget && !currentLetters.has(activeTarget)) {
        chosenLetter = activeTarget;
        isTargetRock = true;
      } else {
        // Look ahead in sentence for upcoming characters
        let lookAheadChar = '';
        if (currentSentence) {
          for (let i = sentenceIndex + 1; i < currentSentence.length; i++) {
            const cand = currentSentence[i].toUpperCase();
            if (cand !== ' ' && !currentLetters.has(cand)) {
              lookAheadChar = cand;
              break;
            }
          }
        }
        if (lookAheadChar) {
          chosenLetter = lookAheadChar;
        } else {
          const pool = cfg.letterPool;
          let available = pool.split('').filter((c) => !currentLetters.has(c.toUpperCase()));
          if (!available.length) available = pool.split('');
          chosenLetter = available[Math.floor(Math.random() * available.length)].toUpperCase();
        }
      }

      // Large 44px radius (88px diameter) ensures giant letters and crystal-clear visibility
      const radius = 44;

      // If this is the target rock, give it a dedicated, easy-to-spot center lane.
      // Other rocks spread randomly. This prevents the target being hidden beside others.
      const occupied = rocks.map((r) => r.x);
      let lane;
      if (isTargetRock) {
        // Pick the left-center column, clearly separated from other rocks
        const preferredX = canvas.width * 0.5;
        const altX = canvas.width * 0.25;
        const altX2 = canvas.width * 0.75;
        const candidates = [preferredX, altX, altX2];
        lane = candidates.find((cx) => occupied.every((x) => Math.abs(x - cx) > 100)) || preferredX;
      } else {
        lane = canvas.width / 2;
        for (let attempts = 0; attempts < 16; attempts++) {
          const cand = 72 + Math.random() * (canvas.width - 144);
          if (occupied.every((x) => Math.abs(x - cand) > 96)) {
            lane = cand;
            break;
          }
        }
      }

      const id = nextRockId++;
      const rock = {
        id,
        x: lane,
        y: -44,
        radius,
        letter: chosenLetter,
        isTarget: isTargetRock,
        speed: cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.35,
        polygon: createRockPolygon(id, radius),
        drift: 0
      };

      // Very Hard: gentle sinusoidal drift (reduced from previous 120)
      if (difficulty === 'veryhard') {
        rock.drift = (Math.random() - 0.5) * 50;
      }

      // Push target rocks to front of array so they render last (on top) = most visible
      if (isTargetRock) {
        rocks.unshift(rock);
      } else {
        rocks.push(rock);
      }
    }

    // Very Hard: spawn 1 distractor rock max with random letters NOT in the sentence
    function spawnDistractorRocks() {
      if (difficulty !== 'veryhard') return;
      const cfg = settings[difficulty];
      // Max 1 distractor at a time for fairness
      const distractorCount = rocks.filter(r => r && !r.isTarget).length;
      if (distractorCount >= 1) return;
      const count = 1;
      const sentenceChars = new Set(currentSentence.replace(/ /g, '').split('').map(c => c.toUpperCase()));
      const pool = cfg.letterPool.split('').filter(c => !sentenceChars.has(c.toUpperCase()));
      if (pool.length === 0) return;

      for (let d = 0; d < count; d++) {
        if (rocks.length >= cfg.maxRocks) break;
        const letter = pool[Math.floor(Math.random() * pool.length)].toUpperCase();
        const radius = 44;
        const occupied = rocks.map(r => r.x);
        let lane = canvas.width / 2;
        for (let attempts = 0; attempts < 16; attempts++) {
          const cand = 72 + Math.random() * (canvas.width - 144);
          if (occupied.every(x => Math.abs(x - cand) > 96)) {
            lane = cand;
            break;
          }
        }
        const id = nextRockId++;
        rocks.push({
          id,
          x: lane,
          y: -44,
          radius,
          letter,
          speed: cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin),
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.35,
          polygon: createRockPolygon(id, radius),
          drift: (Math.random() - 0.5) * 50
        });
      }
    }

    function fireLetter(char) {
      if (!isPlaying || isPaused) return;
      const upper = String(char).toUpperCase();
      if (!upper) return;

      totalTyped++;

      const now = performance.now();
      if (firstKeypressTime === 0) {
        firstKeypressTime = now;
      }

      const activeTarget = getActiveTargetChar();
      if (!activeTarget || upper !== activeTarget) {
        combo = 0;
        ArcadeAudio.playMiss();
        keypressTimes.push({ time: now, correct: false });
        if (statusEl) statusEl.textContent = `Type ${activeTarget || 'the highlighted character'} next to continue the sentence.`;
        updateMetrics();
        return;
      }

      // Only the next sentence character counts toward typing speed and accuracy.
      const matchingRocks = rocks
        .filter((r) => r.letter.toUpperCase() === upper)
        .sort((a, b) => b.y - a.y);

      const target = matchingRocks[0];

      if (target) {
        // Successful hit
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        ArcadeAudio.playLaser();
        if (combo > 1) ArcadeAudio.playCombo(combo);

        keypressTimes.push({ time: now, correct: true });
        totalHits++;

        // Aim defense turret directly at target rock
        const turretX = canvas.width / 2;
        const turretY = canvas.height - 42;
        const dx = target.x - turretX;
        const dy = target.y - turretY;
        turretTargetAngle = Math.atan2(dy, dx);

        const dist = Math.hypot(dx, dy) || 1;
        const bulletSpeed = 1200;

        bullets.push({
          x: turretX,
          y: turretY,
          vx: (dx / dist) * bulletSpeed,
          vy: (dy / dist) * bulletSpeed,
          targetId: target.id,
          targetLetter: target.letter,
          progress: 0,
          maxDist: dist
        });

        // Dynamic TOP SCORE Ã¢â‚¬â€ update immediately if we exceed best
        const pointsPreview = 100 * Math.min(combo, 5);
        // We'll add score when bullet hits, but check preview
        // Actually score is added in the bullet collision handler

        // Advance sentence if matched active character
        if (activeTarget && target.letter.toUpperCase() === activeTarget) {
          sentenceIndex++;
          // Auto-skip spaces
          while (sentenceIndex < currentSentence.length && currentSentence[sentenceIndex] === ' ') {
            sentenceIndex++;
          }

          // Check if sentence complete
          if (sentenceIndex >= currentSentence.length) {
            score += 500;
            // Dynamic TOP SCORE
            if (score > bestScore) {
              bestScore = score;
              ArcadeStorage.write(storageKey(), bestScore);
              if (bestEl) bestEl.textContent = String(bestScore);
            }
            ArcadeAudio.playCombo(6);
            popups.push({
              x: canvas.width / 2,
              y: canvas.height / 2 - 20,
              text: 'Ã°Å¸Å½â€° SENTENCE CLEARED! +500 PTS',
              color: '#34d399',
              life: 1.5,
              maxLife: 1.5
            });
            advanceToNextSentence();
            if (statusEl) {
              statusEl.textContent = 'Ã°Å¸Å½â€° Sentence completed! +500 Bonus Points! Next sentence loaded.';
            }
          } else {
            if (statusEl) {
              statusEl.textContent = combo > 2 ? `Ã°Å¸â€Â¥ Streak! Combo ${combo}x!` : `Blasted rock ${upper}! Keep typing!`;
            }
          }
        } else {
          if (statusEl) {
            statusEl.textContent = `Blasted perimeter rock ${upper}! Defend the base!`;
          }
        }
      } else {
        // The right character was typed before its matching asteroid entered range.
        combo = 0;
        ArcadeAudio.playMiss();
        keypressTimes.push({ time: now, correct: false });
        if (statusEl) {
          statusEl.textContent = `No incoming rock has '${upper}' Ã¢â‚¬â€ check the target phrase below!`;
        }
      }

      updateMetrics();
    }

    function createExplosion(x, y, letter, pointsEarned) {
      ArcadeAudio.playExplosion();
      screenShake = 6;

      const count = 18;
      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 80 + Math.random() * 180;
        const isNeon = i % 2 === 0;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.5 + Math.random() * 0.35,
          maxLife: 0.85,
          radius: isNeon ? 2.8 : 3.8,
          color: isNeon ? '#38bdf8' : (Math.random() > 0.5 ? '#f59e0b' : '#ffffff')
        });
      }

      popups.push({
        x,
        y: y - 10,
        text: combo > 1 ? `+${pointsEarned} (${combo}x)` : `+${pointsEarned}`,
        color: combo > 2 ? '#facc15' : '#7dd3fc',
        life: 0.8,
        maxLife: 0.8
      });
    }

    function endRound(msg, isVictory = false) {
      if (isPlaying) {
        elapsedBeforePause += performance.now() - roundStartedAt;
      }
      isPlaying = false;
      isPaused = false;
      isFinished = true;

      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = 0;
      }

      const now = performance.now();
      updateMetrics(now);

      // Final WPM/Accuracy from keypressTimes
      let wpm = 0;
      let accuracy = 100;
      if (keypressTimes.length > 0 && firstKeypressTime > 0) {
        const correctChars = keypressTimes.filter(k => k.correct).length;
        const elapsedFromFirst = (now - firstKeypressTime) / 60000;
        if (elapsedFromFirst > 0) {
          wpm = Math.round((correctChars / 5) / elapsedFromFirst);
        }
        accuracy = Math.round((correctChars / keypressTimes.length) * 100);
      }

      let rank = 'Novice Typist';
      if (wpm >= 80) rank = 'Master Typist Ã°Å¸â€Â¥';
      else if (wpm >= 60) rank = 'Pro Developer Ã¢Å¡Â¡';
      else if (wpm >= 40) rank = 'Fast Typist Ã°Å¸Å¡â‚¬';
      else if (wpm >= 20) rank = 'Intermediate Ã¢Å’Â¨Ã¯Â¸Â';

      let isNewRecord = false;
      if (score > bestScore) {
        bestScore = score;
        isNewRecord = true;
        ArcadeStorage.write(storageKey(), bestScore);
        if (bestEl) bestEl.textContent = String(bestScore);
      }

      if (statusEl) {
        const recordNote = isNewRecord ? ' Ã°Å¸Ââ€  NEW HIGH SCORE!' : '';
        statusEl.textContent = `${msg} Speed: ${wpm} WPM Ã‚Â· Accuracy: ${accuracy}% Ã‚Â· Rank: ${rank}.${recordNote}`;
      }

      if (startBtn) startBtn.textContent = 'Play again';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      draw();
    }

    // Get or create cached backdrop gradient
    function getBackdropGradient(w, h) {
      if (cachedBackdropW === w && cachedBackdropH === h && cachedBackdropGrad) {
        return cachedBackdropGrad;
      }
      cachedBackdropGrad = ctx.createLinearGradient(0, 0, 0, h);
      cachedBackdropGrad.addColorStop(0, '#040b17');
      cachedBackdropGrad.addColorStop(0.55, '#07152b');
      cachedBackdropGrad.addColorStop(1, '#0b1b36');
      cachedBackdropW = w;
      cachedBackdropH = h;
      return cachedBackdropGrad;
    }

    function draw(now = performance.now()) {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      ctx.save();

      // Screen shake
      if (screenShake > 0.05) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Sci-Fi Space Backdrop (reuse gradient)
      ctx.fillStyle = getBackdropGradient(w, h);
      ctx.fillRect(0, 0, w, h);

      // 2. Starfield
      stars.forEach((s) => {
        ctx.fillStyle = `rgba(186, 230, 253, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Cyber Defense Tactical Grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
      ctx.lineWidth = 1;
      const gridStep = 44;
      for (let x = 0; x <= w; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h - 48);
        ctx.stroke();
      }
      for (let y = 0; y <= h - 48; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 4. Perimeter Defense Line & Shield Bar
      const maxIntegrity = settings[difficulty].integrity;
      const currentIntegrity = Math.max(0, maxIntegrity - escapedRocks);
      const integrityRatio = currentIntegrity / maxIntegrity;

      const shieldY = h - 48;
      const shieldGlow = ctx.createLinearGradient(0, shieldY - 4, 0, shieldY + 4);
      shieldGlow.addColorStop(0, 'rgba(56, 189, 248, 0)');
      shieldGlow.addColorStop(0.5, integrityRatio > 0.35 ? 'rgba(56, 189, 248, 0.8)' : 'rgba(239, 68, 68, 0.85)');
      shieldGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = shieldGlow;
      ctx.fillRect(0, shieldY - 4, w, 8);

      ctx.strokeStyle = integrityRatio > 0.35 ? '#38bdf8' : '#f87171';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, shieldY);
      ctx.lineTo(w, shieldY);
      ctx.stroke();

      ctx.fillStyle = '#071224';
      ctx.fillRect(0, shieldY, w, h - shieldY);

      // Integrity gauge indicator
      ctx.fillStyle = integrityRatio > 0.4 ? '#38bdf8' : '#ef4444';
      ctx.font = '700 12px var(--font-mono, monospace)';
      ctx.textAlign = 'left';
      ctx.fillText(`PERIMETER SHIELD: ${currentIntegrity} / ${maxIntegrity} [${difficulty.toUpperCase()}]`, 18, h - 20);

      if (combo > 1) {
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'right';
        ctx.fillText(`COMBO x${combo} Ã°Å¸â€Â¥`, w - 18, h - 20);
      }

      // 5. Directed Laser Projectiles
      bullets.forEach((b) => {
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const tailX = b.x - (b.vx * 0.04);
        const tailY = b.y - (b.vy * 0.04);
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tailX + (b.vx * 0.01), tailY + (b.vy * 0.01));
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
      });

      // 6. Incoming Asteroids with GIGANTIC High-Contrast Target Badges
      const activeTargetChar = getActiveTargetChar();

      // Sort so target rock renders last (on top / most visible)
      const sortedRocks = [...rocks].sort((a, b) => {
        const aIsTarget = activeTargetChar && a.letter.toUpperCase() === activeTargetChar;
        const bIsTarget = activeTargetChar && b.letter.toUpperCase() === activeTargetChar;
        return aIsTarget ? 1 : (bIsTarget ? -1 : 0);
      });

      sortedRocks.forEach((r) => {
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.rot);

        const isDanger = r.y > h * 0.65;
        const isCurrentSentenceTarget = (activeTargetChar && r.letter.toUpperCase() === activeTargetChar);

        // A. Shaded Organic Asteroid Body — target gets a glowing highlight color
        const bodyColor0 = isCurrentSentenceTarget ? '#7dd3fc' : '#94a3b8';
        const bodyColor1 = isCurrentSentenceTarget ? '#0369a1' : '#475569';
        const bodyColor2 = isCurrentSentenceTarget ? '#082f49' : '#1e293b';
        const rGrad = ctx.createRadialGradient(-8, -10, 4, 0, 0, r.radius);
        rGrad.addColorStop(0, bodyColor0);
        rGrad.addColorStop(0.35, bodyColor1);
        rGrad.addColorStop(0.85, bodyColor2);
        rGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = rGrad;

        ctx.beginPath();
        r.polygon.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();

        // Target asteroid glows brightly
        if (isCurrentSentenceTarget) {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 20;
        } else if (isDanger) {
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
        }
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = isCurrentSentenceTarget ? 'rgba(56, 189, 248, 0.9)' : 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = isCurrentSentenceTarget ? 2.5 : 1.8;
        ctx.stroke();

        ctx.restore(); // Undo rotation so letter ALWAYS stays 100% upright

        // B. Large High-Contrast Target Letter Badge
        ctx.save();
        ctx.translate(r.x, r.y);

        const badgeRadius = isCurrentSentenceTarget ? 34 : 32; // target badge slightly larger

        // Pulsing outer glow ring for the current target
        if (isCurrentSentenceTarget) {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.005);
          ctx.beginPath();
          ctx.arc(0, 0, badgeRadius + 10 + pulse * 6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56,189,248,${0.25 + pulse * 0.4})`;
          ctx.lineWidth = 3;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 18;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Outer Target Ring / Reticle
        ctx.beginPath();
        ctx.arc(0, 0, badgeRadius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = isDanger
          ? 'rgba(239, 68, 68, 0.85)'
          : (isCurrentSentenceTarget ? 'rgba(56, 189, 248, 0.95)' : 'rgba(148, 163, 184, 0.6)');
        ctx.lineWidth = isCurrentSentenceTarget ? 3 : 2;
        if (isCurrentSentenceTarget) {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 14;
        }
        ctx.stroke();

        // Solid Obsidian Badge Background for 100% MAXIMUM Letter Contrast
        ctx.beginPath();
        ctx.arc(0, 0, badgeRadius, 0, Math.PI * 2);
        ctx.fillStyle = isCurrentSentenceTarget ? '#020c1a' : '#020617';
        ctx.fill();

        // Inner Badge Accent Ring
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isDanger ? '#ef4444' : (isCurrentSentenceTarget ? '#38bdf8' : '#475569');
        ctx.lineWidth = isCurrentSentenceTarget ? 2 : 1.5;
        ctx.stroke();

        // Target Reticle Corner Ticks
        ctx.strokeStyle = isDanger ? '#f87171' : (isCurrentSentenceTarget ? '#7dd3fc' : '#94a3b8');
        ctx.lineWidth = 2;
        const tickDist = badgeRadius + 3;
        [-1, 1].forEach((dirX) => {
          [-1, 1].forEach((dirY) => {
            ctx.beginPath();
            ctx.moveTo(dirX * tickDist, dirY * (tickDist - 6));
            ctx.lineTo(dirX * tickDist, dirY * tickDist);
            ctx.lineTo(dirX * (tickDist - 6), dirY * tickDist);
            ctx.stroke();
          });
        });

        // Target Lock Tag for active sentence character — bigger and more visible
        if (isCurrentSentenceTarget) {
          ctx.fillStyle = '#38bdf8';
          ctx.font = '700 10px var(--font-mono, monospace)';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 6;
          ctx.fillText('▼ SHOOT THIS ▼', 0, -badgeRadius - 10);
          ctx.shadowBlur = 0;
        }

        // Extra-large upright glyph, isolated from the rotating asteroid body.
        ctx.fillStyle = isCurrentSentenceTarget ? '#ffffff' : '#e2e8f0';
        ctx.shadowColor = isDanger ? '#ef4444' : (isCurrentSentenceTarget ? '#38bdf8' : 'rgba(0, 0, 0, 0.8)');
        ctx.shadowBlur = isCurrentSentenceTarget ? 16 : 4;
        ctx.font = isCurrentSentenceTarget ? '900 46px "Arial Black", "JetBrains Mono", monospace' : '900 42px "Arial Black", "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.letter, 0, 1);

        ctx.restore();
      });

      // 7. Defense Turret Cannon at Base
      const turretX = w / 2;
      const turretY = shieldY + 8;

      ctx.fillStyle = '#0f2744';
      ctx.beginPath();
      ctx.arc(turretX, turretY + 6, 24, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(turretX, turretY);
      ctx.rotate(turretAngle + Math.PI / 2);

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-5, -28, 10, 28);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(-2, -30, 4, 30);
      ctx.restore();

      // 7b. Canvas HUD Ã¢â‚¬â€ Show target letter above turret
      const activeChar = getActiveTargetChar();
      if (activeChar && (isPlaying || isPaused)) {
        ctx.save();
        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 20px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fillText(`NEXT: [${activeChar}]`, turretX, shieldY - 10);
        ctx.restore();
      }

      // 7c. Canvas HUD Ã¢â‚¬â€ Show sentence progress overlay (small, top of canvas)
      if (currentSentence && (isPlaying || isPaused)) {
        ctx.save();
        const done = currentSentence.slice(0, sentenceIndex).replace(/ /g, 'Ã‚Â·');
        const current = sentenceIndex < currentSentence.length ? currentSentence[sentenceIndex] : 'Ã¢Å“â€œ';
        const upcoming = sentenceIndex < currentSentence.length ? currentSentence.slice(sentenceIndex + 1) : '';

        const sentenceY = 24;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Background bar
        ctx.fillStyle = 'rgba(4, 11, 23, 0.75)';
        ctx.fillRect(0, 0, w, 36);

        // Done portion (green)
        const doneText = done;
        const currentText = current === ' ' ? 'Ã‚Â·' : current;
        const upcomingText = upcoming;

        ctx.font = '700 13px var(--font-mono, monospace)';

        const fullText = doneText + currentText + upcomingText;
        const getTextWidth = (txt) => (ctx.measureText ? (ctx.measureText(txt)?.width || txt.length * 8) : txt.length * 8);
        const fullWidth = getTextWidth(fullText);
        const startX = (w - fullWidth) / 2;

        // Draw done
        ctx.fillStyle = '#34d399';
        ctx.textAlign = 'left';
        ctx.fillText(doneText, startX, 10);

        // Draw current
        const doneWidth = getTextWidth(doneText);
        ctx.fillStyle = '#facc15';
        ctx.font = '900 14px var(--font-mono, monospace)';
        ctx.fillText(currentText, startX + doneWidth, 9);

        // Draw upcoming
        const currentWidth = getTextWidth(currentText);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 13px var(--font-mono, monospace)';
        ctx.fillText(upcomingText, startX + doneWidth + currentWidth, 10);

        ctx.restore();
      }

      // 8. Explosion Particles
      particles.forEach((p) => {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // 9. Floating Score Popups
      popups.forEach((pop) => {
        const alpha = Math.max(0, pop.life / pop.maxLife);
        ctx.fillStyle = pop.color;
        ctx.globalAlpha = alpha;
        ctx.font = '800 16px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText(pop.text, pop.x, pop.y);
      });
      ctx.globalAlpha = 1;

      // 10. Idle Overlay
      if (!isPlaying && !isPaused && !isFinished) {
        ctx.fillStyle = 'rgba(4, 11, 23, 0.78)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 28px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('TYPE BLASTER: SPEED TYPING ARCADE', w / 2, h / 2 - 44);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '600 15px var(--font-sans, sans-serif)';
        ctx.fillText('Blast falling letter asteroids by typing meaningful dev sentences!', w / 2, h / 2 - 10);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px var(--font-mono, monospace)';
        ctx.fillText('Desktop: Type keys directly Ã‚Â· Mobile: Tap input field', w / 2, h / 2 + 16);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '700 14px var(--font-mono, monospace)';
        ctx.fillText('Click "Start round" to initialize speed mission', w / 2, h / 2 + 52);
      }

      // 11. Paused Overlay
      if (isPaused) {
        ctx.fillStyle = 'rgba(4, 11, 23, 0.8)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#e0f2fe';
        ctx.font = '700 26px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION PAUSED', w / 2, h / 2 - 10);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px var(--font-sans, sans-serif)';
        ctx.fillText('Press Resume to return to combat', w / 2, h / 2 + 22);
      }

      // 12. Finished Overlay
      if (isFinished) {
        ctx.fillStyle = 'rgba(3, 8, 18, 0.9)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = currentIntegrity > 0 ? '#38bdf8' : '#f87171';
        ctx.font = '800 28px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText(currentIntegrity > 0 ? 'MISSION ACCOMPLISHED' : 'DEFENSE BREACHED', w / 2, h / 2 - 56);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 16px var(--font-sans, sans-serif)';
        ctx.fillText(`Final Score: ${score} Ã‚Â· High Score: ${bestScore} (${difficulty})`, w / 2, h / 2 - 22);

        ctx.fillStyle = '#34d399';
        ctx.font = '700 15px var(--font-mono, monospace)';
        const finalWpm = wpmEl ? wpmEl.textContent : '0 WPM';
        const finalAcc = accuracyEl ? accuracyEl.textContent : '100%';
        ctx.fillText(`Typing Speed: ${finalWpm} Ã‚Â· Accuracy: ${finalAcc} Ã‚Â· Streak: ${maxCombo}x`, w / 2, h / 2 + 10);

        ctx.fillStyle = '#fef08a';
        ctx.font = '700 14px var(--font-sans, sans-serif)';
        ctx.fillText('Click "Play again" to launch another speed run', w / 2, h / 2 + 46);
      }

      ctx.restore();
    }

    function loop(now) {
      if (!isPlaying) return;
      const delta = Math.min((now - lastFrameTime) / 1000, 0.05);
      lastFrameTime = now;

      if (screenShake > 0) {
        screenShake = Math.max(0, screenShake - delta * 24);
      }

      turretAngle += (turretTargetAngle - turretAngle) * Math.min(delta * 14, 1);

      if (updateMetrics(now) >= settings[difficulty].duration) {
        return endRound('Mission complete! Base perimeter secured.', true);
      }

      spawnTimer += delta;
      if (spawnTimer >= settings[difficulty].spawn) {
        spawnTimer = 0;
        spawnRock();
        // Very Hard: also spawn distractors
        if (difficulty === 'veryhard') {
          spawnDistractorRocks();
        }
      }

      rocks.forEach((r) => {
        r.y += r.speed * delta;
        r.rot += r.rotSpeed * delta;
        // Very Hard: erratic horizontal drift
        if (r.drift && difficulty === 'veryhard') {
          r.x += r.drift * Math.sin(now * 0.003 + r.id) * delta;
          // Clamp to canvas bounds
          r.x = Math.max(r.radius, Math.min(canvas.width - r.radius, r.x));
        }
      });

      bullets.forEach((b) => {
        b.x += b.vx * delta;
        b.y += b.vy * delta;
        b.progress += Math.hypot(b.vx * delta, b.vy * delta);
      });

      bullets = bullets.filter((b) => {
        const target = rocks.find((r) => r.id === b.targetId);
        if (target) {
          const distToTarget = Math.hypot(b.x - target.x, b.y - target.y);
          if (distToTarget <= target.radius + 10 || b.progress >= b.maxDist) {
            rocks = rocks.filter((r) => r.id !== target.id);
            const pointsEarned = 100 * Math.min(combo, 5);
            score += pointsEarned;
            // Dynamic TOP SCORE Ã¢â‚¬â€ update immediately during gameplay
            if (score > bestScore) {
              bestScore = score;
              ArcadeStorage.write(storageKey(), bestScore);
              if (bestEl) bestEl.textContent = String(bestScore);
            }
            createExplosion(target.x, target.y, target.letter, pointsEarned);
            return false;
          }
        }
        return b.y > -30 && b.y < canvas.height + 30 && b.x > -30 && b.x < canvas.width + 30;
      });

      const remaining = [];
      rocks.forEach((r) => {
        if (r.y > canvas.height - 54) {
          escapedRocks++;
          combo = 0;
          screenShake = 8;
          ArcadeAudio.playExplosion();
        } else {
          remaining.push(r);
        }
      });
      rocks = remaining;

      if (escapedRocks >= settings[difficulty].integrity) {
        return endRound('Base integrity breached! Rocks penetrated defense shield.');
      }

      particles.forEach((p) => {
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.vy += 60 * delta;
        p.life -= delta;
      });
      particles = particles.filter((p) => p.life > 0);

      popups.forEach((pop) => {
        pop.y -= 38 * delta;
        pop.life -= delta;
      });
      popups = popups.filter((pop) => pop.life > 0);

      draw(now);
      animFrameId = requestAnimationFrame(loop);
    }

    function start(restart = false) {
      if (restart || elapsedBeforePause >= settings[difficulty].duration || isFinished || !isPaused) {
        rocks = [];
        bullets = [];
        particles = [];
        popups = [];
        keypressTimes = [];
        firstKeypressTime = 0;
        score = 0;
        combo = 0;
        maxCombo = 0;
        totalTyped = 0;
        totalHits = 0;
        escapedRocks = 0;
        spawnTimer = 0;
        elapsedBeforePause = 0;
        nextRockId = 1;
        isFinished = false;
        turretAngle = -Math.PI / 2;
        turretTargetAngle = -Math.PI / 2;
        initSentence();
        spawnRock();
      }

      isPlaying = true;
      isPaused = false;
      roundStartedAt = performance.now();
      lastFrameTime = roundStartedAt;

      if (startBtn) startBtn.textContent = 'PlayingÃ¢â‚¬Â¦';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      if (statusEl) statusEl.textContent = 'Type the falling rock letters to complete the target sentence!';

      if (isMobile && mobileInput) {
        try { mobileInput.focus(); } catch {}
      }

      if (animFrameId) cancelAnimationFrame(animFrameId);
      animFrameId = requestAnimationFrame(loop);
    }

    function pause(reason = 'Round paused.') {
      if (!isPlaying) return;
      elapsedBeforePause += performance.now() - roundStartedAt;
      isPlaying = false;
      isPaused = true;

      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = 0;
      }

      // pauseBtn toggles to Resume
      if (pauseBtn) pauseBtn.textContent = 'Resume';
      if (startBtn) startBtn.textContent = 'Resume round';
      if (statusEl) statusEl.textContent = reason;
      updateMetrics();
      draw();
    }

    function destroy() {
      isPlaying = false;
      isPaused = false;
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = 0;
      }
      if (startBtn) startBtn.textContent = 'Start round';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      draw();
    }

    function handleKeyDown(e) {
      if (!isPlaying || isPaused || !isKeyActive || container.hidden) return;
      if (e.target === mobileInput || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!e.repeat && e.key && e.key.length === 1) {
        e.preventDefault();
        fireLetter(e.key);
      }
    }

    function activate() {
      isKeyActive = true;
      window.addEventListener('keydown', handleKeyDown);
      draw();
    }

    function deactivate() {
      isKeyActive = false;
      window.removeEventListener('keydown', handleKeyDown);
      pause('Paused while switching.');
    }

    function setup() {
      if (isSetupDone) return;
      container = document.getElementById('lab-type-blaster') || document.getElementById('arcadeGameTyping');
      canvas = document.getElementById('typingShooterCanvas');
      if (!container || !canvas) return;

      // Set canvas dimensions to 960Ãƒâ€”640
      canvas.width = 960;
      canvas.height = 640;

      ctx = canvas.getContext('2d', { alpha: false });
      startBtn = document.getElementById('typingStartBtn');
      pauseBtn = document.getElementById('typingPauseBtn');
      soundBtn = document.getElementById('typingSoundBtn');
      mobileInput = document.getElementById('typingShooterInput');
      scoreEl = document.getElementById('typingScore');
      comboEl = document.getElementById('typingCombo');
      wpmEl = document.getElementById('typingWpm');
      accuracyEl = document.getElementById('typingAccuracy');
      timeEl = document.getElementById('typingTime');
      bestEl = document.getElementById('typingBest');
      statusEl = document.getElementById('typingStatus');
      diffContainer = container.querySelector('[data-difficulty-for]');

      difficulty = ArcadeStorage.getDifficulty('typeBlasterDifficulty', 'easy');
      syncDifficultyUI();
      syncSoundUI();
      loadBest();
      initSentence();

      if (timeEl) timeEl.textContent = `${Math.ceil(settings[difficulty].duration / 1000)}s`;

      if (diffContainer) {
        diffContainer.querySelectorAll('[data-difficulty]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const next = btn.dataset.difficulty;
            if (!settings[next] || next === difficulty) return;
            difficulty = next;
            ArcadeStorage.setDifficulty('typeBlasterDifficulty', difficulty);
            syncDifficultyUI();
            loadBest();
            initSentence();
            if (isPlaying || isPaused) {
              pause('Difficulty updated. Start new round.');
            }
            if (timeEl) timeEl.textContent = `${Math.ceil(settings[difficulty].duration / 1000)}s`;
          });
        });
      }

      // startBtn toggles between "Start round" / "PlayingÃ¢â‚¬Â¦" / "Play again"
      if (startBtn) {
        startBtn.addEventListener('click', () => {
          if (isPaused) start(false);
          else start(isFinished);
        });
      }

      // pauseBtn toggles between pause and resume (no separate restart button)
      if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
          if (isPlaying) pause();
          else if (isPaused) start(false);
        });
      }

      if (soundBtn) {
        soundBtn.addEventListener('click', () => {
          ArcadeAudio.toggle();
          syncSoundUI();
        });
      }

      if (mobileInput) {
        mobileInput.addEventListener('input', () => {
          const val = mobileInput.value.trim();
          if (val) {
            const char = val.slice(-1);
            mobileInput.value = '';
            fireLetter(char);
          }
        });
      }

      isSetupDone = true;
      draw();
    }

    return {
      setup,
      activate,
      deactivate,
      start,
      pause,
      destroy,
      drawIdle: draw
    };
  })();


  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ NOKIA SNAKE: AUTHENTIC RETRO LCD MODULE Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const NokiaSnakeGame = (() => {
    let container, canvas, ctx;
    let startBtn, pauseBtn, restartBtn, soundBtn;
    let scoreEl, bestEl, statusEl;
    let diffContainer;

    // 20 cells Ã¢â‚¬â€ use square cells via Math.min, board centered
    const cells = 20;
    let unit = 24;
    let boardOffsetX = 0;
    let boardOffsetY = 0;

    // Difficulty Speeds:
    // Easy: 160ms tick (beginner-friendly)
    // Medium: 110ms tick (classic authentic Nokia pace)
    // Hard: 68ms tick (fast arcade challenge)
    const speeds = { easy: 160, medium: 110, hard: 68 };

    let difficulty = 'medium';
    let bestScore = 0;
    let snake = [];
    let food = null;
    let direction = { x: 1, y: 0 };
    let inputQueue = [];
    let score = 0;
    let isRunning = false;
    let isPaused = false;
    let timerId = null;
    let touchStartCoord = null;
    let isKeyActive = false;
    let isSetupDone = false;

    function storageKey() {
      return `nokia-snake-best:${difficulty}`;
    }

    function loadBest() {
      bestScore = ArcadeStorage.read(storageKey(), 0);
      if (!bestScore && difficulty === 'medium') {
        bestScore = ArcadeStorage.read('nokia-snake-best', 0);
      }
      if (bestEl) bestEl.textContent = String(bestScore);
    }

    function syncDifficultyUI() {
      if (!diffContainer) return;
      diffContainer.querySelectorAll('[data-difficulty]').forEach((btn) => {
        const active = btn.dataset.difficulty === difficulty;
        btn.setAttribute('aria-pressed', String(active));
      });
    }

    function syncSoundUI() {
      if (!soundBtn) return;
      const on = ArcadeAudio.isEnabled();
      soundBtn.textContent = on ? 'Ã°Å¸â€Å  Sound' : 'Ã°Å¸â€â€¡ Muted';
      soundBtn.setAttribute('aria-pressed', String(on));
    }

    function computeLayout() {
      if (!canvas) return;
      // Keep cells square: unit = min(w, h) / cells, board centered
      unit = Math.min(canvas.width, canvas.height) / cells;
      const boardW = unit * cells;
      const boardH = unit * cells;
      boardOffsetX = Math.floor((canvas.width - boardW) / 2);
      boardOffsetY = Math.floor((canvas.height - boardH) / 2);
    }

    function placeFood() {
      const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
      const emptyCells = [];
      for (let x = 0; x < cells; x++) {
        for (let y = 0; y < cells; y++) {
          if (!occupied.has(`${x},${y}`)) {
            emptyCells.push({ x, y });
          }
        }
      }

      if (emptyCells.length === 0) {
        food = null;
        return stop('Ã°Å¸Ââ€  INCREDIBLE! You filled the entire board! You Win!');
      }

      food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    function draw() {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      // Fill entire canvas with dark border
      ctx.fillStyle = '#6b7a60';
      ctx.fillRect(0, 0, w, h);

      // Authentic retro Nokia monochrome green LCD screen (centered board)
      const boardW = unit * cells;
      const boardH = unit * cells;
      ctx.fillStyle = '#9caf88';
      ctx.fillRect(boardOffsetX, boardOffsetY, boardW, boardH);

      // LCD Pixel Matrix Texture
      ctx.fillStyle = 'rgba(47, 62, 45, 0.08)';
      for (let i = 0; i <= cells; i++) {
        ctx.fillRect(boardOffsetX + i * unit, boardOffsetY, 1, boardH);
        ctx.fillRect(boardOffsetX, boardOffsetY + i * unit, boardW, 1);
      }

      // Food (Retro LCD Apple)
      if (food) {
        const fx = boardOffsetX + food.x * unit;
        const fy = boardOffsetY + food.y * unit;
        ctx.fillStyle = '#183b25';
        ctx.fillRect(fx + 3, fy + 3, unit - 6, unit - 6);
        ctx.fillStyle = '#9caf88';
        ctx.fillRect(fx + 6, fy + 6, 3, 3);
      }

      // Snake Body & Head
      snake.forEach((part, index) => {
        const px = boardOffsetX + part.x * unit;
        const py = boardOffsetY + part.y * unit;

        if (index === 0) {
          ctx.fillStyle = '#122618';
          ctx.fillRect(px + 1, py + 1, unit - 2, unit - 2);

          // Expressive Pixel Eyes pointing in direction of movement
          ctx.fillStyle = '#9caf88';
          if (direction.x === 1) {
            ctx.fillRect(px + unit - 6, py + 4, 3, 3);
            ctx.fillRect(px + unit - 6, py + unit - 7, 3, 3);
          } else if (direction.x === -1) {
            ctx.fillRect(px + 4, py + 4, 3, 3);
            ctx.fillRect(px + 4, py + unit - 7, 3, 3);
          } else if (direction.y === 1) {
            ctx.fillRect(px + 4, py + unit - 6, 3, 3);
            ctx.fillRect(px + unit - 7, py + unit - 6, 3, 3);
          } else {
            ctx.fillRect(px + 4, py + 4, 3, 3);
            ctx.fillRect(px + unit - 7, py + 4, 3, 3);
          }
        } else {
          ctx.fillStyle = '#183b25';
          ctx.fillRect(px + 1.5, py + 1.5, unit - 3, unit - 3);
          ctx.fillStyle = '#2d5c3d';
          ctx.fillRect(px + 4, py + 4, unit - 8, unit - 8);
        }
      });

      // Overlay: Idle
      if (!isRunning && !isPaused && !snake.length) {
        ctx.fillStyle = 'rgba(156, 175, 136, 0.88)';
        ctx.fillRect(boardOffsetX, boardOffsetY, boardW, boardH);

        ctx.fillStyle = '#122618';
        ctx.font = '700 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NOKIA 3310 SNAKE', w / 2, h / 2 - 28);

        ctx.font = '14px monospace';
        ctx.fillText('Use Arrow Keys or Swipe Screen', w / 2, h / 2 + 4);
        ctx.fillText('Press "Start game" to Play', w / 2, h / 2 + 32);
      }

      // Overlay: Paused
      if (isPaused) {
        ctx.fillStyle = 'rgba(156, 175, 136, 0.85)';
        ctx.fillRect(boardOffsetX, boardOffsetY, boardW, boardH);

        ctx.fillStyle = '#122618';
        ctx.font = '700 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME PAUSED', w / 2, h / 2 - 10);

        ctx.font = '14px monospace';
        ctx.fillText('Press Resume to Continue', w / 2, h / 2 + 18);
      }
    }

    function step() {
      if (!isRunning || isPaused) return;

      if (inputQueue.length > 0) {
        direction = inputQueue.shift();
      }

      const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
      };

      // Wall collision
      if (head.x < 0 || head.x >= cells || head.y < 0 || head.y >= cells) {
        ArcadeAudio.playSnakeDie();
        return stop('Snake crashed into the perimeter wall!');
      }

      // Self collision
      if (snake.some((part) => part.x === head.x && part.y === head.y)) {
        ArcadeAudio.playSnakeDie();
        return stop('Snake collided with its own tail!');
      }

      snake.unshift(head);

      // Check food eaten
      if (food && head.x === food.x && head.y === food.y) {
        score += 10;
        ArcadeAudio.playSnakeBite();
        if (scoreEl) scoreEl.textContent = String(score);

        if (score > bestScore) {
          bestScore = score;
          ArcadeStorage.write(storageKey(), bestScore);
          if (bestEl) bestEl.textContent = String(bestScore);
        }

        // Slight speed acceleration in Hard mode
        if (difficulty === 'hard' && snake.length % 4 === 0) {
          clearInterval(timerId);
          const dynamicSpeed = Math.max(45, speeds.hard - Math.floor(snake.length / 4) * 2);
          timerId = setInterval(step, dynamicSpeed);
        }

        placeFood();
      } else {
        snake.pop();
      }

      draw();
    }

    function queueDirection(nextDir) {
      const last = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : direction;
      // Prevent 180-degree instant reversal into own neck
      if (last.x + nextDir.x === 0 && last.y + nextDir.y === 0) return;
      if (last.x === nextDir.x && last.y === nextDir.y) return;
      if (inputQueue.length < 3) {
        inputQueue.push(nextDir);
      }
    }

    function start(reset = false) {
      if (reset || !snake.length) {
        const mid = Math.floor(cells / 2);
        snake = [
          { x: mid, y: mid },
          { x: mid - 1, y: mid },
          { x: mid - 2, y: mid }
        ];
        direction = { x: 1, y: 0 };
        inputQueue = [];
        score = 0;
        if (scoreEl) scoreEl.textContent = '0';
        placeFood();
      }

      isRunning = true;
      isPaused = false;

      if (startBtn) startBtn.textContent = 'PlayingÃ¢â‚¬Â¦';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      if (statusEl) statusEl.textContent = 'Eat food and grow your snake!';

      if (timerId) clearInterval(timerId);
      timerId = setInterval(step, speeds[difficulty]);
      draw();
    }

    function pause(reason = 'Game paused.') {
      if (!isRunning) return;
      isRunning = false;
      isPaused = true;
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      if (startBtn) startBtn.textContent = 'Resume';
      if (pauseBtn) pauseBtn.textContent = 'Resume';
      if (statusEl) statusEl.textContent = reason;
      draw();
    }

    function stop(msg) {
      isRunning = false;
      isPaused = false;
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      if (startBtn) startBtn.textContent = 'Play again';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      if (statusEl) {
        const recordNote = score >= bestScore && score > 0 ? ' Ã°Å¸Ââ€  NEW RECORD!' : '';
        statusEl.textContent = `${msg} Final Score: ${score}.${recordNote}`;
      }
      draw();
    }

    function destroy() {
      isRunning = false;
      isPaused = false;
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      if (startBtn) startBtn.textContent = 'Start game';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      draw();
    }

    function handleKeyDown(e) {
      if (!isKeyActive || container.hidden) return;
      let handled = false;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          queueDirection({ x: 0, y: -1 });
          handled = true;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          queueDirection({ x: 0, y: 1 });
          handled = true;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          queueDirection({ x: -1, y: 0 });
          handled = true;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          queueDirection({ x: 1, y: 0 });
          handled = true;
          break;
        case ' ':
          if (isRunning) pause();
          else if (isPaused || snake.length) start(false);
          handled = true;
          break;
      }
      if (handled) e.preventDefault();
    }

    function activate() {
      isKeyActive = true;
      window.addEventListener('keydown', handleKeyDown);
      draw();
    }

    function deactivate() {
      isKeyActive = false;
      window.removeEventListener('keydown', handleKeyDown);
      pause('Paused while switching.');
    }

    function setup() {
      if (isSetupDone) return;
      container = document.getElementById('lab-nokia-snake') || document.getElementById('arcadeGameSnake');
      canvas = document.getElementById('snakeCanvas');
      if (!container || !canvas) return;

      // Set canvas to 480Ãƒâ€”640 internal resolution
      canvas.width = 480;
      canvas.height = 640;

      ctx = canvas.getContext('2d', { alpha: false });
      computeLayout();

      startBtn = document.getElementById('snakeStartBtn');
      pauseBtn = document.getElementById('snakePauseBtn');
      restartBtn = document.getElementById('snakeRestartBtn');
      soundBtn = document.getElementById('snakeSoundBtn');
      scoreEl = document.getElementById('snakeScore');
      bestEl = document.getElementById('snakeBest');
      statusEl = document.getElementById('snakeStatus');
      diffContainer = container.querySelector('[data-difficulty-for]');

      difficulty = ArcadeStorage.getDifficulty('nokiaSnakeDifficulty', 'medium');
      syncDifficultyUI();
      syncSoundUI();
      loadBest();

      if (diffContainer) {
        diffContainer.querySelectorAll('[data-difficulty]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const next = btn.dataset.difficulty;
            if (!speeds[next] || next === difficulty) return;
            difficulty = next;
            ArcadeStorage.setDifficulty('nokiaSnakeDifficulty', difficulty);
            syncDifficultyUI();
            loadBest();
            if (isRunning) {
              clearInterval(timerId);
              timerId = setInterval(step, speeds[difficulty]);
              if (statusEl) statusEl.textContent = `Speed set to ${difficulty}.`;
            }
          });
        });
      }

      if (startBtn) {
        startBtn.addEventListener('click', () => {
          if (isPaused) start(false);
          else start(!snake.length || startBtn.textContent === 'Play again');
        });
      }
      if (restartBtn) {
        restartBtn.addEventListener('click', () => start(true));
      }
      if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
          if (isRunning) pause();
          else if (isPaused || snake.length) start(false);
        });
      }
      if (soundBtn) {
        soundBtn.addEventListener('click', () => {
          ArcadeAudio.toggle();
          syncSoundUI();
        });
      }

      const dirMap = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
      };

      document.querySelectorAll('[data-snake-direction]').forEach((btn) => {
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          const d = dirMap[btn.dataset.snakeDirection];
          if (d) queueDirection(d);
        });
      });

      canvas.addEventListener('pointerdown', (e) => {
        touchStartCoord = { x: e.clientX, y: e.clientY };
      }, { passive: true });

      canvas.addEventListener('pointerup', (e) => {
        if (!touchStartCoord) return;
        const dx = e.clientX - touchStartCoord.x;
        const dy = e.clientY - touchStartCoord.y;
        touchStartCoord = null;

        if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return;

        if (Math.abs(dx) > Math.abs(dy)) {
          queueDirection({ x: Math.sign(dx), y: 0 });
        } else {
          queueDirection({ x: 0, y: Math.sign(dy) });
        }
      }, { passive: true });

      isSetupDone = true;
      draw();
    }

    return {
      setup,
      activate,
      deactivate,
      start,
      pause,
      destroy,
      drawIdle: draw
    };
  })();


  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ INDEPENDENT TAB CONTROLLERS (NO GAME SWITCHER) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // Each game is a separate playground tab. No sub-tab switcher logic.

  let typeBlasterInitialized = false;
  let nokiaSnakeInitialized = false;

  function initTypeBlaster() {
    if (typeBlasterInitialized) return;
    const panel = document.getElementById('lab-type-blaster') || document.getElementById('arcadeGameTyping');
    if (!panel) return;
    TypeBlasterGame.setup();
    TypeBlasterGame.activate();
    typeBlasterInitialized = true;
  }

  function initNokiaSnake() {
    if (nokiaSnakeInitialized) return;
    const panel = document.getElementById('lab-nokia-snake') || document.getElementById('arcadeGameSnake');
    if (!panel) return;
    NokiaSnakeGame.setup();
    NokiaSnakeGame.activate();
    nokiaSnakeInitialized = true;
  }

  // Listen for playground:tabchange events for each game independently
  document.addEventListener('playground:tabchange', (e) => {
    const labId = e.detail?.labId;

    if (labId === 'type-blaster') {
      initTypeBlaster();
      TypeBlasterGame.activate();
      TypeBlasterGame.drawIdle();
    } else {
      // Leaving type-blaster tab
      if (typeBlasterInitialized) {
        TypeBlasterGame.deactivate();
      }
    }

    if (labId === 'nokia-snake') {
      initNokiaSnake();
      NokiaSnakeGame.activate();
      NokiaSnakeGame.drawIdle();
    } else {
      // Leaving nokia-snake tab
      if (nokiaSnakeInitialized) {
        NokiaSnakeGame.deactivate();
      }
    }
  });

  // Window Visibility change: immediately freeze animations when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (typeBlasterInitialized) TypeBlasterGame.pause('Game paused while window was hidden.');
      if (nokiaSnakeInitialized) NokiaSnakeGame.pause('Game paused while window was hidden.');
    }
  });

  // Dynamic Viewport Height (100dvh / visualViewport) handling for mobile keyboard support
  if (window.visualViewport) {
    const updateVisualViewport = () => {
      const vh = window.visualViewport.height;
      document.documentElement.style.setProperty('--visual-vh', `${vh}px`);
    };
    window.visualViewport.addEventListener('resize', updateVisualViewport, { passive: true });
    window.visualViewport.addEventListener('scroll', updateVisualViewport, { passive: true });
    updateVisualViewport();
  }

  // Expose individual game classes and backward-compatible ArcadeHub shell on window
  window.TypeBlasterGame = TypeBlasterGame;
  window.NokiaSnakeGame = NokiaSnakeGame;

  const ArcadeHub = {
    activeGame: 'typing',
    switchGame(gameId) {
      const typePanel = document.getElementById('lab-type-blaster') || document.getElementById('arcadeGameTyping');
      const snakePanel = document.getElementById('lab-nokia-snake') || document.getElementById('arcadeGameSnake');
      if (gameId === 'typing' || gameId === 'type-blaster') {
        if (snakePanel) snakePanel.hidden = true;
        if (typePanel) typePanel.hidden = false;
        NokiaSnakeGame.deactivate();
        initTypeBlaster();
        TypeBlasterGame.activate();
        this.activeGame = 'typing';
      } else if (gameId === 'snake' || gameId === 'nokia-snake') {
        if (typePanel) typePanel.hidden = true;
        if (snakePanel) snakePanel.hidden = false;
        TypeBlasterGame.deactivate();
        initNokiaSnake();
        NokiaSnakeGame.activate();
        this.activeGame = 'snake';
      }
    },
    init() {
      initTypeBlaster();
      initNokiaSnake();
    }
  };
  window.ArcadeHub = ArcadeHub;

  // Auto-init on DOM readiness Ã¢â‚¬â€ set up both games if their containers exist
  function autoInit() {
    const typingPanel = document.getElementById('lab-type-blaster') || document.getElementById('arcadeGameTyping');
    const snakePanel = document.getElementById('lab-nokia-snake') || document.getElementById('arcadeGameSnake');

    if (typingPanel && !typingPanel.hidden) {
      initTypeBlaster();
    }
    if (snakePanel && !snakePanel.hidden) {
      initNokiaSnake();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();
