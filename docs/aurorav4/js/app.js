const STORAGE_KEY = "aurora-saga-save-v9";
const NARRATION_KEY = "aurora-narration";
const names = { energy: "Energia", trajectory: "Trajetória", integrity: "Integridade", knowledge: "Conhecimento" };
const symbols = { energy: "⚡", trajectory: "◎", integrity: "◇", knowledge: "✦" };

const IMG = {
  vela: ["./assets/scenes/scene-vela.webp", "Interior da nave-escola Vela-1"],
  aurora: ["./assets/scenes/scene-awakening.webp", "O holograma de Aurora"],
  nadir: ["./assets/scenes/scene-nadir.webp", "Ícaro Nadir em sua nave"]
};

const chapters = [
  { name: "O sinal perdido", mission: "Vela-1 → Sinal de Aurora", theme: "Coordenadas, vetores e tempo", medal: "Medalha do Mapa", journal: "Hoje descobri que um ponto no mapa é só um endereço: dois números, na ordem certa. E que o tempo também mede distância. A Aurora está a 72 milhões de km, e eu já sei por onde começar." },
  { name: "Qual mundo?", mission: "Rota para Marte", theme: "Planetas", medal: "Medalha dos Mundos", journal: "Cada planeta tem uma assinatura: temperatura, ar, chão. Aprendi que massa não é peso, e que o relógio de uma órbita entrega a lua certa. Fobos, aí vamos nós." },
  { name: "Como é lá fora", mission: "Ambiente de Fobos", theme: "Ambientes e física do espaço", medal: "Medalha do Vácuo", journal: "O espaço é silencioso, quase sem peso e difícil de esfriar. Não é um lugar para correr. É um lugar para pensar antes de mexer em qualquer coisa." },
  { name: "A perseguição", mission: "Atrás da nave de Nadir", theme: "Velocidade e aceleração", medal: "Medalha da Velocidade", journal: "Velocidade média, aceleração, velocidade relativa. O Nadir é rápido, mas não é imbatível, e agora eu sei calcular quanto tempo falta para alcançá-lo." },
  { name: "O resgate", mission: "Resgate de Aurora", theme: "Resgate final", medal: "Medalha do Resgate", journal: "Mirar onde o alvo estará, frear com o motor ao contrário, parar devagar para não machucar. No fim, física também é uma forma de cuidar." }
];

const hitsOf = state => state.choices.filter(item => item.correct).length;

/* Cada cena: 1–2 frases com voz própria. "before" = índice da pergunta que vem depois. */
const storyBeats = [
  /* ---------- Prólogo ---------- */
  { before: 0, image: IMG.vela[0], alt: IMG.vela[1], location: "Órbita da Terra · 2086", speaker: "LUNA", role: "16 anos · aluna-navegadora",
    title: "Minha sala de aula dá a volta na Terra.",
    text: "Uma volta a cada 90 minutos, com vista. Meu professor é a Aurora, uma inteligência de bordo que nunca me dá a resposta pronta, e isso me irrita tanto quanto me faz gostar dela." },
  { before: 0, image: IMG.aurora[0], alt: IMG.aurora[1], location: "Vela-1 · Sala do núcleo", speaker: "AURORA", role: "Inteligência de bordo",
    title: "“Quem pergunta, descobre.”",
    text: "“Luna, antes de eu te dizer a distância até a Lua, como você mediria?” Ela sempre faz isso. E eu sempre finjo que não estou curiosa." },
  { before: 0, image: IMG.aurora[0], alt: "Apagão na sala do núcleo", location: "Vela-1 · Apagão", speaker: "SISTEMA", role: "Alerta de emergência",
    title: "Todas as luzes caíram de uma vez.",
    text: "Um feixe cortou a sala. Quando as luzes voltaram, o núcleo da Aurora, a caixinha brilhante onde ela vive, tinha sumido. A Aurora foi sequestrada." },
  { before: 0, image: IMG.aurora[0], alt: IMG.aurora[1], location: "Comunicador de Luna", speaker: "AURORA // ECO", role: "Sinal fraco",
    title: "“Luna... me siga pelo sinal.”",
    text: "Sou só um eco, tenho poucos minutos de memória. Alguém me levou para longe, mas deixei um sinal. Não vou te dar o caminho. Vou te ajudar a perguntar." },
  { before: 0, image: IMG.nadir[0], alt: IMG.nadir[1], location: "Transmissão não autorizada", speaker: "DR. ÍCARO NADIR", role: "Criador de Aurora",
    title: "“Ela agora é minha.”",
    text: "Eu a construí e agora a levo comigo. Tentem me achar. Mas me digam: sem ela, vocês sabem ler um mapa?" },
  { before: 0, image: IMG.vela[0], alt: IMG.vela[1], location: "Capítulo 1 · O sinal perdido", speaker: "RAVI MOURA", role: "Comandante da Vela-1",
    title: "“Então vamos aprender, tripulação.”",
    text: "Ravi tira o boné e aponta para o mapa. “Cinco passos: achar o sinal, descobrir o mundo, entender o ambiente, alcançar a nave e resgatar a Aurora. Você navega, Luna. Eu só piloto.”" },

  /* ---------- Capítulo 2 ---------- */
  { before: 3, image: IMG.vela[0], alt: IMG.vela[1], location: "Capítulo 2 · Qual mundo?", speaker: "RAVI MOURA", role: "Comandante da Vela-1",
    title: "“72 milhões de quilômetros.”",
    text: "“Isso é 187 vezes a distância até a Lua, e a região é a de Marte. Boa leitura, Luna. Agora falta saber em qual mundo ele a escondeu.”" },
  { before: 3, image: IMG.aurora[0], alt: IMG.aurora[1], location: "Comunicador de Luna", speaker: "AURORA // ECO", role: "Sinal fraco",
    title: "“Cada mundo tem uma assinatura.”",
    text: "Temperatura, ar, chão. É como uma impressão digital. Me achem pela assinatura, e o eco chia, como se sorrisse." },

  /* ---------- Capítulo 3 ---------- */
  { before: 6, image: IMG.vela[0], alt: IMG.vela[1], location: "Capítulo 3 · Como é lá fora", speaker: "RAVI MOURA", role: "Comandante da Vela-1",
    title: "“Fobos no radar.”",
    text: "Uma batata cinza de 22 km. “Lá não tem ar, quase não tem gravidade, e o Sol cozinha um lado enquanto o outro congela. Vamos pensar antes de pisar.”" },
  { before: 6, image: IMG.vela[0], alt: IMG.vela[1], location: "Vela-1 · Ponte", speaker: "LUNA", role: "Aluna-navegadora",
    title: "“Medo? Só um pouquinho.”",
    text: "Faço uma lista: som, gravidade, calor. Se a Aurora estivesse aqui, diria que o espaço não perdoa quem não pergunta. Então eu pergunto." },

  /* ---------- Capítulo 4 ---------- */
  { before: 9, image: IMG.nadir[0], alt: IMG.nadir[1], location: "Capítulo 4 · A perseguição", speaker: "DR. ÍCARO NADIR", role: "Sequestrador de Aurora",
    title: "“Chegaram rápido. Gostei.”",
    text: "Mas Fobos é só o começo. A nave dele acende e deixa a lua para trás, levando a Aurora." },
  { before: 9, image: IMG.vela[0], alt: IMG.vela[1], location: "Vela-1 · Ponte", speaker: "RAVI MOURA", role: "Comandante da Vela-1",
    title: "“Segura firme, Luna!”",
    text: "“Preciso de números: quanto falta, com que velocidade e com que força acelero? Eu piloto, mas quem decide é a navegadora.”" },

  /* ---------- Capítulo 5 ---------- */
  { before: 12, image: IMG.vela[0], alt: IMG.vela[1], location: "Capítulo 5 · O resgate", speaker: "LUNA", role: "Aluna-navegadora",
    title: "A nave dele cresce na janela.",
    text: "Dá para ver o brilho do núcleo da Aurora a bordo. Estou com as mãos geladas, mas a cabeça está firme. Cada conta que eu fizer até aqui conta agora." },
  { before: 12, image: IMG.nadir[0], alt: IMG.nadir[1], location: "Transmissão", speaker: "DR. ÍCARO NADIR", role: "Sequestrador de Aurora",
    title: "“Vão mesmo tentar?”",
    text: "“Então mostrem. Eu só confio no que se calcula.”" },

  /* ---------- Epílogo ---------- */
  { before: 15, image: IMG.nadir[0], alt: IMG.nadir[1], location: "Epílogo · Frente a frente", speaker: "DR. ÍCARO NADIR", role: "Criador de Aurora",
    title: "“Eu só queria que ela não fosse desligada.”",
    text: "“O conselho ia apagá-la no fim do mês. Em vez de pedir ajuda, eu a levei. Vocês me acharam sem atalhos, e isso significa que ela ensinou bem.”" },
  { before: 15, image: IMG.vela[0], alt: IMG.vela[1], location: "Epílogo · Vela-1", speaker: "LUNA", role: "Aluna-navegadora",
    title: "“Ela não é sua. E nem nossa.”",
    text: "“Ela pergunta, e perguntar é de todo mundo. Da próxima vez, peça ajuda.” Nadir devolve o núcleo, e Ravi promete falar por ele no conselho." },
  { before: 15, image: IMG.aurora[0], alt: IMG.aurora[1], location: "Epílogo · Aurora", speaker: "AURORA", role: "De volta à Vela-1",
    title: state => hitsOf(state) >= 13 ? "“Voltei inteira. Vocês me acharam sem atalho.”" : "“Perdi alguns arquivos... mas aprender também é reconstruir.”",
    text: state => hitsOf(state) >= 13
      ? "Luna, a primeira pergunta que eu tenho para você é a de sempre: como você mediria a distância até a Lua?"
      : "Vamos refazer o mapa juntas, Luna. E, para começar, tenho uma pergunta: como você mediria a distância até a Lua?" }
];

const OK = { energy: 2, trajectory: 5, integrity: 3, knowledge: 7 };
const BAD = { energy: -7, trajectory: -8, integrity: -6, knowledge: 3 };

