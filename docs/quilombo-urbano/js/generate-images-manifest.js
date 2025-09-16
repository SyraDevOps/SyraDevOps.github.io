const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'img');
const outFile = path.join(__dirname, 'images.json');

fs.readdir(imgDir, (err, files) => {
  if (err) {
    console.error('Erro ao ler pasta img:', err);
    process.exit(1);
  }
  const images = files
    .filter(f => /\.(jpe?g|png|webp|gif|svg)$/i.test(f))
    .map(f => path.posix.join('img', f)); // caminhos relativos para o site
  fs.writeFile(outFile, JSON.stringify(images, null, 2), (err) => {
    if (err) {
      console.error('Erro ao escrever images.json:', err);
      process.exit(1);
    }
    console.log(`Gerado ${outFile} com ${images.length} imagens.`);
  });
});