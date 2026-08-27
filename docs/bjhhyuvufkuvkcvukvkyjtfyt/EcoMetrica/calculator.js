/*
 * EcoMétrica — estimativa independente de pegada ecológica.
 *
 * Referências públicas:
 * https://footprintnetwork.org/footprint-calculator-faq/
 * https://overshoot.footprintnetwork.org/newsroom/country-overshoot-days/
 * https://footprintnetwork.org/resources/data/
 *
 * A matriz individual da calculadora oficial não é pública. Os fatores abaixo
 * são uma aproximação transparente, calibrada pelas referências nacionais de
 * 2026, e não devem ser apresentados como resultados oficiais ou certificados.
 */

const GLOBAL_BIOCAPACITY = 1.48;
const REFERENCE_YEAR = 2026;
const DAYS_IN_REFERENCE_YEAR = 365;

const BRAZIL_PROFILE = { name: 'Brasil', day: 226, renewable: 85, weights: [0.34, 0.22, 0.18, 0.13, 0.13] };
const IBGE_API = 'https://servicodados.ibge.gov.br/api';
const IBGE_ENDPOINTS = {
  states: `${IBGE_API}/v1/localidades/estados?orderBy=nome`,
  municipalities: (stateId) => `${IBGE_API}/v1/localidades/estados/${stateId}/municipios?orderBy=nome`,
  area: (municipalityId) => `${IBGE_API}/v1/pesquisas/33/indicadores/29167/resultados/${municipalityId}`
};

const FOOD_ITEMS = [
  { id: 'beef', label: 'Carne bovina', weight: 0.35, baseline: 3 },
  { id: 'pork', label: 'Carne suína', weight: 0.12, baseline: 2 },
  { id: 'poultry', label: 'Aves', weight: 0.14, baseline: 3 },
  { id: 'fish', label: 'Peixes', weight: 0.10, baseline: 2 },
  { id: 'eggs', label: 'Ovos', weight: 0.11, baseline: 3 },
  { id: 'dairy', label: 'Leite e derivados', weight: 0.18, baseline: 4 }
];

const FOOD_FREQUENCIES = ['Nunca', 'Raramente', '1 vez/semana', '2–4 vezes/sem.', 'Quase todo dia', 'Todo dia'];

const SECTION_META = {
  contexto: { label: 'LOCALIZAÇÃO', kicker: 'SEU PONTO DE PARTIDA', title: 'Todo impacto<br>acontece em<br>um <span>lugar.</span>', text: 'Selecione seu estado e município para consultar a área territorial oficial diretamente no IBGE.' },
  alimentacao: { label: 'ALIMENTAÇÃO', kicker: '01 — ALIMENTAÇÃO', title: 'O que chega<br>ao prato tem<br>uma <span>origem.</span>', text: 'A produção de alimentos demanda áreas agrícolas, pastagens, pesca e energia.' },
  moradia: { label: 'MORADIA', kicker: '02 — MORADIA', title: 'Habitar<br>também é<br>uma <span>escolha.</span>', text: 'O espaço ocupado, os materiais e a eletricidade ajudam a definir sua parcela de impacto.' },
  mobilidade: { label: 'MOBILIDADE', kicker: '03 — MOBILIDADE', title: 'Cada caminho<br>tem seu<br><span>rastro.</span>', text: 'Combustível, distâncias, transporte coletivo e voos alteram o impacto dos deslocamentos.' },
  bens: { label: 'BENS DE CONSUMO', kicker: '04 — BENS', title: 'Toda compra<br>carrega uma<br><span>história.</span>', text: 'A produção, a durabilidade e o descarte dos bens também demandam recursos naturais.' },
  servicos: { label: 'SERVIÇOS', kicker: '05 — SERVIÇOS', title: 'Vivemos em<br>uma estrutura<br><span>coletiva.</span>', text: 'Saúde, educação, infraestrutura e serviços públicos fazem parte da pegada de todos.' }
};

const answers = {
  stateId: '', stateName: '', stateSigla: '', municipalityId: '', municipalityName: '', areaKm2: null, areaHectares: null, areaYear: '', beef: 3, pork: 2, poultry: 3, fish: 2, eggs: 3, dairy: 4,
  localFood: 35, foodWaste: 'average', homeType: 'apartment', homeMaterial: 'masonry',
  household: 3, homeArea: 84, electricity: 180, renewable: 85,
  transport: 'car', vehicleDistance: 70, vehicleEfficiency: 12, occupancy: 2,
  publicTransport: 45, flightHours: 2, goods: 'average', lifespan: 'average', services: 'average'
};

