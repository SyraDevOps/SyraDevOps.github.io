const STORAGE_KEY = "aurora-prologue-save-v5";
const NARRATION_KEY = "aurora-narration";
const names = { energy: "Energia", trajectory: "Trajetória", integrity: "Integridade", knowledge: "Conhecimento" };
const symbols = { energy: "⚡", trajectory: "◎", integrity: "◇", knowledge: "✦" };

const storyBeats = [
  {
    image: "./assets/scenes/scene-vela.webp",
    alt: "Luna e Ravi dentro da nave-escola Vela-1 em órbita da Terra",
    location: "Órbita da Terra · 18 de maio de 2086",
    speaker: "LUNA AZEVEDO",
    role: "16 anos · aluna-navegadora",
    title: "Era para ser apenas uma aula.",
    text: "Na Vela-1, estudantes aprendiam a observar a Terra usando instrumentos reais. Eu era a pessoa que insistia em conservar os velhos controles manuais — mesmo quando Aurora podia calcular tudo em um segundo."
  },
  {
    image: "./assets/scenes/scene-awakening.webp",
    alt: "O holograma de Aurora conversa com Luna na sala do núcleo",
    location: "Vela-1 · Sala do núcleo",
    speaker: "AURORA",
    role: "Inteligência de observação científica",
    title: "“Uma resposta não é uma descoberta.”",
    text: "Aurora não era só um banco de dados. Ela nos fazia perguntas. Naquela manhã, pediu que eu calculasse uma órbita sem ajuda. Antes que eu terminasse, todas as luzes se apagaram."
  },
  {
    image: "./assets/scenes/scene-awakening.webp",
    alt: "O núcleo de Aurora é arrancado da nave durante um apagão",
    location: "Vela-1 · Falha total",
    speaker: "SISTEMA",
    role: "Alerta de emergência",
    title: "O céu ficou mudo.",
    text: "Um feixe atravessou a sala e arrancou o núcleo de Aurora. Mapas, previsões e arquivos astronômicos desapareceram das telas. Restou apenas um pequeno eco da IA no meu comunicador."
  },
  {
    image: "./assets/scenes/scene-nadir.webp",
    alt: "Ícaro Nadir transmite uma mensagem de sua nave",
    location: "Transmissão não autorizada",
    speaker: "DR. ÍCARO NADIR",
    role: "Criador desaparecido de Aurora",
    title: "“Eu não roubei o conhecimento. Roubei o atalho.”",
    text: "Nadir ajudou a criar Aurora e depois abandonou o projeto. Ele acredita que respostas automáticas tornaram a humanidade incapaz de observar. Para recuperar o núcleo, teremos de persegui-lo sem os mapas que ele mesmo construiu."
  },
  {
    image: "./assets/scenes/scene-vela.webp",
    alt: "Luna assume os controles manuais da Vela-1 enquanto Ravi observa",
    location: "Ponte da Vela-1 · 06:42 UTC",
    speaker: "RAVI MOURA",
    role: "Comandante da Vela-1",
    title: "“Luna, os controles antigos são nossos olhos agora.”",
    text: "Uma cápsula contendo o núcleo passa diante da nave. Ravi me entrega a navegação manual. Se eu interpretar os sinais corretamente, salvamos Aurora. Se errar, minhas decisões continuarão viajando conosco."
  }
];