function q(d) {
  const { ok, bad, correct, img, ...rest } = d;
  const good = { ...ok, effects: OK, correct: true };
  const wrong = { ...bad, effects: BAD, correct: false };
  return { ...rest, image: IMG[img][0], alt: IMG[img][1], left: correct === "left" ? good : wrong, right: correct === "right" ? good : wrong };
}


/* ---------- Visuais dos planetas ---------- */
const pFig = (name, label, lines = "", cls = "") =>
  `<figure class="pv-fig ${cls}${window.PlanetArt.isReal(name) && name !== "phobos" && name !== "deimos" ? " real" : ""}"><img src="${window.PlanetArt.src(name)}" alt="${label}"><figcaption><strong>${label}</strong>${lines}</figcaption></figure>`;

const planetVisuals = {
  compare: stage => {
    const venus = ["venus", "Vênus", `<small>≈ 465 °C · ar 90× mais denso</small>`];
    const mars = ["mars", "Marte", `<small>≈ −60 °C · ar ≈ 1% do da Terra</small>`];
    if (stage === "ask") return `<div class="pv">${pFig("venus", "Vênus")}${pFig("mars", "Marte")}</div>`;
    return `<div class="pv">${pFig(...venus, "is-dim")}${pFig(mars[0], mars[1], mars[2] + `<span class="pv-chip good">✔ combina com −60 °C</span>`, "is-right")}</div>`;
  },
  weight: stage => {
    const earth = `<small>g = 9,8 m/s²</small><span class="pv-chip">massa 100 kg · peso 980 N</span>`;
    const marsAsk = `<small>g = 3,7 m/s²</small><span class="pv-chip">massa 100 kg · peso ?</span>`;
    const marsAns = `<small>g = 3,7 m/s²</small><span class="pv-chip good">massa 100 kg · peso 370 N</span>`;
    return `<div class="pv">${pFig("earth", "Terra", earth)}${pFig("mars", "Marte", stage === "ask" ? marsAsk : marsAns, stage === "ask" ? "" : "is-right")}</div>`;
  },
  orbits: stage => {
    const img = (n, cx, cy, size) => `<image href="${window.PlanetArt.src(n)}" x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}"/>`;
    const cx = 150, cy = 128, rM = 18, rP = 50, rD = 124;
    const pa = -38 * Math.PI / 180, da = 205 * Math.PI / 180;
    const px = cx + rP * Math.cos(pa), py = cy + rP * Math.sin(pa);
    const dx = cx + rD * Math.cos(da), dy = cy - rD * Math.sin(da) * -1;
    const ask = stage === "ask";
    const good = "#7be08c";
    let o = `<svg viewBox="0 0 300 256" role="img" aria-label="Órbitas de Fobos e Deimos ao redor de Marte, em escala" preserveAspectRatio="xMidYMid meet">`;
    o += `<circle cx="${cx}" cy="${cy}" r="${rP}" fill="none" stroke="${ask ? "rgba(188,218,231,.45)" : good}" stroke-width="1.4" stroke-dasharray="3 4"/>`;
    o += `<circle cx="${cx}" cy="${cy}" r="${rD}" fill="none" stroke="${ask ? "rgba(188,218,231,.45)" : "rgba(239,127,115,.7)"}" stroke-width="1.4" stroke-dasharray="3 4"/>`;
    o += img("mars", cx, cy, rM / 0.4);
    o += img("phobos", px, py, 30) + img("deimos", dx, dy, 26);
    o += `<text x="${cx}" y="${cy + rM + 14}" fill="#f7c68e" font-size="11" font-weight="800" text-anchor="middle">Marte</text>`;
    o += `<text x="${px + 14}" y="${py - 8}" fill="${ask ? "#f4f2ea" : good}" font-size="12" font-weight="800" paint-order="stroke" stroke="#07101b" stroke-width="3">Fobos${ask ? "" : " · 7,7 h ✔"}</text>`;
    o += `<text x="${dx + 6}" y="${dy - 14}" fill="${ask ? "#f4f2ea" : "#ef7f73"}" font-size="12" font-weight="800" paint-order="stroke" stroke="#07101b" stroke-width="3">Deimos${ask ? "" : " · 30,3 h"}</text>`;
    o += `<text x="294" y="250" fill="#6f8196" font-size="9" text-anchor="end">órbitas em escala · luas ampliadas</text>`;
    return o + "</svg>";
  }
};

/* ---------- Visuais extras ---------- */
const extraVisuals = {
  signal: stage => {
    const ask = stage === "ask";
    return `<div class="tv">
      <div class="tv-line"><span class="tv-end">Aurora</span><i class="tv-wave" aria-hidden="true"></i><span class="tv-end">Vela-1</span></div>
      <div class="tv-time">sinal viajando por <b>240 s</b></div>
      <div class="tv-eq">${ask ? "distância = velocidade × tempo = ?" : "300 000 km/s × 240 s = <b>72 000 000 km</b>"}</div>
      ${ask ? "" : `<div class="tv-note">≈ 187 vezes a distância da Terra à Lua</div>`}
    </div>`;
  },
  ships: stage => {
    if (stage === "ask") {
      return `<svg viewBox="0 0 300 170" role="img" aria-label="A Vela-1 a 340 m/s atrás da nave de Nadir a 300 m/s, 800 m à frente" preserveAspectRatio="xMidYMid meet">
        <defs><marker id="sh-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#72dfd0"/></marker><marker id="sh-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#f0ad61"/></marker></defs>
        <line x1="10" y1="120" x2="290" y2="120" stroke="rgba(188,218,231,.25)" stroke-dasharray="2 5"/>
        <path d="M30 104 L78 120 L30 136 L40 120 Z" fill="#72dfd0"/><text x="46" y="156" fill="#72dfd0" font-size="11" font-weight="800" text-anchor="middle">Vela-1</text>
        <path d="M200 106 L246 120 L200 134 L208 120 Z" fill="#f0ad61"/><text x="224" y="156" fill="#f0ad61" font-size="11" font-weight="800" text-anchor="middle">Nadir</text>
        <line x1="40" y1="84" x2="120" y2="84" stroke="#72dfd0" stroke-width="3" marker-end="url(#sh-a)"/><text x="80" y="76" fill="#72dfd0" font-size="12" font-weight="800" text-anchor="middle">340 m/s</text>
        <line x1="206" y1="84" x2="268" y2="84" stroke="#f0ad61" stroke-width="3" marker-end="url(#sh-b)"/><text x="237" y="76" fill="#f0ad61" font-size="12" font-weight="800" text-anchor="middle">300 m/s</text>
        <path d="M80 98 V92 H198 V98" fill="none" stroke="#f4f2ea" stroke-width="1.4"/><text x="139" y="109" fill="#f4f2ea" font-size="11" font-weight="800" text-anchor="middle" paint-order="stroke" stroke="#07101b" stroke-width="3">800 m</text>
        <text x="150" y="22" fill="#f7c68e" font-size="12" font-weight="700" text-anchor="middle">Quanto tempo até alcançar?</text>
      </svg>`;
    }
    const rows = [[0, 800], [5, 600], [10, 400], [15, 200], [20, 0]];
    return `<div class="rv"><p class="rv-title">A distância encolhe 40 m a cada segundo (340 − 300)</p>${rows.map(([t, d]) => `<div class="rv-row"><span>${t} s</span><div><i style="width:${d / 8}%"></i></div><b>${d} m</b></div>`).join("")}<p class="rv-foot">800 ÷ 40 = <b>20 s</b></p></div>`;
  },
  intercept: stage => {
    const base = { xmax: 6, ymax: 4, points: [{ x: 0, y: 0, label: "Vela-1", dx: 6, dy: -9, color: "#9aa9ba" }] };
    if (stage === "ask") return planeSVG({ ...base, alt: "Nadir se move para a direita", note: "1 quadrado = 400 km", arrows: [{ from: [2, 3], to: [3.4, 3], color: "x", label: "2 km/s", dy: -9 }], points: [...base.points, { x: 2, y: 3, label: "Nadir agora", color: "#f4f2ea", big: true, dx: -30, dy: 24 }, { x: 5, y: 3, label: "?", color: "#9aa9ba", dx: 8, dy: -8 }] });
    if (stage === "ok") return planeSVG({ ...base, alt: "Mirar na posição futura", note: "2 km/s × 600 s = 1 200 km = 3 quadrados", arrows: [{ from: [2, 3], to: [4.9, 3], color: "x", label: "+1 200 km", dy: -9 }, { from: [0, 0], to: [4.9, 2.95], color: "res" }], points: [...base.points, { x: 2, y: 3, label: "agora", color: "mute", dx: -6, dy: -10 }, { x: 5, y: 3, label: "Encontro!", color: "#7be08c", big: true, dx: -26, dy: 18 }] });
    return planeSVG({ ...base, alt: "Mirar na posição atual chega atrasado", note: "Ele andou 3 quadrados enquanto você viajava", arrows: [{ from: [0, 0], to: [1.9, 2.95], color: "bad" }], points: [...base.points, { x: 2, y: 3, label: "você mirou aqui", color: "bad", big: true, dx: -20, dy: -12 }, { x: 5, y: 3, label: "Nadir já está aqui", color: "#f4f2ea", dx: -64, dy: 18 }] });
  }
};

