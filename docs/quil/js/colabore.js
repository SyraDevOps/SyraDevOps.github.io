// ===== JAVASCRIPT ESPECÍFICO PARA PÁGINA DE COLABORAÇÃO =====

class ColaborePage {
  constructor() {
    this.init();
  }

  init() {
    this.setupFormHandlers();
    this.setupDynamicFields();
    this.setupSmoothScrolling();
    this.setupFormValidation();
  }

  setupFormHandlers() {
    // Formulário de Voluntariado
    const voluntarioForm = document.getElementById('voluntarioForm');
    if (voluntarioForm) {
      voluntarioForm.addEventListener('submit', (e) => this.handleVoluntarioSubmit(e));
    }

    // Formulário de Doação
    const doacaoForm = document.getElementById('doacaoForm');
    if (doacaoForm) {
      doacaoForm.addEventListener('submit', (e) => this.handleDoacaoSubmit(e));
    }

    // Formulário de Parceria
    const parceriaForm = document.getElementById('parceriaForm');
    if (parceriaForm) {
      parceriaForm.addEventListener('submit', (e) => this.handleParceriaSubmit(e));
    }
  }

  setupDynamicFields() {
    // Mostrar campo de valor apenas para doação financeira
    const tipoDoacao = document.getElementById('doacao-tipo');
    const valorGroup = document.getElementById('valor-group');
    
    if (tipoDoacao && valorGroup) {
      tipoDoacao.addEventListener('change', (e) => {
        if (e.target.value === 'financeira') {
          valorGroup.style.display = 'block';
          document.getElementById('doacao-valor').required = true;
        } else {
          valorGroup.style.display = 'none';
          document.getElementById('doacao-valor').required = false;
        }
      });
    }

    // Melhorar UX dos selects múltiplos
    this.enhanceMultipleSelects();
  }

  enhanceMultipleSelects() {
    const multiSelects = document.querySelectorAll('select[multiple]');
    
    multiSelects.forEach(select => {
      const wrapper = document.createElement('div');
      wrapper.className = 'multi-select-wrapper';
      
      select.parentNode.insertBefore(wrapper, select);
      wrapper.appendChild(select);
      
      // Adicionar contador de seleções
      const counter = document.createElement('div');
      counter.className = 'selection-counter';
      wrapper.appendChild(counter);
      
      const updateCounter = () => {
        const selected = select.selectedOptions.length;
        counter.textContent = selected > 0 ? `${selected} opção(ões) selecionada(s)` : 'Nenhuma opção selecionada';
      };
      
      select.addEventListener('change', updateCounter);
      updateCounter();
    });
  }

