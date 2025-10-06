// ===== CONFIGURAÇÕES GLOBAIS =====
const CONFIG = {
  slideInterval: 5000,
  animationDuration: 300,
  scrollThreshold: 100,
  debounceDelay: 250
};

// ===== UTILITÁRIOS =====
const Utils = {
  // Debounce para otimizar performance
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle para scroll events
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Animação suave para scroll
  smoothScrollTo(element, duration = 1000) {
    const targetPosition = element.offsetTop - 80; // Offset para header fixo
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    requestAnimationFrame(animation);
  },

  // Função de easing
  easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  },

  // Verificar se elemento está visível
  isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Formatar data
  formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }
};

// ===== GERENCIADOR DE ESTADO =====
const State = {
  currentSlide: 0,
  isMenuOpen: false,
  isModalOpen: false,
  currentModalImage: 0,
  modalImages: [],
  isScrolled: false,

  // Observadores de mudança de estado
  observers: {
    slide: [],
    menu: [],
    modal: [],
    scroll: []
  },

  // Adicionar observador
  addObserver(type, callback) {
    if (this.observers[type]) {
      this.observers[type].push(callback);
    }
  },

  // Notificar observadores
  notify(type, data) {
    if (this.observers[type]) {
      this.observers[type].forEach(callback => callback(data));
    }
  },

  // Atualizar estado
  update(key, value) {
    const oldValue = this[key];
    this[key] = value;
    this.notify(key, { oldValue, newValue: value });
  }
};

// ===== SLIDESHOW =====
class Slideshow {
  constructor() {
    this.slides = document.querySelectorAll('.slide');
    this.indicators = document.querySelectorAll('.indicator');
    this.currentSlide = 0;
    this.isPlaying = true;
    this.interval = null;

    this.init();
  }

  init() {
    if (this.slides.length === 0) return;

    this.setupEventListeners();
    this.start();
    this.preloadImages();
  }

  setupEventListeners() {
    // Indicadores
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        this.goToSlide(index);
      });
    });

    // Pausar no hover
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
      heroSection.addEventListener('mouseenter', () => this.pause());
      heroSection.addEventListener('mouseleave', () => this.resume());
    }

    // Controles de teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.previousSlide();
      if (e.key === 'ArrowRight') this.nextSlide();
      if (e.key === ' ') {
        e.preventDefault();
        this.isPlaying ? this.pause() : this.resume();
      }
    });

    // Touch/swipe support
    this.setupTouchEvents();
  }

  setupTouchEvents() {
    let startX = 0;
    let endX = 0;
    const heroSection = document.querySelector('.hero');

    if (!heroSection) return;

    heroSection.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });

    heroSection.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      this.handleSwipe(startX, endX);
    });
  }

  handleSwipe(startX, endX) {
    const threshold = 50;
    const diff = startX - endX;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.previousSlide();
      }
    }
  }

  preloadImages() {
    this.slides.forEach(slide => {
      const bgImage = slide.style.backgroundImage;
      if (bgImage) {
        const imageUrl = bgImage.slice(5, -2); // Remove url(" e ")
        const img = new Image();
        img.src = imageUrl;
      }
    });
  }

  goToSlide(index) {
    if (index === this.currentSlide) return;

    // Remove active das classes atuais
    this.slides[this.currentSlide]?.classList.remove('active');
    this.indicators[this.currentSlide]?.classList.remove('active');

    // Atualiza índice
    this.currentSlide = index;

    // Adiciona active nas novas classes
    this.slides[this.currentSlide]?.classList.add('active');
    this.indicators[this.currentSlide]?.classList.add('active');

    // Notifica mudança de estado
    State.update('currentSlide', this.currentSlide);
  }

  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  previousSlide() {
    const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prevIndex);
  }

  start() {
    this.interval = setInterval(() => {
      if (this.isPlaying) {
        this.nextSlide();
      }
    }, CONFIG.slideInterval);
  }

  pause() {
    this.isPlaying = false;
  }

  resume() {
    this.isPlaying = true;
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

// ===== NAVEGAÇÃO =====
class Navigation {
  constructor() {
    this.header = document.querySelector('.site-header');
    this.menuToggle = document.querySelector('.menu-toggle');
    this.mainNav = document.querySelector('.main-nav');
    this.navLinks = document.querySelectorAll('.nav-link');

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupScrollEffects();
    this.setupSmoothScrolling();
  }

  setupEventListeners() {
    // Toggle do menu mobile
    if (this.menuToggle) {
      this.menuToggle.addEventListener('click', () => {
        this.toggleMenu();
      });
    }

    // Fechar menu ao clicar em link
    this.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (State.isMenuOpen) {
          this.closeMenu();
        }
      });
    });

    // Fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
      if (State.isMenuOpen && 
          !this.mainNav.contains(e.target) && 
          !this.menuToggle.contains(e.target)) {
        this.closeMenu();
      }
    });

    // ESC para fechar menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && State.isMenuOpen) {
        this.closeMenu();
      }
    });
  }

  setupScrollEffects() {
    const handleScroll = Utils.throttle(() => {
      const scrolled = window.pageYOffset > CONFIG.scrollThreshold;
      
      if (scrolled !== State.isScrolled) {
        State.update('isScrolled', scrolled);
        this.header?.classList.toggle('scrolled', scrolled);
      }
    }, 16); // ~60fps

    window.addEventListener('scroll', handleScroll);
  }

  setupSmoothScrolling() {
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          
          if (target) {
            Utils.smoothScrollTo(target);
            
            // Atualizar URL sem recarregar página
            history.pushState(null, null, href);
          }
        }
      });
    });
  }

  toggleMenu() {
    if (State.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    State.update('isMenuOpen', true);
    this.mainNav?.classList.add('active');
    this.menuToggle?.classList.add('active');
    this.menuToggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // Prevenir scroll
  }

  closeMenu() {
    State.update('isMenuOpen', false);
    this.mainNav?.classList.remove('active');
    this.menuToggle?.classList.remove('active');
    this.menuToggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = ''; // Restaurar scroll
  }
}

