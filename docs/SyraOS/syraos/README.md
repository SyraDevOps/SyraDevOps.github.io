# <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-package"></use></svg> SyraOS SDK (v2.2.0)

Uma forma simples, dinâmica e poderosa de consumir a API da **Syra DevOps**.

Sem boilerplate. Sem complicação. Apenas:

```ts
const syra = createSyra({ token: "sk_live_xxxxx" });
await syra.teste({ valor: 5 })
```

E automaticamente isso vira:

```
GET https://api.syradevops.com/teste?valor=5
Authorization: Bearer sk_live_xxxxx
```

⚠️ **IMPORTANTE**: Token é **obrigatório em TODAS as requisições** para garantir segurança e controle de acesso.

---

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lock"></use></svg> Segurança: Token obrigatório

O token **deve ser passado na inicialização** e é automaticamente incluído em **TODAS** as requisições:

```ts
// ✅ CORRETO
const api = createSyra({ token: process.env.SYRA_TOKEN });
await api.chat({ message: "Olá" });  // Token incluído automaticamente

// ❌ ERRADO - Token exposto no código
const api = createSyra({ token: "sk_live_gvegb1856fvev4eve5v4" });
```

**Melhores práticas:**
1. Use variáveis de ambiente (`process.env.SYRA_TOKEN`)
2. Nunca commit o token no repositório
3. Regenere se suspeitar que foi comprometido
4. Nunca compartilhe com terceiros

---

Após **assinar um plano** (Starter ou Pro), você receberá um email de **syradevops@gmail.com** contendo:

- <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-key"></use></svg> **API Token** — Sua chave única (`sk_live_xxxxx`)
- <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-desktop"></use></svg> **Painel personalizado** — Dashboard com seu uso em tempo real
- 📚 **Docs personalizadas** — Exemplos já com seu token pré-preenchido
- <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-rocket"></use></svg> **Guia rápido** — 4 passos para começar em minutos

⚠️ **Segurança**: Sempre verifique que o email vem de **syradevops@gmail.com**. Nunca compartilhe seu token.

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-rocket"></use></svg> Instalação

### TypeScript / JavaScript

```bash
npm install syraos
```

ou manual (copie os arquivos):

```ts
import { createSyra } from "./syraos.ts";
```

### Python

```bash
pip install syraos
```

ou manual:

```python
from syraos import Syra
```

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lightning"></use></svg> Uso básico

### TypeScript

```ts
import { createSyra } from "syraos";

const syra = createSyra({
  token: "sk_live_YOUR_KEY"
});

const res = await syra.teste({ valor: 5 });
console.log(res);
```

### JavaScript

```js
import { syra } from "syraos";

const res = await syra.teste({ valor: 5 });
console.log(res);
```

### Python

```python
from syraos import Syra

api = Syra(token="sk_live_YOUR_KEY")
res = api.teste({"valor": 5})
print(res)
```

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-brain"></use></svg> Como funciona

**Tudo depois de `syra.` vira automaticamente uma rota da API:**

```ts
// Chamadas
syra.usuario({ id: 1 })
syra.minds({ type: "chat" })
syra.chat({ message: "Olá!", context: { user: 1 } })

// Viram URLs
// GET /usuario?id=1
// GET /minds?type=chat
// GET /chat?message=...&context[user]=1
```

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-package"></use></svg> Suporte a parâmetros

### ✅ Valores simples

```ts
syra.teste({ valor: 5 })
// <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> ?valor=5
```

### ✅ Arrays

```ts
syra.teste({ ids: [1, 2, 3] })
// <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> ?ids[]=1&ids[]=2&ids[]=3
```

### ✅ Objetos (nested)

```ts
syra.teste({
  filtro: {
    nome: "syra",
    idade: 20
  }
})
// <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> ?filtro[nome]=syra&filtro[idade]=20
```

### ✅ Métodos HTTP

Por padrão: `GET`

```ts
// POST
await syra.teste({ valor: 5 }, { method: "POST" });

// PUT
await syra.teste({ valor: 5 }, { method: "PUT" });

// DELETE
await syra.teste({ id: 5 }, { method: "DELETE" });
```

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lock"></use></svg> Autenticação

Token é enviado automaticamente no header `Authorization: Bearer`

### Configuração com token

```ts
import { createSyra } from "syraos";

const syra = createSyra({
  token: "sk_live_YOUR_API_KEY"
});

// Pronto! Todas as requisições incluem o token
const res = await syra.models();
```

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-gear"></use></svg> Configuração completa

