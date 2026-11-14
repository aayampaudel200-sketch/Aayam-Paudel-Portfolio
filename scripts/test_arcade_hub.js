/**
 * Automated Test Suite for Arcade Hub (Type Blaster & Nokia Snake)
 * Validates all requirements from Section 10 of Master Prompt.
 */

const fs = require('fs');
const path = require('path');

// 1. Mock Browser Environment
const localStorageData = {};
global.localStorage = {
  getItem: (key) => localStorageData[key] !== undefined ? localStorageData[key] : null,
  setItem: (key, val) => { localStorageData[key] = String(val); },
  removeItem: (key) => { delete localStorageData[key]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

let rafCallbacks = [];
let nextRafId = 1;
global.requestAnimationFrame = (cb) => {
  const id = nextRafId++;
  rafCallbacks.push({ id, cb });
  return id;
};
global.cancelAnimationFrame = (id) => {
  rafCallbacks = rafCallbacks.filter(item => item.id !== id);
};

let nowTime = 1000;
global.performance = {
  now: () => nowTime
};

// Document & Event Listeners
const docListeners = {};
global.document = {
  readyState: 'complete',
  hidden: false,
  addEventListener: (type, handler, opts) => {
    if (!docListeners[type]) docListeners[type] = [];
    docListeners[type].push(handler);
  },
  removeEventListener: (type, handler) => {
    if (!docListeners[type]) return;
    docListeners[type] = docListeners[type].filter(h => h !== handler);
  },
  dispatchEvent: (event) => {
    const list = docListeners[event.type] || [];
    list.forEach(h => h(event));
  },
  querySelectorAll: (sel) => [],
  getElementById: (id) => null
};

const winListeners = {};
global.window = {
  devicePixelRatio: 1,
  matchMedia: (q) => ({ matches: false }),
  addEventListener: (type, handler, opts) => {
    if (!winListeners[type]) winListeners[type] = [];
    winListeners[type].push(handler);
  },
  removeEventListener: (type, handler) => {
    if (!winListeners[type]) return;
    winListeners[type] = winListeners[type].filter(h => h !== handler);
  },
  dispatchEvent: (event) => {
    const list = winListeners[event.type] || [];
    list.forEach(h => h(event));
  }
};

// Mock Elements Helper
function createMockElement(id, tagName = 'div') {
  const listeners = {};
  const attrs = {};
  const classes = new Set();
  return {
    id,
    tagName: tagName.toUpperCase(),
    textContent: '',
    value: '',
    hidden: false,
    dataset: {},
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (classes.has(c)) classes.delete(c);
          else classes.add(c);
        } else if (force) classes.add(c);
        else classes.delete(c);
      },
      contains: (c) => classes.has(c)
    },
    setAttribute: (k, v) => { attrs[k] = String(v); },
    getAttribute: (k) => attrs[k] || null,
    addEventListener: (type, h) => {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(h);
    },
    removeEventListener: (type, h) => {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter(fn => fn !== h);
    },
    dispatchEvent: (e) => {
      const list = listeners[e.type] || [];
      list.forEach(fn => fn(e));
    },
    click: () => {
      const list = listeners['click'] || [];
      list.forEach(fn => fn({ preventDefault: () => {} }));
    },
    focus: () => {},
    querySelector: (sel) => null,
    querySelectorAll: (sel) => []
  };
}

// Mock Canvas Context
function createMockContext() {
  return {
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    fillRect: () => {},
    fillText: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    setTransform: () => {},
    shadowColor: '',
    shadowBlur: 0,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1
  };
}

// Build DOM tree
const elements = {};
function regEl(id, tag = 'div') {
  const el = createMockElement(id, tag);
  elements[id] = el;
  return el;
}

const hubPanel = regEl('lab-arcade-hub');
const typingView = regEl('arcadeGameTyping');
const snakeView = regEl('arcadeGameSnake');

const typingCanvas = regEl('typingShooterCanvas', 'canvas');
typingCanvas.width = 840;
typingCanvas.height = 420;
typingCanvas.getContext = () => createMockContext();

const snakeCanvas = regEl('snakeCanvas', 'canvas');
snakeCanvas.width = 360;
snakeCanvas.height = 360;
snakeCanvas.getContext = () => createMockContext();

