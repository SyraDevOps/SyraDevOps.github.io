/* ========== SISTEMA DE BACKUP E VERSIONAMENTO ==========
   Realiza backup automático de dados críticos
   Mantém histórico de versões para recuperação
   Permite export/import de dados
*/

// ===== CONSTANTES =====
const BACKUP_CONFIG = {
  AUTO_BACKUP_INTERVAL: 5 * 60 * 1000, // 5 minutos
  MAX_VERSIONS: 10,
  STORAGE_KEY: 'qd_web_backups_v1',
  VERSION_KEY: 'qd_web_versions_v1',
  CRITICAL_KEYS: [
    'qd_web_profile_settings_v1',
    'qd_web_sticker_favorites_v1',
    'qd_web_paper_settings_v1',
    'qd_web_drawing_v1',
    'qd_web_font_settings_v1'
  ]
};

// ===== ESTRUTURA DE BACKUP =====
class BackupManager {
  constructor() {
    this.backups = this.loadBackups();
    this.versions = this.loadVersions();
    this.autoBackupIntervalId = null;
  }

  /**
   * Carrega backups anteriores do localStorage
   */
  loadBackups() {
    try {
      const backupData = localStorage.getItem(BACKUP_CONFIG.STORAGE_KEY);
      return backupData ? JSON.parse(backupData) : [];
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
      return [];
    }
  }

  /**
   * Carrega histórico de versões
   */
  loadVersions() {
    try {
      const versionData = localStorage.getItem(BACKUP_CONFIG.VERSION_KEY);
      return versionData ? JSON.parse(versionData) : {};
    } catch (error) {
      console.error('Erro ao carregar versões:', error);
      return {};
    }
  }

  /**
   * Salva backups no localStorage
   */
  saveBackups() {
    try {
      // Limita a 10 backups máximo
      if (this.backups.length > BACKUP_CONFIG.MAX_VERSIONS) {
        this.backups = this.backups.slice(-BACKUP_CONFIG.MAX_VERSIONS);
      }
      localStorage.setItem(BACKUP_CONFIG.STORAGE_KEY, JSON.stringify(this.backups));
    } catch (error) {
      console.error('Erro ao salvar backups:', error);
    }
  }

  /**
   * Salva histórico de versões
   */
  saveVersions() {
    try {
      localStorage.setItem(BACKUP_CONFIG.VERSION_KEY, JSON.stringify(this.versions));
    } catch (error) {
      console.error('Erro ao salvar versões:', error);
    }
  }

  /**
   * Cria um backup dos dados críticos AGORA
   * @param {string} label - Descrição do backup (ex: "Backup pre-reset")
   * @returns {object} Backup criado
   */
  createBackup(label = '') {
    const backup = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('pt-BR'),
      label: label,
      data: {},
      size: 0
    };