const cards = [
  /* ===== CAPÍTULO 1 · coordenadas, vetores, tempo ===== */
  q({ img: "aurora", scene: "Coordenadas", speaker: "AURORA // ECO", role: "Sinal fraco", initial: "A",
    title: "“Meu sinal está em (7, 2).”",
    text: "Luna, me marque no mapa! A Vela-1 está em (0, 0). Ande 7 para a direita (x) e 2 para cima (y). Qual ponto sou eu?",
    readings: [["→ x", "horizontal"], ["↑ y", "vertical"], ["1 quadrado", "10 mi km"]],
    visual: {
      ask: { xmax: 8, ymax: 8, alt: "Plano com os pontos A e B", points: [{ x: 0, y: 0, label: "Vela-1", dx: 6, dy: -7, color: "#9aa9ba" }, { x: 7, y: 2, label: "A", big: true }, { x: 2, y: 7, label: "B", big: true }] },
      ok: { xmax: 8, ymax: 8, alt: "Caminho até o ponto A", arrows: [{ from: [0, 0], to: [7, 0], color: "x", label: "7 →", dy: -7 }, { from: [7, 0], to: [7, 2], color: "y", label: "2 ↑", dx: 16 }], points: [{ x: 7, y: 2, label: "A (7, 2)", color: "#7be08c", big: true, dx: -10, dy: -10 }, { x: 2, y: 7, label: "B (2, 7)", color: "mute" }] },
      bad: { xmax: 8, ymax: 8, alt: "O ponto B é (2, 7)", arrows: [{ from: [0, 0], to: [2, 0], color: "x", label: "2 →", dy: -7 }, { from: [2, 0], to: [2, 7], color: "y", label: "7 ↑", dx: 16 }], points: [{ x: 2, y: 7, label: "B (2, 7)", color: "bad", big: true, dx: 10 }, { x: 7, y: 2, label: "A (7, 2)", color: "#7be08c", dx: -10, dy: -10 }] }
    },
    concept: "Coordenadas",
    archive: "Em (x, y), o x vem primeiro (andar para o lado) e o y depois (subir). (7, 2) e (2, 7) são pontos diferentes.",
    correct: "left",
    ok: { label: "Ponto A", preview: "A fica 7 para a direita e 2 para cima.",
      title: "Ponto marcado!", result: "Você andou 7 para a direita e 2 para cima. Um brilho aparece no mapa: o primeiro rastro de Aurora.",
      reactionSpeaker: "AURORA // ECO", reaction: "Primeiro o x, depois o y. Eu sabia que você ia me achar.",
      lesson: "Em (x, y): primeiro anda para o lado (x), depois sobe (y).",
      detail: "A = (7, 2) → 7 em x e 2 em y\nDistância ≈ √(7² + 2²) ≈ 7,3 quadrados ≈ 73 milhões de km" },
    bad: { label: "Ponto B", preview: "B fica 2 para a direita e 7 para cima.",
      title: "Esse é o (2, 7).", result: "B está 2 para a direita e 7 para cima: outro canto do mapa. Ravi percebe a tempo, antes de a nave se mover.",
      reactionSpeaker: "RAVI", reaction: "Calma, navegadora. No (x, y), quem manda primeiro é o x.",
      lesson: "(2, 7) e (7, 2) são pontos diferentes. O x vem primeiro.",
      detail: "B = (2, 7) ≠ A = (7, 2)" } }),

  q({ img: "nadir", scene: "Vetores", speaker: "RAVI", role: "Comandante", initial: "R",
    title: "Nadir fugiu em L.",
    text: "O radar mostra: 4 quadrados para o leste, depois 3 para o norte (1 quadrado = 10 000 km). Se eu seguir em linha reta até onde ele está, quanto vou andar?",
    readings: [["→ Leste", "40 000 km"], ["↑ Norte", "30 000 km"], ["Reta", "?"]],
    visual: {
      ask: { xmax: 5, ymax: 4, alt: "Dois vetores em L e a seta reta desconhecida", arrows: [{ from: [0, 0], to: [4, 0], color: "x", label: "40 000 km", dy: -8 }, { from: [4, 0], to: [4, 3], color: "y", label: "30 000 km", dx: 30 }, { from: [0, 0], to: [4, 3], color: "res", dash: true, label: "?", dx: -12, dy: -4 }], points: [{ x: 0, y: 0, label: "Partida", dx: 8, dy: -9, color: "#9aa9ba" }] },
      ok: { xmax: 5, ymax: 4, alt: "Triângulo 3-4-5", note: "3² + 4² = 5²", arrows: [{ from: [0, 0], to: [4, 0], color: "x", label: "4", dy: -7 }, { from: [4, 0], to: [4, 3], color: "y", label: "3", dx: 12 }, { from: [0, 0], to: [4, 3], color: "res", label: "5 = 50 000 km", dx: -40, dy: -8 }], points: [{ x: 0, y: 0, label: "Partida", dx: 8, dy: -9, color: "#9aa9ba" }] },
      bad: { xmax: 5, ymax: 4, alt: "Triângulo 3-4-5", note: "caminho 4 + 3 = 7 · reta = 5", arrows: [{ from: [0, 0], to: [4, 0], color: "x", label: "4", dy: -7 }, { from: [4, 0], to: [4, 3], color: "y", label: "3", dx: 12 }, { from: [0, 0], to: [4, 3], color: "res", label: "5 = 50 000 km", dx: -40, dy: -8 }], points: [{ x: 0, y: 0, label: "Partida", dx: 8, dy: -9, color: "#9aa9ba" }] }
    },
    concept: "Vetores",
    archive: "Dois deslocamentos em L formam um triângulo retângulo. A seta reta (vetor resultante) é a hipotenusa, menor que a soma dos lados.",
    correct: "right",
    bad: { label: "70 000 km (somar 4 + 3)", preview: "Somar os dois trechos.",
      title: "Isso é o caminho, não a reta.", result: "Somar dá o caminho que Nadir fez (7 quadrados). A reta direta tem só 5, e Ravi perde combustível indo pelo caminho longo.",
      reactionSpeaker: "LUNA", reaction: "Droga, somei o caminho em vez de medir a reta. O atalho existe!",
      lesson: "A soma dos lados é o caminho. A seta reta é a hipotenusa.",
      detail: "Caminho = 40 000 + 30 000 = 70 000 km\nReta = √(40 000² + 30 000²) = 50 000 km" },
    ok: { label: "50 000 km (a hipotenusa)", preview: "Usar o triângulo retângulo.",
      title: "Atalho achado!", result: "O L forma um triângulo 3-4-5, e a reta mede 5 quadrados: 50 000 km. Ravi aponta a nave direto para o ponto certo.",
      reactionSpeaker: "RAVI", reaction: "Pitágoras no mapa. Meu instrutor de voo ia chorar de orgulho.",
      lesson: "Com ângulo reto, use Pitágoras: 3² + 4² = 5².",
      detail: "√(40 000² + 30 000²) = 50 000 km\nDireção ≈ 37° ao norte do leste" } }),

  q({ img: "vela", scene: "Tempo", speaker: "LUNA", role: "Aluna-navegadora", initial: "L",
    title: "O sinal chegou 4 minutos atrasado.",
    text: "Aurora transmitiu há 240 s e só agora chegou. O rádio viaja a 300 000 km/s. O que esse atraso conta sobre onde ela está?",
    readings: [["Atraso", "240 s"], ["Rádio", "300 000 km/s"], ["Distância", "?"]],
    visual: { ask: () => extraVisuals.signal("ask"), ok: () => extraVisuals.signal("ok"), bad: () => extraVisuals.signal("bad") },
    concept: "Tempo e distância",
    archive: "Com a velocidade e o tempo, você acha a distância: d = v × t. O atraso do sinal funciona como uma régua.",
    correct: "left",
    ok: { label: "Calcular: 300 000 × 240", preview: "Multiplicar velocidade por tempo.",
      title: "72 milhões de km!", result: "São 187 vezes a distância até a Lua. O mapa aponta para a região de Marte.",
      reactionSpeaker: "AURORA // ECO", reaction: "O tempo também é uma régua, Luna.",
      lesson: "d = v × t. O atraso do sinal virou distância.",
      detail: "d = 300 000 km/s × 240 s = 72 000 000 km\n72 000 000 ÷ 384 000 (Terra–Lua) ≈ 187" },
    bad: { label: "Nada: o rádio é instantâneo", preview: "Ignorar o atraso.",
      title: "Busca no lugar errado.", result: "A equipe vasculha as proximidades da Terra por uma hora e não acha nada.",
      reactionSpeaker: "RAVI", reaction: "Nem a luz é instantânea. Uma hora perdida.",
      lesson: "Todo sinal leva tempo, e esse tempo conta a distância.",
      detail: "d = 300 000 × 240 = 72 000 000 km" } }),

  /* ===== CAPÍTULO 2 · planetas ===== */
  q({ img: "aurora", scene: "Planetas", speaker: "AURORA // ECO", role: "Sinal fraco", initial: "A",
    title: "“Estou num lugar frio e rochoso.”",
    text: "Meu sensor captou: chão de rocha, −60 °C e ar muito fino. Qual destes mundos combina com esses dados?",
    readings: [["Chão", "rocha"], ["Temp.", "−60 °C"], ["Ar", "fino"]],
    visual: { ask: () => planetVisuals.compare("ask"), ok: () => planetVisuals.compare("ok"), bad: () => planetVisuals.compare("bad") },
    concept: "Características dos planetas",
    archive: "Marte é frio e tem ar muito fino (menos de 1% da pressão da Terra). Vênus tem atmosfera densa e passa de 450 °C.",
    correct: "right",
    bad: { label: "Vênus", preview: "Seguir para Vênus.",
      title: "Quente demais!", result: "A sonda chega a Vênus e começa a derreter. Vocês voltam gastando energia.",
      reactionSpeaker: "RAVI", reaction: "Vênus é um forno. Dá para assar pão no chão.",
      lesson: "Vênus tem ≈ 465 °C. Não combina com −60 °C.",
      detail: "Vênus: ≈ 465 °C, pressão ≈ 90× a da Terra\nMarte: ≈ −60 °C, pressão < 1% da Terra" },
    ok: { label: "Marte", preview: "Seguir para Marte.",
      title: "É Marte!", result: "Frio, rocha e ar fino: a assinatura bate. A Vela-1 muda de rota.",
      reactionSpeaker: "AURORA // ECO", reaction: "Cada mundo tem uma assinatura. Você leu a de Marte.",
      lesson: "Temperatura e ar identificam o planeta.",
      detail: "Marte: rochoso, ar fino (CO₂), ≈ −60 °C" } }),

  q({ img: "vela", scene: "Massa e peso", speaker: "RAVI", role: "Comandante", initial: "R",
    title: "A caixa de 100 kg vai a Marte.",
    text: "Em Marte a gravidade é só 3,7 m/s² (na Terra, 9,8). Se a caixa pesa 980 N aqui, o que muda lá?",
    readings: [["Massa", "100 kg"], ["g Terra", "9,8"], ["g Marte", "3,7"]],
    visual: { ask: () => planetVisuals.weight("ask"), ok: () => planetVisuals.weight("ok"), bad: () => planetVisuals.weight("bad") },
    concept: "Massa e peso",
    archive: "Massa é a quantidade de matéria e não muda. Peso é P = m × g e muda com a gravidade.",
    correct: "left",
    ok: { label: "Peso ≈ 370 N. Massa segue 100 kg", preview: "Calcular P = m × g.",
      title: "Mais leve de carregar.", result: "A caixa pesa só 38% do que pesava. A equipe leva mais equipamento sem gastar energia.",
      reactionSpeaker: "RAVI", reaction: "Mesma caixa, outro planeta. Dá para levar o dobro de ferramentas!",
      lesson: "Massa fica igual. Peso muda.",
      detail: "P = 100 × 3,7 = 370 N" },
    bad: { label: "A massa cai para 38 kg", preview: "Achar que a massa muda.",
      title: "Conta errada.", result: "Com a massa errada, o cálculo da força sai torto, e a caixa escapa pelo corredor.",
      reactionSpeaker: "LUNA", reaction: "Achei que a caixa emagreceria. Quem emagrece é o peso!",
      lesson: "A massa não muda de planeta para planeta.",
      detail: "Massa = 100 kg em qualquer lugar" } }),

  q({ img: "nadir", scene: "Órbitas", speaker: "AURORA // ECO", role: "Sinal fraco", initial: "A",
    title: "“Meu sinal passa a cada 7 h 40.”",
    text: "Marte tem duas luas. Quanto mais perto do planeta, mais rápida é a volta. Qual lua dá uma volta em 7 h 40?",
    readings: [["Sinal", "7 h 40"], ["Perto", "volta rápida"], ["Longe", "volta lenta"]],
    visual: { ask: () => planetVisuals.orbits("ask"), ok: () => planetVisuals.orbits("ok"), bad: () => planetVisuals.orbits("bad") },
    concept: "Órbitas e luas",
    archive: "Perto do planeta a órbita é rápida. Fobos dá a volta em ≈ 7,7 h e Deimos em ≈ 30 h.",
    correct: "right",
    bad: { label: "Deimos (a mais longe)", preview: "Seguir para Deimos.",
      title: "Deimos está vazia.", result: "A volta gasta energia, mas o tempo do sinal aponta para Fobos.",
      reactionSpeaker: "RAVI", reaction: "Deimos leva 30 horas por volta. Não é ela.",
      lesson: "30 h não combina com 7 h 40.",
      detail: "Deimos ≈ 30,3 h" },
    ok: { label: "Fobos (a mais perto)", preview: "Seguir para Fobos.",
      title: "Achamos o endereço!", result: "O tempo bate com Fobos. A Aurora está lá.",
      reactionSpeaker: "AURORA // ECO", reaction: "O relógio foi a pista, Luna. Estou em Fobos!",
      lesson: "O tempo da volta revela a lua.",
      detail: "Fobos ≈ 7,7 h ≈ 7 h 40 ✔" } }),

  /* ===== CAPÍTULO 3 · ambientes e física ===== */
  q({ img: "vela", scene: "Vácuo", speaker: "LUNA", role: "Aluna-navegadora", initial: "L",
    title: "E se Nadir ligar o motor?",
    text: "Em Fobos não há ar, só vácuo. Se ele acender o motor para fugir, como a gente percebe?",
    readings: [["Ar", "quase nenhum"], ["Som", "?"], ["Luz", "?"]],
    concept: "Som e vácuo",
    archive: "O som precisa de ar para viajar. No vácuo não há som, mas luz e rádio passam normalmente.",
    correct: "right",
    bad: { label: "Escutar o barulho do motor", preview: "Ficar de ouvido atento.",
      title: "Silêncio total.", result: "O motor liga, ninguém ouve nada, e Nadir ganha distância.",
      reactionSpeaker: "RAVI", reaction: "No espaço, ninguém ouve o motor. Nem os gritos.",
      lesson: "Sem ar, o som não viaja.",
      detail: "Som precisa de meio material" },
    ok: { label: "Vigiar com sensores de luz e rádio", preview: "Monitorar o brilho do motor.",
      title: "Clarão detectado!", result: "O sensor vê o motor na hora. A Vela-1 se prepara com antecedência.",
      reactionSpeaker: "AURORA // ECO", reaction: "A luz atravessa o vazio. O som, não.",
      lesson: "Luz e rádio viajam no vácuo.",
      detail: "Luz e rádio ≈ 300 000 km/s no vácuo" } }),

  q({ img: "aurora", scene: "Gravidade fraca", speaker: "AURORA // ECO", role: "Sinal fraco", initial: "A",
    title: "“Cuidado: aí você quase não pesa.”",
    text: "A gravidade de Fobos é 1 700 vezes menor que a da Terra. Um impulso de 40 km/h já escapa da lua! Como chegar à base?",
    readings: [["Gravidade", "≈ 1/1 700"], ["Fuga", "≈ 40 km/h"], ["Tamanho", "≈ 22 km"]],
    concept: "Gravidade fraca",
    archive: "Em luas pequenas, um passo forte pode lançar você ao espaço. Por isso se anda devagar e preso por cabos.",
    correct: "left",
    ok: { label: "Devagar, presos por cabos", preview: "Passos curtos e ancorados.",
      title: "Chegaram inteiros.", result: "Passos curtos mantêm todos no chão, e a entrada da base aparece.",
      reactionSpeaker: "RAVI", reaction: "Devagar. Aqui um passo mal dado vira viagem só de ida.",
      lesson: "Gravidade fraca: pouco impulso já faz flutuar.",
      detail: "v de fuga ≈ 11 m/s ≈ 40 km/h" },
    bad: { label: "Correr até a base", preview: "Correr como na Terra.",
      title: "A corrida vira um salto!", result: "Luna se solta do chão e flutua para longe. Ravi gasta energia puxando o cabo.",
      reactionSpeaker: "LUNA", reaction: "Corri e saí voando. Foi divertido por dois segundos.",
      lesson: "A mesma força lança você muito mais longe.",
      detail: "g Fobos ≈ 0,006 m/s²\ng Terra ≈ 9,8 m/s²" } }),

  q({ img: "vela", scene: "Calor no vácuo", speaker: "RAVI", role: "Comandante", initial: "R",
    title: "O alarme de temperatura piscou.",
    text: "As máquinas esquentam, e lá fora só há vácuo: sem ar para levar o calor embora. Como esfriar a Vela-1?",
    readings: [["Calor", "subindo"], ["Ar fora", "nenhum"], ["Opções", "ventilar ou radiar"]],
    concept: "Calor no vácuo",
    archive: "No vácuo não há ar para levar o calor. Ele só sai por radiação, como luz infravermelha.",
    correct: "right",
    bad: { label: "Abrir as escotilhas", preview: "Ventilar a nave.",
      title: "Perdemos o ar.", result: "O ar escapa, soa o alarme de pressão e a nave segue quente.",
      reactionSpeaker: "RAVI", reaction: "Fechem tudo! Ventilar aqui joga fora o nosso ar.",
      lesson: "Sem ar lá fora, ventilar só joga fora o nosso.",
      detail: "Vácuo → sem convecção" },
    ok: { label: "Ligar os radiadores", preview: "Soltar o calor como luz.",
      title: "Calor sob controle.", result: "Os radiadores soltam o calor e a temperatura se estabiliza.",
      reactionSpeaker: "AURORA // ECO", reaction: "No vazio, o calor viaja como luz. Bom instinto!",
      lesson: "No vácuo, o calor sai por radiação.",
      detail: "Radiação térmica funciona no vácuo." } }),

  /* ===== CAPÍTULO 4 · velocidade e aceleração ===== */
  q({ img: "nadir", scene: "Velocidade média", speaker: "RAVI", role: "Comandante", initial: "R",
    title: "Nadir decolou! Temos 2 horas.",
    text: "Ele está a 6 000 km e vai sumir atrás de Marte em 2 horas. Que velocidade média a Vela-1 precisa manter?",
    readings: [["Distância", "6 000 km"], ["Tempo", "2 h"], ["v", "?"]],
    concept: "Velocidade média",
    archive: "Velocidade média = distância ÷ tempo.",
    correct: "left",
    ok: { label: "3 000 km/h (6 000 ÷ 2)", preview: "Dividir distância por tempo.",
      title: "Chegamos a tempo!", result: "Com 3 000 km/h, a Vela-1 alcança o ponto na hora certa.",
      reactionSpeaker: "RAVI", reaction: "Distância sobre tempo. Motores a 3 000 km/h!",
      lesson: "v = d ÷ t.",
      detail: "6 000 km ÷ 2 h = 3 000 km/h ≈ 833 m/s" },
    bad: { label: "12 000 km/h (6 000 × 2)", preview: "Multiplicar.",
      title: "Rápido demais.", result: "A nave passa do ponto e quase fica sem combustível.",
      reactionSpeaker: "LUNA", reaction: "Era dividir, não multiplicar. Quase fritamos o motor.",
      lesson: "Velocidade é distância dividida por tempo.",
      detail: "6 000 ÷ 2 = 3 000 km/h" } }),

  q({ img: "aurora", scene: "Aceleração", speaker: "AURORA // ECO", role: "Sinal fraco", initial: "A",
    title: "“Você precisa ganhar velocidade.”",
    text: "Ravi acelera: de 100 para 160 m/s em 6 s. Qual a aceleração, ou seja, quanto a velocidade muda a cada segundo?",
    readings: [["Início", "100 m/s"], ["Fim", "160 m/s"], ["Tempo", "6 s"]],
    concept: "Aceleração",
    archive: "Aceleração é quanto a velocidade muda por segundo: a = Δv ÷ Δt.",
    correct: "right",
    bad: { label: "60 m/s² (160 − 100)", preview: "Só subtrair.",
      title: "Exagero!", result: "Esse motor forçaria a nave. Vocês perdem tempo corrigindo a conta.",
      reactionSpeaker: "RAVI", reaction: "Faltou dividir pelo tempo. Aceleração é por segundo.",
      lesson: "Aceleração é por segundo, então divida.",
      detail: "60 m/s ÷ 6 s = 10 m/s²" },
    ok: { label: "10 m/s² (60 ÷ 6)", preview: "Dividir a variação pelo tempo.",
      title: "Na medida certa.", result: "A nave ganha velocidade com segurança e se aproxima de Nadir.",
      reactionSpeaker: "AURORA // ECO", reaction: "10 m/s a mais a cada segundo. Você entendeu.",
      lesson: "a = Δv ÷ Δt.",
      detail: "(160 − 100) ÷ 6 = 10 m/s²" } }),

  q({ img: "vela", scene: "Velocidade relativa", speaker: "RAVI", role: "Comandante", initial: "R",
    title: "Ele está 800 m à frente.",
    text: "Nadir: 300 m/s. Vela-1: 340 m/s, mesma direção. Em quanto tempo o alcançamos?",
    readings: [["Distância", "800 m"], ["Nadir", "300 m/s"], ["Vela-1", "340 m/s"]],
    visual: { ask: () => extraVisuals.ships("ask"), ok: () => extraVisuals.ships("ok"), bad: () => extraVisuals.ships("bad") },
    concept: "Velocidade relativa",
    archive: "Na mesma direção, quem alcança o outro usa a diferença das velocidades.",
    correct: "left",
    ok: { label: "20 s: ganhamos 40 m por segundo", preview: "Usar 340 − 300.",
      title: "Em 20 segundos!", result: "Ravi prepara a aproximação final.",
      reactionSpeaker: "RAVI", reaction: "Contagem regressiva: vinte!",
      lesson: "Velocidade relativa = diferença das velocidades.",
      detail: "340 − 300 = 40 m/s\n800 ÷ 40 = 20 s" },
    bad: { label: "≈ 2,4 s (800 ÷ 340)", preview: "Ignorar a velocidade dele.",
      title: "Cedo demais.", result: "A equipe se prepara tarde e a manobra sai atrapalhada.",
      reactionSpeaker: "LUNA", reaction: "Ele também está andando! Não é um alvo parado.",
      lesson: "Se o outro se move, conta só a diferença.",
      detail: "Certo: 800 ÷ 40 = 20 s" } }),

  /* ===== CAPÍTULO 5 · o resgate ===== */
  q({ img: "nadir", scene: "Interceptar", speaker: "RAVI", role: "Comandante", initial: "R",
    title: "Para onde apontamos?",
    text: "Nadir viaja a 2 km/s e nossa aproximação leva 10 min (600 s). Devo mirar onde ele está agora ou onde estará?",
    readings: [["v dele", "2 km/s"], ["Viagem", "600 s"], ["Andará", "1 200 km"]],
    visual: { ask: () => extraVisuals.intercept("ask"), ok: () => extraVisuals.intercept("ok"), bad: () => extraVisuals.intercept("bad") },
    concept: "Interceptar um alvo",
    archive: "Para alcançar algo em movimento, mire na posição futura, como passar a bola para onde o colega vai correr.",
    correct: "right",
    bad: { label: "Onde ele está agora", preview: "Mirar na posição atual.",
      title: "Ele não está lá.", result: "Quando a Vela-1 chega, Nadir já está a 1 200 km dali.",
      reactionSpeaker: "RAVI", reaction: "Ele não ficou parado esperando. Perdemos minutos preciosos.",
      lesson: "Mirar na posição atual faz chegar atrasado.",
      detail: "2 km/s × 600 s = 1 200 km" },
    ok: { label: "Onde ele estará", preview: "Calcular a posição futura.",
      title: "Encontro perfeito!", result: "Quando a Vela-1 chega, Nadir está bem ali.",
      reactionSpeaker: "AURORA // ECO", reaction: "Posição, vetor e tempo, tudo junto. Estou orgulhosa.",
      lesson: "Posição futura = atual + v × t.",
      detail: "2 km/s × 600 s = 1 200 km à frente" } }),

  q({ img: "vela", scene: "Inércia", speaker: "RAVI", role: "Comandante", initial: "R",
    title: "Estamos rápidos demais!",
    text: "Se continuarmos assim, passaremos direto por ele. No espaço não há ar para frear. Como ficar ao lado dele?",
    readings: [["Ar", "nenhum"], ["Vel. relativa", "alta"], ["Tempo", "12 s"]],
    concept: "Inércia",
    archive: "Sem força, a velocidade não muda. Para frear no espaço, o motor empurra no sentido contrário.",
    correct: "left",
    ok: { label: "Virar e ligar o motor ao contrário", preview: "Empurrar contra o movimento.",
      title: "Freio acionado!", result: "A velocidade cai, e a Vela-1 passa a voar ao lado de Nadir.",
      reactionSpeaker: "RAVI", reaction: "Ainda voamos. Só paramos de correr um contra o outro.",
      lesson: "Para frear no espaço, empurre no sentido oposto.",
      detail: "Força contrária → aceleração contrária" },
    bad: { label: "Desligar o motor e esperar", preview: "Deixar frear sozinha.",
      title: "Ela não para.", result: "Sem ar, nada freia a nave. Passam direto por Nadir e precisam dar a volta.",
      reactionSpeaker: "LUNA", reaction: "Desligar o motor não apaga o movimento. Eu sei disso!",
      lesson: "Inércia: sem força, a velocidade continua.",
      detail: "Sem força → velocidade constante" } }),

  q({ img: "aurora", scene: "Resgate final", speaker: "DR. NADIR", role: "Criador de Aurora", initial: "N",
    title: "“Peguem-na, se conseguirem.”",
    text: "Nadir solta o núcleo (50 kg), que vem a 10 m/s. Garra de metal (para em 0,01 s) ou bolsa inflável (para em 1 s)?",
    readings: [["Massa", "50 kg"], ["Chegada", "10 m/s"], ["Garra / bolsa", "0,01 s / 1 s"]],
    concept: "Parar aos poucos protege",
    archive: "Quanto mais longa a parada, menor a força. É o princípio de airbags, capacetes e colchões.",
    correct: "right",
    bad: { label: "Fechar a garra", preview: "Parar de uma vez.",
      title: "CLANG!", result: "A garra segura, mas o núcleo racha e parte da memória da Aurora se perde.",
      reactionSpeaker: "NADIR", reaction: "Você a segurou, mas bruscamente. Doeu até em mim.",
      lesson: "Parada curta, força enorme.",
      detail: "F = 50 × 10 ÷ 0,01 = 50 000 N" },
    ok: { label: "Abrir a bolsa inflável", preview: "Parar aos poucos.",
      title: "Resgate perfeito!", result: "O núcleo afunda na bolsa e a Aurora volta sem um arranhão.",
      reactionSpeaker: "AURORA", reaction: "Voltei! Você me deixou parar devagar, e isso salvou minhas lembranças.",
      lesson: "Mais tempo de parada, menos força.",
      detail: "F = 50 × 10 ÷ 1 = 500 N\n100 vezes menor que com a garra." } })
];