const cards = [
  {
    image: "./assets/scenes/scene-vela.webp",
    alt: "Luna observa uma cápsula brilhante se aproximando pela janela da Vela-1",
    scene: "A cápsula cresce na janela",
    speaker: "RAVI MOURA",
    role: "Comandante da Vela-1",
    initial: "R",
    title: "“Luna... ela está ficando maior.”",
    text: "O radar sumiu. Ravi aponta para duas anotações no vidro: há vinte segundos a cápsula estava mais longe. Agora ela está mais perto — e continua vindo.",
    readings: [["Antes", "42 km"], ["Agora", "38,8 km"], ["O que vemos", "mais perto"]],
    concept: "Velocidade relativa",
    archive: "Comparar duas distâncias em instantes diferentes revela o movimento relativo. Se a separação diminui, os objetos estão se aproximando, mesmo quando parecem parados.",
    left: {
      label: "Correr em direção à cápsula",
      preview: "Ela chega mais depressa, mas pode vir rápido demais para desviar · ⚡ −8 · ◎ −13 · ◇ −8",
      effects: { energy: -8, trajectory: -13, integrity: -8, knowledge: 6 },
      flag: "antennaBent",
      trail: "Correu em direção ao alvo",
      title: "A pequena luz vira uma parede.",
      result: "A cápsula já vinha na direção da Vela-1. Quando você acelera, ela cresce de repente diante do vidro. Ravi desvia por poucos metros; uma antena raspa no casco e entorta.",
      reactionSpeaker: "RAVI",
      reaction: "Ela já vinha até nós. Nós corremos na direção de algo que estava vindo.",
      lesson: "Quando a distância diminui a cada medida, os objetos estão se aproximando. Comparar o antes e o agora revelou o movimento que os olhos não perceberam.",
      detail: "Δd = 38,8 − 42,0 = −3,2 km\n3 200 m ÷ 20 s = 160 m/s de aproximação",
      future: "A antena de telemetria foi danificada. Essa escolha voltará mais tarde."
    },
    right: {
      label: "Manter distância e olhar de novo",
      preview: "Você perde alguns segundos, mas descobre com segurança para onde ela está indo · ⚡ −5 · ◎ +12 · ✦ +10",
      effects: { energy: -5, trajectory: 12, integrity: 4, knowledge: 10 },
      flag: "measuredApproach",
      trail: "Observou antes de agir",
      title: "A cápsula deixa de crescer no vidro.",
      result: "Você mantém espaço e compara outra medida. A cápsula realmente vinha na direção da nave. Com um pequeno recuo, Ravi deixa os dois veículos viajando quase lado a lado.",
      reactionSpeaker: "AURORA // ECO",
      reaction: "Você não precisou adivinhar. Apenas viu o que mudou.",
      lesson: "O nome disso é velocidade relativa: observar se a distância entre dois objetos aumenta ou diminui. Primeiro você percebeu o efeito; o nome veio depois.",
      detail: "Δd = −3,2 km em 20 s\nO sinal negativo mostra que a separação estava diminuindo.",
      future: "Ravi passa a confiar mais nas suas leituras manuais."
    }
  },
  {
    image: "./assets/scenes/scene-awakening.webp",
    alt: "Luna usa controles manuais enquanto o eco holográfico de Aurora aponta vetores",
    scene: "Motores desligados · nave ainda em movimento",
    speaker: "AURORA // ECO",
    role: "Fragmento local · memória instável",
    initial: "A",
    title: "“Desliguei os motores. Por que não paramos?”",
    text: "A Vela-1 continua deslizando em direção à cápsula. Sem ar e sem chão para segurar a nave, desligar o motor não muda o movimento que ela já tinha.",
    readings: [["Motores", "desligados"], ["A nave", "ainda avança"], ["Tempo para agir", "12 s"]],
    concept: "Força, aceleração e inércia",
    archive: "No espaço, desligar motores não interrompe o movimento. Para reduzir a velocidade, a nave precisa produzir uma força no sentido oposto.",
    getEcho: state => state.flags.antennaBent ? "A antena que você entortou pisca. Ravi agora precisa confiar no que Luna vê pela janela." : "Sua observação anterior deu a Ravi tempo para preparar os motores.",
    left: {
      label: "Esperar: sem motor ela vai parar",
      preview: "Nada empurra a nave para trás; ela continua avançando · ◎ −14 · ◇ −5",
      effects: { energy: -2, trajectory: -14, integrity: -5, knowledge: 7 },
      flag: "overshoot",
      trail: "Esperou a nave parar sozinha",
      title: "A nave não para. A cápsula passa sob nossos pés.",
      result: "Os segundos acabam e nada reduz o movimento. A Vela-1 ultrapassa a cápsula, porque no espaço não existe ar suficiente para freá-la sozinha.",
      reactionSpeaker: "LUNA",
      reaction: "Desligar o motor não apaga o movimento que a nave já tinha.",
      lesson: "Um objeto em movimento tende a continuar em movimento. Para mudar isso, alguma força precisa agir. No espaço, esperar não funciona como pisar no freio de um carro.",
      detail: "Sem uma força contrária, a velocidade continua.\nEsse comportamento é chamado de inércia.",
      future: "A ultrapassagem aumentou a distância da captura final."
    },
    right: {
      label: "Virar a nave e empurrar ao contrário",
      preview: "O motor passa a empurrar contra o movimento e reduz a aproximação · ⚡ −8 · ◎ +14 · ◇ +5",
      effects: { energy: -8, trajectory: 14, integrity: 5, knowledge: 12 },
      flag: "matchedVelocity",
      trail: "Empurrou contra o movimento",
      title: "O motor ruge para um lado. A nave seguia para o outro.",
      result: "Ravi vira a Vela-1 e acende o motor contra o movimento. A cápsula deixa de atravessar a janela e passa a flutuar quase parada diante de Luna.",
      reactionSpeaker: "RAVI",
      reaction: "Nós ainda estamos voando. Só deixamos de correr um contra o outro.",
      lesson: "Para diminuir a velocidade, o motor precisou empurrar no sentido contrário. A nave não parou no espaço; apenas passou a acompanhar a cápsula.",
      detail: "Movimento orbital continua.\nVelocidade relativa: 80 m/s → aproximadamente 10 m/s.",
      future: "A captura final exigirá menos correção de trajetória."
    }
  },
  {
    image: "./assets/scenes/scene-vela.webp",
    alt: "A Vela-1 cruza a luz do Sol enquanto Luna ajusta seus painéis",
    scene: "Luz solar direta · alerta de calor",
    speaker: "RAVI MOURA",
    role: "Comandante da Vela-1",
    initial: "R",
    title: "O Sol acende dois sinais: bateria vazia e painel quente.",
    text: "Ravi pode apontar os painéis diretamente para a luz e carregar depressa. Mas o metal já está quente o bastante para fazer o alarme piscar.",
    readings: [["Bateria", "quase vazia"], ["Painel", "muito quente"], ["Captura", "se aproximando"]],
    concept: "Potência, luz e aquecimento",
    archive: "Mais luz por segundo aumenta a potência recebida, mas também o aquecimento. Inclinar uma superfície reduz a área efetivamente exposta à luz.",
    getEcho: state => state.flags.antennaBent ? "Consequência anterior: a antena danificada faz o alerta de calor chegar atrasado." : state.flags.measuredApproach ? "Como você evitou a colisão, os sensores mostram o calor sem falhas." : "O alerta oscila.",
    left: {
      label: "Carregar o máximo possível",
      preview: "A bateria enche depressa, mas o painel recebe ainda mais luz e calor · ⚡ +20 · ◇ −15",
      effects: { energy: 20, trajectory: 1, integrity: -15, knowledge: 9 },
      conditionalEffects: state => state.flags.antennaBent ? { integrity: -5 } : {},
      flag: "panelsHot",
      trail: "Aceitou o calor para carregar rápido",
      title: "A bateria ganha vida. O painel começa a queimar.",
      result: "Toda a superfície fica de frente para o Sol. A recarga dispara, mas a mesma luz também aquece o painel até seu revestimento escurecer.",
      reactionSpeaker: "AURORA // ECO",
      reaction: "A luz não escolhe virar apenas eletricidade. Parte dela sempre vira calor.",
      lesson: "Mais luz chegando a cada segundo significa mais potência. Isso recarrega a bateria mais rápido, mas também aquece o material.",
      detail: "Painel de frente: área efetiva máxima → potência máxima\nMais potência recebida → mais recarga e mais aquecimento.",
      future: "Os painéis superaquecidos reduzirão a reserva durante a captura."
    },
    right: {
      label: "Inclinar e carregar mais devagar",
      preview: "Menos luz atinge o painel; a carga demora, mas o calor diminui · ⚡ +10 · ◇ +10",
      effects: { energy: 10, trajectory: -1, integrity: 10, knowledge: 12 },
      flag: "panelsSafe",
      trail: "Protegeu o painel e carregou devagar",
      title: "O painel sai da luz direta. O alarme se cala.",
      result: "Inclinado, o painel recebe menos luz. A bateria sobe devagar, mas a temperatura cai e deixa energia suficiente para uma tentativa.",
      reactionSpeaker: "RAVI",
      reaction: "Às vezes, o melhor não é receber o máximo. É receber o bastante.",
      lesson: "Inclinar o painel faz menos luz atingi-lo diretamente. Ele produz menos eletricidade por segundo, mas também esquenta menos.",
      detail: "Potência recebida ∝ cos(ângulo)\ncos(60°) = 0,5 → cerca de metade da potência máxima.",
      future: "O sistema térmico permanecerá estável na manobra final."
    }
  },
  {
    image: "./assets/scenes/scene-nadir.webp",
    alt: "Ícaro Nadir observa a tentativa de captura do núcleo de Aurora",
    scene: "Captura final · sete segundos para o impacto",
    speaker: "DR. ÍCARO NADIR",
    role: "Criador de Aurora · antagonista",
    initial: "N",
    title: "Aurora está a segundos de bater na nave.",
    text: "Ravi oferece duas formas de capturá-la: fechar a garra metálica de uma vez ou abrir a bolsa inflável de resgate, que amortece a cápsula aos poucos.",
    readings: [["Até o impacto", "7 s"], ["Garra", "para na hora"], ["Bolsa", "amortece aos poucos"]],
    concept: "Por que amortecer protege",
    archive: "Uma parada mais demorada produz um tranco menor. É por isso que airbags, colchões, capacetes e embalagens macias ajudam a proteger pessoas e objetos.",
    getEcho: state => {
      const echoes = [];
      if (state.flags.overshoot) echoes.push("Como você esperou a nave parar, agora a cápsula chega por um ângulo mais difícil.");
      if (state.flags.panelsHot) echoes.push("O painel superaquecido cortou parte da energia da bolsa inflável.");
      if (state.flags.matchedVelocity) echoes.push("Como você empurrou contra o movimento, a cápsula chega mais devagar.");
      return echoes.join(" ") || "Suas escolhas mantiveram a janela de captura estável.";
    },
    left: {
      label: "Fechar a garra de uma vez",
      preview: "A garra captura imediatamente, mas todo o tranco chega ao núcleo · ◇ −24 · ◎ +4",
      effects: { energy: -3, trajectory: 4, integrity: -24, knowledge: 9 },
      flag: "hardCapture",
      trail: "Parou Aurora de uma vez",
      title: "CLANG. A garra segura — e a nave inteira treme.",
      result: "A cápsula para de uma vez. O braço metálico entorta, Luna é jogada contra o cinto e uma rachadura luminosa aparece no núcleo de Aurora.",
      reactionSpeaker: "NADIR",
      reaction: "Você a segurou. Mas fez todo o movimento desaparecer num único instante.",
      lesson: "Parar algo de uma vez produz um tranco maior. É por isso que cair no chão duro machuca mais do que cair sobre algo que afunda e amortece.",
      detail: "Parada em pouco tempo → tranco maior\nParada espalhada por mais tempo → tranco menor",
      future: "O núcleo foi recuperado, mas parte da memória de Aurora ficou fragmentada."
    },
    right: {
      label: "Abrir a bolsa inflável de resgate",
      preview: "Ela cede e amortece a cápsula por mais tempo, reduzindo o tranco · ⚡ −8 · ◎ +9 · ◇ +14",
      effects: { energy: -8, trajectory: 9, integrity: 14, knowledge: 15 },
      conditionalEffects: state => state.flags.panelsHot ? { energy: -5, integrity: -4 } : state.flags.overshoot ? { energy: -3, trajectory: -4 } : {},
      flag: "softCapture",
      trail: "Amorteceu Aurora aos poucos",
      title: "A bolsa se abre como uma flor diante do vidro.",
      result: "A cápsula afunda no material inflável e perde velocidade aos poucos. Em vez de um estrondo, Luna sente apenas uma longa e suave puxada.",
      reactionSpeaker: "AURORA",
      reaction: "Estou aqui. Você não impediu o movimento de uma vez; deixou que ele terminasse devagar.",
      lesson: "A bolsa aumentou o tempo da parada e diminuiu o tranco. Airbags, colchões e capacetes protegem pelo mesmo princípio.",
      detail: "A cápsula precisou perder o mesmo movimento.\nComo isso aconteceu durante mais tempo, a força ficou menor.",
      future: "O núcleo de Aurora foi recuperado sem sofrer uma parada destrutiva."
    }
  }
];

