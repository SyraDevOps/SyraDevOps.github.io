# Fotos reais dos planetas (opcional)

O jogo já traz ilustrações geradas por código. Para usar **fotos reais**, coloque aqui
arquivos JPG com estes nomes exatos; eles substituem automaticamente as ilustrações:

| Arquivo      | Onde aparece                         |
|--------------|--------------------------------------|
| `mars.jpg`   | Perguntas 4, 5 e 6                   |
| `venus.jpg`  | Pergunta 4                           |
| `earth.jpg`  | Pergunta 5                           |
| `phobos.jpg` | Pergunta 6 (órbitas)                 |
| `deimos.jpg` | Pergunta 6 (órbitas)                 |

Dicas:
- Imagem **quadrada**, com o planeta ocupando cerca de 85% da área e fundo preto (será recortada em círculo).
- Imagens da NASA (images.nasa.gov, Photojournal) em geral são de uso livre, mas dê o crédito: "Imagem: NASA/JPL".
- Fobos e Deimos ficam melhores com fundo transparente (PNG renomeado não funciona; use JPG com fundo preto).
- Tamanho sugerido: 600×600 px, até 150 KB cada.
- Para funcionar offline, adicione os arquivos à lista `APP_SHELL` em `service-worker.js`.