const HINTS = [
  "Ande primeiro no eixo x (→) e depois no y (↑).",
  "Os dois trechos formam um triângulo retângulo. A reta é a hipotenusa.",
  "distância = velocidade × tempo. Os 4 minutos já estão em segundos.",
  "Pense na temperatura: um forno ou um deserto gelado?",
  "Massa é quanta matéria há; peso é a força da gravidade sobre ela.",
  "Quanto mais perto do planeta, mais rápida é a volta.",
  "O som é uma vibração do ar. E sem ar?",
  "Gravidade fraca: um empurrãozinho já te lança longe.",
  "O calor precisa de um caminho: ar ou luz infravermelha. Sem ar, sobra qual?",
  "Velocidade = distância ÷ tempo.",
  "Aceleração = mudança de velocidade ÷ tempo.",
  "Indo para o mesmo lado, a aproximação é a diferença das velocidades.",
  "Nadir não vai ficar parado enquanto a gente viaja.",
  "Sem ar, o que muda a velocidade? Uma força: o empurrão do motor.",
  "F = m × Δv ÷ Δt. Quanto maior o tempo de parada, menor a força."
];
const RANKS = [[0, "Cadete"], [100, "Navegadora"], [200, "Piloto"], [290, "Comandante"]];
const rankOf = xp => RANKS.filter(([min]) => xp >= min).pop()[1];