```ts
const syra = createSyra({
  baseURL: "https://api.syracloud.com",    // URL base da API
  token: "sk_live_YOUR_KEY",                // Bearer token
  debug: true                               // Log de requisições
});
```

---

## 🧪 Debug

Ativa logs no console para debugging:

```ts
const syra = createSyra({ 
  token: "123",
  debug: true 
});

// No console mostra:
// Syra Request: { url, method, params }
```

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-globe"></use></svg> Compatibilidade

| Ambiente | Status |
|----------|--------|
| React | ✔ |
| Next.js | ✔ |
| Expo / React Native | ✔ |
| Node.js | ✔ |
| HTML (via script) | ✔ |
| Browsers | ✔ |

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lightbulb"></use></svg> Exemplo completo

```ts
import { createSyra } from "syraos";

const api = createSyra({
  token: "sk_live_abc123",
  debug: true
});

// Chat com contexto e tags
const res = await api.chat({
  message: "Olá IA!",
  context: {
    user: "João",
    session: "sess_123"
  },
  tags: ["ai", "chat", "test"]
});

console.log(res);
// {
//   id: "msg_xyz",
//   content: "Olá João! Como posso ajudar?",
//   tokens_used: 45
// }
```

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-fire"></use></svg> Casos de uso comuns

### Listar modelos

```ts
const models = await syra.v1.models();
```

### Chat/Completions

```ts
const chat = await syra.v1.completions({
  model: "sory-1.5",
  messages: [
    { role: "system", content: "Você é um assistente útil" },
    { role: "user", content: "Olá!" }
  ],
  max_tokens: 100
});
```

### Embeddings

```ts
const embedding = await syra.v1.embeddings({
  input: "Texto para vetorizar",
  model: "syra-embed"
});
```

### Executar Mind (Agente)

```ts
const mind = await syra.v1.agents.run({
  mind_id: "mind_chatbot",
  input: "Qual é a sua missão?",
  context: { user_id: "123" }
});
```

### POST com body

```ts
const result = await syra.v1.minds.create(
  {
    name: "Meu Mind",
    description: "Um agente customizado",
    nodes: [...]
  },
  { method: "POST" }
);
```

---

## Criando e Usando Minds com Estrutura Completa

**Minds** são agentes inteligentes que você cria uma vez e reutiliza infinitas vezes. Cada Mind é salvo no sistema com configurações completas de interpretação, regras e estilo de resposta.

### Estrutura Completa do Mind (JSON)

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
    "context": "Usuário busca expressão emocional",
    "interpretation": "Interprete como um desabafo pessoal",
    "response_style": "Tom acolhedor, humano e íntimo",
    "restrictions": "Não julgar, não ser frio, não dar respostas genéricas",
    "thinking": "Reflita antes de responder sobre cada aspecto",
    "rules": "Sempre valide entrada antes de processar"
  }
}
```

### Criar uma Mind Completa

```ts
const api = createSyra({ token: "sk_live_..." });

const mind = await api.minds.create({
  name: "SyraAI",
  code: "0001",
  authors: ["Syra", "Quim"],
  system: {
    context: "Usuário busca expressão emocional",
    interpretation: "Interprete como um desabafo pessoal",
    response_style: "Tom acolhedor, humano e íntimo",
    restrictions: "Não julgar, não ser frio, não dar respostas genéricas",
    thinking: "Reflita antes de responder",
    rules: "Sempre valide entrada"
  },
  version: "1.0",
  active: true
}, { method: "POST" });

console.log(mind.id); // "mind_syraai_0001"
console.log(mind.created_at); // "2026-03-26"
```

### Consultar Mind por ID

```ts
const mind = await api.minds.get({ id: "mind_syraai_0001" });

console.log(mind.name);          // "SyraAI"
console.log(mind.version);       // "1.0"
console.log(mind.system.context); // "Usuário busca expressão emocional"
console.log(mind.authors);       // ["Syra", "Quim"]
```

### Usar Mind em um Chat

```ts
const response = await api.chat({
  message: "Estou me sentindo desanimado com tudo",
  mind_id: "mind_syraai_0001",  // Usar Mind existente
  context: { user_id: "user_123" }
});

console.log(response.content); 
// Resposta seguindo o estilo, restrições e pensamentos do Mind
```

### Listar todas as Minds do Usuário

```ts
const minds = await api.minds.list({ limit: 10, offset: 0 });

