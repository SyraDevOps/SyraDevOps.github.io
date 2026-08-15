# Orbis · Feito pela @SyraDevOps

PWA responsiva Syra-Sat para acompanhar a animação meteorológica sobre o Brasil.

## Recursos

- Cinco modos visuais: GeoColor, infravermelho, vapor d'água, massas de ar e fase de nuvens.
- Até 24 frames, em intervalos de 10 minutos, com controles de reprodução e velocidade.
- Câmera responsiva centrada no Brasil.
- Botão de tela cheia para ampliar somente a transmissão, com suporte nativo e alternativa visual para celular.
- Marca d’água semitransparente com créditos Orbis, @SyraDevOps e @Ecosmos, que pode ser ocultada pelo controle da página.
- Geração de vídeo de alta qualidade compartilhável com marca d’água e horário de cada frame. Escolha Story (1080×1920), Post (1080×1350), Quadrado (1080×1080) ou Paisagem (1920×1080); a imagem é sempre enquadrada sem cortes. O Orbis usa MP4 quando suportado pelo navegador e WebM como alternativa compatível.

## Abrir e instalar

Para visualização simples, é possível abrir `index.html` diretamente. Para instalar como PWA e carregar as imagens de forma mais confiável, publique o projeto em uma plataforma com funções Node, como Vercel: a rota `api/noaa.js` é o proxy que contorna o bloqueio de CORS das imagens NOAA.

## Publicar online

Envie a pasta `Orbis` para um repositório Git e importe-o na Vercel. Não há variáveis de ambiente ou dependências para configurar. A função `api/noaa.js` é publicada automaticamente na URL `/api/noaa`, e o Orbis passa a carregar os frames diretamente pela página online.

## Executar localmente

Na pasta do projeto, execute (Node.js 18 ou superior):

```bash
node server.js
```

Depois abra `http://localhost:8080`. A obtenção das imagens NOAA continua exigindo conexão com a internet.

O servidor fornece a rota `/api/noaa`, que permite exibir os frames carregados pelo Orbis sem o bloqueio de CORS do navegador.

## Fonte

Imagens por NOAA STAR / GOES-19 ABI. Os dados são informativos e não devem ser usados para decisão operacional.