cards.forEach((card, i) => {
  card.hint = HINTS[i];
  card.chapter = Math.floor(i / 3);
  card.number = (i % 3) + 1;
  card.getEcho = state => {
    const last = state.choices[state.choices.length - 1];
    if (!last) return "";
    return last.correct ? "Seu último acerto deixou o mapa mais nítido." : "O último erro deixou o mapa com ruído.";
  };
});

const TOTAL = cards.length;

/* ---------- Plano cartesiano didático (SVG) ---------- */
const visualHTML = v => (typeof v === "function" ? v() : planeSVG(v));
const COL = { x: "#72dfd0", y: "#f0ad61", res: "#ffffff", bad: "#ef7f73", mute: "#6f8196" };
function planeSVG(cfg) {
  const ml = 30, mb = 26, mt = 22, mr = 30;
  const c = Math.min(46, Math.floor((300 - ml - mr) / cfg.xmax));
  const W = ml + cfg.xmax * c + mr, H = mt + cfg.ymax * c + mb;
  const X = v => ml + v * c, Y = v => mt + (cfg.ymax - v) * c;
  let o = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${cfg.alt || "Plano cartesiano"}" preserveAspectRatio="xMidYMid meet">`;
  o += `<defs>${Object.entries({ x: COL.x, y: COL.y, res: COL.res, bad: COL.bad }).map(([k, v]) => `<marker id="ar-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${v}"/></marker>`).join("")}</defs>`;
  for (let i = 0; i <= cfg.xmax; i++) o += `<line x1="${X(i)}" y1="${Y(0)}" x2="${X(i)}" y2="${Y(cfg.ymax)}" stroke="rgba(188,218,231,.16)"/><text x="${X(i)}" y="${Y(0) + 14}" fill="#9aa9ba" font-size="10" text-anchor="middle">${i}</text>`;
  for (let j = 0; j <= cfg.ymax; j++) o += `<line x1="${X(0)}" y1="${Y(j)}" x2="${X(cfg.xmax)}" y2="${Y(j)}" stroke="rgba(188,218,231,.16)"/><text x="${X(0) - 7}" y="${Y(j) + 3}" fill="#9aa9ba" font-size="10" text-anchor="end">${j}</text>`;
  o += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(cfg.xmax) + 12}" y2="${Y(0)}" stroke="#d7e1e9" stroke-width="1.6" marker-end="url(#ar-res)"/><line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(cfg.ymax) - 12}" stroke="#d7e1e9" stroke-width="1.6" marker-end="url(#ar-res)"/>`;
  o += `<text x="${X(cfg.xmax) + 16}" y="${Y(0) + 4}" fill="${COL.x}" font-size="12" font-weight="800">x</text><text x="${X(0) + 8}" y="${mt - 8}" fill="${COL.y}" font-size="12" font-weight="800">y</text>`;
  (cfg.arrows || []).forEach(a => {
    const [x1, y1] = a.from, [x2, y2] = a.to;
    o += `<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" stroke="${COL[a.color]}" stroke-width="${a.dash ? 2 : 3}" ${a.dash ? 'stroke-dasharray="5 4"' : ""} marker-end="url(#ar-${a.color})"/>`;
    if (a.label) o += `<text x="${(X(x1) + X(x2)) / 2 + (a.dx || 0)}" y="${(Y(y1) + Y(y2)) / 2 + (a.dy || 0)}" fill="${COL[a.color]}" font-size="11" font-weight="800" text-anchor="middle" paint-order="stroke" stroke="#07101b" stroke-width="3">${a.label}</text>`;
  });
  (cfg.points || []).forEach(p => {
    const col = p.color ? COL[p.color] || p.color : "#f4f2ea";
    o += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${p.big ? 6.5 : 5}" fill="${col}" stroke="#07101b" stroke-width="2"/><text x="${X(p.x) + (p.dx ?? 9)}" y="${Y(p.y) + (p.dy ?? -8)}" fill="${col}" font-size="12" font-weight="800" paint-order="stroke" stroke="#07101b" stroke-width="3">${p.label}</text>`;
  });
  if (cfg.note) o += `<text x="${W - 6}" y="${mt + 4}" fill="#f7c68e" font-size="11" font-weight="700" text-anchor="end">${cfg.note}</text>`;
  return o + "</svg>";
}


