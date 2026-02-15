# Sory API (Rotas HTTP)

Este arquivo documenta **todas as rotas** expostas pelo `cmd/sory_api` (API 24/7 para VPS).

## Base

- Porta default: `80`
- Healthcheck simples: `GET /health`
- Console HTML embutido (debug manual): `GET /` (ou `/index.html`)
- Web (paginas HTML em `Web/`): `GET /web/…` (se a pasta `Web/` existir no diretorio do processo)

## Autenticacao (JWT)

Todas as rotas autenticadas exigem:

- Header: `Authorization: Bearer <jwt>`

Sessoes:

- Sessao de usuario: `adm=false`
- Sessao admin: `adm=true` (pode operar plugins/planos/metrics do proprio usuario)

Logout:

- Revoga o `jti` persistido no `sessions.json` do usuario (allowlist por sessao).

Rate limit / lockout:

- `POST /v1/auth/login`
- `POST /v1/auth/admin_login`
- `POST /v1/auth/admin_code`

Retornam `429` com header `Retry-After` quando bloqueados por bruteforce.

## Formato de erro (padrao)

Em geral:

```json
{ "ok": false, "error": "..." }
```

## Actions (abrir links no dispositivo cliente)

Alguns plugins (ex.: `brw`, `gmail`, `whatsapp`, `youtube_invidious`) retornam uma lista `actions` para o **cliente** executar (abrir URL no navegador do dispositivo que fez a requisicao).

Exemplo:

```json
{
  "ok": true,
  "handled": true,
  "plugin": "gmail",
  "output": "Abrindo Gmail: https://mail.google.com",
  "actions": [
    { "type": "open_url", "url": "https://mail.google.com", "label": "gmail" }
  ]
}
```

Importante:

- Por padrao, a API **nao tenta** abrir navegador no servidor/VPS.
- Se voce quiser permitir abertura server-side (modo desktop/local), use: `SORY_OPEN_URL_SERVER=1`.

---

# Rotas

## Health

### `GET /health`

Resposta:

```json
{ "ok": true, "service": "sory_api" }
```

### `GET /health/details`

Retorna um diagnostico de dependencias (layout de DB, metrics DB, jwt secret, sqlite, config do LLM).

Status:

- `200` se tudo ok
- `503` se algum `deps.*.ok == false`

---

## Auth e usuarios

### `POST /v1/users/register`

Cria usuario.

Body:

```json
{ "username": "kayque", "email": "kayque@example.com" }
```

Resposta (segredos retornados apenas aqui):

```json
{
  "ok": true,
  "id": "…",
  "email": "…",
  "username": "…",
  "token": "123456",
  "admin_code": "ABCD",
  "recovery_token": "…24 chars…"
}
```

### `POST /v1/auth/login`

Login do usuario (token de 6 digitos).

Body:

```json
{ "username": "kayque", "token": "123456" }
```

Resposta:

```json
{ "ok": true, "session": "<jwt>", "token_type": "jwt", "expires_at": "RFC3339" }
```

### `POST /v1/auth/admin_login`

Login admin pelo par `username + admin_code` (4 letras).

Body:

```json
{ "username": "kayque", "admin_code": "ABCD" }
```

Resposta:

```json
{ "ok": true, "session": "<jwt>", "admin": true, "token_type": "jwt", "expires_at": "RFC3339" }
```

### `POST /v1/auth/admin_code`

Login admin **somente pelo codigo** (4 letras), sem informar username (o servidor procura o usuario).

Body:

```json
{ "admin_code": "ABCD" }
```

Resposta:

```json
{ "ok": true, "session": "<jwt>", "admin": true, "username": "kayque", "token_type": "jwt", "expires_at": "RFC3339" }
```

### `POST /v1/auth/logout`

Revoga a sessao (jti) do token atual.

Header:

- `Authorization: Bearer <jwt>`

Resposta:

```json
{ "ok": true, "revoked": true }
```

### `GET /v1/auth/me`

Mostra dados do usuario logado + plano atual.

Resposta:

```json
{
  "ok": true,
  "id": "…",
  "username": "…",
  "email": "…",
  "created": "RFC3339",
  "plan": { "plan": "free", "subscription": "mensal" }
}
```

### `PUT /v1/auth/me`

Edita dados do usuario logado (hoje: email).

Body:

```json
{ "email": "novo@email.com" }
```

---

## Chat (LLM)

### `POST /v1/chat`

Body:

```json
{ "message": "oi" }
```

Resposta:

```json
{ "ok": true, "reply": "..." }
```

---

## Pipeline de plugins (router/tools)

### `POST /v1/run`

Executa o roteador de plugins (com estado isolado por usuario).

Body:

```json
{ "input": "anota: comprar cafe", "turn_id": "t1" }
```