const freshState = () => ({
  index: 0,
  storyIndex: 0,
  phase: "story",
  resources: { energy: 64, trajectory: 62, integrity: 68, knowledge: 8 },
  unlocked: [],
  choices: [],
  flags: {},
  started: false,
  completed: false
});

let state = loadState();
let selected = null;
let installPrompt = null;
let dragging = false;
let startX = 0;
let offsetX = 0;
let choosing = false;
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
  const phaseNames = { story: "Retomar o prólogo", tutorial: "Retomar o treinamento", game: `Decisão ${Math.min(state.index + 1, 4)} de 4` };
  document.querySelector("#continue-detail").textContent = canContinue ? phaseNames[state.phase] || "Retomar jornada" : state.completed ? "Prólogo concluído" : "Nenhuma jornada iniciada";
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
  state.storyIndex = clamp(state.storyIndex, 0, storyBeats.length - 1);
  save();
  renderStory();
}

function renderStory() {
  const beat = storyBeats[state.storyIndex];
  const image = document.querySelector("#story-image");
  image.src = beat.image;
  image.alt = beat.alt;
  document.querySelector("#story-location").textContent = beat.location;
  document.querySelector("#story-step").textContent = `${String(state.storyIndex + 1).padStart(2, "0")} / ${String(storyBeats.length).padStart(2, "0")}`;
  document.querySelector("#story-speaker").textContent = beat.speaker;
  document.querySelector("#story-role").textContent = beat.role;
  document.querySelector("#story-title").textContent = beat.title;
  document.querySelector("#story-text").textContent = beat.text;
  document.querySelector("#story-next").textContent = state.storyIndex === storyBeats.length - 1 ? "Aprender os controles" : "Continuar";
  show("story-screen");
  speak(`${beat.speaker}. ${beat.title} ${beat.text}`);
}

