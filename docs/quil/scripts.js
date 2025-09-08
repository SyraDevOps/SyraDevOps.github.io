// Interações: menu, formulário, ano do rodapé e lightbox para galeria
document.addEventListener('DOMContentLoaded', function(){
  // rodapé: ano atual
  var yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // menu mobile simples
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');
  toggle && toggle.addEventListener('click', function(){
    if(nav.style.display === 'block') nav.style.display = '';
    else nav.style.display = 'block';
  });

  // fake envio de formulário
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      status.textContent = 'Enviando...';
      setTimeout(function(){
        status.textContent = 'Mensagem enviada! Agradecemos o contato.';
        form.reset();
      }, 900);
    });
  }

  // --- Lightbox / Modal para galeria ---
  var gallery = Array.from(document.querySelectorAll('.gallery-grid .photo'));
  if(gallery.length){
    // create lightbox elements
    var lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role','dialog'); lb.setAttribute('aria-hidden','true');
    var lbContent = document.createElement('div'); lbContent.className = 'lightbox-content';
    var img = document.createElement('img'); img.className = 'lightbox-img'; img.alt = '';
    var btnClose = document.createElement('button'); btnClose.className = 'lightbox-close'; btnClose.innerHTML = '✕'; btnClose.setAttribute('aria-label','Fechar (Esc)');
    var btnPrev = document.createElement('button'); btnPrev.className = 'lightbox-prev'; btnPrev.innerHTML = '◀'; btnPrev.setAttribute('aria-label','Imagem anterior (Seta esquerda)');
    var btnNext = document.createElement('button'); btnNext.className = 'lightbox-next'; btnNext.innerHTML = '▶'; btnNext.setAttribute('aria-label','Próxima imagem (Seta direita)');
    lbContent.appendChild(img);
    lb.appendChild(lbContent);
    lb.appendChild(btnClose);
    lb.appendChild(btnPrev);
    lb.appendChild(btnNext);
    document.body.appendChild(lb);

    var currentIndex = -1;
    var lastFocused = null;

    function openLightbox(index){
      currentIndex = index;
      var src = gallery[currentIndex].dataset.src;
      img.src = src;
      img.alt = gallery[currentIndex].getAttribute('aria-label') || '';
      lb.classList.add('open');
      lb.setAttribute('aria-hidden','false');
      lastFocused = document.activeElement;
      btnClose.focus();
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox(){
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
      if(lastFocused) lastFocused.focus();
    }

    function showNext(){
      currentIndex = (currentIndex + 1) % gallery.length;
      openLightbox(currentIndex);
    }
    function showPrev(){
      currentIndex = (currentIndex - 1 + gallery.length) % gallery.length;
      openLightbox(currentIndex);
    }

    gallery.forEach(function(el, i){
      // make keyboard accessible
      el.setAttribute('tabindex','0');
      el.addEventListener('click', function(){ openLightbox(i); });
      el.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); } });
    });

    btnClose.addEventListener('click', closeLightbox);
    btnNext.addEventListener('click', function(e){ e.stopPropagation(); showNext(); });
    btnPrev.addEventListener('click', function(e){ e.stopPropagation(); showPrev(); });

    // close when clicking outside image
    lb.addEventListener('click', function(e){ if(e.target === lb) closeLightbox(); });

    // keyboard
    window.addEventListener('keydown', function(e){
      if(lb.classList.contains('open')){
        if(e.key === 'Escape') closeLightbox();
        if(e.key === 'ArrowRight') showNext();
        if(e.key === 'ArrowLeft') showPrev();
      }
    });
  }
});
