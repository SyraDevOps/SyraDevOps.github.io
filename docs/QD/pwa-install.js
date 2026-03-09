/**
 * PWA Install Prompt - Gerencia install prompts do PWA
 * Integra-se com beforeinstallprompt event
 */

class PWAInstallPrompt {
    constructor() {
        this.deferredPrompt = null;
        this.installPromptShown = false;
        this.hideInstallPrompt = false;

        this.init();
    }

    init() {
        // Capturar evento beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Capturar instalação bem-sucedida
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA instalado com sucesso!');
            this.deferredPrompt = null;
            this.hideInstallButton();
            this.trackInstallation('success');
        });

        // Capturar rejeição do prompt
        if (this.deferredPrompt) {
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Usuário aceitou instalar o PWA');
                } else {
                    console.log('Usuário rejeitou instalar o PWA');
                }
                this.deferredPrompt = null;
            });
        }
    }

    showInstallButton() {
        // Crear botão se não existir
        let btn = document.getElementById('pwa-install-button');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'pwa-install-button';
            btn.className = 'pwa-install-button';
            btn.innerHTML = '📥 Instalar App';
            btn.addEventListener('click', () => this.install());
            
            // Adicionar após o menu button
            const menuButton = document.querySelector('.menu-button');
            if (menuButton) {
                menuButton.parentNode.insertBefore(btn, menuButton.nextSibling);
            } else {
                document.body.insertBefore(btn, document.body.firstChild);
            }
        }
        btn.style.display = 'block';
    }

    hideInstallButton() {
        const btn = document.getElementById('pwa-install-button');
        if (btn) btn.style.display = 'none';
    }

    async install() {
        if (!this.deferredPrompt) return;

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        console.log(`Usuário respondeu: ${outcome}`);
        
        this.deferredPrompt = null;
        this.hideInstallButton();
        
        this.trackInstallation(outcome);
    }

    trackInstallation(outcome) {
        // Salvar no localStorage para análise
        const installations = JSON.parse(localStorage.getItem('pwa_installations') || '[]');
        installations.push({
            timestamp: new Date().toISOString(),
            outcome,
            userAgent: navigator.userAgent
        });
        localStorage.setItem('pwa_installations', JSON.stringify(installations));
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pwaInstallPrompt = new PWAInstallPrompt();
    });
} else {
    window.pwaInstallPrompt = new PWAInstallPrompt();
}
