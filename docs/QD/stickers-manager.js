(function initStickerManagerPage() {
    const catalogApi = window.QDStickerCatalog;
    const searchInput = document.getElementById('hubSearchInput');
    const categorySelect = document.getElementById('hubCategorySelect');
    const catalogGrid = document.getElementById('hubCatalogGrid');
    const favoritesGrid = document.getElementById('hubFavoritesGrid');
    const customGrid = document.getElementById('hubCustomGrid');
    const favoritesCountPill = document.getElementById('favoritesCountPill');
    const createStickerForm = document.getElementById('createStickerForm');
    const customStickerName = document.getElementById('customStickerName');
    const customStickerEmoji = document.getElementById('customStickerEmoji');
    const customStickerColor = document.getElementById('customStickerColor');
    const customStickerImageInput = document.getElementById('customStickerImageInput');
    const customStickerStatus = document.getElementById('customStickerStatus');

    if (!catalogApi || !catalogGrid || !favoritesGrid || !customGrid) return;

    let search = '';
    let selectedCategory = 'all';

    function getCollections() {
        return catalogApi.getStickerCollections() || {};
    }

    function getFavoritesSet() {
        return catalogApi.getFavorites() || new Set();
    }

    function updateFavoritesCount() {
        const total = getFavoritesSet().size;
        if (favoritesCountPill) {
            favoritesCountPill.textContent = `${total} favorito${total === 1 ? '' : 's'}`;
        }
    }

    function buildCard(item, key, options = {}) {
        const card = document.createElement('article');
        card.className = 'sticker-hub-card';

        const img = document.createElement('img');
        img.src = catalogApi.getCatalogSource(item);
        img.alt = item.name;

        const title = document.createElement('h3');
        title.textContent = item.name;

        const actions = document.createElement('div');
        actions.className = 'sticker-hub-card-actions';

        const favoriteButton = document.createElement('button');
        favoriteButton.type = 'button';
        favoriteButton.className = `sticker-hub-fav-btn${getFavoritesSet().has(key) ? ' active' : ''}`;
        favoriteButton.textContent = getFavoritesSet().has(key) ? 'Favorito' : 'Favoritar';
        favoriteButton.addEventListener('click', async () => {
            await catalogApi.toggleFavorite(key);
            renderAll();
        });

        actions.appendChild(favoriteButton);

        if (options.onDelete) {
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'sticker-hub-delete-btn';
            removeButton.textContent = 'Excluir';
            removeButton.addEventListener('click', options.onDelete);
            actions.appendChild(removeButton);
        }

        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(actions);

        return card;
    }

    function renderCategoryOptions() {
        if (!categorySelect) return;
        const collections = getCollections();
        const categories = Object.keys(collections);

        categorySelect.innerHTML = '';
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'Todas categorias';
        categorySelect.appendChild(allOption);

        categories.forEach((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            categorySelect.appendChild(option);
        });

        categorySelect.value = selectedCategory;
    }

    function renderCatalog() {
        const collections = getCollections();
        const entries = [];

        Object.entries(collections).forEach(([category, items]) => {
            if (selectedCategory !== 'all' && selectedCategory !== category) return;
            items.forEach((item) => {
                const key = category === 'Meus adesivos' ? `custom:${item.id}` : catalogApi.getItemKey(category, item.name);
                const matches = !search || item.name.toLowerCase().includes(search.toLowerCase());
                if (matches) entries.push({ item, key });
            });
        });

        catalogGrid.innerHTML = '';
        if (!entries.length) {
            catalogGrid.innerHTML = '<p class="sticker-hub-empty">Nenhum adesivo encontrado.</p>';
            return;
        }

        entries.forEach(({ item, key }) => {
            catalogGrid.appendChild(buildCard(item, key));
        });
    }

    function renderFavorites() {
        const collections = getCollections();
        const favorites = getFavoritesSet();
        const entries = [];

        Object.entries(collections).forEach(([category, items]) => {
            items.forEach((item) => {
                const key = category === 'Meus adesivos' ? `custom:${item.id}` : catalogApi.getItemKey(category, item.name);
                if (favorites.has(key)) entries.push({ item, key });
            });
        });

        favoritesGrid.innerHTML = '';
        if (!entries.length) {
            favoritesGrid.innerHTML = '<p class="sticker-hub-empty">Você ainda não favoritou adesivos.</p>';
            return;
        }

        entries.forEach(({ item, key }) => {
            favoritesGrid.appendChild(buildCard(item, key));
        });
    }

    function renderCustom() {
        const customs = catalogApi.getCustomStickers() || [];
        customGrid.innerHTML = '';

        if (!customs.length) {
            customGrid.innerHTML = '<p class="sticker-hub-empty">Nenhum adesivo personalizado salvo.</p>';
            return;
        }

        customs.forEach((item) => {
            const key = `custom:${item.id}`;
            customGrid.appendChild(buildCard(item, key, {
                onDelete: async () => {
                    if (getFavoritesSet().has(key)) {
                        await catalogApi.toggleFavorite(key);
                    }
                    catalogApi.removeCustomSticker(item.id);
                    renderAll();
                }
            }));
        });
    }

    function renderAll() {
        renderCategoryOptions();
        renderCatalog();
        renderFavorites();
        renderCustom();
        updateFavoritesCount();
        catalogApi.refresh();
    }

    function buildFromEmoji(name, glyph, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = color;
        ctx.fillRect(10, 10, 140, 140);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, 140, 140);

        ctx.font = '72px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(glyph || '✨', 80, 84);

        return {
            name,
            glyph: glyph || '✨',
            color,
            src: canvas.toDataURL('image/png')
        };
    }

    createStickerForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = (customStickerName?.value || '').trim();
        const emoji = (customStickerEmoji?.value || '').trim();
        const color = customStickerColor?.value || '#ffe8cf';
        if (!name) return;

        const created = buildFromEmoji(name, emoji, color);
        const saved = catalogApi.addCustomSticker(created);
        customStickerStatus.textContent = `Adesivo "${saved.name}" salvo com sucesso.`;
        customStickerName.value = '';
        customStickerEmoji.value = '';
        renderAll();
    });

    customStickerImageInput?.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const fallbackName = file.name.replace(/\.[^.]+$/, '').trim() || 'Imagem personalizada';
            const saved = catalogApi.addCustomSticker({
                name: fallbackName,
                src: reader.result,
                color: '#ffffff'
            });
            customStickerStatus.textContent = `Imagem "${saved.name}" importada e salva.`;
            renderAll();
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    });

    searchInput?.addEventListener('input', (event) => {
        search = event.target.value;
        renderCatalog();
    });

    categorySelect?.addEventListener('change', (event) => {
        selectedCategory = event.target.value;
        renderCatalog();
    });

    (async function bootstrap() {
        if (typeof catalogApi.loadCustomStickers === 'function') {
            catalogApi.loadCustomStickers();
        }
        if (typeof QDApi !== 'undefined' && QDApi.isAuthenticated) {
            await catalogApi.loadFavoritesFromAPI();
        }
        renderAll();
    })();
})();