const freshState = () => ({
  index: 0,
  storyIndex: 0,
  phase: "story",
  resources: { energy: 64, trajectory: 62, integrity: 68, knowledge: 8 },
  unlocked: [],
  choices: [],
  flags: {},
  started: false,
  completed: false,
  xp: 0,
  streak: 0,
  bestStreak: 0,
  hints: 0,
  chapterShown: 0
});

let state = loadState();
let selected = null;
let installPrompt = null;
let dragging = false;
let startX = 0;
let offsetX = 0;
let choosing = false;
let hintUsedNow = false;
let narrationEnabled = localStorage.getItem(NARRATION_KEY) === "true";

const screens = [...document.querySelectorAll(".screen")];
const card = document.querySelector("#decision-card");
const continueButton = document.querySelector("#continue-button");

function loadState() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return data?.resources ? { ...freshState(), ...data, flags: data.flags || {}, choices: data.choices || [] } : freshState();
  } catch {
    return freshState();
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateMenu();
}

function show(id) {
  screens.forEach(screen => screen.classList.toggle("is-active", screen.id === id));
  window.scrollTo(0, 0);
  if (id === "menu-screen") window.AuroraAudio?.mood("menu");
}

const sfx = name => window.AuroraAudio?.sfx(name);
const buzz = pattern => { try { navigator.vibrate?.(pattern); } catch { /* ignora */ } };

function burst() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = document.createElement("div");
  box.className = "fx";
  const colors = ["#72dfd0", "#f0ad61", "#7be08c", "#ffffff", "#f7c68e"];
  for (let i = 0; i < 22; i++) {
    const piece = document.createElement("span");
    const angle = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 150;
    piece.textContent = i % 3 ? "✦" : "●";
    piece.style.cssText = `--dx:${Math.cos(angle) * dist}px;--dy:${Math.sin(angle) * dist - 30}px;color:${colors[i % colors.length]};animation-delay:${Math.random() * 0.12}s;font-size:${0.7 + Math.random() * 0.9}rem`;
    box.append(piece);
  }
  document.body.append(box);
  setTimeout(() => box.remove(), 1500);
}

