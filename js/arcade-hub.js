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
 */

(() => {
  'use strict';

  // ─── SHARED STORAGE ─────────────────────────────────────────────────────────
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


  // ─── PURE WEB AUDIO SYNTHESIZER (ZERO EXTERNAL ASSETS) ──────────────────────
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


  // ─── TYPE BLASTER: PREMIUM TYPING ARCADE MODULE ─────────────────────────────
  const TypeBlasterGame = (() => {
    let container, canvas, ctx;
    let startBtn, pauseBtn, restartBtn, soundBtn, mobileInput;
    let scoreEl, comboEl, wpmEl, accuracyEl, timeEl, bestEl, statusEl;
    let diffContainer;
    let phraseDoneEl, phraseCurrentEl, phraseUpcomingEl;
    let typingStreamKeysEl, typingLastKeyBadgeEl, typingModeTagEl;

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
      ]
    };

    // Difficulty Settings:
    // Easy: ~3.6s spawn, 36-46 px/s speed, max 3 rocks, 8 integrity
    // Medium: ~2.2s spawn, 78-96 px/s speed, max 4 rocks, 6 integrity
    // Hard: ~0.95s spawn, 140-175 px/s speed, max 6 rocks, 3 integrity (genuinely hard speed test!)
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
        letterPool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ{};()=><_!+-."'
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
    let recentKeystrokes = [];

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
      if (typingModeTagEl) {
        typingModeTagEl.textContent = `🎯 TARGET SENTENCE (${difficulty.toUpperCase()})`;
      }
    }

    function syncSoundUI() {
      if (!soundBtn) return;
      const on = ArcadeAudio.isEnabled();
      soundBtn.textContent = on ? '🔊 Sound' : '🔇 Muted';
      soundBtn.setAttribute('aria-pressed', String(on));
    }

    function initSentence() {
      const pool = SENTENCE_POOLS[difficulty] || SENTENCE_POOLS.easy;
      currentSentence = pool[sentencePoolIndex % pool.length];
      sentenceIndex = 0;
      syncSentenceHUD();
    }

    function advanceToNextSentence() {
      const pool = SENTENCE_POOLS[difficulty] || SENTENCE_POOLS.easy;
      sentencePoolIndex = (sentencePoolIndex + 1) % pool.length;
      currentSentence = pool[sentencePoolIndex];
      sentenceIndex = 0;
      syncSentenceHUD();
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

    function syncSentenceHUD() {
      if (!currentSentence) {
        if (phraseDoneEl) phraseDoneEl.textContent = '';
        if (phraseCurrentEl) phraseCurrentEl.textContent = '_';
        if (phraseUpcomingEl) phraseUpcomingEl.textContent = 'Press Start round to begin';
        return;
      }

      // If at space, advance
      while (sentenceIndex < currentSentence.length && currentSentence[sentenceIndex] === ' ') {
        sentenceIndex++;
      }

      const done = currentSentence.slice(0, sentenceIndex);
      const current = sentenceIndex < currentSentence.length ? currentSentence[sentenceIndex] : '✓';
      const upcoming = sentenceIndex < currentSentence.length ? currentSentence.slice(sentenceIndex + 1) : '';

      if (phraseDoneEl) phraseDoneEl.textContent = done;
      if (phraseCurrentEl) {
        phraseCurrentEl.textContent = current === ' ' ? '␣' : current;
      }
      if (phraseUpcomingEl) phraseUpcomingEl.textContent = upcoming;
    }

    function addKeystrokeLog(char, isHit) {
      const displayChar = char === ' ' ? 'SPACE' : String(char).toUpperCase();
      recentKeystrokes.push({ char: displayChar, isHit, id: Date.now() + Math.random() });
      if (recentKeystrokes.length > 8) {
        recentKeystrokes.shift();
      }

      if (typingLastKeyBadgeEl) {
        typingLastKeyBadgeEl.className = `typing-last-key-badge ${isHit ? 'badge-hit' : 'badge-miss'}`;
        typingLastKeyBadgeEl.textContent = `${isHit ? 'HIT' : 'MISS'} [${displayChar}]`;
      }

      if (typingStreamKeysEl) {
        typingStreamKeysEl.replaceChildren();
        recentKeystrokes.forEach((k) => {
          const pill = document.createElement('span');
          pill.className = `key-pill ${k.isHit ? 'key-hit' : 'key-miss'}`;
          pill.textContent = `${k.char} ${k.isHit ? '✓' : '✗'}`;
          typingStreamKeysEl.appendChild(pill);
        });
      }
    }

    function updateMetrics(now = performance.now()) {
      const elapsed = isPlaying ? elapsedBeforePause + (now - roundStartedAt) : elapsedBeforePause;
      const duration = settings[difficulty].duration;
      const minutes = Math.max(elapsed / 60000, 1 / 60);
      const wpm = Math.round((totalHits / 5) / minutes);
      const accuracy = totalTyped ? Math.round((totalHits / totalTyped) * 100) : 100;

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

      // Prioritize spawning the active sentence target letter if not yet present on screen
      let chosenLetter = '';
      if (activeTarget && !currentLetters.has(activeTarget)) {
        chosenLetter = activeTarget;
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

      // Distribute lanes with safe spacing
      const occupied = rocks.map((r) => r.x);
      let lane = canvas.width / 2;
      for (let attempts = 0; attempts < 16; attempts++) {
        const cand = 72 + Math.random() * (canvas.width - 144);
        if (occupied.every((x) => Math.abs(x - cand) > 96)) {
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
        letter: chosenLetter,
        speed: cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.35,
        polygon: createRockPolygon(id, radius)
      });
    }

    function fireLetter(char) {
      if (!isPlaying || isPaused) return;
      const upper = String(char).toUpperCase();
      if (!upper) return;

      totalTyped++;

      const activeTarget = getActiveTargetChar();
      if (!activeTarget || upper !== activeTarget) {
        combo = 0;
        ArcadeAudio.playMiss();
        addKeystrokeLog(upper, false);
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

        // Aim defense turret directly at target rock
        const turretX = canvas.width / 2;
        const turretY = canvas.height - 32;
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

        addKeystrokeLog(upper, true);
        totalHits++;

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
            ArcadeAudio.playCombo(6);
            popups.push({
              x: canvas.width / 2,
              y: canvas.height / 2 - 20,
              text: '🎉 SENTENCE CLEARED! +500 PTS',
              color: '#34d399',
              life: 1.5,
              maxLife: 1.5
            });
            advanceToNextSentence();
            if (statusEl) {
              statusEl.textContent = '🎉 Sentence completed! +500 Bonus Points! Next sentence loaded.';
            }
          } else {
            syncSentenceHUD();
            if (statusEl) {
              statusEl.textContent = combo > 2 ? `🔥 Streak! Combo ${combo}x!` : `Blasted rock ${upper}! Keep typing!`;
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
        addKeystrokeLog(upper, false);
        if (statusEl) {
          statusEl.textContent = `No incoming rock has '${upper}' — check the target phrase below!`;
        }
      }

      updateMetrics();
    }

    function createExplosion(x, y, letter, pointsEarned) {
      ArcadeAudio.playExplosion();
      screenShake = 6;

      const count = 18;
      for (let i = 0; i < count; i++) {
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

      const elapsed = updateMetrics();
      const wpm = Math.round((totalHits / 5) / Math.max(elapsed / 60000, 1 / 60));
      const accuracy = totalTyped ? Math.round((totalHits / totalTyped) * 100) : 100;

      let rank = 'Novice Typist';
      if (wpm >= 80) rank = 'Master Typist 🔥';
      else if (wpm >= 60) rank = 'Pro Developer ⚡';
      else if (wpm >= 40) rank = 'Fast Typist 🚀';
      else if (wpm >= 20) rank = 'Intermediate ⌨️';

      let isNewRecord = false;
      if (score > bestScore) {
        bestScore = score;
        isNewRecord = true;
        ArcadeStorage.write(storageKey(), bestScore);
        if (bestEl) bestEl.textContent = String(bestScore);
      }

      if (statusEl) {
        const recordNote = isNewRecord ? ' 🏆 NEW HIGH SCORE!' : '';
        statusEl.textContent = `${msg} Speed: ${wpm} WPM · Accuracy: ${accuracy}% · Rank: ${rank}.${recordNote}`;
      }

      if (startBtn) startBtn.textContent = 'Play again';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      draw();
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

      // 1. Sci-Fi Space Backdrop
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#040b17');
      grad.addColorStop(0.55, '#07152b');
      grad.addColorStop(1, '#0b1b36');
      ctx.fillStyle = grad;
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
        ctx.lineTo(x, h - 38);
        ctx.stroke();
      }
      for (let y = 0; y <= h - 38; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 4. Perimeter Defense Line & Shield Bar
      const maxIntegrity = settings[difficulty].integrity;
      const currentIntegrity = Math.max(0, maxIntegrity - escapedRocks);
      const integrityRatio = currentIntegrity / maxIntegrity;

      const shieldY = h - 38;
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
      ctx.fillText(`PERIMETER SHIELD: ${currentIntegrity} / ${maxIntegrity} [${difficulty.toUpperCase()}]`, 18, h - 14);

      if (combo > 1) {
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'right';
        ctx.fillText(`COMBO x${combo} 🔥`, w - 18, h - 14);
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

      rocks.forEach((r) => {
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.rot);

        // A. Shaded Organic Asteroid Body
        const rGrad = ctx.createRadialGradient(-8, -10, 4, 0, 0, r.radius);
        rGrad.addColorStop(0, '#94a3b8');
        rGrad.addColorStop(0.35, '#475569');
        rGrad.addColorStop(0.85, '#1e293b');
        rGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = rGrad;

        ctx.beginPath();
        r.polygon.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.restore(); // Undo rotation so letter ALWAYS stays 100% upright

        // B. Large High-Contrast Target Letter Badge
        ctx.save();
        ctx.translate(r.x, r.y);

        const isDanger = r.y > h * 0.65;
        const isCurrentSentenceTarget = (activeTargetChar && r.letter.toUpperCase() === activeTargetChar);
        const badgeRadius = 32; // 64px high-contrast badge keeps similar letters distinct

        // Outer Target Ring / Reticle
        ctx.beginPath();
        ctx.arc(0, 0, badgeRadius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = isDanger
          ? 'rgba(239, 68, 68, 0.85)'
          : (isCurrentSentenceTarget ? 'rgba(56, 189, 248, 0.95)' : 'rgba(148, 163, 184, 0.6)');
        ctx.lineWidth = isCurrentSentenceTarget ? 3 : 2;
        if (isCurrentSentenceTarget) {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
        }
        ctx.stroke();

        // Solid Obsidian Badge Background for 100% MAXIMUM Letter Contrast
        ctx.beginPath();
        ctx.arc(0, 0, badgeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#020617';
        ctx.fill();

        // Inner Badge Accent Ring
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isDanger ? '#ef4444' : (isCurrentSentenceTarget ? '#38bdf8' : '#475569');
        ctx.lineWidth = 1.5;
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

        // Target Lock Tag for active sentence character
        if (isCurrentSentenceTarget) {
          ctx.fillStyle = '#38bdf8';
          ctx.font = '700 9px var(--font-mono, monospace)';
          ctx.textAlign = 'center';
          ctx.fillText('TARGET LOCK', 0, -badgeRadius - 8);
        }

        // Extra-large upright glyph, isolated from the rotating asteroid body.
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = isDanger ? '#ef4444' : (isCurrentSentenceTarget ? '#38bdf8' : 'rgba(0, 0, 0, 0.8)');
        ctx.shadowBlur = isCurrentSentenceTarget ? 10 : 4;
        ctx.font = '900 42px "Arial Black", "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.letter, 0, 1);

        ctx.restore();
      });

      // 7. Defense Turret Cannon at Base
      const turretX = w / 2;
      const turretY = shieldY + 6;

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
        ctx.fillText('TYPE BLASTER: SPEED TYPING ARCADE', w / 2, h / 2 - 34);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '600 15px var(--font-sans, sans-serif)';
        ctx.fillText('Blast falling letter asteroids by typing meaningful dev sentences!', w / 2, h / 2);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px var(--font-mono, monospace)';
        ctx.fillText('Desktop: Type keys directly · Live keystrokes stream below', w / 2, h / 2 + 24);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '700 14px var(--font-mono, monospace)';
        ctx.fillText('Click "Start round" to initialize speed mission', w / 2, h / 2 + 56);
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
        ctx.fillText(currentIntegrity > 0 ? 'MISSION ACCOMPLISHED' : 'DEFENSE BREACHED', w / 2, h / 2 - 46);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 16px var(--font-sans, sans-serif)';
        ctx.fillText(`Final Score: ${score} · High Score: ${bestScore} (${difficulty})`, w / 2, h / 2 - 12);

        ctx.fillStyle = '#34d399';
        ctx.font = '700 15px var(--font-mono, monospace)';
        const finalWpm = wpmEl ? wpmEl.textContent : '0 WPM';
        const finalAcc = accuracyEl ? accuracyEl.textContent : '100%';
        ctx.fillText(`Typing Speed: ${finalWpm} · Accuracy: ${finalAcc} · Streak: ${maxCombo}x`, w / 2, h / 2 + 18);

        ctx.fillStyle = '#fef08a';
        ctx.font = '700 14px var(--font-sans, sans-serif)';
        ctx.fillText('Click "Play again" to launch another speed run', w / 2, h / 2 + 54);
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
      }

      rocks.forEach((r) => {
        r.y += r.speed * delta;
        r.rot += r.rotSpeed * delta;
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
            createExplosion(target.x, target.y, target.letter, pointsEarned);
            return false;
          }
        }
        return b.y > -30 && b.y < canvas.height + 30 && b.x > -30 && b.x < canvas.width + 30;
      });

      const remaining = [];
      rocks.forEach((r) => {
        if (r.y > canvas.height - 44) {
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
        recentKeystrokes = [];
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
        if (typingStreamKeysEl) {
          typingStreamKeysEl.replaceChildren();
          const idlePill = document.createElement('span');
          idlePill.className = 'key-pill key-idle';
          idlePill.textContent = 'Awaiting first keystroke…';
          typingStreamKeysEl.appendChild(idlePill);
        }
        if (typingLastKeyBadgeEl) {
          typingLastKeyBadgeEl.className = 'typing-last-key-badge';
          typingLastKeyBadgeEl.textContent = 'Last key: None';
        }
      }

      isPlaying = true;
      isPaused = false;
      roundStartedAt = performance.now();
      lastFrameTime = roundStartedAt;

      if (startBtn) startBtn.textContent = 'Playing…';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      if (statusEl) statusEl.textContent = 'Type the falling rock letters to complete the target sentence!';

      if (window.matchMedia('(pointer: coarse)').matches && mobileInput) {
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

      if (startBtn) startBtn.textContent = 'Resume round';
      if (pauseBtn) pauseBtn.textContent = 'Resume';
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
      syncSentenceHUD();
      draw();
    }

    function deactivate() {
      isKeyActive = false;
      window.removeEventListener('keydown', handleKeyDown);
      pause('Paused while switching.');
    }

    function setup() {
      if (isSetupDone) return;
      container = document.getElementById('arcadeGameTyping');
      canvas = document.getElementById('typingShooterCanvas');
      if (!container || !canvas) return;

      ctx = canvas.getContext('2d', { alpha: false });
      startBtn = document.getElementById('typingStartBtn');
      pauseBtn = document.getElementById('typingPauseBtn');
      restartBtn = document.getElementById('typingRestartBtn');
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

      phraseDoneEl = document.getElementById('phraseDone');
      phraseCurrentEl = document.getElementById('phraseCurrent');
      phraseUpcomingEl = document.getElementById('phraseUpcoming');
      typingStreamKeysEl = document.getElementById('typingStreamKeys');
      typingLastKeyBadgeEl = document.getElementById('typingLastKeyBadge');
      typingModeTagEl = document.getElementById('typingModeTag');

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

      if (startBtn) {
        startBtn.addEventListener('click', () => {
          if (isPaused) start(false);
          else start(isFinished);
        });
      }
      if (restartBtn) {
        restartBtn.addEventListener('click', () => start(true));
      }
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


  // ─── NOKIA SNAKE: AUTHENTIC RETRO LCD MODULE ────────────────────────────────
  const NokiaSnakeGame = (() => {
    let container, canvas, ctx;
    let startBtn, pauseBtn, restartBtn, soundBtn;
    let scoreEl, bestEl, statusEl;
    let diffContainer;

    // 20x20 Grid with 24px units on 480x480 canvas for enlarged, crisp Nokia LCD display
    const cells = 20;
    let unit = 24;

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
    let foodBlinkState = true;

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
      soundBtn.textContent = on ? '🔊 Sound' : '🔇 Muted';
      soundBtn.setAttribute('aria-pressed', String(on));
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
        return stop('🏆 INCREDIBLE! You filled the entire board! You Win!');
      }

      food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    function draw() {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      // Authentic retro Nokia monochrome green LCD screen
      ctx.fillStyle = '#9caf88';
      ctx.fillRect(0, 0, w, h);

      // LCD Pixel Matrix Texture
      ctx.fillStyle = 'rgba(47, 62, 45, 0.08)';
      for (let i = 0; i <= cells; i++) {
        ctx.fillRect(i * unit, 0, 1, h);
        ctx.fillRect(0, i * unit, w, 1);
      }

      // Food (Retro LCD Apple with subtle blink)
      if (food) {
        const fx = food.x * unit;
        const fy = food.y * unit;
        ctx.fillStyle = '#183b25';
        ctx.fillRect(fx + 3, fy + 3, unit - 6, unit - 6);
        ctx.fillStyle = '#9caf88';
        ctx.fillRect(fx + 6, fy + 6, 3, 3);
      }

      // Snake Body & Head
      snake.forEach((part, index) => {
        const px = part.x * unit;
        const py = part.y * unit;

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
        ctx.fillRect(0, 0, w, h);

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
        ctx.fillRect(0, 0, w, h);

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

      if (startBtn) startBtn.textContent = 'Playing…';
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
        const recordNote = score >= bestScore && score > 0 ? ' 🏆 NEW RECORD!' : '';
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
      container = document.getElementById('arcadeGameSnake');
      canvas = document.getElementById('snakeCanvas');
      if (!container || !canvas) return;

      ctx = canvas.getContext('2d', { alpha: false });
      unit = canvas.width / cells;

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


  // ─── UNIFIED ARCADE HUB SHELL CONTROLLER ────────────────────────────────────
  const ArcadeHub = {
    activeGame: 'typing', // 'typing' | 'snake'
    isInitialized: false,

    switchGame(gameId) {
      if (gameId === this.activeGame && this.isInitialized) return;

      const typingView = document.getElementById('arcadeGameTyping');
      const snakeView = document.getElementById('arcadeGameSnake');
      const switcherBtns = document.querySelectorAll('[data-arcade-game]');

      // 1. Deactivate outgoing game (cancels loops, detaches key listener, CPU = 0%)
      if (this.activeGame === 'typing') {
        TypeBlasterGame.deactivate();
      } else if (this.activeGame === 'snake') {
        NokiaSnakeGame.deactivate();
      }

      this.activeGame = gameId;

      // 2. Toggle UI views & accessibility attributes
      switcherBtns.forEach((btn) => {
        const isMatch = btn.dataset.arcadeGame === gameId;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', String(isMatch));
      });

      // 3. Activate incoming game (attaches key listener, renders fresh idle state)
      if (gameId === 'typing') {
        if (snakeView) snakeView.hidden = true;
        if (typingView) {
          typingView.hidden = false;
          TypeBlasterGame.activate();
        }
      } else {
        if (typingView) typingView.hidden = true;
        if (snakeView) {
          snakeView.hidden = false;
          NokiaSnakeGame.activate();
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
      if (this.isInitialized) return;
      const hubPanel = document.getElementById('lab-arcade-hub');
      if (!hubPanel) return;

      // One-time setup of both game modules (binds DOM buttons permanently)
      TypeBlasterGame.setup();
      NokiaSnakeGame.setup();

      // Activate initial default game
      if (this.activeGame === 'typing') {
        TypeBlasterGame.activate();
      } else {
        NokiaSnakeGame.activate();
      }

      // Bind Sub-Tab Switcher buttons
      const switcherBtns = hubPanel.querySelectorAll('[data-arcade-game]');
      switcherBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          this.switchGame(btn.dataset.arcadeGame);
        });
      });

      // Listen for playground lab tab changes
      document.addEventListener('playground:tabchange', (e) => {
        if (e.detail?.labId !== 'arcade-hub') {
          // Immediately pause loops when leaving Arcade Hub
          this.pauseCurrentGame('Game paused. Return to Arcade Hub to resume.');
        } else {
          // Returning to Arcade Hub: redraw active game
          if (this.activeGame === 'typing') TypeBlasterGame.drawIdle();
          else NokiaSnakeGame.drawIdle();
        }
      });

      // Window Visibility change: immediately freeze animations when tab is hidden
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseCurrentGame('Game paused while window was hidden.');
        }
      });

      this.isInitialized = true;
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