const STEPS = [
  { id: 'location', section: 'contexto', type: 'location', title: 'Onde você vive no Brasil?', description: 'Escolha primeiro o estado e depois o município. A área territorial será consultada ao vivo no IBGE e convertida para hectares.' },
  { id: 'food', section: 'alimentacao', type: 'food', title: 'Com que frequência você consome estes alimentos?', description: 'Ajuste cada grupo conforme seu consumo habitual. Carnes e derivados possuem impactos diferentes.' },
  { id: 'localFood', section: 'alimentacao', type: 'range', title: 'Quanto da sua alimentação é local ou pouco processada?', description: 'Considere alimentos da região, feiras, produtos sem embalagem e refeições menos industrializadas.', min: 0, max: 100, step: 5, unit: '% da alimentação', left: 'Quase nada', right: 'Quase tudo' },
  { id: 'foodWaste', section: 'alimentacao', type: 'choice', title: 'Quanto alimento costuma ser desperdiçado na sua casa?', description: 'Perdas de alimentos também exigiram terra, água, transporte e energia para sua produção.', options: [{ value: 'low', label: 'Muito pouco', detail: 'Planejo refeições e aproveito sobras' }, { value: 'average', label: 'Perto da média', detail: 'Algumas sobras ou alimentos vencidos' }, { value: 'high', label: 'Mais do que gostaria', detail: 'Alimentos estragam ou são descartados com frequência' }] },
  { id: 'homeType', section: 'moradia', type: 'choice', title: 'Que tipo de residência você ocupa?', description: 'Residências compartilhadas verticalmente costumam distribuir parte da infraestrutura entre mais pessoas.', options: [{ value: 'apartment', label: 'Apartamento', detail: 'Prédio ou condomínio vertical' }, { value: 'attached', label: 'Casa geminada', detail: 'Paredes ou estrutura compartilhada' }, { value: 'detached', label: 'Casa independente', detail: 'Construção isolada no terreno' }] },
  { id: 'homeMaterial', section: 'moradia', type: 'choice', title: 'Qual é o material predominante da sua residência?', description: 'Materiais diferentes demandam áreas, energia e recursos distintos durante sua produção.', columns: 2, options: [{ value: 'masonry', label: 'Alvenaria', detail: 'Tijolo ou bloco' }, { value: 'concrete', label: 'Concreto', detail: 'Estrutura convencional' }, { value: 'wood', label: 'Madeira', detail: 'Origem responsável' }, { value: 'reused', label: 'Bioconstrução', detail: 'Reuso ou materiais naturais' }] },
  { id: 'household', section: 'moradia', type: 'range', title: 'Quantas pessoas moram com você?', description: 'A área e o consumo de eletricidade da residência são compartilhados entre seus moradores.', min: 1, max: 10, step: 1, unit: 'pessoas na residência', left: '1 pessoa', right: '10 pessoas' },
  { id: 'homeArea', section: 'moradia', type: 'range', title: 'Qual é o tamanho aproximado da sua residência?', description: 'Informe a área total do imóvel. Depois dividimos esse espaço pelo número de moradores.', min: 20, max: 400, step: 5, unit: 'm² de área total', left: '20 m²', right: '400 m²' },
  { id: 'electricity', section: 'moradia', type: 'range', title: 'Quanto sua residência consome de eletricidade?', description: 'Se possível, confira o consumo mensal indicado na conta de energia.', min: 20, max: 1200, step: 10, unit: 'kWh por mês', left: '20 kWh', right: '1.200 kWh' },
  { id: 'renewable', section: 'moradia', type: 'range', title: 'Que parte da sua eletricidade vem de fontes renováveis?', description: 'O valor inicial acompanha uma referência aproximada da matriz elétrica do país. Ajuste se você utiliza energia solar ou outro contrato específico.', min: 0, max: 100, step: 5, unit: '% de energia renovável', left: '0%', right: '100%' },
  { id: 'transport', section: 'mobilidade', type: 'choice', title: 'Como você costuma se deslocar?', description: 'Escolha o meio predominante. As próximas perguntas se adaptam à sua resposta.', columns: 2, options: [{ value: 'car', label: 'Carro', detail: 'Veículo particular ou aplicativo' }, { value: 'motorcycle', label: 'Moto', detail: 'Motocicleta ou motoneta' }, { value: 'public', label: 'Transporte público', detail: 'Ônibus, trem ou metrô' }, { value: 'active', label: 'A pé ou bicicleta', detail: 'Deslocamento ativo' }] },
  { id: 'vehicleDistance', section: 'mobilidade', type: 'range', title: 'Quanto você percorre de carro ou moto?', description: 'Some seus deslocamentos usuais durante uma semana.', min: 0, max: 1000, step: 10, unit: 'km por semana', left: '0 km', right: '1.000 km', condition: (data) => ['car', 'motorcycle'].includes(data.transport) },
  { id: 'vehicleEfficiency', section: 'mobilidade', type: 'range', title: 'Qual é o rendimento aproximado do seu veículo?', description: 'Informe quantos quilômetros ele percorre com um litro de combustível.', min: 4, max: 40, step: 1, unit: 'km por litro', left: '4 km/L', right: '40 km/L', condition: (data) => ['car', 'motorcycle'].includes(data.transport) },
  { id: 'occupancy', section: 'mobilidade', type: 'range', title: 'Com quantas pessoas você costuma dividir o veículo?', description: 'Conte você também. Compartilhar um deslocamento reduz o impacto individual.', min: 1, max: 6, step: 1, unit: 'pessoas por viagem', left: '1 pessoa', right: '6 pessoas', condition: (data) => data.transport === 'car' },
  { id: 'publicTransport', section: 'mobilidade', type: 'range', title: 'Quanto você utiliza transporte público?', description: 'Inclua ônibus, metrô, trens ou outros meios coletivos durante uma semana.', min: 0, max: 500, step: 5, unit: 'km por semana', left: 'Não utilizo', right: '500 km' },
  { id: 'flightHours', section: 'mobilidade', type: 'range', title: 'Quanto tempo você costuma viajar de avião por ano?', description: 'Some ida e volta. Uma viagem curta dentro do Brasil geralmente representa de 2 a 6 horas no total.', min: 0, max: 100, step: 1, unit: 'horas de voo por ano', left: 'Nenhum voo', right: '100 horas' },
  { id: 'goods', section: 'bens', type: 'choice', title: 'Em comparação com outras pessoas, quanto você compra?', description: 'Pense em roupas, eletrônicos, móveis, acessórios e outros bens de consumo.', options: [{ value: 'minimal', label: 'Muito menos do que a média', detail: 'Compro apenas o essencial' }, { value: 'low', label: 'Um pouco menos', detail: 'Costumo evitar compras desnecessárias' }, { value: 'average', label: 'Perto da média', detail: 'Consumo parecido com as pessoas ao meu redor' }, { value: 'high', label: 'Acima da média', detail: 'Compro ou substituo produtos com frequência' }, { value: 'veryHigh', label: 'Muito acima da média', detail: 'Consumo elevado de produtos e eletrônicos' }] },
  { id: 'lifespan', section: 'bens', type: 'choice', title: 'O que acontece quando um produto perde a utilidade?', description: 'Manutenção, conserto e reutilização reduzem a demanda por novos materiais.', options: [{ value: 'repair', label: 'Conserto, reaproveito ou compro usado', detail: 'Priorizo a durabilidade' }, { value: 'average', label: 'Depende da situação', detail: 'Às vezes conserto, às vezes substituo' }, { value: 'replace', label: 'Normalmente compro outro', detail: 'Troco o produto por um novo' }] },
  { id: 'services', section: 'servicos', type: 'choice', title: 'Como é sua utilização de serviços e infraestrutura?', description: 'Uma parte da pegada é coletiva e inclui saúde, educação, governo e infraestrutura. Ela não desaparece mesmo quando o consumo pessoal é reduzido.', options: [{ value: 'low', label: 'Abaixo da média', detail: 'Uso individual mais contido' }, { value: 'average', label: 'Próximo da média', detail: 'Uso semelhante ao padrão nacional' }, { value: 'high', label: 'Acima da média', detail: 'Maior uso de serviços e infraestrutura' }] }
];