// ===== GALERIA E MODAL =====
class Gallery {
  constructor() {
    this.photos = document.querySelectorAll('.photo');
    this.modal = document.getElementById('galleryModal');
    this.modalImage = document.getElementById('modalImage');
    this.closeBtn = document.querySelector('.modal-close');
    this.prevBtn = document.getElementById('prevImage');
    this.nextBtn = document.getElementById('nextImage');
    this.currentIndex = 0;
    this.images = [];

    this.init();
  }

  init() {
    if (this.photos.length === 0) return;

    this.collectImages();
    this.setupEventListeners();
    this.preloadImages();
  }

  collectImages() {
    this.images = Array.from(this.photos).map(photo => ({
      src: photo.dataset.src || photo.querySelector('img')?.src,
      alt: photo.querySelector('img')?.alt || 'Imagem da galeria'
    }));
  }

  preloadImages() {
    this.images.forEach(({ src }) => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }

  setupEventListeners() {
    // Abrir modal
    this.photos.forEach((photo, index) => {
      photo.addEventListener('click', () => {
        this.openModal(index);
      });

      // Suporte a teclado
      photo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openModal(index);
        }
      });
    });

    // Fechar modal
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });
    }

    // Navegação do modal
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.previousImage());
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.nextImage());
    }

    // Controles de teclado
    document.addEventListener('keydown', (e) => {
      if (!State.isModalOpen) return;

      switch (e.key) {
        case 'Escape':
          this.closeModal();
          break;
        case 'ArrowLeft':
          this.previousImage();
          break;
        case 'ArrowRight':
          this.nextImage();
          break;
      }
    });

    // Touch/swipe no modal
    this.setupModalTouchEvents();
  }

  setupModalTouchEvents() {
    if (!this.modal) return;

    let startX = 0;
    let endX = 0;

    this.modal.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });

    this.modal.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      this.handleModalSwipe(startX, endX);
    });
  }

  handleModalSwipe(startX, endX) {
    const threshold = 50;
    const diff = startX - endX;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.nextImage();
      } else {
        this.previousImage();
      }
    }
  }

  openModal(index) {
    this.currentIndex = index;
    State.update('isModalOpen', true);
    State.update('currentModalImage', index);
    
    if (this.modal && this.modalImage) {
      this.updateModalImage();
      this.modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
      
      // Foco no modal para acessibilidade
      this.modal.focus();
      
      // Animação de entrada
      requestAnimationFrame(() => {
        this.modal.style.opacity = '1';
      });
    }
  }

  closeModal() {
    State.update('isModalOpen', false);
    
    if (this.modal) {
      this.modal.style.opacity = '0';
      
      setTimeout(() => {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
      }, CONFIG.animationDuration);
    }
  }

  updateModalImage() {
    const image = this.images[this.currentIndex];
    if (image && this.modalImage) {
      this.modalImage.src = image.src;
      this.modalImage.alt = image.alt;
    }
  }

  nextImage() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    State.update('currentModalImage', this.currentIndex);
    this.updateModalImage();
  }

  previousImage() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    State.update('currentModalImage', this.currentIndex);
    this.updateModalImage();
  }
}

