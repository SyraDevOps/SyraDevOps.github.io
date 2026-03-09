/**
 * Theme Manager - QDiário
 * Gerencia temas da interface (light e dark modes)
 */

const ThemeManager = {
    STORAGE_KEY: 'qd_web_theme',
    STORAGE_KEY_AUTO_MODE: 'qd_web_theme_auto_mode',
    THEMES: {
        LIGHT: 'light',
        DARK_CLASSIC: 'theme-dark-classic',
        DARK_WARM: 'theme-dark-warm',
        DARK_COOL: 'theme-dark-cool',
        DARK_SEPIA: 'theme-dark-sepia'
    },
    AUTO_MODES: {
        OFF: 'off',
        SYSTEM: 'system',
        NIGHT: 'night'
    },
    NIGHT_START_HOUR: 19,
    NIGHT_END_HOUR: 7,
    _nightIntervalId: null,

    /**
     * Obtém o tema atual salvo ou o padrão
     */
    getCurrentTheme() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            return saved || this.THEMES.LIGHT;
        } catch {
            return this.THEMES.LIGHT;
        }
    },

    getAutoMode() {
        try {
            const savedMode = localStorage.getItem(this.STORAGE_KEY_AUTO_MODE);
            if (savedMode && Object.values(this.AUTO_MODES).includes(savedMode)) {
                return savedMode;
            }
            return this.AUTO_MODES.OFF;
        } catch {
            return this.AUTO_MODES.OFF;
        }
    },

    /**
     * Salva o tema no localStorage
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        } catch (e) {
            console.warn('Não foi possível salvar o tema:', e);
        }
    },

    saveAutoMode(mode) {
        try {
            localStorage.setItem(this.STORAGE_KEY_AUTO_MODE, mode);
        } catch (e) {
            console.warn('Não foi possível salvar o modo automático:', e);
        }
    },

    /**
     * Aplica um tema ao body
     */
    applyTheme(theme, options = {}) {
        const { persist = true } = options;

        // Remove todas as classes de tema
        Object.values(this.THEMES).forEach(t => {
            if (t !== 'light') {
                document.body.classList.remove(t);
            }
        });

        // Aplica o novo tema (light não precisa de classe)
        if (theme !== this.THEMES.LIGHT) {
            document.body.classList.add(theme);
        }

        // Atualiza meta theme-color para PWA
        this.updateMetaThemeColor(theme);

        // Salva a preferência
        if (persist) this.saveTheme(theme);
    },

    resolveAutomaticTheme() {
        const mode = this.getAutoMode();

        if (mode === this.AUTO_MODES.SYSTEM) {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return this.THEMES.DARK_WARM;
            }
            return this.THEMES.LIGHT;
        }

        if (mode === this.AUTO_MODES.NIGHT) {
            const hour = new Date().getHours();
            const isNight = hour >= this.NIGHT_START_HOUR || hour < this.NIGHT_END_HOUR;
            return isNight ? this.THEMES.DARK_WARM : this.THEMES.LIGHT;
        }

        return this.getCurrentTheme();
    },

    applyAutomaticTheme(showFeedback = false) {
        const mode = this.getAutoMode();
        if (mode === this.AUTO_MODES.OFF) return;

        const theme = this.resolveAutomaticTheme();
        this.applyTheme(theme, { persist: false });

        if (showFeedback) {
            const modeLabel = mode === this.AUTO_MODES.SYSTEM ? 'sistema' : 'horário noturno';
            this.showThemeChangeNotification(theme, `Modo automático (${modeLabel}) aplicado`);
        }
    },

    /**
     * Atualiza a cor do tema no meta tag para PWA
     */
    updateMetaThemeColor(theme) {
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
        if (!metaTheme && !metaColorScheme) return;

        const colors = {
            [this.THEMES.LIGHT]: '#ff6b6b',
            [this.THEMES.DARK_CLASSIC]: '#1a1a1a',
            [this.THEMES.DARK_WARM]: '#1c1410',
            [this.THEMES.DARK_COOL]: '#0f1419',
            [this.THEMES.DARK_SEPIA]: '#1a1612'
        };

        const colorSchemes = {
            [this.THEMES.LIGHT]: 'light',
            [this.THEMES.DARK_CLASSIC]: 'dark',
            [this.THEMES.DARK_WARM]: 'dark',
            [this.THEMES.DARK_COOL]: 'dark',
            [this.THEMES.DARK_SEPIA]: 'dark'
        };

        if (metaTheme) {
            metaTheme.setAttribute('content', colors[theme] || colors[this.THEMES.LIGHT]);
        }
        if (metaColorScheme) {
            metaColorScheme.setAttribute('content', colorSchemes[theme] || 'light dark');
        }
    },

    /**
     * Inicializa o gerenciador de temas
     * Deve ser chamado ao carregar a página
     */
    init() {
        const currentMode = this.getAutoMode();
        const initialTheme = currentMode === this.AUTO_MODES.OFF
            ? this.getCurrentTheme()
            : this.resolveAutomaticTheme();

        this.applyTheme(initialTheme, { persist: false });
        
        // Configura os botões de tema (se existirem na página)
        this.setupThemeButtons();
        this.setupAutomationControls();
        this.setupSystemThemeListener();
        this.setupNightScheduleWatcher();

        console.log('✅ Theme Manager inicializado:', initialTheme, '| modo automático:', currentMode);
    },

    /**
     * Configura os event listeners dos botões de tema
     */
    setupThemeButtons() {
        const themeButtons = document.querySelectorAll('.theme-option-button');
        if (themeButtons.length === 0) return;

        const updateButtonStates = () => {
            const currentTheme = this.getCurrentTheme();
            themeButtons.forEach(button => {
                const theme = button.getAttribute('data-theme');
                if (theme === currentTheme) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        };

        updateButtonStates();

        themeButtons.forEach(button => {
            // Adiciona listener de click
            button.addEventListener('click', () => {
                if (this.getAutoMode() !== this.AUTO_MODES.OFF) {
                    const theme = button.getAttribute('data-theme');
                    this.showThemeChangeNotification(theme, 'Desative o modo automático para escolher manualmente');
                    return;
                }

                const theme = button.getAttribute('data-theme');
                
                // Aplica o tema
                this.applyTheme(theme);

                // Atualiza estados dos botões
                updateButtonStates();

                // Feedback visual
                this.showThemeChangeNotification(theme);
            });
        });

        this.updateThemeButtonsState();
    },

    setupAutomationControls() {
        const autoModeSelect = document.getElementById('themeAutoModeSelect');
        if (!autoModeSelect) return;

        autoModeSelect.value = this.getAutoMode();
        this.updateAutomationHint();

        autoModeSelect.addEventListener('change', () => {
            const mode = autoModeSelect.value;
            this.saveAutoMode(mode);
            this.updateThemeButtonsState();
            this.updateAutomationHint();

            if (mode === this.AUTO_MODES.OFF) {
                this.applyTheme(this.getCurrentTheme(), { persist: false });
                this.showThemeChangeNotification(this.getCurrentTheme(), 'Modo automático desligado');
                return;
            }

            this.applyAutomaticTheme(true);
        });
    },

    updateThemeButtonsState() {
        const themeButtons = document.querySelectorAll('.theme-option-button');
        if (!themeButtons.length) return;

        const autoEnabled = this.getAutoMode() !== this.AUTO_MODES.OFF;
        themeButtons.forEach(button => {
            // Marcar visualmente quando automação está ligada, mas não desabilitar
            button.style.opacity = autoEnabled ? '0.6' : '1';
            button.style.cursor = autoEnabled ? 'not-allowed' : 'pointer';
            button.title = autoEnabled 
                ? 'Desative o modo automático para escolher manualmente' 
                : button.getAttribute('title');
        });
    },

    updateAutomationHint() {
        const hint = document.getElementById('themeAutomationHint');
        if (!hint) return;

        const mode = this.getAutoMode();
        if (mode === this.AUTO_MODES.SYSTEM) {
            hint.textContent = 'Segue a configuração de tema do seu dispositivo.';
            return;
        }

        if (mode === this.AUTO_MODES.NIGHT) {
            hint.textContent = 'Ativa dark warm entre 19:00 e 07:00; fora desse horário volta para light.';
            return;
        }

        hint.textContent = 'Automação desligada. Você pode escolher manualmente um tema abaixo.';
    },

    setupSystemThemeListener() {
        if (!window.matchMedia) return;
        const media = window.matchMedia('(prefers-color-scheme: dark)');

        const handler = () => {
            if (this.getAutoMode() === this.AUTO_MODES.SYSTEM) {
                this.applyAutomaticTheme(false);
            }
        };

        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', handler);
        } else if (typeof media.addListener === 'function') {
            media.addListener(handler);
        }
    },

    setupNightScheduleWatcher() {
        if (this._nightIntervalId) {
            clearInterval(this._nightIntervalId);
        }

        this._nightIntervalId = setInterval(() => {
            if (this.getAutoMode() === this.AUTO_MODES.NIGHT) {
                this.applyAutomaticTheme(false);
            }
        }, 60 * 1000);
    },

    /**
     * Mostra uma notificação de mudança de tema
     */
    showThemeChangeNotification(theme, customMessage = '') {
        const themeNames = {
            [this.THEMES.LIGHT]: '☀️ Light',
            [this.THEMES.DARK_CLASSIC]: '🌙 Dark Classic',
            [this.THEMES.DARK_WARM]: '💡 Dark Warm',
            [this.THEMES.DARK_COOL]: '🌊 Dark Cool',
            [this.THEMES.DARK_SEPIA]: '📜 Dark Sepia'
        };

        const statusEl = document.getElementById('profileStatus');
        if (statusEl) {
            statusEl.textContent = customMessage || `Tema alterado para ${themeNames[theme] || theme}`;
            setTimeout(() => {
                statusEl.textContent = '';
            }, 3000);
        }
    },

    /**
     * Verifica se está no modo escuro
     */
    isDarkMode() {
        const current = this.resolveAutomaticTheme();
        return current !== this.THEMES.LIGHT;
    },

    /**
     * Alterna entre light e dark (usado para toggle simples)
     */
    toggleDarkMode() {
        const current = this.getCurrentTheme();
        const newTheme = current === this.THEMES.LIGHT 
            ? this.THEMES.DARK_WARM 
            : this.THEMES.LIGHT;
        this.applyTheme(newTheme);
    }
};

// Auto-inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
    ThemeManager.init();
}

// Exporta para uso global
window.ThemeManager = ThemeManager;
