/* Cyber Defender: zero-dependency Canvas 2D arcade module. */
(() => {
  'use strict';
  const W = 640, H = 420, MAX = { bullets: 42, enemyBullets: 36, enemies: 18, particles: 150 };
  const settings = {
    easy: { shields: 5, pace: 0.78, spawn: 1.18 },
    medium: { shields: 3, pace: 1, spawn: 0.9 },
    hard: { shields: 2, pace: 1.27, spawn: 0.68 },
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
      const ui = { start: $('shooterStartBtn'), pause: $('shooterPauseBtn'), quit: $('shooterQuitBtn'), sound: $('shooterSoundBtn'), score: $('shooterScore'), shields: $('shooterShields'), wave: $('shooterWave'), top: $('shooterHighScore') };
      const controls = { left: $('touchLeftBtn'), right: $('touchRightBtn'), fire: $('touchFireBtn') };
      let dpr = 1, state = 'idle', visible = true, last = 0, frame = 0, audio, sound = true;
      let difficulty = 'medium', score = 0, highScore = 0, wave = 1, kills = 0, combo = 1, shields = settings.medium.shields;
      let spawnClock = 0, fireClock = 0, waveBanner = 2.5, shake = 0, bossActive = false;
      let bullets = [], enemyBullets = [], enemies = [], particles = [], texts = [], powerups = [];
      const keys = { left: false, right: false }, player = { x: W / 2, y: H - 58, vx: 0, tilt: 0, invincible: 0, triple: 0, rapid: 0, auto: false };
      const stars = [[], [], []];
      const colors = { cyan: '#52e8ff', violet: '#8b5cf6', red: '#fb4b68', orange: '#ffb24a', green: '#4df5a2', white: '#f6fbff' };
      let backdrop;

      function scoreKey() { return `cyberDefenderHighScore:${difficulty}`; }
      function readScore() { try { return Number(localStorage.getItem(scoreKey())) || 0; } catch (_) { return 0; } }
      function saveScore() { try { localStorage.setItem(scoreKey(), String(highScore)); } catch (_) {} }
      function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        backdrop = ctx.createLinearGradient(0, 0, 0, H);
        backdrop.addColorStop(0, '#030719'); backdrop.addColorStop(.5, '#080b27'); backdrop.addColorStop(1, '#02050f');
        render();
      }
      function makeStars() {
        [[38, 18, .28], [28, 34, .52], [18, 62, .85]].forEach(([count, speed, alpha], layer) => {
          for (let i = 0; i < count; i++) stars[layer].push({ x: Math.random() * W, y: Math.random() * H, r: .45 + layer * .48 + Math.random() * .6, speed: speed + Math.random() * speed, alpha: alpha * (.55 + Math.random() * .45), phase: Math.random() * 6.3 });
        });
      }
      function initAudio() {
        if (!sound) return null;
        if (!audio) { const Ctx = window.AudioContext || window.webkitAudioContext; if (Ctx) audio = new Ctx(); }
        if (audio?.state === 'suspended') audio.resume();
        return audio;
      }
      function tone(kind) {
        const ac = initAudio(); if (!ac) return;
        const now = ac.currentTime, osc = ac.createOscillator(), gain = ac.createGain();
        const data = { laser: ['square', 740, 210, .055, .055], blast: ['sawtooth', 180, 45, .16, .11], hit: ['triangle', 110, 42, .18, .13], power: ['sine', 380, 820, .22, .10], boss: ['sawtooth', 95, 52, .34, .13] }[kind] || ['sine', 330, 260, .1, .06];
        osc.type = data[0]; osc.frequency.setValueAtTime(data[1], now); osc.frequency.exponentialRampToValueAtTime(data[2], now + data[3]);
        gain.gain.setValueAtTime(data[4], now); gain.gain.exponentialRampToValueAtTime(.001, now + data[3]); osc.connect(gain).connect(ac.destination); osc.start(now); osc.stop(now + data[3]);
      }
      function floating(text, x, y, color = colors.cyan) { if (texts.length < 14) texts.push({ text, x, y, color, life: .9 }); }
      function burst(x, y, color, count = 14) {
        for (let i = 0; i < count && particles.length < MAX.particles; i++) { const a = Math.random() * Math.PI * 2, s = 35 + Math.random() * 180; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .3 + Math.random() * .45, max: .75, color, r: 1 + Math.random() * 2.5 }); }
        particles.push({ x, y, vx: 0, vy: 0, ring: true, life: .35, max: .35, color, r: 4 });
      }
      function reset() {
        score = 0; wave = 1; kills = 0; combo = 1; shields = settings[difficulty].shields; spawnClock = fireClock = 0; waveBanner = 2.2; bossActive = false;
        bullets = []; enemyBullets = []; enemies = []; particles = []; texts = []; powerups = [];
        Object.assign(player, { x: W / 2, y: H - 58, vx: 0, tilt: 0, invincible: 1.2, triple: 0, rapid: 0, auto: false }); updateUI();
      }
      function updateUI() { ui.score.textContent = score; ui.wave.textContent = wave; ui.top.textContent = highScore; ui.shields.textContent = shields > 0 ? '🛡️ '.repeat(shields).trim() : '💥 Critical'; }
      function start() { reset(); state = 'running'; ui.start.textContent = 'Restart'; ui.pause.textContent = 'Pause'; last = performance.now(); requestAnimationFrame(loop); }
      function pause(auto = false) { if (state !== 'running') return; state = 'paused'; ui.pause.textContent = auto ? 'Paused' : 'Resume'; render(); }
      function resume() { if (state !== 'paused' || !visible) return; state = 'running'; ui.pause.textContent = 'Pause'; last = performance.now(); requestAnimationFrame(loop); }
      function quit() { state = 'idle'; ui.start.textContent = 'Start Mission'; ui.pause.textContent = 'Pause'; reset(); render(); }
      function gameOver() { state = 'gameover'; tone('boss'); if (score > highScore) { highScore = score; saveScore(); } updateUI(); ui.start.textContent = 'Play Again'; render(); }
      function addBullet(x, y, vx = 0) { if (bullets.length < MAX.bullets) bullets.push({ x, y, vx, vy: -680, life: 1 }); }
      function fire() { if (state !== 'running' || fireClock > 0) return; const spread = player.triple > 0; addBullet(player.x, player.y - 28); if (spread) { addBullet(player.x - 13, player.y - 23, -125); addBullet(player.x + 13, player.y - 23, 125); } fireClock = player.rapid > 0 ? .07 : spread ? .12 : .18; tone('laser'); }
      function spawnEnemy() {
        if (enemies.length >= MAX.enemies) return;
        if (wave % 5 === 0 && !bossActive) { bossActive = true; enemies.push({ type: 'boss', x: W / 2, y: -52, r: 45, hp: 30 + wave * 8, maxHp: 30 + wave * 8, vx: 95 * settings[difficulty].pace, dir: 1, fire: .8, phase: 0, points: 1400 }); tone('boss'); floating('DREADNOUGHT DETECTED', W / 2, 105, colors.red); return; }
        const roll = Math.random(), type = wave >= 3 && roll < .23 ? 'heavy' : wave >= 2 && roll < .5 ? 'interceptor' : 'scout';
        const hp = type === 'heavy' ? 4 + Math.floor(wave / 3) : 1;
        enemies.push({ type, x: 35 + Math.random() * (W - 70), y: -28, r: type === 'heavy' ? 25 : 17, hp, maxHp: hp, vx: (Math.random() - .5) * 35, vy: (type === 'scout' ? 76 : type === 'interceptor' ? 58 : 42) * settings[difficulty].pace + wave * 4, phase: Math.random() * 6.3, fire: .8 + Math.random() * 1.5, points: type === 'heavy' ? 240 : type === 'interceptor' ? 140 : 100 });
      }
      function damagePlayer() { if (player.invincible > 0) return; shields--; combo = 1; player.invincible = 1; shake = 9; burst(player.x, player.y, colors.red, 22); floating('SHIELD HIT', player.x, player.y - 20, colors.red); tone('hit'); updateUI(); if (shields <= 0) gameOver(); }
      function destroy(e) {
        const gain = Math.round(e.points * combo); score += gain; combo = Math.min(5, combo + 1); shake = Math.max(shake, e.type === 'boss' ? 11 : 4); burst(e.x, e.y, e.type === 'heavy' || e.type === 'boss' ? colors.orange : colors.cyan, e.type === 'boss' ? 42 : 16); floating(`+${gain}`, e.x, e.y, colors.green); if (combo > 2) floating(`x${combo} COMBO!`, e.x, e.y + 18, colors.orange); tone('blast');
        if (e.type !== 'boss' && Math.random() < .15 && powerups.length < 4) powerups.push({ x: e.x, y: e.y, type: Math.random() < .4 ? 'triple' : Math.random() < .5 ? 'rapid' : 'shield', life: 7, phase: 0 });
        kills++; if (e.type === 'boss') { bossActive = false; wave++; kills = 0; waveBanner = 2.3; } else if (kills >= 7 + wave * 2) { wave++; kills = 0; waveBanner = 2.3; }
        updateUI();
      }
      function update(dt) {
        frame += dt; fireClock -= dt; player.invincible -= dt; player.triple -= dt; player.rapid -= dt; waveBanner -= dt; shake = Math.max(0, shake - 28 * dt);
        const target = (keys.left ? -1 : 0) + (keys.right ? 1 : 0); player.vx += (target * 420 - player.vx) * Math.min(1, dt * 12); player.x = clamp(player.x + player.vx * dt, 28, W - 28); player.tilt += (player.vx / 460 - player.tilt) * Math.min(1, dt * 9); if (player.auto) fire();
        stars.forEach((layer, level) => layer.forEach((s) => { s.y += s.speed * dt * (1 + wave * .025); if (s.y > H + 2) { s.y = -2; s.x = Math.random() * W; } s.phase += dt * (1 + level); }));
        spawnClock += dt; const gap = Math.max(.28, settings[difficulty].spawn / (1 + wave * .085)); if (spawnClock >= gap) { spawnClock = 0; spawnEnemy(); }
        for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt; if (b.y < -12) bullets.splice(i, 1); }
        for (let i = enemyBullets.length - 1; i >= 0; i--) { const b = enemyBullets[i]; b.x += b.vx * dt; b.y += b.vy * dt; if (b.y > H + 15 || b.x < -15 || b.x > W + 15) enemyBullets.splice(i, 1); else if (distance(b, player) < 22) { enemyBullets.splice(i, 1); damagePlayer(); } }
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i]; e.phase += dt; e.fire -= dt;
          if (e.type === 'boss') { e.y += (68 - e.y) * dt * 1.2; e.x += e.vx * e.dir * dt; if (e.x < 70 || e.x > W - 70) e.dir *= -1; if (e.fire < 0) { e.fire = .72; for (let n = -2; n <= 2; n++) if (enemyBullets.length < MAX.enemyBullets) enemyBullets.push({ x: e.x + n * 13, y: e.y + 34, vx: n * 75, vy: 185 + wave * 7 }); } }
          else { e.x += (e.type === 'interceptor' ? Math.sin(e.phase * 3.4) * 85 : Math.sin(e.phase * 1.7) * 18) * dt; e.y += e.vy * dt; if (e.type === 'interceptor' && e.fire < 0) { e.fire = 1.5; if (enemyBullets.length < MAX.enemyBullets) enemyBullets.push({ x: e.x, y: e.y + 14, vx: (player.x - e.x) * .35, vy: 180 + wave * 7 }); } }
          for (let j = bullets.length - 1; j >= 0; j--) if (distance(e, bullets[j]) < e.r + 5) { bullets.splice(j, 1); e.hp--; burst(e.x, e.y, colors.white, 4); if (e.hp <= 0) { destroy(e); enemies.splice(i, 1); break; } }
          if (!enemies[i]) continue; if (distance(e, player) < e.r + 20) { enemies.splice(i, 1); burst(e.x, e.y, colors.red, 18); damagePlayer(); } else if (e.y > H + 60) enemies.splice(i, 1);
        }
        for (let i = powerups.length - 1; i >= 0; i--) { const p = powerups[i]; p.y += 42 * dt; p.phase += dt * 5; p.life -= dt; if (distance(p, player) < 25) { if (p.type === 'triple') player.triple = 10; else if (p.type === 'rapid') player.rapid = 8; else shields = Math.min(settings[difficulty].shields + 2, shields + 1); floating(p.type === 'shield' ? 'SHIELD +1' : p.type === 'rapid' ? 'OVERDRIVE!' : 'TRIPLE SHOT!', p.x, p.y, colors.green); tone('power'); burst(p.x, p.y, colors.green, 12); powerups.splice(i, 1); updateUI(); } else if (p.life <= 0 || p.y > H) powerups.splice(i, 1); }
        for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .97; p.vy *= .97; if (p.ring) p.r += 90 * dt; if (p.life <= 0) particles.splice(i, 1); }
        texts.forEach((t) => { t.life -= dt; t.y -= 28 * dt; }); texts = texts.filter((t) => t.life > 0);
      }
      function pathShip() { ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(19, 19); ctx.lineTo(6, 14); ctx.lineTo(0, 21); ctx.lineTo(-6, 14); ctx.lineTo(-19, 19); ctx.closePath(); }
      function drawBackground() { ctx.fillStyle = backdrop; ctx.fillRect(0, 0, W, H); const nebula = ctx.createRadialGradient(W * .18, H * .3, 8, W * .18, H * .3, 260); nebula.addColorStop(0, 'rgba(65,80,185,.16)'); nebula.addColorStop(1, 'rgba(3,7,25,0)'); ctx.fillStyle = nebula; ctx.fillRect(0, 0, W, H); stars.forEach((layer) => layer.forEach((s) => { ctx.globalAlpha = s.alpha * (.65 + .35 * Math.sin(s.phase)); ctx.fillStyle = colors.white; ctx.fillRect(s.x, s.y, s.r, s.r); })); ctx.globalAlpha = 1; }
      function drawPlayer() { if (!(state === 'running' || state === 'paused') || (player.invincible > 0 && Math.floor(player.invincible * 12) % 2 === 0)) return; ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.tilt * .45); const plume = 22 + Math.min(18, Math.abs(player.vx) * .04); const flame = ctx.createLinearGradient(0, 14, 0, 14 + plume); flame.addColorStop(0, '#fff8b6'); flame.addColorStop(.35, '#42dfff'); flame.addColorStop(1, 'rgba(72,42,255,0)'); ctx.fillStyle = flame; ctx.beginPath(); ctx.moveTo(-7, 13); ctx.lineTo(7, 13); ctx.lineTo(0, 14 + plume); ctx.fill(); const hull = ctx.createLinearGradient(-18, -26, 18, 21); hull.addColorStop(0, '#d7f5ff'); hull.addColorStop(.38, '#2985cc'); hull.addColorStop(1, '#192d76'); ctx.fillStyle = hull; ctx.shadowColor = colors.cyan; ctx.shadowBlur = 13; pathShip(); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#9ffff7'; ctx.beginPath(); ctx.ellipse(0, -5, 5, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#d9fbff'; ctx.lineWidth = 1; pathShip(); ctx.stroke(); if (player.triple > 0 || player.rapid > 0) { ctx.strokeStyle = player.triple > 0 ? colors.orange : colors.green; ctx.lineWidth = 2; ctx.globalAlpha = .65; ctx.beginPath(); ctx.arc(0, 0, 29 + Math.sin(frame * 5) * 2, 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); ctx.globalAlpha = 1; }
      function drawEnemy(e) { ctx.save(); ctx.translate(e.x, e.y); if (e.type === 'boss') { const g = ctx.createLinearGradient(-48, -30, 48, 32); g.addColorStop(0, '#f05b91'); g.addColorStop(.55, '#75235d'); g.addColorStop(1, '#190a31'); ctx.fillStyle = g; ctx.shadowColor = colors.red; ctx.shadowBlur = 16; ctx.beginPath(); ctx.moveTo(-48, -8); ctx.lineTo(-25, -30); ctx.lineTo(25, -30); ctx.lineTo(48, -8); ctx.lineTo(30, 26); ctx.lineTo(0, 35); ctx.lineTo(-30, 26); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#ffb4d0'; ctx.fillRect(-18, -14, 36, 8); } else if (e.type === 'heavy') { ctx.rotate(e.phase * .35); ctx.fillStyle = '#6d7789'; ctx.strokeStyle = '#dbe9fa'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const r = e.r + (i % 2 ? -4 : 2); i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#2a3446'; for (let i = 1; i < e.maxHp; i++) if (i >= e.hp) { ctx.beginPath(); ctx.moveTo(-e.r / 2 + i * 5, -6); ctx.lineTo(e.r / 2 - i * 3, 9); ctx.stroke(); } } else { ctx.rotate(Math.sin(e.phase * 2) * .18); ctx.fillStyle = e.type === 'interceptor' ? '#f79245' : '#e54a71'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 9; ctx.beginPath(); ctx.moveTo(0, 19); ctx.lineTo(-17, -14); ctx.lineTo(0, -7); ctx.lineTo(17, -14); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#ffe8ca'; ctx.fillRect(-4, -8, 8, 5); } ctx.restore(); }
      function render() { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawBackground(); ctx.save(); if (shake) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake); for (const b of bullets) { ctx.fillStyle = colors.cyan; ctx.shadowColor = colors.cyan; ctx.shadowBlur = 8; ctx.fillRect(b.x - 2, b.y - 13, 4, 16); } ctx.shadowBlur = 0; for (const b of enemyBullets) { ctx.fillStyle = colors.red; ctx.fillRect(b.x - 3, b.y - 5, 6, 13); } enemies.forEach(drawEnemy); powerups.forEach((p) => { const color = p.type === 'shield' ? colors.green : p.type === 'rapid' ? colors.violet : colors.orange; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.phase); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#061224'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.type === 'triple' ? '3' : p.type === 'rapid' ? 'R' : '+', 0, 1); ctx.restore(); }); particles.forEach((p) => { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.strokeStyle = ctx.fillStyle = p.color; if (p.ring) { ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke(); } else ctx.fillRect(p.x, p.y, p.r, p.r); }); ctx.globalAlpha = 1; drawPlayer(); ctx.restore(); texts.forEach((t) => { ctx.globalAlpha = Math.min(1, t.life * 2); ctx.fillStyle = t.color; ctx.font = '700 13px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText(t.text, t.x, t.y); }); ctx.globalAlpha = 1;
        const boss = enemies.find((e) => e.type === 'boss'); if (boss) { const barW = 260; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect((W - barW) / 2, 15, barW, 11); ctx.fillStyle = colors.red; ctx.fillRect((W - barW) / 2 + 2, 17, (barW - 4) * (boss.hp / boss.maxHp), 7); ctx.fillStyle = colors.white; ctx.font = '700 10px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText('CYBER DREADNOUGHT', W / 2, 12); }
        if (waveBanner > 0 && state === 'running') { const a = Math.min(1, waveBanner * 1.4, (2.3 - waveBanner) * 2); ctx.globalAlpha = a; ctx.fillStyle = colors.white; ctx.font = '700 25px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText(wave % 5 === 0 ? `WAVE ${wave} — DREADNOUGHT INCOMING` : `WAVE ${wave} INCOMING`, W / 2, H * .42); ctx.globalAlpha = 1; }
        if (state !== 'running') overlay();
      }
      function overlay() { ctx.fillStyle = 'rgba(2,5,16,.72)'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center'; if (state === 'idle') { ctx.fillStyle = colors.cyan; ctx.font = '700 28px ui-monospace, monospace'; ctx.fillText('CYBER DEFENDER', W / 2, H / 2 - 42); ctx.fillStyle = '#d4e5fa'; ctx.font = '14px system-ui, sans-serif'; ctx.fillText('A / D or Arrows to move · Space / Click to fire', W / 2, H / 2); ctx.fillText('Touch-and-drag with auto-fire on mobile', W / 2, H / 2 + 25); } else if (state === 'paused') { ctx.fillStyle = colors.cyan; ctx.font = '700 26px ui-monospace, monospace'; ctx.fillText('MISSION PAUSED', W / 2, H / 2); } else { ctx.fillStyle = colors.red; ctx.font = '700 28px ui-monospace, monospace'; ctx.fillText('MISSION FAILED', W / 2, H / 2 - 25); ctx.fillStyle = colors.white; ctx.font = '16px system-ui, sans-serif'; ctx.fillText(`Final score: ${score}`, W / 2, H / 2 + 8); ctx.fillStyle = colors.orange; ctx.fillText(`Top score: ${highScore}`, W / 2, H / 2 + 35); } }
      function loop(now) { if (state !== 'running' || !visible) { render(); return; } const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; update(dt); render(); requestAnimationFrame(loop); }
      function pointer(e) { const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width; player.x = clamp(x, 28, W - 28); }
      function keydown(e) { if (state !== 'running') return; if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD', 'Space'].includes(e.code)) e.preventDefault(); if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true; if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true; if (e.code === 'Space') fire(); }
      window.addEventListener('keydown', keydown); window.addEventListener('keyup', (e) => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false; if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false; });
      canvas.addEventListener('pointerdown', (e) => { if (state === 'idle' || state === 'gameover') { start(); return; } pointer(e); player.auto = e.pointerType === 'touch'; if (e.pointerType === 'mouse') fire(); canvas.setPointerCapture?.(e.pointerId); }); canvas.addEventListener('pointermove', (e) => { if (state === 'running' && (e.buttons || e.pointerType === 'touch')) pointer(e); }); canvas.addEventListener('pointerup', () => { player.auto = false; });
      const releaseControl = (e) => { if (e) e.currentTarget.releasePointerCapture?.(e.pointerId); keys.left = false; keys.right = false; player.auto = false; };
      [['left', -1], ['right', 1]].forEach(([name, dir]) => { const button = controls[name]; button?.addEventListener('pointerdown', (e) => { e.preventDefault(); button.setPointerCapture?.(e.pointerId); keys[dir < 0 ? 'left' : 'right'] = true; }); button?.addEventListener('pointerup', releaseControl); button?.addEventListener('pointercancel', releaseControl); button?.addEventListener('lostpointercapture', releaseControl); });
      controls.fire?.addEventListener('pointerdown', (e) => { e.preventDefault(); controls.fire.setPointerCapture?.(e.pointerId); player.auto = true; fire(); }); controls.fire?.addEventListener('pointerup', releaseControl); controls.fire?.addEventListener('pointercancel', releaseControl); controls.fire?.addEventListener('lostpointercapture', releaseControl);
      ui.start.addEventListener('click', start); ui.pause.addEventListener('click', () => state === 'running' ? pause() : resume()); ui.quit.addEventListener('click', quit); ui.sound.addEventListener('click', () => { sound = !sound; ui.sound.textContent = sound ? '🔊 Sound' : '🔇 Muted'; });
      document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); }); document.addEventListener('playground:tabchange', (e) => { if (e.detail.labId !== 'shooter') pause(true); }); new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (!visible) pause(true); }, { threshold: .08 }).observe(wrapper);
      const difficultyRoot = document.querySelector('[data-difficulty-for="shooter"]'); difficultyRoot?.addEventListener('click', (e) => { const next = e.target.dataset.difficulty; if (!settings[next] || next === difficulty) return; difficulty = next; highScore = readScore(); difficultyRoot.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.difficulty === next))); quit(); updateUI(); });
      makeStars(); highScore = readScore(); resize(); window.addEventListener('resize', resize, { passive: true }); updateUI(); render();
    },
  };
})();
