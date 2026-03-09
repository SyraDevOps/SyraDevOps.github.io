const stickerToggleButton = document.getElementById('stickerToggleButton');
const stickerPanel = document.getElementById('stickerPanel');
const stickerPanelClose = document.getElementById('stickerPanelClose');
const stickerCategoryChips = document.getElementById('stickerCategoryChips');
const stickerCatalog = document.getElementById('stickerCatalog');
const stickerFavorites = document.getElementById('stickerFavorites');
const stickerSearchInput = document.getElementById('stickerSearchInput');
const stickerViewTabs = document.getElementById('stickerViewTabs');
const stickerStage = document.getElementById('stickerStage');
const stickerPanelSubtitle = document.querySelector('.sticker-panel-subtitle');

let stickerZIndex = 5;
let activeCategory = 'Emocoes';
let currentView = 'catalog';
let searchQuery = '';
const FAVORITES_KEY = 'qd_web_sticker_favorites_v1';
const CUSTOM_STICKERS_KEY = 'qd_web_custom_stickers_v1';

const stickerLibrary = {
    Emocoes: [
        { name: 'Feliz', glyph: '😊', color: '#ffe59b' },
        { name: 'Animado', glyph: '🤩', color: '#ffd7a1' },
        { name: 'Calmo', glyph: '😌', color: '#d7f0ff' },
        { name: 'Sonolento', glyph: '😴', color: '#e8ddff' },
        { name: 'Determinado', glyph: '😤', color: '#ffd4d4' },
        { name: 'Apaixonado', glyph: '🥰', color: '#ffe8e4' },
        { name: 'Triste', glyph: '😢', color: '#dae8ff' },
        { name: 'Raiva', glyph: '😠', color: '#ffd4d4' },
        { name: 'Surpreso', glyph: '😲', color: '#fff4d9' },
        { name: 'Constrangido', glyph: '😳', color: '#ffe8d9' },
        { name: 'Envergonhado', glyph: '😔', color: '#d9ecff' },
        { name: 'Aliviado', glyph: '😌', color: '#e8f5d9' }
    ],
    Natureza: [
        { name: 'Folha', glyph: '🍃', color: '#dcf6d4' },
        { name: 'Flor', glyph: '🌸', color: '#ffd9ea' },
        { name: 'Trevo', glyph: '🍀', color: '#d9f7c9' },
        { name: 'Árvore', glyph: '🌳', color: '#def5cf' },
        { name: 'Mar', glyph: '🌊', color: '#d5e8ff' },
        { name: 'Montanha', glyph: '⛰️', color: '#e8e0ff' },
        { name: 'Nuvem', glyph: '☁️', color: '#e8f0ff' },
        { name: 'Gotinha', glyph: '💧', color: '#d7e8ff' },
        { name: 'Fogo', glyph: '🔥', color: '#ffd9a1' },
        { name: 'Chuva', glyph: '🌧️', color: '#dde8f0' },
        { name: 'Borboleta', glyph: '🦋', color: '#ffe8d9' },
        { name: 'Abelha', glyph: '🐝', color: '#fffad9' }
    ],
    Estrelas: [
        { name: 'Brilho', glyph: '✨', color: '#ffe5a6' },
        { name: 'Estrela', glyph: '⭐', color: '#fff1b8' },
        { name: 'Lua', glyph: '🌙', color: '#e8dcff' },
        { name: 'Galáxia', glyph: '🌌', color: '#d7dfff' },
        { name: 'Cometa', glyph: '☄️', color: '#ffd8ba' },
        { name: 'Sol', glyph: '☀️', color: '#fffad9' },
        { name: 'Arco-íris', glyph: '🌈', color: '#f0e8ff' },
        { name: 'Raio', glyph: '⚡', color: '#fffdd9' }
    ],
    Corações: [
        { name: 'Vermelho', glyph: '❤️', color: '#ffd7db' },
        { name: 'Brilho', glyph: '💖', color: '#ffd9ef' },
        { name: 'Faixa', glyph: '💘', color: '#ffdbe8' },
        { name: 'Carinho', glyph: '💗', color: '#ffe0ea' },
        { name: 'Duplo', glyph: '💕', color: '#ffd8f1' },
        { name: 'Pulsação', glyph: '💓', color: '#ffd8ed' },
        { name: 'Explosão', glyph: '💥', color: '#ffd9d9' },
        { name: 'Quebrado', glyph: '💔', color: '#ffd0d0' },
        { name: 'Laranja', glyph: '🧡', color: '#ffebd9' },
        { name: 'Amarelo', glyph: '💛', color: '#fffed9' }
    ],
    Rabiscos: [
        { name: 'Seta', glyph: '➰', color: '#f3e6ff' },
        { name: 'Pincel', glyph: '🖌️', color: '#e6ecff' },
        { name: 'Lápis', glyph: '✏️', color: '#fff2d8' },
        { name: 'Clipe', glyph: '📎', color: '#e4ecf2' },
        { name: 'Marca', glyph: '🌀', color: '#dfefff' },
        { name: 'Triângulo', glyph: '△', color: '#ffe8d9' },
        { name: 'Círculo', glyph: '○', color: '#e8f0ff' },
        { name: 'Quadrado', glyph: '□', color: '#ffe8e8' }
    ],
    Café: [
        { name: 'Caneca', glyph: '☕', color: '#ffe1c4' },
        { name: 'Grãos', glyph: '🫘', color: '#f4dbc4' },
        { name: 'Cookie', glyph: '🍪', color: '#ffe8bd' },
        { name: 'Croissant', glyph: '🥐', color: '#ffe3ba' },
        { name: 'Leite', glyph: '🥛', color: '#f4f3ff' },
        { name: 'Bolo', glyph: '🍰', color: '#ffd9e8' },
        { name: 'Donuts', glyph: '🍩', color: '#ffd9c4' },
        { name: 'Cereja', glyph: '🍒', color: '#ffd4d4' },
        { name: 'Brioches', glyph: '🥪', color: '#ffe0c4' },
        { name: 'Chocolate', glyph: '🍫', color: '#e8dcc4' }
    ],
    'Vida cotidiana': [
        { name: 'Casa', glyph: '🏠', color: '#dceeff' },
        { name: 'Livro', glyph: '📚', color: '#ffe5b8' },
        { name: 'Música', glyph: '🎧', color: '#e6ddff' },
        { name: 'Check', glyph: '✅', color: '#daf3d4' },
        { name: 'Agenda', glyph: '🗓️', color: '#ffe8d9' },
        { name: 'Câmera', glyph: '📸', color: '#ffe0c4' },
        { name: 'Presente', glyph: '🎁', color: '#ffd9e8' },
        { name: 'Balão', glyph: '🎈', color: '#ffd9e8' },
        { name: 'Festa', glyph: '🎉', color: '#fff0c4' },
        { name: 'Trem', glyph: '🚂', color: '#ffe8c4' },
        { name: 'Avião', glyph: '✈️', color: '#e8f0ff' },
        { name: 'Carro', glyph: '🚗', color: '#ffd4d4' }
    ]
};

