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
