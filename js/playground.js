/**
 * Interactive labs for playground.html: sorting visualizer, typewriter,
 * and Neon Tap Rush, a touch-friendly reaction game.
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
      if (running) return;
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
      runBtn.disabled = true;
      shuffleBtn.disabled = true;
      status.textContent = 'Sorting…';

      const arr = values.slice();
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      try {
        for (let i = 0; i < arr.length - 1; i++) {
          for (let j = 0; j < arr.length - i - 1; j++) {
            render({ compare: [j, j + 1] });
            await sleep(reducedMotion ? 0 : 35);
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
        shuffleBtn.disabled = false;
      }
    }

    shuffleBtn.addEventListener('click', shuffle);
    runBtn.addEventListener('click', bubbleSort);
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

    function pauseGame() {
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
      message.textContent = 'Game paused while this page was hidden.';
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
    window.addEventListener('pagehide', () => {
      pauseGame();
      window.clearInterval(timerId);
    });
  }

  function initPlayground() {
    initLabTabs();
    initSortLab();
    initTypewriterLab();
    initTapRushGame();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayground);
  } else {
    initPlayground();
  }
})();