const CATEGORY_LABELS = ['Alimentação', 'Moradia', 'Mobilidade', 'Bens', 'Serviços'];
const state = { step: 0 };

const elements = {
  app: document.querySelector('#calculatorApp'), stage: document.querySelector('#questionStage'),
  progressLabel: document.querySelector('#progressLabel'), progressCounter: document.querySelector('#progressCounter'),
  progressBar: document.querySelector('#progressBar'), asideKicker: document.querySelector('#asideKicker'),
  asideTitle: document.querySelector('#asideTitle'), asideText: document.querySelector('#asideText'),
  backButton: document.querySelector('#backButton'), nextButton: document.querySelector('#nextButton'),
  resultArea: document.querySelector('#resultArea')
};

function visibleSteps() {
  return STEPS.filter((step) => !step.condition || step.condition(answers));
}

function formatNumber(value, decimals = 1) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

function updateSliderVisual(input) {
  const percentage = (Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100;
  input.style.setProperty('--range-position', `${percentage}%`);
}

function persistAnswers() {
  try { localStorage.setItem('ecometrica-answers-v1', JSON.stringify(answers)); } catch (_) { /* Navegação privada ou acesso bloqueado. */ }
}

async function fetchIbge(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`IBGE respondeu com status ${response.status}`);
  return response.json();
}

