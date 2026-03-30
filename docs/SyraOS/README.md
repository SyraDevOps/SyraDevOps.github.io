# SyraOS - Website

Website profissional do SyraOS, plataforma unificada de infraestrutura e IA. Design big tech com 10 páginas totalmente modularizadas, responsivas e otimizadas para conversão.

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-mobile"></use></svg> Visão Geral

**SyraOS** é uma plataforma que unifica:
- **Modelos de IA** (Sory 1.27 / Sory 1.5)
- **APIs essenciais** (texto, embeddings, visão, agentes)
- **Minds** (agentes de IA configuráveis e especializados)
- **Infraestrutura** (multi-region, autoscaling, 99.99% uptime)

### Planos
- **Starter**: R$ 14,90/mês (35k tokens, Sory 1.27, 200 Minds, 10 plugins)
- **Pro**: R$ 24,90/mês (100k tokens, Sory 1.5, Minds customizados, 35+ plugins, suporte prioritário)
- **Scale**: R$ 99,90/mês (500k tokens, Sory Vision, Syra Bridge, IoT, ambientes exclusivos, eventos Syra, SLA 99.99%)

### Comparação Rápida

| Feature | Starter | Pro | Scale |
|---------|---------|-----|-------|
| **Tokens/mês** | 35k | 100k | 500k |
| **Modelo IA** | Sory 1.27 | Sory 1.5 | Sory 1.5 + Vision |
| **Criar Minds** | Não | Sim | Sim ilimitado |
| **Plugins** | 10 | 35+ | 50+ + Privados |
| **Memória persistente** | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-close"></use></svg> | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Avançada |
| **Autoscaling** | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-close"></use></svg> | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Premium |
| **Visão computacional** | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-close"></use></svg> | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-close"></use></svg> | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Sory Vision |
| **Syra Bridge (IoT)** | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-close"></use></svg> | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-close"></use></svg> | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Completo |
| **Ambientes exclusivos** | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-close"></use></svg> | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-close"></use></svg> | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Staging+Prod |
| **Acesso a eventos Syra** | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-close"></use></svg> | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-close"></use></svg> | <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Com selo VIP |
| **Suporte** | Email | Prioritário | VIP 99.99% SLA |

---

## Conceito de Minds

**Minds** são agentes de inteligência artificial configuráveis que funcionam como assistentes personalizados para tarefas, comunicação ou automação. Cada Mind tem:

- **Sistema**: define o comportamento geral (ex.: "ajudante educado", "analista financeiro")
- **Regras**: restrições ou políticas que o Mind deve seguir
- **Estilo**: tom da comunicação (formal, descontraído, técnico, etc.)
- **Modelo de IA**: o motor que processa linguagem (ex.: Sory 1.5, Sory Vision)
- **Versão**: permite controle de updates ou evolução do agente
- **Autor**: quem criou ou treinou o Mind

### Como Funciona

1. **Criação**: Usuário cria uma Mind via interface ou API, definindo sistema, regras e estilo.
2. **Interação**: Usuário envia mensagens para a Mind, que responde de acordo com suas configurações.
3. **Personalização**: Cada Mind pode ter seu próprio modelo, regras e tom, permitindo agentes altamente especializados (ex.: vendas, suporte, ensino, análise de dados).
4. **Compartilhamento**: Minds podem ser exportadas ou compartilhadas via QR Code ou link, permitindo colaboração ou distribuição de agentes prontos.
5. **Integração com APIs externas** (opcional): Minds podem executar ações externas, como enviar emails, buscar dados, controlar sistemas, ou automatizar fluxos de trabalho.

### Valor para o mercado

- **Empresas**: automatizam atendimento, suporte e processos internos com agentes inteligentes.
- **Desenvolvedores**: criam bots customizados sem treinar modelos do zero.
- **Consumidores**: usam assistentes pessoais adaptados ao seu estilo e necessidades.
- **Educação**: professores e alunos podem criar agentes especializados para aprendizado.