Resposta:

```json
{
  "ok": true,
  "handled": true,
  "plugin": "note",
  "cap_block": false,
  "capability": "",
  "output": "…",
  "actions": []
}
```

Erros possiveis:

- `403 plan_denied` (quando existirem regras de acesso por plano configuradas)

---

## Plugins e caps (admin)

### `GET /v1/plugins` (admin)

Lista status de plugins (admin).

### `GET /v1/user/plugins`

Lista status de plugins visiveis ao usuario (pode ser filtrado por plano quando houver policy configurada).

### `POST /v1/admin/plugins/set` (admin)

Liga/desliga plugin.

Body:

```json
{ "plugin": "youtube_invidious", "enabled": true }
```

### `GET /v1/caps/last_block` (admin)

Ultimo bloqueio de capability observado pelo router (best-effort).

Resposta:

```json
{
  "ok": true,
  "has_block": true,
  "plugin": "youtube_invidious",
  "capability": "needs_network",
  "at": "RFC3339",
  "input": "toque …"
}
```

---

## Presets por usuario

### `GET /v1/user/presets`

Lista presets salvos do usuario.

### `POST /v1/user/presets/save`

Salva preset com o estado atual de plugins.

Body:

```json
{ "name": "meu_preset" }
```

### `POST /v1/user/presets/load`

Carrega preset salvo (aplica ON/OFF por plugin).

Body:

```json
{ "name": "meu_preset" }
```

---

## System prompt do usuario

### `GET /v1/user/system_prompt`

Mostra o prompt do usuario (secundario). O prompt principal (guidelines) e imutavel.

### `POST /v1/user/system_prompt` (admin)

Define o prompt do usuario.

Body:

```json
{ "prompt": "seja mais direto" }
```

---

## Notas (CRUD)

### `GET /v1/user/notes`

Query:

- `limit` (1..200, default 50)
- `q` (filtro por substring)

### `POST /v1/user/notes`

Body:

```json
{ "text": "minha nota" }
```

### `GET /v1/user/notes/{id}`
### `PUT /v1/user/notes/{id}`
### `DELETE /v1/user/notes/{id}`

---

## Memorias (CRUD)

### `GET /v1/user/memories`

Query:

- `limit` (1..200, default 50)
- `kind`
- `semantic`
- `state`
- `q` (LIKE)

### `GET /v1/user/memories/{id}`
### `PUT /v1/user/memories/{id}`

Body:

```json
{ "text": "novo conteudo" }
```

### `DELETE /v1/user/memories/{id}`

---

## Plans (admin)

### `POST /v1/admin/plans/set` (admin)

Body:

```json
{ "username": "kayque", "plan": "free|low|med|high|root", "subscription": "mensal|anual|vitalicia" }
```

### `GET /v1/admin/plans/get?username=...` (admin)

---

## Metrics (admin)

### `GET /v1/admin/metrics/users` (admin)

Query:

- `day` (YYYY-MM-DD, opcional)
- `username` (opcional)
- `limit` (default 200)

### `GET /v1/admin/metrics/plugins` (admin)

Query:

- `day` (YYYY-MM-DD, opcional)
- `username` (opcional)
- `plugin` (opcional)
- `limit` (default 500)

---

## Mobile bridge (por usuario)

### `POST /v1/bridge/on`

Ativa pairing para o usuario logado e retorna QR.

Resposta inclui:

- `pair_code` (6 digitos)
- `qr_payload`
- `qr_data_url` (data URL base64)
- `qr_png_url` (endpoint que retorna PNG)

### `GET /v1/bridge/status`

Lista devices pareados + status do pairing.

### `GET /v1/bridge/qr.png`

Retorna PNG do QR (requer sessao do usuario).

### `POST /v1/bridge/push`

Enfileira mensagem para todos os devices pareados do usuario.

Body:

```json
{ "text": "..." }
```

### `POST /v1/bridge/pair`

Endpoint para o app mobile parear (nao requer sessao do usuario).

Body:

```json
{
  "username": "kayque",
  "pair_code": "123456",
  "device_name": "Meu Celular",
  "platform": "android|ios|…"
}
```

Resposta (retorna token do device):

- `device_id`
- `device_token`

### `GET /v1/bridge/events`

Endpoint do device para buscar eventos.

Auth do device: `Authorization: Bearer <device_token>`

### `POST /v1/bridge/ack`

Confirma consumo de eventos (remove da fila).

Auth do device: `Authorization: Bearer <device_token>`

---

## Web (estatico)

### `GET /web/…`

Servido a partir da pasta `Web/` (ex.: `register.html`, `login.html`, `chat.html`, `admin.html`).

Se abrir `/web/` redireciona internamente para `/web/register.html`.

