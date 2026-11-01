/**
 * Interactive hero field with glowing particles, pointer ripples and moving light.
 * The scene keeps a visible still frame for reduced-motion preferences.
 */
(function initBackground() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const hero = canvas.closest('.hero');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: 0, y: 0, active: false };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let animationFrame = null;
  let time = 0;
  let visible = !document.hidden;

  function createParticles() {
    const count = width < 600 ? 26 : width < 1000 ? 44 : 64;
    const colors = ['56,189,248', '129,140,248', '45,212,191', '192,132,252'];
    particles = Array.from({ length: count }, () => {
      const direction = Math.random() * Math.PI * 2;
      const speed = 0.18 + Math.random() * 0.48;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(direction) * speed,
        vy: Math.sin(direction) * speed,
        radius: 1.15 + Math.random() * 2.15,
        phase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
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
    createParticles();
    draw();
  }

  function drawLightField() {
    const drift = prefersReduced ? 0 : time;
    const fields = [
      {
        x: width * (0.72 + Math.sin(drift * 0.32) * 0.07),
        y: height * (0.42 + Math.cos(drift * 0.24) * 0.08),
        radius: Math.max(width, height) * 0.54,
        color: '56,189,248',
      },
      {
        x: width * (0.25 + Math.cos(drift * 0.21) * 0.08),
        y: height * (0.72 + Math.sin(drift * 0.28) * 0.1),
        radius: Math.max(width, height) * 0.42,
        color: '139,92,246',
      },
    ];

    fields.forEach((field) => {
      const glow = ctx.createRadialGradient(field.x, field.y, 0, field.x, field.y, field.radius);
      glow.addColorStop(0, `rgba(${field.color},0.22)`);
      glow.addColorStop(0.38, `rgba(${field.color},0.075)`);
      glow.addColorStop(1, `rgba(${field.color},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    });

    const orbitRadius = Math.min(width, height) * 0.43;
    ctx.save();
    ctx.translate(width * 0.72, height * 0.48);
    ctx.rotate(drift * 0.08);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(125,211,252,0.12)';
    ctx.beginPath();
    ctx.ellipse(0, 0, orbitRadius * 1.12, orbitRadius * 0.76, -0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([2, 14]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(196,181,253,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 0, orbitRadius * 0.9, orbitRadius * 0.58, 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawConnections() {
    const maxDistance = width < 600 ? 128 : 190;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > maxDistance) continue;

        const alpha = (1 - distance / maxDistance) * 0.3;
        const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        gradient.addColorStop(0, `rgba(${a.color},${alpha})`);
        gradient.addColorStop(1, `rgba(${b.color},${alpha})`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = distance < maxDistance * 0.45 ? 1 : 0.65;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  function drawParticles() {
    for (const particle of particles) {
      if (!prefersReduced) {
        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < 150) {
            const force = (1 - distance / 150) * 0.028;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }
        }

        particle.vx *= 0.998;
        particle.vy *= 0.998;
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -12) particle.x = width + 12;
        if (particle.x > width + 12) particle.x = -12;
        if (particle.y < -12) particle.y = height + 12;
        if (particle.y > height + 12) particle.y = -12;
      }

      const pulse = prefersReduced ? 1 : 0.78 + Math.sin(time * 2.1 + particle.phase) * 0.22;
      const radius = particle.radius * pulse;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particle.color},0.9)`;
      ctx.shadowColor = `rgba(${particle.color},0.9)`;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawPointer() {
    if (!pointer.active || prefersReduced) return;
    const pulse = 3 + Math.sin(time * 3) * 2;
    const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 54);
    glow.addColorStop(0, 'rgba(125,211,252,0.18)');
    glow.addColorStop(1, 'rgba(125,211,252,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, 16 + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(165,243,252,0.72)';
    ctx.lineWidth = 1.25;
    ctx.shadowColor = 'rgba(56,189,248,0.8)';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    drawLightField();
    drawConnections();
    drawParticles();
    drawPointer();
  }

  function loop() {
    if (!visible || prefersReduced) return;
    time += 0.012;
    draw();
    animationFrame = requestAnimationFrame(loop);
  }

  function stop() {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  function start() {
    stop();
    visible = true;
    if (prefersReduced) {
      draw();
      return;
    }
    loop();
  }

  if (hero) {
    hero.addEventListener('pointermove', (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    }, { passive: true });

    hero.addEventListener('pointerleave', () => {
      pointer.active = false;
    }, { passive: true });
  }

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible) start();
    else stop();
  });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', () => {
    if (!document.hidden) start();
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 160);
  }, { passive: true });

  resize();
  if (!prefersReduced) start();
})();
