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

  function initPlayground() {
    initLabTabs();
    initSortLab();
    initTypewriterLab();
    initTapRushGame();
    initMemoryGame();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayground);
  } else {
    initPlayground();
  }
})();
