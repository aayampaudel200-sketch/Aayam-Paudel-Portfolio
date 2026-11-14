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

    // Difficulty Settings per prompt requirements:
    // Easy: ~4.0s spawn, 36-44 px/s speed, max 2 rocks, 8 integrity, beginner letter set
    // Medium: ~2.5s spawn, 72-88 px/s speed, max 3 rocks, 6 integrity, full A-Z
    // Hard: ~1.5s spawn, 112-132 px/s speed, max 5 rocks, 4 integrity, full A-Z
    const settings = {
      easy: {
        duration: 45000,
        spawn: 4.0,
        speedMin: 36,
        speedMax: 44,
        maxRocks: 2,
        integrity: 8,
        letterPool: 'ASDFJKLERO' // Home-row & most frequent keys for true beginner onboarding
      },
      medium: {
        duration: 45000,
        spawn: 2.5,
        speedMin: 72,
        speedMax: 88,
        maxRocks: 3,
        integrity: 6,
        letterPool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      },
      hard: {
        duration: 45000,
        spawn: 1.5,
        speedMin: 112,
        speedMax: 132,
        maxRocks: 5,
        integrity: 4,
        letterPool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
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

    // Background starfield particles (cached once)
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
      soundBtn.textContent = on ? '🔊 Sound' : '🔇 Muted';
      soundBtn.setAttribute('aria-pressed', String(on));
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

    // Helper: generate procedural polygon vertices for authentic organic asteroid look
    function createRockPolygon(seed, radius) {
      const points = [];
      const numVertices = 7;
      for (let i = 0; i < numVertices; i++) {
        const angle = (i / numVertices) * Math.PI * 2;
        // Pseudo-random offset based on seed
        const pseudo = Math.sin(seed * 3.7 + i * 2.1) * 0.18;
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

      const pool = cfg.letterPool;
      const currentLetters = new Set(rocks.map((r) => r.letter));

      // Prefer spawning a letter not already falling to ensure variety
      let availableLetters = pool.split('').filter((c) => !currentLetters.has(c));
      if (!availableLetters.length) availableLetters = pool.split('');

      const letter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
      const radius = 32;

      // Distribute lanes with generous spacing
      const occupied = rocks.map((r) => r.x);
      let lane = canvas.width / 2;
      for (let attempts = 0; attempts < 16; attempts++) {
        const cand = 64 + Math.random() * (canvas.width - 128);
        if (occupied.every((x) => Math.abs(x - cand) > 90)) {
          lane = cand;
          break;
        }
      }

      const id = nextRockId++;
      rocks.push({
        id,
        x: lane,
        y: -36,
        radius,
        letter,
        speed: cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.4,
        polygon: createRockPolygon(id, radius)
      });
    }

    function fireLetter(char) {
      if (!isPlaying || isPaused) return;
      const letter = char.toUpperCase();
      if (!/^[A-Z]$/.test(letter)) return;

      totalTyped++;

      // Find the lowest (closest to base) matching rock
      const targets = rocks
        .filter((r) => r.letter === letter)
        .sort((a, b) => b.y - a.y);

      const target = targets[0];

      if (target) {
        // Successful lock-on!
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        ArcadeAudio.playLaser();
        if (combo > 1) ArcadeAudio.playCombo(combo);

        // Aim the turret directly at this target
        const turretX = canvas.width / 2;
        const turretY = canvas.height - 32;
        const dx = target.x - turretX;
        const dy = target.y - turretY;
        turretTargetAngle = Math.atan2(dy, dx);

        // Compute direct velocity vector toward target
        const dist = Math.hypot(dx, dy) || 1;
        const bulletSpeed = 1100; // Fast plasma beam

        bullets.push({
          x: turretX,
          y: turretY,
          vx: (dx / dist) * bulletSpeed,
          vy: (dy / dist) * bulletSpeed,
          targetId: target.id,
          targetLetter: letter,
          progress: 0,
          maxDist: dist
        });

        if (statusEl) {
          statusEl.textContent = combo > 2 ? `🔥 Streak! Combo ${combo}x!` : `Targeting rock ${letter}!`;
        }
      } else {
        // Miss / incorrect key
        combo = 0;
        ArcadeAudio.playMiss();
        if (statusEl) {
          statusEl.textContent = `No incoming rock has '${letter}' — stay sharp!`;
        }
      }

      updateMetrics();
    }

    function createExplosion(x, y, letter, pointsEarned) {
      ArcadeAudio.playExplosion();
      screenShake = 5.5;

      // Spawn debris & neon plasma sparks
      const count = 16;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 70 + Math.random() * 160;
        const isNeon = i % 2 === 0;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.5 + Math.random() * 0.3,
          maxLife: 0.8,
          radius: isNeon ? 2.5 : 3.5,
          color: isNeon ? '#38bdf8' : (Math.random() > 0.5 ? '#f59e0b' : '#e0f2fe')
        });
      }

      // Add floating score popup
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

      let isNewRecord = false;
      if (score > bestScore) {
        bestScore = score;
        isNewRecord = true;
        ArcadeStorage.write(storageKey(), bestScore);
        if (bestEl) bestEl.textContent = String(bestScore);
      }

      if (statusEl) {
        const recordNote = isNewRecord ? ' 🏆 NEW HIGH SCORE!' : '';
        statusEl.textContent = `${msg} Final Score: ${score} · ${wpm} WPM · ${accuracy}% Accuracy.${recordNote}`;
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

      // Apply subtle screen shake
      if (screenShake > 0.05) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Deep Space Sci-Fi Backdrop
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

      // Glow barrier at bottom
      const shieldY = h - 38;
      const shieldGlow = ctx.createLinearGradient(0, shieldY - 4, 0, shieldY + 4);
      shieldGlow.addColorStop(0, 'rgba(56, 189, 248, 0)');
      shieldGlow.addColorStop(0.5, integrityRatio > 0.35 ? 'rgba(56, 189, 248, 0.8)' : 'rgba(239, 68, 68, 0.85)');
      shieldGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = shieldGlow;
      ctx.fillRect(0, shieldY - 4, w, 8);

      // Shield Line
      ctx.strokeStyle = integrityRatio > 0.35 ? '#38bdf8' : '#f87171';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, shieldY);
      ctx.lineTo(w, shieldY);
      ctx.stroke();

      // Base Console Floor
      ctx.fillStyle = '#071224';
      ctx.fillRect(0, shieldY, w, h - shieldY);

      // Integrity gauge indicator
      ctx.fillStyle = integrityRatio > 0.4 ? '#38bdf8' : '#ef4444';
      ctx.font = '700 12px var(--font-mono, monospace)';
      ctx.textAlign = 'left';
      ctx.fillText(`PERIMETER SHIELD: ${currentIntegrity} / ${maxIntegrity}`, 18, h - 14);

      // Combo streak indicator in canvas
      if (combo > 1) {
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'right';
        ctx.fillText(`COMBO x${combo} 🔥`, w - 18, h - 14);
      }

      // 5. Directed Laser Projectiles
      bullets.forEach((b) => {
        ctx.save();
        // Laser glow
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

        // White hot inner beam
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tailX + (b.vx * 0.01), tailY + (b.vy * 0.01));
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
      });

      // 6. Incoming Asteroids with High-Contrast Target Badges
      rocks.forEach((r) => {
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.rot);

        // A. Shaded Organic Asteroid Body
        const rGrad = ctx.createRadialGradient(-6, -8, 2, 0, 0, r.radius);
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

        // Asteroid edge highlight
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore(); // Undo rotation for letter badge so letters ALWAYS remain upright!

        // B. Prominent High-Contrast Target Letter Badge (Always upright)
        ctx.save();
        ctx.translate(r.x, r.y);

        const isDanger = r.y > h * 0.65;
        const badgeRadius = 21;

        // Outer Target Ring / Reticle
        ctx.beginPath();
        ctx.arc(0, 0, badgeRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = isDanger ? 'rgba(239, 68, 68, 0.75)' : 'rgba(56, 189, 248, 0.65)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Solid Obsidian Badge Background for MAXIMUM Letter Contrast
        ctx.beginPath();
        ctx.arc(0, 0, badgeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#030816';
        ctx.fill();

        // Inner Badge Accent Ring
        ctx.strokeStyle = isDanger ? '#ef4444' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Target Reticle Corner Ticks
        ctx.strokeStyle = isDanger ? '#f87171' : '#7dd3fc';
        ctx.lineWidth = 2;
        const tickDist = badgeRadius + 2;
        [-1, 1].forEach((dirX) => {
          [-1, 1].forEach((dirY) => {
            ctx.beginPath();
            ctx.moveTo(dirX * tickDist, dirY * (tickDist - 5));
            ctx.lineTo(dirX * tickDist, dirY * tickDist);
            ctx.lineTo(dirX * (tickDist - 5), dirY * tickDist);
            ctx.stroke();
          });
        });

        // BOLD, CRYSTAL-CLEAR LETTER DISPLAY
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = isDanger ? '#ef4444' : '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.font = '900 28px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.letter, 0, 1);

        ctx.restore();
      });

      // 7. Defense Turret Cannon at Base
      const turretX = w / 2;
      const turretY = shieldY + 6;

      // Turret base mount
      ctx.fillStyle = '#0f2744';
      ctx.beginPath();
      ctx.arc(turretX, turretY + 6, 24, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rotating cannon barrel
      ctx.save();
      ctx.translate(turretX, turretY);
      ctx.rotate(turretAngle + Math.PI / 2); // default points up

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
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pop.color;
        ctx.font = '700 16px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.shadowColor = pop.color;
        ctx.shadowBlur = 8;
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      });

      // 10. Idle Splash Overlay (0% CPU state)
      if (!isPlaying && !isPaused && !isFinished && elapsedBeforePause === 0) {
        ctx.fillStyle = 'rgba(4, 11, 23, 0.85)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#7dd3fc';
        ctx.font = '800 30px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('TYPE BLASTER', w / 2, h / 2 - 40);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 15px var(--font-sans, sans-serif)';
        ctx.fillText('Type the letter on each falling rock to fire targeted plasma lasers.', w / 2, h / 2 - 6);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px var(--font-mono, monospace)';
        ctx.fillText('Desktop: Type keys directly · Mobile: Tap input box below', w / 2, h / 2 + 22);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '700 14px var(--font-mono, monospace)';
        ctx.fillText('Click "Start round" to initialize mission', w / 2, h / 2 + 54);
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
        ctx.fillStyle = 'rgba(3, 8, 18, 0.88)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = currentIntegrity > 0 ? '#38bdf8' : '#f87171';
        ctx.font = '800 28px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText(currentIntegrity > 0 ? 'MISSION ACCOMPLISHED' : 'DEFENSE BREACHED', w / 2, h / 2 - 44);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 16px var(--font-sans, sans-serif)';
        ctx.fillText(`Final Score: ${score} · Top Score: ${bestScore} (${difficulty})`, w / 2, h / 2 - 8);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '14px var(--font-mono, monospace)';
        ctx.fillText(`Speed: ${wpmEl ? wpmEl.textContent : '0 WPM'} · Accuracy: ${accuracyEl ? accuracyEl.textContent : '100%'} · Max Combo: ${maxCombo}x`, w / 2, h / 2 + 20);

        ctx.fillStyle = '#fef08a';
        ctx.font = '700 14px var(--font-sans, sans-serif)';
        ctx.fillText('Click "Play again" to launch another mission', w / 2, h / 2 + 54);
      }

      ctx.restore();
    }

    function loop(now) {
      if (!isPlaying) return;
      const delta = Math.min((now - lastFrameTime) / 1000, 0.05);
      lastFrameTime = now;

      // Update screen shake decay
      if (screenShake > 0) {
        screenShake = Math.max(0, screenShake - delta * 24);
      }

      // Smooth turret tracking
      turretAngle += (turretTargetAngle - turretAngle) * Math.min(delta * 14, 1);

      // Check mission duration
      if (updateMetrics(now) >= settings[difficulty].duration) {
        return endRound('Mission complete! Base perimeter secured.', true);
      }

      // Spawn asteroid timer
      spawnTimer += delta;
      if (spawnTimer >= settings[difficulty].spawn) {
        spawnTimer = 0;
        spawnRock();
      }

      // Update rocks movement & rotation
      rocks.forEach((r) => {
        r.y += r.speed * delta;
        r.rot += r.rotSpeed * delta;
      });

      // Update laser bullets
      bullets.forEach((b) => {
        b.x += b.vx * delta;
        b.y += b.vy * delta;
        b.progress += Math.hypot(b.vx * delta, b.vy * delta);
      });

      // Bullet collision with targeted asteroids
      bullets = bullets.filter((b) => {
        const target = rocks.find((r) => r.id === b.targetId);
        if (target) {
          const distToTarget = Math.hypot(b.x - target.x, b.y - target.y);
          if (distToTarget <= target.radius + 8 || b.progress >= b.maxDist) {
            // Hit!
            rocks = rocks.filter((r) => r.id !== target.id);
            totalHits++;
            const pointsEarned = 100 * Math.min(combo, 5);
            score += pointsEarned;
            createExplosion(target.x, target.y, target.letter, pointsEarned);
            return false;
          }
        }
        // Remove bullet if off screen
        return b.y > -30 && b.y < canvas.height + 30 && b.x > -30 && b.x < canvas.width + 30;
      });

      // Rock breach detection
      const remaining = [];
      rocks.forEach((r) => {
        if (r.y > canvas.height - 44) {
          escapedRocks++;
          combo = 0; // Break combo on base damage
          screenShake = 7;
          ArcadeAudio.playExplosion();
        } else {
          remaining.push(r);
        }
      });
      rocks = remaining;

      if (escapedRocks >= settings[difficulty].integrity) {
        return endRound('Base integrity failed! Rocks penetrated defense shield.');
      }

      // Update particles
      particles.forEach((p) => {
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.vy += 60 * delta; // slight gravity
        p.life -= delta;
      });
      particles = particles.filter((p) => p.life > 0);

      // Update floating score popups
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
      }

      isPlaying = true;
      isPaused = false;
      roundStartedAt = performance.now();
      lastFrameTime = roundStartedAt;

      if (startBtn) startBtn.textContent = 'Playing…';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      if (statusEl) statusEl.textContent = 'Type the falling rock letter to fire!';

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

    // Keydown event handler for active gameplay
    function handleKeyDown(e) {
      if (!isPlaying || isPaused || !isKeyActive || container.hidden) return;
      if (e.target === mobileInput || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!e.repeat && /^[a-z]$/i.test(e.key)) {
        e.preventDefault();
        fireLetter(e.key);
      }
    }

    // Called when game is selected/visible in Arcade Hub
    function activate() {
      isKeyActive = true;
      window.addEventListener('keydown', handleKeyDown);
      draw();
    }

    // Called when switching to another game or leaving Arcade Hub
    function deactivate() {
      isKeyActive = false;
      window.removeEventListener('keydown', handleKeyDown);
      pause('Paused while switching.');
    }

    // One-time setup: queries DOM and attaches permanent button listeners
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

      difficulty = ArcadeStorage.getDifficulty('typeBlasterDifficulty', 'easy');
      syncDifficultyUI();
      syncSoundUI();
      loadBest();

      if (timeEl) timeEl.textContent = `${Math.ceil(settings[difficulty].duration / 1000)}s`;

      // Difficulty buttons
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

      // Game Buttons (permanent listeners)
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

      // Mobile virtual keyboard input
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

    const cells = 18;
    let unit = 20;

    // Difficulty Speeds:
    // Easy: 180ms tick (beginner-friendly reaction time)
    // Medium: 125ms tick (classic authentic Nokia pace)
    // Hard: 80ms tick (fast arcade challenge)
    const speeds = { easy: 180, medium: 125, hard: 80 };

    let difficulty = 'medium';
    let bestScore = 0;
    let snake = [];
    let food = null;
    let direction = { x: 1, y: 0 };
    let inputQueue = []; // Fixed multi-key buffer: prevents 180-deg reversal bug
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

    // Safe food placement: gathers available empty cells, avoids infinite loops on win
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
        // Board 100% full: Player won!
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
        // Classic retro blocky apple shape
        ctx.fillRect(fx + 3, fy + 3, unit - 6, unit - 6);
        ctx.fillStyle = '#9caf88';
        ctx.fillRect(fx + 5, fy + 5, 2, 2); // LCD pixel shine
      }

      // Snake Body & Head
      snake.forEach((part, index) => {
        const px = part.x * unit;
        const py = part.y * unit;

        if (index === 0) {
          // Snake Head: Darker LCD pigment
          ctx.fillStyle = '#122618';
          ctx.fillRect(px + 1, py + 1, unit - 2, unit - 2);

          // Expressive Pixel Eyes pointing in direction of movement!
          ctx.fillStyle = '#9caf88';
          if (direction.x === 1) { // Right
            ctx.fillRect(px + unit - 5, py + 3, 2, 2);
            ctx.fillRect(px + unit - 5, py + unit - 5, 2, 2);
          } else if (direction.x === -1) { // Left
            ctx.fillRect(px + 3, py + 3, 2, 2);
            ctx.fillRect(px + 3, py + unit - 5, 2, 2);
          } else if (direction.y === 1) { // Down
            ctx.fillRect(px + 3, py + unit - 5, 2, 2);
            ctx.fillRect(px + unit - 5, py + unit - 5, 2, 2);
          } else { // Up
            ctx.fillRect(px + 3, py + 3, 2, 2);
            ctx.fillRect(px + unit - 5, py + 3, 2, 2);
          }
        } else {
          // Snake Body: Authentic segmented block with 1.5px bevel
          ctx.fillStyle = '#1e442c';
          ctx.fillRect(px + 1.5, py + 1.5, unit - 3, unit - 3);
          ctx.fillStyle = '#2d5c3d';
          ctx.fillRect(px + 3, py + 3, unit - 6, unit - 6);
        }
      });

      // Overlay: Idle (0% CPU)
      if (!isRunning && !snake.length) {
        ctx.fillStyle = 'rgba(156, 175, 136, 0.45)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#122618';
        ctx.font = '800 22px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('NOKIA 3310 SNAKE', w / 2, h / 2 - 14);
        ctx.font = '600 13px var(--font-mono, monospace)';
        ctx.fillText('Desktop: Arrows / WASD · Mobile: Swipe or D-Pad', w / 2, h / 2 + 12);
        ctx.fillText('Press "Start game" to begin', w / 2, h / 2 + 32);
      }

      // Overlay: Paused
      if (isPaused) {
        ctx.fillStyle = 'rgba(156, 175, 136, 0.78)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#122618';
        ctx.font = '800 24px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.fillText('GAME PAUSED', w / 2, h / 2);
      }
    }

    // Direction Queue to prevent 180-deg reversal bugs when pressing keys quickly
    function queueDirection(next) {
      if (!isRunning || isPaused) return;

      // Check against current direction or last queued direction
      const reference = inputQueue.length ? inputQueue[inputQueue.length - 1] : direction;

      // Disallow reversing directly into itself
      if (next.x === -reference.x && next.y === -reference.y) return;
      if (next.x === reference.x && next.y === reference.y) return;

      // Limit queue to 2 inputs per tick to prevent sluggishness
      if (inputQueue.length < 2) {
        inputQueue.push(next);
      }
    }

    function step() {
      if (!isRunning || isPaused) return;

      // Consume next buffered direction if available
      if (inputQueue.length > 0) {
        direction = inputQueue.shift();
      }

      const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
      const ate = food && head.x === food.x && head.y === food.y;
      const body = ate ? snake : snake.slice(0, -1);

      // Boundary / Wall Collision
      if (head.x < 0 || head.x >= cells || head.y < 0 || head.y >= cells) {
        ArcadeAudio.playSnakeDie();
        return stop(`Wall Crash! Game Over. Score: ${score}.`);
      }

      // Self Collision
      if (body.some((p) => p.x === head.x && p.y === head.y)) {
        ArcadeAudio.playSnakeDie();
        return stop(`Self Collision! Game Over. Score: ${score}.`);
      }

      snake.unshift(head);

      if (ate) {
        score += 10;
        ArcadeAudio.playSnakeBite();
        if (score > bestScore) {
          bestScore = score;
          ArcadeStorage.write(storageKey(), bestScore);
        }
        placeFood();
        if (scoreEl) scoreEl.textContent = String(score);
        if (bestEl) bestEl.textContent = String(bestScore);
        if (statusEl) statusEl.textContent = `Great catch! Length: ${snake.length}. Score: ${score}.`;
      } else {
        snake.pop();
      }

      draw();
    }

    function start(restart = false) {
      if (restart || !snake.length) {
        snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
        direction = { x: 1, y: 0 };
        inputQueue = [];
        score = 0;
        placeFood();
        if (scoreEl) scoreEl.textContent = String(score);
        if (bestEl) bestEl.textContent = String(bestScore);
      }

      isRunning = true;
      isPaused = false;
      if (startBtn) startBtn.textContent = 'Playing…';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      if (statusEl) statusEl.textContent = `Snake running (${difficulty}). Use arrow keys, swipe, or D-pad.`;

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
      if (startBtn) startBtn.textContent = 'Start game';
      if (pauseBtn) pauseBtn.textContent = 'Pause';
      draw();
    }

    // Keyboard controls handler
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

    function handleKeyDown(e) {
      if (!isRunning || isPaused || !isKeyActive || container.hidden) return;
      const mapped = keyMap[e.code] || keyMap[e.key];
      if (mapped) {
        e.preventDefault();
        queueDirection(mapped);
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

      // Difficulty buttons (permanent listeners)
      if (diffContainer) {
        diffContainer.querySelectorAll('[data-difficulty]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const next = btn.dataset.difficulty;
            if (!speeds[next] || next === difficulty) return;
            difficulty = next;
            ArcadeStorage.setDifficulty('nokiaSnakeDifficulty', difficulty);
            syncDifficultyUI();
            loadBest();
            // Dynamically update tick interval mid-game
            if (isRunning) {
              clearInterval(timerId);
              timerId = setInterval(step, speeds[difficulty]);
              if (statusEl) statusEl.textContent = `Speed changed to ${difficulty}.`;
            }
          });
        });
      }

      // Game Buttons (permanent listeners)
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

      // Tactical Direction D-Pad buttons
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

      // Canvas Touch Swipe Gestures
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