function latestAreaRecord(payload) {
  const values = payload?.[0]?.res?.[0]?.res;
  if (!values || typeof values !== 'object') return null;
  const years = Object.keys(values).sort((a, b) => Number(b) - Number(a));
  for (const year of years) {
    const normalized = String(values[year]).replace(/\s/g, '').replace(',', '.');
    const areaKm2 = Number(normalized);
    if (Number.isFinite(areaKm2) && areaKm2 > 0) return { year, areaKm2 };
  }
  return null;
}

function answerMarkup(step) {
  if (step.type === 'location') {
    return `<div class="location-fields"><label><span>ESTADO</span><select id="stateSelect" class="country-select" disabled><option value="">Carregando estados do IBGE…</option></select></label><label><span>MUNICÍPIO</span><select id="municipalitySelect" class="country-select" disabled><option value="">Selecione primeiro um estado</option></select></label></div><div id="municipalityArea" class="municipality-area" hidden></div><div id="ibgeStatus" class="ibge-status" role="status">Consultando a base oficial do IBGE…</div>`;
  }

  if (step.type === 'food') {
    return `<div class="food-list">${FOOD_ITEMS.map((item) => `<label class="food-row"><span>${item.label}</span><input class="range-input food-input" type="range" min="0" max="5" step="1" value="${answers[item.id]}" data-food="${item.id}" aria-label="Frequência de consumo de ${item.label}"><output>${FOOD_FREQUENCIES[answers[item.id]]}</output></label>`).join('')}</div>`;
  }

  if (step.type === 'range') {
    return `<div class="answer-range"><div class="range-value"><strong id="rangeValue">${formatNumber(answers[step.id], 0)}</strong><span>${step.unit}</span></div><input id="mainRange" class="range-input" type="range" min="${step.min}" max="${step.max}" step="${step.step}" value="${answers[step.id]}" aria-label="${step.title}"><div class="range-limits"><span>${step.left}</span><span>${step.right}</span></div></div>`;
  }

  return `<div class="answer-options ${step.columns === 2 ? 'columns-2' : ''}">${step.options.map((option) => `<button class="option-card ${answers[step.id] === option.value ? 'selected' : ''}" type="button" data-option="${option.value}" aria-pressed="${answers[step.id] === option.value}"><strong>${option.label}</strong><small>${option.detail}</small><span class="option-check">✓</span></button>`).join('')}</div>`;
}