minds.forEach(m => {
  console.log(`${m.name} (v${m.version}) - Criado em ${m.created_at}`);
  console.log(`  Autor: ${m.authors.join(", ")}`);
  console.log(`  Contexto: ${m.system.context}`);
});
```

### Atualizar Mind (Configuração)

```ts
const updated = await api.minds.update(
  { id: "mind_syraai_0001" },
  {
    system: {
      context: "Novo contexto",
      response_style: "Tom mais professoral",
      thinking: "Novo pensamento"
    },
    version: "1.1"
  },
  { method: "PUT" }
);

console.log(updated.version); // "1.1"
```

### Exportar Mind para Compartilhamento

```ts
const exported = await api.minds.export({ 
  id: "mind_syraai_0001" 
});

console.log(exported.qr_code);   // URL do QR Code
console.log(exported.share_url); // Link para importar em outro usuário
```

### Deletar Mind

```ts
await api.minds.delete({ id: "mind_syraai_0001" }, { method: "DELETE" });
console.log("Mind deletada com sucesso");
```ts
await api.minds.delete({ id: "mind_syraai_0001" }, { method: "DELETE" });
console.log("Mind deletada com sucesso");
```

---

## 🏢 4 Pilares Críticos: Enterprise Standards (v3.0+)

Estes 4 pilares implementam padrões production-grade que elevam o SyraOS ao nível de Big Tech.

### Pilar 1️⃣: Testing com Mock Mode

**Problema:** Cada teste gasta tokens reais. Inviável para CI/CD.

**Solução:** SDK em modo mock simula respostas sem contar na cota.

```ts
// ✅ Modo teste - sem gastar tokens
const api = createSyra({ 
  token: "sk_test_xxxxx",  // Começa com sk_test_
  mock: true  // Simula respostas
});

// Retorna dados fake com estrutura real
const res = await api.chat({ message: "Teste" });
// { id: "msg_mock_123", content: "Mock response", tokens_used: 0 }

// ✅ Em testes unitários
import { mockSyraResponse } from "syraos/testing";

mockSyraResponse('chat', { content: "Resposta esperada", tokens_used: 5 });

// Seu teste roda sem gastar tokens
expect(await api.chat(...)).toBe("Resposta esperada");
```

**Diferenças:**

| Tipo | Token | Latência | Custo | Uso |
|------|-------|----------|-------|-----|
| **sk_live_** | Real | ~200ms | Gasta tokens | Produção |
| **sk_test_** | Teste | ~100ms (fake) | Zero | Dev/Tests |

### Pilar 2️⃣: Tratamento de Erros + Retry Automático

**Problema:** Sem padronização de erros, cada caso requer lógica diferente.

**Solução:** Classes de erro tipadas + retry automático com backoff.

```ts
import {
  SyraAuthError,
  SyraRateLimitError, 
  SyraValidationError,
  SyraAPIError 
} from "syraos/errors";

try {
  await api.chat({ message: "Olá" });
} catch (error) {
  if (error instanceof SyraAuthError) {
    // Erro 401/403 - token inválido/expirado
    console.log("Token inválido. Regenere em Settings.");
  } else if (error instanceof SyraRateLimitError) {
    // Erro 429 - limite atingido
    console.log(`Aguarde ${error.retryAfter}s antes de retentar.`);
    // SDK já faz retry automático!
  } else if (error instanceof SyraValidationError) {
    // Erro 400 - parâmetro inválido
    console.log(`Campo inválido: ${error.field}`);
  } else if (error instanceof SyraAPIError) {
    // Erro genérico 5xx
    console.log(`Server error: ${error.status} - ${error.message}`);
  }
}
```

**Retry automático com backoff exponencial:**

```ts
const api = createSyra({
  token: "sk_live_...",
  retries: 3,              // Tenta até 3 vezes
  timeout: 5000,           // 5 segundos máximo
  backoff: "exponential"   // 1s → 2s → 4s
});

// Se falha com 503/429, SDK retenta automaticamente
// Você recebe resultado ou erro final
await api.chat({ message: "Importante" });
```

**Formato padrão dos erros:**

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_TOKEN",
    "message": "Token expirou",
    "status": 401,
    "help_url": "https://docs.syraos.com/errors#AUTH_INVALID_TOKEN"
  }
}
```

### Pilar 3️⃣: Rate Limiting & Quotas

**Problema:** Limite silencioso, cliente descobre quando leva erro 429.

**Solução:** Headers IETF + prevenção automática + getLimits().

```ts
// Verificar limites em tempo real
const limits = api.getLimits();

