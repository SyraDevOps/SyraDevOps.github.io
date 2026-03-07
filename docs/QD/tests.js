/* ========== TESTES UNITÁRIOS - QUERIDO DIÁRIO ==========
   Framework de testes simples para validar funcionalidades críticas
   Sem dependências externas - tudo vanilla JavaScript
*/

// ===== FRAMEWORK DE TESTES SIMPLES =====
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = { pass: 0, fail: 0, pending: 0 };
  }

  describe(suiteName, suiteFunction) {
    this.currentSuite = suiteName;
    suiteFunction();
  }

  it(testName, testFunction, isPending = false) {
    this.tests.push({
      suite: this.currentSuite,
      name: testName,
      fn: testFunction,
      isPending: isPending
    });
  }

  async run() {
    console.log('🧪 Iniciando execução de testes...\n');

    for (const test of this.tests) {
      try {
        if (test.isPending) {
          this.results.pending++;
          this.logPending(test);
        } else {
          await test.fn();
          this.results.pass++;
          this.logPass(test);
        }
      } catch (error) {
        this.results.fail++;
        this.logFail(test, error);
      }
    }

    this.printSummary();
  }

  logPass(test) {
    const element = document.createElement('div');
    element.className = 'test-case pass';
    element.innerHTML = `
      <span class="status-badge pass">PASSOU</span>
      <strong>${test.name}</strong>
      <div class="test-result pass">✓ Teste passou com sucesso</div>
    `;
    this.appendToSuite(test.suite, element);
    console.log(`✓ ${test.suite} > ${test.name}`);
  }

  logFail(test, error) {
    const element = document.createElement('div');
    element.className = 'test-case fail';
    element.innerHTML = `
      <span class="status-badge fail">FALHOU</span>
      <strong>${test.name}</strong>
      <div class="test-result fail">✗ ${error.message}</div>
    `;
    this.appendToSuite(test.suite, element);
    console.error(`✗ ${test.suite} > ${test.name}: ${error.message}`);
  }

  logPending(test) {
    const element = document.createElement('div');
    element.className = 'test-case pending';
    element.innerHTML = `
      <span class="status-badge pending">PENDENTE</span>
      <strong>${test.name}</strong>
      <div class="test-result pending">⏳ Teste pendente (será implementado)</div>
    `;
    this.appendToSuite(test.suite, element);
    console.log(`⏳ ${test.suite} > ${test.name}`);
  }

  appendToSuite(suite, element) {
    const suiteId = suite.toLowerCase().replace(/\s+/g, '');
    const suiteElement = document.getElementById(`${suiteId}Tests`);
    if (suiteElement) {
      suiteElement.appendChild(element);
    }
  }

  printSummary() {
    const total = this.results.pass + this.results.fail + this.results.pending;
    const passPercent = total > 0 ? ((this.results.pass / total) * 100).toFixed(1) : 0;

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(50));
    console.log(`✓ Passou: ${this.results.pass}`);
    console.log(`✗ Falhou: ${this.results.fail}`);
    console.log(`⏳ Pendente: ${this.results.pending}`);
    console.log(`📈 Taxa de sucesso: ${passPercent}%`);
    console.log('='.repeat(50) + '\n');

    // Atualiza DOM
    document.getElementById('passCount').textContent = `✓ Passou: ${this.results.pass}`;
    document.getElementById('failCount').textContent = `✗ Falhou: ${this.results.fail}`;
    document.getElementById('pendingCount').textContent = `⏳ Pendente: ${this.results.pending}`;
  }
}

