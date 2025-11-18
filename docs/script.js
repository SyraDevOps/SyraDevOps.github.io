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

    initSyraHomeHandshake();
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

// --- SyraHome handshake & animation ---
const SYRA_HOME_ENDPOINT = 'http://syra-home-syra0156326.local/info';
const SYRA_HOME_POLL_INTERVAL = 60_000;
const SYRA_HOME_INITIAL_DELAY = 4_000;
let syraHomeSequenceTriggered = false;
let syraHomeIntervalId = null;
let syraHomeInitialTimer = null;

function initSyraHomeHandshake() {
    if (syraHomeInitialTimer !== null) {
        return;
    }

    syraHomeInitialTimer = setTimeout(() => {
        attemptSyraHomeHandshake();
        if (syraHomeIntervalId === null) {
            syraHomeIntervalId = setInterval(() => {
                attemptSyraHomeHandshake();
            }, SYRA_HOME_POLL_INTERVAL);
        }
    }, SYRA_HOME_INITIAL_DELAY);
}

function attemptSyraHomeHandshake() {
    if (syraHomeSequenceTriggered) {
        return;
    }

    const brandAnchor = document.querySelector('.brand-name');
    const orbitArea = document.querySelector('.orbit-container');

    if (!brandAnchor || !orbitArea || syraHomeSequenceTriggered) {
        return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(SYRA_HOME_ENDPOINT, { signal: controller.signal })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                return null;
            }
            return response.text();
        })
        .then(payload => {
            if (payload !== null && payload !== undefined) {
                triggerSyraHomeSequence();
            }
        })
        .catch(error => {
            console.warn('SyraHome handshake falhou:', error);
        });
}

function triggerSyraHomeSequence() {
    if (syraHomeSequenceTriggered) {
        return;
    }
    syraHomeSequenceTriggered = true;

    if (syraHomeIntervalId !== null) {
        clearInterval(syraHomeIntervalId);
        syraHomeIntervalId = null;
    }

    if (syraHomeInitialTimer !== null) {
        clearTimeout(syraHomeInitialTimer);
        syraHomeInitialTimer = null;
    }

    const brandAnchor = document.querySelector('.brand-name');
    const orbitArea = document.querySelector('.orbit-container');
    const orbitBall = orbitArea ? orbitArea.querySelector('.orbit-ball') : null;

    if (brandAnchor) {
        brandAnchor.style.animation = 'none';
        brandAnchor.classList.remove('brand-name--enter');
        brandAnchor.classList.add('brand-name--exit');

        const handleExitTransition = () => {
            brandAnchor.removeEventListener('transitionend', handleExitTransition);
            brandAnchor.classList.remove('brand-name--exit');
            brandAnchor.textContent = 'Bem-vindo ao SyraHome';
            requestAnimationFrame(() => {
                brandAnchor.classList.add('brand-name--enter');
            });
        };

        brandAnchor.addEventListener('transitionend', handleExitTransition);

        // Garantia caso o evento de transição não dispare
        setTimeout(() => {
            if (!brandAnchor.classList.contains('brand-name--enter')) {
                handleExitTransition();
            }
        }, 700);
    }

    if (orbitArea) {
        orbitArea.classList.add('orbit-container--center');
        spawnOrbitSatellites(orbitArea);
    }

    if (orbitBall) {
        orbitBall.classList.add('orbit-ball--center');
    }

    setTimeout(() => {
        redirectToSyraHome();
    }, 3500);
}

function spawnOrbitSatellites(orbitArea) {
    orbitArea.querySelectorAll('.orbit-satellite').forEach(node => node.remove());

    ['left', 'right'].forEach(direction => {
        const satellite = document.createElement('div');
        satellite.className = `orbit-satellite orbit-satellite--${direction}`;
        orbitArea.appendChild(satellite);
        requestAnimationFrame(() => {
            satellite.classList.add('orbit-satellite--active');
        });
    });
}

function redirectToSyraHome() {
    window.location.href = '/SyraHome';
}