function nextStory() {
  if (state.storyIndex < storyBeats.length - 1) {
    state.storyIndex += 1;
    save();
    renderStory();
    return;
  }
  state.phase = "tutorial";
  save();
  show("tutorial-screen");
  speak("Você não precisa saber a resposta. Observe o que muda, arraste a carta devagar e compare as previsões.");
}

function resume() {
  if (state.phase === "story") return renderStory();
  if (state.phase === "tutorial") return show("tutorial-screen");
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
  document.querySelector("#card-counter").textContent = `${String(state.index + 1).padStart(2, "0")} / 04`;
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
  card.classList.add(`is-chosen-${side}`);
  card.style.transform = `translateX(${direction * 118}vw) rotate(${direction * 13}deg)`;
  card.style.opacity = "0";
  window.setTimeout(resolveChoice, 300);
}

function resolveChoice() {
  const { current, choice, side, effects } = selected;
  Object.entries(effects).forEach(([key, change]) => { state.resources[key] = clamp(state.resources[key] + change, 0, 100); });
  state.flags[choice.flag] = true;
  if (!state.unlocked.includes(state.index)) state.unlocked.push(state.index);
  state.choices.push({ card: state.index, side, label: choice.label, trail: choice.trail });

  const consequenceImage = document.querySelector("#consequence-image");
  consequenceImage.src = current.image;
  consequenceImage.alt = current.alt;
  document.querySelector("#reaction-speaker").textContent = choice.reactionSpeaker;
  document.querySelector("#reaction-line").textContent = `“${choice.reaction}”`;
  document.querySelector("#consequence-title").textContent = choice.title;
  document.querySelector("#consequence-text").textContent = choice.result;
  document.querySelector("#physics-note").textContent = choice.lesson;
  document.querySelector("#calculation").textContent = choice.detail;
  document.querySelector("#changes").innerHTML = Object.entries(effects).filter(([, value]) => value).map(([key, value]) => `<span class="change ${value > 0 ? "positive" : "negative"}">${symbols[key]} ${names[key]} ${value > 0 ? "+" : ""}${value}</span>`).join("");
  const future = document.querySelector("#future-mark");
  future.hidden = !choice.future;
  future.textContent = choice.future ? `Esta decisão deixa uma marca: ${choice.future}` : "";
  document.querySelector("#next-button").textContent = state.index === cards.length - 1 ? "Ver o desfecho" : "Continuar a perseguição";
  state.index += 1;
  save();
  updateResources(true);
  show("consequence-screen");
  speak(`${choice.reactionSpeaker}. ${choice.reaction} ${choice.title} ${choice.lesson}`);
}