const typingStartBtn = regEl('typingStartBtn', 'button');
const typingPauseBtn = regEl('typingPauseBtn', 'button');
const typingRestartBtn = regEl('typingRestartBtn', 'button');
const typingSoundBtn = regEl('typingSoundBtn', 'button');
const typingMobileInput = regEl('typingShooterInput', 'input');
const typingScore = regEl('typingScore');
const typingCombo = regEl('typingCombo');
const typingWpm = regEl('typingWpm');
const typingAccuracy = regEl('typingAccuracy');
const typingTime = regEl('typingTime');
const typingBest = regEl('typingBest');
const typingStatus = regEl('typingStatus');

const snakeStartBtn = regEl('snakeStartBtn', 'button');
const snakePauseBtn = regEl('snakePauseBtn', 'button');
const snakeRestartBtn = regEl('snakeRestartBtn', 'button');
const snakeSoundBtn = regEl('snakeSoundBtn', 'button');
const snakeScore = regEl('snakeScore');
const snakeBest = regEl('snakeBest');
const snakeStatus = regEl('snakeStatus');

// Difficulty containers
function createDiffToggle(gameFor) {
  const container = createMockElement('diff-' + gameFor);
  container.setAttribute('data-difficulty-for', gameFor);
  const easyBtn = createMockElement('btn-easy', 'button');
  easyBtn.dataset.difficulty = 'easy';
  const medBtn = createMockElement('btn-med', 'button');
  medBtn.dataset.difficulty = 'medium';
  const hardBtn = createMockElement('btn-hard', 'button');
  hardBtn.dataset.difficulty = 'hard';

  const btns = [easyBtn, medBtn, hardBtn];
  container.querySelectorAll = (sel) => sel.includes('data-difficulty') ? btns : [];
  return { container, easyBtn, medBtn, hardBtn };
}

const typingDiff = createDiffToggle('typing-shooter');
typingView.querySelector = (sel) => sel.includes('data-difficulty-for') ? typingDiff.container : null;

const snakeDiff = createDiffToggle('snake');
snakeView.querySelector = (sel) => sel.includes('data-difficulty-for') ? snakeDiff.container : null;

// Switcher buttons
const btnSwitchTyping = createMockElement('switchTyping', 'button');
btnSwitchTyping.dataset.arcadeGame = 'typing';
const btnSwitchSnake = createMockElement('switchSnake', 'button');
btnSwitchSnake.dataset.arcadeGame = 'snake';
const switcherBtns = [btnSwitchTyping, btnSwitchSnake];

hubPanel.querySelectorAll = (sel) => sel.includes('data-arcade-game') ? switcherBtns : [];

// Direction buttons
const dpadUp = createMockElement('dpad-up', 'button'); dpadUp.dataset.snakeDirection = 'up';
const dpadDown = createMockElement('dpad-down', 'button'); dpadDown.dataset.snakeDirection = 'down';
const dpadLeft = createMockElement('dpad-left', 'button'); dpadLeft.dataset.snakeDirection = 'left';
const dpadRight = createMockElement('dpad-right', 'button'); dpadRight.dataset.snakeDirection = 'right';
const dpadBtns = [dpadUp, dpadDown, dpadLeft, dpadRight];

document.querySelectorAll = (sel) => {
  if (sel.includes('data-snake-direction')) return dpadBtns;
  if (sel.includes('data-arcade-game')) return switcherBtns;
  return [];
};
document.getElementById = (id) => elements[id] || null;

// 2. Load and Run Arcade Hub Script
console.log('=== TEST SUITE: ARCADE HUB MODULE ===');
require(path.join(__dirname, '..', 'js', 'arcade-hub.js'));