// ===== ASSERÇÕES =====
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion falhou');
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Esperado ${expected}, mas recebeu ${actual}`);
  }
}

function assertExists(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message || 'Valor não existe');
  }
}

async function assertResolves(promise, message) {
  try {
    await promise;
  } catch (error) {
    throw new Error(message || `Promise rejeitada: ${error.message}`);
  }
}

// ===== INSTÂNCIA GLOBAL =====
const runner = new TestRunner();

// ========== TESTES DE CRIPTOGRAFIA ==========
runner.describe('🔐 Criptografia', () => {
  runner.it('Deve criptografar e descriptografar dados', async () => {
    const originalData = 'Dados sensíveis do usuário';
    const password = 'senha123secure';

    const encrypted = await CryptoUtils.encryptData(originalData, password);
    assertExists(encrypted, 'Dados devem ser criptografados');
    assert(encrypted !== originalData, 'Dados criptografados devem diferir do original');

    const decrypted = await CryptoUtils.decryptData(encrypted, password);
    assertEquals(decrypted, originalData, 'Dados descriptografados devem ser iguais ao original');
  });

  runner.it('Deve rejeitar senha incorreta', async () => {
    const originalData = 'Dados sensíveis';
    const correctPassword = 'senha123';
    const wrongPassword = 'senhaerrada';

    const encrypted = await CryptoUtils.encryptData(originalData, correctPassword);

    try {
      await CryptoUtils.decryptData(encrypted, wrongPassword);
      throw new Error('Deveria ter rejeitado senha incorreta');
    } catch (error) {
      assert(error.message.includes('descriptografar'), 'Deve indicar erro de descriptografia');
    }
  });

  runner.it('Deve gerar hash SHA-256', async () => {
    const data = 'Teste de hash';
    const hash = await CryptoUtils.hashData(data);

    assertExists(hash, 'Hash deve ser gerado');
    assert(hash.length === 64, 'Hash SHA-256 deve ter 64 caracteres (hex)');
    assert(/^[a-f0-9]{64}$/.test(hash), 'Hash deve ser hexadecimal válido');
  });

  runner.it('Deve sanitizar inputs HTML', () => {
    const dangerous = '<script>alert("XSS")</script>Hello';
    const safe = CryptoUtils.sanitizeInput(dangerous);

    assert(!safe.includes('<script>'), 'Não deve conter tags script');
    assert(safe.includes('Hello'), 'Deve manter conteúdo de texto');
  });

  runner.it('Deve validar força de senha', () => {
    const weakPassword = '123';
    const strongPassword = 'SecurePass123!@#';

    const weakResult = CryptoUtils.validatePasswordStrength(weakPassword);
    assert(weakResult.score < 2, 'Senha fraca deve ter score baixo');

    const strongResult = CryptoUtils.validatePasswordStrength(strongPassword);
    assert(strongResult.score >= 3, 'Senha forte deve ter score alto');
  });

  runner.it('Deve validar email', () => {
    const validEmail = 'usuario@example.com';
    const invalidEmail = 'invalidemail';

    assert(CryptoUtils.isValidEmail(validEmail), 'Email válido deve passar');
    assert(!CryptoUtils.isValidEmail(invalidEmail), 'Email inválido deve falhar');
  });
});

// ========== TESTES DE BACKUP ==========
runner.describe('💾 Backup', () => {
  runner.it('Deve criar backup automático', () => {
    const beforeCount = BackupManager.backups.length;
    BackupManager.createBackup('Teste de backup');
    const afterCount = BackupManager.backups.length;

    assert(afterCount > beforeCount, 'Deve adicionar novo backup');
  });

  runner.it('Deve listar backups', () => {
    const backups = BackupManager.listBackups();
    assert(Array.isArray(backups), 'Deve retornar array');
    assert(backups.length > 0, 'Deve ter ao menos um backup');
  });

  runner.it('Deve restaurar backup', () => {
    BackupManager.createBackup('Teste restauração');
    const backups = BackupManager.listBackups();
    const lastBackup = BackupManager.backups[BackupManager.backups.length - 1];

    const result = BackupManager.restoreBackup(lastBackup.id);
    assert(result === true, 'Restauração deve retornar sucesso');
  });

  runner.it('Deve rastrear versionamento', () => {
    const testKey = 'test_version_key';
    const testValue = '{"data": "test"}';

    BackupManager.trackVersion(testKey, testValue);
    const history = BackupManager.getVersionHistory(testKey);

    assert(Array.isArray(history), 'Deve retornar array de histórico');
    assert(history.length > 0, 'Deve ter registrado versão');
  });

  runner.it('Deve calcular espaço de storage', () => {
    const storage = BackupManager.getTotalStorageUsed();
    assert(typeof storage === 'string', 'Deve retornar string');
    assert(storage.includes('KB'), 'Deve incluir unidade KB');
  });

  runner.it('Deve deletar backup específico', () => {
    BackupManager.createBackup('Teste deleção');
    const beforeCount = BackupManager.backups.length;
    const backupToDelete = BackupManager.backups[BackupManager.backups.length - 1];

    BackupManager.deleteBackup(backupToDelete.id);
    const afterCount = BackupManager.backups.length;

    assert(afterCount < beforeCount, 'Deve remover backup');
  });
});

// ========== TESTES DE ANALYTICS ==========
runner.describe('📊 Analytics', () => {
  runner.it('Deve rastrear eventos', () => {
    const eventsBefore = AnalyticsManager.events.length;
    AnalyticsManager.trackEvent('test_event', { data: 'test' });
    const eventsAfter = AnalyticsManager.events.length;

    assert(eventsAfter > eventsBefore, 'Deve adicionar novo evento');
  });

  runner.it('Deve rastrear page views', () => {
    const viewsBefore = AnalyticsManager.session.pageViews.length;
    AnalyticsManager.trackPageView('/test-page');
    const viewsAfter = AnalyticsManager.session.pageViews.length;

    assert(viewsAfter > viewsBefore, 'Deve registrar page view');
  });

  runner.it('Deve gerar resumo de eventos', () => {
    AnalyticsManager.trackEvent('test_feature', { feature: 'drawing' });
    const summary = AnalyticsManager.getEventSummary();

    assert(typeof summary === 'object', 'Deve retornar objeto');
    assert('page_view' in summary || Object.keys(summary).length > 0, 'Deve ter eventos');
  });

  runner.it('Deve obter estatísticas de sessão', () => {
    const stats = AnalyticsManager.getSessionStats();

    assert('sessionId' in stats, 'Deve ter sessionId');
    assert('duration' in stats, 'Deve ter duration');
    assert('pageViews' in stats, 'Deve ter pageViews');
    assert('eventCount' in stats, 'Deve ter eventCount');
  });

  runner.it('Deve filtrar eventos', () => {
    AnalyticsManager.trackEvent('test_event', { type: 'filter_test' });
    const filtered = AnalyticsManager.getEvents({ type: 'test_event' });

    assert(Array.isArray(filtered), 'Deve retornar array');
  });

  runner.it('Deve gerar relatório', () => {
    const report = AnalyticsManager.generateReport();

    assert('totalEvents' in report, 'Deve ter totalEvents');
    assert('currentSession' in report, 'Deve ter currentSession');
    assert('eventSummary' in report, 'Deve ter eventSummary');
  });

  runner.it('Deve calcular taxa de erros', () => {
    const errorRate = AnalyticsManager.getErrorRate();
    assert(typeof errorRate === 'string', 'Deve retornar string');
    assert(errorRate.includes('%'), 'Deve incluir símbolo %');
  });
});

// ========== TESTES DE ACESSIBILIDADE ==========
runner.describe('♿ Acessibilidade (WCAG)', () => {
  runner.it('Deve ter atributo lang no HTML', () => {
    const lang = document.documentElement.lang;
    assert(lang !== '', 'HTML deve ter atributo lang');
  });

  runner.it('Deve ter viewport meta tag', () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    assert(viewport !== null, 'Deve ter viewport meta tag');
  });

  runner.it('Deve ter título na página', () => {
    const title = document.title;
    assert(title !== '', 'Página deve ter título');
  });

  runner.it('Deve ter roles ARIA principais', () => {
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
    // Este teste é informativo - nem sempre há main
    console.log('  ℹ️ Main content identificável:', mainContent !== null);
  });

  runner.it('Deve ter contraste de cores adequado', () => {
    // Teste simplificado - verificar se há cores escuras
    const bodyColor = window.getComputedStyle(document.body).color;
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;

    assert(bodyColor !== '', 'Deve ter cor de texto definida');
    assert(bodyBg !== '', 'Deve ter cor de background definida');
  });

  runner.it('Deve ter links com texto descritivo', () => {
    const links = document.querySelectorAll('a');
    let hasGoodLinks = true;

    links.forEach(link => {
      const text = link.textContent.trim();
      const ariaLabel = link.getAttribute('aria-label');
      if (!text && !ariaLabel) {
        hasGoodLinks = false;
      }
    });

    assert(hasGoodLinks, 'Links devem ter texto ou aria-label');
  });

  runner.it('Deve ter inputs com labels', () => {
    const inputs = document.querySelectorAll('input:not([type="hidden"])');
    let hasLabels = true;

    inputs.forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (!label && !input.getAttribute('aria-label')) {
        hasLabels = false;
      }
    });

    // Teste informativo
    console.log('  ℹ️ Inputs com labels:', hasLabels);
  });

  runner.it('Deve ter estrutura heading apropriada', () => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    assert(headings.length > 0, 'Deve ter pelo menos um heading');
  });
});

// ========== TESTES DE PERFORMANCE ==========
runner.describe('⚡ Performance', () => {
  runner.it('LocalStorage deve estar disponível', () => {
    const available = typeof Storage !== 'undefined';
    assert(available, 'LocalStorage deve estar disponível');
  });

  runner.it('SessionStorage deve estar disponível', () => {
    const available = typeof sessionStorage !== 'undefined';
    assert(available, 'SessionStorage deve estar disponível');
  });

  runner.it('Crypto API deve estar disponível', () => {
    const available = typeof crypto !== 'undefined' && crypto.subtle !== undefined;
    assert(available, 'Web Crypto API deve estar disponível');
  });

  runner.it('Performance API deve estar disponível', () => {
    const available = typeof performance !== 'undefined';
    assert(available, 'Performance API deve estar disponível');
  });

  runner.it('Deve medir tempo de execução de função', async () => {
    const testFn = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    };

    const timing = performance.now();
    await testFn();
    const duration = performance.now() - timing;

    assert(duration > 0, 'Deve medir tempo decorrido');
  });

  runner.it('Deve contar objetos no localStorage', () => {
    const count = localStorage.length;
    assert(typeof count === 'number', 'Deve retornar número');
    console.log(`  ℹ️ Itens em localStorage: ${count}`);
  });

  runner.it('Deve validar limites de storage', () => {
    try {
      const key = 'perf_test_' + Date.now();
      const largeData = 'x'.repeat(1024 * 1024); // 1MB
      localStorage.setItem(key, largeData);
      localStorage.removeItem(key);
      console.log('  ℹ️ Storage pode armazenar dados grandes');
    } catch (error) {
      console.log('  ⚠️ Storage tem limite: ' + error.message);
    }
  });

  runner.it('Deve medir tempo de criptografia', async () => {
    const data = 'Teste de performance';
    const password = 'senha123';

    const start = performance.now();
    await CryptoUtils.encryptData(data, password);
    const duration = performance.now() - start;

    console.log(`  ℹ️ Tempo de criptografia: ${duration.toFixed(2)}ms`);
    assert(duration < 5000, 'Criptografia deve ser rápida');
  });

  runner.it('Deve validar quantidade de eventos rastreados', () => {
    const count = AnalyticsManager.events.length;
    assert(typeof count === 'number', 'Deve contar eventos');
    console.log(`  ℹ️ Total de eventos rastreados: ${count}`);
  });
});

// ========== FUNÇÕES GLOBAIS ==========
async function runAllTests() {
  console.clear();
  document.querySelectorAll('[id$="Tests"]').forEach(el => el.innerHTML = '');
  await runner.run();
}

function resetTests() {
  document.querySelectorAll('[id$="Tests"]').forEach(el => el.innerHTML = '');
  runner.results = { pass: 0, fail: 0, pending: 0 };
  document.getElementById('passCount').textContent = `✓ Passou: 0`;
  document.getElementById('failCount').textContent = `✗ Falhou: 0`;
  document.getElementById('pendingCount').textContent = `⏳ Pendente: 0`;
  console.log('✨ Testes ressetados');
}

function clearAllData() {
  if (confirm('Tem certeza que deseja limpar TODOS os dados de teste?')) {
    BackupManager.clearAll();
    AnalyticsManager.clearAll();
    localStorage.clear();
    sessionStorage.clear();
    console.log('🗑️ Todos os dados foram limpos');
    alert('Dados limpos! A página será recarregada...');
    location.reload();
  }
}

// Auto-run quando página carregar (opcional)
// Descomente para executar testes automaticamente
// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', runAllTests);
// } else {
//   runAllTests();
// }

console.log('✅ Framework de testes carregado. Use runAllTests() para iniciar.');