console.log(`Tokens: ${limits.tokensRemaining} / ${limits.tokensLimit}`);
// Output: "Tokens: 87234 / 100000"

console.log(`Req/min: ${limits.requestsRemaining} / ${limits.requestsLimit}`);
// Output: "Req/min: 42 / 60" (Starter plan)

console.log(`Reset em: ${limits.resetAt}`);
// Output: "Reset em: 2026-03-31T23:59:59Z"

// ⚠️ Se próximo do limite, aguarde
if (limits.tokensRemaining < 5000) {
  console.warn("⚠️ Cota baixa. Reset mês que vem.");
}
```

**Headers IETF enviados em cada response:**

```
HTTP/1.1 200 OK
X-RateLimit-Limit: 60               # Req/min permitidas
X-RateLimit-Remaining: 42           # Restantes NESTE minuto
X-RateLimit-Reset: 1711436400       # Unix timestamp do reset
X-Quota-Tokens-Remaining: 87234     # Tokens restantes este mês
X-Request-ID: req_8f7b2c1a3d9e2f5a  # ID único para tracking
```

**Prevenção automática (enfileiramento):**

```ts
// SDK enfileira requisições se próximo do limite
const api = createSyra({
  token: "sk_live_...",
  throttleRequests: true  // Automático
});

// 100 requisições, mas enfileiradas respeitando limites
for (let i = 0; i < 100; i++) {
  // ✅ SDK gerencia fila - ZERO risco de 429
  await api.chat({ message: `Msg ${i}` });
}
```

**Limites por plano:**

| Plano | Rate Limit | Tokens/Mês | Retry Auto |
|-------|-----------|-----------|-----------|
| Starter | 60 req/min | 35.000 | ✔ |
| Pro | 300 req/min | 100.000 | ✔ |
| Scale | Ilimitado | 500.000 | ✔ |

### Pilar 4️⃣: Observabilidade & Logging

**Problema:** Sem Request-ID, impossível debugar em produção.

**Solução:** $meta em cada resposta + debug estruturado.

```ts
// Debug em 3 níveis
const api = createSyra({
  token: "sk_live_...",
  debug: "minimal"  // "off" | "minimal" | "full"
});

// Nível OFF: Nenhum log
// Nível MINIMAL: [SyraOS] GET /chat ✓ 234ms
// Nível FULL: Detalhes completos (params, headers, response)

const res = await api.chat({ message: "Teste" });

// ✨ Metadados em cada resposta
console.log(res.$meta);
// {
//   requestId: "req_8f7b2c1a3d9e2f5a",
//   latencyMs: 234,
//   timestamp: 1711353600000,
//   tokensUsed: 45,
//   model: "sory-1.5",
//   status: 200
// }

// Usar para suporte/debugging
if (res.$meta.latencyMs > 2000) {
  console.error(`🐢 Latência alta: ${res.$meta.requestId}`);
  // Passar req_id ao abrir ticket: "req_8f7b2c..."
}
```

**Integração com ferramentas de APM (Datadog, Sentry, etc):**

```ts
import { createSyra } from "syraos";
import winston from "winston";  // ou Pino, Bunyan, etc

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "app.log" })]
});

const api = createSyra({ token: "sk_live_..." });

// ✨ Interceptors para logging centralizado (v3.0+)
api.use((request) => {
  logger.info(`[${request.method}] ${request.url}`, {
    timestamp: new Date().toISOString()
  });
  return request;
});

api.use((response) => {
  logger.info(`Response [${response.status}]`, {
    requestId: response.headers['x-request-id'],
    latency: response.time
  });
  return response;
});