function bindQuestion(step) {
  if (step.type === 'location') bindLocationQuestion();

  elements.stage.querySelectorAll('.food-input').forEach((input) => {
    updateSliderVisual(input);
    input.addEventListener('input', () => {
      answers[input.dataset.food] = Number(input.value);
      input.parentElement.querySelector('output').textContent = FOOD_FREQUENCIES[Number(input.value)];
      updateSliderVisual(input);
      persistAnswers();
    });
  });

  const range = elements.stage.querySelector('#mainRange');
  if (range) {
    updateSliderVisual(range);
    range.addEventListener('input', () => {
      answers[step.id] = Number(range.value);
      elements.stage.querySelector('#rangeValue').textContent = formatNumber(Number(range.value), 0);
      updateSliderVisual(range);
      persistAnswers();
    });
  }

  elements.stage.querySelectorAll('[data-option]').forEach((button) => {
    button.addEventListener('click', () => {
      answers[step.id] = button.dataset.option;
      elements.stage.querySelectorAll('[data-option]').forEach((item) => {
        const selected = item === button;
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      persistAnswers();
      updateProgress();
    });
  });
}

async function bindLocationQuestion() {
  const stateSelect = elements.stage.querySelector('#stateSelect');
  const municipalitySelect = elements.stage.querySelector('#municipalitySelect');
  const areaPanel = elements.stage.querySelector('#municipalityArea');
  const status = elements.stage.querySelector('#ibgeStatus');
  const previousLocation = { stateId: answers.stateId, municipalityId: answers.municipalityId };
  elements.nextButton.disabled = true;

  function resetMunicipality() {
    answers.municipalityId = '';
    answers.municipalityName = '';
    answers.areaKm2 = null;
    answers.areaHectares = null;
    answers.areaYear = '';
    areaPanel.hidden = true;
    elements.nextButton.disabled = true;
  }

  function showArea() {
    areaPanel.innerHTML = `<div><span>ÁREA TERRITORIAL OFICIAL</span><strong>${formatNumber(answers.areaHectares, 1)} ha</strong></div><div><span>EM QUILÔMETROS QUADRADOS</span><strong>${formatNumber(answers.areaKm2, 3)} km²</strong></div><small>IBGE · ${answers.municipalityName}, ${answers.stateSigla} · referência ${answers.areaYear}. Um km² equivale a 100 hectares.</small>`;
    areaPanel.hidden = false;
    status.textContent = 'Área municipal carregada diretamente do IBGE.';
    elements.nextButton.disabled = false;
  }

  async function loadArea() {
    const selected = municipalitySelect.options[municipalitySelect.selectedIndex];
    resetMunicipality();
    if (!municipalitySelect.value) return;
    answers.municipalityId = municipalitySelect.value;
    answers.municipalityName = selected.textContent;
    municipalitySelect.disabled = true;
    status.textContent = 'Consultando a área territorial do município…';
    try {
      const payload = await fetchIbge(IBGE_ENDPOINTS.area(answers.municipalityId));
      const record = latestAreaRecord(payload);
      if (!record) throw new Error('Área não encontrada');
      answers.areaKm2 = record.areaKm2;
      answers.areaHectares = record.areaKm2 * 100;
      answers.areaYear = record.year;
      showArea();
      persistAnswers();
    } catch (_) {
      status.innerHTML = 'Não foi possível consultar a área agora. <button type="button" id="retryArea">Tentar novamente</button>';
      elements.stage.querySelector('#retryArea')?.addEventListener('click', loadArea, { once: true });
    } finally {
      municipalitySelect.disabled = false;
    }
  }

  async function loadMunicipalities(preselectMunicipality = '') {
    resetMunicipality();
    municipalitySelect.disabled = true;
    municipalitySelect.innerHTML = '<option value="">Carregando municípios…</option>';
    const selected = stateSelect.options[stateSelect.selectedIndex];
    answers.stateId = stateSelect.value;
    answers.stateName = selected?.dataset.name || '';
    answers.stateSigla = selected?.dataset.sigla || '';
    if (!answers.stateId) {
      municipalitySelect.innerHTML = '<option value="">Selecione primeiro um estado</option>';
      status.textContent = 'Escolha um estado para continuar.';
      return;
    }
    status.textContent = `Carregando municípios de ${answers.stateName}…`;
    try {
      const municipalities = await fetchIbge(IBGE_ENDPOINTS.municipalities(answers.stateId));
      municipalitySelect.innerHTML = `<option value="">Selecione um município</option>${municipalities.map((municipality) => `<option value="${municipality.id}">${municipality.nome}</option>`).join('')}`;
      municipalitySelect.disabled = false;
      status.textContent = `${municipalities.length} municípios encontrados. Agora selecione sua cidade.`;
      if (preselectMunicipality && municipalities.some((municipality) => String(municipality.id) === String(preselectMunicipality))) {
        municipalitySelect.value = String(preselectMunicipality);
        await loadArea();
      }
    } catch (_) {
      municipalitySelect.innerHTML = '<option value="">Municípios indisponíveis</option>';
      status.innerHTML = 'Não foi possível carregar os municípios. <button type="button" id="retryMunicipalities">Tentar novamente</button>';
      elements.stage.querySelector('#retryMunicipalities')?.addEventListener('click', loadMunicipalities, { once: true });
    }
  }

  stateSelect.addEventListener('change', () => loadMunicipalities());
  municipalitySelect.addEventListener('change', loadArea);

  try {
    const states = await fetchIbge(IBGE_ENDPOINTS.states);
    stateSelect.innerHTML = `<option value="">Selecione um estado</option>${states.map((stateItem) => `<option value="${stateItem.id}" data-name="${stateItem.nome}" data-sigla="${stateItem.sigla}">${stateItem.nome} (${stateItem.sigla})</option>`).join('')}`;
    stateSelect.disabled = false;
    status.textContent = 'Escolha um estado para ver seus municípios.';
    if (previousLocation.stateId && states.some((stateItem) => String(stateItem.id) === String(previousLocation.stateId))) {
      stateSelect.value = String(previousLocation.stateId);
      await loadMunicipalities(previousLocation.municipalityId);
    }
  } catch (_) {
    stateSelect.innerHTML = '<option value="">Estados indisponíveis</option>';
    status.innerHTML = 'A API do IBGE está temporariamente indisponível. <button type="button" id="retryStates">Tentar novamente</button>';
    elements.stage.querySelector('#retryStates')?.addEventListener('click', () => renderQuestion(), { once: true });
  }
}

function updateProgress() {
  const steps = visibleSteps();
  const current = Math.min(state.step, steps.length - 1);
  elements.progressCounter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
  elements.progressBar.style.width = `${(current + 1) / steps.length * 100}%`;
  elements.nextButton.innerHTML = current === steps.length - 1 ? 'Ver meu resultado <span>→</span>' : 'Continuar <span>→</span>';
}

function renderQuestion() {
  const steps = visibleSteps();
  state.step = Math.max(0, Math.min(state.step, steps.length - 1));
  const question = steps[state.step];
  const section = SECTION_META[question.section];
  elements.progressLabel.textContent = section.label;
  elements.asideKicker.textContent = section.kicker;
  elements.asideTitle.innerHTML = section.title;
  elements.asideText.textContent = section.text;
  elements.backButton.disabled = state.step === 0;
  elements.nextButton.disabled = question.type === 'location' && !answers.areaHectares;
  elements.stage.innerHTML = `<span class="question-kicker">${section.label}</span><h1 class="question-title">${question.title}</h1><p class="question-description">${question.description}</p>${answerMarkup(question)}`;
  bindQuestion(question);
  updateProgress();
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function brazilFootprint() {
  return GLOBAL_BIOCAPACITY * (DAYS_IN_REFERENCE_YEAR / BRAZIL_PROFILE.day);
}

function calculateFootprint(data = answers) {
  const country = BRAZIL_PROFILE;
  const baseline = brazilFootprint();

  const animalRatio = FOOD_ITEMS.reduce((total, item) => total + item.weight * (Number(data[item.id]) / item.baseline), 0);
  const localFactor = 1 - (Number(data.localFood) - 35) * 0.0018;
  const wasteFactor = { low: 0.86, average: 1, high: 1.20 }[data.foodWaste];
  const foodFactor = clamp((0.42 + 0.58 * animalRatio) * localFactor * wasteFactor, 0.30, 2.80);

  const homeTypeFactor = { apartment: 1, attached: 1.09, detached: 1.22 }[data.homeType];
  const materialFactor = { masonry: 1, concrete: 1.12, wood: 0.88, reused: 0.76 }[data.homeMaterial];
  const areaPerPerson = Number(data.homeArea) / Math.max(Number(data.household), 1);
  const electricityPerPerson = Number(data.electricity) / Math.max(Number(data.household), 1);
  const areaFactor = clamp(Math.pow(areaPerPerson / 28, 0.42), 0.48, 2.35);
  const electricityFactor = clamp(Math.pow(electricityPerPerson / 60, 0.52), 0.35, 3.20);
  const renewableFactor = clamp(1 - (Number(data.renewable) - country.renewable) * 0.003, 0.68, 1.35);
  const housingFactor = clamp((0.48 * areaFactor * homeTypeFactor * materialFactor + 0.52 * electricityFactor * renewableFactor), 0.34, 3.20);

  const hasVehicle = ['car', 'motorcycle'].includes(data.transport);
  const occupancy = data.transport === 'car' ? Number(data.occupancy) : 1;
  const vehicleDemand = hasVehicle ? Number(data.vehicleDistance) / Math.max(Number(data.vehicleEfficiency), 1) / Math.max(occupancy, 1) : 0;
  const vehicleRatio = vehicleDemand / (70 / 12 / 2);
  const publicRatio = Number(data.publicTransport) / 45;
  const flightRatio = Number(data.flightHours) / 2;
  const mobilityFactor = clamp(0.24 + 0.39 * vehicleRatio + 0.19 * publicRatio + 0.18 * flightRatio, 0.15, 8);

  const consumptionFactor = { minimal: 0.43, low: 0.72, average: 1, high: 1.52, veryHigh: 2.20 }[data.goods];
  const lifespanFactor = { repair: 0.75, average: 1, replace: 1.22 }[data.lifespan];
  const goodsFactor = clamp(consumptionFactor * lifespanFactor, 0.25, 2.80);

  const publicServiceFactor = { low: 0.78, average: 1, high: 1.32 }[data.services];
  const infrastructureFactor = clamp((foodFactor + housingFactor + mobilityFactor + goodsFactor) / 4, 0.5, 2.1);
  const serviceFactor = clamp(0.65 + 0.20 * publicServiceFactor + 0.15 * infrastructureFactor, 0.68, 1.55);

  const factors = [foodFactor, housingFactor, mobilityFactor, goodsFactor, serviceFactor];
  const categories = CATEGORY_LABELS.map((label, index) => ({ label, value: baseline * country.weights[index] * factors[index], factor: factors[index] }));
  const footprint = categories.reduce((total, category) => total + category.value, 0);
  const planets = footprint / GLOBAL_BIOCAPACITY;
  const overshootDay = planets > 1 ? Math.max(1, Math.min(DAYS_IN_REFERENCE_YEAR, Math.round(DAYS_IN_REFERENCE_YEAR / planets))) : null;

  const carbon = categories[0].value * 0.23 + categories[1].value * 0.56 + categories[2].value * 0.82 + categories[3].value * 0.46 + categories[4].value * 0.43;
  const cropland = categories[0].value * 0.31 + categories[3].value * 0.14 + categories[4].value * 0.07;
  const grazing = categories[0].value * 0.28;
  const fishing = categories[0].value * 0.09;
  const built = categories[1].value * 0.27 + categories[2].value * 0.09 + categories[4].value * 0.20;
  const forest = Math.max(0, footprint - carbon - cropland - grazing - fishing - built);

  return { country, location: { stateName: data.stateName, stateSigla: data.stateSigla, municipalityName: data.municipalityName, municipalityId: data.municipalityId, areaKm2: data.areaKm2, areaHectares: data.areaHectares, areaYear: data.areaYear }, baseline, footprint, planets, overshootDay, categories, carbon, carbonShare: carbon / footprint * 100, co2Estimate: carbon * 2.7, land: [{ label: 'Absorção de carbono', value: carbon }, { label: 'Áreas agrícolas', value: cropland }, { label: 'Florestas e produtos florestais', value: forest }, { label: 'Pastagens', value: grazing }, { label: 'Áreas construídas', value: built }, { label: 'Áreas de pesca', value: fishing }] };
}

function overshootDate(day) {
  if (!day) return 'Sem sobrecarga';
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(new Date(REFERENCE_YEAR, 0, day));
}

function recommendationsFor(result) {
  const ranked = [...result.categories].sort((a, b) => b.value - a.value);
  const advice = {
    Alimentação: { title: 'Repense algumas refeições', text: 'Reduzir carne bovina, evitar desperdício e escolher alimentos locais pode diminuir sua maior área de impacto.' },
    Moradia: { title: 'Olhe para a energia da casa', text: 'Acompanhe o consumo mensal, procure equipamentos eficientes e avalie fontes renováveis quando possível.' },
    Mobilidade: { title: 'Compartilhe seus caminhos', text: 'Transporte público, caronas, caminhada e bicicleta reduzem a demanda individual por combustível.' },
    Bens: { title: 'Compre para durar', text: 'Reparo, segunda mão e maior vida útil diminuem a necessidade de extrair e fabricar novos materiais.' },
    Serviços: { title: 'A mudança também é coletiva', text: 'Apoiar infraestrutura eficiente e políticas públicas sustentáveis ajuda a reduzir a parcela compartilhada da pegada.' }
  };
  return ranked.slice(0, 3).map((item) => advice[item.label]);
}

function shareText(result) {
  const location = result.location.municipalityName ? ` em ${result.location.municipalityName}, ${result.location.stateSigla}` : '';
  return `Minha pegada ecológica estimada${location} na EcoMétrica é ${formatNumber(result.footprint, 2)} gha. Se todos vivessem como eu, seriam necessários ${formatNumber(result.planets, 1)} planeta(s). ${result.overshootDay ? `Meu Dia da Sobrecarga seria ${overshootDate(result.overshootDay)}.` : 'Meu estilo de vida estimado permanece dentro da capacidade de um planeta.'}`;
}

function showResults() {
  const result = calculateFootprint();
  const biggest = Math.max(...result.categories.map((category) => category.value));
  const earthCount = Math.max(1, Math.min(4, Math.ceil(result.planets)));
  const earthMarkup = Array.from({ length: earthCount }, () => '<span class="result-earth"></span>').join('');
  const adviceMarkup = recommendationsFor(result).map((item) => `<article><h3>${item.title}</h3><p>${item.text}</p></article>`).join('');

  elements.resultArea.innerHTML = `<div class="result-intro"><span class="section-kicker">A MEDIDA DO SEU IMPACTO</span><h1>Se todos vivessem<br>como você, precisaríamos de<br><span>${formatNumber(result.planets, 1)} planeta${result.planets >= 1.95 ? 's' : ''}.</span></h1><p>Este resultado relaciona suas escolhas diárias com a capacidade anual de regeneração da Terra.</p></div>
  <div class="earth-result"><div class="earth-stack" aria-hidden="true">${earthMarkup}</div><div class="earth-value"><strong>${formatNumber(result.planets, 1)}</strong><span>${result.planets < 1.95 ? 'planeta Terra' : 'planetas Terra'}</span></div></div>
  <div class="municipality-context"><div><span>MUNICÍPIO SELECIONADO</span><strong>${result.location.municipalityName}, ${result.location.stateSigla}</strong><small>Código IBGE ${result.location.municipalityId}</small></div><div><span>ÁREA TERRITORIAL MUNICIPAL</span><strong>${formatNumber(result.location.areaHectares, 1)} hectares</strong><small>${formatNumber(result.location.areaKm2, 3)} km² · IBGE ${result.location.areaYear}</small></div></div>
  <div class="metric-grid"><article class="metric-card"><span>SUA PEGADA ECOLÓGICA</span><strong>${formatNumber(result.footprint, 2)} gha</strong><small>hectares globais por pessoa</small></article><article class="metric-card"><span>SEU DIA DA SOBRECARGA</span><strong>${overshootDate(result.overshootDay)}</strong><small>${result.overshootDay ? `referência de ${REFERENCE_YEAR}` : 'dentro da capacidade anual'}</small></article><article class="metric-card"><span>PARCELA DE CARBONO</span><strong>${formatNumber(result.carbonShare, 0)}%</strong><small>aprox. ${formatNumber(result.co2Estimate, 1)} t de CO₂ por ano</small></article></div>
  <div class="result-split"><section class="result-block"><span>CATEGORIAS DE CONSUMO</span><h2>De onde vem sua pegada?</h2>${result.categories.map((category) => `<div class="breakdown-row"><span>${category.label}</span><div class="breakdown-track"><div class="breakdown-fill" style="width:${category.value / biggest * 100}%"></div></div><strong>${formatNumber(category.value, 2)} gha</strong></div>`).join('')}</section><section class="result-block"><span>TIPOS DE ÁREA PRODUTIVA</span><h2>O espaço que a natureza oferece</h2><div class="land-types">${result.land.map((item) => `<div class="land-row"><span>${item.label}</span><strong>${formatNumber(item.value, 2)} gha</strong></div>`).join('')}</div></section></div>
  <section class="recommendations"><span>PARA DIMINUIR SEU RASTRO</span><h2>Pequenas mudanças, novas medidas.</h2><div class="recommendation-list">${adviceMarkup}</div></section>
  <section class="method-disclosure"><span>METODOLOGIA E TRANSPARÊNCIA</span><h2>Como chegamos a esta estimativa.</h2><p>Seu ponto de partida foi a média brasileira de ${formatNumber(result.baseline, 2)} gha por pessoa, derivada dos Country Overshoot Days 2026. A localização e os ${formatNumber(result.location.areaHectares, 1)} hectares territoriais de ${result.location.municipalityName} vieram das APIs oficiais do IBGE. Essa área física contextualiza onde você vive, mas não altera o resultado pessoal: hectares territoriais comuns não são equivalentes a hectares globais de biocapacidade. A biocapacidade global de referência é ${formatNumber(GLOBAL_BIOCAPACITY, 2)} gha por pessoa. As cinco categorias são ajustadas pelas suas respostas e incluem uma parcela coletiva de serviços. Os coeficientes individuais internos da calculadora da Global Footprint Network não são públicos; a EcoMétrica é uma estimativa independente, sem certificação ou parceria.</p><div class="source-links"><a href="https://servicodados.ibge.gov.br/api/docs/localidades" target="_blank" rel="noopener noreferrer">API de Localidades do IBGE ↗</a><a href="https://www.ibge.gov.br/geociencias/organizacao-do-territorio/estrutura-territorial/15761-areas-dos-municipios.html" target="_blank" rel="noopener noreferrer">Áreas territoriais do IBGE ↗</a><a href="https://footprintnetwork.org/footprint-calculator-faq/" target="_blank" rel="noopener noreferrer">Metodologia de pegada ↗</a></div></section>
  <div class="result-actions"><button class="button button-dark" id="shareButton" type="button">Compartilhar resultado <span>↗</span></button><button class="button button-outline" id="restartButton" type="button">Refazer análise <span>↺</span></button><a class="button button-outline" href="index.html">Voltar ao início</a></div><p class="copy-feedback" id="copyFeedback" aria-live="polite"></p>`;

  elements.app.classList.add('show-results');
  elements.resultArea.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  elements.resultArea.querySelector('#restartButton').addEventListener('click', () => {
    state.step = 0;
    elements.app.classList.remove('show-results');
    elements.resultArea.hidden = true;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  elements.resultArea.querySelector('#shareButton').addEventListener('click', async () => {
    const text = shareText(result);
    const feedback = elements.resultArea.querySelector('#copyFeedback');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Minha pegada ecológica — EcoMétrica', text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        feedback.textContent = 'Resultado copiado. Agora você pode compartilhá-lo.';
      } else {
        feedback.textContent = text;
      }
    } catch (error) {
      if (error.name !== 'AbortError') feedback.textContent = text;
    }
  });
}

elements.nextButton.addEventListener('click', () => {
  if (state.step >= visibleSteps().length - 1) {
    showResults();
  } else {
    state.step += 1;
    renderQuestion();
  }
});

elements.backButton.addEventListener('click', () => {
  state.step -= 1;
  renderQuestion();
});

renderQuestion();
