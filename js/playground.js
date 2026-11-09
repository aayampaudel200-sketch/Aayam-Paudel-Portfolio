/**
 * Interactive labs for playground.html: sorting visualizer, typewriter,
 * palette mixer, and debounce snippet demo.
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
      });
      panels.forEach((panel) => {
        const active = panel.dataset.labPanel === labId;
        panel.hidden = !active;
        panel.classList.toggle('is-visible', active);
      });
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => activate(tab.dataset.lab));
    });
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
      for (let i = 0; i < arr.length - 1; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
          render({ compare: [j, j + 1] });
          await sleep(35);
          if (arr[j] > arr[j + 1]) {
            [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            values = arr.slice();
            render({ swap: [j, j + 1] });
            await sleep(45);
          }
        }
      }

      values = arr;
      render({ sorted: true });
      status.textContent = 'Sorted.';
      running = false;
      runBtn.disabled = false;
      shuffleBtn.disabled = false;
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
    input.addEventListener('change', restart);
    restart();
  }

  function hexToRgb(hex) {
    const value = hex.replace('#', '');
    const full = value.length === 3
      ? value.split('').map((ch) => ch + ch).join('')
      : value;
    const num = Number.parseInt(full, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
  }

  function mixColors(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    };
  }

  function initPaletteLab() {
    const colorA = document.getElementById('colorA');
    const colorB = document.getElementById('colorB');
    const swatches = document.getElementById('paletteSwatches');
    const randomBtn = document.getElementById('paletteRandom');
    if (!colorA || !colorB || !swatches || !randomBtn) return;

    function render() {
      const from = hexToRgb(colorA.value);
      const to = hexToRgb(colorB.value);
      swatches.replaceChildren();

      for (let i = 0; i < 5; i++) {
        const mixed = mixColors(from, to, i / 4);
        const hex = rgbToHex(mixed.r, mixed.g, mixed.b);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'palette-swatch';
        button.style.background = hex;
        button.title = `Copy ${hex}`;
        button.innerHTML = `<span>${hex}</span>`;
        button.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(hex);
            if (typeof window.showToast === 'function') window.showToast(`Copied ${hex}`);
            else button.querySelector('span').textContent = 'Copied';
          } catch (_) {
            button.querySelector('span').textContent = hex;
          }
        });
        swatches.appendChild(button);
      }
    }

    function randomHex() {
      return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
    }

    colorA.addEventListener('input', render);
    colorB.addEventListener('input', render);
    randomBtn.addEventListener('click', () => {
      colorA.value = randomHex();
      colorB.value = randomHex();
      render();
    });
    render();
  }

  function initSnippetLab() {
    const input = document.getElementById('debounceInput');
    const status = document.getElementById('debounceStatus');
    const copyBtn = document.getElementById('snippetCopy');
    const code = document.getElementById('snippetCode');
    if (!input || !status || !copyBtn || !code) return;

    function debounce(fn, wait = 200) {
      let timer = null;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
      };
    }

    const update = debounce((value) => {
      status.textContent = value
        ? `Debounced value: “${value}”`
        : 'Waiting for input…';
    }, 300);

    input.addEventListener('input', () => {
      status.textContent = 'Typing…';
      update(input.value.trim());
    });

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        if (typeof window.showToast === 'function') window.showToast('Snippet copied');
        else status.textContent = 'Snippet copied to clipboard.';
      } catch (_) {
        status.textContent = 'Unable to copy. Select the code manually.';
      }
    });
  }

  function initPlayground() {
    initLabTabs();
    initSortLab();
    initTypewriterLab();
    initPaletteLab();
    initSnippetLab();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayground);
  } else {
    initPlayground();
  }
})();
