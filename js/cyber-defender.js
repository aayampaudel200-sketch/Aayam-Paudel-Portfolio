/* Cyber Defender: Space Shooter with Fullscreen, Nova Bomb, and Enhanced Arcade Animations */
(() => {
  'use strict';
  const W = 800, H = 600, MAX = { bullets: 50, enemyBullets: 45, enemies: 22, particles: 220 };
  const settings = {
    easy: { shields: 4, pace: 0.95, spawn: 0.92 },
    medium: { shields: 3, pace: 1.25, spawn: 0.70 },
    hard: { shields: 1, pace: 1.55, spawn: 0.45 },
  };
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  window.CyberDefender = {
    init() {
      if (this.ready) return;
      this.ready = true;
      const canvas = document.getElementById('shooterCanvas');
      const wrapper = document.getElementById('shooterWrapper');
      if (!canvas || !wrapper) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      const $ = (id) => document.getElementById(id);
      const ui = {
        start: $('shooterStartBtn'),
        pause: $('shooterPauseBtn'),
        quit: $('shooterQuitBtn'),
        sound: $('shooterSoundBtn'),
        fullscreen: $('shooterFullscreenBtn'),
        score: $('shooterScore'),
        shields: $('shooterShields'),
        wave: $('shooterWave'),
        top: $('shooterHighScore')
      };
      const controls = { left: $('touchLeftBtn'), right: $('touchRightBtn'), fire: $('touchFireBtn') };
      let dpr = 1, state = 'idle', visible = true, last = 0, frame = 0, audio, sound = true;
      let difficulty = 'medium', score = 0, highScore = 0, wave = 1, kills = 0, combo = 1, shields = settings.medium.shields;
      let spawnClock = 0, fireClock = 0, waveBanner = 2.5, shake = 0, bossActive = false;
      let bullets = [], enemyBullets = [], enemies = [], particles = [], texts = [], powerups = [], shockwaves = [];
      const keys = { left: false, right: false }, player = { x: W / 2, y: H - 58, vx: 0, tilt: 0, invincible: 0, triple: 0, rapid: 0, auto: false };
      const stars = [[], [], []];
      const colors = { cyan: '#52e8ff', violet: '#8b5cf6', red: '#fb4b68', orange: '#ffb24a', green: '#4df5a2', gold: '#facc15', white: '#f6fbff' };
      let backdrop;

      function scoreKey() { return `cyberDefenderHighScore:${difficulty}`; }
      function readScore() { try { return Number(localStorage.getItem(scoreKey())) || 0; } catch (_) { return 0; } }
      function saveScore() { try { localStorage.setItem(scoreKey(), String(highScore)); } catch (_) {} }

      function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        backdrop = ctx.createLinearGradient(0, 0, 0, H);
        backdrop.addColorStop(0, '#030719'); backdrop.addColorStop(0.5, '#080b27'); backdrop.addColorStop(1, '#02050f');
        render();
      }

      function toggleFullscreen() {
        const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement || wrapper.classList.contains('is-fullscreen-fallback'));
        if (!isFs) {
          if (wrapper.requestFullscreen) {
            wrapper.requestFullscreen().catch(() => wrapper.classList.toggle('is-fullscreen-fallback'));
          } else if (wrapper.webkitRequestFullscreen) {
            wrapper.webkitRequestFullscreen();
          } else {
            wrapper.classList.toggle('is-fullscreen-fallback');
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
          wrapper.classList.remove('is-fullscreen-fallback');
        }
        syncFullscreenBtn();
        setTimeout(resize, 100);
      }

      function syncFullscreenBtn() {
        if (!ui.fullscreen) return;
        const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement || wrapper.classList.contains('is-fullscreen-fallback'));
        ui.fullscreen.textContent = isFs ? '✕ Exit Fullscreen' : '⛶ Fullscreen';
        ui.fullscreen.setAttribute('aria-pressed', String(isFs));
      }

      function makeStars() {
        [[44, 20, 0.28], [32, 38, 0.52], [22, 68, 0.85]].forEach(([count, speed, alpha], layer) => {
          for (let i = 0; i < count; i++) {
            stars[layer].push({
              x: Math.random() * W,
              y: Math.random() * H,
              r: 0.45 + layer * 0.48 + Math.random() * 0.6,
              speed: speed + Math.random() * speed,
              alpha: alpha * (0.55 + Math.random() * 0.45),
              phase: Math.random() * 6.3
            });
          }
        });
      }

      function initAudio() {
        if (!sound) return null;
        if (!audio) { const Ctx = window.AudioContext || window.webkitAudioContext; if (Ctx) audio = new Ctx(); }
        if (audio?.state === 'suspended') audio.resume().catch(() => {});
        return audio;
      }

      function tone(kind) {
        const ac = initAudio(); if (!ac) return;
        const now = ac.currentTime, osc = ac.createOscillator(), gain = ac.createGain();
        const data = {
          laser: ['square', 780, 220, 0.055, 0.05],
          blast: ['sawtooth', 190, 40, 0.18, 0.12],
          hit: ['triangle', 120, 38, 0.2, 0.14],
          power: ['sine', 400, 880, 0.25, 0.12],
          nova: ['sawtooth', 340, 60, 0.45, 0.2],
          boss: ['sawtooth', 95, 48, 0.4, 0.15]
        }[kind] || ['sine', 330, 260, 0.1, 0.06];

        osc.type = data[0];
        osc.frequency.setValueAtTime(data[1], now);
        osc.frequency.exponentialRampToValueAtTime(data[2], now + data[3]);
        gain.gain.setValueAtTime(data[4], now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + data[3]);
        osc.connect(gain).connect(ac.destination);
        osc.start(now); osc.stop(now + data[3]);
      }

      function floating(text, x, y, color = colors.cyan) {
        if (texts.length < 16) texts.push({ text, x, y, color, life: 0.95 });
      }

      function addShockwave(x, y, color = colors.cyan, maxRadius = 90, duration = 0.5) {
        shockwaves.push({ x, y, color, r: 4, maxRadius, life: duration, maxLife: duration });
      }

      function burst(x, y, color, count = 16) {
        for (let i = 0; i < count && particles.length < MAX.particles; i++) {
          const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 200;
          particles.push({
            x, y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 0.35 + Math.random() * 0.45,
            max: 0.8,
            color,
            r: 1.2 + Math.random() * 2.8
          });
        }
        addShockwave(x, y, color, 45, 0.35);
      }

      function triggerNovaBomb() {
        shake = 14;
        tone('nova');
        floating('⚡ NOVA EMP DETONATION!', W / 2, H / 2 - 40, colors.cyan);
        addShockwave(player.x, player.y, colors.cyan, W, 0.7);

        // Clear all enemy bullets
        enemyBullets.forEach((b) => burst(b.x, b.y, colors.cyan, 4));
        enemyBullets = [];

        // Damage all enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          e.hp -= 4;
          burst(e.x, e.y, colors.cyan, 8);
          if (e.hp <= 0) {
            destroy(e);
            enemies.splice(i, 1);
          }
        }
      }

      function reset() {
        score = 0; wave = 1; kills = 0; combo = 1; shields = settings[difficulty].shields;
        spawnClock = fireClock = 0; waveBanner = 2.2; bossActive = false;
        bullets = []; enemyBullets = []; enemies = []; particles = []; texts = []; powerups = []; shockwaves = [];
        Object.assign(player, { x: W / 2, y: H - 58, vx: 0, tilt: 0, invincible: 1.2, triple: 0, rapid: 0, auto: false });
        updateUI();
      }

      function updateUI() {
        if (ui.score) ui.score.textContent = String(score);
        if (ui.wave) ui.wave.textContent = String(wave);
        if (ui.top) ui.top.textContent = String(highScore);
        if (ui.shields) {
          ui.shields.textContent = shields > 0 ? '🛡️ '.repeat(shields).trim() : '💥 Critical';
        }
      }

      function start() {
        reset();
        state = 'running';
        ui.start.textContent = 'Restart';
        ui.pause.textContent = 'Pause';
        last = performance.now();
        requestAnimationFrame(loop);
      }

      function pause(auto = false) {
        if (state !== 'running') return;
        state = 'paused';
        ui.pause.textContent = auto ? 'Paused' : 'Resume';
        render();
      }

      function resume() {
        if (state !== 'paused' || !visible) return;
        state = 'running';
        ui.pause.textContent = 'Pause';
        last = performance.now();
        requestAnimationFrame(loop);
      }

      function quit() {
        state = 'idle';
        ui.start.textContent = 'Start Mission';
        ui.pause.textContent = 'Pause';
        reset();
        render();
      }

      function gameOver() {
        state = 'gameover';
        tone('boss');
        if (score > highScore) { highScore = score; saveScore(); }
        updateUI();
        ui.start.textContent = 'Play Again';
        render();
      }

      function addBullet(x, y, vx = 0) {
        if (bullets.length < MAX.bullets) bullets.push({ x, y, vx, vy: -720, life: 1 });
      }

      function fire() {
        if (state !== 'running' || fireClock > 0) return;
        const spread = player.triple > 0;
        addBullet(player.x, player.y - 28);
        if (spread) {
          addBullet(player.x - 14, player.y - 22, -140);
          addBullet(player.x + 14, player.y - 22, 140);
        }
        // Thruster and muzzle flash particles
        burst(player.x, player.y - 26, colors.cyan, 3);
        fireClock = player.rapid > 0 ? 0.065 : (spread ? 0.11 : 0.16);
        tone('laser');
      }

      function spawnEnemy() {
        if (enemies.length >= MAX.enemies) return;
        if (wave % 5 === 0 && !bossActive) {
          bossActive = true;
          enemies.push({
            type: 'boss',
            x: W / 2,
            y: -55,
            r: 48,
            hp: 35 + wave * 10,
            maxHp: 35 + wave * 10,
            vx: 110 * settings[difficulty].pace,
            dir: 1,
            fire: 0.75,
            phase: 0,
            points: 1500
          });
          tone('boss');
          shake = 10;
          floating('⚠️ DREADNOUGHT INCOMING', W / 2, 105, colors.red);
          return;
        }

        const roll = Math.random();
        const type = wave >= 3 && roll < 0.26 ? 'heavy' : (wave >= 2 && roll < 0.55 ? 'interceptor' : 'scout');
        const hp = type === 'heavy' ? (4 + Math.floor(wave / 2.5)) : 1;
        enemies.push({
          type,
          x: 35 + Math.random() * (W - 70),
          y: -28,
          r: type === 'heavy' ? 26 : 17,
          hp,
          maxHp: hp,
          vx: (Math.random() - 0.5) * 45,
          vy: (type === 'scout' ? 82 : type === 'interceptor' ? 66 : 46) * settings[difficulty].pace + wave * 5,
          phase: Math.random() * 6.3,
          fire: 0.7 + Math.random() * 1.3,
          points: type === 'heavy' ? 260 : type === 'interceptor' ? 150 : 100
        });
      }

      function damagePlayer() {
        if (player.invincible > 0) return;
        shields--;
        combo = 1;
        player.invincible = 1.1;
        shake = 10;
        burst(player.x, player.y, colors.red, 24);
        floating('SHIELD HIT', player.x, player.y - 20, colors.red);
        tone('hit');
        updateUI();
        if (shields <= 0) gameOver();
      }

      function destroy(e) {
        const gain = Math.round(e.points * combo);
        score += gain;
        combo = Math.min(5, combo + 1);
        shake = Math.max(shake, e.type === 'boss' ? 14 : 5);
        burst(e.x, e.y, e.type === 'heavy' || e.type === 'boss' ? colors.orange : colors.cyan, e.type === 'boss' ? 50 : 18);
        floating(`+${gain}`, e.x, e.y, colors.green);
        if (combo > 2) floating(`x${combo} STREAK!`, e.x, e.y + 18, colors.orange);
        tone('blast');

        if (score > highScore) { highScore = score; saveScore(); }

        // Power-up drops including new 'bomb' (EMP Nova)
        if (e.type !== 'boss' && Math.random() < 0.18 && powerups.length < 4) {
          const pRoll = Math.random();
          const pType = pRoll < 0.32 ? 'triple' : (pRoll < 0.58 ? 'rapid' : (pRoll < 0.82 ? 'shield' : 'bomb'));
          powerups.push({ x: e.x, y: e.y, type: pType, life: 8, phase: 0 });
        }

        kills++;
        if (e.type === 'boss') {
          bossActive = false;
          wave++;
          kills = 0;
          waveBanner = 2.4;
          triggerNovaBomb();
        } else if (kills >= 8 + wave * 2) {
          wave++;
          kills = 0;
          waveBanner = 2.4;
        }
        updateUI();
      }

      function update(dt) {
        frame += dt;
        fireClock -= dt;
        player.invincible -= dt;
        player.triple -= dt;
        player.rapid -= dt;
        waveBanner -= dt;
        shake = Math.max(0, shake - 28 * dt);

        const target = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
        player.vx += (target * 450 - player.vx) * Math.min(1, dt * 12);
        player.x = clamp(player.x + player.vx * dt, 28, W - 28);
        player.tilt += (player.vx / 460 - player.tilt) * Math.min(1, dt * 9);
        if (player.auto) fire();

        // Stars parallax
        stars.forEach((layer, level) => layer.forEach((s) => {
          s.y += s.speed * dt * (1 + wave * 0.03);
          if (s.y > H + 2) { s.y = -2; s.x = Math.random() * W; }
          s.phase += dt * (1 + level);
        }));

        // Spawn timer
        spawnClock += dt;
        const gap = Math.max(0.24, settings[difficulty].spawn / (1 + wave * 0.09));
        if (spawnClock >= gap) {
          spawnClock = 0;
          spawnEnemy();
        }

        // Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.y < -12) bullets.splice(i, 1);
        }

        // Enemy Bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
          const b = enemyBullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.y > H + 15 || b.x < -15 || b.x > W + 15) {
            enemyBullets.splice(i, 1);
          } else if (distance(b, player) < 22) {
            enemyBullets.splice(i, 1);
            damagePlayer();
          }
        }

        // Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          e.phase += dt;
          e.fire -= dt;

          if (e.type === 'boss') {
            e.y += (68 - e.y) * dt * 1.2;
            e.x += e.vx * e.dir * dt;
            if (e.x < 70 || e.x > W - 70) e.dir *= -1;
            if (e.fire < 0) {
              e.fire = 0.65;
              // Boss multi-directional spread
              for (let n = -2; n <= 2; n++) {
                if (enemyBullets.length < MAX.enemyBullets) {
                  enemyBullets.push({
                    x: e.x + n * 14,
                    y: e.y + 36,
                    vx: n * 80 + Math.sin(frame * 4) * 30,
                    vy: 200 + wave * 8
                  });
                }
              }
            }
          } else {
            e.x += (e.type === 'interceptor' ? Math.sin(e.phase * 3.6) * 95 : Math.sin(e.phase * 1.8) * 22) * dt;
            e.y += e.vy * dt;
            if (e.type === 'interceptor' && e.fire < 0) {
              e.fire = 1.3;
              if (enemyBullets.length < MAX.enemyBullets) {
                enemyBullets.push({
                  x: e.x,
                  y: e.y + 14,
                  vx: (player.x - e.x) * 0.45,
                  vy: 205 + wave * 8
                });
              }
            }
          }

          // Player bullet collision
          for (let j = bullets.length - 1; j >= 0; j--) {
            if (distance(e, bullets[j]) < e.r + 5) {
              bullets.splice(j, 1);
              e.hp--;
              burst(e.x, e.y, colors.white, 4);
              if (e.hp <= 0) {
                destroy(e);
                enemies.splice(i, 1);
                break;
              }
            }
          }

          if (!enemies[i]) continue;
          if (distance(e, player) < e.r + 20) {
            enemies.splice(i, 1);
            burst(e.x, e.y, colors.red, 20);
            damagePlayer();
          } else if (e.y > H + 60) {
            enemies.splice(i, 1);
          }
        }

        // Power-ups
        for (let i = powerups.length - 1; i >= 0; i--) {
          const p = powerups[i];
          p.y += 46 * dt;
          p.phase += dt * 5;
          p.life -= dt;
          if (distance(p, player) < 25) {
            if (p.type === 'triple') {
              player.triple = 12;
              floating('TRIPLE CANNONS!', p.x, p.y, colors.orange);
            } else if (p.type === 'rapid') {
              player.rapid = 9;
              floating('OVERDRIVE!', p.x, p.y, colors.violet);
            } else if (p.type === 'bomb') {
              triggerNovaBomb();
            } else {
              shields = Math.min(settings[difficulty].shields + 2, shields + 1);
              floating('SHIELD RESTORED +1', p.x, p.y, colors.green);
            }
            tone('power');
            burst(p.x, p.y, colors.green, 14);
            powerups.splice(i, 1);
            updateUI();
          } else if (p.life <= 0 || p.y > H) {
            powerups.splice(i, 1);
          }
        }

        // Shockwaves
        for (let i = shockwaves.length - 1; i >= 0; i--) {
          const sw = shockwaves[i];
          sw.life -= dt;
          sw.r += (sw.maxRadius - sw.r) * Math.min(1, dt * 10);
          if (sw.life <= 0) shockwaves.splice(i, 1);
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life -= dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.96;
          p.vy *= 0.96;
          if (p.life <= 0) particles.splice(i, 1);
        }

        // Floating texts
        texts.forEach((t) => { t.life -= dt; t.y -= 28 * dt; });
        texts = texts.filter((t) => t.life > 0);
      }

      function pathShip() {
        ctx.beginPath();
        ctx.moveTo(0, -26);
        ctx.lineTo(19, 19);
        ctx.lineTo(6, 14);
        ctx.lineTo(0, 21);
        ctx.lineTo(-6, 14);
        ctx.lineTo(-19, 19);
        ctx.closePath();
      }

      function drawBackground() {
        ctx.fillStyle = backdrop;
        ctx.fillRect(0, 0, W, H);
        const nebula = ctx.createRadialGradient(W * 0.18, H * 0.3, 8, W * 0.18, H * 0.3, 260);
        nebula.addColorStop(0, 'rgba(65,80,185,0.18)');
        nebula.addColorStop(1, 'rgba(3,7,25,0)');
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, W, H);

        stars.forEach((layer) => layer.forEach((s) => {
          ctx.globalAlpha = s.alpha * (0.65 + 0.35 * Math.sin(s.phase));
          ctx.fillStyle = colors.white;
          ctx.fillRect(s.x, s.y, s.r, s.r);
        }));
        ctx.globalAlpha = 1;
      }

      function drawPlayer() {
        if (!(state === 'running' || state === 'paused') || (player.invincible > 0 && Math.floor(player.invincible * 12) % 2 === 0)) return;
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.tilt * 0.45);

        // Animated Thruster Plume
        const plume = 24 + Math.min(22, Math.abs(player.vx) * 0.05) + Math.sin(frame * 25) * 4;
        const flame = ctx.createLinearGradient(0, 14, 0, 14 + plume);
        flame.addColorStop(0, '#ffffff');
        flame.addColorStop(0.2, '#52e8ff');
        flame.addColorStop(0.6, '#38bdf8');
        flame.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = flame;
        ctx.beginPath();
        ctx.moveTo(-7, 13);
        ctx.lineTo(7, 13);
        ctx.lineTo(0, 14 + plume);
        ctx.fill();

        // Hull
        const hull = ctx.createLinearGradient(-18, -26, 18, 21);
        hull.addColorStop(0, '#d7f5ff');
        hull.addColorStop(0.38, '#2985cc');
        hull.addColorStop(1, '#192d76');
        ctx.fillStyle = hull;
        ctx.shadowColor = colors.cyan;
        ctx.shadowBlur = 14;
        pathShip();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Cockpit
        ctx.fillStyle = '#9ffff7';
        ctx.beginPath();
        ctx.ellipse(0, -5, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#d9fbff';
        ctx.lineWidth = 1.2;
        pathShip();
        ctx.stroke();

        // Powerup Aura
        if (player.triple > 0 || player.rapid > 0) {
          ctx.strokeStyle = player.triple > 0 ? colors.orange : colors.violet;
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 0.75;
          ctx.beginPath();
          ctx.arc(0, 0, 30 + Math.sin(frame * 6) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      function drawEnemy(e) {
        ctx.save();
        ctx.translate(e.x, e.y);
        if (e.type === 'boss') {
          // Boss Dreadnought
          const g = ctx.createLinearGradient(-48, -30, 48, 32);
          g.addColorStop(0, '#f05b91');
          g.addColorStop(0.55, '#75235d');
          g.addColorStop(1, '#190a31');
          ctx.fillStyle = g;
          ctx.shadowColor = colors.red;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.moveTo(-48, -8);
          ctx.lineTo(-25, -30);
          ctx.lineTo(25, -30);
          ctx.lineTo(48, -8);
          ctx.lineTo(30, 26);
          ctx.lineTo(0, 35);
          ctx.lineTo(-30, 26);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;

          // Glowing energy core
          const coreGlow = 8 + Math.sin(frame * 8) * 3;
          ctx.fillStyle = colors.cyan;
          ctx.shadowColor = colors.cyan;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, coreGlow, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#ffb4d0';
          ctx.fillRect(-18, -14, 36, 6);
        } else if (e.type === 'heavy') {
          ctx.rotate(e.phase * 0.4);
          ctx.fillStyle = '#6d7789';
          ctx.strokeStyle = '#dbe9fa';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4;
            const r = e.r + (i % 2 ? -4 : 2);
            i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Health rings
          ctx.strokeStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.rotate(Math.sin(e.phase * 2) * 0.2);
          ctx.fillStyle = e.type === 'interceptor' ? '#f79245' : '#e54a71';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(0, 19);
          ctx.lineTo(-17, -14);
          ctx.lineTo(0, -7);
          ctx.lineTo(17, -14);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffe8ca';
          ctx.fillRect(-4, -8, 8, 5);
        }
        ctx.restore();
      }

      function render() {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawBackground();
        ctx.save();
        if (shake) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

        // Shockwaves
        shockwaves.forEach((sw) => {
          ctx.save();
          ctx.globalAlpha = Math.max(0, sw.life / sw.maxLife);
          ctx.strokeStyle = sw.color;
          ctx.lineWidth = 3;
          ctx.shadowColor = sw.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });

        // Bullets
        for (const b of bullets) {
          ctx.fillStyle = colors.cyan;
          ctx.shadowColor = colors.cyan;
          ctx.shadowBlur = 10;
          ctx.fillRect(b.x - 2, b.y - 14, 4, 18);
        }
        ctx.shadowBlur = 0;

        // Enemy Bullets
        for (const b of enemyBullets) {
          ctx.fillStyle = colors.red;
          ctx.shadowColor = colors.red;
          ctx.shadowBlur = 6;
          ctx.fillRect(b.x - 3, b.y - 6, 6, 14);
        }
        ctx.shadowBlur = 0;

        enemies.forEach(drawEnemy);

        // Powerups
        powerups.forEach((p) => {
          const color = p.type === 'shield' ? colors.green : (p.type === 'rapid' ? colors.violet : (p.type === 'bomb' ? colors.cyan : colors.orange));
          ctx.save();
          ctx.translate(p.x, p.y + Math.sin(p.phase) * 3);
          ctx.rotate(p.phase);
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#061224';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const sym = p.type === 'triple' ? '3' : (p.type === 'rapid' ? 'R' : (p.type === 'bomb' ? '💥' : '+'));
          ctx.fillText(sym, 0, 1);
          ctx.restore();
        });

        // Particles
        particles.forEach((p) => {
          ctx.globalAlpha = Math.max(0, p.life / p.max);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.r, p.r);
        });
        ctx.globalAlpha = 1;

        drawPlayer();
        ctx.restore();

        // Texts
        texts.forEach((t) => {
          ctx.globalAlpha = Math.min(1, t.life * 2);
          ctx.fillStyle = t.color;
          ctx.font = '700 13px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(t.text, t.x, t.y);
        });
        ctx.globalAlpha = 1;

        // Boss Health Bar
        const boss = enemies.find((e) => e.type === 'boss');
        if (boss) {
          const barW = 280;
          ctx.fillStyle = 'rgba(0,0,0,0.65)';
          ctx.fillRect((W - barW) / 2, 14, barW, 14);
          ctx.fillStyle = colors.red;
          ctx.fillRect((W - barW) / 2 + 2, 16, (barW - 4) * Math.max(0, boss.hp / boss.maxHp), 10);
          ctx.fillStyle = colors.white;
          ctx.font = '700 10px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('CYBER DREADNOUGHT', W / 2, 11);
        }

        // Wave Banner
        if (waveBanner > 0 && state === 'running') {
          const a = Math.min(1, waveBanner * 1.4, (2.4 - waveBanner) * 2);
          ctx.globalAlpha = a;
          ctx.fillStyle = colors.white;
          ctx.font = '700 25px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(wave % 5 === 0 ? `WAVE ${wave} — DREADNOUGHT APPROACHING` : `WAVE ${wave} INCOMING`, W / 2, H * 0.42);
          ctx.globalAlpha = 1;
        }

        if (state !== 'running') overlay();
      }

      function overlay() {
        ctx.fillStyle = 'rgba(2,5,16,0.78)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        if (state === 'idle') {
          ctx.fillStyle = colors.cyan;
          ctx.font = '700 28px ui-monospace, monospace';
          ctx.fillText('CYBER DEFENDER', W / 2, H / 2 - 42);
          ctx.fillStyle = '#d4e5fa';
          ctx.font = '14px system-ui, sans-serif';
          ctx.fillText('A / D or Arrows to move · Space / Click to fire', W / 2, H / 2);
          ctx.fillText('Mobile: Touch & drag ship with auto-fire · Tap Fullscreen for immersive play', W / 2, H / 2 + 25);
        } else if (state === 'paused') {
          ctx.fillStyle = colors.cyan;
          ctx.font = '700 26px ui-monospace, monospace';
          ctx.fillText('MISSION PAUSED', W / 2, H / 2);
        } else {
          ctx.fillStyle = colors.red;
          ctx.font = '700 28px ui-monospace, monospace';
          ctx.fillText('MISSION FAILED', W / 2, H / 2 - 25);
          ctx.fillStyle = colors.white;
          ctx.font = '16px system-ui, sans-serif';
          ctx.fillText(`Final score: ${score}`, W / 2, H / 2 + 8);
          ctx.fillStyle = colors.orange;
          ctx.fillText(`Top score: ${highScore}`, W / 2, H / 2 + 35);
        }
      }

      function loop(now) {
        if (state !== 'running' || !visible) { render(); return; }
        const dt = Math.min(0.05, (now - last) / 1000 || 0);
        last = now;
        update(dt);
        render();
        requestAnimationFrame(loop);
      }

      function pointer(e) {
        const r = canvas.getBoundingClientRect();
        const x = (e.clientX - r.left) * W / r.width;
        player.x = clamp(x, 28, W - 28);
      }

      function keydown(e) {
        if (state !== 'running') return;
        if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD', 'Space'].includes(e.code)) e.preventDefault();
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
        if (e.code === 'Space') fire();
      }

      window.addEventListener('keydown', keydown);
      window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
      });

      canvas.addEventListener('pointerdown', (e) => {
        if (state === 'idle' || state === 'gameover') { start(); return; }
        pointer(e);
        player.auto = e.pointerType === 'touch';
        if (e.pointerType === 'mouse') fire();
        canvas.setPointerCapture?.(e.pointerId);
      });
      canvas.addEventListener('pointermove', (e) => {
        if (state === 'running' && (e.buttons || e.pointerType === 'touch')) pointer(e);
      });
      canvas.addEventListener('pointerup', () => { player.auto = false; });

      const releaseControl = (e) => {
        if (e) e.currentTarget.releasePointerCapture?.(e.pointerId);
        keys.left = false;
        keys.right = false;
        player.auto = false;
      };

      [['left', -1], ['right', 1]].forEach(([name, dir]) => {
        const button = controls[name];
        button?.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          button.setPointerCapture?.(e.pointerId);
          keys[dir < 0 ? 'left' : 'right'] = true;
        });
        button?.addEventListener('pointerup', releaseControl);
        button?.addEventListener('pointercancel', releaseControl);
        button?.addEventListener('lostpointercapture', releaseControl);
      });

      controls.fire?.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        controls.fire.setPointerCapture?.(e.pointerId);
        player.auto = true;
        fire();
      });
      controls.fire?.addEventListener('pointerup', releaseControl);
      controls.fire?.addEventListener('pointercancel', releaseControl);
      controls.fire?.addEventListener('lostpointercapture', releaseControl);

      ui.start.addEventListener('click', start);
      ui.pause.addEventListener('click', () => state === 'running' ? pause() : resume());
      ui.quit.addEventListener('click', quit);
      ui.sound.addEventListener('click', () => {
        sound = !sound;
        ui.sound.textContent = sound ? '🔊 Sound' : '🔇 Muted';
      });

      // Fullscreen
      ui.fullscreen?.addEventListener('click', toggleFullscreen);
      document.addEventListener('fullscreenchange', syncFullscreenBtn);
      document.addEventListener('webkitfullscreenchange', syncFullscreenBtn);

      document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); });
      document.addEventListener('playground:tabchange', (e) => { if (e.detail.labId !== 'shooter') pause(true); });
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) pause(true);
      }, { threshold: 0.08 }).observe(wrapper);

      const difficultyRoot = document.querySelector('[data-difficulty-for="shooter"]');
      difficultyRoot?.addEventListener('click', (e) => {
        const next = e.target.dataset.difficulty;
        if (!settings[next] || next === difficulty) return;
        difficulty = next;
        highScore = readScore();
        difficultyRoot.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.difficulty === next)));
        quit();
        updateUI();
      });

      makeStars();
      highScore = readScore();
      resize();
      window.addEventListener('resize', resize, { passive: true });
      updateUI();
      render();
    },
  };
})();
