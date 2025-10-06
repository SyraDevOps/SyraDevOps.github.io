// JavaScript para a página Colabore
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar AOS (Animate On Scroll)
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 100
    });
  }

  // Formulário de voluntariado
  const voluntarioForm = document.getElementById('voluntarioForm');
  const voluntarioStatus = document.getElementById('voluntarioStatus');

  if (voluntarioForm) {
    voluntarioForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Mostrar status de carregamento
      voluntarioStatus.textContent = 'Enviando candidatura...';
      voluntarioStatus.className = 'form-status';
      
      // Simular envio (substituir por integração real)
      setTimeout(() => {
        voluntarioStatus.textContent = 'Candidatura enviada com sucesso! Entraremos em contato em breve.';
        voluntarioStatus.className = 'form-status success';
        voluntarioForm.reset();
        
        // Limpar status após 5 segundos
        setTimeout(() => {
          voluntarioStatus.textContent = '';
          voluntarioStatus.className = 'form-status';
        }, 5000);
      }, 2000);
    });
  }

  // Função para copiar PIX
  window.copyPix = function() {
    const pixKey = 'contato@quilombourbanosaojoaodelrei.org';
    
    if (navigator.clipboard && window.isSecureContext) {
      // Use a Clipboard API
      navigator.clipboard.writeText(pixKey).then(() => {
        showCopyFeedback();
      }).catch(err => {
        console.error('Erro ao copiar PIX:', err);
        fallbackCopyTextToClipboard(pixKey);
      });
    } else {
      // Fallback para navegadores mais antigos
      fallbackCopyTextToClipboard(pixKey);
    }
  };

  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Evitar scroll para o final da página
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showCopyFeedback();
      } else {
        console.error('Erro ao copiar PIX');
      }
    } catch (err) {
      console.error('Fallback: Erro ao copiar PIX', err);
    }
    
    document.body.removeChild(textArea);
  }

  function showCopyFeedback() {
    const copyBtn = document.querySelector('.copy-btn');
    const originalText = copyBtn.innerHTML;
    
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
    copyBtn.style.background = '#28a745';
    
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
      copyBtn.style.background = '';
    }, 2000);
  }

  // Smooth scroll para links internos
  const internalLinks = document.querySelectorAll('a[href^="#"]');
  
  internalLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        const headerHeight = document.querySelector('.site-header').offsetHeight;
        const targetPosition = targetElement.offsetTop - headerHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Animação de número de contagem para valores de impacto
  const impactoItems = document.querySelectorAll('.impacto-item .valor');
  
  function animateNumbers() {
    impactoItems.forEach(item => {
      const finalValue = parseInt(item.textContent.replace(/\D/g, ''));
      const duration = 2000;
      const startTime = Date.now();
      
      function updateNumber() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(finalValue * progress);
        
        item.textContent = `R$ ${currentValue}`;
        
        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        } else {
          item.textContent = `R$ ${finalValue}`;
        }
      }
      
      updateNumber();
    });
  }

  // Observador para iniciar animação quando os elementos entrarem na viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.classList.contains('impacto-doacoes')) {
        animateNumbers();
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.5
  });

  const impactoSection = document.querySelector('.impacto-doacoes');
  if (impactoSection) {
    observer.observe(impactoSection);
  }

  // Validação personalizada para o formulário
  const requiredFields = voluntarioForm?.querySelectorAll('[required]');
  
  requiredFields?.forEach(field => {
    field.addEventListener('blur', validateField);
    field.addEventListener('input', clearErrorState);
  });

  function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    if (!value) {
      showFieldError(field, 'Este campo é obrigatório');
    } else if (field.type === 'email' && !isValidEmail(value)) {
      showFieldError(field, 'Digite um email válido');
    } else if (field.type === 'tel' && value && !isValidPhone(value)) {
      showFieldError(field, 'Digite um telefone válido');
    } else {
      clearFieldError(field);
    }
  }

  function clearErrorState(e) {
    clearFieldError(e.target);
  }

  function showFieldError(field, message) {
    clearFieldError(field);
    
    field.style.borderColor = '#dc3545';
    
    const errorElement = document.createElement('span');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.color = '#dc3545';
    errorElement.style.fontSize = '0.8rem';
    errorElement.style.display = 'block';
    errorElement.style.marginTop = '0.25rem';
    
    field.parentNode.appendChild(errorElement);
  }

  function clearFieldError(field) {
    field.style.borderColor = '';
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
    return phoneRegex.test(phone);
  }

  // Atualizar ano no footer
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Efeito de hover personalizado para cards
  const colaboracaoCards = document.querySelectorAll('.colaboracao-card');
  
  colaboracaoCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });

  // Menu mobile toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function() {
      const isActive = mainNav.classList.contains('active');
      
      if (isActive) {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      } else {
        mainNav.classList.add('active');
        menuToggle.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
      }
    });

    // Fechar menu ao clicar em link
    const navLinks = mainNav.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Fechar menu ao clicar fora
    document.addEventListener('click', function(e) {
      if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Header scroll effect
  const siteHeader = document.querySelector('.site-header');
  
  function handleScroll() {
    if (window.scrollY > 100) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Check initial state
});
