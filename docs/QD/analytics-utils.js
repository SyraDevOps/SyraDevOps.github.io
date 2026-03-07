/* ========== SISTEMA DE ANALYTICS LOCAL ==========
   Não envia dados para servidores externos (privacidade)
   Armazena localmente eventos e métricas de uso
   Permite análise de padrões e melhorias
*/

// ===== CONSTANTES =====
const ANALYTICS_CONFIG = {
  STORAGE_KEY: 'qd_web_analytics_v1',
  SESSION_KEY: 'qd_web_session_v1',
  MAX_EVENTS: 1000,
  EVENT_RETENTION_DAYS: 30
};

// ===== EVENTOS RASTREADOS =====
const EVENT_TYPES = {
  // Auth
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  
  // Notas
  CREATE_NOTE: 'create_note',
  DELETE_NOTE: 'delete_note',
  EDIT_NOTE: 'edit_note',
  
  // Adesivos
  ADD_STICKER: 'add_sticker',
  REMOVE_STICKER: 'remove_sticker',
  FAVORITE_STICKER: 'favorite_sticker',
  
  // Desenho
  START_DRAWING: 'start_drawing',
  FINISH_DRAWING: 'finish_drawing',
  
  // Configurações
  CHANGE_PAPER: 'change_paper',
  CHANGE_FONT: 'change_font',
  CHANGE_COLOR: 'change_color',
  
  // Chat/IA
  SEND_MESSAGE: 'send_message',
  USE_AI_FEATURE: 'use_ai_feature',
  
  // Página
  PAGE_VIEW: 'page_view',
  FEATURE_USED: 'feature_used',
  ERROR_OCCURRED: 'error_occurred'
};

// ===== CLASSE ANALYTICS =====
class AnalyticsManager {
  constructor() {
    this.events = this.loadEvents();
    this.session = this.loadSession();
    this.startSession();
  }