// ===== FORMULÁRIOS =====
class FormHandler {
  constructor() {
    this.contactForm = document.getElementById('contactForm');
    this.sugestoesForm = document.getElementById('sugestoesForm');
    
    this.init();
  }

  init() {
    this.setupContactForm();
    this.setupSugestoesForm();
    this.setupFormValidation();
  }

  setupContactForm() {
    if (!this.contactForm) return;

    this.contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleContactSubmit(e.target);
    });
  }

  setupSugestoesForm() {
    if (!this.sugestoesForm) return;

    this.sugestoesForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSugestoesSubmit(e.target);
    });
  }

  setupFormValidation() {
    // Validação em tempo real
    const inputs = document.querySelectorAll('input[required], textarea[required], select[required]');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input));
    });
  }

  validateField(field) {
    const isValid = field.checkValidity();
    const errorClass = 'field-error';
    
    field.classList.toggle(errorClass, !isValid);
    
    // Remover mensagem de erro anterior
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Adicionar nova mensagem de erro se necessário
    if (!isValid) {
      const errorMessage = document.createElement('span');
      errorMessage.className = 'error-message';
      errorMessage.textContent = field.validationMessage;
      field.parentNode.appendChild(errorMessage);
    }
    
    return isValid;
  }

  clearFieldError(field) {
    field.classList.remove('field-error');
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.remove();
    }
  }

  async handleContactSubmit(form) {
    const formData = new FormData(form);
    const statusElement = document.getElementById('formStatus');
    
    // Validar todos os campos
    const isValid = this.validateForm(form);
    if (!isValid) return;
    
    // Mostrar loading
    this.showFormStatus(statusElement, 'Enviando mensagem...', 'loading');
    
    try {
      // Simular envio (substituir por integração real)
      await this.simulateFormSubmission(formData);
      
      this.showFormStatus(statusElement, 'Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
      form.reset();
      
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      this.showFormStatus(statusElement, 'Erro ao enviar mensagem. Tente novamente.', 'error');
    }
  }

  async handleSugestoesSubmit(form) {
    const formData = new FormData(form);
    const statusElement = document.getElementById('sugestoesStatus');
    
    // Validar todos os campos
    const isValid = this.validateForm(form);
    if (!isValid) return;
    
    // Mostrar loading
    this.showFormStatus(statusElement, 'Enviando sugestão...', 'loading');
    
    try {
      // Simular envio (substituir por integração real)
      await this.simulateFormSubmission(formData);
      
      this.showFormStatus(statusElement, 'Sugestão enviada com sucesso! Analisaremos sua proposta.', 'success');
      form.reset();
      
    } catch (error) {
      console.error('Erro ao enviar sugestão:', error);
      this.showFormStatus(statusElement, 'Erro ao enviar sugestão. Tente novamente.', 'error');
    }
  }

  validateForm(form) {
    const fields = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    
    fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  showFormStatus(element, message, type) {
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
        }, CONFIG.animationDuration);
      }, 5000);
    }
  }

  async simulateFormSubmission(formData) {
    // Simular delay de rede
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simular sucesso na maioria das vezes
        if (Math.random() > 0.1) {
          resolve({ success: true });
        } else {
          reject(new Error('Erro simulado'));
        }
      }, 2000);
    });
  }
}

// ===== ANIMAÇÕES DE SCROLL =====
class ScrollAnimations {
  constructor() {
    this.elements = document.querySelectorAll('[data-aos]');
    this.observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    } else {
      // Fallback para navegadores antigos
      this.elements.forEach(el => el.classList.add('aos-animate'));
    }
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.aosDelay || 0;
          
