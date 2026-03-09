// ============================================================
// Querido Diário - API Client
// Substitui localStorage por chamadas à API Go
// ============================================================

import { normalizeUsername, StorageAdapter, retryAsync, ErrorHandler } from './utils.js';

const API_BASE = 'https://api.syradevops.com/api';
const TOKEN_KEY = 'qd_auth_token';
const USER_KEY = 'qd_auth_user';

// Offline queue for failed requests
const OFFLINE_QUEUE_KEY = 'qd_offline_queue';
let offlineQueue = [];

function normalizeAuthUsername(value) {
    return normalizeUsername(value);
}

function resolveAuthUsername(data = {}, fallbackUser = {}) {
    return normalizeAuthUsername(data.username)
        || normalizeAuthUsername(data.displayName)
        || normalizeAuthUsername(data.user?.username)
    || normalizeAuthUsername(fallbackUser.username);
}

// ========== AUTH STATE ==========

const QDApi = {
    _token: StorageAdapter.get(TOKEN_KEY, null),
    _user: StorageAdapter.get(USER_KEY, null),

    get isAuthenticated() {
        return !!this._token;
    },

    get token() {
        return this._token;
    },

    get user() {
        return this._user;
    },

    setAuth(token, user) {
        this._token = token;
        this._user = user;
        // Note: In production, JWT should be in httpOnly cookies from backend
        // This is a temporary solution. See security recommendations.
        StorageAdapter.set(TOKEN_KEY, token);
        StorageAdapter.set(USER_KEY, user);
    },

    clearAuth() {
        this._token = null;
        this._user = null;
        StorageAdapter.remove(TOKEN_KEY);
        StorageAdapter.remove(USER_KEY);
    },

    // ========== HTTP HELPERS + RETRY LOGIC ==========

    async _fetch(path, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers
        };

        // Adiciona Authorization header com JWT token
        if (this._token) {
            headers['Authorization'] = `Bearer ${this._token}`;
        }

        const fetchOptions = {
            ...options,
            headers,
            credentials: 'include', // Envia cookies cross-origin (necessário para CORS)
        };

        try {
            // Use retry logic for important requests (configurable)
            const shouldRetry = options.retry !== false;
            const maxRetries = options.maxRetries || 2;
            
            const performFetch = async () => {
                const resp = await fetch(`${API_BASE}${path}`, fetchOptions);

                // Trata sessao expirada apenas para rotas autenticadas ja com token
                if (resp.status === 401 && this._token && !path.startsWith('/auth/')) {
                    this.clearAuth();
                    ErrorHandler.error('Sessão expirada. Faça login novamente.');
                    if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
                        setTimeout(() => window.location.href = 'index.html', 2000);
                    }
                    throw new Error('Sessão expirada');
                }

                // Log de erro para debug
                if (!resp.ok) {
                    console.error(`[API Error] ${options.method || 'GET'} ${path} → ${resp.status}`);
                }

                return resp;
            };

            // Apply retry logic if enabled
            if (shouldRetry && options.method !== 'GET') {
                return await retryAsync(performFetch, maxRetries, 1000);
            }
            
            return await performFetch();

        } catch (err) {
            console.error(`[API Network Error] ${path}:`, err.message);

            // Add to offline queue for later retry
            if (err.message.includes('fetch') || err.message.includes('network')) {
                this._addToOfflineQueue(path, options);
                ErrorHandler.warning('Sem conexão. Alterações serão salvas quando reconectar.');
            }

            // Erro comum de CORS/rede ao testar localmente contra API remota
            if (err instanceof TypeError && err.message === 'Failed to fetch') {
                throw new Error('Falha de conexão com a API. Verifique sua conexão com a internet.');
            }

            throw err;
        }
    },

    // Offline queue management
    _addToOfflineQueue(path, options) {
        // Only queue mutations, not GET requests
        if (options.method && options.method !== 'GET') {
            const queueItem = {
                path,
                options,
                timestamp: Date.now()
            };
            
            offlineQueue.push(queueItem);
            StorageAdapter.set(OFFLINE_QUEUE_KEY, offlineQueue);
        }
    },

    async processOfflineQueue() {
        offlineQueue = StorageAdapter.get(OFFLINE_QUEUE_KEY, []);
        
        if (offlineQueue.length === 0) return;

        const loadingToast = ErrorHandler.loading(`Sincronizando ${offlineQueue.length} alterações...`);
        let successCount = 0;

        for (const item of offlineQueue) {
            try {
                await this._fetch(item.path, { ...item.options, retry: false });
                successCount++;
            } catch (err) {
                console.error('Failed to process queued request:', err);
            }
        }

        // Clear queue
        offlineQueue = [];
        StorageAdapter.remove(OFFLINE_QUEUE_KEY);

        // Remove loading toast
        if (loadingToast && loadingToast.parentNode) {
            loadingToast.parentNode.removeChild(loadingToast);
        }

        if (successCount > 0) {
            ErrorHandler.success(`${successCount} alterações sincronizadas com sucesso!`);
        }
    },

    async _get(path) {
        const resp = await this._fetch(path);
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: 'Erro de rede' }));
            throw new Error(err.error || 'Erro ao buscar dados');
        }
        return resp.json();
    },

    async _post(path, body) {
        const resp = await this._fetch(path, {
            method: 'POST',
            body: JSON.stringify(body),
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: 'Erro de rede' }));
            throw new Error(err.error || 'Erro ao enviar dados');
        }
        return resp.json();
    },

    async _put(path, body) {
        const resp = await this._fetch(path, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: 'Erro de rede' }));
            throw new Error(err.error || 'Erro ao atualizar dados');
        }
        return resp.json();
    },

    async _delete(path) {
        const resp = await this._fetch(path, { method: 'DELETE' });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: 'Erro de rede' }));
            throw new Error(err.error || 'Erro ao deletar dados');
        }
        return resp.json();
    },

    // ========== AUTH ==========

    async register(username, email, password) {
        const data = await this._post('/auth/register', { username, email, password });
        const resolvedUsername = resolveAuthUsername(data, { username }) || normalizeAuthUsername(username);
        this.setAuth(data.token, { id: data.user_id, username: resolvedUsername });
        if (resolvedUsername) {
            try {
                await this.updateProfile({ displayName: resolvedUsername });
            } catch (error) {
                console.warn('Falha ao persistir displayName apos registro:', error?.message || error);
            }
        }
        return data;
    },

    async login(email, password) {
        const data = await this._post('/auth/login', { email, password });
        const resolvedUsername = resolveAuthUsername(data, this._user || {});
        this.setAuth(data.token, { id: data.user_id, username: resolvedUsername || '' });
        if (resolvedUsername) {
            try {
                await this.updateProfile({ displayName: resolvedUsername });
            } catch (error) {
                console.warn('Falha ao persistir displayName apos login:', error?.message || error);
            }
        }
        return data;
    },

    logout() {
        this.clearAuth();
        window.location.href = 'index.html';
    },

    // ========== PROFILE ==========

    async getProfile() {
        return this._get('/profile');
    },

    async updateProfile(data) {
        return this._put('/profile', data);
    },

    // ========== SETTINGS ==========

    async getPaperSettings() {
        return this._get('/settings/paper');
    },

    async updatePaperSettings(data) {
        return this._put('/settings/paper', data);
    },

    async getFontSettings() {
        return this._get('/settings/font');
    },

    async updateFontSettings(data) {
        return this._put('/settings/font', data);
    },

    // ========== CHATS ==========

    async getChats() {
        return this._get('/chats');
    },

    async createChat(id, title) {
        return this._post('/chats', { id, title });
    },

    async updateChat(id, title) {
        return this._put(`/chats/${encodeURIComponent(id)}`, { title });
    },

    async deleteChat(id) {
        return this._delete(`/chats/${encodeURIComponent(id)}`);
    },

    async setActiveChat(chatId) {
        return this._put('/chats-active', { chatId });
    },

    // ========== MESSAGES ==========

    async getMessages(chatId) {
        return this._get(`/chats/${encodeURIComponent(chatId)}/messages`);
    },

    async createMessage(chatId, role, text) {
        return this._post(`/chats/${encodeURIComponent(chatId)}/messages`, { role, text });
    },

    // ========== STICKY NOTES ==========

    async getNotes() {
        return this._get('/notes');
    },

    async createNote(note) {
        return this._post('/notes', note);
    },

    async updateNote(id, note) {
        return this._put(`/notes/${encodeURIComponent(id)}`, note);
    },

    async deleteNote(id) {
        return this._delete(`/notes/${encodeURIComponent(id)}`);
    },

    async bulkUpdateNotes(notes) {
        return this._put('/notes-bulk', notes);
    },

    // ========== MEMORIES ==========

    async getMemories() {
        return this._get('/memories');
    },

    async createMemory(memory) {
        return this._post('/memories', memory);
    },

    // ========== TIMELINE ==========

    async getTimeline() {
        return this._get('/timeline');
    },

    async createTimelineEntry(entry) {
        return this._post('/timeline', entry);
    },

    // ========== STICKER FAVORITES ==========

    async getStickerFavorites() {
        return this._get('/stickers/favorites');
    },

    async addStickerFavorite(key) {
        return this._post('/stickers/favorites', { key });
    },

    async removeStickerFavorite(key) {
        return this._delete(`/stickers/favorites/${encodeURIComponent(key)}`);
    },

    // ========== DRAWING ==========

    async getDrawing() {
        return this._get('/drawing');
    },

    async updateDrawing(dataUrl) {
        return this._put('/drawing', { dataUrl });
    },

    // ========== AI PROXY ==========

    async aiChat(prompt, maxTokens = 8192) {
        return this._post('/ai/chat', { prompt, maxTokens });
    },

    async aiSynthesize(prompt, maxTokens = 8192) {
        return this._post('/ai/synthesize', { prompt, maxTokens });
    },

    async aiMemory(prompt, maxTokens = 2048) {
        return this._post('/ai/memory', { prompt, maxTokens });
    },

    // ========== HEALTH ==========

    async health() {
        try {
            const resp = await fetch(`${API_BASE}/health`);
            return resp.ok;
        } catch {
            return false;
        }
    }
};

// ========== AUTH GUARD ==========
// Redireciona para login se não autenticado (exceto na página index)
(function() {
    const pathname = window.location.pathname;
    const isLoginPage = pathname.endsWith('/index.html') || pathname.endsWith('/');
    if (!QDApi.isAuthenticated && !isLoginPage) {
        window.location.href = 'index.html';
    }
})();