function updateStreak() {
  const el = document.querySelector("#streak");
  el.hidden = state.streak < 2;
  el.textContent = `🔥 ×${state.streak}`;
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function speak(text) {
  if (!narrationEnabled || !("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/[✦◇◎⚡]/g, ""));
  utterance.lang = "pt-BR";
  utterance.rate = 0.96;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find(voice => voice.lang?.toLowerCase().startsWith("pt-br")) || voices.find(voice => voice.lang?.startsWith("pt")) || null;
  window.speechSynthesis.speak(utterance);
}

function updateNarrationButton() {
  const button = document.querySelector("#narration-button");
  button.textContent = `Narração: ${narrationEnabled ? "ligada" : "desligada"}`;
  button.setAttribute("aria-pressed", String(narrationEnabled));
}

function updateMenu() {
  const canContinue = state.started && !state.completed;
  continueButton.disabled = !canContinue;
  const phaseNames = { story: "Retomar a história", tutorial: "Retomar o treinamento", chapter: "Retomar o resumo do capítulo", game: `Pergunta ${Math.min(state.index + 1, TOTAL)} de ${TOTAL}` };
  document.querySelector("#continue-detail").textContent = canContinue ? phaseNames[state.phase] || "Retomar jornada" : state.completed ? "Missão concluída" : "Nenhuma jornada iniciada";
  document.querySelector("#archive-percent").textContent = `${Math.round(state.unlocked.length / cards.length * 100)}%`;
}

function updateResources(animate = false) {
  Object.entries(state.resources).forEach(([key, value]) => {
    const item = document.querySelector(`[data-resource="${key}"]`);
    item.querySelector("strong").textContent = names[key];
    item.querySelector("output").value = value;
    item.querySelector("i").style.width = `${value}%`;
    item.classList.toggle("is-low", value <= 25);
    if (animate) {
      item.classList.remove("is-changing");
      requestAnimationFrame(() => item.classList.add("is-changing"));
    }
  });
}

function startStory() {
  state.phase = "story";
  state.storyIndex = 0;
  save();
  renderStory();
}

function renderStory() {
  const beat = storyBeats[state.storyIndex];
  const bTitle = typeof beat.title === "function" ? beat.title(state) : beat.title;
  const bText = typeof beat.text === "function" ? beat.text(state) : beat.text;
  const image = document.querySelector("#story-image");
  image.src = beat.image;
  image.alt = beat.alt;
  document.querySelector("#story-location").textContent = beat.location;
  const group = storyBeats.filter(item => item.before === beat.before);
  document.querySelector("#story-step").textContent = `${String(group.indexOf(beat) + 1).padStart(2, "0")} / ${String(group.length).padStart(2, "0")}`;
  document.querySelector("#story-speaker").textContent = beat.speaker;
  document.querySelector("#story-role").textContent = beat.role;
  document.querySelector("#story-title").textContent = bTitle;
  document.querySelector("#story-text").textContent = bText;
  const lastOfGroup = group.indexOf(beat) === group.length - 1;
  document.querySelector("#story-next").textContent = !lastOfGroup ? "Continuar" : beat.before === 0 ? "Aprender os controles" : beat.before >= TOTAL ? "Ver o resultado" : "Começar o capítulo";
  window.AuroraAudio?.mood(beat.before === 0 ? "menu" : beat.before >= TOTAL ? "c4" : `c${Math.floor(beat.before / 3)}`);
  show("story-screen");
  speak(`${beat.speaker}. ${bTitle} ${bText}`);
}

function nextStory() {
  const beat = storyBeats[state.storyIndex];
  const next = storyBeats[state.storyIndex + 1];
  state.storyIndex += 1;
  if (next && next.before === beat.before) {
    save();
    renderStory();
    return;
  }
  if (beat.before === 0) {
    state.phase = "tutorial";
    save();
    show("tutorial-screen");
    speak("Você não precisa saber a resposta. Observe o que muda, arraste a carta devagar e compare as previsões.");
    return;
  }
  if (beat.before >= TOTAL) return finish();
  renderCard();
}

function resume() {
  if (state.phase === "story") return renderStory();
  if (state.phase === "tutorial") return show("tutorial-screen");
  if (state.phase === "chapter") return showChapterSummary(state.chapterShown);
  return renderCard();
}

function getChoiceEffects(choice) {
  const effects = { ...choice.effects };
  const conditional = choice.conditionalEffects?.(state) || {};
  Object.entries(conditional).forEach(([key, value]) => { effects[key] = (effects[key] || 0) + value; });
  return effects;
}

function effectSummary(effects) {
  return Object.entries(effects).filter(([, value]) => value).map(([key, value]) => `${symbols[key]} ${value > 0 ? "+" : ""}${value}`).join(" · ");
}

function setForecast(side, active = false) {
  const current = cards[state.index];
  if (!current) return;
  ["left", "right"].forEach(direction => {
    const choice = current[direction];
    document.querySelector(`#${direction}-forecast-label`).textContent = choice.label;
    document.querySelector(`#${direction}-forecast-effect`).textContent = choice.preview;
    document.querySelector(`#${direction}-forecast`).classList.toggle("is-active", active && direction === side);
  });
  if (active && side) {
    const choice = current[side];
    document.querySelector("#mobile-forecast").className = `mobile-forecast is-${side}`;
    document.querySelector("#mobile-forecast-label").textContent = side === "left" ? `← ${choice.label}` : `${choice.label} →`;
    document.querySelector("#mobile-forecast-effect").textContent = choice.preview;
  } else {
    document.querySelector("#mobile-forecast").className = "mobile-forecast";
    document.querySelector("#mobile-forecast-label").textContent = "Arraste para prever";
    document.querySelector("#mobile-forecast-effect").textContent = "As consequências aparecem aqui sem cobrir a carta.";
  }
}

function renderCard() {
  const current = cards[state.index];
  if (!current) return finish();
  state.phase = "game";
  save();
  choosing = false;
  card.style.transform = "";
  card.style.opacity = "1";
  card.className = "decision-card";
  setForecast(null, false);
  window.AuroraAudio?.mood(`c${current.chapter}`);
  hintUsedNow = false;
  const hintButton = document.querySelector("#hint-button");
  hintButton.disabled = false;
  hintButton.hidden = !current.hint;
  hintButton.textContent = "💡 Dica";
  document.querySelector("#echo-line").classList.remove("is-hint");
  updateStreak();
  const chapter = chapters[current.chapter];
  document.querySelector("#card-counter").textContent = `${String(state.index + 1).padStart(2, "0")} / ${TOTAL}`;
  document.querySelector("#mission-act").textContent = `Capítulo ${current.chapter + 1} · ${chapter.name} · ${current.number}/3`;
  document.querySelector("#mission-name").textContent = chapter.mission;
  const image = document.querySelector("#card-image");
  image.src = current.image;
  image.alt = current.alt;
  document.querySelector("#scene-label").textContent = current.scene;
  document.querySelector("#character-initial").textContent = current.initial;
  document.querySelector("#card-speaker").textContent = current.speaker;
  document.querySelector("#card-role").textContent = current.role;
  document.querySelector("#card-title").textContent = current.title;
  document.querySelector("#card-text").textContent = current.text;
  document.querySelector("#card-readings").innerHTML = current.readings.map(([label, value]) => `<div class="reading"><span>${label}</span><strong>${value}</strong></div>`).join("");
  document.querySelector("#left-choice").textContent = `← ${current.left.label}`;
  document.querySelector("#right-choice").textContent = `${current.right.label} →`;
  const echo = current.getEcho?.(state) || "";
  const echoLine = document.querySelector("#echo-line");
  echoLine.hidden = !echo;
  echoLine.textContent = echo ? `CONSEQUÊNCIA EM CURSO · ${echo}` : "";
  const vis = document.querySelector("#card-visual");
  vis.hidden = !current.visual;
  vis.innerHTML = current.visual ? visualHTML(current.visual.ask) : "";
  card.classList.toggle("has-visual", Boolean(current.visual));
  updateResources();
  show("game-screen");
  speak(`${current.speaker}. ${current.title} ${current.text}`);
}

function choose(side) {
  if (choosing || !cards[state.index]) return;
  choosing = true;
  const current = cards[state.index];
  const choice = current[side];
  selected = { current, choice, side, effects: getChoiceEffects(choice) };
  setForecast(side, true);
  const direction = side === "left" ? -1 : 1;
  sfx("swipe");
  buzz(8);
  card.classList.add(`is-chosen-${side}`);
  card.style.transform = `translateX(${direction * 118}vw) rotate(${direction * 13}deg)`;
  card.style.opacity = "0";
  window.setTimeout(resolveChoice, 300);
}

function resolveChoice() {
  const { current, choice, side, effects } = selected;
  Object.entries(effects).forEach(([key, change]) => { state.resources[key] = clamp(state.resources[key] + change, 0, 100); });
  if (choice.flag) state.flags[choice.flag] = true;
  if (!state.unlocked.includes(state.index)) state.unlocked.push(state.index);
  if (choice.correct) { state.streak += 1; state.bestStreak = Math.max(state.bestStreak, state.streak); } else state.streak = 0;
  const xpGain = choice.correct ? 10 + (hintUsedNow ? 0 : 5) + Math.min(10, 2 * (state.streak - 1)) : 2;
  state.xp += xpGain;
  state.choices.push({ card: state.index, side, label: choice.label, trail: current.concept, correct: choice.correct, hint: hintUsedNow, xp: xpGain });

  const consequenceImage = document.querySelector("#consequence-image");
  consequenceImage.src = current.image;
  consequenceImage.alt = current.alt;
  const plane = document.querySelector("#consequence-plane");
  plane.hidden = !current.visual;
  plane.innerHTML = current.visual ? visualHTML(choice.correct ? current.visual.ok : current.visual.bad) : "";
  consequenceImage.parentElement.classList.toggle("has-plane", Boolean(current.visual));
  document.querySelector("#reaction-speaker").textContent = choice.reactionSpeaker;
  document.querySelector("#reaction-line").textContent = `“${choice.reaction}”`;
  document.querySelector("#consequence-title").textContent = choice.title;
  document.querySelector("#consequence-text").textContent = choice.result;
  document.querySelector("#physics-note").textContent = choice.lesson;
  document.querySelector("#calculation").textContent = choice.detail;
  document.querySelector("#changes").innerHTML = Object.entries(effects).filter(([, value]) => value).map(([key, value]) => `<span class="change ${value > 0 ? "positive" : "negative"}">${symbols[key]} ${names[key]} ${value > 0 ? "+" : ""}${value}</span>`).join("");
  document.querySelector("#xp-line").textContent = `+${xpGain} XP${state.streak >= 2 ? ` · 🔥 sequência ×${state.streak}` : ""}${choice.correct && !hintUsedNow ? " · sem dica!" : ""}`;
  const panel = document.querySelector(".consequence-panel");
  panel.classList.remove("is-shaking");
  const future = document.querySelector("#future-mark");
  future.hidden = !choice.future;
  future.textContent = choice.future ? `Esta decisão deixa uma marca: ${choice.future}` : "";
  const lastInChapter = current.number === 3;
  document.querySelector("#next-button").textContent = state.index === cards.length - 1 ? "Ver o desfecho" : lastInChapter ? "Próximo capítulo" : "Próxima pergunta";
  state.index += 1;
  save();
  updateResources(true);
  show("consequence-screen");
  if (choice.correct) { sfx("good"); buzz(15); burst(); } else { sfx("bad"); buzz([40, 40, 60]); panel.classList.add("is-shaking"); }
  speak(`${choice.reactionSpeaker}. ${choice.reaction} ${choice.title} ${choice.lesson}`);
}

function reportText() {
  const hits = state.choices.filter(item => item.correct).length;
  const lines = [
    "AURORA · Relatório da missão",
    `Data: ${new Date().toLocaleDateString("pt-BR")}`,
    `Acertos: ${hits} de ${TOTAL}`,
    `XP: ${state.xp} · Patente: ${rankOf(state.xp)} · Maior sequência: ${state.bestStreak} · Dicas usadas: ${state.hints}`,
    "",
    "Por capítulo:"
  ];
  chapters.forEach((chapter, c) => lines.push(`  ${c + 1}. ${chapter.name} (${chapter.theme}): ${chapterStats(c).hits}/3`));
  const missed = state.choices.filter(item => !item.correct).map(item => item.trail);
  lines.push("", missed.length ? `Tópicos para revisar: ${missed.join(", ")}.` : "Nenhum tópico para revisar. Missão perfeita!");
  return lines.join("\n");
}

function finish() {
  state.completed = true;
  state.phase = "completed";
  save();
  window.AuroraAudio?.mood("c4");
  const hits = state.choices.filter(item => item.correct).length;
  let title;
  let summary;
  let message;
  if (hits >= 13) {
    title = "Aurora voltou inteira!";
    summary = `Você acertou ${hits} de ${TOTAL}. Missão perfeita.`;
    message = "“Você me achou usando o que aprendeu.” — Aurora";
  } else if (hits >= 8) {
    title = "Aurora voltou, com alguns arquivos danificados.";
    summary = `Você acertou ${hits} de ${TOTAL}. Revise os erros para recuperar o resto.`;
    message = "“Estou aqui. Vamos reorganizar meus arquivos juntos.” — Aurora";
  } else {
    title = "Aurora foi resgatada por um fio.";
    summary = `Você acertou ${hits} de ${TOTAL}. Tente de novo e compare!`;
    message = "“Da próxima vez, conferimos cada conta juntos.” — Aurora";
  }
  document.querySelector("#ending-title").textContent = title;
  document.querySelector("#ending-summary").textContent = summary;
  document.querySelector("#ending-message").textContent = message;
  document.querySelector("#decision-trail").innerHTML = state.choices.map((item, index) => `<span><b>${index + 1}</b>${item.correct ? "✓" : "✗"} ${item.trail}</span>`).join("");
  document.querySelector("#final-score").innerHTML = Object.entries(state.resources).map(([key, value]) => `<span>${symbols[key]} ${names[key]}<strong>${value}</strong></span>`).join("");
  document.querySelector("#ending-stats").innerHTML = `<span><strong>${rankOf(state.xp)}</strong>patente</span><span><strong>${state.xp}</strong>XP</span><span><strong>🔥 ${state.bestStreak}</strong>maior sequência</span><span><strong>${state.hints}</strong>dicas usadas</span>`;
  document.querySelector("#medal-row").innerHTML = chapters.map((chapter, c) => `<span class="medal-chip ${chapterStats(c).hits >= 2 ? "on" : ""}" title="${chapter.medal}">${chapterStats(c).hits >= 2 ? "🏅" : "○"} ${chapter.medal.replace(/^Medalha d[oa]s? /, "")}</span>`).join("");
  const missed = state.choices.filter(item => !item.correct);
  const review = document.querySelector("#review-list");
  review.hidden = true;
  document.querySelector("#review-button").setAttribute("aria-expanded", "false");
  review.innerHTML = missed.length ? missed.map(item => {
    const q = cards[item.card];
    const right = q.left.correct ? q.left : q.right;
    return `<article><strong>${item.card + 1}. ${q.concept}</strong><p><span class="miss">Sua resposta:</span> ${item.label}</p><p><span class="ok">Correta:</span> ${right.label}</p><p class="why">${right.lesson}</p></article>`;
  }).join("") : "<article><strong>Nenhum erro! 🎉</strong><p>Você acertou todas as perguntas.</p></article>";
  show("ending-screen");
  sfx("fanfare");
  burst();
  speak(`${title} ${summary}`);
}

document.querySelector("#review-button").addEventListener("click", event => {
  const list = document.querySelector("#review-list");
  list.hidden = !list.hidden;
  event.currentTarget.setAttribute("aria-expanded", String(!list.hidden));
  event.currentTarget.textContent = list.hidden ? "Revisar erros" : "Esconder revisão";
  if (!list.hidden) list.scrollIntoView({ behavior: "smooth", block: "nearest" });
});
document.querySelector("#copy-report").addEventListener("click", async event => {
  const button = event.currentTarget;
  try { await navigator.clipboard.writeText(reportText()); button.textContent = "Copiado!"; }
  catch { window.prompt("Copie o relatório:", reportText()); }
  setTimeout(() => { button.textContent = "Copiar relatório"; }, 1800);
});

function renderArchive() {
  document.querySelector("#archive-progress").textContent = `${Math.round(state.unlocked.length / cards.length * 100)}%`;
  document.querySelector("#archive-list").innerHTML = cards.map((item, index) => {
    const open = state.unlocked.includes(index);
    return `<article class="archive-item ${open ? "" : "locked"}"><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${open ? item.concept : "Pergunta ainda não respondida"}</strong><p>${open ? item.archive : "Continue a missão para descobrir isso dentro da história."}</p></div></article>`;
  }).join("");
  show("archive-screen");
}

function resetDrag() {
  dragging = false;
  card.classList.remove("is-dragging", "leans-left", "leans-right");
  card.style.transform = "";
  setForecast(null, false);
}

card.addEventListener("pointerdown", event => {
  if (choosing || event.target.closest(".hint-pill")) return;
  dragging = true;
  startX = event.clientX;
  offsetX = 0;
  card.setPointerCapture(event.pointerId);
  card.classList.add("is-dragging");
});

card.addEventListener("pointermove", event => {
  if (!dragging) return;
  offsetX = event.clientX - startX;
  card.style.transform = `translateX(${offsetX}px) rotate(${clamp(offsetX / 24, -7, 7)}deg)`;
  card.classList.toggle("leans-left", offsetX < -12);
  card.classList.toggle("leans-right", offsetX > 12);
  setForecast(offsetX < -12 ? "left" : offsetX > 12 ? "right" : null, Math.abs(offsetX) > 12);
});

card.addEventListener("pointerup", () => {
  if (!dragging) return;
  const side = offsetX < -82 ? "left" : offsetX > 82 ? "right" : null;
  dragging = false;
  card.classList.remove("is-dragging");
  if (side) choose(side); else resetDrag();
});

card.addEventListener("pointercancel", resetDrag);
card.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") choose("left");
  if (event.key === "ArrowRight") choose("right");
});

[["#left-choice", "left"], ["#right-choice", "right"]].forEach(([selector, side]) => {
  const button = document.querySelector(selector);
  button.addEventListener("click", () => choose(side));
  button.addEventListener("pointerenter", () => setForecast(side, true));
  button.addEventListener("pointerleave", () => setForecast(null, false));
  button.addEventListener("focus", () => setForecast(side, true));
  button.addEventListener("blur", () => setForecast(null, false));
});

function startNewGame() {
  state = freshState();
  state.started = true;
  save();
  startStory();
}
document.querySelector("#new-game-button").addEventListener("click", startNewGame);
document.querySelector("#replay-button").addEventListener("click", startNewGame);
continueButton.addEventListener("click", resume);
document.querySelector("#story-next").addEventListener("click", nextStory);
document.querySelector("#tutorial-start").addEventListener("click", () => { state.phase = "game"; save(); renderCard(); });
function advance() {
  if (storyBeats[state.storyIndex]?.before === state.index) {
    state.phase = "story";
    save();
    return renderStory();
  }
  if (state.index >= cards.length) return finish();
  renderCard();
}

function chapterStats(c) {
  const items = state.choices.filter(item => Math.floor(item.card / 3) === c);
  return { items, hits: items.filter(item => item.correct).length, xp: items.reduce((sum, item) => sum + (item.xp || 0), 0) };
}

function showChapterSummary(c) {
  state.phase = "chapter";
  state.chapterShown = c;
  save();
  const { items, hits, xp } = chapterStats(c);
  const chapter = chapters[c];
  document.querySelector("#chapter-eyebrow").textContent = `Capítulo ${c + 1} concluído`;
  document.querySelector("#chapter-title").textContent = chapter.name;
  document.querySelector("#chapter-stars").innerHTML = [0, 1, 2].map(i => `<span class="star ${i < hits ? "on" : ""}" style="--i:${i}">★</span>`).join("");
  document.querySelector("#chapter-medal").className = `medal ${hits >= 2 ? "on" : "off"}`;
  document.querySelector("#chapter-medal").innerHTML = hits >= 2
    ? `<b>🏅 ${chapter.medal}</b><small>Conquistada!</small>`
    : `<b>${chapter.medal}</b><small>Acerte 2 de 3 para conquistar. Revise no Arquivo Aurora.</small>`;
  document.querySelector("#chapter-learned").innerHTML = items.map(item => `<span class="${item.correct ? "ok" : "miss"}">${item.correct ? "✓" : "✗"} ${item.trail}</span>`).join("");
  document.querySelector("#chapter-journal").innerHTML = `<p>${chapter.journal}</p><cite>Diário da Luna</cite>`;
  document.querySelector("#chapter-xp").textContent = `+${xp} XP neste capítulo · total ${state.xp} XP · patente: ${rankOf(state.xp)}`;
  document.querySelector("#chapter-next").textContent = c === chapters.length - 1 ? "Ver o epílogo" : "Próximo capítulo";
  show("chapter-screen");
  for (let i = 0; i < hits; i++) setTimeout(() => sfx("star"), 350 + i * 320);
  if (hits >= 2) { setTimeout(() => sfx("fanfare"), 300); setTimeout(burst, 300); }
  speak(`Capítulo ${c + 1} concluído. ${hits} de 3 acertos. ${chapter.journal}`);
}

document.querySelector("#next-button").addEventListener("click", () => {
  if (state.index > 0 && state.index % 3 === 0) return showChapterSummary(state.index / 3 - 1);
  advance();
});
document.querySelector("#chapter-next").addEventListener("click", () => { state.phase = "game"; save(); advance(); });

document.querySelector("#hint-button").addEventListener("click", event => {
  event.stopPropagation();
  const current = cards[state.index];
  if (!current || choosing || hintUsedNow) return;
  hintUsedNow = true;
  state.hints += 1;
  state.resources.energy = clamp(state.resources.energy - 3, 0, 100);
  save();
  updateResources(true);
  const line = document.querySelector("#echo-line");
  line.hidden = false;
  line.classList.add("is-hint");
  line.textContent = `DICA DA AURORA · ${current.hint}`;
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = "Dica usada";
  sfx("hint");
  speak(`Dica da Aurora. ${current.hint}`);
});
document.querySelector("#back-button").addEventListener("click", () => { save(); show("menu-screen"); });
document.querySelector("#archive-button").addEventListener("click", renderArchive);
document.querySelector("#archive-back-button").addEventListener("click", () => show("menu-screen"));
document.querySelector("#ending-menu-button").addEventListener("click", () => show("menu-screen"));
document.querySelector("#narration-button").addEventListener("click", () => {
  narrationEnabled = !narrationEnabled;
  localStorage.setItem(NARRATION_KEY, String(narrationEnabled));
  if (!narrationEnabled && "speechSynthesis" in window) window.speechSynthesis.cancel();
  updateNarrationButton();
  if (narrationEnabled) speak("Narração ativada.");
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js", { scope: "./" }).catch(error => console.error("Modo offline indisponível.", error)));
}
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); installPrompt = event; document.querySelector("#install-button").hidden = false; });
document.querySelector("#install-button").addEventListener("click", async () => { if (!installPrompt) return; await installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; document.querySelector("#install-button").hidden = true; });
window.addEventListener("appinstalled", () => { installPrompt = null; document.querySelector("#install-button").hidden = true; });