          setTimeout(() => {
            entry.target.classList.add('aos-animate');
          }, parseInt(delay));
          
          observer.unobserve(entry.target);
        }
      });
    }, this.observerOptions);

    this.elements.forEach(el => observer.observe(el));
  }
}

// ===== PERFORMANCE E OTIMIZAÇÕES =====
class PerformanceOptimizer {
  constructor() {
    this.init();
  }

  init() {
    this.setupLazyLoading();
    this.setupPrefetching();
    this.setupServiceWorker();
  }

  setupLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('loading' in HTMLImageElement.prototype) {
      // Navegador suporta lazy loading nativo
      return;
    }
    
    // Fallback para navegadores sem suporte
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  setupPrefetching() {
    // Prefetch de recursos importantes
    const criticalResources = [
      '/css/styles.css',
      '/js/scripts.js'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registrado com sucesso:', registration.scope);
          })
          .catch(registrationError => {
            console.log('Falha no registro do SW:', registrationError);
          });
      });
    }
  }
}

// ===== INICIALIZAÇÃO =====
class App {
  constructor() {
    this.components = {};
    this.init();
  }

  init() {
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
    } else {
      this.initializeComponents();
    }
  }

  initializeComponents() {
    try {
      // Inicializar componentes principais
      this.components.slideshow = new Slideshow();
      this.components.navigation = new Navigation();
      this.components.gallery = new Gallery();
      this.components.formHandler = new FormHandler();
      this.components.scrollAnimations = new ScrollAnimations();
      this.components.performanceOptimizer = new PerformanceOptimizer();

      // Configurações adicionais
      this.setupGlobalEventListeners();
      this.updateFooterYear();
      this.setupAccessibilityFeatures();
      
      console.log('🎉 Quilombo Urbano - Site carregado com sucesso!');
      
    } catch (error) {
      console.error('Erro na inicialização:', error);
    }
  }

  setupGlobalEventListeners() {
    // Atualizar ano no footer automaticamente
    window.addEventListener('focus', () => this.updateFooterYear());
    
    // Detectar mudanças de orientação
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    });

    // Detectar conexão lenta
    if ('connection' in navigator) {
      const connection = navigator.connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        document.body.classList.add('slow-connection');
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      const manifestPath = '/images.json'; // arquivo gerado pelo script Node
      fetch(manifestPath)
        .then(res => {
          if (!res.ok) throw new Error('Manifest não encontrado');
          return res.json();
        })
        .then(files => {
          const images = (files || []).filter(f => /\.(jpe?g|png|webp|gif|svg)$/i.test(f));
          if (images.length === 0) return;
          initSlideshow(images);
          initGallery(images);
          // inicializa AOS se presente
          if (window.AOS) AOS.init();
        })
        .catch(err => {
          console.warn('Falha ao carregar images.json — verifique se foi gerado. Erro:', err);
        });

      // Slideshow simples
      function initSlideshow(images) {
        const container = document.querySelector('.slideshow-container');
        const indicatorsWrap = document.querySelector('.slideshow-indicators');
        if (!container || !indicatorsWrap) return;

        images.forEach((src, i) => {
          const slide = document.createElement('div');
          slide.className = 'slide' + (i === 0 ? ' active' : '');
          slide.style.backgroundImage = `url('${src}')`;
          container.appendChild(slide);

          const btn = document.createElement('button');
          btn.className = 'indicator' + (i === 0 ? ' active' : '');
          btn.setAttribute('data-slide', String(i));
          btn.setAttribute('aria-label', `Slide ${i + 1}`);
          btn.addEventListener('click', () => goToSlide(i));
          indicatorsWrap.appendChild(btn);
        });

        let current = 0;
        let timer = setInterval(() => goToSlide((current + 1) % images.length), 5000);

        function goToSlide(n) {
          const slides = container.querySelectorAll('.slide');
          const inds = indicatorsWrap.querySelectorAll('.indicator');
          slides[current].classList.remove('active');
          inds[current].classList.remove('active');
          current = n;
          slides[current].classList.add('active');
          inds[current].classList.add('active');
          clearInterval(timer);
          timer = setInterval(() => goToSlide((current + 1) % images.length), 5000);
        }
      }

      // Galeria + modal
      function initGallery(images) {
        const grid = document.querySelector('.gallery-grid');
        const modal = document.getElementById('galleryModal');
        const modalImg = document.getElementById('modalImage');
        const closeBtn = modal && modal.querySelector('.modal-close');
        const prevBtn = document.getElementById('prevImage');
        const nextBtn = document.getElementById('nextImage');
        if (!grid || !modal || !modalImg) return;

        images.forEach((src, i) => {
          const photo = document.createElement('div');
          photo.className = 'photo';
          photo.setAttribute('data-src', src);
          photo.setAttribute('data-index', String(i));

          const img = document.createElement('img');
          img.src = src;
          img.alt = `Foto ${i + 1}`;
          img.loading = 'lazy';

          const overlay = document.createElement('div');
          overlay.className = 'photo-overlay';
          overlay.innerHTML = '<i class="fas fa-expand"></i>';

          photo.appendChild(img);
          photo.appendChild(overlay);
          photo.addEventListener('click', () => openModal(i));
          grid.appendChild(photo);
        });

        let currentIndex = 0;
        function openModal(index) {
          currentIndex = index;
          modalImg.src = images[currentIndex];
          modalImg.alt = `Imagem ${currentIndex + 1}`;
          modal.classList.add('open');
          modal.style.display = 'block';
        }
        function closeModal() {
          modal.classList.remove('open');
          modal.style.display = 'none';
          modalImg.src = '';
        }
        function showNext(delta) {
          currentIndex = (currentIndex + delta + images.length) % images.length;
          modalImg.src = images[currentIndex];
        }

        closeBtn && closeBtn.addEventListener('click', closeModal);
        prevBtn && prevBtn.addEventListener('click', () => showNext(-1));
        nextBtn && nextBtn.addEventListener('click', () => showNext(1));
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal();
        });

        // teclas
        document.addEventListener('keydown', (e) => {
          if (!modal.classList.contains('open')) return;
          if (e.key === 'Escape') closeModal();
          if (e.key === 'ArrowLeft') showNext(-1);
          if (e.key === 'ArrowRight') showNext(1);
        });
      }
    });
  }

  updateFooterYear() {
    const yearElement = document.getElementById('year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  setupAccessibilityFeatures() {
    // Detectar preferência por movimento reduzido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('reduced-motion');
    }

    // Melhorar navegação por teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });

    // Skip links
    const skipLinks = document.querySelectorAll('.skip-link');
    skipLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.focus();
          target.scrollIntoView();
        }
      });
    });
  }

  // Método para adicionar novos componentes dinamicamente
  addComponent(name, component) {
    this.components[name] = component;
  }

  // Método para obter componente
  getComponent(name) {
    return this.components[name];
  }
}

