// Melhorar a navegação móvel
document.addEventListener('DOMContentLoaded', () => {
  // Menu móvel toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });
  }
  
  // Fechar menu ao clicar em links de navegação
  document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu) {
        navMenu.classList.remove('active');
      }
      document.body.classList.remove('menu-open');
    });
  });

  // Scroll suave para âncoras internas
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        // Ajuste para o header fixo
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Animação de aparecimento em scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('.section-header, .event-card, .workshop-card, .video-card, .contact-card').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });

  // Inicializar vídeos - aguarda um pouco para garantir que o DOM está pronto
  setTimeout(() => {
    initVideos();
  }, 500);
});

/*
 Videos loader - Versão simplificada e confiável
*/

// Vídeos do Planetário Itinerante 
const PLANETARIO_VIDEOS = [
  {
    id: 'diipvKLdVyk',
    title: 'Planetário Itinerante - Apresentação',
    date: '15 de março de 2024'
  },
  {
    id: 'cBqjgxvJMfQ', 
    title: 'Oficina de Astronomia',
    date: '22 de fevereiro de 2024'
  },
  {
    id: 'qVYUQNTZzgg',
    title: 'Observação do Céu Noturno',
    date: '10 de janeiro de 2024'
  },
  {
    id: 'NHotPvPTmRY',
    title: 'Educação Ambiental Integrada',
    date: '5 de dezembro de 2023'
  },
  {
    id: 'iFlVVaM2dRA',
    title: 'Ciências Naturais e Astronomia',
    date: '18 de novembro de 2023'
  },
  {
    id: 'QHeMYJ7IEKU',
    title: 'Planeta Azul - Documentário',
    date: '25 de outubro de 2023'
  }
];

// ====== Funções para renderizar vídeos ======
function makeVideoCardHTML(videoId, title = '', date = '') {
  const card = document.createElement('article');
  card.className = 'video-card fade-in';
  card.innerHTML = `
    <div class="video-iframe">
      <iframe
        loading="lazy"
        src="https://www.youtube.com/embed/${videoId}"
        title="${escapeHtml(title)}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen>
      </iframe>
    </div>
    <div class="video-meta">
      <div class="video-title">${escapeHtml(title || 'Vídeo do Planetário Itinerante')}</div>
      ${date ? `<div class="video-date"><i class="far fa-calendar"></i> ${escapeHtml(date)}</div>` : ''}
    </div>
  `;
  return card;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function showMessage(msg) {
  const vm = document.getElementById('videos-message');
  if (vm) {
    vm.textContent = msg;
    console.log('Videos message:', msg);
  }
}

// ====== Inicialização principal ======
function initVideos() {
  console.log('Iniciando carregamento de vídeos...');
  
  const videoGrid = document.getElementById('video-grid');
  if (!videoGrid) {
    console.error('Elemento video-grid não encontrado!');
    return;
  }
  
  console.log('Elemento video-grid encontrado:', videoGrid);
  
  // Limpar conteúdo anterior
  videoGrid.innerHTML = '';
  showMessage('Carregando vídeos...');
  
  // Verificar se existem vídeos para carregar
  if (!PLANETARIO_VIDEOS || PLANETARIO_VIDEOS.length === 0) {
    console.error('Nenhum vídeo configurado!');
    showMessage('Nenhum vídeo disponível no momento.');
    return;
  }
  
  console.log(`Carregando ${PLANETARIO_VIDEOS.length} vídeos...`);
  
  // Carregar cada vídeo
  let videoLoadCount = 0;
  PLANETARIO_VIDEOS.forEach((video, index) => {
    try {
      console.log(`Criando card para vídeo ${index + 1}:`, video.title);
      const card = makeVideoCardHTML(video.id, video.title, video.date);
      videoGrid.appendChild(card);
      videoLoadCount++;
      
      // Adicionar delay para animação
      setTimeout(() => {
        card.classList.add('visible');
      }, index * 100);
      
    } catch (error) {
      console.error(`Erro ao criar card do vídeo ${index + 1}:`, error);
    }
  });
  
  console.log(`${videoLoadCount} vídeos carregados com sucesso!`);
  
  // Limpar mensagem após carregar
  setTimeout(() => {
    showMessage('');
  }, 1000);
  
  // Forçar re-observação para animações
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.video-card').forEach(card => {
      observer.observe(card);
    });
  }, 1500);
}

