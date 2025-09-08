# Quilombo Urbano — Página Estática

Página simples em HTML/CSS/JS com tema em vermelho e preto, criada para apresentar o Quilombo Urbano.

Como abrir

1. Abra o arquivo `index.html` no navegador (duplo clique ou abrir com)
2. Para desenvolvimento com live-reload, use uma extensão ou servidor simples, por exemplo:

   - Python 3: `python -m http.server 8000`

O que foi criado

- `index.html` — estrutura da página
- `styles.css` — estilos (paleta: vermelho/preto)
- `scripts.js` — interações básicas (menu, formulário fake, ano automático)

Sugestões futuras

- Adicionar imagens reais na pasta `images/`
- Conectar o formulário a um backend
- Melhorar o contraste e testes de acessibilidade

Melhorias nesta versão

- Tipografia refinada: a página agora usa "Playfair Display" para títulos e "Inter" para o corpo (carregadas via Google Fonts) para um aspecto mais elegante e profissional.
- Contraste e paleta: cores ajustadas para um vermelho profundo e superfícies em carvão para melhorar legibilidade e presença visual.
- Estética: sombras, bordas sutis e cantos arredondados foram adicionados para um visual moderno.

Notas de acessibilidade e testes

- Rode Lighthouse (Chrome DevTools) para checar contraste, performance e boas práticas.
- Verifique a navegação por teclado (Tab) e leitores de tela para confirmar a ordem e usabilidade.

Adicionar imagens de exemplo

Crie a pasta `images/` e adicione `photo1.jpg`, `photo2.jpg`, `photo3.jpg`, `photo4.jpg` para preencher a galeria.

Melhorias de usabilidade adicionadas

- Link "Pular para o conteúdo" (skip link) para facilitar a navegação por teclado.
- Efeitos de foco/hover melhorados para botões, links e imagens.

Se quiser, posso também:

- Gerar automaticamente imagens de exemplo licenciadas (CC0) e colocá-las em `images/`.
- Integrar o formulário com um serviço (Formspree/Netlify) ou criar um backend simples em Node/Python.
