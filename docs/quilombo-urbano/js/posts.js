// ===== JAVASCRIPT ESPECÍFICO PARA PÁGINA DE POSTS =====

class PostsPage {
  constructor() {
    this.currentFilter = 'all';
    this.postsPerLoad = 6;
    this.currentPage = 1;
    this.allPosts = [];
    this.filteredPosts = [];
    
    this.init();
  }

  init() {
    this.setupFilterButtons();
    this.setupLoadMore();
    this.setupPostInteractions();
    this.loadInitialPosts();
  }

  setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filtro-btn');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const filter = e.target.dataset.filter;
        this.setActiveFilter(e.target);
        this.filterPosts(filter);
      });
    });
  }

  setActiveFilter(activeButton) {
    // Remove active de todos os botões
    document.querySelectorAll('.filtro-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Adiciona active ao botão clicado
    activeButton.classList.add('active');
  }

  filterPosts(filter) {
    this.currentFilter = filter;
    const posts = document.querySelectorAll('.post-card');
    
    posts.forEach(post => {
      const category = post.dataset.category;
      const shouldShow = filter === 'all' || category === filter;
      
      if (shouldShow) {
        post.style.display = 'block';
        post.classList.add('fade-in');
      } else {
        post.style.display = 'none';
        post.classList.remove('fade-in');
      }
    });

    // Animar entrada dos posts visíveis
    this.animateVisiblePosts();
  }

  animateVisiblePosts() {
    const visiblePosts = document.querySelectorAll('.post-card[style*="block"], .post-card:not([style])');
    
    visiblePosts.forEach((post, index) => {
      post.style.opacity = '0';
      post.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        post.style.transition = 'all 0.3s ease';
        post.style.opacity = '1';
        post.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  setupLoadMore() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.loadMorePosts();
      });
    }
  }

  loadMorePosts() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    // Simular carregamento
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
    loadMoreBtn.disabled = true;
    
    setTimeout(() => {
      this.addMorePosts();
      loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Carregar Mais Posts';
      loadMoreBtn.disabled = false;
    }, 1500);
  }

  addMorePosts() {
    const postsGrid = document.getElementById('postsGrid');
    const newPosts = this.generateMorePosts();
    
    newPosts.forEach(postHTML => {
      const postElement = document.createElement('div');
      postElement.innerHTML = postHTML;
      const post = postElement.firstElementChild;
      
      // Adicionar animação de entrada
      post.style.opacity = '0';
      post.style.transform = 'translateY(30px)';
      
      postsGrid.appendChild(post);
      
      // Animar entrada
      setTimeout(() => {
        post.style.transition = 'all 0.5s ease';
        post.style.opacity = '1';
        post.style.transform = 'translateY(0)';
      }, 100);
    });

    this.currentPage++;
    
    // Esconder botão se chegou ao limite
    if (this.currentPage >= 3) {
      document.getElementById('loadMoreBtn').style.display = 'none';
    }
  }

  generateMorePosts() {
    const categories = ['eventos', 'oficinas', 'cultura', 'comunidade'];
    const images = [
      'img/atividade-comunitaria-1.jpg',
      'img/atividade-comunitaria-2.jpg',
      'img/atividade-comunitaria-3.jpg'
    ];
    
    const posts = [];
    
    for (let i = 0; i < this.postsPerLoad; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const image = images[Math.floor(Math.random() * images.length)];
      const likes = Math.floor(Math.random() * 100) + 20;
      const comments = Math.floor(Math.random() * 30) + 5;
      
      const postContent = this.getPostContentByCategory(category);
      
      const postHTML = `
        <div class="post-card" data-category="${category}">
          <div class="post-image">
            <img src="${image}" alt="Post ${category}" loading="lazy">
            <div class="post-overlay">
              <div class="post-stats">
                <span><i class="fas fa-heart"></i> ${likes}</span>
                <span><i class="fas fa-comment"></i> ${comments}</span>
              </div>
            </div>
          </div>
          <div class="post-content">
            <div class="post-header">
              <div class="post-avatar">
                <img src="assets/logo.png" alt="Quilombo Urbano">
              </div>
              <div class="post-info">
                <h4>quilombourbanosaojoaodelrei</h4>
                <span class="post-date">${this.getRandomDate()}</span>
              </div>
            </div>
            <p class="post-text">${postContent.text}</p>
            <div class="post-hashtags">
              ${postContent.hashtags.map(tag => `<span>#${tag}</span>`).join('')}
            </div>
          </div>
        </div>
      `;
      
      posts.push(postHTML);
    }
    
    return posts;
  }

  getPostContentByCategory(category) {
    const contents = {
      eventos: {
        text: '🎉 Mais um evento incrível realizado com sucesso! A participação da comunidade foi fundamental. Obrigado a todos!',
        hashtags: ['Evento', 'Comunidade', 'Sucesso']
      },
      oficinas: {
        text: '🎨 Oficina educativa cheia de aprendizado e criatividade. Nossos participantes sempre nos surpreendem!',
        hashtags: ['Oficina', 'Educação', 'Criatividade']
      },
      cultura: {
        text: '🎭 Celebrando nossa rica cultura afro-brasileira com muito orgulho e alegria. Nossa identidade é nossa força!',
        hashtags: ['Cultura', 'Identidade', 'Orgulho']
      },
      comunidade: {
        text: '🤝 A união da nossa comunidade é o que nos torna especiais. Juntos construímos um futuro melhor!',
        hashtags: ['Comunidade', 'União', 'Futuro']
      }
    };
    
    return contents[category] || contents.comunidade;
  }

  getRandomDate() {
    const dates = [
      '3 dias atrás',
      '1 semana atrás',
      '2 semanas atrás',
      '3 semanas atrás',
      '1 mês atrás',
      '2 meses atrás'
    ];
    
    return dates[Math.floor(Math.random() * dates.length)];
  }

  setupPostInteractions() {
    // Delegação de eventos para posts dinâmicos
    document.addEventListener('click', (e) => {
      // Interação com overlay de posts
      if (e.target.closest('.post-overlay')) {
        const postCard = e.target.closest('.post-card');
        this.showPostModal(postCard);
      }
      
      // Interação com hashtags
      if (e.target.classList.contains('post-hashtags') || e.target.closest('.post-hashtags span')) {
        e.preventDefault();
        const hashtag = e.target.textContent.replace('#', '');
        this.searchByHashtag(hashtag);
      }
    });

    // Hover effects nos posts
    document.addEventListener('mouseenter', (e) => {
      if (e.target.classList.contains('post-card')) {
        e.target.style.transform = 'translateY(-5px)';
      }
    }, true);

    document.addEventListener('mouseleave', (e) => {
      if (e.target.classList.contains('post-card')) {
        e.target.style.transform = 'translateY(0)';
      }
    }, true);
  }

  showPostModal(postCard) {
    // Criar modal simples para visualizar post
    const modal = document.createElement('div');
    modal.className = 'post-modal';
    modal.innerHTML = `
      <div class="post-modal-content">
        <span class="post-modal-close">&times;</span>
        <div class="post-modal-body">
          ${postCard.innerHTML}
        </div>
        <div class="post-modal-actions">
          <button class="btn-like">
            <i class="fas fa-heart"></i> Curtir
          </button>
          <button class="btn-comment">
            <i class="fas fa-comment"></i> Comentar
          </button>
          <button class="btn-share">
            <i class="fas fa-share"></i> Compartilhar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar modal
    modal.querySelector('.post-modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Animar entrada
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  }

  searchByHashtag(hashtag) {
    // Simular busca por hashtag
    console.log(`Buscando posts com hashtag: ${hashtag}`);
    
    // Aqui poderia implementar uma busca real
    const notification = document.createElement('div');
    notification.className = 'hashtag-notification';
    notification.innerHTML = `
      <i class="fas fa-search"></i>
      Buscando posts com #${hashtag}...
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  loadInitialPosts() {
    // Animar posts iniciais
    const initialPosts = document.querySelectorAll('.post-card');
    
    initialPosts.forEach((post, index) => {
      post.style.opacity = '0';
      post.style.transform = 'translateY(30px)';
      
      setTimeout(() => {
        post.style.transition = 'all 0.5s ease';
        post.style.opacity = '1';
        post.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }
}

// ===== ESTILOS ESPECÍFICOS PARA PÁGINA DE POSTS =====
const postsStyles = `
  .hero-posts {
    background: linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.5)), 
                url('img/atividade-comunitaria-1.jpg') center/cover;
    height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--on-dark);
  }
  
  .filtros-section {
    padding: 2rem 0;
    background: rgba(0, 0, 0, 0.02);
  }
  
  .filtros-container {
    text-align: center;
  }
  
  .filtros-container h3 {
    margin-bottom: 1.5rem;
    color: var(--primary-color);
  }
  
  .filtros-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .filtro-btn {
    padding: 0.5rem 1.5rem;
    border: 2px solid var(--primary-color);
    background: transparent;
    color: var(--primary-color);
    border-radius: 25px;
    cursor: pointer;
    transition: all var(--transition-medium);
    font-weight: 600;
  }
  
  .filtro-btn:hover,
  .filtro-btn.active {
    background: var(--primary-color);
    color: var(--dark-text);
    transform: translateY(-2px);
  }
  
  .posts-grid-section {
    padding: 4rem 0;
  }
  
  .instagram-posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }
  
  .post-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: var(--border-radius-large);
    overflow: hidden;
    border: 1px solid rgba(255, 193, 7, 0.2);
    transition: all var(--transition-medium);
    cursor: pointer;
  }
  
  .post-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    border-color: var(--primary-color);
  }
  
  .post-image {
    position: relative;
    height: 300px;
    overflow: hidden;
  }
  
  .post-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-slow);
  }
  
  .post-card:hover .post-image img {
    transform: scale(1.05);
  }
  
  .post-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all var(--transition-medium);
  }
  
  .post-card:hover .post-overlay {
    opacity: 1;
  }
  
  .post-stats {
    display: flex;
    gap: 1.5rem;
    color: white;
    font-size: 1.1rem;
  }
  
  .post-stats span {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .post-content {
    padding: 1.5rem;
  }
  
  .post-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .post-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
  }
  
  .post-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .post-info h4 {
    margin: 0;
    font-size: 1rem;
    color: var(--primary-color);
  }
  
  .post-date {
    font-size: 0.85rem;
    opacity: 0.7;
  }
  
  .post-text {
    line-height: 1.6;
    margin-bottom: 1rem;
  }
  
  .post-hashtags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .post-hashtags span {
    background: rgba(255, 193, 7, 0.1);
    color: var(--primary-color);
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .post-hashtags span:hover {
    background: var(--primary-color);
    color: var(--dark-text);
  }
  
  .load-more-container {
    text-align: center;
    margin-top: 3rem;
  }
  
  .cta-instagram {
    background: linear-gradient(135deg, #e4405f, #833ab4);
    color: white;
    padding: 4rem 0;
    text-align: center;
  }
  
  .cta-content h2 {
    margin-bottom: 1rem;
    font-size: 2.5rem;
  }
  
  .cta-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
  }
  
  .cta-actions {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }
  
  .post-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .post-modal.show {
    opacity: 1;
  }
  
  .post-modal-content {
    background: var(--dark-bg);
    border-radius: var(--border-radius-large);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
  }
  
  .post-modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 10000;
    color: var(--primary-color);
  }
  
  .post-modal-actions {
    padding: 1.5rem;
    border-top: 1px solid rgba(255, 193, 7, 0.2);
    display: flex;
    justify-content: space-around;
  }
  
  .post-modal-actions button {
    background: none;
    border: none;
    color: var(--primary-color);
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius);
    transition: all var(--transition-medium);
  }
  
  .post-modal-actions button:hover {
    background: rgba(255, 193, 7, 0.1);
  }
  
  .hashtag-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--primary-color);
    color: var(--dark-text);
    padding: 1rem 1.5rem;
    border-radius: var(--border-radius);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: slideInRight 0.3s ease;
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .fade-in {
    animation: fadeIn 0.5s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @media (max-width: 768px) {
    .instagram-posts-grid {
      grid-template-columns: 1fr;
    }
    
    .filtros-buttons {
      justify-content: center;
    }
    
    .cta-actions {
      flex-direction: column;
      align-items: center;
    }
    
    .post-modal-content {
      width: 95%;
      margin: 1rem;
    }
  }
`;

// Adicionar estilos específicos da página
const styleSheet = document.createElement('style');
styleSheet.textContent = postsStyles;
document.head.appendChild(styleSheet);

// Inicializar a página de posts
document.addEventListener('DOMContentLoaded', () => {
  new PostsPage();
});
