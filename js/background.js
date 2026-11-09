/**
 * Interactive Hero Canvas: Particle Grid / Dynamic Mesh
 * Features smooth spring-interpolated mouse-follow interaction on desktop,
 * lightweight ambient cosmic drift on mobile/touch, and static rendering for reduced-motion.
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

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let animationFrame = null;
  let time = 0;
  let isVisible = !document.hidden;

  // Pointer position with smooth interpolation (lerp)
  const targetPointer = { x: -9999, y: -9999, active: false };
  const smoothPointer = { x: -9999, y: -9999 };

  function getParticleConfig() {
    if (width < 640) {
      return { count: 32, maxDist: 105, speed: 0.28, mouseRadius: 100 };
    }
    if (width < 1024) {
      return { count: 52, maxDist: 140, speed: 0.38, mouseRadius: 130 };
    }
    return { count: 76, maxDist: 175, speed: 0.45, mouseRadius: 160 };
  }

  function initParticles() {
    const config = getParticleConfig();
    const colors = [
      '56, 189, 248',  // sky-400
      '129, 140, 248', // indigo-400
      '45, 212, 191',  // teal-400
      '192, 132, 252', // purple-400
    ];

    particles = Array.from({ length: config.count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.2 + Math.random() * 0.4) * config.speed;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        baseX: 0,
        baseY: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.2 + Math.random() * 2.0,
        color: colors[i % colors.length],
        phase: Math.random() * Math.PI * 2,
      };
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
    drawScene();
  }

  function drawAmbientGlow() {
    const drift = prefersReduced ? 0 : time * 0.2;
    const glow1 = ctx.createRadialGradient(
      width * (0.65 + Math.sin(drift * 0.4) * 0.08),
      height * (0.38 + Math.cos(drift * 0.3) * 0.08),
      0,
      width * 0.65,
      height * 0.38,
      Math.max(width, height) * 0.52
    );
    glow1.addColorStop(0, 'rgba(56, 189, 248, 0.14)');
    glow1.addColorStop(0.5, 'rgba(129, 140, 248, 0.04)');
    glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);
  }

  function drawGridMesh() {
    const config = getParticleConfig();
    const maxDist = config.maxDist;

    // Draw connecting lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.hypot(dx, dy);

        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.26;
          ctx.strokeStyle = `rgba(${p1.color}, ${alpha})`;
          ctx.lineWidth = dist < maxDist * 0.4 ? 1.0 : 0.6;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
  }

  function updateParticles() {
    const config = getParticleConfig();

    // Lerp smooth pointer towards target on fine pointers
    if (!isTouchDevice && targetPointer.active) {
      smoothPointer.x += (targetPointer.x - smoothPointer.x) * 0.12;
      smoothPointer.y += (targetPointer.y - smoothPointer.y) * 0.12;
    }

    for (const p of particles) {
      // Mouse interaction (repulsion & elastic return)
      if (!isTouchDevice && targetPointer.active && !prefersReduced) {
        const dx = p.x - smoothPointer.x;
        const dy = p.y - smoothPointer.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0 && dist < config.mouseRadius) {
          const force = (1 - dist / config.mouseRadius) * 1.5;
          p.vx += (dx / dist) * force * 0.35;
          p.vy += (dy / dist) * force * 0.35;
        }
      }

      // Physics damping & movement
      p.vx *= 0.985;
      p.vy *= 0.985;

      // Minimum drift speed
      const curSpeed = Math.hypot(p.vx, p.vy);
      if (curSpeed < 0.15) {
        const angle = Math.random() * Math.PI * 2;
        p.vx += Math.cos(angle) * 0.05;
        p.vy += Math.sin(angle) * 0.05;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around canvas edges
      const pad = 20;
      if (p.x < -pad) p.x = width + pad;
      if (p.x > width + pad) p.x = -pad;
      if (p.y < -pad) p.y = height + pad;
      if (p.y > height + pad) p.y = -pad;
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const pulse = prefersReduced ? 1 : 0.85 + Math.sin(time * 2.2 + p.phase) * 0.15;
      const r = p.radius * pulse;

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, 0.85)`;
      ctx.shadowColor = `rgba(${p.color}, 0.6)`;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawPointerAura() {
    if (isTouchDevice || !targetPointer.active || prefersReduced) return;

    const radius = 64;
    const aura = ctx.createRadialGradient(
      smoothPointer.x,
      smoothPointer.y,
      0,
      smoothPointer.x,
      smoothPointer.y,
      radius
    );
    aura.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
    aura.addColorStop(0.6, 'rgba(129, 140, 248, 0.06)');
    aura.addColorStop(1, 'rgba(56, 189, 248, 0)');

    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(smoothPointer.x, smoothPointer.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawScene() {
    ctx.clearRect(0, 0, width, height);
    drawAmbientGlow();
    drawGridMesh();
    drawParticles();
    drawPointerAura();
  }

  function tick() {
    if (!isVisible || prefersReduced) return;
    time += 0.016;
    updateParticles();
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

  // Pointer event listeners (desktop only)
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

  // Window visibility & resize management
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