### Diferenciais

- **Flexível e modular**: cada Mind é independente e configurável.
- **Escalável**: múltiplos agentes funcionando simultaneamente.
- **Customizável**: qualquer usuário pode definir regras, ton e contexto.
- **Compartilhável**: fácil distribuição via QR Code ou link.
- **Conectável**: pode interagir com APIs externas e sistemas corporativos.

### Estrutura Completa do Mind (API)

Quando você cria um Mind via API, a estrutura é:

```json
{
  "access_level": 0,
  "active": true,
  "authors": ["Syra", "João"],
  "code": "0001",
  "created_at": "2026-03-26",
  "name": "SyraAI",
  "version": "1.0",
  "system": {
    "context": "Descrever contexto de uso",
    "interpretation": "Como interpretar as mensagens",
    "response_style": "Tom e estilo de respostas",
    "restrictions": "Limitações e políticas",
    "thinking": "Processo de pensamento desejado",
    "rules": "Regras de negócio e validação"
  }
}
```

### Exemplos de Operações com Minds

**Criar Mind**:
```ts
const mind = await api.minds.create({
  name: "MeuMind",
  authors: ["João"],
  system: { context: "...", interpretation: "...", response_style: "..." },
  version: "1.0"
}, { method: "POST" });
```

**Consultar por ID**:
```ts
const mind = await api.minds.get({ id: "mind_meumind_0001" });
```

**Usar em Chat**:
```ts
const response = await api.chat({
  message: "Sua pergunta aqui",
  mind_id: "mind_meumind_0001"
});
```

**Listar todas**:
```ts
const minds = await api.minds.list({ limit: 10 });
```

**Atualizar**:
```ts
await api.minds.update({ id: "mind_xyz" }, {...}, { method: "PUT" });
```

**Exportar/Compartilhar**:
```ts
const exported = await api.minds.export({ id: "mind_xyz" });
```

---

## 📁 Estrutura de Diretórios

```
st/
├── index.html              # Landing page - Hero + benefícios + pricing
├── produto.html            # Pilares, características, Minds, segurança
├── pricing.html            # Planos, comparação, FAQ
├── docs.html               # Documentação técnica, exemplos de código
├── usecases.html           # 4 casos de uso com cenários reais
├── downloads.html          # Syra OS e Minds para Windows/Linux/Android
├── about.html              # Missão, valores, informações da empresa
├── terms.html              # Termos de serviço completos
├── privacy.html            # Política de privacidade e GDPR/LGPD
├── contato.html            # Formulário, canais de atendimento, redes sociais
├── icons.svg               # Biblioteca de ícones SVG reutilizáveis (33 símbolos)
├── styles.css              # Sistema de design, componentes, responsivo
├── scripts.js              # Menu toggle mobile, year auto-population
├── replace-emojis.py       # Script para substituir emojis por ícones SVG
├── inject-svg.py           # Script para injetar biblioteca SVG em HTMLs
└── README.md               # Este arquivo
```

---

## 🌐 Páginas e Propósitos

### 1. **index.html** - Landing Page
- **Headlines**: "Toda sua infraestrutura de IA em um só lugar"
- **Seções**:
  - Hero com CTA primária e secundária
  - 4 cards de benefícios principais
  - Prova social (+80% retenção)
  - Demo interativa SyraOS em tempo real
  - Pricing cards com botões Asaas
  - 4 CTAs para próximos passos
  - Footer com links nav
- **Objetivo**: Conversão para pricing ou demo

### 2. **produto.html** - Deep Product
- **Seções**:
  - Pilares (4 cards: Modelos, APIs, Minds, Infraestrutura)
  - Características por camada (2-column grid)
  - O que é Minds (explicação highlight)
  - **NOVO**: Recursos Premium Scale (4 cards)
    - <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-eye"></use></svg> Sory Vision (visão computacional)
    - <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-bridge"></use></svg> Syra Bridge (conexão on-premise)
    - <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-gear"></use></svg> Frameworks IoT (hardwares)
    - <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-trophy"></use></svg> Ambientes exclusivos + eventos Syra
  - Segurança & compliance (4 cards)
