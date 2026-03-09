/**
 * PWA Validator - Verifica conformidade com checklist PWA
 * Execute no console: fetch('pwa-validator.js').then(r => r.text()).then(eval)
 */

const PWA_VALIDATOR = {
    tests: [],
    
    // Resultado de um teste
    test(name, fn) {
        const result = { name, passed: false, message: '' };
        try {
            result.passed = fn();
            result.message = result.passed ? '✅ PASSOU' : '❌ FALHOU';
        } catch (err) {
            result.message = `❌ ERRO: ${err.message}`;
        }
        this.tests.push(result);
        return result;
    },

    // 1. Manifest
    checkManifest() {
        console.log('\n📋 ==== VALIDANDO MANIFEST ====');
        
        this.test('Manifest existe', () => {
            return document.querySelector('link[rel="manifest"]') !== null;
        });

        this.test('Manifest está acessível', async () => {
            const link = document.querySelector('link[rel="manifest"]');
            if (!link) return false;
            const href = link.getAttribute('href');
            const response = await fetch(href);
            return response.ok;
        });
    },

    // 2. Service Worker
    async checkServiceWorker() {
        console.log('\n🔧 ==== VALIDANDO SERVICE WORKER ====');
        
        this.test('Service Worker suportado', () => {
            return 'serviceWorker' in navigator;
        });

        if ('serviceWorker' in navigator) {
            this.test('Service Worker registrado', async () => {
                const registrations = await navigator.serviceWorker.getRegistrations();
                return registrations.length > 0;
            });
        }
    },

    // 3. Meta tags
    checkMetaTags() {
        console.log('\n🏷️  ==== VALIDANDO META TAGS ====');
        
        const requiredMeta = [
            { name: 'viewport', attr: 'content' },
            { name: 'theme-color', attr: 'content' },
            { name: 'description', attr: 'content' },
            { name: 'color-scheme', attr: 'content' }
        ];

        requiredMeta.forEach(meta => {
            this.test(`Meta tag ${meta.name}`, () => {
                const tag = document.querySelector(`meta[name="${meta.name}"]`);
                return tag && tag.getAttribute(meta.attr);
            });
        });

        // iOS
        this.test('Apple meta: apple-mobile-web-app-capable', () => {
            return document.querySelector('meta[name="apple-mobile-web-app-capable"]') !== null;
        });

        this.test('iOS: apple-mobile-web-app-status-bar-style', () => {
            return document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') !== null;
        });

        // Windows
        this.test('Windows: msapplication-TileColor', () => {
            return document.querySelector('meta[name="msapplication-TileColor"]') !== null;
        });
    },

    // 4. Ícones
    checkIcons() {
        console.log('\n🎨 ==== VALIDANDO ÍCONES ====');
        
        this.test('Favicon PNG configurado', () => {
            return document.querySelector('link[rel="icon"][href*="favicon.png"]') !== null;
        });

        this.test('Ícone principal do app configurado', () => {
            return document.querySelector('link[rel="apple-touch-icon"][href*="icon.png"]') !== null;
        });

        this.test('Manifest com ícones declarados', () => {
            return document.querySelector('link[rel="manifest"]') !== null;
        });

        this.test('Apple touch icon', () => {
            return document.querySelector('link[rel="apple-touch-icon"]') !== null;
        });

        this.test('Ícone PNG disponível', () => {
            return document.querySelector('link[rel="icon"][href*=".png"]') !== null;
        });
    },

    // 5. Responsividade
    checkResponsiveness() {
        console.log('\n📱 ==== VALIDANDO RESPONSIVIDADE ====');
        
        const vp = document.querySelector('meta[name="viewport"]');
        const content = vp ? vp.getAttribute('content') : '';

        this.test('Viewport configurado', () => {
            return content.includes('width=device-width');
        });

        this.test('Initial scale configurado', () => {
            return content.includes('initial-scale=1');
        });

        this.test('Viewport-fit: cover (notches)', () => {
            return content.includes('viewport-fit=cover');
        });

        this.test('User scalable permitido', () => {
            return !content.includes('user-scalable=no');
        });
    },

    // 6. Offline
    async checkOfflineSupport() {
        console.log('\n📡 ==== VALIDANDO OFFLINE ====');
        
        this.test('SW com evento fetch', async () => {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                return registrations.length > 0;
            }
            return false;
        });
    },

    // 7. HTTPS
    checkHTTPS() {
        console.log('\n🔐 ==== VALIDANDO SEGURANÇA ====');
        
        this.test('HTTPS/localhost (desenvolvimento)', () => {
            return location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        });
    },

    // 8. Touch
    checkTouchOptimization() {
        console.log('\n👆 ==== VALIDANDO TOUCH ====');
        
        this.test('Touch action definido', () => {
            const computed = getComputedStyle(document.body);
            return computed.touchAction !== 'auto';
        });

        this.test('Viewport-fit para notches', () => {
            const vp = document.querySelector('meta[name="viewport"]');
            return vp && vp.getAttribute('content').includes('viewport-fit');
        });
    },

    // 9. Display
    checkDisplayMode() {
        console.log('\n🖥️  ==== VALIDANDO DISPLAY ====');
        
        this.test('Display standalone no manifest', async () => {
            const manifestLink = document.querySelector('link[rel="manifest"]');
            if (!manifestLink) return false;
            
            const href = manifestLink.getAttribute('href');
            const response = await fetch(href);
            const manifest = await response.json();
            return manifest.display === 'standalone' || manifest.display === 'fullscreen';
        });
    },

    // Executar todos os testes
    async runAll() {
        console.clear();
        console.log('🚀 ===== PWA VALIDATION REPORT =====\n');
        
        this.checkManifest();
        await this.checkServiceWorker();
        this.checkMetaTags();
        this.checkIcons();
        this.checkResponsiveness();
        await this.checkOfflineSupport();
        this.checkHTTPS();
        this.checkTouchOptimization();
        await this.checkDisplayMode();

        // Resumo
        const passed = this.tests.filter(t => t.passed).length;
        const total = this.tests.length;
        const percentage = Math.round((passed / total) * 100);

        console.log('\n' + '='.repeat(40));
        console.log(`\n📊 RESULTADO: ${passed}/${total} testes passaram (${percentage}%)\n`);

        this.tests.forEach(test => {
            console.log(`${test.message} - ${test.name}`);
        });

        console.log('\n' + '='.repeat(40));
        
        if (percentage === 100) {
            console.log('\n✨ PWA PRONTO PARA DEPLOYMENT! ✨\n');
        } else if (percentage >= 80) {
            console.log('\n⚠️  Alguns itens precisam de ajuste\n');
        } else {
            console.log('\n❌ Vários problemas detectados\n');
        }

        return { passed, total, percentage, tests: this.tests };
    }
};

// Executar validação
PWA_VALIDATOR.runAll().then(result => {
    console.log('Resultado completo:', result);
});
