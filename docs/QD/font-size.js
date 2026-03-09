/**
 * Font Size Manager - Controla o tamanho da fonte do aplicativo
 * Salva preferências no localStorage e aplica em todas as páginas
 */

(function() {
    'use strict';

    const FONT_SIZE_KEY = 'qd_font_size_percentage';
    const DEFAULT_SIZE = 100;

    /**
     * Aplica o tamanho de fonte ao documento
     * @param {number} percentage - Percentual de tamanho (80-140)
     */
    function applyFontSize(percentage) {
        // Aplica via CSS custom property na raiz
        document.documentElement.style.setProperty('--font-scale', percentage / 100);
        
        // Aplica diretamente no body para garantir
        const baseFontSize = 16; // 16px é o padrão do navegador
        const newFontSize = baseFontSize * (percentage / 100);
        document.documentElement.style.fontSize = newFontSize + 'px';
    }

    /**
     * Carrega o tamanho de fonte salvo
     * @returns {number} Percentual salvo ou padrão
     */
    function loadFontSize() {
        const saved = localStorage.getItem(FONT_SIZE_KEY);
        return saved ? parseInt(saved, 10) : DEFAULT_SIZE;
    }

    /**
     * Salva o tamanho de fonte
     * @param {number} percentage - Percentual para salvar
     */
    function saveFontSize(percentage) {
        localStorage.setItem(FONT_SIZE_KEY, percentage.toString());
    }

    /**
     * Inicializa o controle de tamanho de fonte na página de perfil
     */
    function initProfileControls() {
        const slider = document.getElementById('fontSizeSlider');
        const valueDisplay = document.getElementById('fontSizeValue');
        const preview = document.getElementById('fontSizePreview');

        if (!slider) return; // Não está na página de perfil

        // Carregar valor salvo
        const savedSize = loadFontSize();
        slider.value = savedSize;
        
        if (valueDisplay) {
            valueDisplay.textContent = savedSize + '%';
        }
        
        if (preview) {
            preview.style.fontSize = (17 * (savedSize / 100)) + 'px';
        }

        // Listener para mudanças no slider
        slider.addEventListener('input', function() {
            const value = parseInt(this.value, 10);
            
            // Atualizar display
            if (valueDisplay) {
                valueDisplay.textContent = value + '%';
            }
            
            // Atualizar preview
            if (preview) {
                preview.style.fontSize = (17 * (value / 100)) + 'px';
            }
            
            // Aplicar imediatamente
            applyFontSize(value);
        });

        // Salvar quando soltar o slider
        slider.addEventListener('change', function() {
            const value = parseInt(this.value, 10);
            saveFontSize(value);
            console.log('✅ Tamanho de fonte salvo:', value + '%');
        });
    }

    /**
     * Inicializa o sistema quando o DOM estiver pronto
     */
    function init() {
        // Aplicar tamanho salvo imediatamente
        const savedSize = loadFontSize();
        applyFontSize(savedSize);

        // Se estiver na página de perfil, inicializar controles
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initProfileControls);
        } else {
            initProfileControls();
        }
    }

    // Inicializar
    init();

    // Exportar para uso global se necessário
    window.FontSizeManager = {
        apply: applyFontSize,
        load: loadFontSize,
        save: saveFontSize
    };
})();