// Agora todos os requests são registrados com Request-ID
await api.chat(...); // Logado automaticamente
```

**Exemplo de log estruturado:**

```logs
{
  "timestamp": "2026-03-26T15:00:45Z",
  "method": "GET",
  "url": "/chat",
  "requestId": "req_8f7b2c1a3d9e2f5a",
  "status": 200,
  "latency": 234,
  "tokensUsed": 45,
  "userId": "user_123"
}
```

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-puzzle"></use></svg> Arquitetura interna

### TypeScript (`syraos.ts`)

- ✔ Tipos completos e type-safe
- ✔ Proxy mágico para rotas dinâmicas
- ✔ Build query com suporte a arrays/nested
- ✔ Fetch nativo do browser

### JavaScript (`syraos.js`)

- ✔ Sintaxe ES6 moderna
- ✔ Proxy para rotas dinâmicas
- ✔ Mesmo build query
- ✔ Compatível com Node.js e browsers

### Python (`syraos.py`)

- ✔ Orientado a objetos
- ✔ Requests HTTP
- ✔ Build query com urllib
- ✔ Suporte a contexto manager

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-trophy"></use></svg> Por que SyraOS é diferente?

### <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lightning"></use></svg> 1. Zero boilerplate (maior diferencial)

Você escreve:

```ts
await syra.chat({ message: "Olá!" })
```

Sem precisar de:
- classes
- factory patterns
- configuração de rotas
- imports específicos

Isso é ouro. Lembrança de libs modernas: **Axios, Supabase, Stripe SDK**.

### <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-brain"></use></svg> 2. Proxy dinâmico = escalável infinitamente

Novas rotas na API = **ZERO mudanças no SDK**.

```ts
// Sua API adiciona um novo endpoint?
// Bloco de código abaixo funcionará AUTOMATICAMENTE

await syra.novo_endpoint({ params })
```

✔ Reduz manutenção  
✔ Mais rápido de evoluir  
✔ Menos breaking changes

### <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-puzzle"></use></svg> 3. Query complexa de verdade

Cobrimos 90% dos casos reais:

```ts
// Arrays
syra.search({ ids: [1, 2, 3] })

// Nested objects
syra.filter({ 
  user: { age_min: 18, age_max: 65 },
  tags: ["vip", "beta"]
})

// Tudo isso vira queries PHP-style
```

### <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-globe"></use></svg> 4. Multiplataforma com exemplos reais

Não é só "suportamos" — mostramos como:

```ts
// TypeScript
const api = createSyra({ token: "..." })

// JavaScript
import { syra } from "syraos"

// Python
api = Syra(token="...")
```

### <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lock"></use></svg> 5. Auth automática e segura

```ts
Authorization: Bearer {token}
```

Sem fricção. Padrão de mercado. ✔

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-rocket"></use></svg> Roadmap (v3.0) — Próximas features

### <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-star"></use></svg> Tipagem forte (PRÓXIMO)

**Problema atual**: IDE não oferece autocomplete

**Solução v3.0**:

```ts
import { syra } from "syraos";

// <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-sparkles"></use></svg> Autocomplete automático
await syra.chat({
  message: "", // ✔ string obrigatória
  context?: {  // ✔ opcional
    user_id: string,
    session: string
  },
  tags?: string[]
})
```

**Implementação**:
- Gerar tipos a partir do schema da API
- Ou usar OpenAPI/Swagger
- TypeScript native, zero runtime overhead

---

### 🛡️ Tratamento de erros padrão

**Problema atual**: Erros soltos

**Solução v3.0**:

```ts
try {
  await syra.chat({ ... })
} catch (err) {
  if (err.code === "INVALID_TOKEN") {
    // Renovar token
  }
  
  if (err.code === "RATE_LIMITED") {
    // Aguardar
  }
  
  console.error(err.message);
}
```

**Response padrão**:

```ts
{
  success: false,
  error: {
    code: "AUTH_FAILED",
    message: "Token inválido",
    status: 401,
    timestamp: 1234567890
  }
}
```

---

### 🔌 Interceptors / Middlewares

**Problema atual**: Sem poder customizar requests/responses

**Solução v3.0**:

```ts
const api = createSyra({ token: "..." });

// Adicionar logging padrão
api.use((request) => {
  console.log(`[${request.method}] ${request.url}`);
  return request;
});

// Adicionar header customizado
api.use((request) => {
  request.headers["X-Track-Id"] = generateId();
  return request;
});

// Interceptar responses
api.use((response) => {
  if (response.ok) {
    console.log("✔ Sucesso");
  }
  return response;
});
```

**Casos de uso**:
- Logging centralizado
- Metricas
- Cache automático
- Retry com backoff

---

### 📤 Auto-switch GET <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> POST

**Problema atual**: Tudo é GET por padrão

**Risco**: URLs muito longas, dados sensíveis na query

**Solução v3.0**:

```ts
const api = createSyra({
  autoMethod: true  // Detecta automaticamente
});

// Pequeno <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> GET
await api.search({ q: "user" })
// GET /search?q=user

// Grande (>2KB) <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> POST
await api.search({ 
  filters: { ... },
  large_dataset: [...]
})
// POST /search com body
```

---

### 🐛 Debug + Performance

**v3.0 Evolution**:

```ts
const api = createSyra({
  debug: "full"  // "off" | "minimal" | "full"
});

