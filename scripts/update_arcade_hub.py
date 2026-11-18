# -*- coding: utf-8 -*-
from pathlib import Path

content = '''/**
 * Arcade Hub: Premium Retro Gaming Shell for Type Blaster & Nokia Snake
 * 
 * Features:
 * - High-contrast futuristic typing arcade with directed laser targeting & particle physics.
 *   Free-form shooting: shoot any letter in any order!
 *   Difficulty modes: Easy, Medium, Hard (intense), and Expert (60s speed sprint without getting out).
 *   Wider battlefield (1200px) with dynamic rock sizing (enlarged on mobile for easy readability and tapping).
 *   Fullscreen mode and mobile touch-to-blast support.
 * - Authentic Nokia monochrome LCD snake with input buffer, directional eye graphics, and swipe controls.
 * - Built-in zero-dependency Web Audio API retro sound synthesizer with user mute toggle.
 * - Strict lifecycle management: 0% CPU when idle, paused, tab-switched, or window minimized.
 * - Type Blaster & Nokia Snake are independent playground tabs.
 */

(() => {
  'use strict';

  // ─── SHARED STORAGE ──────────────────────────────────────────────────────────
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
    getDifficulty(key, fallback = 'medium', valid = ['easy', 'medium', 'hard', 'expert']) {
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


  // ─── PURE WEB AUDIO SYNTHESIZER (ZERO EXTERNAL ASSETS) ─────────────────────
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


  // ─── MOBILE DETECTION ────────────────────────────────────────────────────────
  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  const MAX_PARTICLES = isMobile ? 120 : 500;

  function isMobileMode() {
    return isMobile || (typeof window !== 'undefined' && window.innerWidth <= 768);
  }


  // ─── TYPE BLASTER: SPEED TYPING ARCADE MODULE ────────────────────────────────
  const TypeBlasterGame = (() => {
    let container, canvas, ctx;
    let startBtn, pauseBtn, soundBtn, fullscreenBtn, mobileInput;
    let scoreEl, comboEl, wpmEl, accuracyEl, timeEl, bestEl, statusEl;
    let diffContainer;

    // Difficulty Settings: Balanced, practical, and highly engaging
    const settings = {
      easy: {
        duration: 45000,
        spawn: 1.8,
        speedMin: 55,
        speedMax: 85,
        maxRocks: 6,
        integrity: 6,
        letterPool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      },
      medium: {
        duration: 45000,
        spawn: 1.1,
        speedMin: 95,
        speedMax: 135,
        maxRocks: 8,
        integrity: 5,
        letterPool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      },
      hard: {
        duration: 45000,
        spawn: 0.85,
        speedMin: 120,
        speedMax: 160,
        maxRocks: 10,
        integrity: 4,
        letterPool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      },
      expert: {
        duration: 60000, // 60-second Speed Sprint!
        spawn: 0.48,     // Practical and steady stream
        speedMin: 135,
        speedMax: 180,
        maxRocks: 14,    // Ample targets without overwhelming clutter
        integrity: Infinity, // User plays WITHOUT being out to test true typing speed!
        isSpeedTest: true,
        letterPool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
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

    // WPM/Accuracy tracking
    let keypressTimes = [];
    let firstKeypressTime = 0;

    // Cached backdrop gradient
    let cachedBackdropGrad = null;
    let cachedBackdropW = 0;
    let cachedBackdropH = 0;

    // Starfield particles
    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.6 + 0.25
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
      soundBtn.textContent = on ? '🔊 Sound' : '🔇 Muted';
      soundBtn.setAttribute('aria-pressed', String(on));
    }

    function toggleFullscreen() {
      const stage = container?.querySelector('.typing-shooter-stage') || container;
      if (!stage) return;
      const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement || stage.classList.contains('is-fullscreen-fallback'));
      if (!isFs) {
        if (stage.requestFullscreen) {
          stage.requestFullscreen().catch(() => stage.classList.toggle('is-fullscreen-fallback'));
        } else if (stage.webkitRequestFullscreen) {
          stage.webkitRequestFullscreen();
        } else {
          stage.classList.toggle('is-fullscreen-fallback');
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        stage.classList.remove('is-fullscreen-fallback');
      }
      syncFullscreenBtn();
    }

    function syncFullscreenBtn() {
      if (!fullscreenBtn) return;
      const stage = container?.querySelector('.typing-shooter-stage');
      const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement || stage?.classList.contains('is-fullscreen-fallback'));
      fullscreenBtn.textContent = isFs ? '✕ Exit Fullscreen' : '⛶ Fullscreen';
      fullscreenBtn.setAttribute('aria-pressed', String(isFs));
    }

    function updateMetrics(now = performance.now()) {
      const elapsed = isPlaying ? elapsedBeforePause + (now - roundStartedAt) : elapsedBeforePause;
      const duration = settings[difficulty].duration;

      let wpm = 0;
      let cpm = 0;
      const elapsedMinutes = (elapsed || 1) / 60000;
      if (elapsedMinutes > 0 && totalHits > 0) {
        wpm = Math.round((totalHits / 5) / elapsedMinutes);
        cpm = Math.round(totalHits / elapsedMinutes);
      }

      const accuracy = totalTyped > 0 ? Math.round((totalHits / totalTyped) * 100) : 100;

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

      const currentLetters = new Set(rocks.map((r) => r.letter.toUpperCase()));
      const pool = cfg.letterPool;
      let available = pool.split('').filter((c) => !currentLetters.has(c.toUpperCase()));
      if (!available.length) available = pool.split('');
      const chosenLetter = available[Math.floor(Math.random() * available.length)].toUpperCase();

      // Rock radius: noticeably bigger on mobile (35px) for clear visibility & easy touch, compact (26px) on desktop
      const radius = isMobileMode() ? 35 : 26;

      const occupied = rocks.filter((r) => r.y < 130).map((r) => r.x);
      let lane = 60 + Math.random() * (canvas.width - 120);
      for (let attempts = 0; attempts < 16; attempts++) {
        const cand = 60 + Math.random() * (canvas.width - 120);
        if (occupied.every((x) => Math.abs(x - cand) > (radius * 2.4))) {
          lane = cand;
          break;
        }
      }

      const id = nextRockId++;
      const rock = {
        id,
        x: lane,
        y: -35,
        radius,
        letter: chosenLetter,
        speed: cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.35,
        polygon: createRockPolygon(id, radius),
        drift: (Math.random() - 0.5) * (difficulty === 'expert' || difficulty === 'hard' ? 35 : 15)
      };

      rocks.push(rock);
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

      // Free-form typing: user can blast ANY letter in ANY order!
      // Find matching rocks on screen, prioritize lowest (closest to base)
      const matchingRocks = rocks
        .filter((r) => r.letter.toUpperCase() === upper)
        .sort((a, b) => b.y - a.y);

      const target = matchingRocks[0];

      if (target) {
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        ArcadeAudio.playLaser();
        if (combo > 1) ArcadeAudio.playCombo(combo);

        keypressTimes.push({ time: now, correct: true });
        totalHits++;

        // Aim turret directly at target rock
        const turretX = canvas.width / 2;
        const turretY = canvas.height - 42;
        const dx = target.x - turretX;
        const dy = target.y - turretY;
        turretTargetAngle = Math.atan2(dy, dx);

        const dist = Math.hypot(dx, dy) || 1;
        const bulletSpeed = 1500;

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

        if (statusEl) {
          statusEl.textContent = combo > 2 ? `🔥 Streak! Combo ${combo}x!` : `Blasted rock [${upper}]! Keep firing!`;
        }
      } else {
        combo = 0;
        ArcadeAudio.playMiss();
        keypressTimes.push({ time: now, correct: false });
        if (statusEl) {
          statusEl.textContent = `Miss! No rock has [${upper}] — scan incoming rocks!`;
        }
      }

      updateMetrics(now);
    }

    function createExplosion(x, y, letter, pointsEarned, customColor = null) {
      ArcadeAudio.playExplosion();
      screenShake = 6;

      const count = 16;
      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 70 + Math.random() * 190;
        const isNeon = i % 2 === 0;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.45 + Math.random() * 0.35,
          maxLife: 0.8,
          radius: isNeon ? 2.5 : 3.5,
          color: customColor || (isNeon ? '#38bdf8' : (Math.random() > 0.5 ? '#f59e0b' : '#ffffff'))
        });
      }

      if (pointsEarned > 0) {
        popups.push({
          x,
          y: y - 10,
          text: combo > 1 ? `+${pointsEarned} (${combo}x)` : `+${pointsEarned}`,
          color: combo > 2 ? '#facc15' : '#7dd3fc',
          life: 0.8,
          maxLife: 0.8
        });
      }
    }

    function getSpeedRank(wpm) {
      if (wpm >= 100) return '⚡ Cyberspace Legend';
      if (wpm >= 80) return '🔥 Hyper Typist';
      if (wpm >= 60) return '🚀 Elite Typist';
      if (wpm >= 40) return '💻 Pro Coder';
      if (wpm >= 25) return '🎯 Swift Striker';
      return '🌱 Novice Typist';
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

      const elapsedMinutes = (elapsedBeforePause || 1) / 60000;
      const wpm = elapsedMinutes > 0 && totalHits > 0 ? Math.round((totalHits / 5) / elapsedMinutes) : 0;
      const cpm = elapsedMinutes > 0 && totalHits > 0 ? Math.round(totalHits / elapsedMinutes) : 0;
      const accuracy = totalTyped > 0 ? Math.round((totalHits / totalTyped) * 100) : 100;
      const rank = getSpeedRank(wpm);

      let isNewRecord = false;
      if (score > bestScore) {
        bestScore = score;
        isNewRecord = true;
        ArcadeStorage.write(storageKey(), bestScore);
        if (bestEl) bestEl.textContent = String(bestScore);
      }

      if (statusEl) {
        const recordNote = isNewRecord ? ' 🏆 NEW HIGH SCORE!' : '';
        statusEl.textContent = `${msg} Speed: ${wpm} WPM (${cpm} CPM) · Accuracy: ${accuracy}% · Rank: ${rank}.${recordNote}`;
      }

      if (startBtn) startBtn.textContent = 'Play again';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      draw();
    }

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

      // 1. Sci-Fi Space Backdrop
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
      const gridStep = 48;
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
      const isExpert = difficulty === 'expert';
      const currentIntegrity = isExpert ? 999 : Math.max(0, maxIntegrity - escapedRocks);
      const integrityRatio = isExpert ? 1 : (currentIntegrity / maxIntegrity);

      const shieldY = h - 48;
      const shieldGlow = ctx.createLinearGradient(0, shieldY - 4, 0, shieldY + 4);
      shieldGlow.addColorStop(0, 'rgba(56, 189, 248, 0)');
      shieldGlow.addColorStop(0.5, isExpert ? 'rgba(168, 85, 247, 0.85)' : (integrityRatio > 0.35 ? 'rgba(56, 189, 248, 0.8)' : 'rgba(239, 68, 68, 0.85)'));
      shieldGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = shieldGlow;
      ctx.fillRect(0, shieldY - 4, w, 8);

      ctx.strokeStyle = isExpert ? '#a855f7' : (integrityRatio > 0.35 ? '#38bdf8' : '#f87171');
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, shieldY);
      ctx.lineTo(w, shieldY);
      ctx.stroke();

      ctx.fillStyle = '#071224';
      ctx.fillRect(0, shieldY, w, h - shieldY);

      // Integrity gauge indicator
      ctx.fillStyle = isExpert ? '#c084fc' : (integrityRatio > 0.4 ? '#38bdf8' : '#ef4444');
      ctx.font = '700 12px var(--font-mono, monospace)';
      ctx.textAlign = 'left';
      const shieldLabel = isExpert
        ? '⚡ SPEED SPRINT [EXPERT]: UNLIMITED INTEGRITY — NEVER OUT!'
        : `PERIMETER SHIELD: ${currentIntegrity} / ${maxIntegrity} [${difficulty.toUpperCase()}]`;
      ctx.fillText(shieldLabel, 20, h - 20);

      if (combo > 1) {
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'right';
        ctx.fillText(`COMBO x${combo} 🔥`, w - 20, h - 20);
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

      // 6. Incoming Asteroid Rocks (Dynamic size: bigger on mobile for optimal tapping & visibility)
      const isMob = isMobileMode();
      const badgeRadius = isMob ? 24 : 18;
      const fontGlyph = isMob ? '900 28px "Arial Black", "JetBrains Mono", monospace' : '900 22px "Arial Black", "JetBrains Mono", monospace';

      rocks.forEach((r) => {
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.rot);

        const isDanger = r.y > h * 0.70;

        // Rock asteroid body
        const rGrad = ctx.createRadialGradient(-6, -7, 2, 0, 0, r.radius);
        rGrad.addColorStop(0, '#94a3b8');
        rGrad.addColorStop(0.4, '#475569');
        rGrad.addColorStop(0.85, '#1e293b');
        rGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = rGrad;

        ctx.beginPath();
        r.polygon.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();

        if (isDanger) {
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 4;
        }
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = isDanger ? 'rgba(239, 68, 68, 0.9)' : 'rgba(56, 189, 248, 0.65)';
        ctx.lineWidth = isMob ? 2.2 : 1.6;
        ctx.stroke();

        ctx.restore(); // Undo rotation for upright letter badge

        // Badge & Letter
        ctx.save();
        ctx.translate(r.x, r.y);

        // Circular badge background
        ctx.beginPath();
        ctx.arc(0, 0, badgeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#020617';
        ctx.fill();

        ctx.strokeStyle = isDanger ? '#ef4444' : '#38bdf8';
        ctx.lineWidth = isMob ? 2.4 : 1.8;
        ctx.stroke();

        // High contrast glyph
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = isDanger ? '#ef4444' : '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.font = fontGlyph;
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
      ctx.arc(turretX, turretY + 6, 26, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.save();
      ctx.translate(turretX, turretY);
      ctx.rotate(turretAngle + Math.PI / 2);

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-6, -30, 12, 30);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(-2, -32, 4, 32);
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
        ctx.fillStyle = 'rgba(4, 11, 23, 0.82)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 30px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('TYPE BLASTER: SPEED TYPING ARCADE', w / 2, h / 2 - 48);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '600 16px var(--font-sans, sans-serif)';
        ctx.fillText('Shoot ANY falling letter in ANY order — blast rocks to defend base!', w / 2, h / 2 - 12);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px var(--font-mono, monospace)';
        ctx.fillText('Desktop: Type keys directly · Mobile: Tap falling rocks or use input', w / 2, h / 2 + 18);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '700 15px var(--font-mono, monospace)';
        ctx.fillText('Click "Start round" or tap Fullscreen to launch mission', w / 2, h / 2 + 56);
      }

      // 11. Paused Overlay
      if (isPaused) {
        ctx.fillStyle = 'rgba(4, 11, 23, 0.82)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#e0f2fe';
        ctx.font = '700 28px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('COMBAT PAUSED', w / 2, h / 2 - 10);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px var(--font-sans, sans-serif)';
        ctx.fillText('Press Resume to return to combat', w / 2, h / 2 + 24);
      }

      // 12. Finished Overlay
      if (isFinished) {
        ctx.fillStyle = 'rgba(3, 8, 18, 0.92)';
        ctx.fillRect(0, 0, w, h);

        const elapsedMinutes = (elapsedBeforePause || 1) / 60000;
        const finalWpm = elapsedMinutes > 0 && totalHits > 0 ? Math.round((totalHits / 5) / elapsedMinutes) : 0;
        const finalCpm = elapsedMinutes > 0 && totalHits > 0 ? Math.round(totalHits / elapsedMinutes) : 0;
        const finalAcc = totalTyped > 0 ? Math.round((totalHits / totalTyped) * 100) : 100;
        const rank = getSpeedRank(finalWpm);

        if (difficulty === 'expert') {
          // SPEED TEST REPORT CARD
          ctx.fillStyle = '#c084fc';
          ctx.font = '800 32px var(--font-mono, monospace)';
          ctx.textAlign = 'center';
          ctx.fillText('⚡ TYPING SPEED SPRINT COMPLETED ⚡', w / 2, h / 2 - 80);

          ctx.fillStyle = '#f8fafc';
          ctx.font = '700 24px var(--font-mono, monospace)';
          ctx.fillText(`${finalWpm} WPM · ${finalCpm} CPM`, w / 2, h / 2 - 36);

          ctx.fillStyle = '#38bdf8';
          ctx.font = '600 16px var(--font-sans, sans-serif)';
          ctx.fillText(`Accuracy: ${finalAcc}% · Blasted: ${totalHits} rocks · Max Streak: ${maxCombo}x`, w / 2, h / 2);

          ctx.fillStyle = '#facc15';
          ctx.font = '800 18px var(--font-mono, monospace)';
          ctx.fillText(`Rank Tier: ${rank}`, w / 2, h / 2 + 34);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '600 14px var(--font-sans, sans-serif)';
          ctx.fillText(`Final Score: ${score} · High Score: ${bestScore}`, w / 2, h / 2 + 66);
        } else {
          ctx.fillStyle = currentIntegrity > 0 ? '#38bdf8' : '#f87171';
          ctx.font = '800 28px var(--font-mono, monospace)';
          ctx.textAlign = 'center';
          ctx.fillText(currentIntegrity > 0 ? 'MISSION ACCOMPLISHED' : 'DEFENSE BREACHED', w / 2, h / 2 - 56);

          ctx.fillStyle = '#f8fafc';
          ctx.font = '600 16px var(--font-sans, sans-serif)';
          ctx.fillText(`Final Score: ${score} · High Score: ${bestScore} (${difficulty.toUpperCase()})`, w / 2, h / 2 - 20);

          ctx.fillStyle = '#34d399';
          ctx.font = '700 15px var(--font-mono, monospace)';
          ctx.fillText(`Typing Speed: ${finalWpm} WPM · Accuracy: ${finalAcc}% · Streak: ${maxCombo}x`, w / 2, h / 2 + 12);
        }

        ctx.fillStyle = '#fef08a';
        ctx.font = '700 14px var(--font-sans, sans-serif)';
        ctx.fillText('Click "Play again" to launch another run', w / 2, h / 2 + 96);
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
        return endRound(difficulty === 'expert' ? 'Speed sprint complete! Final typing metrics computed.' : 'Mission complete! Base perimeter secured.', true);
      }

      spawnTimer += delta;
      if (spawnTimer >= settings[difficulty].spawn) {
        spawnTimer = 0;
        spawnRock();
      }

      rocks.forEach((r) => {
        r.y += r.speed * delta;
        r.rot += r.rotSpeed * delta;
        if (r.drift) {
          r.x += r.drift * Math.sin(now * 0.003 + r.id) * delta;
          r.x = Math.max(r.radius + 10, Math.min(canvas.width - r.radius - 10, r.x));
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
          if (distToTarget <= target.radius + 12 || b.progress >= b.maxDist) {
            rocks = rocks.filter((r) => r.id !== target.id);
            const pointsEarned = 100 * Math.min(combo, 5);
            score += pointsEarned;
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
        if (r.y > canvas.height - 48) {
          escapedRocks++;
          combo = 0;
          screenShake = 7;
          ArcadeAudio.playExplosion();
          createExplosion(r.x, canvas.height - 48, r.letter, 0, '#ef4444');
        } else {
          remaining.push(r);
        }
      });
      rocks = remaining;

      // In Expert mode, player NEVER gets out (plays full duration to know speed!)
      if (difficulty !== 'expert' && escapedRocks >= settings[difficulty].integrity) {
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
        spawnRock();
      }

      isPlaying = true;
      isPaused = false;
      roundStartedAt = performance.now();
      lastFrameTime = roundStartedAt;

      if (startBtn) startBtn.textContent = 'Playing…';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      if (statusEl) {
        statusEl.textContent = difficulty === 'expert'
          ? '⚡ EXPERT SPEED TEST: Type as fast as you can without stopping!'
          : 'Type the letter on ANY falling rock to blast it!';
      }

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

      // Set canvas coordinate dimensions to wide 1200x650
      canvas.width = 1200;
      canvas.height = 650;

      ctx = canvas.getContext('2d', { alpha: false });
      startBtn = document.getElementById('typingStartBtn');
      pauseBtn = document.getElementById('typingPauseBtn');
      soundBtn = document.getElementById('typingSoundBtn');
      fullscreenBtn = document.getElementById('typingFullscreenBtn');
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
      syncFullscreenBtn();
      loadBest();

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

      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        document.addEventListener('fullscreenchange', syncFullscreenBtn);
        document.addEventListener('webkitfullscreenchange', syncFullscreenBtn);
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

      // Mobile touch-to-blast on canvas: clicking/tapping directly on a rock shoots it!
      canvas.addEventListener('pointerdown', (e) => {
        if (!isPlaying && !isPaused) {
          start(false);
          return;
        }
        if (!isPlaying || isPaused) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

        // Generous touch tolerance on mobile (radius + 26px) for effortless tapping
        const hitTol = isMobileMode() ? 26 : 14;
        const clickedRock = rocks.find((r) => Math.hypot(r.x - clickX, r.y - clickY) <= r.radius + hitTol);
        if (clickedRock) {
          fireLetter(clickedRock.letter);
        }
      });

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


  // ─── NOKIA SNAKE: AUTHENTIC RETRO LCD MODULE ─────────────────────────────────
  const NokiaSnakeGame = (() => {
    let container, canvas, ctx;
    let startBtn, pauseBtn, restartBtn, soundBtn;
    let scoreEl, bestEl, statusEl;
    let diffContainer;

    const cells = 20;
    let unit = 24;
    let boardOffsetX = 0;
    let boardOffsetY = 0;

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
      soundBtn.textContent = on ? '🔊 Sound' : '🔇 Muted';
      soundBtn.setAttribute('aria-pressed', String(on));
    }

    function computeLayout() {
      if (!canvas) return;
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
        return stop('🏆 INCREDIBLE! You filled the entire board! You Win!');
      }

      food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    function draw() {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#6b7a60';
      ctx.fillRect(0, 0, w, h);

      const boardW = unit * cells;
      const boardH = unit * cells;
      ctx.fillStyle = '#9caf88';
      ctx.fillRect(boardOffsetX, boardOffsetY, boardW, boardH);

      ctx.fillStyle = 'rgba(47, 62, 45, 0.08)';
      for (let i = 0; i <= cells; i++) {
        ctx.fillRect(boardOffsetX + i * unit, boardOffsetY, 1, boardH);
        ctx.fillRect(boardOffsetX, boardOffsetY + i * unit, boardW, 1);
      }

      if (food) {
        const fx = boardOffsetX + food.x * unit;
        const fy = boardOffsetY + food.y * unit;
        ctx.fillStyle = '#183b25';
        ctx.fillRect(fx + 3, fy + 3, unit - 6, unit - 6);
        ctx.fillStyle = '#9caf88';
        ctx.fillRect(fx + 6, fy + 6, 3, 3);
      }

      snake.forEach((part, index) => {
        const px = boardOffsetX + part.x * unit;
        const py = boardOffsetY + part.y * unit;

        if (index === 0) {
          ctx.fillStyle = '#122618';
          ctx.fillRect(px + 1, py + 1, unit - 2, unit - 2);

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

      if (head.x < 0 || head.x >= cells || head.y < 0 || head.y >= cells) {
        ArcadeAudio.playSnakeDie();
        return stop('Snake crashed into perimeter wall!');
      }

      if (snake.some((part) => part.x === head.x && part.y === head.y)) {
        ArcadeAudio.playSnakeDie();
        return stop('Snake collided with its own tail!');
      }

      snake.unshift(head);

      if (food && head.x === food.x && head.y === food.y) {
        score += 10;
        ArcadeAudio.playSnakeBite();
        if (scoreEl) scoreEl.textContent = String(score);

        if (score > bestScore) {
          bestScore = score;
          ArcadeStorage.write(storageKey(), bestScore);
          if (bestEl) bestEl.textContent = String(bestScore);
        }

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
      }
      if (handled) e.preventDefault();
    }

    function activate() {
      isKeyActive = true;
      window.addEventListener('keydown', handleKeyDown);
      computeLayout();
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

      canvas.width = 480;
      canvas.height = 640;

      ctx = canvas.getContext('2d', { alpha: false });
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
      computeLayout();

      if (diffContainer) {
        diffContainer.querySelectorAll('[data-difficulty]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const next = btn.dataset.difficulty;
            if (!speeds[next] || next === difficulty) return;
            difficulty = next;
            ArcadeStorage.setDifficulty('nokiaSnakeDifficulty', difficulty);
            syncDifficultyUI();
            loadBest();
            if (isRunning || isPaused) {
              pause('Difficulty changed. Press Resume to play.');
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


  // ─── INDEPENDENT TAB CONTROLLERS ─────────────────────────────────────────────
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

  document.addEventListener('playground:tabchange', (e) => {
    const labId = e.detail?.labId;

    if (labId === 'type-blaster') {
      initTypeBlaster();
      TypeBlasterGame.activate();
      TypeBlasterGame.drawIdle();
    } else {
      if (typeBlasterInitialized) {
        TypeBlasterGame.deactivate();
      }
    }

    if (labId === 'nokia-snake') {
      initNokiaSnake();
      NokiaSnakeGame.activate();
      NokiaSnakeGame.drawIdle();
    } else {
      if (nokiaSnakeInitialized) {
        NokiaSnakeGame.deactivate();
      }
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (typeBlasterInitialized) TypeBlasterGame.pause('Game paused while window was hidden.');
      if (nokiaSnakeInitialized) NokiaSnakeGame.pause('Game paused while window was hidden.');
    }
  });

  if (window.visualViewport) {
    const updateVisualViewport = () => {
      const vh = window.visualViewport.height;
      document.documentElement.style.setProperty('--visual-vh', `${vh}px`);
    };
    window.visualViewport.addEventListener('resize', updateVisualViewport, { passive: true });
    window.visualViewport.addEventListener('scroll', updateVisualViewport, { passive: true });
    updateVisualViewport();
  }

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
'''

Path('js/arcade-hub.js').write_text(content, encoding='utf-8')
print("Successfully updated js/arcade-hub.js with mobile rock sizes and balanced Expert mode!")
