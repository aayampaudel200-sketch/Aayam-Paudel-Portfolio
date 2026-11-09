/**
 * Interactive starfield background for the hero canvas.
 * Dense particles, mouse proximity physics, constellation links, and shooting stars.
 */
(() => {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const hero = canvas.closest('.hero') || document.body;
  const isTouchDevice =
    window.matchMedia('(pointer: coarse)').matches ||
    !window.matchMedia('(hover: hover)').matches ||
    'ontouchstart' in window;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CONSTELLATION_DIST = 100;
  const SHOOT_INTERVAL_MIN = 2800;
  const SHOOT_INTERVAL_MAX = 6200;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let shootingStars = [];
  let animationFrame = null;
  let time = 0;
  let isVisible = !document.hidden;
  let nextShootAt = 0;

  const targetPointer = { x: -9999, y: -9999, active: false };
  const smoothPointer = { x: -9999, y: -9999 };

  function getParticleConfig() {
    if (width < 640) {
      return { count: 150, mouseRadius: 110, pushForce: 1.35, glowBoost: 1.4 };
    }
    if (width < 1024) {
      return { count: 170, mouseRadius: 140, pushForce: 1.55, glowBoost: 1.6 };
    }
    return { count: 190, mouseRadius: 170, pushForce: 1.75, glowBoost: 1.85 };
  }

  function createParticle(index, colors) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.08 + Math.random() * 0.28;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 0.7 + Math.random() * 1.9,
      color: colors[index % colors.length],
      phase: Math.random() * Math.PI * 2,
      glow: 0,
    };
  }

  function initParticles() {
    const config = getParticleConfig();
    const colors = [
      '56, 189, 248',
      '129, 140, 248',
      '45, 212, 191',
      '192, 132, 252',
      '148, 163, 184',
      '125, 211, 252',
    ];
    particles = Array.from({ length: config.count }, (_, i) => createParticle(i, colors));
  }

  function scheduleNextShoot() {
    nextShootAt = time + (SHOOT_INTERVAL_MIN + Math.random() * (SHOOT_INTERVAL_MAX - SHOOT_INTERVAL_MIN)) / 1000;
  }

  function spawnShootingStar() {
    const fromTop = Math.random() > 0.35;
    const startX = fromTop ? Math.random() * width * 0.85 : -40;
    const startY = fromTop ? -20 : Math.random() * height * 0.55;
    const angle = Math.PI / 5 + Math.random() * (Math.PI / 7);
    const speed = 7.5 + Math.random() * 5.5;
    shootingStars.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.012 + Math.random() * 0.01,
      length: 55 + Math.random() * 70,
      width: 1.2 + Math.random() * 1.4,
    });
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = bounds.width || window.innerWidth;
    height = bounds.height || window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    initParticles();
    shootingStars = [];
    scheduleNextShoot();
    drawScene();
  }

  function drawAmbientGlow() {
    const drift = prefersReduced ? 0 : time * 0.18;
    const glow1 = ctx.createRadialGradient(
      width * (0.65 + Math.sin(drift * 0.4) * 0.08),
      height * (0.38 + Math.cos(drift * 0.3) * 0.08),
      0,
      width * 0.65,
      height * 0.38,
      Math.max(width, height) * 0.52
    );
    glow1.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
    glow1.addColorStop(0.5, 'rgba(129, 140, 248, 0.04)');
    glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);
  }

  function drawConstellations() {
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.hypot(dx, dy);
        if (dist >= CONSTELLATION_DIST) continue;

        const proximityGlow = Math.max(p1.glow, p2.glow);
        const alpha = (1 - dist / CONSTELLATION_DIST) * (0.18 + proximityGlow * 0.35);
        ctx.strokeStyle = `rgba(${p1.color}, ${alpha})`;
        ctx.lineWidth = dist < CONSTELLATION_DIST * 0.45 ? 1.05 : 0.55;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }

  function updateParticles() {
    const config = getParticleConfig();

    if (!isTouchDevice && targetPointer.active) {
      smoothPointer.x += (targetPointer.x - smoothPointer.x) * 0.14;
      smoothPointer.y += (targetPointer.y - smoothPointer.y) * 0.14;
    }

    for (const p of particles) {
      p.glow *= 0.9;

      if (!isTouchDevice && targetPointer.active && !prefersReduced) {
        const dx = p.x - smoothPointer.x;
        const dy = p.y - smoothPointer.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0 && dist < config.mouseRadius) {
          const strength = 1 - dist / config.mouseRadius;
          const force = strength * config.pushForce;
          p.vx += (dx / dist) * force * 0.42;
          p.vy += (dy / dist) * force * 0.42;
          p.glow = Math.min(1, p.glow + strength * config.glowBoost * 0.35);
        }
      }

      p.vx *= 0.982;
      p.vy *= 0.982;

      const curSpeed = Math.hypot(p.vx, p.vy);
      if (curSpeed < 0.08) {
        const angle = Math.random() * Math.PI * 2;
        p.vx += Math.cos(angle) * 0.03;
        p.vy += Math.sin(angle) * 0.03;
      }

      p.x += p.vx;
      p.y += p.vy;

      const pad = 24;
      if (p.x < -pad) p.x = width + pad;
      if (p.x > width + pad) p.x = -pad;
      if (p.y < -pad) p.y = height + pad;
      if (p.y > height + pad) p.y = -pad;
    }
  }

  function updateShootingStars() {
    if (prefersReduced) return;

    if (time >= nextShootAt) {
      spawnShootingStar();
      scheduleNextShoot();
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const star = shootingStars[i];
      star.x += star.vx;
      star.y += star.vy;
      star.life -= star.decay;

      if (
        star.life <= 0 ||
        star.x > width + 80 ||
        star.y > height + 80
      ) {
        shootingStars.splice(i, 1);
      }
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const pulse = prefersReduced ? 1 : 0.82 + Math.sin(time * 2.1 + p.phase) * 0.18;
      const glowBoost = 1 + p.glow * 1.8;
      const r = p.radius * pulse * (1 + p.glow * 0.9);
      const alpha = Math.min(1, 0.55 + p.glow * 0.45);

      if (p.glow > 0.05) {
        const aura = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);
        aura.addColorStop(0, `rgba(${p.color}, ${0.28 * p.glow})`);
        aura.addColorStop(1, `rgba(${p.color}, 0)`);
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
      ctx.shadowColor = `rgba(${p.color}, ${0.45 + p.glow * 0.45})`;
      ctx.shadowBlur = 6 * glowBoost;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawShootingStars() {
    for (const star of shootingStars) {
      const tailX = star.x - star.vx * (star.length / 10);
      const tailY = star.y - star.vy * (star.length / 10);
      const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
      gradient.addColorStop(0, 'rgba(186, 230, 253, 0)');
      gradient.addColorStop(0.45, `rgba(125, 211, 252, ${0.35 * star.life})`);
      gradient.addColorStop(1, `rgba(255, 255, 255, ${0.95 * star.life})`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = star.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(star.x, star.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.width * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * star.life})`;
      ctx.fill();
    }
  }

  function drawPointerAura() {
    if (isTouchDevice || !targetPointer.active || prefersReduced) return;

    const radius = 72;
    const aura = ctx.createRadialGradient(
      smoothPointer.x,
      smoothPointer.y,
      0,
      smoothPointer.x,
      smoothPointer.y,
      radius
    );
    aura.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
    aura.addColorStop(0.55, 'rgba(129, 140, 248, 0.07)');
    aura.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(smoothPointer.x, smoothPointer.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawScene() {
    ctx.clearRect(0, 0, width, height);
    drawAmbientGlow();
    drawConstellations();
    drawParticles();
    drawShootingStars();
    drawPointerAura();
  }

  function tick() {
    if (!isVisible || prefersReduced) return;
    time += 0.016;
    updateParticles();
    updateShootingStars();
    drawScene();
    animationFrame = requestAnimationFrame(tick);
  }

  function start() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (prefersReduced) {
      drawScene();
      return;
    }
    animationFrame = requestAnimationFrame(tick);
  }

  function stop() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  if (!isTouchDevice && hero) {
    hero.addEventListener(
      'pointermove',
      (e) => {
        const bounds = canvas.getBoundingClientRect();
        targetPointer.x = e.clientX - bounds.left;
        targetPointer.y = e.clientY - bounds.top;
        if (!targetPointer.active) {
          smoothPointer.x = targetPointer.x;
          smoothPointer.y = targetPointer.y;
          targetPointer.active = true;
        }
      },
      { passive: true }
    );

    hero.addEventListener(
      'pointerleave',
      () => {
        targetPointer.active = false;
      },
      { passive: true }
    );
  }

  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
    if (isVisible) start();
    else stop();
  });

  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', () => {
    if (!document.hidden) start();
  });

  let resizeTimer = null;
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 140);
    },
    { passive: true }
  );

  resize();
  start();
})();
