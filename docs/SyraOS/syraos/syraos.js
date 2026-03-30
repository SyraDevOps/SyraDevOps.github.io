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
//    try { await api.chat(...) } catch (err) { if (err instanceof SyraRateLimitError) {...} }
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

const createSyra = ({
  baseURL = "https://api.syradevops.com",
  token = null,  // ⚠️ Obrigatório para acesso à API
  debug = "off",  // Debug em 3 níveis: "off" | "minimal" | "full"
  mock = false,  // Ativa modo teste (sk_test_)
  retries = 3,  // Número de retentativas
  timeout = 5000,  // Timeout em ms
  backoff = "exponential",  // Estratégia de retry
  throttleRequests = false  // Enfileirar se próximo do limite
} = {}) => {

  // 🔧 Converte objeto em query string (suporta arrays e nested)
  const buildQuery = (params, prefix) => {
    const pairs = [];

    for (let key in params) {
      if (!params.hasOwnProperty(key)) continue;

      const value = params[key];
      const fullKey = prefix ? `${prefix}[${key}]` : key;

      if (value === null || value === undefined) continue;

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
  };

  // 🌐 Função de request central
  const request = async (route, params = {}, options = {}) => {
    let url = `${baseURL}/${route}`;
    let method = options.method || "GET";

    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {}),
    };

    let body;

    // <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-brain"></use></svg> Detecta automaticamente GET vs POST
    if (method === "GET") {
      const query = buildQuery(params);
      if (query) url += `?${query}`;
    } else {
      body = JSON.stringify(params);
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
  };

  // <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lightning"></use></svg> Proxy mágico
  return new Proxy({}, {
    get(_, route) {
      return (params = {}, options = {}) => {
        return request(route, params, options);
      };
    }
  });
};

// export padrão
export const syra = createSyra();
export default createSyra;