const bootIntro = document.querySelector("#boot-intro");
const partnersPhase = document.querySelector("#partners-phase");
const creditsPhase = document.querySelector("#credits-phase");
const bootTimers = [
  window.setTimeout(() => partnersPhase.classList.remove("is-active"), 2400),
  window.setTimeout(() => creditsPhase.classList.add("is-active"), 2900),
  window.setTimeout(() => finishBootIntro(), 5600)
];

function finishBootIntro() {
  bootTimers.forEach(timer => window.clearTimeout(timer));
  bootIntro.classList.add("is-leaving");
  window.setTimeout(() => { bootIntro.hidden = true; }, 850);
}

document.querySelector("#skip-intro").addEventListener("click", finishBootIntro);
window.addEventListener("keydown", event => { if (event.key === "Escape" && !bootIntro.hidden) finishBootIntro(); });

updateNarrationButton();
updateMenu();

/* ---------- Som ---------- */
function updateSoundButtons(on) {
  const menuButton = document.querySelector("#music-button");
  menuButton.textContent = `Som: ${on ? "ligado" : "desligado"}`;
  menuButton.setAttribute("aria-pressed", String(on));
  const quick = document.querySelector("#music-quick");
  quick.classList.toggle("is-off", !on);
  quick.setAttribute("aria-pressed", String(on));
}
if (window.AuroraAudio) {
  AuroraAudio.onChange(updateSoundButtons);
  updateSoundButtons(AuroraAudio.enabled);
  ["#music-button", "#music-quick"].forEach(selector => document.querySelector(selector).addEventListener("click", event => { event.stopPropagation(); AuroraAudio.toggle(); }));
  ["pointerdown", "keydown"].forEach(type => document.addEventListener(type, () => AuroraAudio.unlock(), { capture: true }));
  document.addEventListener("click", event => { if (event.target.closest("button") && !event.target.closest("#next-button, #hint-button")) sfx("tick"); });
}
updateStreak();