- **Objetivo**: Entender funcionalidades técnicas

### 3. **pricing.html** - Conversão
- **Seções**:
  - Plan cards (Starter vs Pro vs Scale)
  - Featurelist detalhada por plano
  - Comparison table (10+ features)
  - FAQ section
  - Contact CTA
- **Botões**: Asaas checkout links (Starter/Pro), Solicitar Scale
- **Scale (R$ 99,90)**:
  - 500.000 tokens/mês
  - Sory Vision (multimodal)
  - Syra Bridge (conexão segura on-premise)
  - Frameworks IoT (MQTT, ARM, Raspberry Pi)
  - Ambientes exclusivos + eventos Syra
  - SLA 99.99% com suporte VIP
- **Objetivo**: Decisão de compra ou upgrade

### 4. **docs.html** - Developer Onboarding
- **Seções**:
  - Getting started (4-step grid)
  - SyraOS SDK documentation (TypeScript/JS/Python)
  - Autenticação via Bearer Token
  - 4 endpoint cards (models, embeddings, agents, minds)
  - Exemplos práticos (React, Node.js, Python)
  - Roadmap v2.0/v3.0/v4.0
  - **NOVO**: Recursos Premium (Plano Scale)
    - Sory Vision (OCR, detecção de objetos, análise de frames)
    - Syra Bridge (conexão segura cloud <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> on-premise)
    - Frameworks IoT (MQTT, WebSockets, ARM deployment)
    - Ambientes exclusivos (staging/production)
  - Post-purchase welcome kit section
- **Objetivo**: Facilitar integração e demonstrar poder técnico

### 5. **usecases.html** - Value Demonstration
- **4 Use Cases**:
  1. Atendimento <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> Chatbot com contexto
  2. Análise <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> Document processing
  3. Automação <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> Workflows orquestrados
  4. SaaS Products <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> IA embutida
- **Layout**: 2-column (descrição + highlight box)
- **Objetivo**: Mostrar aplicações reais

### 6. **downloads.html** - Software Distribution
- **Programas**:
  - Syra OS (v2.1.0) - Para Windows, Linux, Android
  - Minds (v1.8.2) - Para Windows, Linux, Android
- **Seções**:
  - 4 cards de download por programa
  - Instruções de instalação (4 tutoriais)
  - FAQ de downloads
- **Objetivo**: Facilitar acesso aos tools

### 7. **about.html** - Company Credibility
- **Seções**:
  - Missão & visão
  - Values grid (4 cards)
  - Company info + contato
- **Objetivo**: Build trust

### 8. **terms.html** - Legal Compliance
- **7 Seções**:
  - Aceitar termos
  - Sua conta
  - Proibições
  - Cancelamento
  - SLA
  - Indenização
  - Modificações
- **Objetivo**: Proteção jurídica

### 9. **privacy.html** - Data Protection
- **GDPR/LGPD compliant**
- Política de privacidade completa
- **Objetivo**: Conformidade regulatória

### 10. **contato.html** - Lead Capture
- **Seções**:
  - 4 canais de atendimento (cards clicáveis)
  - **NOVO**: Conecte-se conosco (6 redes sociais com links)
    - Instagram (@SyraDevOps) - Projetos e bastidores
    - X/Twitter (@SyraDevOps) - Novidades e atualizações
    - GitHub (@SyraDevOps) - Repositórios open source
    - LinkedIn (SyraCit Company) - Conexões profissionais
    - YouTube (@SyRaDevOps) - Tutoriais e palestras
    - Twitch (@syradevops) - Lives de desenvolvimento
  - Informações da empresa (2 highlight boxes)
  - Seção de segurança (email validado)
  - Formulário aprimorado (6 campos + select)
  - FAQ rápido (4 perguntas)
