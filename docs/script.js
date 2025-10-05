// Função para alternar o menu
function toggleMenu() {
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    
    hamburger.classList.toggle('active');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Função para fechar o menu
function closeMenu() {
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    
    hamburger.classList.remove('active');
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

// Função para marcar o item ativo no menu
function setActiveMenuItem() {
    const pathParts = window.location.pathname.split('/');
    const currentPage = (pathParts[pathParts.length - 1] || 'index.html').toLowerCase();
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(item => {
        item.classList.remove('active');

        const href = (item.getAttribute('href') || '').split('?')[0].split('#')[0];
        const targetPage = href.split('/').pop().toLowerCase();

        if (targetPage === currentPage ||
            (currentPage === '' && (targetPage === '#' || targetPage === 'index.html')) ||
            (currentPage === 'index.html' && (targetPage === '#' || targetPage === ''))) {
            item.classList.add('active');
        }
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Marcar item ativo do menu
    setActiveMenuItem();
    
    // Fechar menu com tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });
    
    // Adicionar evento de clique aos itens do menu para fechar automaticamente
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Se for um link real (não #), permitir navegação
            if (this.getAttribute('href') !== '#') {
                closeMenu();
            } else {
                e.preventDefault();
                closeMenu();
            }
        });
    });
});

// Animações suaves para elementos que entram na tela
function handleScrollAnimations() {
    const animatedElements = document.querySelectorAll('.feature-card, .contact-info');
    
    animatedElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

// Adicionar listener para scroll se houver elementos animados
if (document.querySelectorAll('.feature-card, .contact-info').length > 0) {
    window.addEventListener('scroll', handleScrollAnimations);
}