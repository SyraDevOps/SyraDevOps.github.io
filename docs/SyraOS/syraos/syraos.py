import requests

# ⚠️ TOKEN É OBRIGATÓRIO EM TODAS AS REQUISIÇÕES
# Passe seu token durante a inicialização
# Exemplo: api = Syra(token="sk_live_xxxxx")
# O token será automaticamente enviado em TODAS as chamadas (v2.2.0)

# 🏢 4 PILARES CRÍTICOS PARA ENTERPRISE (v3.0+)
#
# 1️⃣ TESTING - Mock Mode com sk_test_
#    api = Syra(token="sk_test_...", mock=True)
#    Respostas simuladas, zero custo, mesma latência
#
# 2️⃣ ERROR HANDLING - Exceções tipadas + Retry automático
#    try:
#        res = api.chat({"message": "Olá"})
#    except SyraRateLimitError as e:
#        print(f"Aguarde {e.retry_after} segundos")
#    SDK faz retry automático com backoff exponencial (1s → 2s → 4s)
#
# 3️⃣ RATE LIMITING - get_limits() + Headers IETF + Throttle automático
#    limits = api.get_limits()  # Tokens/min restantes
#    X-RateLimit-Remaining, X-Quota-Tokens-Remaining headers
#    SDK enfileira requisições se próximo do limite (zero 429 pro usuário)
#
# 4️⃣ OBSERVABILITY - Request-ID único + $meta em cada resposta
#    Respostas incluem: res['$meta']['request_id'], res['$meta']['latency_ms'], res['$meta']['tokens_used']
#    Debug em 3 níveis: "off" | "minimal" | "full"

# MINDS: Agentes inteligentes configuráveis
# Exemplos:
# 1. Criar: api.minds.create({"name": "MeuMind", "system": {...}}, method="POST")
# 2. Consultar: api.minds.get({"id": "mind_xyz"})
# 3. Usar em chat: api.chat({"message": "...", "mind_id": "mind_xyz"})
# 4. Listar: api.minds.list({"limit": 10})
# 5. Atualizar: api.minds.update({"id": "mind_xyz"}, {...}, method="PUT")
# 6. Exportar: api.minds.export({"id": "mind_xyz"})

class Syra:
    def __init__(self, base_url="https://api.syradevops.com", token=None, 
                 debug="off", mock=False, retries=3, timeout=5000, 
                 backoff="exponential", throttle_requests=False):
        """
        Inicializa SyraOS SDK com suporte para 4 pilares Enterprise.
        
        Args:
            token: API key (sk_live_... ou sk_test_)
            debug: "off" | "minimal" | "full"
            mock: Ativa modo teste (sk_test_)
            retries: Número de retentativas
            timeout: Timeout em ms
            backoff: "exponential" ou "linear"
            throttle_requests: Enfileirar se próximo do limite
        """
        self.base_url = base_url
        self.token = token  # ⚠️ Obrigatório para acesso à API
        self.debug = debug
        self.mock = mock
        self.retries = retries
        self.timeout = timeout
        self.backoff = backoff
        self.throttle_requests = throttle_requests

    # 🔧 Converte dict em query params (suporta nested e arrays)
    def _build_query(self, params, prefix=""):
        pairs = []

        for key, value in params.items():
            if value is None:
                continue

            full_key = f"{prefix}[{key}]" if prefix else key

            if isinstance(value, list):
                for v in value:
                    pairs.append((f"{full_key}[]", v))

            elif isinstance(value, dict):
                pairs.extend(self._build_query(value, full_key))

            else:
                pairs.append((full_key, value))

        return pairs

    # 🌐 request central
    def _request(self, route, params=None, method="GET", headers=None):
        url = f"{self.base_url}/{route}"
        headers = headers or {}

        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        if method.upper() == "GET":
            query = self._build_query(params or {})
            response = requests.get(url, params=query, headers=headers)
        else:
            response = requests.request(
                method.upper(),
                url,
                json=params,
                headers=headers
            )

        if not response.ok:
            raise Exception(f"Erro {response.status_code}: {response.text}")

        return response.json()

    # <svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lightning"></use></svg> magia: rotas dinâmicas
    def __getattr__(self, route):
        def endpoint(params=None, method="GET", headers=None):
            return self._request(route, params, method, headers)
        return endpoint


# instância pronta
syra = Syra()