  /**
   * Carrega eventos anteriores
   */
  loadEvents() {
    try {
      const stored = localStorage.getItem(ANALYTICS_CONFIG.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      return [];
    }
  }

  /**
   * Carrega dados da sessão atual
   */
  loadSession() {
    try {
      const stored = sessionStorage.getItem(ANALYTICS_CONFIG.SESSION_KEY);
      return stored ? JSON.parse(stored) : this.createNewSession();
    } catch (error) {
      return this.createNewSession();
    }
  }

  /**
   * Cria nova sessão
   */
  createNewSession() {
    return {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date().toISOString(),
      pageViews: [],
      eventCount: 0,
      errorCount: 0
    };
  }

  /**
   * Inicia nova sessão
   */
  startSession() {
    this.session = this.createNewSession();
    sessionStorage.setItem(ANALYTICS_CONFIG.SESSION_KEY, JSON.stringify(this.session));
    
    // Registra view da página inicial
    this.trackPageView(window.location.pathname);
    
    console.log(`📊 Analytics iniciado. ID sessão: ${this.session.id}`);
  }

  /**
   * Salva eventos em localStorage
   */
  saveEvents() {
    try {
      // Limpa eventos muito antigos (> 30 dias)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - ANALYTICS_CONFIG.EVENT_RETENTION_DAYS);
      
      this.events = this.events.filter(event => 
        new Date(event.timestamp) > cutoffDate
      );

      // Limita a máximo de eventos
      if (this.events.length > ANALYTICS_CONFIG.MAX_EVENTS) {
        this.events = this.events.slice(-ANALYTICS_CONFIG.MAX_EVENTS);
      }

      localStorage.setItem(ANALYTICS_CONFIG.STORAGE_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.error('Erro ao salvar eventos:', error);
    }
  }

  /**
   * Registra um evento
   * @param {string} eventType - Tipo de evento (use EVENT_TYPES)
   * @param {object} data - Dados adicionais do evento
   */
  trackEvent(eventType, data = {}) {
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      sessionId: this.session.id,
      url: window.location.pathname,
      data: data,
      userAgent: navigator.userAgent.substring(0, 50)
    };

    this.events.push(event);
    this.session.eventCount++;
    this.saveEvents();
    
    if (eventType === EVENT_TYPES.ERROR_OCCURRED) {
      this.session.errorCount++;
    }

    console.log(`📌 Evento rastreado: ${eventType}`, data);
    return event;
  }

  /**
   * Rastreia visualização de página
   * @param {string} path - Caminho da página
   */
  trackPageView(path = window.location.pathname) {
    const pageView = {
      path: path,
      timestamp: new Date().toISOString(),
      title: document.title
    };

    this.session.pageViews.push(pageView);
    sessionStorage.setItem(ANALYTICS_CONFIG.SESSION_KEY, JSON.stringify(this.session));
    
    this.trackEvent(EVENT_TYPES.PAGE_VIEW, { path, title: document.title });
  }

  /**
   * Rastreia tempo gasto em uma ação
   * @param {string} actionName - Nome da ação
   * @param {function} actionFn - Função a executar
   */
  async trackTiming(actionName, actionFn) {
    const startTime = performance.now();
    try {
      const result = await Promise.resolve(actionFn());
      const duration = performance.now() - startTime;

      this.trackEvent('timing', {
        action: actionName,
        duration: `${duration.toFixed(2)}ms`,
        success: true
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.trackEvent(EVENT_TYPES.ERROR_OCCURRED, {
        action: actionName,
        duration: `${duration.toFixed(2)}ms`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Rastreia cliques em elementos importantes
   */
  trackElementClicks() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-track]');
      if (target) {
        const trackingData = target.dataset.track;
        const elementId = target.id || target.className || 'unknown';
        
        this.trackEvent('element_click', {
          element: trackingData,
          id: elementId
        });
      }
    });
  }

  /**
   * Obtém estatísticas da sessão
   */
  getSessionStats() {
    return {
      sessionId: this.session.id,
      duration: new Date().getTime() - new Date(this.session.startTime).getTime(),
      pageViews: this.session.pageViews.length,
      eventCount: this.session.eventCount,
      errorCount: this.session.errorCount
    };
  }

  /**
   * Obtém resumo de eventos por tipo
   */
  getEventSummary() {
    const summary = {};

    this.events.forEach(event => {
      if (!summary[event.type]) {
        summary[event.type] = 0;
      }
      summary[event.type]++;
    });

    return summary;
  }

  /**
   * Obtém eventos filtrados
   */
  getEvents(filters = {}) {
    let filtered = this.events;

    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      filtered = filtered.filter(e => new Date(e.timestamp) >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      filtered = filtered.filter(e => new Date(e.timestamp) <= end);
    }

    if (filters.limit) {
      filtered = filtered.slice(-filters.limit);
    }

    return filtered;
  }

  /**
   * Cria relatório de uso
   */
  generateReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      totalEvents: this.events.length,
      totalSessions: new Set(this.events.map(e => e.sessionId)).size,
      currentSession: this.getSessionStats(),
      eventSummary: this.getEventSummary(),
      topFeatures: this.getTopFeatures(),
      errorRate: this.getErrorRate(),
      storageUsed: `${(new Blob([JSON.stringify(this.events)]).size / 1024).toFixed(2)} KB`
    };

    return report;
  }

  /**
   * Obtém features mais usadas
   */
  getTopFeatures(limit = 5) {
    const featureCounts = {};

    this.events.forEach(event => {
      if (event.type.startsWith('use_') || event.type.includes('feature')) {
        const feature = event.data.feature || event.type;
        featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      }
    });

    return Object.entries(featureCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([feature, count]) => ({ feature, count }));
  }

  /**
   * Calcula taxa de erros
   */
  getErrorRate() {
    const errors = this.events.filter(e => e.type === EVENT_TYPES.ERROR_OCCURRED).length;
    const rate = this.events.length > 0 ? ((errors / this.events.length) * 100).toFixed(2) : 0;
    return `${rate}%`;
  }

  /**
   * Exporta dados de analytics
   */
  exportData() {
    try {
      const data = {
        report: this.generateReport(),
        events: this.events.slice(-100) // Últimos 100 eventos
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `querido-diario-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Analytics exportados com sucesso');
    } catch (error) {
      console.error('Erro ao exportar analytics:', error);
    }
  }

  /**
   * Limpa todos os dados de analytics
   */
  clearAll() {
    this.events = [];
    localStorage.removeItem(ANALYTICS_CONFIG.STORAGE_KEY);
    sessionStorage.removeItem(ANALYTICS_CONFIG.SESSION_KEY);
    this.startSession();
    console.log('🗑️ Analytics limpos');
  }
}

// ===== INSTÂNCIA GLOBAL =====
const analyticsManager = new AnalyticsManager();

// ===== AUTO-TRACKING =====
if (typeof window !== 'undefined') {
  // Rastreia mudanças de página
  window.addEventListener('popstate', () => {
    analyticsManager.trackPageView();
  });

  // Rastreia cliques em elementos com data-track
  document.addEventListener('DOMContentLoaded', () => {
    analyticsManager.trackElementClicks();
  });

  // Faz logout de analytics quando página fecha
  window.addEventListener('beforeunload', () => {
    const stats = analyticsManager.getSessionStats();
    console.log('📊 Sessão finalizada:', stats);
  });

  // Exporta para window global
  window.AnalyticsManager = analyticsManager;
  window.EVENT_TYPES = EVENT_TYPES;
}
