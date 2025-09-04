// Pequeno JavaScript para interações: menu, formulário e ano de rodapé
document.addEventListener('DOMContentLoaded', function(){
  // rodapé: ano atual
  var yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // menu mobile
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
});