// Console mostra:
// [SyraOS] GET /chat
// ├─ params: { message: "..." }
// ├─ duration: 234ms
// ├─ status: 200
// └─ response size: 4.2KB
```

---

### ⏱️ Timeout + Retry automático

**Produção exige resiliência**:

```ts
const api = createSyra({
  timeout: 5000,        // 5s por request
  retries: 3,           // 3 tentativas
  retryDelay: 1000,     // 1s entre tentativas
  backoff: "exponential" // 1s <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> 2s <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> 4s
});

// Automático:
// Request 1 <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> timeout
// Request 2 <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> timeout
// Request 3 <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> sucesso! ✔
```

---

### 🏗️ Versionamento flexível

**Hoje**: `syra.v1.models()`

**v3.0**: Mais flexível:

```ts
const api = createSyra({
  version: "v2",        // Padrão v2
  apiVersion: 2         // ou numérico
});

// Todos os requests usam /v2/
await api.chat({ ... }) // <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> POST /v2/chat
```

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-brain"></use></svg> Ideias Avançadas (v4.0 e além)

### 🤖 1. SDK com IA embutida

```ts
// Gerar automaticamente queries
const answer = await syra.ai.smart({
  question: "Quem são meus top 10 clientes?",
  context: "Tenho dados em users, orders, payments"
});

// Internamente: gera query automática
// SELECT ... FROM users JOIN orders
```

---

### 🔌 2. Plugin system

```ts
import { syra } from "syraos";
import { cachePlugin } from "@syraos/cache";
import { loggerPlugin } from "@syraos/logger";

const api = createSyra({ token: "..." });

api.use(cachePlugin({ ttl: 300 }))
api.use(loggerPlugin({ level: "debug" }))

// Plugins fazem o trabalho pesado
```

---

### <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-chart"></use></svg> 3. Observabilidad built-in

```ts
const api = createSyra({ token: "..." });

// Métricas automáticas
const metrics = api.metrics();
// {
//   requests_total: 1543,
//   latency_avg: 245,
//   latency_p95: 1200,
//   errors_count: 12,
//   cache_hits: 789
// }
```

---

### 🧪 4. Mock automático (pra testes)

```ts
const api = createSyra({
  token: "sk_test_...",
  mock: true  // Modo teste
});

// Retorna dados fake realistas
await api.users.list()
// {
//   data: [ ... ] com 50 usuários fake
// }

// Perfeitopara:
// - testes unitários
// - frontend development
// - demos
```

---

### <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lock"></use></svg> 5. Geração automática de tipos

```bash
syraos generate --api https://api.syracloud.com
```

Gera automaticamente:

```ts
// types.generated.ts
export type ChatRequest = {
  message: string;
  context?: ChatContext;
  mode: "fast" | "detailed"
}

export type ChatResponse = {
  id: string;
  content: string;
  tokens_used: number;
}
```

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-chart"></use></svg> Comparação: Como SyraOS se posiciona

| Feature | SyraOS | Axios | Stripe SDK | Supabase |
|---------|--------|-------|-----------|----------|
| Zero boilerplate | ✔ | ✖ | ✖ | ✖ |
| Proxy dinâmico | ✔ | ✖ | ✖ | ✖ |
| Tipagem forte | ⏳ v3.0 | ✖ | ✔ | ✔ |
| Interceptors | ⏳ v3.0 | ✔ | ✔ | ✔ |
| Retry automático | ⏳ v3.0 | ⏳ | ✔ | ✔ |
| Documentação | ✔ | ✔ | ✔ | ✔ |
| TypeScript | ✔ | ✔ | ✔ | ✔ |
| Python | ✔ | ✖ | ✖ | ✖ |

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-brain"></use></svg> Resumo da filosofia

A SyraOS foi criada para ser:

- **<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lightning"></use></svg> Rápida** — Zero overhead, direto ao ponto
- **<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-brain"></use></svg> Inteligente** — Detecta tipos e formata automaticamente
- **<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-fire"></use></svg> Simples** — Sem boilerplate desnecessário
- **<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-puzzle"></use></svg> Extensível** — Funciona com qualquer rota da API
- **<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-chart"></use></svg> Escalável** — Cresce com sua aplicação

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-fire"></use></svg> Planos e funcionalidades por nível

### <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-package"></use></svg> Starter (Agora disponível)

```ts
const api = createSyra({ token: "sk_live_..." });

