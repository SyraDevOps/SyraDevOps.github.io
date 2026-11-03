/* Arte planetária do Aurora.
   1) Se existir assets/planets/<nome>.jpg (foto real, ex.: NASA), ela é usada.
   2) Senão, uma ilustração é gerada por código (ruído procedural + iluminação). */
(function () {
  const NAMES = ["mars", "venus", "earth", "phobos", "deimos"];
  const real = {};
  const cache = {};

  NAMES.forEach(name => {
    const img = new Image();
    img.onload = () => { if (img.naturalWidth > 32) { real[name] = true; delete cache[name]; } };
    img.src = `./assets/planets/${name}.jpg`;
  });

  /* ---- ruído 3D ---- */
  function h3(x, y, z, s) {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483629) ^ Math.imul(s, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  }
  const sm = t => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  function vn(x, y, z, s) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = sm(x - ix), fy = sm(y - iy), fz = sm(z - iz);
    return lerp(
      lerp(lerp(h3(ix, iy, iz, s), h3(ix + 1, iy, iz, s), fx), lerp(h3(ix, iy + 1, iz, s), h3(ix + 1, iy + 1, iz, s), fx), fy),
      lerp(lerp(h3(ix, iy, iz + 1, s), h3(ix + 1, iy, iz + 1, s), fx), lerp(h3(ix, iy + 1, iz + 1, s), h3(ix + 1, iy + 1, iz + 1, s), fx), fy),
      fz);
  }
  function fbm(x, y, z, s, oct = 5) {
    let a = 0.5, f = 1, t = 0, n = 0;
    for (let i = 0; i < oct; i++) { t += a * vn(x * f, y * f, z * f, s + i * 17); n += a; a *= 0.5; f *= 2.03; }
    return t / n;
  }
  const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const smooth = (a, b, v) => sm(clamp01((v - a) / (b - a)));

  /* ---- planetas esféricos ---- */
  const GLOW = { mars: [255, 160, 110], venus: [255, 226, 165], earth: [110, 170, 255] };
  const TILT = { mars: 0.44, venus: 0.1, earth: 0.4 };

  function planetColor(kind, px, py, pz) {
    const lat = py;
    if (kind === "mars") {
      const big = fbm(px * 1.5, py * 1.5, pz * 1.5, 3, 4);
      const det = fbm(px * 6, py * 6, pz * 6, 9, 4);
      const maria = fbm(px * 2.1 + 9, py * 2.1, pz * 2.1, 21, 4);
      let c = mix([150, 70, 40], [214, 132, 82], smooth(0.3, 0.7, big * 0.7 + det * 0.3));
      c = mix(c, [86, 52, 44], smooth(0.52, 0.66, maria) * 0.85);
      c = mix(c, [232, 170, 118], smooth(0.62, 0.8, det) * 0.35);
      const cap = smooth(0.86 + (det - 0.5) * 0.08, 0.93, Math.abs(lat));
      return mix(c, [244, 240, 234], cap);
    }
    if (kind === "venus") {
      const warp = fbm(px * 2, py * 2, pz * 2, 5, 4) * 2.2;
      const bands = 0.5 + 0.5 * Math.sin(py * 7 + warp * 3.2);
      const fine = fbm(px * 7, py * 7 + warp, pz * 7, 14, 4);
      let c = mix([205, 160, 92], [244, 222, 168], bands);
      c = mix(c, [252, 240, 205], smooth(0.5, 0.75, fine) * 0.5);
      return mix(c, [176, 128, 70], smooth(0.55, 0.8, 1 - fine) * 0.25);
    }
    /* earth */
    const land = fbm(px * 1.7 + 3, py * 1.7, pz * 1.7, 31, 5);
    const isLand = land > 0.54;
    let c;
    if (isLand) {
      const t = fbm(px * 5, py * 5, pz * 5, 41, 4);
      c = mix([64, 118, 58], [176, 150, 98], smooth(0.35, 0.7, t + Math.abs(lat) * 0.1));
    } else {
      c = mix([10, 44, 108], [28, 96, 170], smooth(0.2, 0.54, land) );
    }
    const ice = smooth(0.84, 0.92, Math.abs(lat) + (land - 0.5) * 0.1);
    c = mix(c, [240, 246, 250], ice);
    const cloud = smooth(0.52, 0.72, fbm(px * 3.2 + 7, py * 3.6, pz * 3.2, 51, 5));
    return mix(c, [250, 252, 255], cloud * 0.92);
  }

  function planetCanvas(kind, size = 360) {
    const out = document.createElement("canvas");
    out.width = out.height = size;
    const octx = out.getContext("2d");
    const R = size * 0.4, cx = size / 2, cy = size / 2;
    const [gr, gg, gb] = GLOW[kind];
    const g = octx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.25);
    g.addColorStop(0, `rgba(${gr},${gg},${gb},${kind === "venus" ? 0.6 : 0.4})`);
    g.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
    octx.fillStyle = g;
    octx.fillRect(0, 0, size, size);

    const sphere = document.createElement("canvas");
    sphere.width = sphere.height = size;
    const sctx = sphere.getContext("2d");
    const img = sctx.createImageData(size, size);
    const d = img.data;
    const L = (() => { const v = [-0.55, 0.5, 0.67]; const m = Math.hypot(...v); return v.map(x => x / m); })();
    const tilt = TILT[kind], ct = Math.cos(tilt), st = Math.sin(tilt);
    const ph = kind === "mars" ? 0.9 : kind === "earth" ? 2.2 : 0.4, cp = Math.cos(ph), sp = Math.sin(ph);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = (x - cx) / R, ny = -(y - cy) / R;
        const r2 = nx * nx + ny * ny;
        const r = Math.sqrt(r2);
        const edge = clamp01((1 - r) * R / 1.6);
        if (edge <= 0) continue;
        const nz = Math.sqrt(Math.max(0, 1 - r2));
        let px = nx * cp + nz * sp, pz = -nx * sp + nz * cp, py = ny;
        const py2 = py * ct - pz * st, pz2 = py * st + pz * ct;
        const c = planetColor(kind, px, py2, pz2);
        let diff = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
        let shade = 0.1 + 0.95 * Math.pow(diff, kind === "venus" ? 0.7 : 0.85);
        shade *= kind === "venus" ? 0.7 + 0.3 * Math.pow(nz, 0.3) : 0.55 + 0.45 * Math.pow(nz, 0.35);
        let rr = c[0] * shade, gg = c[1] * shade, bb = c[2] * shade;
        const rim = Math.pow(1 - nz, 3) * (kind === "mars" ? 0.18 : 0.42) * (0.35 + diff);
        rr += GLOW[kind][0] * rim; gg += GLOW[kind][1] * rim; bb += GLOW[kind][2] * rim;
        const i = (y * size + x) * 4;
        d[i] = Math.min(255, rr); d[i + 1] = Math.min(255, gg); d[i + 2] = Math.min(255, bb); d[i + 3] = 255 * edge;
      }
    }
    sctx.putImageData(img, 0, 0);
    octx.drawImage(sphere, 0, 0);
    return out;
  }

  /* ---- luas irregulares (Fobos e Deimos) ---- */
  const ROCK = {
    phobos: { a: 0.46, b: 0.36, rot: -0.35, base: [128, 114, 102], craters: [[-0.35, 0.12, 0.42, 1.1], [0.45, -0.3, 0.2, 0.7], [0.1, 0.45, 0.16, 0.6], [-0.1, -0.5, 0.15, 0.6]], seed: 71, n: 16 },
    deimos: { a: 0.4, b: 0.34, rot: 0.25, base: [158, 142, 122], craters: [[0.2, 0.1, 0.3, 0.5], [-0.4, -0.2, 0.2, 0.4]], seed: 83, n: 8 }
  };

  function rockCanvas(kind, size = 240) {
    const cfg = ROCK[kind];
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    const ctx = cv.getContext("2d");
    const img = ctx.createImageData(size, size);
    const d = img.data;
    const craters = cfg.craters.slice();
    let s = cfg.seed;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < cfg.n; i++) craters.push([rnd() * 1.7 - 0.85, rnd() * 1.7 - 0.85, 0.06 + rnd() * 0.1, 0.4 + rnd() * 0.4]);
    const H = (u, v) => {
      let h = fbm(u * 2.6 + 4, v * 2.6, 1.3, cfg.seed, 5) * 0.55;
      for (const [cx, cy, r, dep] of craters) {
        const dd = Math.hypot(u - cx, v - cy) / r;
        if (dd < 1) h -= dep * 0.28 * (1 - dd * dd);
        else if (dd < 1.3) h += dep * 0.1 * (1 - (dd - 1) / 0.3);
      }
      return h;
    };
    const cr = Math.cos(cfg.rot), sr = Math.sin(cfg.rot);
    const Lx = -0.5, Ly = 0.6, Lz = 0.62;
    const e = 0.012;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const X = (x - size / 2) / size, Y = (y - size / 2) / size;
        const ex = (X * cr + Y * sr) / cfg.a, ey = (-X * sr + Y * cr) / cfg.b;
        const dist = Math.hypot(ex, ey);
        const ang = Math.atan2(ey, ex);
        const lim = 1 + (vn(Math.cos(ang) * 1.6 + 5, Math.sin(ang) * 1.6 + 5, cfg.seed, 3) - 0.5) * 0.22;
        const edge = clamp01((lim - dist) * size * Math.min(cfg.a, cfg.b) / 1.6);
        if (edge <= 0) continue;
        const hx = (H(ex + e, ey) - H(ex - e, ey)) / (2 * e);
        const hy = (H(ex, ey + e) - H(ex, ey - e)) / (2 * e);
        const dome = Math.sqrt(Math.max(0, 1 - (dist / lim) ** 2));
        let nx = -hx * 0.07 - ex * 0.75, ny = -hy * 0.07 - ey * 0.75, nz = dome + 0.35;
        const m = Math.hypot(nx, ny, nz); nx /= m; ny /= m; nz /= m;
        const lx = Lx * cr + Ly * sr, ly = -Lx * sr + Ly * cr;
        const diff = Math.max(0, nx * lx + ny * ly + nz * Lz);
        const tex = 0.8 + 0.4 * fbm(ex * 9, ey * 9, 2, cfg.seed + 5, 3);
        const shade = (0.09 + 1.0 * Math.pow(diff, 0.9)) * tex;
        const i = (y * size + x) * 4;
        d[i] = Math.min(255, cfg.base[0] * shade); d[i + 1] = Math.min(255, cfg.base[1] * shade); d[i + 2] = Math.min(255, cfg.base[2] * shade); d[i + 3] = 255 * edge;
      }
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }

  function src(name) {
    if (real[name]) return `./assets/planets/${name}.jpg`;
    if (!cache[name]) {
      const cv = name === "phobos" || name === "deimos" ? rockCanvas(name) : planetCanvas(name);
      cache[name] = cv.toDataURL("image/png");
    }
    return cache[name];
  }

  window.PlanetArt = { src, isReal: name => Boolean(real[name]), names: NAMES };
  /* Pré-gera sem travar a abertura do jogo. */
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 400));
  idle(() => NAMES.forEach((n, i) => setTimeout(() => src(n), i * 80)));
})();
