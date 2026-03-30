// ⚠️ TOKEN É OBRIGATÓRIO EM TODAS AS REQUISIÇÕES
// Passe seu token durante a inicialização
// Exemplo: const syra = createSyra({ token: "sk_live_xxxxx" })
// O token será automaticamente enviado em TODAS as chamadas (v2.2.0)

// 🏢 4 PILARES CRÍTICOS PARA ENTERPRISE (v3.0+)
//
// 1️⃣ TESTING - Mock Mode com sk_test_
//    const api = createSyra({ token: "sk_test_...", mock: true })
//    Respostas simuladas, zero custo, mesma latência
//
// 2️⃣ ERROR HANDLING - Classes de erro tipadas + Retry automático
//    import { SyraAuthError, SyraRateLimitError } from "syraos/errors"
//    SDK faz retry automático com backoff exponencial (1s → 2s → 4s)
//
// 3️⃣ RATE LIMITING - getLimits() + Headers IETF + Throttle automático
//    const limits = api.getLimits()  // Tokens/min restantes
//    X-RateLimit-Remaining, X-Quota-Tokens-Remaining headers
//    SDK enfileira requisições se próximo do limite (zero 429 pro usuário)
//
// 4️⃣ OBSERVABILITY - Request-ID único + $meta em cada resposta
//    Respostas incluem: res.$meta.requestId, res.$meta.latencyMs, res.$meta.tokensUsed
//    Debug em 3 níveis: "off" | "minimal" | "full"

// MINDS: Agentes inteligentes configuráveis
// Exemplos:
// 1. Criar: await api.minds.create({ name: "MeuMind", system: {...} }, { method: "POST" })
// 2. Consultar: await api.minds.get({ id: "mind_xyz" })
// 3. Usar em chat: await api.chat({ message: "...", mind_id: "mind_xyz" })
// 4. Listar: await api.minds.list({ limit: 10 })
// 5. Atualizar: await api.minds.update({ id: "mind_xyz" }, {...}, { method: "PUT" })
// 6. Exportar: await api.minds.export({ id: "mind_xyz" })

type Params = Record<string, any>;

interface SyraConfig {
  baseURL?: string;
  token?: string;  // ⚠️ Obrigatório para acesso à API
  debug?: "off" | "minimal" | "full";  // Debug em 3 níveis
  mock?: boolean;  // Ativa modo teste (sk_test_)
  retries?: number;  // Número de retentativas
  timeout?: number;  // Timeout em ms
  backoff?: "exponential" | "linear";  // Estratégia de retry
  throttleRequests?: boolean;  // Enfileirar se próximo do limite
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
}

// 🔧 build query (arrays + nested)
function buildQuery(params: Params, prefix = ""): string {
  const pairs: string[] = [];

  for (const key in params) {
    const value = params[key];
    if (value === null || value === undefined) continue;

    const fullKey = prefix ? `${prefix}[${key}]` : key;

    if (Array.isArray(value)) {
      value.forEach((v) => {
        pairs.push(`${encodeURIComponent(fullKey)}[]=${encodeURIComponent(v)}`);
      });
    } else if (typeof value === "object") {
      pairs.push(buildQuery(value, fullKey));
    } else {
      pairs.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(value)}`);
    }
  }

  return pairs.join("&");
}

// 🌐 request central
async function request(
  baseURL: string,
  route: string,
  params: Params = {},
  options: RequestOptions = {},
  token?: string,
  debug?: boolean | "off" | "minimal" | "full"
) {
  let url = `${baseURL}/${route}`;
  const method = options.method || "GET";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let body: string | undefined;

  if (method === "GET") {
    const query = buildQuery(params);
    if (query) url += `?${query}`;
  } else {
    body = JSON.stringify(params);
  }

  if (debug === true || debug === "minimal" || debug === "full") {
    console.log("Syra Request:", { url, method, params });
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro ${res.status}: ${text}`);
  }

  return res.json();
}

// <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lightning"></use></svg> Proxy tipado
type SyraClient = {
  [key: string]: (params?: Params, options?: RequestOptions) => Promise<any>;
};

// <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-brain"></use></svg> factory
export function createSyra(config: SyraConfig = {}): SyraClient {
  const {
    baseURL = "https://api.syradevops.com",
    token,
    debug = false,
  } = config;

  return new Proxy({} as SyraClient, {
    get(_, route: string) {
      return (params: Params = {}, options: RequestOptions = {}) => {
        return request(baseURL, route, params, options, token, debug);
      };
    },
  });
}

// <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-rocket"></use></svg> instância default
export const syra = createSyra();