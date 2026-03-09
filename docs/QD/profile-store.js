// ============================================================
// Querido Diario - Profile Store
// Estado unico de perfil no frontend
// ============================================================

(function initQDProfileStore() {
    let _profileCache = null;

    function normalizeUsername(value) {
        if (typeof value !== 'string') return '';
        const trimmed = value.trim();
        if (!trimmed) return '';
        return trimmed.startsWith('@') ? trimmed.slice(1).trim() : trimmed;
    }

    function resolveDisplayName(...sources) {
        for (const source of sources) {
            if (!source) continue;
            if (typeof source === 'string') {
                const direct = normalizeUsername(source);
                if (direct) return direct;
                continue;
            }

            const fromUsername = normalizeUsername(source.username);
            if (fromUsername) return fromUsername;

            const fromDisplayName = normalizeUsername(source.displayName);
            if (fromDisplayName) return fromDisplayName;
        }
        return '';
    }

    function getSessionUser() {
        return window.QDApi?.user || null;
    }

    function getSessionUsername() {
        return resolveDisplayName(getSessionUser());
    }

    function getDefaultProfile() {
        const fallbackName = getSessionUsername() || 'Seu nome';
        return {
            username: fallbackName,
            displayName: fallbackName,
            realName: '',
            identityNotes: '',
            responsePrompt: '',
            synthesisPrompt: '',
            photoDataUrl: ''
        };
    }

    function trackMissingNameTelemetry(payload) {
        try {
            if (!window.AnalyticsManager || !window.EVENT_TYPES) return;
            window.AnalyticsManager.trackEvent(window.EVENT_TYPES.ERROR_OCCURRED, {
                area: 'profile-store',
                reason: 'missing_display_name',
                ...payload
            });
        } catch {
            // Evita que telemetria quebre fluxo de perfil.
        }
    }

    function syncAuthUserDisplayName(name) {
        const clean = normalizeUsername(name);
        if (!clean || !window.QDApi?.user) return;
        try {
            const merged = { ...window.QDApi.user, username: clean };
            window.QDApi._user = merged;
            localStorage.setItem('qd_auth_user', JSON.stringify(merged));
        } catch {
            // Sync local best-effort.
        }
    }

    function normalizeProfilePayload(data) {
        const defaults = getDefaultProfile();
        const resolved = resolveDisplayName(data, { username: getSessionUsername(), displayName: getSessionUsername() }) || defaults.displayName;
        return {
            username: resolved,
            displayName: resolved,
            realName: data?.realName || '',
            identityNotes: data?.identityNotes || '',
            responsePrompt: data?.responsePrompt || '',
            synthesisPrompt: data?.synthesisPrompt || '',
            photoDataUrl: data?.photoDataUrl || ''
        };
    }

    async function loadProfile(options = {}) {
        const force = !!options.force;
        if (!force && _profileCache) return _profileCache;

        if (!window.QDApi || !window.QDApi.isAuthenticated) {
            _profileCache = getDefaultProfile();
            return _profileCache;
        }

        try {
            const data = await window.QDApi.getProfile();
            const hasApiName = !!resolveDisplayName(data);
            if (!hasApiName) {
                trackMissingNameTelemetry({
                    hasUsername: !!normalizeUsername(data?.username),
                    hasDisplayName: !!normalizeUsername(data?.displayName)
                });
            }
            _profileCache = normalizeProfilePayload(data);
            syncAuthUserDisplayName(_profileCache.displayName);
            return _profileCache;
        } catch {
            _profileCache = getDefaultProfile();
            return _profileCache;
        }
    }

    async function saveProfile(settings = {}) {
        const normalized = normalizeProfilePayload(settings);
        _profileCache = normalized;

        if (!window.QDApi || !window.QDApi.isAuthenticated) {
            return normalized;
        }

        await window.QDApi.updateProfile({
            displayName: normalized.displayName,
            realName: normalized.realName,
            identityNotes: normalized.identityNotes,
            responsePrompt: normalized.responsePrompt,
            synthesisPrompt: normalized.synthesisPrompt,
            photoDataUrl: normalized.photoDataUrl
        });

        syncAuthUserDisplayName(normalized.displayName);
        return normalized;
    }

    async function ensureDisplayName(preferredName) {
        const cleanPreferred = normalizeUsername(preferredName);
        const sessionName = getSessionUsername();
        const target = cleanPreferred || sessionName;
        if (!target || !window.QDApi?.isAuthenticated) return null;

        const current = await loadProfile({ force: true });
        if (normalizeUsername(current.displayName) === target) {
            syncAuthUserDisplayName(target);
            return current;
        }

        const updated = await saveProfile({ ...current, displayName: target, username: target });
        return updated;
    }

    window.QDProfileStore = {
        normalizeUsername,
        resolveDisplayName,
        getSessionUsername,
        getDefaultProfile,
        loadProfile,
        saveProfile,
        ensureDisplayName,
        clearCache() {
            _profileCache = null;
        }
    };
})();