  setupSmoothScrolling() {
    // Scroll suave para os formulários
    const cardButtons = document.querySelectorAll('.btn-card');
    
    cardButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = button.getAttribute('href');
        const target = document.querySelector(targetId);
        
        if (target) {
          const headerHeight = document.querySelector('.site-header').offsetHeight;
          const targetPosition = target.offsetTop - headerHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // Destacar o formulário brevemente
          target.classList.add('highlight');
          setTimeout(() => {
            target.classList.remove('highlight');
          }, 2000);
        }
      });
    });
  }

  setupFormValidation() {
    // Validação personalizada para campos específicos
    const telefoneInputs = document.querySelectorAll('input[type="tel"]');
    
    telefoneInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        // Formatar telefone automaticamente
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length <= 11) {
          if (value.length <= 10) {
            value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
          } else {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
          }
        }
        
        e.target.value = value;
      });
    });

    // Validação de email em tempo real
    const emailInputs = document.querySelectorAll('input[type="email"]');
    
    emailInputs.forEach(input => {
      input.addEventListener('blur', (e) => {
        const email = e.target.value;
        const isValid = this.validateEmail(email);
        
        if (email && !isValid) {
          this.showFieldError(e.target, 'Por favor, insira um email válido');
        } else {
          this.clearFieldError(e.target);
        }
      });
    });
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  showFieldError(field, message) {
    this.clearFieldError(field);
    
    field.classList.add('field-error');
    
    const errorElement = document.createElement('span');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    field.parentNode.appendChild(errorElement);
  }

  clearFieldError(field) {
    field.classList.remove('field-error');
    
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.remove();
    }
  }

  async handleVoluntarioSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const statusElement = document.getElementById('voluntarioStatus');
    
    // Validar formulário
    if (!this.validateForm(form)) {
      this.showStatus(statusElement, 'Por favor, corrija os erros no formulário.', 'error');
      return;
    }
    
    // Mostrar loading
    this.showStatus(statusElement, 'Enviando cadastro...', 'loading');
    
    try {
      // Simular envio
      await this.simulateSubmission(formData);
      
      this.showStatus(statusElement, 'Cadastro realizado com sucesso! Entraremos em contato em breve.', 'success');
      form.reset();
      
      // Scroll para o topo do formulário
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
    } catch (error) {
      console.error('Erro ao enviar cadastro de voluntário:', error);
      this.showStatus(statusElement, 'Erro ao enviar cadastro. Tente novamente.', 'error');
    }
  }

  async handleDoacaoSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const statusElement = document.getElementById('doacaoStatus');
    
    // Validar formulário
    if (!this.validateForm(form)) {
      this.showStatus(statusElement, 'Por favor, corrija os erros no formulário.', 'error');
      return;
    }
    
    // Mostrar loading
    this.showStatus(statusElement, 'Processando doação...', 'loading');
    
    try {
      // Simular envio
      await this.simulateSubmission(formData);
      
      const tipo = formData.get('tipo');
      let message = 'Doação registrada com sucesso! ';
      
      if (tipo === 'financeira') {
        message += 'Você receberá instruções de pagamento por email.';
      } else {
        message += 'Entraremos em contato para coordenar a entrega.';
      }
      
      this.showStatus(statusElement, message, 'success');
      form.reset();
      
      // Reset do campo dinâmico
      document.getElementById('valor-group').style.display = 'none';
      
    } catch (error) {
      console.error('Erro ao processar doação:', error);
      this.showStatus(statusElement, 'Erro ao processar doação. Tente novamente.', 'error');
    }
  }

  async handleParceriaSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const statusElement = document.getElementById('parceriaStatus');
    
    // Validar formulário
    if (!this.validateForm(form)) {
      this.showStatus(statusElement, 'Por favor, corrija os erros no formulário.', 'error');
      return;
    }
    
    // Mostrar loading
    this.showStatus(statusElement, 'Enviando proposta de parceria...', 'loading');
    
    try {
      // Simular envio
      await this.simulateSubmission(formData);
      
      this.showStatus(statusElement, 'Proposta enviada com sucesso! Nossa equipe analisará e retornará em até 5 dias úteis.', 'success');
      form.reset();
      
    } catch (error) {
      console.error('Erro ao enviar proposta de parceria:', error);
      this.showStatus(statusElement, 'Erro ao enviar proposta. Tente novamente.', 'error');
    }
  }

  validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        this.showFieldError(field, 'Este campo é obrigatório');
        isValid = false;
      } else {
        this.clearFieldError(field);
      }
    });
    
    // Validação específica para selects múltiplos
    const multiSelects = form.querySelectorAll('select[multiple][required]');
    multiSelects.forEach(select => {
      if (select.selectedOptions.length === 0) {
        this.showFieldError(select, 'Selecione pelo menos uma opção');
        isValid = false;
      } else {
        this.clearFieldError(select);
      }
    });
    
    return isValid;
  }

  showStatus(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.className = `form-status ${type}`;
    
    if (type !== 'loading') {
      setTimeout(() => {
        element.style.opacity = '0';
        setTimeout(() => {
          element.textContent = '';
          element.className = 'form-status';
          element.style.opacity = '1';
        }, 300);
      }, 5000);
    }
  }

  async simulateSubmission(formData) {
    // Simular delay de rede
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simular sucesso na maioria das vezes
        if (Math.random() > 0.05) {
          resolve({ success: true });
        } else {
          reject(new Error('Erro simulado'));
        }
      }, 2000);
    });
  }
}