    // Coleta dados críticos
    BACKUP_CONFIG.CRITICAL_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        backup.data[key] = value;
        backup.size += new Blob([value]).size;
      }
    });

    this.backups.push(backup);
    this.saveBackups();

    console.log(`✅ Backup criado: ${label || backup.timestamp}`);
    return backup;
  }

  /**
   * Restaura um backup específico
   * @param {number} backupId - ID do backup
   * @returns {boolean} Sucesso da restauração
   */
  restoreBackup(backupId) {
    const backup = this.backups.find(b => b.id === backupId);
    if (!backup) {
      console.error('Backup não encontrado');
      return false;
    }

    try {
      // Cria backup dos dados atuais antes de restaurar (segurança)
      this.createBackup(`Backup automático antes de restaurar ${backup.timestamp}`);

      // Restaura dados
      Object.entries(backup.data).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      console.log(`✅ Backup restaurado: ${backup.timestamp}`);
      return true;
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      return false;
    }
  }

  /**
   * Deleta um backup específico
   */
  deleteBackup(backupId) {
    this.backups = this.backups.filter(b => b.id !== backupId);
    this.saveBackups();
  }

  /**
   * Lista todos os backups
   */
  listBackups() {
    return this.backups.map(b => ({
      id: b.id,
      timestamp: b.timestamp,
      label: b.label,
      size: `${(b.size / 1024).toFixed(2)} KB`
    }));
  }

  /**
   * Registra mudança em um dado (versionamento)
   * @param {string} key - Chave do localStorage
   * @param {string} value - Novo valor
   */
  trackVersion(key, value) {
    if (!this.versions[key]) {
      this.versions[key] = [];
    }

    const version = {
      timestamp: new Date().toISOString(),
      size: new Blob([value]).size,
      preview: value.substring(0, 50) + '...'
    };

    this.versions[key].push(version);

    // Limita histórico de versões
    if (this.versions[key].length > 50) {
      this.versions[key] = this.versions[key].slice(-50);
    }

    this.saveVersions();
  }

  /**
   * Obtém histórico de versões de um dado
   */
  getVersionHistory(key) {
    return this.versions[key] || [];
  }

  /**
   * Inicia backup automático a cada 5 minutos
   */
  startAutoBackup() {
    if (this.autoBackupIntervalId) {
      clearInterval(this.autoBackupIntervalId);
    }

    this.autoBackupIntervalId = setInterval(() => {
      this.createBackup('Backup automático');
    }, BACKUP_CONFIG.AUTO_BACKUP_INTERVAL);

    console.log('✅ Backup automático iniciado (a cada 5 min)');
  }

  /**
   * Para backup automático
   */
  stopAutoBackup() {
    if (this.autoBackupIntervalId) {
      clearInterval(this.autoBackupIntervalId);
      console.log('⏹ Backup automático parado');
    }
  }

  /**
   * Exporta dados para arquivo JSON (download)
   */
  exportBackup(backupId = null) {
    try {
      let dataToExport;

      if (backupId) {
        // Exporta backup específico
        const backup = this.backups.find(b => b.id === backupId);
        if (!backup) throw new Error('Backup não encontrado');
        dataToExport = backup.data;
      } else {
        // Exporta dados atuais
        dataToExport = {};
        BACKUP_CONFIG.CRITICAL_KEYS.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) dataToExport[key] = value;
        });
      }

      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `querido-diario-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Backup exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
    }
  }

  /**
   * Importa dados de um arquivo JSON
   * @param {File} file - Arquivo JSON selecionado
   */
  async importBackup(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Valida estrutura básica
      if (typeof data !== 'object') throw new Error('Formato inválido');

      // Cria backup automático antes de importar
      this.createBackup('Backup automático antes de importar dados');

      // Importa dados
      Object.entries(data).forEach(([key, value]) => {
        if (BACKUP_CONFIG.CRITICAL_KEYS.includes(key)) {
          localStorage.setItem(key, value);
        }
      });

      console.log('✅ Backup importado com sucesso. Página será recarregada...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      alert('Erro ao importar backup. Verifique se o arquivo é válido.');
    }
  }

  /**
   * Calcula espaço total usado
   */
  getTotalStorageUsed() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      total += new Blob([value]).size;
    }
    return `${(total / 1024).toFixed(2)} KB`;
  }

  /**
   * Limpa dados antigos (mantém apenas últimas versões)
   */
  cleanupOldData(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTimestamp = cutoffDate.getTime();

    this.backups = this.backups.filter(b => b.id > cutoffTimestamp);
    this.saveBackups();

    console.log(`✅ Dados antigos removidos (mantidos últimos ${daysToKeep} dias)`);
  }
}

// ===== INSTÂNCIA GLOBAL =====
const backupManager = new BackupManager();

// ===== INICIALIZAÇÃO AUTOMÁTICA =====
if (typeof window !== 'undefined') {
  // Inicia backup automático quando página carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      backupManager.startAutoBackup();
    });
  } else {
    backupManager.startAutoBackup();
  }

  // Faz backup ao sair da página
  window.addEventListener('beforeunload', () => {
    backupManager.createBackup('Backup automático ao fechar página');
  });

  // Exporta para window global
  window.BackupManager = backupManager;
}