- **Form fields**: Nome, Email, Telefone, Empresa, Assunto, Mensagem
- **Objetivo**: Capturar leads, suporte e engajamento em redes sociais

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-settings"></use></svg> Design System

### Ícones SVG
- **Arquivo**: `icons.svg` (biblioteca centralizada de 33 ícones)
- **Uso**: `<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-nome"></use></svg>`
- **Ícones inclusos**: rocket, lightbulb, lock, key, email, check, close, arrow-right, package, gear, eye, bridge, trophy, globe, tools, lightning, brain, fire, puzzle, chart, desktop, phone, sparkles, mobile, envelope, settings, star, e mais
- **Conversão**: 221 emojis foram substituídos por ícones SVG para design mais profissional
- **CSS**: Classe `.icon` com `display: inline-block`, `vertical-align: middle`, `fill: currentColor`

### Cores
```css
--primary: #111 (texto principal/CTA)
--secondary: #666 (texto secundário)
--bg-light: #f8f8f8 (backgrounds)
--border: #e6e6e6 (linhas/borders)
```

### Tipografia
- **Font**: Inter (Google Fonts, weights 400-800)
- **H1**: 2.8rem, font-weight 800
- **H2**: 2rem, font-weight 700
- **H3**: 1.2rem, font-weight 600
- **Body**: 1rem, font-weight 400
- **Small**: 0.9rem, color #888

### Grid System
- **`.grid-4`**: 4 colunas responsivas (minmax 240px)
- **`.grid-2`**: 2 colunas responsivas (minmax 350px)
- **Breakpoint mobile**: 860px
- **Container max-width**: 1200px