function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
}

function buildStickerPng(item) {
    const size = 160;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const pad = 8;
    roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, 34);
    ctx.fillStyle = item.color;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.font = '72px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.glyph, size / 2, size / 2 + 2);

    return canvas.toDataURL('image/png');
}

let _favoritesCache = new Set();
let _customStickersCache = [];

function getFavorites() {
    return _favoritesCache;
}

async function loadFavoritesFromAPI() {
    try {
        const keys = await QDApi.getStickerFavorites();
        _favoritesCache = new Set(Array.isArray(keys) ? keys : []);
    } catch { _favoritesCache = new Set(); }
}

function loadCustomStickers() {
    try {
        const raw = localStorage.getItem(CUSTOM_STICKERS_KEY);
        const parsed = JSON.parse(raw || '[]');
        _customStickersCache = Array.isArray(parsed) ? parsed : [];
    } catch {
        _customStickersCache = [];
    }
    return _customStickersCache;
}

function saveCustomStickers() {
    try {
        localStorage.setItem(CUSTOM_STICKERS_KEY, JSON.stringify(_customStickersCache));
    } catch (e) {
        console.error('Erro ao salvar adesivos personalizados:', e);
    }
}

function getCustomStickers() {
    return _customStickersCache;
}

function addCustomSticker(sticker) {
    const id = `custom-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const cleanName = String(sticker?.name || '').trim().slice(0, 40) || 'Meu adesivo';
    const item = {
        id,
        name: cleanName,
        glyph: sticker?.glyph || '',
        color: sticker?.color || '#ffe8cf',
        src: typeof sticker?.src === 'string' ? sticker.src : ''
    };
    _customStickersCache.unshift(item);
    saveCustomStickers();
    renderCategoryChips();
    renderCatalog();
    renderFavorites();
    return item;
}

function removeCustomSticker(stickerId) {
    _customStickersCache = _customStickersCache.filter((item) => item.id !== stickerId);
    saveCustomStickers();
    renderCategoryChips();
    renderCatalog();
    renderFavorites();
}

function getCatalogSource(item) {
    if (item && typeof item.src === 'string' && item.src) {
        return item.src;
    }
    return buildStickerPng(item);
}

function getStickerCollections() {
    const collections = { ...stickerLibrary };
    const custom = getCustomStickers();
    if (custom.length) {
        collections['Meus adesivos'] = custom.map((item) => ({ ...item }));
    }
    return collections;
}

async function saveFavoriteAdd(key) {
    try { await QDApi.addStickerFavorite(key); } catch (e) { console.error(e); }
}

async function saveFavoriteRemove(key) {
    try { await QDApi.removeStickerFavorite(key); } catch (e) { console.error(e); }
}

async function toggleFavorite(itemKey) {
    const favorites = getFavorites();
    if (favorites.has(itemKey)) {
        favorites.delete(itemKey);
        await saveFavoriteRemove(itemKey);
    } else {
        favorites.add(itemKey);
        await saveFavoriteAdd(itemKey);
    }
    renderCatalog();
    renderFavorites();
}

function getItemKey(categoryName, itemName) {
    return `${categoryName}:${itemName}`;
}

function setPanelOpen(open) {
    if (!stickerPanel) return;
    
    if (open) {
        // Fechar outros painéis
        const chatPanel = document.getElementById('chatPanel');
        const drawingPanel = document.getElementById('drawingPanel');
        if (chatPanel) chatPanel.classList.remove('open');
        if (drawingPanel) drawingPanel.classList.remove('open');
    }
    
    stickerPanel.classList.toggle('open', open);
    stickerPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
    
    // Atualizar overlay
    if (typeof updateOverlay === 'function') {
        updateOverlay();
    }
}

function renderCategoryChips() {
    if (!stickerCategoryChips) return;

    stickerCategoryChips.innerHTML = '';
    const collections = getStickerCollections();
    if (!collections[activeCategory]) {
        activeCategory = Object.keys(collections)[0] || 'Emocoes';
    }

    Object.keys(collections).forEach((categoryName) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `sticker-chip${categoryName === activeCategory ? ' active' : ''}`;
        chip.textContent = categoryName;
        chip.addEventListener('click', () => {
            activeCategory = categoryName;
            renderCategoryChips();
            renderCatalog();
        });
        stickerCategoryChips.appendChild(chip);
    });
}

function createCatalogDrag(stickerData, originEvent) {
    if (!stickerStage) return;

    const ghost = document.createElement('img');
    ghost.className = 'sticker-drag-preview';
    ghost.src = stickerData.src;
    document.body.appendChild(ghost);

    const moveGhost = (x, y) => {
        ghost.style.left = `${x}px`;
        ghost.style.top = `${y}px`;
    };

    moveGhost(originEvent.clientX, originEvent.clientY);

    const onPointerMove = (event) => moveGhost(event.clientX, event.clientY);

    const onPointerUp = (event) => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        ghost.remove();

        const rect = stickerStage.getBoundingClientRect();
        const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;

        if (!inside) return;

        const left = event.clientX - rect.left;
        const top = event.clientY - rect.top;
        createPlacedSticker(stickerData.src, left, top);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
}

function renderCatalog() {
    if (!stickerCatalog) return;

    stickerCatalog.innerHTML = '';
    const categoryItems = getStickerCollections()[activeCategory] || [];
    const favorites = getFavorites();

    const filtered = categoryItems.filter((item) => {
        const itemKey = getItemKey(activeCategory, item.name);
        const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    if (!filtered.length) {
        stickerCatalog.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #aaa; font-size: 18px;">Nenhum adesivo encontrado</p>';
        return;
    }

    filtered.forEach((item) => {
        const src = getCatalogSource(item);
        const itemKey = activeCategory === 'Meus adesivos'
            ? `custom:${item.id}`
            : getItemKey(activeCategory, item.name);
        const isFavored = favorites.has(itemKey);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sticker-catalog-item';

        const img = document.createElement('img');
        img.src = src;
        img.alt = item.name;

        const label = document.createElement('span');
        label.textContent = item.name;

        const favoriteBtn = document.createElement('button');
        favoriteBtn.type = 'button';
        favoriteBtn.className = `sticker-favorite-button${isFavored ? ' favorited' : ''}`;
        favoriteBtn.textContent = '♥';
        favoriteBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite(itemKey);
        });

        button.appendChild(favoriteBtn);
        button.appendChild(img);
        button.appendChild(label);

        button.addEventListener('pointerdown', (event) => {
            if (event.target === favoriteBtn) return;
            event.preventDefault();
            createCatalogDrag({ src, name: item.name }, event);
        });

        stickerCatalog.appendChild(button);
    });
}

function renderFavorites() {
    if (!stickerFavorites) return;

    stickerFavorites.innerHTML = '';
    const favorites = getFavorites();

    if (!favorites.size) {
        stickerFavorites.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #778291; font-size: 18px;">Nenhum favorito ainda. Use a pagina Adesivos para montar sua colecao.</p>';
        return;
    }

    const favoriteItems = [];
    Object.entries(getStickerCollections()).forEach(([category, items]) => {
        items.forEach((item) => {
            const itemKey = category === 'Meus adesivos'
                ? `custom:${item.id}`
                : getItemKey(category, item.name);
            if (favorites.has(itemKey)) {
                favoriteItems.push({ category, item, itemKey });
            }
        });
    });

    const filteredFavorites = favoriteItems.filter(({ item }) => {
        return !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (!filteredFavorites.length) {
        stickerFavorites.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #778291; font-size: 18px;">Nenhum favorito corresponde a sua busca.</p>';
        return;
    }

    filteredFavorites.forEach(({ category, item, itemKey }) => {
        const src = getCatalogSource(item);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sticker-catalog-item';

        const img = document.createElement('img');
        img.src = src;
        img.alt = item.name;

        const label = document.createElement('span');
        label.textContent = item.name;

        const favoriteBtn = document.createElement('button');
        favoriteBtn.type = 'button';
        favoriteBtn.className = 'sticker-favorite-button favorited';
        favoriteBtn.textContent = '♥';
        favoriteBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite(itemKey);
        });

        button.appendChild(favoriteBtn);
        button.appendChild(img);
        button.appendChild(label);

        button.addEventListener('pointerdown', (event) => {
            if (event.target === favoriteBtn) return;
            event.preventDefault();
            createCatalogDrag({ src, name: item.name }, event);
        });

        stickerFavorites.appendChild(button);
    });
}

function updateStickerTransform(stickerElement, x, y, size, rotation) {
    stickerElement.style.left = `${x}px`;
    stickerElement.style.top = `${y}px`;
    stickerElement.style.width = `${size}px`;
    stickerElement.style.height = `${size}px`;
    stickerElement.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
}

function bindMoveSticker(stickerElement, state) {
    stickerElement.addEventListener('pointerdown', (event) => {
        if (event.target.classList.contains('sticker-remove') || event.target.classList.contains('sticker-resize') || event.target.classList.contains('sticker-rotate') || event.target.classList.contains('sticker-duplicate') || event.target.classList.contains('sticker-z-control')) {
            return;
        }

        event.preventDefault();
        stickerZIndex += 1;
        stickerElement.style.zIndex = String(stickerZIndex);

        const stageRect = stickerStage.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;
        const originX = state.x;
        const originY = state.y;

        const onPointerMove = (moveEvent) => {
            const nextX = originX + (moveEvent.clientX - startX);
            const nextY = originY + (moveEvent.clientY - startY);

            // Permite posicionar em qualquer lugar sem restrições
            state.x = nextX;
            state.y = nextY;
            updateStickerTransform(stickerElement, state.x, state.y, state.size, state.rotation);
        };

        const onPointerUp = () => {
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    });
}

function bindResizeSticker(stickerElement, resizeButton, state) {
    resizeButton.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const startSize = state.size;
        const startX = event.clientX;
        const startY = event.clientY;

        const onPointerMove = (moveEvent) => {
            const delta = ((moveEvent.clientX - startX) + (moveEvent.clientY - startY)) * 0.5;
            // Permite redimensionar livremente (mínimo de 20px para não ficar invisível)
            state.size = Math.max(20, startSize + delta);
            updateStickerTransform(stickerElement, state.x, state.y, state.size, state.rotation);
        };

        const onPointerUp = () => {
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    });
}

function bindRotateSticker(stickerElement, rotateButton, state) {
    rotateButton.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const rect = stickerElement.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const baseAngle = Math.atan2(event.clientY - cy, event.clientX - cx) * (180 / Math.PI);
        const startRotation = state.rotation;

        const onPointerMove = (moveEvent) => {
            const currentAngle = Math.atan2(moveEvent.clientY - cy, moveEvent.clientX - cx) * (180 / Math.PI);
            state.rotation = startRotation + (currentAngle - baseAngle);
            updateStickerTransform(stickerElement, state.x, state.y, state.size, state.rotation);
        };

        const onPointerUp = () => {
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    });
}

function createPlacedSticker(src, x, y) {
    if (!stickerStage) return;

    const state = {
        x,
        y,
        size: 120,
        rotation: (Math.random() * 14) - 7,
        src
    };

    const wrapper = document.createElement('div');
    wrapper.className = 'sticker-item';
    stickerZIndex += 1;
    wrapper.style.zIndex = String(stickerZIndex);

    const image = document.createElement('img');
    image.src = src;
    image.alt = 'Adesivo';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'sticker-remove';
    removeButton.textContent = 'x';

    const resizeButton = document.createElement('button');
    resizeButton.type = 'button';
    resizeButton.className = 'sticker-resize';
    resizeButton.textContent = '<>';

    const rotateButton = document.createElement('button');
    rotateButton.type = 'button';
    rotateButton.className = 'sticker-rotate';
    rotateButton.textContent = 'o';

    const duplicateButton = document.createElement('button');
    duplicateButton.type = 'button';
    duplicateButton.className = 'sticker-duplicate';
    duplicateButton.textContent = '⊟';
    duplicateButton.title = 'Duplicar adesivo';

    const zBackButton = document.createElement('button');
    zBackButton.type = 'button';
    zBackButton.className = 'sticker-z-control';
    zBackButton.textContent = '↙';
    zBackButton.title = 'Enviar para trás';

    const zFrontButton = document.createElement('button');
    zFrontButton.type = 'button';
    zFrontButton.className = 'sticker-z-control sticker-z-forward';
    zFrontButton.textContent = '↗';
    zFrontButton.title = 'Trazer para frente';

    removeButton.addEventListener('click', () => wrapper.remove());

    duplicateButton.addEventListener('click', () => {
        createPlacedSticker(state.src, state.x + 20, state.y + 20);
    });

    zBackButton.addEventListener('click', () => {
        const allStickers = Array.from(stickerStage.querySelectorAll('.sticker-item'));
        const index = allStickers.indexOf(wrapper);
        if (index > 0) {
            const target = allStickers[index - 1];
            const tmpZ = wrapper.style.zIndex;
            wrapper.style.zIndex = target.style.zIndex;
            target.style.zIndex = tmpZ;
        }
    });

    zFrontButton.addEventListener('click', () => {
        const allStickers = Array.from(stickerStage.querySelectorAll('.sticker-item'));
        const index = allStickers.indexOf(wrapper);
        if (index < allStickers.length - 1) {
            const target = allStickers[index + 1];
            const tmpZ = wrapper.style.zIndex;
            wrapper.style.zIndex = target.style.zIndex;
            target.style.zIndex = tmpZ;
        }
    });

    wrapper.appendChild(image);
    wrapper.appendChild(removeButton);
    wrapper.appendChild(resizeButton);
    wrapper.appendChild(rotateButton);
    wrapper.appendChild(duplicateButton);
    wrapper.appendChild(zBackButton);
    wrapper.appendChild(zFrontButton);

    stickerStage.appendChild(wrapper);
    updateStickerTransform(wrapper, state.x, state.y, state.size, state.rotation);

    bindMoveSticker(wrapper, state);
    bindResizeSticker(wrapper, resizeButton, state);
    bindRotateSticker(wrapper, rotateButton, state);
    bindTwoFingerResize(wrapper, state);
}

function applyWhiteBorder(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const size = Math.max(img.width, img.height) + 20;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);

            ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
            ctx.shadowBlur = 14;

            const x = (size - img.width) / 2;
            const y = (size - img.height) / 2;
            ctx.drawImage(img, x, y);

            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(x - 2, y - 2, img.width + 4, img.height + 4);

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(src);
        img.src = src;
    });
}

function bindTwoFingerResize(stickerElement, state) {
    let touchStartDistance = 0;
    let touchStartSize = 0;

    stickerElement.addEventListener('touchstart', (event) => {
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            touchStartDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
            touchStartSize = state.size;
        }
    });

    stickerElement.addEventListener('touchmove', (event) => {
        if (event.touches.length === 2) {
            event.preventDefault();
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
            const delta = currentDistance - touchStartDistance;
            // Permite redimensionar livremente no touch (mínimo de 20px)
            state.size = Math.max(20, touchStartSize + delta);
            updateStickerTransform(stickerElement, state.x, state.y, state.size, state.rotation);
        }
    });
}

function initImageImport() {
    const importButton = document.getElementById('stickerImportButton');
    const importInput = document.getElementById('stickerImportInput');

    if (!importButton || !importInput) return;

    importButton.addEventListener('click', () => importInput.click());

    importInput.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const src = e.target.result;
            const srcWithBorder = await applyWhiteBorder(src);
            createCatalogDrag({ src: srcWithBorder, name: 'Imagem importada' }, { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
        };
        reader.readAsDataURL(file);

        importInput.value = '';
    });
}

function initSearch() {
    if (!stickerSearchInput) return;

    stickerSearchInput.addEventListener('input', (event) => {
        searchQuery = event.target.value;
        renderCatalog();
        renderFavorites();
    });
}

function initViewTabs() {
    if (!stickerViewTabs) return;

    stickerViewTabs.querySelectorAll('.sticker-view-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            const view = tab.dataset.view;
            currentView = view;

            stickerViewTabs.querySelectorAll('.sticker-view-tab').forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');

            stickerCategoryChips.style.display = view === 'catalog' ? 'flex' : 'none';
            stickerCatalog.style.display = view === 'catalog' ? 'grid' : 'none';
            stickerFavorites.style.display = view === 'favorites' ? 'grid' : 'none';
        });
    });
}

async function initStickerSystem() {
    if (!stickerToggleButton || !stickerPanel || !stickerCatalog || !stickerStage) return;

    loadCustomStickers();

    // Load favorites from API
    if (typeof QDApi !== 'undefined' && QDApi.isAuthenticated) {
        await loadFavoritesFromAPI();
    }

    renderCategoryChips();
    renderCatalog();
    renderFavorites();
    initSearch();
    initViewTabs();

    // O painel lateral agora exibe apenas favoritos.
    currentView = 'favorites';
    if (stickerViewTabs) stickerViewTabs.style.display = 'none';
    if (stickerCategoryChips) stickerCategoryChips.style.display = 'none';
    if (stickerCatalog) stickerCatalog.style.display = 'none';
    if (stickerFavorites) stickerFavorites.style.display = 'grid';
    if (stickerPanelSubtitle) stickerPanelSubtitle.textContent = 'Apenas favoritos. Gerencie tudo na pagina Adesivos.';
    if (stickerSearchInput) stickerSearchInput.placeholder = 'Buscar nos favoritos...';
    const stickerImportButton = document.getElementById('stickerImportButton');
    const stickerImportInput = document.getElementById('stickerImportInput');
    if (stickerImportButton) {
        stickerImportButton.textContent = 'Abrir pagina Adesivos';
        stickerImportButton.addEventListener('click', () => {
            window.location.href = 'adesivos.html';
        });
    }
    if (stickerImportInput) {
        stickerImportInput.style.display = 'none';
    }

    stickerToggleButton.addEventListener('click', () => {
        const isOpen = stickerPanel.classList.contains('open');
        setPanelOpen(!isOpen);
    });

    if (stickerPanelClose) {
        stickerPanelClose.addEventListener('click', () => setPanelOpen(false));
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setPanelOpen(false);
        }
    });
}

initStickerSystem();

window.QDStickerCatalog = {
    getStickerCollections,
    getCustomStickers,
    loadCustomStickers,
    addCustomSticker,
    removeCustomSticker,
    getFavorites,
    loadFavoritesFromAPI,
    toggleFavorite,
    getItemKey,
    getCatalogSource,
    refresh() {
        renderCategoryChips();
        renderCatalog();
        renderFavorites();
    }
};
