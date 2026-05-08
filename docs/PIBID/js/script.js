document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const closeIcon = document.getElementById('close-icon');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            menuIcon.classList.toggle('hidden');
            closeIcon.classList.toggle('hidden');
            document.body.classList.toggle('overflow-hidden');
        });
    }

    // Close mobile menu on link click
    if (mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                menuIcon.classList.remove('hidden');
                closeIcon.classList.add('hidden');
                document.body.classList.remove('overflow-hidden');
            });
        });
    }

    // Scroll Reveal Animation using Intersection Observer
    const observerOptions = {
        root: null,
        threshold: 0.1,
        rootMargin: '0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });

    // Form submission
    const contactForm = document.querySelector('form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Obrigado pela sua mensagem! Entraremos em contato em breve.');
            this.reset();
        });
    }
});


// Portfolio Modal Functions
const portfolioData = [
    {
        title: "Planetário Itinerante",
        description: "O Planetário Itinerante é uma iniciativa que leva experimentos práticos de Física às salas de aula das escolas parceiras que não possuem laboratório próprio. Através de atividades hands-on, os alunos vivenciam conceitos abstratos de forma concreta e memorável, aumentando significativamente o engajamento e a compreensão dos conteúdos. Este projeto impacta diretamente a qualidade do ensino de Ciências nas escolas públicas.",
        image: "./assets/img/logo.png",
        link: "http://planetariosj.com"
    },
    {
        title: "Astronomia na Praça",
        description: "Astronomia na Praça é um projeto de extensão que promove observação do céu noturno e palestras abertas à comunidade escolar. Utilizando telescópios e recursos educacionais, os bolsistas compartilham conhecimentos sobre o universo, despertando curiosidade e interesse pela Astronomia. O projeto fortalece a relação entre a universidade e a comunidade local.",
        image: "./assets/img/meteoros.png",
        link: "#"
    },
    {
        title: "Astro Quizz",
        description: "O Astro Quizz é um projeto de extensão que promove a aprendizagem interativa sobre astronomia através de jogos e desafios. Os alunos participam de competições que estimulam o interesse pela ciência e a curiosidade sobre o universo. O projeto fortalece o aprendizado significativo e a colaboração entre os participantes.",
        image: "./assets/img/Quizz.jpeg",
        link: "./Quizz/quiz.html"
    }
];

function openModal(index) {
    const modal = document.getElementById('portfolioModal');
    const project = portfolioData[index];
    
    document.getElementById('modalImage').src = project.image;
    document.getElementById('modalTitle').textContent = project.title;
    document.getElementById('modalDescription').textContent = project.description;
    document.getElementById('modalLink').href = project.link;
    
    modal.classList.add('active');
    document.body.classList.add('overflow-hidden');
}

function closeModal(event) {
    if (event && event.target.id !== 'portfolioModal') return;
    
    const modal = document.getElementById('portfolioModal');
    modal.classList.remove('active');
    document.body.classList.remove('overflow-hidden');
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Carousel scroll functionality
document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.getElementById('portfolioCarousel');
    if (carousel) {
        // Add smooth scrolling behavior
        carousel.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                carousel.scrollLeft += e.deltaY;
            }
        });
    }
});