// CSS Classes animadas
const style = document.createElement('style');
style.textContent = `
  .fade-in {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  
  .fade-in.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .video-card {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s ease;
  }
  
  .video-card.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  /* Debug styles */
  .video-grid {
    min-height: 200px;
  }
  
  .videos-message {
    font-weight: bold;
    color: #0b3d91;
    padding: 20px;
    text-align: center;
  }
`;
document.head.appendChild(style);

// Debug: verificar se elementos existem quando a página carrega
window.addEventListener('load', () => {
  console.log('Página carregada completamente');
  const videoGrid = document.getElementById('video-grid');
  const videosMessage = document.getElementById('videos-message');
  
  console.log('video-grid element:', videoGrid);
  console.log('videos-message element:', videosMessage);
  
  if (!videoGrid) {
    console.error('ERRO: Elemento video-grid não encontrado após load!');
  }
  
  // Tentar carregar vídeos novamente se não funcionou
  if (videoGrid && videoGrid.children.length === 0) {
    console.log('Tentando carregar vídeos novamente...');
    setTimeout(() => {
      initVideos();
    }, 1000);
  }
});

// ===== Instagram slider =====
function loadInstagramSDK() {
  return new Promise((resolve) => {
    if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
      return resolve();
    }
    // Evitar múltiplos carregamentos
    if (document.getElementById('instagram-embed-sdk')) {
      const check = () => {
        if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') resolve();
        else setTimeout(check, 150);
      };
      return check();
    }
    const s = document.createElement('script');
    s.id = 'instagram-embed-sdk';
    s.async = true;
    s.src = 'https://www.instagram.com/embed.js';
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

function processInstagramEmbeds(container = document) {
  if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
    window.instgrm.Embeds.process(container);
  }
}

function initInstagramSlider() {
  const slider = document.querySelector('.ig-slider');
  const track = document.querySelector('.ig-track');
  const slides = Array.from(document.querySelectorAll('.ig-slide'));
  const prevBtn = document.querySelector('.ig-prev');
  const nextBtn = document.querySelector('.ig-next');
  const dotsWrap = document.querySelector('.ig-dots');

  if (!slider || !track || slides.length === 0) return;

  let index = 0;
  let timer = null;
  const intervalMs = 6000;

  // Dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'ig-dot';
    dot.type = 'button';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Ir para o slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  function updateDots() {
    const dots = dotsWrap.querySelectorAll('.ig-dot');
    dots.forEach((d, i) => d.setAttribute('aria-selected', i === index ? 'true' : 'false'));
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(${-index * 100}%)`;
    updateDots();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(next, intervalMs);
  }
  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay(); else startAutoplay();
  });

  // Inicia
  goTo(0);
  startAutoplay();

  // Não precisamos mais processar embeds do Instagram (são iframes)
  // loadInstagramSDK().then(() => {
  //   processInstagramEmbeds(slider);
  // });
}

// Hook na sua inicialização
document.addEventListener('DOMContentLoaded', () => {
  // Injetar srcdoc nos iframes para carregar o embed internamente
  document.querySelectorAll('.ig-embed-frame').forEach(iframe => {
    const url = iframe.dataset.permalink;
    if (!url) return;

    // Tamanhos padrão (reel costuma ser mais alto)
    const isReel = /\/reel\//i.test(url);
    iframe.style.width = '100%';
    iframe.style.maxWidth = '540px';
    iframe.style.height = isReel ? '860px' : '650px';
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');

    // Conteúdo autônomo do iframe (srcdoc) com o embed do Instagram
    iframe.srcdoc = `
      <html>
        <head>
          <base target="_parent">
          <meta charset="utf-8" />
          <style>
            html, body { margin:0; padding:0; }
          </style>
        </head>
        <body>
          <blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14"></blockquote>
          <script async src="https://www.instagram.com/embed.js"></script>
        </body>
      </html>
    `;

    // Tentativa de auto-ajuste de altura após o carregamento
    const tryAdjust = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        const h = Math.max(
          doc.documentElement?.scrollHeight || 0,
          doc.body?.scrollHeight || 0
        );
        if (h && Math.abs(h - iframe.clientHeight) > 10) {
          iframe.style.height = h + 'px';
        }
      } catch (_) { /* cross-origin não deve ocorrer com srcdoc */ }
    };

    iframe.addEventListener('load', () => {
      // Poll por alguns segundos, já que o embed.js carrega async
      let attempts = 0;
      const id = setInterval(() => {
        tryAdjust();
        if (++attempts > 40) clearInterval(id); // ~8s em 200ms
      }, 200);
    });
  });

  initInstagramSlider();
});