await api.models()           // ✔
await api.chat({ ... })      // ✔
await api.embeddings({ ... }) // ✔
```

**Ideal para:**
- Protótipos
- MVPs
- Desenvolvimento
- Testes

**Limitações**: Sem interceptors, debug básico, sem retry automático

---

### <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-rocket"></use></svg> Pro (Roadmap v3.0)

```ts
const api = createSyra({
  token: "sk_live_...",
  debug: "full",           // ✔ novo
  timeout: 5000,           // ✔ novo
  retries: 3,              // ✔ novo
  autoMethod: true         // ✔ novo
});

// Tipagem forte automática
await api.chat({
  message: "",      // autocomplete ✔
  context?: {},     // tipado ✔
  tags: ["ai"]
})

// Interceptors
api.use(cachePlugin())
api.use(loggerPlugin())
```

**Ideal para:**
- Produção
- Apps críticas
- Equipes grandes
- Performance importante

**Novos poderes**:
- Auto-tipagem
- Retry com backoff
- Interceptors
- Debug avançado

---

### <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-brain"></use></svg> Enterprise (Roadmap v4.0)

```ts
const api = createSyra({
  token: "sk_live_...",
  plugins: [
    cachePlugin({ ttl: 3600 }),
    metricsPlugin(),
    auditPlugin(),
    aiAutoQueryPlugin()
  ],
  observability: {
    metrics: true,
    tracing: true,
    APM: "datadog"
  }
});

// IA gera queries automáticamente
const data = await api.ai.smart({
  question: "Top 10 clientes por revenue",
})

// Tipagem customizada
await api.custom.endpoint<MyType>({ ... })

// Métricas automáticas
api.metrics()
```

**Ideal para:**
- Startups de IA
- PLataformas complexas
- Observabilidade crítica
- Teams distribuídas

**Superpoderes**:
- IA gerando queries
- Geração automática de tipos
- Observabilidade 360°
- Cache distribuído

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-chart"></use></svg> Exemplos por caso de uso

### 1️⃣ Usar SyraOS em um projeto pequeno

```ts
// frontend/lib/api.ts
import { syra } from "syraos";

export const api = syra;

// components/Chat.tsx
import { api } from "@/lib/api";

export default function Chat() {
  const handleSend = async (message: string) => {
    const res = await api.chat({
      message,
      user_id: getCurrentUser().id
    });
    
    console.log(res);
  };
}
```

---

### 2️⃣ Usar com TypeScript (v3.0)

```ts
import { createSyra } from "syraos";

const api = createSyra({ token: "sk_..." });

// <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-sparkles"></use></svg> Tipos gerados automaticamente
const response = await api.chat<ChatResponse>({
  message: "Olá", // ✔ string
  context: {       // ✔ tipado
    user_id: "123"
  }
});

// Type-safe
console.log(response.tokens_used); // ✔
console.log(response.invalid_field); // ❌ erro de tipo
```

---

### 3️⃣ Usar com cache (v3.0)

```ts
import { createSyra } from "syraos";
import { cachePlugin } from "@syraos/cache";

const api = createSyra({ token: "sk_..." });

// Cache 5 minutos
api.use(cachePlugin({
  ttl: 300,
  storageKey: "syra_cache"
}));

// Primeira chamada <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> hit na API
const users1 = await api.users.list();

// Segunda chamada <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> vem do cache
const users2 = await api.users.list();
```

---

### 4️⃣ Usar com retry (v3.0)

```ts
const api = createSyra({
  token: "sk_...",
  retries: 3,
  timeout: 5000,
  backoff: "exponential"
});

// Falha? Tenta novamente automaticamente
const res = await api.chat({ message: "..." });
// Se falhar: 1s <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> 2s <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> 4s <svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> sucesso
```

---

### 5️⃣ Usar com interceptors (v3.0)

```ts
const api = createSyra({ token: "sk_..." });

// Log de todos os requests
api.use((request) => {
  console.log(`<svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg> ${request.method} ${request.url}`);
  return request;
});

// Log de responses
api.use((response) => {
  console.log(`← ${response.status} (${response.time}ms)`);
  return response;
});

// Error handling centralizado
api.use((error) => {
  if (error.status === 401) {
    refreshToken();
  }
  throw error;
});
```

---

### 6️⃣ Usar em React com hooks

```ts
// hooks/useSyraChat.ts
import { useState } from "react";
import { api } from "@/lib/api";

