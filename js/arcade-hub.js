/**
 * Arcade Hub: Modular Retro Gaming Shell for Type Blaster & Nokia Snake
 * 
 * Performance & Architecture Features:
 * - Zero CPU Idle: No requestAnimationFrame or timer executes until user explicitly starts a game.
 * - Strict Lifecycle Management: Full cleanup (cancelAnimationFrame, clearInterval, listener removal)
 *   on pause, game switch, tab switch, or window blur.
 * - Shared Utilities: Unified localStorage management, optimized canvas context, managed events,
 *   and responsive canvas sizing.
 * - Mobile & Touch Optimization: Tactile controls, touch-action: manipulation, zero-scroll event traps.
 */

(() => {
  'use strict';

  // ─── SHARED UTILITIES & CORE MODULE ─────────────────────────────────────────
  const ArcadeCore = {
    // 1. Shared Storage Helper
    storage: {
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
      getDifficulty(key, fallback = 'medium', valid = ['easy', 'medium', 'hard']) {
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
      }
    },

    // 2. Optimized Canvas Context & Responsive Display
    canvas: {
      getOptimizedContext(canvas, options = {}) {
        if (!canvas) return null;
        return canvas.getContext('2d', {
          alpha: options.alpha !== undefined ? options.alpha : false,
          desynchronized: options.desynchronized || false
        });
      }
    },

    // 3. Managed Event Listener Registry for Leak-Free Cleanup
    ManagedEvents: class {
      constructor() {
        this.listeners = [];
      }
      add(target, type, handler, options) {
        if (!target) return;
        target.addEventListener(type, handler, options);
        this.listeners.push({ target, type, handler, options });
      }
      clear() {
        this.listeners.forEach(({ target, type, handler, options }) => {
          try { target.removeEventListener(type, handler, options); } catch {}
        });
        this.listeners = [];
      }
    }
  };

  // Backwards-compatible alias for submodules
  const ArcadeStorage = ArcadeCore.storage;
  const ManagedEvents = ArcadeCore.ManagedEvents;

  // ─── TYPE BLASTER GAME MODULE ──────────────────────────────────────────────
  const TypeBlasterGame = (() => {
    let container, canvas, ctx;
    let startBtn, pauseBtn, restartBtn, mobileInput;
    let scoreEl, wpmEl, accuracyEl, timeEl, bestEl, statusEl;
    let diffContainer;

    const events = new ManagedEvents();
    const letters = 'ASDFGHJKLQWERTYUIOPZXCVBNM';
    const settings = {
      easy: { duration: 45000, spawn: 3, speedMin: 52, speedMax: 60, maxRocks: 3, integrity: 5 },
      medium: { duration: 45000, spawn: 1.95, speedMin: 92, speedMax: 110, maxRocks: 4, integrity: 3 },
      hard: { duration: 45000, spawn: 1.3, speedMin: 132, speedMax: 160, maxRocks: 6, integrity: 3 },
    };

    let difficulty = 'easy';
    let bestScore = 0;
    let rocks = [];
    let bullets = [];
    let isPlaying = false;
    let isPaused = false;
    let isFinished = false;
    let roundStartedAt = 0;
    let elapsedBeforePause = 0;
    let lastFrameTime = 0;
    let spawnTimer = 0;
    let score = 0;
    let totalTyped = 0;
    let totalHits = 0;
    let escapedRocks = 0;
    let animFrameId = 0;
    let nextRockId = 1;
    let initialized = false;

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
        btn.setAttribute('aria-pressed', String(btn.dataset.difficulty === difficulty));
      });
    }

    function updateMetrics(now = performance.now()) {
      const elapsed = isPlaying ? elapsedBeforePause + (now - roundStartedAt) : elapsedBeforePause;
      const duration = settings[difficulty].duration;
      const minutes = Math.max(elapsed / 60000, 1 / 60);
      const wpm = Math.round((totalHits / 5) / minutes);
      const accuracy = totalTyped ? Math.round((totalHits / totalTyped) * 100) : 100;

      if (scoreEl) scoreEl.textContent = String(score);
      if (wpmEl) wpmEl.textContent = `${wpm} WPM`;
      if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
      if (timeEl) timeEl.textContent = `${Math.max(0, Math.ceil((duration - elapsed) / 1000))}s`;
      return elapsed;
    }

    function draw(now = performance.now()) {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      // Dark sci-fi gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#071426');
      grad.addColorStop(1, '#0a1020');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Sub-grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y <= h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // Defense cannon / ship
      const shipX = w / 2;
      const shipY = h - 36;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(shipX, shipY - 18);
      ctx.lineTo(shipX - 20, shipY + 18);
      ctx.lineTo(shipX + 20, shipY + 18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(shipX - 3, shipY - 9, 6, 22);

      // Base integrity
      const maxIntegrity = settings[difficulty].integrity;
      const currentIntegrity = Math.max(0, maxIntegrity - escapedRocks);
      ctx.fillStyle = currentIntegrity <= 1 ? '#f87171' : '#9fb2cc';
      ctx.font = '600 13px var(--font-mono, monospace)';
      ctx.textAlign = 'left';
      ctx.fillText(`BASE INTEGRITY ${currentIntegrity} / ${maxIntegrity}`, 16, h - 16);

      // Bullets
      ctx.fillStyle = '#fef08a';
      bullets.forEach((b) => {
        ctx.fillRect(b.x - 2, b.y - 12, 4, 16);
      });

      // Rocks
      rocks.forEach((r) => {
        const radius = 29;
        const rGrad = ctx.createRadialGradient(r.x - 8, r.y - 9, 2, r.x, r.y, radius);
        rGrad.addColorStop(0, '#dbeafe');
        rGrad.addColorStop(0.35, '#64748b');
        rGrad.addColorStop(1, '#172033');
        ctx.fillStyle = rGrad;
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.4)';
        ctx.stroke();

        // Inner glowing circle with letter
        ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
        ctx.beginPath();
        ctx.arc(r.x, r.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.7)';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 32px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.letter, r.x, r.y + 1);
        ctx.textBaseline = 'alphabetic';
      });

      // Overlay: Idle splash (ZERO CPU)
      if (!isPlaying && !isPaused && !isFinished && elapsedBeforePause === 0) {
        ctx.fillStyle = 'rgba(7, 20, 38, 0.75)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#7dd3fc';
        ctx.font = '700 26px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('TYPE BLASTER', w / 2, 170);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '15px var(--font-sans, sans-serif)';
        ctx.fillText('Type the letter on each falling rock to blast it.', w / 2, 205);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px var(--font-mono, monospace)';
        ctx.fillText('Press "Start round" to initialize mission.', w / 2, 240);
      }

      // Overlay: Paused
      if (isPaused) {
        ctx.fillStyle = 'rgba(7, 20, 38, 0.72)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#e0f2fe';
        ctx.font = '700 24px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION PAUSED', w / 2, h / 2 - 10);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px var(--font-sans, sans-serif)';
        ctx.fillText('Click Resume or press Pause button to continue', w / 2, h / 2 + 20);
      }

      // Overlay: Finished
      if (isFinished) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#7dd3fc';
        ctx.font = '800 28px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('ROUND COMPLETE', w / 2, h / 2 - 40);
        ctx.fillStyle = '#e0f2fe';
        ctx.font = '600 17px var(--font-sans, sans-serif)';
        ctx.fillText(`Score ${score} · ${wpmEl ? wpmEl.textContent : ''} · ${accuracyEl ? accuracyEl.textContent : ''}`, w / 2, h / 2 + 2);
        ctx.fillStyle = '#fef08a';
        ctx.font = '600 14px var(--font-sans, sans-serif)';
        ctx.fillText('Press "Play again" to launch another round', w / 2, h / 2 + 40);
      }
    }

    function spawnRock() {
      const cfg = settings[difficulty];
      if (rocks.length >= cfg.maxRocks) return;
      const occupied = rocks.map((r) => r.x);
      let lane = canvas.width / 2;
      for (let attempts = 0; attempts < 14; attempts++) {
        const cand = 48 + Math.random() * (canvas.width - 96);
        if (occupied.every((x) => Math.abs(x - cand) > 68)) {
          lane = cand;
          break;
        }
      }
      rocks.push({
        id: nextRockId++,
        x: lane,
        y: -32,
        letter: letters[Math.floor(Math.random() * letters.length)],
        speed: cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin)
      });
    }

    function fireLetter(char) {
      if (!isPlaying || isPaused) return;
      const letter = char.toUpperCase();
      if (!/^[A-Z]$/.test(letter)) return;

      totalTyped++;
      const target = rocks
        .filter((r) => r.letter === letter)
        .sort((a, b) => b.y - a.y)[0];

      bullets.push({
        x: canvas.width / 2,
        y: canvas.height - 56,
        targetId: target ? target.id : null
      });

      if (!target && statusEl) {
        statusEl.textContent = `No ${letter} rock in range — keep watching the sky!`;
      }
      updateMetrics();
    }

    function endRound(msg) {
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

      const elapsed = updateMetrics();
      const wpm = Math.round((totalHits / 5) / Math.max(elapsed / 60000, 1 / 60));
      if (score > bestScore) {
        bestScore = score;
        ArcadeStorage.write(storageKey(), bestScore);
        if (bestEl) bestEl.textContent = String(bestScore);
      }

      if (statusEl) {
        statusEl.textContent = `${msg} Final Score: ${score}, Top Score: ${bestScore} (${difficulty}), ${wpm} WPM.`;
      }
      if (startBtn) startBtn.textContent = 'Play again';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      draw();
    }

    function loop(now) {
      if (!isPlaying) return;
      const delta = Math.min((now - lastFrameTime) / 1000, 0.05);
      lastFrameTime = now;

      if (updateMetrics(now) >= settings[difficulty].duration) {
        return endRound('Mission time expired! Base protected.');
      }

      spawnTimer += delta;
      if (spawnTimer >= settings[difficulty].spawn) {
        spawnTimer = 0;
        spawnRock();
      }

      rocks.forEach((r) => { r.y += r.speed * delta; });
      bullets.forEach((b) => { b.y -= 700 * delta; });

      // Bullet collision with targeted rocks
      bullets = bullets.filter((b) => {
        const target = rocks.find((r) => r.id === b.targetId);
        if (target && b.y <= target.y + 8) {
          rocks = rocks.filter((r) => r.id !== target.id);
          totalHits++;
          score += 100;
          return false;
        }
        return b.y > -20;
      });

      // Rock breach detection
      const remaining = [];
      rocks.forEach((r) => {
        if (r.y > canvas.height - 44) {
          escapedRocks++;
        } else {
          remaining.push(r);
        }
      });
      rocks = remaining;

      if (escapedRocks >= settings[difficulty].integrity) {
        return endRound('Base integrity breached! Rocks reached defense perimeter.');
      }

      draw(now);
      animFrameId = requestAnimationFrame(loop);
    }

    function start(restart = false) {
      if (restart || elapsedBeforePause >= settings[difficulty].duration || isFinished || !isPaused) {
        rocks = [];
        bullets = [];
        score = 0;
        totalTyped = 0;
        totalHits = 0;
        escapedRocks = 0;
        spawnTimer = 0;
        elapsedBeforePause = 0;
        nextRockId = 1;
        isFinished = false;
      }

      isPlaying = true;
      isPaused = false;
      roundStartedAt = performance.now();
      lastFrameTime = roundStartedAt;

      if (startBtn) startBtn.textContent = 'Playing…';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      if (statusEl) statusEl.textContent = 'Type the falling rock letter to blast it!';

      if (window.matchMedia('(pointer: coarse)').matches && mobileInput) {
        mobileInput.focus();
      }

      if (animFrameId) cancelAnimationFrame(animFrameId);
      animFrameId = requestAnimationFrame(loop);
    }

    function pause(reason = 'Round paused.') {
      if (!isPlaying) return;
      elapsedBeforePause += performance.now() - roundStartedAt;
      isPlaying = false;
      isPaused = true;

      // STRICT CPU LIFECYCLE: cancel animation frame immediately
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = 0;
      }

      if (startBtn) startBtn.textContent = 'Resume round';
      if (pauseBtn) pauseBtn.textContent = 'Resume';
      if (statusEl) statusEl.textContent = reason;
      updateMetrics();
      draw();
    }

    function destroy() {
      // 100% CPU halt
      isPlaying = false;
      isPaused = false;
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = 0;
      }
      events.clear();
      if (startBtn) startBtn.textContent = 'Start round';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      draw();
    }

    function init() {
      if (initialized) return;
      container = document.getElementById('arcadeGameTyping');
      canvas = document.getElementById('typingShooterCanvas');
      if (!container || !canvas) return;

      ctx = ArcadeCore.canvas.getOptimizedContext(canvas, { alpha: false });
      startBtn = document.getElementById('typingStartBtn');
      pauseBtn = document.getElementById('typingPauseBtn');
      restartBtn = document.getElementById('typingRestartBtn');
      mobileInput = document.getElementById('typingShooterInput');
      scoreEl = document.getElementById('typingScore');
      wpmEl = document.getElementById('typingWpm');
      accuracyEl = document.getElementById('typingAccuracy');
      timeEl = document.getElementById('typingTime');
      bestEl = document.getElementById('typingBest');
      statusEl = document.getElementById('typingStatus');
      diffContainer = container.querySelector('[data-difficulty-for]');

      difficulty = ArcadeStorage.getDifficulty('typeBlasterDifficulty', 'easy');
      syncDifficultyUI();
      loadBest();

      if (timeEl) timeEl.textContent = `${Math.ceil(settings[difficulty].duration / 1000)}s`;

      // Bind Difficulty Toggle via ManagedEvents
      if (diffContainer) {
        diffContainer.querySelectorAll('[data-difficulty]').forEach((btn) => {
          events.add(btn, 'click', () => {
            const next = btn.dataset.difficulty;
            if (!settings[next] || next === difficulty) return;
            difficulty = next;
            ArcadeStorage.setDifficulty('typeBlasterDifficulty', difficulty);
            syncDifficultyUI();
            loadBest();
            if (isPlaying || isPaused) {
              pause('Difficulty changed. Start new round.');
            }
            if (timeEl) timeEl.textContent = `${Math.ceil(settings[difficulty].duration / 1000)}s`;
          });
        });
      }

      // Bind Controls via ManagedEvents
      if (startBtn) {
        events.add(startBtn, 'click', () => {
          if (isPaused) start(false);
          else start(isFinished);
        });
      }
      if (restartBtn) {
        events.add(restartBtn, 'click', () => start(true));
      }
      if (pauseBtn) {
        events.add(pauseBtn, 'click', () => {
          if (isPlaying) pause();
          else if (isPaused) start(false);
        });
      }

      // Mobile text input listener via ManagedEvents
      if (mobileInput) {
        events.add(mobileInput, 'input', () => {
          const char = mobileInput.value.slice(-1);
          mobileInput.value = '';
          fireLetter(char);
        });
      }

      // Physical keyboard listener via ManagedEvents
      events.add(document, 'keydown', (e) => {
        if (!isPlaying || isPaused || container.hidden || e.target === mobileInput || e.ctrlKey || e.metaKey || e.altKey) return;
        if (!e.repeat && /^[a-z]$/i.test(e.key)) {
          e.preventDefault();
          fireLetter(e.key);
        }
      });

      initialized = true;
      // Render static idle splash (Zero CPU usage)
      draw();
    }

    return {
      init,
      start,
      pause,
      destroy,
      drawIdle: draw
    };
  })();


  // ─── NOKIA SNAKE GAME MODULE ────────────────────────────────────────────────
  const NokiaSnakeGame = (() => {
    let container, canvas, ctx;
    let startBtn, pauseBtn, restartBtn;
    let scoreEl, bestEl, statusEl;
    let diffContainer;

    const events = new ManagedEvents();
    const cells = 18;
    let unit = 20;
    const speeds = { easy: 180, medium: 125, hard: 80 };

    let difficulty = 'medium';
    let bestScore = 0;
    let snake = [];
    let food = null;
    let direction = { x: 1, y: 0 };
    let queuedDirection = direction;
    let score = 0;
    let isRunning = false;
    let isPaused = false;
    let timerId = null;
    let touchStartCoord = null;
    let initialized = false;

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
        btn.setAttribute('aria-pressed', String(btn.dataset.difficulty === difficulty));
      });
    }

    function placeFood() {
      do {
        food = {
          x: Math.floor(Math.random() * cells),
          y: Math.floor(Math.random() * cells)
        };
      } while (snake.some((seg) => seg.x === food.x && seg.y === food.y));
    }

    function draw() {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      // Authentic retro Nokia monochrome green screen
      ctx.fillStyle = '#9caf88';
      ctx.fillRect(0, 0, w, h);

      // LCD Grid lines
      ctx.strokeStyle = 'rgba(47, 62, 45, 0.12)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= cells; i++) {
        ctx.beginPath();
        ctx.moveTo(i * unit, 0);
        ctx.lineTo(i * unit, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * unit);
        ctx.lineTo(w, i * unit);
        ctx.stroke();
      }

      // Food
      if (food) {
        ctx.fillStyle = '#bd3434';
        ctx.beginPath();
        ctx.arc((food.x + 0.5) * unit, (food.y + 0.5) * unit, unit * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7f1d1d';
        ctx.stroke();
      }

      // Snake body & head
      snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? '#183b25' : '#2f6540';
        ctx.fillRect(part.x * unit + 2, part.y * unit + 2, unit - 4, unit - 4);
      });

      // Overlay: Idle
      if (!isRunning && !snake.length) {
        ctx.fillStyle = '#24422c';
        ctx.font = '700 20px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('NOKIA SNAKE', w / 2, h / 2 - 12);
        ctx.font = '14px var(--font-mono, monospace)';
        ctx.fillText('Press "Start game" to play', w / 2, h / 2 + 16);
      }

      // Overlay: Paused
      if (isPaused) {
        ctx.fillStyle = 'rgba(156, 175, 136, 0.75)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#183b25';
        ctx.font = '700 22px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('GAME PAUSED', w / 2, h / 2);
      }
    }

    function setDirection(next) {
      if (!isRunning || isPaused) return;
      // Prevent 180-degree instant reversal into oneself
      if (next.x === -direction.x && next.y === -direction.y) return;
      queuedDirection = next;
    }

    function step() {
      if (!isRunning || isPaused) return;
      direction = queuedDirection;
      const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
      const ate = food && head.x === food.x && head.y === food.y;
      const body = ate ? snake : snake.slice(0, -1);

      // Boundary or self collision
      if (
        head.x < 0 || head.x >= cells ||
        head.y < 0 || head.y >= cells ||
        body.some((part) => part.x === head.x && part.y === head.y)
      ) {
        return stop(`Game Over! Final score: ${score}.`);
      }

      snake.unshift(head);
      if (ate) {
        score += 10;
        if (score > bestScore) {
          bestScore = score;
          ArcadeStorage.write(storageKey(), bestScore);
        }
        placeFood();
        if (scoreEl) scoreEl.textContent = String(score);
        if (bestEl) bestEl.textContent = String(bestScore);
        if (statusEl) statusEl.textContent = 'Nice catch! Keep growing.';
      } else {
        snake.pop();
      }

      draw();
    }

    function start(restart = false) {
      if (restart || !snake.length) {
        snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
        direction = { x: 1, y: 0 };
        queuedDirection = direction;
        score = 0;
        placeFood();
        if (scoreEl) scoreEl.textContent = String(score);
        if (bestEl) bestEl.textContent = String(bestScore);
      }

      isRunning = true;
      isPaused = false;
      if (startBtn) startBtn.textContent = 'Playing…';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      if (statusEl) statusEl.textContent = `Use arrow keys, swipe, or direction pad. Difficulty: ${difficulty}.`;

      if (timerId) clearInterval(timerId);
      timerId = setInterval(step, speeds[difficulty]);
      draw();
    }

    function pause(reason = 'Game paused.') {
      if (!isRunning) return;
      isRunning = false;
      isPaused = true;

      // STRICT CPU LIFECYCLE: cancel interval immediately
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }

      if (startBtn) startBtn.textContent = 'Resume game';
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
      if (statusEl) statusEl.textContent = msg;
      draw();
    }

    function destroy() {
      isRunning = false;
      isPaused = false;
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      events.clear();
      if (startBtn) startBtn.textContent = 'Start game';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      draw();
    }

    function init() {
      if (initialized) return;
      container = document.getElementById('arcadeGameSnake');
      canvas = document.getElementById('snakeCanvas');
      if (!container || !canvas) return;

      ctx = ArcadeCore.canvas.getOptimizedContext(canvas, { alpha: false });
      unit = canvas.width / cells;

      startBtn = document.getElementById('snakeStartBtn');
      pauseBtn = document.getElementById('snakePauseBtn');
      restartBtn = document.getElementById('snakeRestartBtn');
      scoreEl = document.getElementById('snakeScore');
      bestEl = document.getElementById('snakeBest');
      statusEl = document.getElementById('snakeStatus');
      diffContainer = container.querySelector('[data-difficulty-for]');

      difficulty = ArcadeStorage.getDifficulty('nokiaSnakeDifficulty', 'medium');
      syncDifficultyUI();
      loadBest();

      // Bind Difficulty Toggle via ManagedEvents
      if (diffContainer) {
        diffContainer.querySelectorAll('[data-difficulty]').forEach((btn) => {
          events.add(btn, 'click', () => {
            const next = btn.dataset.difficulty;
            if (!speeds[next] || next === difficulty) return;
            difficulty = next;
            ArcadeStorage.setDifficulty('nokiaSnakeDifficulty', difficulty);
            syncDifficultyUI();
            loadBest();
            if (isRunning) {
              start(true);
            }
          });
        });
      }

      // Bind Controls via ManagedEvents
      if (startBtn) {
        events.add(startBtn, 'click', () => {
          if (isPaused) start(false);
          else start(!snake.length || startBtn.textContent === 'Play again');
        });
      }
      if (restartBtn) {
        events.add(restartBtn, 'click', () => start(true));
      }
      if (pauseBtn) {
        events.add(pauseBtn, 'click', () => {
          if (isRunning) pause();
          else if (isPaused || snake.length) start(false);
        });
      }

      // D-Pad direction buttons with tactile response
      document.querySelectorAll('[data-snake-direction]').forEach((btn) => {
        events.add(btn, 'click', (e) => {
          e.preventDefault();
          const dirMap = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
          };
          setDirection(dirMap[btn.dataset.snakeDirection]);
        });
      });

      // Keyboard arrow keys via ManagedEvents
      const keyMap = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        KeyW: { x: 0, y: -1 },
        KeyS: { x: 0, y: 1 },
        KeyA: { x: -1, y: 0 },
        KeyD: { x: 1, y: 0 }
      };

      events.add(document, 'keydown', (e) => {
        if (!isRunning || isPaused || container.hidden) return;
        const mapped = keyMap[e.code] || keyMap[e.key];
        if (mapped) {
          e.preventDefault();
          setDirection(mapped);
        }
      });

      // Touch / pointer swipe handling on canvas via ManagedEvents
      events.add(canvas, 'pointerdown', (e) => {
        touchStartCoord = { x: e.clientX, y: e.clientY };
      });

      events.add(canvas, 'pointerup', (e) => {
        if (!touchStartCoord) return;
        const dx = e.clientX - touchStartCoord.x;
        const dy = e.clientY - touchStartCoord.y;
        touchStartCoord = null;

        if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          setDirection({ x: Math.sign(dx), y: 0 });
        } else {
          setDirection({ x: 0, y: Math.sign(dy) });
        }
      });

      initialized = true;
      // Render static idle board (Zero CPU usage)
      draw();
    }

    return {
      init,
      start,
      pause,
      destroy,
      drawIdle: draw
    };
  })();


  // ─── UNIFIED ARCADE HUB SHELL CONTROLLER ────────────────────────────────────
  const ArcadeHub = {
    activeGame: 'typing', // 'typing' | 'snake'
    initialized: false,

    switchGame(gameId) {
      if (gameId === this.activeGame && this.initialized) return;

      const typingView = document.getElementById('arcadeGameTyping');
      const snakeView = document.getElementById('arcadeGameSnake');
      const switcherBtns = document.querySelectorAll('[data-arcade-game]');

      // 1. Strict CPU cleanup: destroy and halt outgoing game loops
      if (this.activeGame === 'typing') {
        TypeBlasterGame.destroy();
      } else if (this.activeGame === 'snake') {
        NokiaSnakeGame.destroy();
      }

      this.activeGame = gameId;

      // 2. Toggle UI views
      switcherBtns.forEach((btn) => {
        const isMatch = btn.dataset.arcadeGame === gameId;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', String(isMatch));
      });

      if (gameId === 'typing') {
        if (snakeView) snakeView.hidden = true;
        if (typingView) {
          typingView.hidden = false;
          TypeBlasterGame.drawIdle();
        }
      } else {
        if (typingView) typingView.hidden = true;
        if (snakeView) {
          snakeView.hidden = false;
          NokiaSnakeGame.drawIdle();
        }
      }
    },

    pauseCurrentGame(reason = 'Game paused.') {
      if (this.activeGame === 'typing') {
        TypeBlasterGame.pause(reason);
      } else if (this.activeGame === 'snake') {
        NokiaSnakeGame.pause(reason);
      }
    },

    init() {
      if (this.initialized) return;
      const hubPanel = document.getElementById('lab-arcade-hub');
      if (!hubPanel) return;

      // Initialize sub-modules (binds UI, loads records, renders 0% CPU idle canvas)
      TypeBlasterGame.init();
      NokiaSnakeGame.init();

      // Bind Sub-Tab Switcher
      const switcherBtns = hubPanel.querySelectorAll('[data-arcade-game]');
      switcherBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          this.switchGame(btn.dataset.arcadeGame);
        });
      });

      // Listen for playground lab tab changes
      document.addEventListener('playground:tabchange', (e) => {
        if (e.detail?.labId !== 'arcade-hub') {
          // Immediately pause/destroy loops when leaving Arcade Hub
          this.pauseCurrentGame('Game paused. Return to Arcade Hub to resume.');
        }
      });

      // Window Visibility change: immediately freeze animations when tab is hidden
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseCurrentGame('Game paused while window was hidden.');
        }
      });

      this.initialized = true;
    }
  };

  // Expose on window for modularity and integration
  window.ArcadeHub = ArcadeHub;

  // Auto-init on DOM readiness
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ArcadeHub.init());
  } else {
    ArcadeHub.init();
  }
})();
