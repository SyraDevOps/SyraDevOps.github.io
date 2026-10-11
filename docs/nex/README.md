# Nex

Chat de pessoa para pessoa (WebRTC/PeerJS), sem servidor de mensagens.

## Arquivos
- `index.html` — login · `registro.html` — criar conta · `sobre.html` — como funciona
- `nex-core.js` — contas, criptografia, idioma, tema · `nex-app.js` — agenda e conversas
- `nex.css` + `nex-app.css` — estilos (tema escuro/claro)
- `manifest.json` + `icons/` — PWA e ícones (16 a 512 px, 256 px em `icon-256.png`/`icon.png`, `icon.ico` para Windows, versões *maskable* para Android)

## Rodar
Sirva a pasta por `https` ou `localhost` (WebCrypto e chamadas exigem contexto seguro):

    python3 -m http.server 8080

## Service worker (`sw.js`)
Já incluso e registrado automaticamente pelo app (precisa de https ou localhost).
- Guarda o "casco" do app (páginas, CSS, JS, manifest, ícones) para abrir **offline** — as mensagens continuam exigindo internet.
- Páginas: rede primeiro, cache de reserva. Arquivos locais: cache + atualização em segundo plano. Bibliotecas e fontes externas: guardadas após o 1º uso.
- Ao mudar qualquer arquivo, aumente `VERSION` no topo do `sw.js` para renovar o cache dos usuários.
