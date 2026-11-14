/**
 * Interactive labs for playground.html: sorting visualizer, typewriter,
 * plus two touch-friendly browser games.
 */
(() => {
  const DIFFICULTIES = ['easy', 'medium', 'hard'];

  function readScore(key) {
    try {
      return Number.parseInt(localStorage.getItem(key) || '0', 10) || 0;
    } catch (error) {
      console.warn('Unable to read saved score:', error);
      return 0;
    }
  }

  function writeScore(key, value) {
    try {
      localStorage.setItem(key, String(value));
      return true;
    } catch (error) {
      console.warn('Unable to save score:', error);
      return false;
    }
  }

  function bindDifficulty(labId, storageKey, onChange, defaultDifficulty = 'medium') {
    const root = document.querySelector(`[data-difficulty-for="${labId}"]`);
    let current = defaultDifficulty;
    try {
      const saved = localStorage.getItem(storageKey);
      if (DIFFICULTIES.includes(saved)) current = saved;
    } catch (error) {
      console.warn('Unable to read saved difficulty:', error);
    }

    function sync() {
      root?.querySelectorAll('[data-difficulty]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.difficulty === current));
      });
    }

    root?.querySelectorAll('[data-difficulty]').forEach((button) => {
      button.addEventListener('click', () => {
        const next = button.dataset.difficulty;
        if (!DIFFICULTIES.includes(next) || next === current) return;
        current = next;
        try { localStorage.setItem(storageKey, current); } catch (_) {}
        sync();
        onChange(current);
      });
    });
    sync();
    return { get value() { return current; } };
  }

  function initLabTabs() {
    const tabs = [...document.querySelectorAll('.playground-tab')];
    const panels = [...document.querySelectorAll('[data-lab-panel]')];
    if (!tabs.length || !panels.length) return;

    function activate(labId) {
      tabs.forEach((tab) => {
        const active = tab.dataset.lab === labId;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel) => {
        const active = panel.dataset.labPanel === labId;
        panel.hidden = !active;
        panel.classList.toggle('is-visible', active);
      });
      document.dispatchEvent(new CustomEvent('playground:tabchange', { detail: { labId } }));
    }

    tabs.forEach((tab, index) => {
      const panel = panels.find((item) => item.dataset.labPanel === tab.dataset.lab);
      if (panel) {
        tab.setAttribute('aria-controls', panel.id);
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id || `playground-tab-${index}`);
        if (!tab.id) tab.id = `playground-tab-${index}`;
      }

      tab.addEventListener('keydown', (event) => {
        let nextIndex = index;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = tabs.length - 1;
        else return;

        event.preventDefault();
        activate(tabs[nextIndex].dataset.lab);
        tabs[nextIndex].focus();
      });

      tab.addEventListener('click', () => activate(tab.dataset.lab));
    });

    const activeTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
    activate(activeTab.dataset.lab);
  }

  function initSortLab() {
    const stage = document.getElementById('sortStage');
    const status = document.getElementById('sortStatus');
    const shuffleBtn = document.getElementById('sortShuffle');
    const runBtn = document.getElementById('sortRun');
    if (!stage || !status || !shuffleBtn || !runBtn) return;

    let values = [];
    let running = false;
    let cancelSort = false;
    const BAR_COUNT = 24;

    function render(highlight = {}) {
      stage.replaceChildren();
      const max = Math.max(...values, 1);
      values.forEach((value, index) => {
        const bar = document.createElement('div');
        bar.className = 'sort-bar';
        if (highlight.compare?.includes(index)) bar.classList.add('is-compare');
        if (highlight.swap?.includes(index)) bar.classList.add('is-swap');
        if (highlight.sorted) bar.classList.add('is-sorted');
        bar.style.height = `${Math.max(8, (value / max) * 100)}%`;
        bar.title = String(value);
        stage.appendChild(bar);
      });
    }

    function shuffle() {
      if (running) {
        cancelSort = true;
        return;
      }
      cancelSort = false;
      values = Array.from({ length: BAR_COUNT }, () => 12 + Math.floor(Math.random() * 88));
      render();
      status.textContent = 'Shuffled. Click Run sort to begin.';
    }

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function bubbleSort() {
      if (running) return;
      running = true;
      cancelSort = false;
      runBtn.disabled = true;
      shuffleBtn.textContent = 'Stop sort';
      status.textContent = 'Sorting…';

      const arr = values.slice();
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      try {
        for (let i = 0; i < arr.length - 1; i++) {
          for (let j = 0; j < arr.length - i - 1; j++) {
            if (cancelSort) {
              status.textContent = 'Sort stopped. Click Shuffle to reset.';
              return;
            }
            render({ compare: [j, j + 1] });
            await sleep(reducedMotion ? 0 : 35);
            if (cancelSort) {
              status.textContent = 'Sort stopped. Click Shuffle to reset.';
              return;
            }
            if (arr[j] > arr[j + 1]) {
              [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
              values = arr.slice();
              render({ swap: [j, j + 1] });
              await sleep(reducedMotion ? 0 : 45);
            }
          }
        }

        values = arr;
        render({ sorted: true });
        status.textContent = 'Sorted.';
      } catch (error) {
        console.error('Unable to complete the sorting visualization:', error);
        status.textContent = 'The sort could not finish. Shuffle the bars and try again.';
      } finally {
        running = false;
        runBtn.disabled = false;
        shuffleBtn.textContent = 'Shuffle';
      }
    }

    shuffleBtn.addEventListener('click', shuffle);
    runBtn.addEventListener('click', bubbleSort);
    document.addEventListener('playground:tabchange', (event) => {
      if (event.detail.labId !== 'sort' && running) {
        cancelSort = true;
      }
    });
    shuffle();
  }

  function initTypewriterLab() {
    const input = document.getElementById('typeInput');
    const textEl = document.getElementById('typeText');
    const replayBtn = document.getElementById('typeReplay');
    if (!input || !textEl || !replayBtn) return;

    let timer = null;
    let index = 0;
    let deleting = false;
    let phrase = input.value;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      textEl.textContent = phrase;
      input.addEventListener('input', () => {
        phrase = input.value.trim() || 'I write code. I ship websites.';
        textEl.textContent = phrase;
      });
      replayBtn.addEventListener('click', () => {
        phrase = input.value.trim() || 'I write code. I ship websites.';
        textEl.textContent = phrase;
      });
      return;
    }

    function tick() {
      const full = phrase || ' ';
      if (!deleting) {
        index += 1;
        textEl.textContent = full.slice(0, index);
        if (index >= full.length) {
          deleting = true;
          timer = setTimeout(tick, 1200);
          return;
        }
      } else {
        index -= 1;
        textEl.textContent = full.slice(0, Math.max(0, index));
        if (index <= 0) {
          deleting = false;
          timer = setTimeout(tick, 400);
          return;
        }
      }
      timer = setTimeout(tick, deleting ? 28 : 55);
    }

    function restart() {
      clearTimeout(timer);
      phrase = input.value.trim() || 'I write code. I ship websites.';
      index = 0;
      deleting = false;
      textEl.textContent = '';
      tick();
    }

    replayBtn.addEventListener('click', restart);
    input.addEventListener('input', restart);
    restart();

    document.addEventListener('playground:tabchange', (event) => {
      if (event.detail?.labId !== 'typewriter') {
        clearTimeout(timer);
        timer = null;
      } else if (!timer) {
        restart();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearTimeout(timer);
        timer = null;
      }
    });
  }

  function initMemoryGame() {
    const grid = document.getElementById('memoryGrid');
    const resetBtn = document.getElementById('memoryReset');
    const quitBtn = document.getElementById('memoryQuit');
    const movesEl = document.getElementById('memoryMoves');
    const timeEl = document.getElementById('memoryTime');
    const bestEl = document.getElementById('memoryBest');
    const status = document.getElementById('memoryStatus');
    if (!grid || !resetBtn || !movesEl || !timeEl || !bestEl || !status) return;

    const symbols = [
      { icon: '✦', label: 'star' },
      { icon: '⌘', label: 'command' },
      { icon: '⚡', label: 'lightning bolt' },
      { icon: '◈', label: 'diamond' },
      { icon: '☼', label: 'sun' },
      { icon: '✿', label: 'flower' },
      { icon: '▲', label: 'triangle' },
      { icon: '♥', label: 'heart' },
    ];
    const pairCounts = { easy: 4, medium: 6, hard: 8 };
    let difficulty = 'medium';
    function memoryScoreKey() { return `memory-match-best:${difficulty}`; }
    let cards = [];
    let firstIndex = null;
    let locked = false;
    let moves = 0;
    let startedAt = 0;
    let elapsedMs = 0;
    let timerId = null;
    let revealTimer = null;
    let bestMoves = 0;

    function loadBestMoves() {
      bestMoves = readScore(memoryScoreKey());
      if (!bestMoves && difficulty === 'medium') bestMoves = readScore('memory-match-best');
    }
    difficulty = bindDifficulty('memory', 'memoryMatchDifficulty', (next) => {
      difficulty = next;
      loadBestMoves();
      newGame();
    }).value;
    loadBestMoves();

    function shuffle(deck) {
      for (let index = deck.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
      }
      return deck;
    }

    function formatTime(milliseconds) {
      const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
      return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
    }

    function updateTime() {
      const currentElapsed = elapsedMs + (startedAt ? Date.now() - startedAt : 0);
      timeEl.textContent = formatTime(currentElapsed);
    }

    function render() {
      grid.replaceChildren();
      cards.forEach((card, index) => {
        const button = document.createElement('button');
        const isVisible = card.revealed || card.matched;
        button.type = 'button';
        button.className = 'memory-card';
        button.classList.toggle('is-revealed', card.revealed && !card.matched);
        button.classList.toggle('is-matched', card.matched);
        button.textContent = card.icon;
        button.setAttribute('aria-label', isVisible ? `${card.label}, ${card.matched ? 'matched' : 'revealed'}` : 'Hidden memory card');
        button.setAttribute('aria-pressed', String(isVisible));
        button.disabled = locked || card.matched;
        button.addEventListener('click', () => revealCard(index));
        grid.appendChild(button);
      });
    }

    function completeGame() {
      window.clearInterval(timerId);
      elapsedMs += Date.now() - startedAt;
      startedAt = 0;
      updateTime();
      const isNewBest = !bestMoves || moves < bestMoves;
      if (isNewBest) {
        bestMoves = moves;
        writeScore(memoryScoreKey(), bestMoves);
      }
      bestEl.textContent = String(bestMoves);
      status.textContent = isNewBest
        ? `You matched every pair in ${moves} moves — a new best!`
        : `All pairs matched in ${moves} moves. Start a new game to try again.`;
    }

    function revealCard(index) {
      if (locked || cards[index].revealed || cards[index].matched) return;
      if (!startedAt) {
        startedAt = Date.now();
        timerId = window.setInterval(updateTime, 1000);
      }

      cards[index].revealed = true;
      if (firstIndex === null) {
        firstIndex = index;
        status.textContent = 'Choose one more card to find its match.';
        render();
        return;
      }

      moves += 1;
      movesEl.textContent = String(moves);
      const firstCard = cards[firstIndex];
      const secondCard = cards[index];
      if (firstCard.icon === secondCard.icon) {
        firstCard.matched = true;
        secondCard.matched = true;
        firstIndex = null;
        render();
        if (cards.every((card) => card.matched)) completeGame();
        else status.textContent = 'Match found! Choose another card.';
        return;
      }

      locked = true;
      status.textContent = 'Not a match — take another look.';
      render();
      revealTimer = window.setTimeout(() => {
        firstCard.revealed = false;
        secondCard.revealed = false;
        firstIndex = null;
        locked = false;
        revealTimer = null;
        status.textContent = 'Choose two cards to find a match.';
        render();
      }, 720);
    }

    function newGame() {
      window.clearInterval(timerId);
      window.clearTimeout(revealTimer);
      const deck = symbols.slice(0, pairCounts[difficulty] || 6);
      cards = shuffle([...deck, ...deck].map((symbol, index) => ({
        ...symbol,
        id: `${symbol.label}-${index}`,
        revealed: false,
        matched: false,
      })));
      firstIndex = null;
      locked = false;
      moves = 0;
      startedAt = 0;
      elapsedMs = 0;
      movesEl.textContent = '0';
      timeEl.textContent = '0:00';
      bestEl.textContent = bestMoves ? String(bestMoves) : '—';
      status.textContent = `Find all ${pairCounts[difficulty]} pairs on ${difficulty}. The timer starts on your first reveal.`;
      render();
    }

    function quitMemoryMatch() {
      window.clearInterval(timerId);
      window.clearTimeout(revealTimer);
      startedAt = 0;
      elapsedMs = 0;
      locked = true;
      firstIndex = null;
      cards.forEach((card) => {
        if (!card.matched) card.revealed = false;
      });
      render();
      timeEl.textContent = '0:00';
      status.textContent = 'Game quit. Click New game to play again.';
    }

    quitBtn?.addEventListener('click', quitMemoryMatch);
    resetBtn.addEventListener('click', newGame);
    document.addEventListener('playground:tabchange', (event) => {
      if (event.detail.labId === 'memory') return;
      if (startedAt) {
        elapsedMs += Date.now() - startedAt;
        startedAt = 0;
        window.clearInterval(timerId);
        updateTime();
        status.textContent = 'Memory Match paused. Return to the game when you are ready.';
      }
      if (!revealTimer) return;
      window.clearTimeout(revealTimer);
      revealTimer = null;
      if (firstIndex !== null && !cards[firstIndex].matched) cards[firstIndex].revealed = false;
      cards.forEach((card) => { if (!card.matched) card.revealed = false; });
      firstIndex = null;
      locked = false;
      render();
    });
    newGame();
  }


  /* ============================================================
     CYBER DEFENDER: SPACE SHOOTER (Canvas Arcade Game)
     ============================================================ */
  function initShooterGame() {
    const canvas = document.getElementById('shooterCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startBtn = document.getElementById('shooterStartBtn');
    const pauseBtn = document.getElementById('shooterPauseBtn');
    const quitBtn = document.getElementById('shooterQuitBtn');
    const soundBtn = document.getElementById('shooterSoundBtn');
    const scoreEl = document.getElementById('shooterScore');
    const shieldsEl = document.getElementById('shooterShields');
    const waveEl = document.getElementById('shooterWave');
    const highScoreEl = document.getElementById('shooterHighScore');
    const touchLeftBtn = document.getElementById('touchLeftBtn');
    const touchRightBtn = document.getElementById('touchRightBtn');
    const touchFireBtn = document.getElementById('touchFireBtn');

    // Audio synthesizer using Web Audio API
    let audioCtx = null;
    let soundEnabled = true;

    function getAudio() {
      if (!soundEnabled) return null;
      if (!audioCtx) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass) audioCtx = new AudioClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    function playSound(type) {
      if (!soundEnabled) return;
      const ctxA = getAudio();
      if (!ctxA) return;
      const now = ctxA.currentTime;

      if (type === 'laser') {
        const osc = ctxA.createOscillator();
        const gain = ctxA.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctxA.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'hit') {
        const osc = ctxA.createOscillator();
        const gain = ctxA.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctxA.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'powerup') {
        const osc = ctxA.createOscillator();
        const gain = ctxA.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(440, now + 0.08);
        osc.frequency.setValueAtTime(660, now + 0.16);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(ctxA.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'gameover') {
        const osc = ctxA.createOscillator();
        const gain = ctxA.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.55);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.connect(gain);
        gain.connect(ctxA.destination);
        osc.start(now);
        osc.stop(now + 0.55);
      }
    }

    const difficultySettings = {
      easy: { speedMul: 0.72, spawn: 1.75, shields: 5, waveMul: 8 },
      medium: { speedMul: 1, spawn: 1.4, shields: 3, waveMul: 12 },
      hard: { speedMul: 1.4, spawn: 0.82, shields: 2, waveMul: 20 },
    };
    let difficulty = 'medium';
    function shooterScoreKey() { return `cyberDefenderHighScore:${difficulty}`; }
    let highScore = 0;
    function loadHighScore() {
      highScore = readScore(shooterScoreKey());
      if (!highScore && difficulty === 'medium') highScore = readScore('cyberDefenderHighScore');
    }
    const difficultyControl = bindDifficulty('shooter', 'cyberDefenderDifficulty', (next) => {
      difficulty = next;
      loadHighScore();
      updateUI();
      if (state === 'running' || state === 'paused') quitGame();
    });
    difficulty = difficultyControl.value;
    loadHighScore();
    if (highScoreEl) highScoreEl.textContent = String(highScore);

    // Game state
    let state = 'idle'; // 'idle', 'running', 'paused', 'gameover'
    let score = 0;
    let shields = difficultySettings[difficulty].shields;
    let wave = 1;
    let animId = null;
    let lastTime = 0;
    let spawnTimer = 0;
    let fireCooldown = 0;

    // Player
    const player = {
      x: canvas.width / 2,
      y: canvas.height - 45,
      width: 38,
      height: 38,
      speed: 380,
      movingLeft: false,
      movingRight: false,
      tripleShotTimer: 0,
    };

    // Arrays
    let lasers = [];
    let enemies = [];
    let particles = [];
    let powerups = [];

    // Background Stars
    const stars = [];
    for (let i = 0; i < 75; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.8,
        speed: Math.random() * 60 + 25,
        opacity: Math.random() * 0.7 + 0.3,
      });
    }

    function resetGame() {
      score = 0;
      shields = difficultySettings[difficulty].shields;
      wave = 1;
      player.x = canvas.width / 2;
      player.tripleShotTimer = 0;
      lasers = [];
      enemies = [];
      particles = [];
      powerups = [];
      spawnTimer = 0;
      updateUI();
    }

    function updateUI() {
      if (scoreEl) scoreEl.textContent = String(score);
      if (waveEl) waveEl.textContent = String(wave);
      if (shieldsEl) {
        let s = '';
        for (let i = 0; i < shields; i++) s += '🛡️ ';
        shieldsEl.textContent = s.trim() || '💥 Critical';
      }
      if (highScoreEl) highScoreEl.textContent = String(highScore);
    }

    function fireLaser() {
      if (state !== 'running') return;
      if (fireCooldown > 0) return;

      const isTriple = player.tripleShotTimer > 0;
      if (isTriple) {
        lasers.push({ x: player.x, y: player.y - 18, vx: 0, vy: -650 });
        lasers.push({ x: player.x - 12, y: player.y - 14, vx: -110, vy: -620 });
        lasers.push({ x: player.x + 12, y: player.y - 14, vx: 110, vy: -620 });
      } else {
        lasers.push({ x: player.x, y: player.y - 18, vx: 0, vy: -640 });
      }

      fireCooldown = isTriple ? 0.13 : 0.18;
      playSound('laser');
    }

    function spawnExplosion(x, y, color = '#38bdf8', count = 16) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 180 + 40;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3 + 1.5,
          color,
          life: 0.45,
          maxLife: 0.45,
        });
      }
    }

    function spawnEnemy() {
      const typeRand = Math.random();
      const isAsteroid = typeRand < 0.35;
      const speed = (70 + (wave * difficultySettings[difficulty].waveMul) + (Math.random() * 40)) * difficultySettings[difficulty].speedMul;

      enemies.push({
        x: Math.random() * (canvas.width - 50) + 25,
        y: -30,
        width: isAsteroid ? 30 : 34,
        height: isAsteroid ? 30 : 28,
        speed,
        hp: isAsteroid ? 2 : 1,
        type: isAsteroid ? 'asteroid' : 'scout',
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 4,
      });
    }

    // Input handlers (Keyboard)
    window.addEventListener('keydown', (e) => {
      if (state !== 'running') return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        player.movingLeft = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        player.movingRight = true;
      } else if (e.code === 'Space') {
        e.preventDefault();
        fireLaser();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') player.movingLeft = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') player.movingRight = false;
    });

    // Touch & Mouse direct aim / drag
    function handlePointerMove(e) {
      if (state !== 'running') return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const scaleX = canvas.width / rect.width;
      const targetX = (clientX - rect.left) * scaleX;
      player.x = Math.max(25, Math.min(canvas.width - 25, targetX));
    }

    canvas.addEventListener('mousemove', (e) => {
      if (e.buttons === 1) handlePointerMove(e);
    });
    canvas.addEventListener('mousedown', (e) => {
      if (state === 'idle' || state === 'gameover') {
        startGame();
        return;
      }
      handlePointerMove(e);
      fireLaser();
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handlePointerMove(e);
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
      if (state === 'idle' || state === 'gameover') {
        startGame();
        return;
      }
      handlePointerMove(e);
      fireLaser();
    }, { passive: true });

    // Mobile Virtual Touch Buttons
    if (touchLeftBtn) {
      touchLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); player.movingLeft = true; });
      touchLeftBtn.addEventListener('touchend', () => { player.movingLeft = false; });
      touchLeftBtn.addEventListener('mousedown', () => { player.movingLeft = true; });
      touchLeftBtn.addEventListener('mouseup', () => { player.movingLeft = false; });
    }
    if (touchRightBtn) {
      touchRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); player.movingRight = true; });
      touchRightBtn.addEventListener('touchend', () => { player.movingRight = false; });
      touchRightBtn.addEventListener('mousedown', () => { player.movingRight = true; });
      touchRightBtn.addEventListener('mouseup', () => { player.movingRight = false; });
    }
    if (touchFireBtn) {
      touchFireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); fireLaser(); });
      touchFireBtn.addEventListener('mousedown', () => { fireLaser(); });
    }

    // Button controls
    function startGame() {
      resetGame();
      state = 'running';
      if (startBtn) startBtn.textContent = 'Restart';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      lastTime = performance.now();
      if (!animId) loop(lastTime);
    }

    function togglePause() {
      if (state === 'running') {
        state = 'paused';
        if (pauseBtn) pauseBtn.textContent = 'Resume';
      } else if (state === 'paused') {
        state = 'running';
        if (pauseBtn) pauseBtn.textContent = 'Pause';
        lastTime = performance.now();
        loop(lastTime);
      }
    }

    function quitGame() {
      state = 'idle';
      resetGame();
      if (startBtn) startBtn.textContent = 'Start Mission';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      renderIdleScreen();
    }

    if (startBtn) startBtn.addEventListener('click', startGame);
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    if (quitBtn) quitBtn.addEventListener('click', quitGame);

    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundBtn.textContent = soundEnabled ? '🔊 Sound' : '🔇 Muted';
      });
    }

    // Pause game when switching away from playground tab
    document.addEventListener('playground:tabchange', (e) => {
      if (e.detail && e.detail.labId !== 'shooter' && state === 'running') {
        togglePause();
      }
    });

    // Game Over Handler
    function handleGameOver() {
      state = 'gameover';
      playSound('gameover');
      if (score > highScore) {
        highScore = score;
        writeScore(shooterScoreKey(), highScore);
      }
      updateUI();
      if (startBtn) startBtn.textContent = 'Play Again';
    }

    // Game Loop
    function loop(now) {
      if (state !== 'running') {
        render();
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Update cooldowns
      if (fireCooldown > 0) fireCooldown -= dt;
      if (player.tripleShotTimer > 0) player.tripleShotTimer -= dt;

      // Update player position
      if (player.movingLeft) player.x -= player.speed * dt;
      if (player.movingRight) player.x += player.speed * dt;
      player.x = Math.max(22, Math.min(canvas.width - 22, player.x));

      // Stars
      for (const s of stars) {
        s.y += s.speed * dt;
        if (s.y > canvas.height) {
          s.y = 0;
          s.x = Math.random() * canvas.width;
        }
      }

      // Spawning enemies
      spawnTimer += dt;
      const spawnInterval = Math.max(0.35, difficultySettings[difficulty].spawn - (wave * 0.08));
      if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        spawnEnemy();
      }

      // Update Lasers
      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.x += l.vx * dt;
        l.y += l.vy * dt;
        if (l.y < -20 || l.x < -10 || l.x > canvas.width + 10) {
          lasers.splice(i, 1);
        }
      }

      // Update Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.y += e.speed * dt;
        e.rotation += e.rotSpeed * dt;

        // Check laser collision
        let hit = false;
        for (let j = lasers.length - 1; j >= 0; j--) {
          const l = lasers[j];
          const dist = Math.hypot(e.x - l.x, e.y - l.y);
          if (dist < (e.width / 2 + 6)) {
            lasers.splice(j, 1);
            e.hp -= 1;
            hit = true;
            if (e.hp <= 0) break;
          }
        }

        if (hit && e.hp <= 0) {
          spawnExplosion(e.x, e.y, e.type === 'asteroid' ? '#fbbf24' : '#ef4444', 18);
          playSound('hit');
          score += (e.type === 'asteroid' ? 25 : 15);

          // Chance to drop power-up
          if (Math.random() < 0.14) {
            powerups.push({
              x: e.x,
              y: e.y,
              type: Math.random() < 0.65 ? 'triple' : 'shield',
              speed: 90,
            });
          }

          // Wave check
          const nextWave = Math.floor(score / 150) + 1;
          if (nextWave > wave) {
            wave = nextWave;
            playSound('powerup');
          }

          enemies.splice(i, 1);
          updateUI();
          continue;
        }

        // Check player collision
        const distToPlayer = Math.hypot(e.x - player.x, e.y - player.y);
        if (distToPlayer < (e.width / 2 + player.width / 2 - 4)) {
          spawnExplosion(e.x, e.y, '#ef4444', 22);
          enemies.splice(i, 1);
          shields -= 1;
          playSound('hit');
          updateUI();
          if (shields <= 0) {
            handleGameOver();
            break;
          }
          continue;
        }

        // Escaped bottom edge
        if (e.y > canvas.height + 40) {
          enemies.splice(i, 1);
        }
      }

      // Update Powerups
      for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.y += p.speed * dt;
        const distToPlayer = Math.hypot(p.x - player.x, p.y - player.y);
        if (distToPlayer < (player.width / 2 + 15)) {
          if (p.type === 'triple') {
            player.tripleShotTimer = 9.0;
          } else if (p.type === 'shield') {
            shields = Math.min(4, shields + 1);
          }
          playSound('powerup');
          spawnExplosion(p.x, p.y, '#10b981', 12);
          powerups.splice(i, 1);
          updateUI();
          continue;
        }
        if (p.y > canvas.height + 20) powerups.splice(i, 1);
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      render();
      animId = requestAnimationFrame(loop);
    }

    // Render Canvas
    function render() {
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      for (const s of stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Powerups
      for (const p of powerups) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.type === 'triple' ? '#fbbf24' : '#10b981';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.type === 'triple' ? '3x' : '+', 0, 0);
        ctx.restore();
      }

      // Draw Lasers
      for (const l of lasers) {
        ctx.save();
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fillRect(l.x - 2.5, l.y - 12, 5, 14);
        ctx.restore();
      }

      // Draw Enemies
      for (const e of enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.rotation);

        if (e.type === 'asteroid') {
          ctx.fillStyle = '#94a3b8';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          const r = e.width / 2;
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          // Alien scout ship
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, 16);
          ctx.lineTo(-14, -14);
          ctx.lineTo(0, -6);
          ctx.lineTo(14, -14);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw Particles
      for (const p of particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Draw Player Ship (if playing or paused)
      if (state === 'running' || state === 'paused') {
        ctx.save();
        ctx.translate(player.x, player.y);

        // Thruster flame
        ctx.fillStyle = Math.random() < 0.5 ? '#f97316' : '#eab308';
        ctx.beginPath();
        ctx.moveTo(-6, 12);
        ctx.lineTo(6, 12);
        ctx.lineTo(0, 20 + Math.random() * 8);
        ctx.closePath();
        ctx.fill();

        // Ship hull
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(16, 12);
        ctx.lineTo(0, 5);
        ctx.lineTo(-16, 12);
        ctx.closePath();
        ctx.fill();

        // Triple shot active glow
        if (player.tripleShotTimer > 0) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Overlays
      if (state === 'idle') {
        renderIdleScreen();
      } else if (state === 'paused') {
        ctx.fillStyle = 'rgba(6, 10, 18, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 24px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION PAUSED', canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '14px var(--font-sans, sans-serif)';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Click Resume or press P to continue', canvas.width / 2, canvas.height / 2 + 25);
      } else if (state === 'gameover') {
        ctx.fillStyle = 'rgba(6, 10, 18, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 28px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION FAILED', canvas.width / 2, canvas.height / 2 - 35);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px var(--font-sans, sans-serif)';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 5);

        ctx.fillStyle = '#fbbf24';
        ctx.font = '14px var(--font-mono, monospace)';
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 32);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '14px var(--font-sans, sans-serif)';
        ctx.fillText('Tap or Click Start Mission to Try Again', canvas.width / 2, canvas.height / 2 + 65);
      }
    }

    function renderIdleScreen() {
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.font = 'bold 28px var(--font-mono, monospace)';
      ctx.textAlign = 'center';
      ctx.fillText('🚀 CYBER DEFENDER', canvas.width / 2, canvas.height / 2 - 40);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px var(--font-sans, sans-serif)';
      ctx.fillText('Laptop: A / D or Arrows to Move · Space to Fire', canvas.width / 2, canvas.height / 2);
      ctx.fillText('Mobile: Touch & Drag Ship · Tap FIRE Button', canvas.width / 2, canvas.height / 2 + 25);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 15px var(--font-sans, sans-serif)';
      ctx.fillText('Click [Start Mission] or Tap Canvas to Launch', canvas.width / 2, canvas.height / 2 + 65);
    }

    // Initial render
    renderIdleScreen();
  }

  function initPlayground() {
    const lazyInits = {
      shooter: initShooterGame,
      sort: initSortLab,
      typewriter: initTypewriterLab,
      memory: initMemoryGame,
      'arcade-hub': () => window.ArcadeHub?.init(),
    };
    const started = Object.create(null);
    document.addEventListener('playground:tabchange', (event) => {
      const labId = event.detail?.labId;
      if (!labId || started[labId] || !lazyInits[labId]) return;
      started[labId] = true;
      lazyInits[labId]();
    });
    initLabTabs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayground);
  } else {
    initPlayground();
  }
})();
