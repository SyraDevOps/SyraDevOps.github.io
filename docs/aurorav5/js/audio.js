/* Trilha e sons do Aurora, gerados por código (Web Audio). Sem arquivos externos. */
(function () {
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const rng = seed => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* Cada "mood" = clima de uma parte do jogo. Acordes em notas MIDI. */
  const MOODS = {
    menu: { bar: 8, chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60, 64], [48, 52, 55, 59]], scale: [65, 67, 69, 72, 74, 77, 79, 81], sparkles: 4, vel: 0.034 },
    c0: { bar: 8, chords: [[57, 60, 64, 67, 71], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 64]], scale: [69, 72, 74, 76, 79, 81, 84], sparkles: 5, vel: 0.036 },
    c1: { bar: 9, chords: [[50, 53, 57, 60, 64], [58, 62, 65, 69], [55, 58, 62, 65, 69], [57, 62, 64, 69]], scale: [62, 65, 67, 69, 72, 74, 77, 81], sparkles: 4, vel: 0.034 },
    c2: { bar: 10, chords: [[52, 55, 59, 62, 66], [48, 55, 59, 62, 66], [55, 59, 62, 66], [50, 52, 57, 62]], scale: [64, 67, 69, 71, 74, 76, 79, 83], sparkles: 3, vel: 0.03 },
    c3: { bar: 5, chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], scale: [69, 72, 74, 76, 79, 81], arp: { steps: 10, p: 0.85 }, vel: 0.03 },
    c4: { bar: 7, chords: [[48, 55, 60, 64, 67], [47, 55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]], scale: [72, 74, 76, 79, 81, 84, 86], sparkles: 7, vel: 0.04 }
  };

  function impulse(ctx, sec = 3.4, decay = 2.6) {
    const rate = ctx.sampleRate, len = Math.floor(rate * sec), buf = ctx.createBuffer(2, len, rate);
    const r = rng(1234);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i++) { lp += ((r() * 2 - 1) - lp) * 0.3; d[i] = lp * Math.pow(1 - i / len, decay); }
    }
    return buf;
  }

  function buildEngine(ctx, out) {
    const master = ctx.createGain();
    master.gain.value = 1;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.03; comp.release.value = 0.5;
    master.connect(comp); comp.connect(out);

    const music = ctx.createGain(); music.gain.value = 0.85; music.connect(master);
    const sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);

    const verb = ctx.createConvolver(); verb.buffer = impulse(ctx);
    const verbOut = ctx.createGain(); verbOut.gain.value = 0.55; verb.connect(verbOut); verbOut.connect(master);

    const delay = ctx.createDelay(1.5); delay.delayTime.value = 0.46;
    const fb = ctx.createGain(); fb.gain.value = 0.36;
    const dlp = ctx.createBiquadFilter(); dlp.type = "lowpass"; dlp.frequency.value = 2000;
    const dOut = ctx.createGain(); dOut.gain.value = 0.5;
    delay.connect(dlp); dlp.connect(fb); fb.connect(delay); dlp.connect(dOut); dOut.connect(music); dOut.connect(verb);

    const r = rng(77);
    let mood = "menu", bar = 0, nextT = 0, started = false;

    function pad(t, dur, midi, vel, dest) {
      [["sine", 0], ["triangle", 5], ["sine", -4]].forEach(([type, det], i) => {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = mtof(midi); o.detune.value = det;
        const g = ctx.createGain(); const v = vel * (i === 1 ? 0.5 : 1);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 2.2); g.gain.setValueAtTime(v, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 2.6);
        o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 2.7);
      });
    }
    function bell(t, midi, vel, decay = 2.6, toDelay = true) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      [[1, 1], [2.01, 0.3], [3.98, 0.1]].forEach(([ratio, amp]) => {
        const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = mtof(midi) * ratio;
        const a = ctx.createGain(); a.gain.value = amp; o.connect(a); a.connect(g); o.start(t); o.stop(t + decay + 0.1);
      });
      g.connect(music); g.connect(verb); if (toDelay) g.connect(delay);
    }
    function bass(t, dur, midi, vel) {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = mtof(midi);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 1.4); g.gain.setValueAtTime(vel, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 2.2);
      o.connect(g); g.connect(music); o.start(t); o.stop(t + dur + 2.3);
    }

    function scheduleBar(t) {
      const m = MOODS[mood];
      const chord = m.chords[bar % m.chords.length];
      const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 1100; filt.Q.value = 0.4;
      filt.frequency.setValueAtTime(700, t); filt.frequency.linearRampToValueAtTime(1500, t + m.bar * 0.55); filt.frequency.linearRampToValueAtTime(800, t + m.bar + 1.5);
      const padOut = ctx.createGain(); padOut.gain.value = 1; filt.connect(padOut); padOut.connect(music); padOut.connect(verb);
      const vel = 0.5 / chord.length * 0.32;
      chord.forEach(n => pad(t, m.bar, n, vel, filt));
      bass(t, m.bar, chord[0] - 12, 0.1);
      if (m.arp) {
        const step = m.bar / m.arp.steps, pattern = [0, 1, 2, 1, 2, 3, 2, 1, 0, 2];
        for (let i = 0; i < m.arp.steps; i++) {
          if (r() < m.arp.p) bell(t + i * step, chord[pattern[i % pattern.length] % chord.length] + 12, m.vel * (i % 5 === 0 ? 1.3 : 0.85), 1.6);
        }
      } else {
        for (let i = 0; i < m.sparkles; i++) {
          const at = t + 0.6 + Math.round(r() * (m.bar - 1.2) * 2) / 2;
          bell(at, m.scale[Math.floor(r() * m.scale.length)], m.vel * (0.6 + r() * 0.7), 3);
        }
      }
      bar++;
    }

    function sfx(name, t) {
      const tone = (midi, at, vel, type = "sine", dur = 0.5, lp) => {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = mtof(midi);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(vel, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        let node = o; if (lp) { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp; o.connect(f); node = f; }
        node.connect(g); g.connect(sfxBus); g.connect(verb); o.start(at); o.stop(at + dur + 0.05);
      };
      if (name === "tick") tone(96, t, 0.03, "sine", 0.06);
      else if (name === "swipe") {
        const len = Math.floor(ctx.sampleRate * 0.28), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), rr = rng(5);
        for (let i = 0; i < len; i++) d[i] = (rr() * 2 - 1) * Math.sin(Math.PI * i / len);
        const s = ctx.createBufferSource(); s.buffer = buf;
        const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.2; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(2600, t + 0.26);
        const g = ctx.createGain(); g.gain.value = 0.07; s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t);
      } else if (name === "good") [72, 76, 79, 84].forEach((n, i) => tone(n, t + i * 0.08, 0.07, "sine", 0.9));
      else if (name === "bad") { tone(55, t, 0.1, "triangle", 0.5, 700); tone(51, t + 0.22, 0.1, "triangle", 0.7, 600); }
      else if (name === "hint") { tone(76, t, 0.05, "sine", 0.6); tone(83, t + 0.12, 0.05, "sine", 0.9); }
      else if (name === "star") tone(88, t, 0.06, "sine", 1.1);
      else if (name === "fanfare") [60, 64, 67, 72, 76, 79].forEach((n, i) => { tone(n, t + i * 0.13, 0.06, "sine", 1.8); tone(n - 12, t + i * 0.13, 0.025, "triangle", 1.8, 900); });
    }

    return {
      sfx,
      setMood(n) { if (MOODS[n]) mood = n; },
      start(t) { nextT = t; started = true; },
      pump(until) { while (started && nextT < until) { scheduleBar(nextT); nextT += MOODS[mood].bar; } },
      setMaster(v, t, ramp = 0.8) { master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(v, t + ramp); }
    };
  }

  /* ---------- Uso ao vivo ---------- */
  const KEY = "aurora-sound";
  let ctx = null, engine = null, timer = null, mood = "menu";
  const prefersOff = () => { try { return localStorage.getItem(KEY) === "off"; } catch { return false; } };
  let enabled = !prefersOff();
  const listeners = [];
  const notify = () => listeners.forEach(fn => fn(enabled));

  function ensure() {
    if (ctx || !enabled) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    engine = buildEngine(ctx, ctx.destination);
    engine.setMood(mood);
    engine.start(ctx.currentTime + 0.15);
    engine.pump(ctx.currentTime + 2);
    timer = setInterval(() => engine.pump(ctx.currentTime + 2.5), 300);
  }

  const Audio = {
    get enabled() { return enabled; },
    onChange(fn) { listeners.push(fn); },
    unlock() {
      if (!enabled) return;
      ensure();
      if (ctx && ctx.state === "suspended") ctx.resume();
      if (engine) engine.setMaster(1, ctx.currentTime, 1.2);
    },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? "on" : "off"); } catch { /* ignora */ }
      if (enabled) this.unlock();
      else if (engine) engine.setMaster(0, ctx.currentTime, 0.4);
      notify();
      return enabled;
    },
    mood(name) { mood = name; if (engine) engine.setMood(name); },
    sfx(name) { if (enabled && engine && ctx.state === "running") engine.sfx(name, ctx.currentTime + 0.01); },
    /* Renderiza uma demonstração (usada só para teste/exportação). */
    async renderDemo(segments, seconds, rate = 32000, extra = []) {
      const off = new OfflineAudioContext(2, Math.floor(rate * seconds), rate);
      const eng = buildEngine(off, off.destination);
      eng.start(0);
      let t = 0;
      segments.forEach(([name, len]) => { eng.setMood(name); eng.pump(t + len); t += len; });
      extra.forEach(([name, at]) => eng.sfx(name, at));
      return off.startRendering();
    }
  };
  window.AuroraAudio = Audio;

  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (enabled) ctx.resume();
  });
})();
