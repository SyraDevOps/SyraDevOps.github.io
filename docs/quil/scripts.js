document.addEventListener('DOMContentLoaded', () => {

  // Menu mobile (se necessário)
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      mainNav.classList.toggle('is-active');
      menuToggle.setAttribute('aria-expanded', mainNav.classList.contains('is-active'));
    });
  }

  // Atualiza o ano no rodapé
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Formulário de contato (exemplo de manipulação)
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (formStatus) {
        formStatus.textContent = 'Obrigado pelo seu contato! Mensagem enviada.';
        contactForm.reset();
        setTimeout(() => { formStatus.textContent = ''; }, 5000);
      }
    });
  }

  // Modal da galeria (opcional, se desejar ampliar as fotos)
  const photos = document.querySelectorAll('.photo');
  if (photos.length > 0) {
    photos.forEach(photo => {
      photo.addEventListener('click', () => {
        const imgSrc = photo.dataset.src;
        // Aqui você pode implementar um modal para exibir a imagem
        console.log(`Abrir imagem: ${imgSrc}`);
      });
    });
  }

});
