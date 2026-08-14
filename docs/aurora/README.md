# Aurora — Menu inicial

Abra `index.html` no navegador. O projeto usa apenas HTML, CSS e JavaScript, sem frameworks.

## Estrutura

- `index.html` — interface e diálogos
- `css/style.css` — visual e responsividade
- `js/i18n.js` — textos PT-BR/EN
- `js/app.js` — cenas, vidas, progressão, preferências e som
- `assets/aurora-constellation.png` — arte do menu

O volume, o idioma, o tamanho de texto e a redução de animações ficam salvos no navegador. Os sons atuais são sintetizados no próprio `js/app.js` (funções `sound()` e `startAmbient()`), sem dependências. Caso queira substituir por arquivos, esses são os dois pontos de troca.

## Prólogo

Clique em **Novo jogo** para iniciar a história. Ela apresenta Json, Aurora e O Cartógrafo, e chega à primeira escolha de carta. Os diálogos ficam em `js/i18n.js`, para que PT-BR e inglês sejam sempre mantidos juntos.

## O Jogo das Três Órbitas

O prólogo agora se desdobra em uma aventura educativa: Aurora foi fragmentada em cartas de memória depois que o Consórcio Helia tentou esconder seus alertas de tempestade solar. Para reconstruí-la, Json escolhe uma classe e atravessa uma campanha de 32 cartas ligadas à narrativa:

- **Físico** — energia, matéria, espectros e gravidade.
- **Piloto** — trajetórias, referências e tomada de decisão.
- **Navegador Astral** — integração entre observação, ciência e rota.

Agora a campanha possui quatro capítulos com **oito provas em cada um** (32 no total), organizadas para aumentar de dificuldade e com uma pequena cena de consequência em cada transição:

- **Capítulo I — O Sinal de Helia:** estrelas, planetas, Lua, fases, gravidade lunar, marés e Marte.
- **Capítulo II — O Céu em Profundidade:** constelações, anos-luz, Júpiter, Grande Mancha Vermelha, Europa e Io.
- **Capítulo III — A Travessia de Vela:** brilho aparente, órbitas, Saturno, cometas, meteoros e galáxias.
- **Capítulo IV — A Última Carta:** buracos negros, espectros, desvio para o vermelho, exoplanetas, tempestades solares e pensamento científico.

Cada carta começa com uma fala ou ação de Json, Aurora, Mira ou Vesper. Ao escolher, a resposta vira uma cena de reação com explicação científica e o jogo segue automaticamente; o jogador pode pular a espera se já terminou de ler. Há três formatos de interação: escolhas de conhecimento, decisões binárias de rota e escolhas visuais usando imagens reais salvas localmente de missões espaciais (Lua/Apollo 8, Marte/Viking e o sistema de Júpiter/Juno), com créditos e ligação para as páginas da NASA. Há padrões ilustrados de Órion, Cassiopeia e Cruzeiro do Sul.

O jogador começa cada capítulo com **três vidas**. Uma resposta incorreta retira uma vida, mas revela a correção e mantém a aventura fluindo. Ao perder as três, Json volta ao início daquele capítulo e preserva o que aprendeu. A confiança de Vesper muda conforme as decisões, alterando pequenas falas nas transições de capítulo.

O botão **Mapa da jornada** mostra uma rota de 32 nós inspirada em jogos de mapa, com cartas concluídas, a próxima carta, capítulos e quatro conquistas. A campanha é responsiva em celulares, tablets e computadores; as artes dos personagens usam versões WebP leves, carregadas sob demanda, com PNG como reserva. Nas escolhas visuais, os nomes e créditos das imagens só aparecem depois da resposta.

## Academia Estelar

O menu inclui uma área de estudo independente da campanha, com fontes científicas em cada explicação:

- **Fundamental** — luz, Lua, planetas e observação segura.
- **Médio** — órbitas, gravidade, ano-luz e telescópios.
- **Médio avançado** — gravitação, Wien, Kepler e Doppler, com fórmulas.
- **Superior** — quasares, raio de Schwarzschild, Hubble e redshift cosmológico.

Cada trilha agora possui **oito desafios** (32 no total): perguntas conceituais, reconhecimento de imagens reais, fórmulas, e sequências clicáveis de investigação científica. Aurora introduz cada etapa com uma conversa ilustrada; Json assume algumas etapas de navegação.

O **Laboratório de constelações** pede primeiro o reconhecimento visual e, depois, a construção clicável dos mapas. Após seis mapas, as opções de reconhecimento passam a ter quatro alternativas.

### Progressão da Academia

- Crie um perfil local com nome e uma silhueta de explorador ou exploradora.
- Respostas novas rendem XP maior; revisões rendem XP reduzido. A sequência dá bônus crescente, mas erros a reiniciam.
- As coroas aparecem com 3, 6 e 8 cartas dominadas; a última é dourada. As trilhas seguintes abrem com 3, 4 e 5 cartas dominadas na anterior, equilibrando liberdade e evolução.
- O laboratório agora contém **18 mapas**: Órion, Cruzeiro do Sul, Cassiopeia, Ursa Maior, Escorpião, Cisne, Lira, Touro, Gêmeos, Leão, Águia, Sagitário, Andrômeda, Pégaso, Virgem, Cão Maior, Cão Menor e Centauro. Ele mostra mapas concluídos e quantos ainda faltam.
- O menu principal está organizado em duas colunas por três linhas e inclui a aba **Conquistas**. Ela lista todas as conquistas da campanha e da Academia, incluindo sequência de 5 acertos, primeira coroa, trilha dourada, 5 mapas, o Atlas Aurora e a conquista das quatro coroas douradas.

O estado é salvo automaticamente no `localStorage` após cada decisão, incluindo vidas, checkpoint, classe, pontuação e confiança. Configurações permite apagar o progresso. Ao final, os créditos identificam Kayque F S Alves e @SyraDevOps.