// ===== ESTILOS ADICIONAIS PARA A PÁGINA DE COLABORAÇÃO =====
const colaboreStyles = `
  .hero-colabore {
    background: linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.5)), 
                url('img/atividade-comunitaria-2.jpg') center/cover;
    height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--on-dark);
  }
  
  .colaboracao-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
  }
  
  .colaboracao-card {
    background: rgba(255, 255, 255, 0.05);
    padding: 2.5rem;
    border-radius: var(--border-radius-large);
    border: 1px solid rgba(255, 193, 7, 0.2);
    transition: all var(--transition-medium);
    text-align: center;
  }
  
  .colaboracao-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    border-color: var(--primary-color);
  }
  
  .colaboracao-card .card-icon {
    font-size: 3rem;
    color: var(--primary-color);
    margin-bottom: 1.5rem;
  }
  
  .beneficios-lista {
    list-style: none;
    margin: 1.5rem 0;
    text-align: left;
  }
  
  .beneficios-lista li {
    padding: 0.5rem 0;
    position: relative;
    padding-left: 1.5rem;
  }
  
  .beneficios-lista li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--primary-color);
    font-weight: bold;
  }
  
  .btn-card {
    display: inline-block;
    background: var(--primary-color);
    color: var(--dark-text);
    padding: 0.8rem 1.5rem;
    text-decoration: none;
    border-radius: var(--border-radius);
    font-weight: 600;
    transition: all var(--transition-medium);
    margin-top: 1rem;
  }
  
  .btn-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 193, 7, 0.3);
  }
  
  .form-section {
    padding: 4rem 0;
    margin: 2rem 0;
  }
  
  .form-section:nth-child(even) {
    background: rgba(0, 0, 0, 0.02);
  }
  
  .form-container {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .form-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  
  .checkbox-group {
    margin: 2rem 0;
  }
  
  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 0.95rem;
    line-height: 1.4;
  }
  
  .checkbox-label input[type="checkbox"] {
    width: auto;
    margin: 0;
  }
  
  .checkmark {
    width: 20px;
    height: 20px;
    border: 2px solid var(--primary-color);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
    content: '✓';
    color: var(--primary-color);
    font-weight: bold;
  }
  
  .multi-select-wrapper {
    position: relative;
  }
  
  .selection-counter {
    font-size: 0.85rem;
    color: var(--primary-color);
    margin-top: 0.5rem;
    font-style: italic;
  }
  
  .field-error {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
  }
  
  .error-message {
    color: #dc3545;
    font-size: 0.85rem;
    margin-top: 0.5rem;
    display: block;
  }
  
  .highlight {
    animation: highlight 2s ease-out;
  }
  
  @keyframes highlight {
    0% { background-color: rgba(255, 193, 7, 0.2); }
    100% { background-color: transparent; }
  }
  
  .impacto-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
  }
  
  .stat-card {
    text-align: center;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: var(--border-radius-large);
    border: 1px solid rgba(255, 193, 7, 0.2);
  }
  
  .stat-number {
    font-size: 3rem;
    font-weight: bold;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    font-size: 1.1rem;
    opacity: 0.9;
  }
  
  .testemunhos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
  }
  
  .testemunho-card {
    background: rgba(255, 255, 255, 0.05);
    padding: 2rem;
    border-radius: var(--border-radius-large);
    border: 1px solid rgba(255, 193, 7, 0.2);
  }
  
  .testemunho-content {
    margin-bottom: 1.5rem;
  }
  
  .testemunho-content p {
    font-style: italic;
    font-size: 1.1rem;
    line-height: 1.6;
  }
  
  .author-info h4 {
    color: var(--primary-color);
    margin-bottom: 0.25rem;
  }
  
  .author-info span {
    opacity: 0.8;
    font-size: 0.9rem;
  }
  
  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .colaboracao-grid {
      grid-template-columns: 1fr;
    }
    
    .impacto-stats {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .testemunhos-grid {
      grid-template-columns: 1fr;
    }
  }
`;

// Adicionar estilos específicos da página
const styleSheet = document.createElement('style');
styleSheet.textContent = colaboreStyles;
document.head.appendChild(styleSheet);

// Inicializar a página de colaboração
document.addEventListener('DOMContentLoaded', () => {
  new ColaborePage();
});
