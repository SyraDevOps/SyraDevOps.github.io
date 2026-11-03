/* Fundo estrelado animado (leve). Respeita "reduzir movimento". */
(function () {
  const canvas = document.querySelector("#starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, stars = [], shooting = null, nextShot = 4000, last = 0, raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(160, (w * h) / 7000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.3 + 0.2,
      s: Math.random() * 0.012 + 0.002, p: Math.random() * 6.28, v: Math.random() * 0.012 + 0.003,
      c: Math.random() < 0.18 ? "255,214,160" : Math.random() < 0.3 ? "150,225,255" : "255,255,255"
    }));
  }

  function frame(now) {
    const dt = Math.min(48, now - last); last = now;
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.p += s.s * dt;
      s.y += s.v * dt * 0.05;
      if (s.y > h + 2) { s.y = -2; s.x = Math.random() * w; }
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.p));
      ctx.fillStyle = `rgba(${s.c},${a * 0.9})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    nextShot -= dt;
    if (!shooting && nextShot <= 0) {
      shooting = { x: Math.random() * w * 0.7 + w * 0.2, y: Math.random() * h * 0.35, life: 0 };
      nextShot = 7000 + Math.random() * 9000;
    }
    if (shooting) {
      shooting.life += dt;
      const t = shooting.life / 900;
      const x = shooting.x - t * 220, y = shooting.y + t * 120;
      const g = ctx.createLinearGradient(x, y, x + 90, y - 49);
      g.addColorStop(0, `rgba(255,255,255,${1 - t})`); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = g; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 90, y - 49); ctx.stroke();
      if (t >= 1) shooting = null;
    }
    raf = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  if (still) {
    stars.forEach(s => { ctx.fillStyle = `rgba(${s.c},.7)`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); });
  } else {
    raf = requestAnimationFrame(t => { last = t; frame(t); });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
  }
})();
