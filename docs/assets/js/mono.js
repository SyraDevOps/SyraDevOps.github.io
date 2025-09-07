(function () {
  const key = 'theme';
  const root = document.documentElement;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');

  function apply(theme) {
    if (!theme) return;
    root.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      const isDark = theme === 'dark';
      btn.setAttribute('aria-pressed', String(isDark));
      btn.textContent = isDark ? 'Claro' : 'Escuro';
      btn.title = isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro';
    }
  }

  function init() {
    const saved = localStorage.getItem(key);
    const startTheme = saved || (prefersDark && prefersDark.matches ? 'dark' : 'light');
    apply(startTheme);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const current = root.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(key, next);
        apply(next);
      });
    }

    if (prefersDark && prefersDark.addEventListener) {
      prefersDark.addEventListener('change', (e) => {
        const saved2 = localStorage.getItem(key);
        if (saved2) return; // user's explicit choice wins
        apply(e.matches ? 'dark' : 'light');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