### Componentes
- **`.icon`**: SVG inline com `fill: currentColor` herda cor do texto
- **`a.card`**: Links com animação hover (border #111, transform translateY, shadow)
- **`.card`**: Border + shadow, hover lift (4px shadow)
- **`.btn-primary`**: #111 bg, white text, 200ms transition
- **`.btn-outline`**: Border #111, transparent bg
- **`._section`**: 4rem padding top/bottom, bottom border
- **`.highlight`**: Left border accent, bg-light

### Spacing
- **Section padding**: 4rem (top/bottom)
- **Container gap**: 2rem (grid default)
- **Card gap**: 1.5rem (flex nav items)

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-tools"></use></svg> Tecnologia Stack

### Frontend
- **HTML5** - Semântica e acessibilidade
- **CSS3** - Variables, Grid, Flexbox
- **JavaScript (Vanilla)** - Sem dependências
- **Google Fonts** - Inter font family
- **SVG Icons** - 33 ícones vetoriais (icons.svg)
- **Python Scripts** - Automação de conversão emoji <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> SVG

### Hosting/Deployment
- **Formato**: Static files (HTML, CSS, JS)
- **Compatibilidade**: Todos os navegadores modernos
- **Performance**: Zero build process, carregamento instant
- **Mobile**: 100% responsivo (breakpoint 860px)

### Integrations
- **Payment**: Asaas (checkout links externos)
- **Contact**: mailto: (pode ser migrado para API)
- **Analytics**: Pronto para tag manager

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-mobile"></use></svg> Responsive Design

### Desktop (> 860px)
- Nav horizontal com flexbox
- Grid cards em múltiplas colunas (grid-4, grid-2)
- Sections com container max-width 1200px
- Menu sempre visível

### Mobile (≤ 860px)
- Nav converte para menu toggle (button#menu-btn)
- Grids stackam em 1 coluna
- Padding reduzido (2rem)
- Touch-friendly buttons (75px height)
- Font sizes mantêm legibilidade

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-star"></use></svg> Funcionalidades

### Interativas
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Menu toggle mobile (classes open/active)
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Auto-population de ano no footer
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Links com target="_blank" rel="noopener noreferrer"
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Formulário multi-campo com validação HTML5
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Links telefone (tel:) e email (mailto:)

### SEO Ready
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Meta descriptions apropriadas
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Heading hierarchy H1 > H2 > H3
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Alt text ready (estrutura pronta)
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Open Graph pronta para social

### Acessibilidade
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Semantic HTML (header, nav, main, footer, section)
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Color contrast AA compliant
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Form labels e required attributes
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> Link descriptions claras
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> SVG icons com `fill: currentColor` (temas adaptáveis)

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-chart"></use></svg> Company Info

**Empresa**: SyraDevOps
- **CNPJ**: 64.163.711/0001-60
- **Email**: syradevops@gmail.com
- **Telefone**: (32) 99953-0234
- **Website**: syradevops.com
- **Endereço**: Rua Fiscal Antônio Damaso, 94 • Centro • São João del Rei - MG • CEP 36300-010
- **Horário**: Seg-Sex 9h-18h (BRT)

---

## 🏢 4 Pilares Críticos para Enterprise (v3.0+)

Implementados para atingir padrões Big Tech em qualidade, segurança e observabilidade.

### 1️⃣ Testing com Mock Mode (sk_test_)

Teste suas integrações sem gastar tokens reais:

```ts
const api = createSyra({ 
  token: "sk_test_xxxxx",  // Token de teste
  mock: true  // Respostas simuladas
});

// Retorna dados fake realistas, mesma latência
const res = await api.chat({ message: "Teste" });
```

**Usar em testes unitários:**
```ts
import { mockSyraResponse } from "syraos/testing";
mockSyraResponse('chat', { content: "Mock", tokens_used: 10 });
// Seu código DE teste não gasta tokens reais
```

### 2️⃣ Tratamento de Erros Padronizado

Todos os erros retornam JSON consistente:

```ts
import { SyraAuthError, SyraRateLimitError } from "syraos/errors";

try {
  await api.chat({ message: "Olá" });
} catch (error) {
  if (error instanceof SyraAuthError) {
    console.log("Regenere seu token");
  } else if (error instanceof SyraRateLimitError) {
    console.log(`Aguarde ${error.retryAfter}s`);
    // SDK faz retry automático!
  }
}
```

**Retry automático com backoff exponencial:**
```ts
const api = createSyra({
  token: "sk_live_...",
  retries: 3,           // Número de retentativas
  timeout: 5000,        // Timeout em ms
  backoff: "exponential" // 1s → 2s → 4s
});
```

### 3️⃣ Rate Limiting & Quotas

SDK gerencia automaticamente limites por plano:

```ts
// Verificar limites
const limits = api.getLimits();
console.log(limits.tokensRemaining);    // Tokens restantes este mês
console.log(limits.requestsRemaining);  // Requisições no minuto

// Headers IETF em cada resposta
// X-RateLimit-Limit: 60 (req/min para Starter)
// X-RateLimit-Remaining: 45
// X-RateLimit-Reset: 1711353600
// X-Quota-Tokens-Remaining: 87234
```

**Prevenção automática:**
```ts
// SDK enfileira requisições se próximo do limite
const api = createSyra({ throttleRequests: true });

for (let i = 0; i < 100; i++) {
  await api.chat({ message: `Msg ${i}` }); // Zero risco de 429!
}
```

**Rate Limits por plano:**
- **Starter**: 60 req/min, 35k tokens/mês
- **Pro**: 300 req/min, 100k tokens/mês  
- **Scale**: Ilimitado, 500k tokens/mês

### 4️⃣ Observabilidade & Logging

Rastreamento completo com Request-ID único:

```ts
// Debug estruturado em 3 níveis
const api = createSyra({ 
  token: "sk_live_...",
  debug: "full"  // "off" | "minimal" | "full"
});

// Metadados em cada resposta
const res = await api.chat({ message: "Teste" });
console.log(res.$meta.requestId);    // "req_8f7b2c1a3d..."
console.log(res.$meta.latencyMs);    // 234
console.log(res.$meta.tokensUsed);   // 45
console.log(res.$meta.timestamp);    // 1711353600000

// Use requestId para suporte
if (res.$meta.latencyMs > 2000) {
  console.error(`Latência alta: ${res.$meta.requestId}`);
  // → Passar req_id ao abrir ticket
}
```

**Integração com APM (Datadog, Sentry, etc):**
```ts
// Interceptors para logging centralizado (v3.0+)
api.use((request) => {
  logger.info(`[${request.method}] ${request.url}`);
  return request;
});

api.use((response) => {
  logger.info(`[${response.status}] ${response.time}ms`, {
    requestId: response.headers['x-request-id']
  });
  return response;
});
```

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-rocket"></use></svg> Como Usar

### Local Development
```bash
# 1. Clone ou extraia os arquivos
cd st/

# 2. Abra no live server ou navegador
# Opção A: Duplo clique em index.html
# Opção B: live-server (se tiver extensão VS Code)
# Opção C: python -m http.server 8000

# 3. Acesse http://localhost:8000 ou file://path/to/st
```

### Deploy em Produção
- Hospede em **Vercel**, **Netlify**, ou **GitHub Pages** (static)
- Ou em server nginx/apache (configurar cache headers)
- Ou em CDN (CloudFlare, AWS S3 + CloudFront)

### Checklist Deploy
- [ ] Meta tags OG completas
- [ ] Google Analytics configurado
- [ ] Form action apontando para API backend
- [ ] SSL/HTTPS ativado
- [ ] Sitemap.xml gerado
- [ ] robots.txt configurado
- [ ] 404 custom page

---

## 🔗 Payment Integration

### Asaas Links (Starter & Pro)
- **Starter (R$14,90)**: https://www.asaas.com/c/igad1oxkr5e7kyu7
- **Pro (R$24,90)**: https://www.asaas.com/c/x5a9t5df4oc7madh

Links abrem em nova aba (target="_blank"), redirect automático após checkout.

### Scale (R$99,90)
- **Não tem link automático** (contato direito)
- Botão "Solicitar Scale" <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> contato.html
- Inclui: 500k tokens, Sory Vision, Syra Bridge, IoT, ambientes exclusivos, eventos, SLA 99.99%
- Time de vendas responde via syradevops@gmail.com com proposta customizada

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-key"></use></svg> Sobre o Token / API Key

### ⚠️ Obrigatório em TODAS as funções

Para garantir **segurança e controle de acesso**, o token deve ser enviado em **TODAS** as chamadas à API SyraOS. Sem o token, a requisição será rejeitada com erro de autenticação.

**Exemplo de uso:**
```javascript
// Sua chave (exemplo)
const token = "sk_live_gvegb1856fvev4eve5v4";

// Inicializar com o token UMA VEZ
const syra = createSyra({ token: token });

// Agora QUALQUER função automáticamente inclui o token:
await syra.teste({ valor: 5 })          // Token aqui ✓
await syra.chat({ message: "Olá" })     // Token aqui ✓
await syra.models()                      // Token aqui ✓
```

### 🔒 Mantendo seu token seguro

1. **Nunca compartilhe** seu token com ninguém
2. **Não exponha** em código público (GitHub, repositórios, etc)
3. **Use variáveis de ambiente** (`process.env.SYRA_TOKEN`)
4. **Regenere** a chave se suspeitar que foi comprometida
5. **Nunca forneça** por email, chat ou ligação

```javascript
// ✅ Correto - usando variável de ambiente
const syra = createSyra({ token: process.env.SYRA_TOKEN });

// ❌ ERRADO - expõe o token no código
const syra = createSyra({ token: "sk_live_gvegb1856fvev4eve5v4" });
```

### Importante: Verificação de Segurança

Qualquer comunicação **oficial** da Syra Cloud contendo seu token vem **exclusivamente** de **syradevops@gmail.com**. Desconfie de emails:
- De outros endereços reclamando sobre seu token
- Pedindo que você confirme ou redefina seu token
- Com links suspeitos ou pedindo verificação de conta

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-code"></use></svg> SDKs Disponíveis (v2.2.0)

Escolha a linguagem que você usa. Todos incluem o token obrigatório automaticamente em TODAS as requisições.

### TypeScript
```ts
import { createSyra } from "syraos.ts";

const api = createSyra({
  token: process.env.SYRA_TOKEN,
  debug: true
});

const models = await api.v1.models();
const res = await api.chat({ message: "Olá!" });
```

### JavaScript
```js
import { createSyra } from "syraos.js";

const api = createSyra({
  token: process.env.SYRA_TOKEN
});

await api.models();
await api.chat({ message: "Olá!" });
```

### Python
```python
from syraos import Syra
import os

api = Syra(token=os.getenv("SYRA_TOKEN"))

models = api.models()
res = api.chat({"message": "Olá!"})
```

**Baixe os arquivos:** [Downloads page](downloads.html)

---

Todos os planos enviam email automático de **syradevops@gmail.com** contendo:
- <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-key"></use></svg> API Token (formato sk_live_xxxxx) - **MANTENHA SEGURO**
- <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-desktop"></use></svg> Link para painel personalizado
- 📚 Docs com exemplos pré-preenchidos
- <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-rocket"></use></svg> Guia de 4 passos para começar

**Segurança:** Sempre verifique remetente (syradevops@gmail.com). **Nunca compartilhe seu token com ninguém**.

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-email"></use></svg> Contact Form

### Atual (Mailto)
```html
<form action="mailto:syradevops@gmail.com" method="POST" enctype="text/plain">
```

### Recomendado (Backend)
```javascript
// Criar endpoint POST /api/contact
POST /api/contact
Body: { nome, email, telefone, empresa, assunto, mensagem }
Resposta: { success: true, message: "Recebemos sua mensagem" }
```

---

## ✅ Checklist de Manutenção

- [ ] Verificar se icons.svg está carregando (DevTools Network)
- [ ] Testar todos os links de redes sociais em contato.html
- [ ] Testar todos os links (href's)
- [ ] Verificar forms em navegadores diferentes
- [ ] Validar HTML com W3C validator
- [ ] Testar responsivo em mobile (Chrome DevTools)
- [ ] Verificar performance (Lighthouse) - SVG otimiza tamanho
- [ ] Atualizar ano no footer (auto, mas confirme)
- [ ] Testar acessibilidade (keyboard navigation, ícones SVG visíveis)
- [ ] Confirmar todos os 10 links de nav funcionam
- [ ] Validar que 221 emojis foram convertidos para ícones

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-chart"></use></svg> Métricas de Sucesso

### KPIs do Website
- CTR de "Começar agora" <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> Pricing
- Taxa de conversão form contato
- Time on page (docs vs produto)
- Bounce rate por página
- Mobile vs Desktop traffic

### Otimizações Recomendadas
1. Adicionar heatmap (Hotjar)
2. Configurar UTM parameters
3. A/B test de CTAs
4. Chat widget (Intercom)
5. Email capture banner

---

## 🐛 Troubleshooting

### Menu não funciona
- Verificar if `scripts.js` está carregando
- Confirmar IDs: `menu-btn`, `menu`
- Check console.log para erros

### Formulário não envia
- Mailto pode não funcionar em alguns clientes
- Solução: Implementar backend API
- Teste: Abrir DevTools Network ao submeter

### Layout quebrado mobile
- Verificar breakpoint 860px em styles.css
- Confirmar viewport meta tag presente
- Test com Chrome DevTools device emulation

### Fonts não carregam
- Verificar conexão internet
- Check Google Fonts CDN status
- Fallback para serif já configurado

---

## 📝 Notas Importantes

1. **Sem database**: Website é 100% static, pronto para CDN
2. **Sem build**: HTML/CSS/JS puros, nenhuma compilação necessária
3. **SVG Icons**: 33 ícones vetoriais centralizados em icons.svg (melhor performance que emojis)
4. **Modular**: Cada página é independente, pode ser atualizada isoladamente
5. **Responsivo**: Testado em breakpoint 860px
6. **Performance**: Zero dependencies, load time mínimo, ícones otimizados
7. **SEO**: Estrutura semântica pronta
8. **Redes Sociais**: 6 canais integrados em contato.html com links diretos

---

## 👨‍💻 Para Desenvolvedores

### Usar ícones SVG
```html
<!-- Tamanho padrão (24px) -->
<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-rocket"></use></svg>

<!-- Tamanho menor (20px) para inline -->
<svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg>

<!-- Ícones disponíveis: rocket, lightbulb, lock, key, email, check, close, arrow-right, etc -->
```

### Adicionar nova página
```bash
# 1. Criar novo arquivo (ex: blog.html)
# 2. Copiar estrutura de qualquer página existente
# 3. Manter header/footer padrão + injetar SVG de ícones
# 4. Adicionar link no nav-menu de todas as 10 páginas
# 5. Usar classes ._section, .grid-4, .grid-2, .card
```

### Scripts de automação
```bash
# Converter emojis para ícones SVG
python replace-emojis.py

# Injetar biblioteca SVG em todos os HTMLs
python inject-svg.py
```

### Modificar design
- Editar cores em `styles.css` `:root {}`
- Manter font Inter (já importada)
- Responsivo: testar em 860px

### Adicionar funcionalidade JS
- Editar `scripts.js`
- Manter código limpo e comments
- Testar menu toggle após mudanças

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-phone"></use></svg> Suporte

**Email**: syradevops@gmail.com
**Telefone**: (32) 99953-0234
**Website**: syradevops.com

---

## 📄 License

© 2026 SyraOS / SyraDevOps. Todos os direitos reservados.

Termos: [terms.html](terms.html)
Privacidade: [privacy.html](privacy.html)

---

## 📣 Redes Sociais

Conecte-se conosco nos seguintes canais:
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-star"></use></svg> **Instagram**: @SyraDevOps
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-star"></use></svg> **X/Twitter**: @SyraDevOps
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-star"></use></svg> **GitHub**: @SyraDevOps
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-star"></use></svg> **LinkedIn**: SyraCit Company
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-star"></use></svg> **YouTube**: @SyRaDevOps
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-star"></use></svg> **Twitch**: @syradevops

Todos os links estão disponíveis em [contato.html](contato.html).

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-rocket"></use></svg> Histórico de Versões

### v2.2 - Collaboration Logos + Social Proof
**Data**: Março 2026
**Mudanças Principais**:
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> **Seção Prova Social Expandida**: Agora exibe mensagem de credibilidade institucional: "Usado por mais de 50 Instituições, e 35 Projetos, além de participação direta em 15 programas comunitários"
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> **Logo Gallery**: 3 logos de organizações parceiras (Planetário, Movimento Negro São João del-Rei 2019, UFSJ) com efeito hover (grayscale → color, scale 1.05)
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> **Nova Classe CSS `.logo-gallery`**: Grid responsivo com padding/margin padronizado, fallback para mobile (1 coluna)
- <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg> **Logo Files**:
  - `logo-planetario.png` (Planetário de São João del-Rei)
  - `logo-movimento-negro.png` (Movimento Negro São João del-Rei 2019)
  - `logo-ufsj.png` (UFSJ - Universidade Federal de São João del-Rei)
- **Impacto SEO**: Aumenta credibilidade e confiança através de prova social visual com organizações reais

### v2.1 - SVG Icons + Social Media Integration
**Data**: Março 2026
- 33 ícones SVG em biblioteca centralizada (icons.svg)
- 221 emojis convertidos para ícones profissionais
- 6 canais de redes sociais em contato.html (Instagram, X, GitHub, LinkedIn, YouTube, Twitch)
- Automação com scripts Python (replace-emojis.py, inject-svg.py)

---

**Última atualização**: Março 2026
**Versão do site**: 2.2 (Collaboration Logos + Social Proof Integration)