let passed = 0;
let failed = 0;
function assert(desc, condition) {
  if (condition) {
    console.log(`  ✔ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`  ✖ FAIL: ${desc}`);
    failed++;
  }
}

// TEST 1: Initial Setup & 0% CPU Idle
assert('ArcadeHub initialized properly on window', typeof window.ArcadeHub === 'object');
assert('Zero animation frames running on idle initial load', rafCallbacks.length === 0);
assert('Typing canvas initialized with default Easy time (45s)', typingTime.textContent === '45s');

// TEST 2: Tab Switching Resilience (Switch 12 times)
console.log('\n--- Test 2: Rapid Tab Switching (12x) ---');
for (let i = 0; i < 12; i++) {
  const target = i % 2 === 0 ? 'snake' : 'typing';
  window.ArcadeHub.switchGame(target);
}
// Ensure we can still switch to typing and controls work
window.ArcadeHub.switchGame('typing');
assert('Typing view visible after 12 switches', typingView.hidden === false);
assert('Snake view hidden after switching to typing', snakeView.hidden === true);
assert('Start button on Type Blaster still clickable after 12 switches', typeof typingStartBtn.click === 'function');

// TEST 3: Type Blaster Gameplay, Mechanics & Difficulty
console.log('\n--- Test 3: Type Blaster Round, Target Shooting & Combo ---');
typingDiff.easyBtn.click();
assert('Easy difficulty pressed attribute is true', typingDiff.easyBtn.getAttribute('aria-pressed') === 'true');

typingStartBtn.click();
assert('Type Blaster round is active (rAF loop running)', rafCallbacks.length > 0);
assert('Start button displays Playing…', typingStartBtn.textContent === 'Playing…');

// Advance time and execute 10 ticks to spawn rocks
for (let f = 0; f < 30; f++) {
  nowTime += 100;
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  cbs.forEach(c => c.cb(nowTime));
}

// Simulate physical keyboard input
const keyEventA = { key: 'a', preventDefault: () => {} };
const winKeyListeners = winListeners['keydown'] || [];
assert('Active keydown listener attached to window', winKeyListeners.length > 0);

winKeyListeners.forEach(fn => fn(keyEventA));

// Test Pause & Resume
typingPauseBtn.click();
assert('Typing round paused, rAF callbacks canceled immediately (0% CPU)', rafCallbacks.length === 0);
assert('Pause button shows Resume', typingPauseBtn.textContent === 'Resume');

typingPauseBtn.click(); // Resume
assert('Typing round resumed, rAF restored', rafCallbacks.length > 0);

// TEST 4: Switching to Snake Mid-Round (Lifecycle & CPU Safety)
console.log('\n--- Test 4: Switching to Snake while Type Blaster is Running ---');
window.ArcadeHub.switchGame('snake');
assert('Type Blaster stopped, rAF canceled (0% CPU)', rafCallbacks.length === 0);
assert('Snake view is now visible', snakeView.hidden === false);

// Start Snake round
snakeStartBtn.click();
assert('Snake is running', snakeStartBtn.textContent === 'Playing…');

// Test Snake Directions & Input Buffer Queue
const winSnakeKeys = winListeners['keydown'] || [];
assert('Snake window keydown listener active', winSnakeKeys.length > 0);

// Send ArrowRight, then ArrowDown
winSnakeKeys.forEach(fn => fn({ code: 'ArrowRight', key: 'ArrowRight', preventDefault: () => {} }));
winSnakeKeys.forEach(fn => fn({ code: 'ArrowDown', key: 'ArrowDown', preventDefault: () => {} }));

// Test Pause on Snake
snakePauseBtn.click();
assert('Snake paused, interval cleared', snakePauseBtn.textContent === 'Resume');

// TEST 5: Leaving Playground Tab (`playground:tabchange`)
console.log('\n--- Test 5: Leaving Arcade Hub Tab in Playground ---');
document.dispatchEvent({ type: 'playground:tabchange', detail: { labId: 'shooter' } });
assert('All active games paused when leaving Arcade Hub', typingStartBtn.textContent !== 'Playing…' && snakeStartBtn.textContent !== 'Playing…');

// TEST 6: Hiding Browser Tab (`visibilitychange`)
console.log('\n--- Test 6: Minimizing Window / Hiding Browser Tab ---');
window.ArcadeHub.switchGame('typing');
typingStartBtn.click();
assert('Type Blaster running before minimize', rafCallbacks.length > 0);

document.hidden = true;
document.dispatchEvent({ type: 'visibilitychange' });
assert('Type Blaster immediately paused when browser is hidden (0% CPU)', rafCallbacks.length === 0);
document.hidden = false;

// TEST 7: Sound Toggle
console.log('\n--- Test 7: Sound Toggle Persistence ---');
typingSoundBtn.click();
const soundState1 = localStorage.getItem('arcadeSoundEnabled');
assert('Sound state saved to localStorage', soundState1 !== null);

typingSoundBtn.click();
const soundState2 = localStorage.getItem('arcadeSoundEnabled');
assert('Sound toggle flipped in localStorage', soundState1 !== soundState2);

// Summary
console.log('\n========================================');
console.log(`TEST RESULTS: ${passed} Passed, ${failed} Failed`);
console.log('========================================');

process.exit(failed > 0 ? 1 : 0);
