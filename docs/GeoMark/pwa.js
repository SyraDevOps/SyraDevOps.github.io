let deferredPrompt;
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
function showInstall() {
  if (window.matchMedia('(display-mode: standalone)').matches || document.querySelector('.install-card')) return;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!deferredPrompt && !ios) return;
  const card = document.createElement('aside'); card.className = 'install-card';
  card.innerHTML = `<img src="assets/logo-point.svg" alt=""><div><b>Instale o Coordenada</b><p>${ios ? 'No Safari, toque em Compartilhar e escolha Adicionar à Tela de Início.' : 'Abra seu mapa comunitário como um app.'}</p></div>${ios ? '' : '<button class="primary">Instalar</button>'}<button class="install-close" aria-label="Fechar">×</button>`;
  card.querySelector('.primary')?.addEventListener('click', async () => { deferredPrompt.prompt(); const result = await deferredPrompt.userChoice; if (result.outcome === 'accepted') card.remove(); deferredPrompt = null; });
  card.querySelector('.install-close').onclick = () => { sessionStorage.setItem('coordinate-install-dismissed', '1'); card.remove(); };
  document.body.append(card);
}
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredPrompt = event; if (!sessionStorage.getItem('coordinate-install-dismissed')) setTimeout(showInstall, 1200); });
window.addEventListener('appinstalled', () => document.querySelector('.install-card')?.remove());
window.addEventListener('load', () => { if (!sessionStorage.getItem('coordinate-install-dismissed')) setTimeout(showInstall, 1600); });