function finish() {
  state.completed = true;
  state.phase = "completed";
  save();
  const strongRun = state.flags.softCapture && state.resources.integrity >= 60 && state.resources.trajectory >= 60;
  const damaged = state.flags.hardCapture || state.resources.integrity < 45;
  let title;
  let summary;
  if (strongRun) {
    title = "Aurora voltou inteira. Nadir não esperava isso.";
    summary = "Você recuperou o núcleo, preservou a Vela-1 e transformou quatro observações em decisões. Luna deixa de ser apenas aluna: Ravi entrega a ela o posto de navegadora da perseguição.";
  } else if (damaged) {
    title = "Aurora voltou — mas algumas estrelas desapareceram.";
    summary = "O núcleo foi recuperado com danos. Parte do arquivo celeste se fragmentou, e as marcas das suas decisões continuarão no próximo trecho da perseguição.";
  } else {
    title = "Aurora voltou. A Vela-1 pagou o preço.";
    summary = "A missão teve sucesso, mas energia, rota ou integridade ficaram no limite. A física não entregou uma escolha perfeita; ela revelou o custo de cada caminho.";
  }
  document.querySelector("#ending-title").textContent = title;
  document.querySelector("#ending-summary").textContent = summary;
  document.querySelector("#ending-message").textContent = "“Agora você entende meu desafio, Luna. Saber uma fórmula é fácil. Difícil é decidir quando o Universo não mostra todas as respostas.” — Ícaro Nadir";
  document.querySelector("#decision-trail").innerHTML = state.choices.map((item, index) => `<span><b>${index + 1}</b>${item.trail}</span>`).join("");
  document.querySelector("#final-score").innerHTML = Object.entries(state.resources).map(([key, value]) => `<span>${symbols[key]} ${names[key]}<strong>${value}</strong></span>`).join("");
  show("ending-screen");
  speak(`${title} ${summary} Agora você entende meu desafio, Luna.`);
}

function renderArchive() {
  document.querySelector("#archive-progress").textContent = `${Math.round(state.unlocked.length / cards.length * 100)}%`;
  document.querySelector("#archive-list").innerHTML = cards.map((item, index) => {
    const open = state.unlocked.includes(index);
    return `<article class="archive-item ${open ? "" : "locked"}"><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${open ? item.concept : "Sinal ainda não compreendido"}</strong><p>${open ? item.archive : "Continue a perseguição para descobrir isso dentro da história."}</p></div></article>`;
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
  if (choosing) return;
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

document.querySelector("#new-game-button").addEventListener("click", () => {
  state = freshState();
  state.started = true;
  save();
  startStory();
});
continueButton.addEventListener("click", resume);
document.querySelector("#story-next").addEventListener("click", nextStory);
document.querySelector("#tutorial-start").addEventListener("click", () => { state.phase = "game"; save(); renderCard(); });
document.querySelector("#next-button").addEventListener("click", () => state.index >= cards.length ? finish() : renderCard());
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