// ===== CSS DINÂMICO PARA ANIMAÇÕES AOS =====
const aosStyles = `
  [data-aos] {
    opacity: 0;
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  
  [data-aos].aos-animate {
    opacity: 1;
  }
  
  [data-aos="fade-up"] {
    transform: translateY(30px);
  }
  
  [data-aos="fade-up"].aos-animate {
    transform: translateY(0);
  }
  
  [data-aos="fade-right"] {
    transform: translateX(-30px);
  }
  
  [data-aos="fade-right"].aos-animate {
    transform: translateX(0);
  }
  
  [data-aos="fade-left"] {
    transform: translateX(30px);
  }
  
  [data-aos="fade-left"].aos-animate {
    transform: translateX(0);
  }
  
  [data-aos="zoom-in"] {
    transform: scale(0.8);
  }
  
  [data-aos="zoom-in"].aos-animate {
    transform: scale(1);
  }
  
  [data-aos="slide-up"] {
    transform: translateY(50px);
  }
  
  [data-aos="slide-up"].aos-animate {
    transform: translateY(0);
  }
  
  @media (prefers-reduced-motion: reduce) {
    [data-aos] {
      transition: none !important;
      animation: none !important;
    }
  }
`;

// Adicionar estilos AOS ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = aosStyles;
document.head.appendChild(styleSheet);

// ===== INICIALIZAR APLICAÇÃO =====
const quilomboUrbanoApp = new App();

// Exportar para uso global se necessário
window.QuilomboUrbano = {
  app: quilomboUrbanoApp,
  utils: Utils,
  state: State
};
