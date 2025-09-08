/* filepath: c:\Users\Kayqu\Downloads\SyraDevOps.github.io-main\SyraDevOps.github.io-main\docs\assets\js\responsive.js */
/* small helpers: menu toggle, force focus for mobile camera start */

(function(){
  // Menu toggle: find .menu-toggle and the .menu sibling
  document.addEventListener('DOMContentLoaded', function(){
    const toggles = document.querySelectorAll('.menu-toggle');
    toggles.forEach(btn => {
      btn.addEventListener('click', function(){
        const menu = document.querySelector('.menu');
        if (!menu) return;
        menu.classList.toggle('open');
      });
    });

    // Improve clickable area for header links on mobile
    const links = document.querySelectorAll('a');
    links.forEach(a => {
      a.addEventListener('touchstart', ()=>{}, {passive:true});
    });

    // Optional: expose a safe startCamera button for pages (Vigis)
    window.ensureCameraStart = function(videoEl, startFn) {
      // Some browsers block camera until user gesture; this utility adds a small overlay button
      if (!videoEl || typeof startFn !== 'function') return;
      const needGesture = /Android|iPhone|iPad/i.test(navigator.userAgent);
      if (!needGesture) return;
      // create overlay start button if not present
      if (document.getElementById('__startCamBtn')) return;
      const btn = document.createElement('button');
      btn.id = '__startCamBtn';
      btn.textContent = 'Iniciar câmera';
      btn.style.position = 'fixed';
      btn.style.left = '50%';
      btn.style.bottom = '32px';
      btn.style.transform = 'translateX(-50%)';
      btn.style.zIndex = '2000';
      btn.style.padding = '10px 16px';
      btn.style.borderRadius = '10px';
      btn.style.background = '#47b7e5';
      btn.style.color = '#001';
      btn.style.border = 'none';
      btn.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
      btn.addEventListener('click', async ()=>{
        try {
          await startFn();
          btn.remove();
        } catch(e) {
          console.warn('start camera failed', e);
        }
      });
      document.body.appendChild(btn);
    };
  });
})();