# Aurora — guia rápido

**O que é:** jogo narrativo de física para o ensino médio. 5 capítulos × 3 perguntas.
A Aurora (IA da nave) é sequestrada; os alunos mapeiam onde ela está e a resgatam.

| Cap. | Tema | Conteúdo |
|------|------|----------|
| 1 | Coordenadas, vetores, tempo | par (x, y); soma de vetores (Pitágoras); d = v × t |
| 2 | Planetas | características de Vênus/Marte; massa × peso; períodos orbitais |
| 3 | Ambientes e física | som no vácuo; gravidade fraca; calor por radiação |
| 4 | Velocidade e aceleração | v = d ÷ t; a = Δv ÷ Δt; velocidade relativa |
| 5 | Resgate (síntese) | interceptar (posição futura); inércia; F = m·Δv/Δt (impulso) |

**Enredo (resumo)**
O Conselho Orbital vai desligar a Aurora em 48 h ("dá respostas que ninguém confere"). Antes disso, ela é
sequestrada pelo criador, Dr. Nadir. A Luna decide trazê-la de volta e provar, com contas, que a Aurora ensina
a pensar: o diário de bordo dela é a prova. No caminho, o comandante Ravi esconde que Nadir foi seu professor, e o Cruzador Pavão do Almirante Vasconcelos se aproxima (14 h, depois 40 min), dando urgência à missão. No fim, o Conselho vota; o resultado depende dos acertos do aluno.

**Imagens:** as 13 cenas em `assets/scenes/` são ilustrações originais pintadas por código (não são fotos nem IA). Cada cena aparece na história e nas cartas correspondentes.
Cada capítulo tem contagem regressiva (46 h → 3 h), uma "Regra do Ravi" e uma pergunta de curiosidade da Aurora.
No epílogo, uma audiência decide o destino da Aurora conforme o número de acertos (9×0, 6×3 ou 5×4).

**Para o professor**
- Ao final, o botão *Copiar relatório* gera um resumo (acertos por capítulo e tópicos a revisar).
- *Revisar erros* mostra a resposta correta e a explicação de cada erro.
- O *Arquivo Aurora* (menu) guarda a explicação de cada pergunta já respondida.

**Mecânicas:** dica da Aurora (custa 3 de energia e 5 de XP), sequência (🔥), XP e patentes
(Cadete → Navegadora → Piloto → Comandante), estrelas e medalha por capítulo, diário da Luna.

**Som:** trilha ambiente gerada por código (muda a cada capítulo) e efeitos sonoros.
Botão *Som* no menu e ♪ no topo durante o jogo.

**Onde editar**
- `js/app.js`: história (`storyBeats`), perguntas (`cards`), dicas (`HINTS`), capítulos (`chapters`).
- `js/audio.js`: trilha (`MOODS`) e efeitos.
- `assets/planets/`: coloque fotos reais (veja o README da pasta).

**Para abrir:** use um servidor local (ex.: `python3 -m http.server`) ou publique em qualquer hospedagem estática.
O jogo funciona offline depois do primeiro acesso (PWA).
