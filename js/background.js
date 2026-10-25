/**
 * Lightweight particle field for the hero canvas.
 * - Respects prefers-reduced-motion (skips animation entirely).
 * - Scales particle count and connection radius by viewport.
 * - Pauses on visibilitychange and bfcache pagehide, resumes on pageshow.
 */
(function initBackground() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width, height, dpr;
  let particles = [];
  let rafId = null;
  let isVisible = true;

  const pointer = { x: 0.5, y: 0.5, active: false };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createParticles();
  }

  function particleCount() {
    if (width < 600) return 28;
    if (width < 1000) return 48;
    return 72;
  }

  function createParticles() {
    const count = particleCount();
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.4 + 0.4,
      hue: Math.random() > 0.5 ? '56,189,248' : '129,140,248',
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const offsetX = pointer.active ? (pointer.x - 0.5) * 18 : 0;
    const offsetY = pointer.active ? (pointer.y - 0.5) * 18 : 0;

    // Connections
    const maxDist = width < 600 ? 90 : 130;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.16;
          ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x + offsetX, a.y + offsetY);
          ctx.lineTo(b.x + offsetX, b.y + offsetY);
          ctx.stroke();
        }
      }
    }

    // Particles
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      ctx.beginPath();
      ctx.arc(p.x + offsetX, p.y + offsetY, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue},0.55)`;
      ctx.fill();
    }
  }

  function loop() {
    if (!isVisible) return;
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (rafId) cancelAnimationFrame(rafId);
    isVisible = true;
    loop();
  }

  function stop() {
    isVisible = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  // Pause when tab is hidden, resume when tab is active
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  // Pointer parallax (passive)
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX / window.innerWidth;
    pointer.y = e.clientY / window.innerHeight;
    pointer.active = true;
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    pointer.active = false;
  }, { passive: true });

  // Cleanup on page hide (bfcache) and restart on pageshow
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', (e) => {
    if (!document.hidden) start();
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 180);
  });

  resize();
  start();
})();