export function useSyraChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const chat = async (message: string) => {
    setLoading(true);
    try {
      const res = await api.chat({ message });
      return res;
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { chat, loading, error };
}

// Usage
export default function App() {
  const { chat, loading } = useSyraChat();
  
  return (
    <button onClick={() => chat("Olá!")} disabled={loading}>
      {loading ? "..." : "Chat"}
    </button>
  );
}
```

---

### 7️⃣ Usar em Node.js com TypeScript

```ts
import { createSyra } from "syraos";

const api = createSyra({
  token: process.env.SYRA_API_KEY,
  debug: process.env.NODE_ENV === "development"
});

async function processOrders() {
  const orders = await api.orders.list({
    status: "pending",
    limit: 100
  });

  for (const order of orders) {
    const analysis = await api.analyze({
      data: order,
      model: "sory-1.5"
    });

    console.log(`Order ${order.id}: ${analysis.summary}`);
  }
}

processOrders().catch(console.error);
```

---

### 8️⃣ Usar com Python

```python
from syraos import Syra

api = Syra(
  token="sk_live_...",
  debug=True
)

# Listar modelos
models = api.models()

# Chat
response = api.chat({
  "message": "Olá",
  "context": {"user_id": "123"}
})

print(response['content'])

# Batch processing
users = api.users.list({"status": "active"})

for user in users['data']:
  result = api.analyze({"input": user['data']})
  print(f"User {user['id']}: {result['score']}")
```

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-star"></use></svg> Quando usar cada versão

| Situação | Recomendação |
|----------|--------------|
| MVP / Prototipagem | **Starter** (v2.0) |
| Projeto em produção | **Pro** (v3.0) |
| Startup de IA / Scale | **Enterprise** (v4.0) |
| Hobby / Learning | **Starter** (v2.0) |
| Equipe grande | **Enterprise** (v4.0) |
| Apps críticas | **Pro** com observability |

---

## 🐛 Troubleshooting

### "Token inválido"

```ts
// Verifique se o token está correto
const syra = createSyra({
  token: "sk_live_abc123"  // Deve começar com sk_live_
});
```

### "Rota não encontrada"

```ts
// Verifique a URL base
const syra = createSyra({
  baseURL: "https://api.syracloud.com",  // Correto
  debug: true  // Ativa logs
});
```

### "CORS error"

```
// Erro comum em browsers quando a API não usa CORS
// Solução: Use um proxy ou coloque a requisição no backend
```

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-phone"></use></svg> Suporte

- **Docs completas**: [syracloud.com/docs](https://syracloud.com/docs)
- **Email**: syradevops@gmail.com
- **Telefone**: (32) 99953-0234
- **GitHub Issues**: Report bugs e features

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-chart"></use></svg> Status do projeto

| Feature | v2.0 | v3.0 | v4.0 |
|---------|------|------|------|
| Core Proxy | ✔ | ✔ | ✔ |
| TypeScript | ✔ | ✔ | ✔ |
| JavaScript | ✔ | ✔ | ✔ |
| Python | ✔ | ✔ | ✔ |
| Tipagem forte | ⏳ | ✔ | ✔ |
| Interceptors | ⏳ | ✔ | ✔ |
| Retry automático | ⏳ | ✔ | ✔ |
| Cache plugin | ⏳ | ✔ | ✔ |
| IA Query | ⏳ | ⏳ | ✔ |
| Observability | ⏳ | ⏳ | ✔ |

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-star"></use></svg> Veredito

✔ **Conceito**: Excelente — Zero boilerplate nunca foi tão simples  
✔ **Execução**: Muito boa — Proxy mágico funciona perfeitamente  
✔ **Potencial**: Alto — Produto de mercado real  
✔ **DX**: Stripe-level — Experiência de desenvolvedor incrível  

---

## <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-rocket"></use></svg> Roadmap resumido

**v2.0** (Agora)
- Core funcional
- 3 linguagens

**v3.0** (Próximo trimestre)
- Tipagem automática
- Interceptors
- Retry + timeout
- Debug avançado

**v4.0** (Fim de ano)
- IA gerando queries
- Plugin system
- Observabilidade 360°
- Geração de tipos via CLI

---

## 📄 License

© 2026 Syra DevOps. Todos os direitos reservados.

---

**Última atualização**: Março 2026  
**Versão**: 2.0  
**Status**: Production-ready  
**Próxima**: v3.0 (Tipagem forte)
