/**
 * Interactive labs for playground.html: sorting visualizer, typewriter,
 * plus two touch-friendly browser games.
 */
(() => {
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
  }

  function initTapRushGame() {
    const stage = document.getElementById('tapRushStage');
    const orb = document.getElementById('tapRushOrb');
    const startBtn = document.getElementById('gameStart');
    const soundBtn = document.getElementById('gameSound');
    const quitBtn = document.getElementById('gameQuit');
    const timeEl = document.getElementById('gameTime');
    const scoreEl = document.getElementById('gameScore');
    const bestEl = document.getElementById('gameBest');
    const message = document.getElementById('gameMessage');
    const status = document.getElementById('gameStatus');
    if (!stage || !orb || !startBtn || !soundBtn || !timeEl || !scoreEl || !bestEl || !message || !status) return;

    const duration = 20000;
    let score = 0;
    let best = 0;
    try {
      best = Number.parseInt(localStorage.getItem('tap-rush-best') || '0', 10) || 0;
    } catch (error) {
      console.warn('Unable to read the saved game score:', error);
    }
    let active = false;
    let soundOn = true;
    let startedAt = 0;
    let remainingMs = duration;
    let timerId = null;
    let audioContext = null;
    bestEl.textContent = String(best);

    function playTone(frequency, length = 0.06) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!soundOn || !Audio) return;
      try {
        audioContext ||= new Audio();
        if (audioContext.state === 'suspended') audioContext.resume();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gain.gain.setValueAtTime(0.045, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + length);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + length);
      } catch (error) {
        console.warn('Game audio is unavailable:', error);
        soundOn = false;
        soundBtn.textContent = 'Sound: Off';
        soundBtn.setAttribute('aria-pressed', 'false');
      }
    }

    function placeOrb() {
      const rect = stage.getBoundingClientRect();
      const diameter = Math.min(64, Math.max(48, rect.width * 0.16));
      const x = 8 + Math.random() * Math.max(0, rect.width - diameter - 16);
      const y = 8 + Math.random() * Math.max(0, rect.height - diameter - 16);
      orb.style.width = `${diameter}px`;
      orb.style.height = `${diameter}px`;
      orb.style.transform = `translate(${x}px, ${y}px)`;
    }

    function finishGame() {
      if (!active) return;
      active = false;
      remainingMs = duration;
      window.clearInterval(timerId);
      orb.hidden = true;
      startBtn.disabled = false;
      startBtn.textContent = 'Play again';
      if (quitBtn) quitBtn.disabled = true;
      timeEl.textContent = '0.0s';
      const newBest = score > best;
      best = Math.max(best, score);
      let saved = true;
      try {
        localStorage.setItem('tap-rush-best', String(best));
      } catch (error) {
        saved = false;
        console.warn('Unable to save the game score:', error);
      }
      bestEl.textContent = String(best);
      message.textContent = newBest ? `New best: ${score}!` : `Round complete: ${score}`;
      status.textContent = newBest
        ? (saved ? 'New high score saved on this device.' : 'New high score, but this browser could not save it.')
        : 'Nice run. Tap Play again for another round.';
      playTone(newBest ? 880 : 440, 0.15);
    }

    function pauseGame(reason = 'Game paused while this page was hidden.') {
      if (!active) return;
      remainingMs = Math.max(0, remainingMs - (performance.now() - startedAt));
      if (remainingMs <= 0) {
        finishGame();
        return;
      }
      window.clearInterval(timerId);
      active = false;
      orb.hidden = true;
      startBtn.disabled = false;
      startBtn.textContent = 'Resume game';
      message.textContent = reason;
      status.textContent = 'Select Resume game to continue.';
      timeEl.textContent = `${(remainingMs / 1000).toFixed(1)}s`;
    }

    function updateClock() {
      const remaining = Math.max(0, remainingMs - (performance.now() - startedAt));
      timeEl.textContent = `${(remaining / 1000).toFixed(1)}s`;
      if (remaining <= 0) finishGame();
    }

    function startGame() {
      if (active) return;
      if (remainingMs >= duration) {
        score = 0;
        scoreEl.textContent = '0';
      }
      active = true;
      startedAt = performance.now();
      orb.hidden = false;
      message.textContent = '';
      status.textContent = 'Go! Catch the orb before the timer reaches zero.';
      startBtn.disabled = true;
      startBtn.textContent = 'Playing…';
      if (quitBtn) quitBtn.disabled = false;
      placeOrb();
      updateClock();
      window.clearInterval(timerId);
      timerId = window.setInterval(updateClock, 70);
      playTone(520);
    }

    function collectOrb() {
      if (!active) return;
      score += 1;
      scoreEl.textContent = String(score);
      orb.classList.remove('is-hit');
      void orb.offsetWidth;
      orb.classList.add('is-hit');
      placeOrb();
      playTone(400 + Math.min(score * 18, 500));
    }

    orb.addEventListener('click', collectOrb);
    stage.addEventListener('keydown', (event) => {
      if (!active || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      collectOrb();
    });

    function quitTapRush() {
      active = false;
      remainingMs = duration;
      window.clearInterval(timerId);
      orb.hidden = true;
      startBtn.disabled = false;
      startBtn.textContent = 'Start game';
      if (quitBtn) quitBtn.disabled = true;
      timeEl.textContent = '20.0s';
      message.textContent = 'Round ended.';
      status.textContent = 'Game quit. Tap Start game to play again.';
    }

    quitBtn?.addEventListener('click', quitTapRush);
    startBtn.addEventListener('click', startGame);
    soundBtn.addEventListener('click', () => {
      soundOn = !soundOn;
      soundBtn.textContent = `Sound: ${soundOn ? 'On' : 'Off'}`;
      soundBtn.setAttribute('aria-pressed', String(soundOn));
      if (soundOn) playTone(520);
    });
    window.addEventListener('resize', () => { if (active) placeOrb(); }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseGame();
    });
    document.addEventListener('playground:tabchange', (event) => {
      if (event.detail.labId !== 'game') pauseGame('Round paused. Return to Neon Tap Rush to continue.');
    });
    window.addEventListener('pagehide', () => {
      pauseGame();
      window.clearInterval(timerId);
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
    ];
    let cards = [];
    let firstIndex = null;
    let locked = false;
    let moves = 0;
    let startedAt = 0;
    let elapsedMs = 0;
    let timerId = null;
    let revealTimer = null;
    let bestMoves = 0;

    try {
      bestMoves = Number.parseInt(localStorage.getItem('memory-match-best') || '0', 10) || 0;
    } catch (error) {
      console.warn('Unable to read the saved memory-match score:', error);
    }

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
        try {
          localStorage.setItem('memory-match-best', String(bestMoves));
        } catch (error) {
          console.warn('Unable to save the memory-match score:', error);
        }
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
      cards = shuffle([...symbols, ...symbols].map((symbol, index) => ({
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
      status.textContent = 'Find all 6 pairs. The timer starts on your first reveal.';
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

    // High Score
    let highScore = 0;
    try {
      highScore = parseInt(localStorage.getItem('cyberDefenderHighScore') || '0', 10);
      if (isNaN(highScore)) highScore = 0;
    } catch (_) {}
    if (highScoreEl) highScoreEl.textContent = String(highScore);

    // Game state
    let state = 'idle'; // 'idle', 'running', 'paused', 'gameover'
    let score = 0;
    let shields = 3;
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
      shields = 3;
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
      const speed = 70 + (wave * 12) + (Math.random() * 40);

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
        try {
          localStorage.setItem('cyberDefenderHighScore', String(highScore));
        } catch (_) {}
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
      const spawnInterval = Math.max(0.45, 1.4 - (wave * 0.08));
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


  /* ============================================================
     TARGET SNIPER: TACTICAL GUN SHOOTING GAME (HTML5 Canvas)
     ============================================================ */
  function initSniperGame() {
    const canvas = document.getElementById('sniperCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startBtn = document.getElementById('sniperStartBtn');
    const pauseBtn = document.getElementById('sniperPauseBtn');
    const restartBtn = document.getElementById('sniperRestartBtn');
    const soundBtn = document.getElementById('sniperSoundBtn');
    const scoreEl = document.getElementById('sniperScore');
    const accuracyEl = document.getElementById('sniperAccuracy');
    const timerEl = document.getElementById('sniperTimer');
    const streakEl = document.getElementById('sniperStreak');
    const highScoreEl = document.getElementById('sniperHighScore');

    // Audio synthesizer via Web Audio API (Zero external audio files)
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
      const actx = getAudio();
      if (!actx) return;
      const now = actx.currentTime;

      if (type === 'gunshot') {
        // Rifle gunshot crack: noise burst + low punch
        const bufferSize = actx.sampleRate * 0.12;
        const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (actx.sampleRate * 0.025));
        }
        const noise = actx.createBufferSource();
        noise.buffer = buffer;

        const filter = actx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(120, now + 0.12);

        const gain = actx.createGain();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(actx.destination);
        noise.start(now);
      } else if (type === 'bullseye') {
        // Metallic ping
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1480, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'hit') {
        // Normal target hit
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'bonus') {
        // High double chime
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1320, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    }

    // High Score
    let highScore = 0;
    try {
      highScore = parseInt(localStorage.getItem('targetSniperHighScore') || '0', 10);
      if (isNaN(highScore)) highScore = 0;
    } catch (_) {}
    if (highScoreEl) highScoreEl.textContent = String(highScore);

    // Game state
    let state = 'idle'; // 'idle', 'running', 'paused', 'gameover'
    let score = 0;
    let totalShots = 0;
    let hits = 0;
    let streak = 0;
    let timeLeft = 45.0;
    let lastTime = 0;
    let animId = null;
    let spawnTimer = 0;
    let droneTimer = 0;

    // Crosshair & Recoil
    const crosshair = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      recoilY: 0,
      active: true,
    };

    let muzzleFlash = 0; // opacity/countdown
    let targets = [];
    let bulletHoles = [];
    let sparks = [];
    let floatingTexts = [];

    function resetGame() {
      score = 0;
      totalShots = 0;
      hits = 0;
      streak = 0;
      timeLeft = 45.0;
      spawnTimer = 0;
      droneTimer = 0;
      targets = [];
      bulletHoles = [];
      sparks = [];
      floatingTexts = [];
      updateUI();
    }

    function updateUI() {
      if (scoreEl) scoreEl.textContent = String(score);
      if (accuracyEl) {
        const acc = totalShots > 0 ? Math.round((hits / totalShots) * 100) : 100;
        accuracyEl.textContent = `${acc}%`;
      }
      if (timerEl) {
        const secs = Math.max(0, Math.ceil(timeLeft));
        const formatted = `00:${secs < 10 ? '0' : ''}${secs}`;
        timerEl.textContent = formatted;
      }
      if (streakEl) streakEl.textContent = `${streak}x`;
      if (highScoreEl) highScoreEl.textContent = String(highScore);
    }

    // Target Spawning
    function spawnBullseyeTarget() {
      const radius = 28 + Math.random() * 8;
      const x = Math.random() * (canvas.width - radius * 2 - 40) + radius + 20;
      const y = Math.random() * (canvas.height - radius * 2 - 60) + radius + 30;
      targets.push({
        type: 'bullseye',
        x,
        y,
        radius,
        life: 3.2,
        maxLife: 3.2,
        scale: 0.1,
      });
    }

    function spawnDroneTarget() {
      const goingRight = Math.random() > 0.5;
      const y = Math.random() * (canvas.height * 0.45) + 40;
      const speed = (goingRight ? 1 : -1) * (140 + Math.random() * 80);
      targets.push({
        type: 'drone',
        x: goingRight ? -30 : canvas.width + 30,
        y,
        radius: 22,
        vx: speed,
        life: 6.0,
        rotorAngle: 0,
      });
    }

    function spawnGoldenTarget() {
      const radius = 18;
      const x = Math.random() * (canvas.width - radius * 2 - 40) + radius + 20;
      const y = Math.random() * (canvas.height - radius * 2 - 60) + radius + 30;
      targets.push({
        type: 'golden',
        x,
        y,
        radius,
        life: 2.2,
        maxLife: 2.2,
        scale: 0.1,
      });
    }

    function spawnSparks(x, y, color = '#fbbf24', count = 12) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 160 + 40;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          life: 0.28,
          maxLife: 0.28,
          size: Math.random() * 2.5 + 1.2,
        });
      }
    }

    function addFloatingText(text, x, y, color = '#38bdf8') {
      floatingTexts.push({
        text,
        x,
        y,
        color,
        life: 0.75,
        maxLife: 0.75,
      });
    }

    // Shooting Action
    function shoot(targetX, targetY) {
      if (state !== 'running') return;

      totalShots++;
      crosshair.recoilY = -14;
      muzzleFlash = 0.9;
      playSound('gunshot');

      // Add bullet impact hole
      bulletHoles.push({
        x: targetX,
        y: targetY,
        life: 5.0,
      });

      // Hit check (iterate backwards)
      let hitAny = false;
      for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        const dist = Math.hypot(targetX - t.x, targetY - t.y);

        if (dist <= t.radius) {
          hitAny = true;
          hits++;
          streak++;

          const multiplier = Math.min(4, 1 + Math.floor(streak / 3));

          if (t.type === 'bullseye') {
            const innerRadius = t.radius * 0.3;
            const midRadius = t.radius * 0.65;

            if (dist <= innerRadius) {
              // Bullseye!
              const pts = 100 * multiplier;
              score += pts;
              playSound('bullseye');
              spawnSparks(t.x, t.y, '#ef4444', 16);
              addFloatingText(`🎯 BULLSEYE! +${pts}`, t.x, t.y - 10, '#ef4444');
            } else if (dist <= midRadius) {
              const pts = 50 * multiplier;
              score += pts;
              playSound('hit');
              spawnSparks(t.x, t.y, '#38bdf8', 12);
              addFloatingText(`HIT! +${pts}`, t.x, t.y - 10, '#38bdf8');
            } else {
              const pts = 25 * multiplier;
              score += pts;
              playSound('hit');
              spawnSparks(t.x, t.y, '#94a3b8', 10);
              addFloatingText(`+${pts}`, t.x, t.y - 10, '#94a3b8');
            }
          } else if (t.type === 'drone') {
            const pts = 150 * multiplier;
            score += pts;
            playSound('hit');
            spawnSparks(t.x, t.y, '#f59e0b', 18);
            addFloatingText(`🛸 DRONE DOWN! +${pts}`, t.x, t.y - 10, '#f59e0b');
          } else if (t.type === 'golden') {
            const pts = 250;
            score += pts;
            timeLeft = Math.min(60, timeLeft + 3.0);
            playSound('bonus');
            spawnSparks(t.x, t.y, '#fbbf24', 22);
            addFloatingText(`★ BONUS! +${pts} (+3s)`, t.x, t.y - 10, '#fbbf24');
          }

          targets.splice(i, 1);
          break; // one target per bullet
        }
      }

      if (!hitAny) {
        streak = 0;
        spawnSparks(targetX, targetY, '#64748b', 6);
        addFloatingText('MISS!', targetX, targetY - 10, '#64748b');
      }

      updateUI();
    }

    // Input: Desktop Mouse & Mobile Touch
    function getCanvasCoords(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: Math.max(0, Math.min(canvas.width, (clientX - rect.left) * scaleX)),
        y: Math.max(0, Math.min(canvas.height, (clientY - rect.top) * scaleY)),
      };
    }

    canvas.addEventListener('mousemove', (e) => {
      const pos = getCanvasCoords(e.clientX, e.clientY);
      crosshair.x = pos.x;
      crosshair.y = pos.y;
    });

    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (state === 'idle' || state === 'gameover') {
        startMatch();
        return;
      }
      const pos = getCanvasCoords(e.clientX, e.clientY);
      crosshair.x = pos.x;
      crosshair.y = pos.y;
      shoot(pos.x, pos.y);
    });

    // Mobile Touch: Tap to shoot instantly, Drag to aim
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (state === 'idle' || state === 'gameover') {
        startMatch();
        return;
      }
      const touch = e.touches[0];
      const pos = getCanvasCoords(touch.clientX, touch.clientY);
      crosshair.x = pos.x;
      crosshair.y = pos.y;
      shoot(pos.x, pos.y);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const pos = getCanvasCoords(touch.clientX, touch.clientY);
      crosshair.x = pos.x;
      crosshair.y = pos.y;
    }, { passive: false });

    // Buttons
    function startMatch() {
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
      renderIdle();
    }

    if (startBtn) startBtn.addEventListener('click', startMatch);
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    if (restartBtn) restartBtn.addEventListener('click', startMatch);
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundBtn.textContent = soundEnabled ? '🔊 Sound' : '🔇 Muted';
      });
    }

    // Auto-pause when tab changes
    document.addEventListener('playground:tabchange', (e) => {
      if (e.detail && e.detail.labId !== 'sniper' && state === 'running') {
        togglePause();
      }
    });

    function handleGameOver() {
      state = 'gameover';
      if (score > highScore) {
        highScore = score;
        try {
          localStorage.setItem('targetSniperHighScore', String(highScore));
        } catch (_) {}
      }
      updateUI();
      if (startBtn) startBtn.textContent = 'Play Again';
    }

    // Main Game Loop
    function loop(now) {
      if (state !== 'running') {
        render();
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Timer countdown
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        handleGameOver();
        render();
        return;
      }
      updateUI();

      // Recoil recovery
      if (crosshair.recoilY < 0) {
        crosshair.recoilY += 75 * dt;
        if (crosshair.recoilY > 0) crosshair.recoilY = 0;
      }

      // Muzzle flash decay
      if (muzzleFlash > 0) muzzleFlash -= 8 * dt;

      // Spawning
      spawnTimer += dt;
      if (spawnTimer >= 0.85) {
        spawnTimer = 0;
        if (targets.length < 5) {
          if (Math.random() < 0.2) spawnGoldenTarget();
          else spawnBullseyeTarget();
        }
      }

      droneTimer += dt;
      if (droneTimer >= 4.2) {
        droneTimer = 0;
        spawnDroneTarget();
      }

      // Update Targets
      for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        t.life -= dt;

        if (t.type === 'drone') {
          t.x += t.vx * dt;
          t.rotorAngle += 24 * dt;
          if (t.x < -60 || t.x > canvas.width + 60 || t.life <= 0) {
            targets.splice(i, 1);
            continue;
          }
        } else {
          // Scale in
          if (t.scale < 1.0) t.scale = Math.min(1.0, t.scale + dt * 4);
          if (t.life <= 0) {
            targets.splice(i, 1);
            continue;
          }
        }
      }

      // Update Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0) sparks.splice(i, 1);
      }

      // Update Bullet Holes
      for (let i = bulletHoles.length - 1; i >= 0; i--) {
        const bh = bulletHoles[i];
        bh.life -= dt;
        if (bh.life <= 0) bulletHoles.splice(i, 1);
      }

      // Update Floating Texts
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y -= 38 * dt;
        ft.life -= dt;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
      }

      render();
      animId = requestAnimationFrame(loop);
    }

    // Render Canvas
    function render() {
      // Background tactical range
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Range horizon line
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.72);
      ctx.lineTo(canvas.width, canvas.height * 0.72);
      ctx.stroke();

      // Bullet holes
      for (const bh of bulletHoles) {
        const alpha = Math.min(1, bh.life / 2.0);
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.75})`;
        ctx.beginPath();
        ctx.arc(bh.x, bh.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(bh.x, bh.y, 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Targets
      for (const t of targets) {
        ctx.save();
        ctx.translate(t.x, t.y);

        if (t.type === 'bullseye') {
          const s = t.scale || 1.0;
          ctx.scale(s, s);

          // Outer white ring
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Mid cyan ring
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(0, 0, t.radius * 0.65, 0, Math.PI * 2);
          ctx.fill();

          // Inner white ring
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, t.radius * 0.42, 0, Math.PI * 2);
          ctx.fill();

          // Red bullseye center
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, t.radius * 0.25, 0, Math.PI * 2);
          ctx.fill();

          // Despawn warning bar
          const lifeFrac = t.life / t.maxLife;
          ctx.strokeStyle = lifeFrac > 0.35 ? '#10b981' : '#ef4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, t.radius + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifeFrac);
          ctx.stroke();
        } else if (t.type === 'drone') {
          // Cyber Drone
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(-22, -10, 44, 20, 6) : ctx.rect(-22, -10, 44, 20);
          ctx.fill();
          ctx.stroke();

          // Drone eye
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();

          // Rotors
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          const rx = 18 * Math.cos(t.rotorAngle);
          ctx.beginPath();
          ctx.moveTo(-18 - rx, -14);
          ctx.lineTo(-18 + rx, -14);
          ctx.moveTo(18 - rx, -14);
          ctx.lineTo(18 + rx, -14);
          ctx.stroke();
        } else if (t.type === 'golden') {
          // Golden bonus target
          const s = t.scale || 1.0;
          ctx.scale(s, s);
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#000';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', 0, 0);
        }

        ctx.restore();
      }

      // Sparks
      for (const s of sparks) {
        const a = s.life / s.maxLife;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, a);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Floating Score Texts
      for (const ft of floatingTexts) {
        const a = ft.life / ft.maxLife;
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, a);
        ctx.font = 'bold 15px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1.0;
      }

      // Muzzle Flash
      if (muzzleFlash > 0.05) {
        const flashGrad = ctx.createRadialGradient(
          crosshair.x, crosshair.y + crosshair.recoilY, 0,
          crosshair.x, crosshair.y + crosshair.recoilY, 65
        );
        flashGrad.addColorStop(0, `rgba(255, 255, 255, ${muzzleFlash})`);
        flashGrad.addColorStop(0.35, `rgba(245, 158, 11, ${muzzleFlash * 0.75})`);
        flashGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(crosshair.x, crosshair.y + crosshair.recoilY, 65, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sniper Crosshair Reticle
      if (state === 'running' || state === 'paused') {
        const cx = crosshair.x;
        const cy = crosshair.y + crosshair.recoilY;

        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;

        // Outer scope ring
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.stroke();

        // Inner ring
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.stroke();

        // 4 Reticle Ticks
        ctx.beginPath();
        ctx.moveTo(cx - 32, cy); ctx.lineTo(cx - 10, cy);
        ctx.moveTo(cx + 10, cy); ctx.lineTo(cx + 32, cy);
        ctx.moveTo(cx, cy - 32); ctx.lineTo(cx, cy - 10);
        ctx.moveTo(cx, cy + 10); ctx.lineTo(cx, cy + 32);
        ctx.stroke();

        // Center Red Laser Dot
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Overlay Screens
      if (state === 'idle') {
        renderIdle();
      } else if (state === 'paused') {
        ctx.fillStyle = 'rgba(6, 10, 18, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 24px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION PAUSED', canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '14px var(--font-sans, sans-serif)';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Click Resume to continue', canvas.width / 2, canvas.height / 2 + 25);
      } else if (state === 'gameover') {
        ctx.fillStyle = 'rgba(6, 10, 18, 0.88)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 28px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('TIME EXPIRED!', canvas.width / 2, canvas.height / 2 - 45);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px var(--font-sans, sans-serif)';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 5);

        const acc = totalShots > 0 ? Math.round((hits / totalShots) * 100) : 0;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px var(--font-mono, monospace)';
        ctx.fillText(`Hits: ${hits}/${totalShots} (${acc}% Accuracy)`, canvas.width / 2, canvas.height / 2 + 25);

        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 50);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '14px var(--font-sans, sans-serif)';
        ctx.fillText('Click [Restart] or Tap Range to Play Again', canvas.width / 2, canvas.height / 2 + 85);
      }
    }

    function renderIdle() {
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 28px var(--font-mono, monospace)';
      ctx.textAlign = 'center';
      ctx.fillText('🎯 TARGET SNIPER', canvas.width / 2, canvas.height / 2 - 40);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px var(--font-sans, sans-serif)';
      ctx.fillText('Desktop: Move Mouse to Aim · Left-Click to Shoot', canvas.width / 2, canvas.height / 2);
      ctx.fillText('Mobile: Tap anywhere to Aim & Fire Instantly (0ms lag)', canvas.width / 2, canvas.height / 2 + 25);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 15px var(--font-sans, sans-serif)';
      ctx.fillText('Click [Start Mission] or Tap Range to Launch', canvas.width / 2, canvas.height / 2 + 65);
    }

    renderIdle();
  }

  function initTypingShooterGame() {
    const canvas = document.getElementById('typingShooterCanvas');
    const startBtn = document.getElementById('typingStartBtn');
    const pauseBtn = document.getElementById('typingPauseBtn');
    const restartBtn = document.getElementById('typingRestartBtn');
    const mobileInput = document.getElementById('typingShooterInput');
    const scoreEl = document.getElementById('typingScore');
    const wpmEl = document.getElementById('typingWpm');
    const accuracyEl = document.getElementById('typingAccuracy');
    const timeEl = document.getElementById('typingTime');
    const status = document.getElementById('typingStatus');
    const panel = document.getElementById('lab-typing-shooter');
    if (!canvas || !startBtn || !pauseBtn || !restartBtn || !mobileInput || !scoreEl || !wpmEl || !accuracyEl || !timeEl || !status || !panel) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const letters = 'ASDFGHJKLQWERTYUIOPZXCVBNM';
    const duration = 45000;
    let rocks = [];
    let bullets = [];
    let playing = false;
    let paused = false;
    let roundStartedAt = 0;
    let elapsedBeforePause = 0;
    let lastFrame = 0;
    let spawnTimer = 0;
    let score = 0;
    let typed = 0;
    let hits = 0;
    let escaped = 0;
    let frameId = 0;
    let nextRockId = 1;

    function metrics(now = performance.now()) {
      const elapsed = playing ? elapsedBeforePause + (now - roundStartedAt) : elapsedBeforePause;
      const minutes = Math.max(elapsed / 60000, 1 / 60);
      const wpm = Math.round((hits / 5) / minutes);
      const accuracy = typed ? Math.round((hits / typed) * 100) : 100;
      scoreEl.textContent = String(score);
      wpmEl.textContent = `${wpm} WPM`;
      accuracyEl.textContent = `${accuracy}%`;
      timeEl.textContent = `${Math.max(0, Math.ceil((duration - elapsed) / 1000))}s`;
      return elapsed;
    }

    function draw(now = performance.now()) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#071426');
      gradient.addColorStop(1, '#0a1020');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.09)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = 0; y <= canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

      const shipX = canvas.width / 2;
      const shipY = canvas.height - 36;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.moveTo(shipX, shipY - 18); ctx.lineTo(shipX - 20, shipY + 18); ctx.lineTo(shipX + 20, shipY + 18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e0f2fe'; ctx.fillRect(shipX - 3, shipY - 9, 6, 22);
      ctx.fillStyle = '#9fb2cc'; ctx.font = '600 13px var(--font-mono, monospace)'; ctx.textAlign = 'left'; ctx.fillText(`BASE INTEGRITY ${Math.max(0, 3 - escaped)} / 3`, 14, canvas.height - 16);

      bullets.forEach((bullet) => {
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#facc15'; ctx.shadowBlur = 12;
        ctx.fillRect(bullet.x - 2, bullet.y - 12, 4, 16);
        ctx.shadowBlur = 0;
      });
      rocks.forEach((rock) => {
        const radius = 25;
        const rockGradient = ctx.createRadialGradient(rock.x - 8, rock.y - 9, 2, rock.x, rock.y, radius);
        rockGradient.addColorStop(0, '#cbd5e1'); rockGradient.addColorStop(0.35, '#64748b'); rockGradient.addColorStop(1, '#1e293b');
        ctx.fillStyle = rockGradient;
        ctx.beginPath(); ctx.arc(rock.x, rock.y, radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(248,250,252,.45)'; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = '700 20px var(--font-mono, monospace)'; ctx.textAlign = 'center'; ctx.fillText(rock.letter, rock.x, rock.y + 7);
      });
      if (!playing && !paused && elapsedBeforePause === 0) {
        ctx.fillStyle = 'rgba(7, 20, 38, .72)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#7dd3fc'; ctx.font = '700 26px var(--font-mono, monospace)'; ctx.textAlign = 'center'; ctx.fillText('TYPE BLASTER', canvas.width / 2, 170);
        ctx.fillStyle = '#cbd5e1'; ctx.font = '15px var(--font-sans, sans-serif)'; ctx.fillText('Type the letter on each rock to fire.', canvas.width / 2, 205);
      }
      if (paused) {
        ctx.fillStyle = 'rgba(7, 20, 38, .68)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e0f2fe'; ctx.font = '700 22px var(--font-mono, monospace)'; ctx.textAlign = 'center'; ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      }
    }

    function spawnRock() {
      const lane = 44 + Math.random() * (canvas.width - 88);
      rocks.push({ id: nextRockId++, x: lane, y: -28, letter: letters[Math.floor(Math.random() * letters.length)], speed: 28 + Math.min(score * 0.7, 48) + Math.random() * 22 });
    }

    function endRound(message) {
      playing = false;
      paused = false;
      cancelAnimationFrame(frameId);
      const elapsed = metrics();
      const wpm = Math.round((hits / 5) / Math.max(elapsed / 60000, 1 / 60));
      status.textContent = `${message} Score ${score}, ${wpm} WPM, ${typed ? Math.round((hits / typed) * 100) : 100}% accuracy.`;
      startBtn.textContent = 'Play again';
      pauseBtn.textContent = 'Pause';
      draw();
    }

    function tick(now) {
      if (!playing) return;
      const delta = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      if (metrics(now) >= duration) return endRound('Round complete!');
      spawnTimer += delta;
      if (spawnTimer > Math.max(0.45, 1.12 - score * 0.012)) { spawnTimer = 0; spawnRock(); }
      rocks.forEach((rock) => { rock.y += rock.speed * delta; });
      bullets.forEach((bullet) => { bullet.y -= 700 * delta; });
      bullets = bullets.filter((bullet) => {
        const target = rocks.find((rock) => rock.id === bullet.targetId);
        if (target && bullet.y <= target.y + 6) {
          rocks = rocks.filter((rock) => rock.id !== target.id);
          hits += 1; score += 100;
          return false;
        }
        return bullet.y > -20;
      });
      const remaining = [];
      rocks.forEach((rock) => { if (rock.y > canvas.height - 44) escaped += 1; else remaining.push(rock); });
      rocks = remaining;
      if (escaped >= 3) return endRound('The rocks reached the base.');
      draw(now);
      frameId = requestAnimationFrame(tick);
    }

    function fireLetter(character) {
      const letter = character.toUpperCase();
      if (!playing || !/^[A-Z]$/.test(letter)) return;
      typed += 1;
      const target = rocks.filter((rock) => rock.letter === letter).sort((a, b) => b.y - a.y)[0];
      bullets.push({ x: canvas.width / 2, y: canvas.height - 56, targetId: target?.id || null });
      if (!target) status.textContent = `No ${letter} rock in range — keep watching the sky.`;
      metrics();
    }

    function startRound(restart = false) {
      if (restart || elapsedBeforePause >= duration || !paused) {
        rocks = []; bullets = []; score = 0; typed = 0; hits = 0; escaped = 0; spawnTimer = 0; elapsedBeforePause = 0; nextRockId = 1;
      }
      playing = true; paused = false; roundStartedAt = performance.now(); lastFrame = roundStartedAt;
      startBtn.textContent = 'Playing…'; pauseBtn.textContent = 'Pause'; status.textContent = 'Type the letter shown on an incoming rock to blast it.';
      if (window.matchMedia('(pointer: coarse)').matches) mobileInput.focus();
      cancelAnimationFrame(frameId); frameId = requestAnimationFrame(tick);
    }

    function pauseRound(reason = 'Round paused.') {
      if (!playing) return;
      elapsedBeforePause += performance.now() - roundStartedAt;
      playing = false; paused = true; cancelAnimationFrame(frameId);
      startBtn.textContent = 'Resume round'; pauseBtn.textContent = 'Resume'; status.textContent = reason; metrics(); draw();
    }

    startBtn.addEventListener('click', () => startRound(paused ? false : true));
    restartBtn.addEventListener('click', () => startRound(true));
    pauseBtn.addEventListener('click', () => { if (playing) pauseRound(); else if (paused) startRound(false); });
    mobileInput.addEventListener('input', () => { const character = mobileInput.value.slice(-1); mobileInput.value = ''; fireLetter(character); });
    document.addEventListener('keydown', (event) => {
      if (!playing || panel.hidden || event.target === mobileInput || event.ctrlKey || event.metaKey || event.altKey) return;
      if (/^[a-z]$/i.test(event.key)) { event.preventDefault(); fireLetter(event.key); }
    });
    document.addEventListener('playground:tabchange', (event) => { if (event.detail.labId !== 'typing-shooter') pauseRound('Round paused. Return to Type Blaster to continue.'); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pauseRound('Round paused while the page was hidden.'); });
    draw();
  }

  function initSnakeGame() {
    const canvas = document.getElementById('snakeCanvas');
    const startBtn = document.getElementById('snakeStartBtn');
    const pauseBtn = document.getElementById('snakePauseBtn');
    const restartBtn = document.getElementById('snakeRestartBtn');
    const scoreEl = document.getElementById('snakeScore');
    const bestEl = document.getElementById('snakeBest');
    const status = document.getElementById('snakeStatus');
    const panel = document.getElementById('lab-snake');
    if (!canvas || !startBtn || !pauseBtn || !restartBtn || !scoreEl || !bestEl || !status || !panel) return;

    const ctx = canvas.getContext('2d');
    const cells = 18;
    const unit = canvas.width / cells;
    let snake = [];
    let food = null;
    let direction = { x: 1, y: 0 };
    let queuedDirection = direction;
    let score = 0;
    let best = 0;
    let running = false;
    let timer = null;
    let touchStart = null;
    try { best = Number.parseInt(localStorage.getItem('nokia-snake-best') || '0', 10) || 0; } catch (error) { console.warn('Unable to read Snake score:', error); }

    function placeFood() {
      do { food = { x: Math.floor(Math.random() * cells), y: Math.floor(Math.random() * cells) }; }
      while (snake.some((part) => part.x === food.x && part.y === food.y));
    }

    function draw() {
      ctx.fillStyle = '#9caf88'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(47, 62, 45, .11)'; ctx.lineWidth = 1;
      for (let i = 0; i <= cells; i += 1) { ctx.beginPath(); ctx.moveTo(i * unit, 0); ctx.lineTo(i * unit, canvas.height); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * unit); ctx.lineTo(canvas.width, i * unit); ctx.stroke(); }
      if (food) { ctx.fillStyle = '#bd3434'; ctx.beginPath(); ctx.arc((food.x + .5) * unit, (food.y + .5) * unit, unit * .28, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#7f1d1d'; ctx.stroke(); }
      snake.forEach((part, index) => { ctx.fillStyle = index === 0 ? '#183b25' : '#2f6540'; ctx.fillRect(part.x * unit + 2, part.y * unit + 2, unit - 4, unit - 4); });
      if (!running && !snake.length) { ctx.fillStyle = '#24422c'; ctx.font = '700 20px var(--font-mono, monospace)'; ctx.textAlign = 'center'; ctx.fillText('NOKIA SNAKE', canvas.width / 2, canvas.height / 2 - 10); ctx.font = '14px var(--font-mono, monospace)'; ctx.fillText('Press Start to play', canvas.width / 2, canvas.height / 2 + 18); }
    }

    function updateStats() { scoreEl.textContent = String(score); bestEl.textContent = String(best); }
    function stop(message) { running = false; window.clearInterval(timer); timer = null; startBtn.textContent = 'Play again'; pauseBtn.textContent = 'Pause'; status.textContent = message; draw(); }
    function step() {
      direction = queuedDirection;
      const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
      const ate = head.x === food.x && head.y === food.y;
      const body = ate ? snake : snake.slice(0, -1);
      if (head.x < 0 || head.x >= cells || head.y < 0 || head.y >= cells || body.some((part) => part.x === head.x && part.y === head.y)) return stop(`Game over! Final score: ${score}.`);
      snake.unshift(head);
      if (ate) { score += 10; if (score > best) { best = score; try { localStorage.setItem('nokia-snake-best', String(best)); } catch (error) { console.warn('Unable to save Snake score:', error); } } placeFood(); updateStats(); status.textContent = 'Nice catch! Keep going.'; }
      else snake.pop();
      draw();
    }
    function start(restart = false) {
      if (restart || !snake.length) { snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }]; direction = { x: 1, y: 0 }; queuedDirection = direction; score = 0; placeFood(); updateStats(); }
      if (running) return;
      running = true; startBtn.textContent = 'Playing…'; pauseBtn.textContent = 'Pause'; status.textContent = 'Use arrow keys, swipe, or the direction pad.'; window.clearInterval(timer); timer = window.setInterval(step, 130); draw();
    }
    function setDirection(next) { if (!running || (next.x === -direction.x && next.y === -direction.y)) return; queuedDirection = next; }
    const directions = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };
    startBtn.addEventListener('click', () => start(startBtn.textContent === 'Play again')); restartBtn.addEventListener('click', () => start(true)); pauseBtn.addEventListener('click', () => { if (running) { running = false; window.clearInterval(timer); timer = null; startBtn.textContent = 'Resume game'; pauseBtn.textContent = 'Resume'; status.textContent = 'Game paused.'; } else if (snake.length) start(); });
    document.querySelectorAll('[data-snake-direction]').forEach((button) => button.addEventListener('click', () => setDirection({ up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }[button.dataset.snakeDirection])));
    document.addEventListener('keydown', (event) => { if (!running || panel.hidden || !directions[event.key]) return; event.preventDefault(); setDirection(directions[event.key]); });
    canvas.addEventListener('pointerdown', (event) => { touchStart = { x: event.clientX, y: event.clientY }; });
    canvas.addEventListener('pointerup', (event) => { if (!touchStart) return; const dx = event.clientX - touchStart.x; const dy = event.clientY - touchStart.y; touchStart = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return; setDirection(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) }); });
    document.addEventListener('playground:tabchange', (event) => { if (event.detail.labId !== 'snake' && running) { running = false; window.clearInterval(timer); timer = null; startBtn.textContent = 'Resume game'; status.textContent = 'Game paused. Return to Nokia Snake to continue.'; } });
    document.addEventListener('visibilitychange', () => { if (document.hidden && running) { running = false; window.clearInterval(timer); timer = null; startBtn.textContent = 'Resume game'; status.textContent = 'Game paused while the page was hidden.'; } });
    updateStats(); draw();
  }

  function initPlayground() {
    initSniperGame();
    initShooterGame();
    initLabTabs();
    initSortLab();
    initTypewriterLab();
    initTapRushGame();
    initMemoryGame();
    initTypingShooterGame();
    initSnakeGame();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayground);
  } else {
    initPlayground();
  }
})();
