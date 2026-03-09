const isLocalDevHost = ['localhost', '127.0.0.1'].includes(location.hostname);

if ('serviceWorker' in navigator && location.protocol !== 'file:' && !isLocalDevHost) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch((error) => {
            console.error('Falha ao registrar service worker:', error);
        });
    });
}

const menuButton = document.getElementById('menuButton');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

function toggleMenu() {
    sidebar.classList.toggle('open');
    menuButton.classList.toggle('active');
    // O overlay para menu será controlado separadamente
    const hasOpenPanel = document.querySelector('.chat-panel.open, .drawing-panel.open, .sticker-panel.open');
    if (sidebar.classList.contains('open')) {
        overlay.classList.add('active');
    } else if (!hasOpenPanel) {
        overlay.classList.remove('active');
    }
}

if (menuButton && sidebar && overlay) {
    menuButton.addEventListener('click', toggleMenu);
}

// Gerenciamento centralizado de painéis
function closeAllPanels() {
    const panels = document.querySelectorAll('.chat-panel, .drawing-panel, .sticker-panel');
    panels.forEach(panel => panel.classList.remove('open'));
}

function updateOverlay() {
    const hasOpenPanel = document.querySelector('.chat-panel.open, .drawing-panel.open, .sticker-panel.open');
    const isSidebarOpen = sidebar.classList.contains('open');
    if (hasOpenPanel || isSidebarOpen) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

// Fechar painéis ao clicar no overlay (exceto se for menu sidebar)
if (overlay) {
    overlay.addEventListener('click', () => {
        const isSidebarOpen = sidebar && sidebar.classList.contains('open');
        if (isSidebarOpen) {
            toggleMenu();
        } else {
            closeAllPanels();
            updateOverlay();
        }
    });
}

const authTabs = document.querySelectorAll('[data-auth-target]');
const authForms = document.querySelectorAll('[data-auth-form]');

if (authTabs.length && authForms.length) {
    authTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.authTarget;

            authTabs.forEach((item) => item.classList.remove('active'));
            authForms.forEach((form) => form.classList.remove('active'));

            tab.classList.add('active');

            const targetForm = document.querySelector(`[data-auth-form="${target}"]`);
            if (targetForm) {
                targetForm.classList.add('active');
            }
        });
    });
}

const profilePhotoInput = document.getElementById('profilePhotoInput');
const profilePhotoPreview = document.getElementById('profilePhotoPreview');
const photoPlaceholder = document.getElementById('photoPlaceholder');
const profileUsername = document.getElementById('profileUsername');
const profileUsernameInput = document.getElementById('profileUsernameInput');
const profileRealNameInput = document.getElementById('profileRealNameInput');
const identityNotesInput = document.getElementById('identityNotesInput');
const responsePromptInput = document.getElementById('responsePromptInput');
const synthesisPromptInput = document.getElementById('synthesisPromptInput');
const saveIdentityButton = document.getElementById('saveIdentityButton');
const profileStatus = document.getElementById('profileStatus');
let _profileCache = null;
let _profilePromise = null; // Lock to prevent race conditions
const profileStore = window.QDProfileStore || null;

function normalizeUsername(value) {
    if (profileStore?.normalizeUsername) {
        return profileStore.normalizeUsername(value);
    }
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    return trimmed.startsWith('@') ? trimmed.slice(1).trim() : trimmed;
}

function getSessionUsername() {
    if (profileStore?.getSessionUsername) {
        return profileStore.getSessionUsername();
    }
    return normalizeUsername(QDApi?.user?.username);
}

function resolveProfileUsername(settings = {}) {
    if (profileStore?.resolveDisplayName) {
        return profileStore.resolveDisplayName(settings, { username: getSessionUsername() }) || 'Seu nome';
    }
    return normalizeUsername(settings.username)
        || normalizeUsername(settings.displayName)
        || getSessionUsername()
        || 'Seu nome';
}

function getDefaultProfileSettings() {
    if (profileStore?.getDefaultProfile) {
        return profileStore.getDefaultProfile();
    }
    const username = getSessionUsername() || 'Seu nome';
    return {
        username,
        realName: '',
        identityNotes: '',
        responsePrompt: '',
        synthesisPrompt: '',
        photoDataUrl: '',
        displayName: username
    };
}

async function loadProfileSettingsAsync() {
    // Return cached value if available
    if (_profileCache) return _profileCache;
    
    // If already loading, wait for existing promise (prevents race condition)
    if (_profilePromise) return _profilePromise;
    
    // Create loading promise
    _profilePromise = (async () => {
        if (profileStore?.loadProfile) {
            _profileCache = await profileStore.loadProfile();
            return _profileCache;
        }
        try {
            const data = await QDApi.getProfile();
            const resolvedUsername = resolveProfileUsername({
                username: data.username,
                displayName: data.displayName
            });
            _profileCache = {
                username: resolvedUsername,
                realName: data.realName || '',
                displayName: resolvedUsername,
                identityNotes: data.identityNotes || '',
                responsePrompt: data.responsePrompt || '',
                synthesisPrompt: data.synthesisPrompt || '',
                photoDataUrl: data.photoDataUrl || ''
            };
            return _profileCache;
        } catch (err) {
            console.error('Failed to load profile:', err);
            return getDefaultProfileSettings();
        } finally {
            _profilePromise = null; // Clear lock
        }
    })();
    
    return _profilePromise;
}

async function saveProfileSettings(settings) {
    if (profileStore?.saveProfile) {
        const saved = await profileStore.saveProfile(settings);
        _profileCache = saved;
        return;
    }
    const resolvedUsername = resolveProfileUsername(settings);
    settings.username = resolvedUsername;
    settings.displayName = resolvedUsername;
    _profileCache = settings;
    try {
        await QDApi.updateProfile({
            displayName: resolvedUsername,
            realName: settings.realName || '',
            identityNotes: settings.identityNotes || '',
            responsePrompt: settings.responsePrompt || '',
            synthesisPrompt: settings.synthesisPrompt || '',
            photoDataUrl: settings.photoDataUrl || ''
        });
    } catch (e) { console.error('Erro ao salvar perfil:', e); }
}

function applyProfileDataToView(settings) {
    const resolvedUsername = resolveProfileUsername(settings);
    if (profileUsername) {
        profileUsername.textContent = resolvedUsername;
    }

    if (profileUsernameInput) {
        profileUsernameInput.value = resolvedUsername;
    }

    if (profileRealNameInput) {
        profileRealNameInput.value = settings.realName || '';
    }

    if (identityNotesInput) {
        identityNotesInput.value = settings.identityNotes || '';
    }

    if (responsePromptInput) {
        responsePromptInput.value = settings.responsePrompt || '';
    }

    if (synthesisPromptInput) {
        synthesisPromptInput.value = settings.synthesisPrompt || '';
    }

    if (profilePhotoPreview && photoPlaceholder) {
        if (settings.photoDataUrl) {
            profilePhotoPreview.src = settings.photoDataUrl;
            profilePhotoPreview.style.display = 'block';
            photoPlaceholder.style.display = 'none';
        } else {
            profilePhotoPreview.removeAttribute('src');
            profilePhotoPreview.style.display = 'none';
            photoPlaceholder.style.display = 'block';
        }
    }
}

if (profilePhotoInput && profilePhotoPreview && photoPlaceholder) {
    if (profileUsername) profileUsername.textContent = 'Carregando seu nome...';
    if (profileUsernameInput) profileUsernameInput.placeholder = 'Carregando seu nome...';

    (async () => {
        const initialSettings = await loadProfileSettingsAsync();
        applyProfileDataToView(initialSettings);
    })();

    profilePhotoInput.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            profilePhotoPreview.src = reader.result;
            profilePhotoPreview.style.display = 'block';
            photoPlaceholder.style.display = 'none';

            const settings = _profileCache || getDefaultProfileSettings();
            settings.photoDataUrl = reader.result;
            await saveProfileSettings(settings);

            if (profileStatus) profileStatus.textContent = 'Foto atualizada com sucesso.';
        };
        reader.readAsDataURL(file);
    });

    if (saveIdentityButton) {
        saveIdentityButton.addEventListener('click', async () => {
            const settings = _profileCache || getDefaultProfileSettings();
            const usernameValue = (profileUsernameInput?.value || '').trim();
            const realNameValue = (profileRealNameInput?.value || '').trim();

            const resolvedUsername = normalizeUsername(usernameValue)
                || resolveProfileUsername(settings)
                || getSessionUsername()
                || 'Seu nome';

            settings.username = resolvedUsername;
            settings.displayName = resolvedUsername;
            settings.realName = realNameValue;
            settings.identityNotes = (identityNotesInput?.value || '').trim();
            settings.responsePrompt = (responsePromptInput?.value || '').trim();
            settings.synthesisPrompt = (synthesisPromptInput?.value || '').trim();

            await saveProfileSettings(settings);
            applyProfileDataToView(settings);

            if (profileStatus) profileStatus.textContent = 'Identidade e prompts atualizados.';
        });
    }
}

const notesBoard = document.getElementById('notesBoard');
const addNoteButton = document.getElementById('addNoteButton');
const noteColorSelect = document.getElementById('noteColorSelect');
const notesStorageKey = 'qd_web_sticky_notes_v1';
let highestNoteZIndex = 1;

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function saveStickyNotes() {
    if (!notesBoard) {
        return;
    }

    const notes = Array.from(notesBoard.querySelectorAll('.sticky-note')).map((note) => {
        const textarea = note.querySelector('.note-text');
        return {
            id: note.dataset.noteId,
            text: textarea ? textarea.value : '',
            color: note.dataset.color || '#fff7a8',
            left: parseInt(note.style.left || '0', 10),
            top: parseInt(note.style.top || '0', 10),
            zIndex: parseInt(note.style.zIndex || '1', 10)
        };
    });

    localStorage.setItem(notesStorageKey, JSON.stringify(notes));
}

function bringNoteToFront(noteElement) {
    highestNoteZIndex += 1;
    noteElement.style.zIndex = String(highestNoteZIndex);
}

/* ========== SISTEMA DE PAPÉIS ========== */

let _paperCache = null;

function getDefaultPaperSettings() {
    return { paperType: 'paper-lined', accentColor: '#ff6b6b' };
}

async function loadPaperSettingsAsync() {
    if (_paperCache) return _paperCache;
    try {
        const data = await QDApi.getPaperSettings();
        _paperCache = { paperType: data.paperType || 'paper-lined', accentColor: data.accentColor || '#ff6b6b' };
        return _paperCache;
    } catch { return getDefaultPaperSettings(); }
}

async function savePaperSettings(settings) {
    _paperCache = settings;
    try { await QDApi.updatePaperSettings(settings); } catch (e) { console.error(e); }
}

function applyPaperTheme(settings) {
    const notebookPages = document.querySelectorAll('.notebook-page');
    
    notebookPages.forEach((page) => {
        // Remove all paper types
        ['paper-lined', 'paper-dotted', 'paper-aged', 'paper-letter', 'paper-kraft', 'paper-floral', 'paper-vintage', 'paper-minimalist'].forEach((paperClass) => {
            page.classList.remove(paperClass);
        });
        
        // Apply new paper type
        page.classList.add(settings.paperType);
    });

    // Apply accent color to elements that should use it
    const accentElementSelectors = ['#stickerToggleButton', '.new-chat-button', '.send-button', '.synthesize-button', '.profile-save-button', '.sticker-chip.active', '.sticker-view-tab.active', '.sticker-favorite-button.favorited'];
    
    const style = document.getElementById('paper-accent-style') || document.createElement('style');
    style.id = 'paper-accent-style';
    style.textContent = `
        :root {
            --paper-accent: ${settings.accentColor};
        }
        #stickerToggleButton {
            background: linear-gradient(145deg, ${settings.accentColor}22 0%, ${settings.accentColor}11 100%) !important;
            color: ${settings.accentColor} !important;
            box-shadow: 0 8px 22px ${settings.accentColor}2d !important;
        }
        .new-chat-button {
            background: linear-gradient(135deg, ${settings.accentColor} 0%, ${settings.accentColor}dd 45%, ${settings.accentColor}bb 100%) !important;
        }
        .send-button, .synthesize-button, .profile-save-button, .sticker-import-button {
            background: ${settings.accentColor} !important;
        }
        .send-button:hover, .synthesize-button:hover, .profile-save-button:hover {
            background: ${adjustColorBrightness(settings.accentColor, -20)} !important;
        }
        .sticker-chip.active, .sticker-view-tab.active {
            border-color: ${settings.accentColor} !important;
            color: ${settings.accentColor} !important;
            background: ${settings.accentColor}22 !important;
        }
        .sticker-favorite-button {
            color: ${settings.accentColor} !important;
        }
        .auth-tab.active {
            background: ${settings.accentColor} !important;
            border-color: ${settings.accentColor} !important;
        }
        .message-input:focus, .profile-input:focus, .profile-textarea:focus {
            outline: 2px solid ${settings.accentColor}33 !important;
            border-color: ${settings.accentColor} !important;
        }
    `;
    
    if (!document.head.querySelector('#paper-accent-style')) {
        document.head.appendChild(style);
    } else {
        document.head.querySelector('#paper-accent-style').textContent = style.textContent;
    }
}

function adjustColorBrightness(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return "#" + [R, G, B].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join('').toUpperCase();
}

async function initPaperSettings() {
    // Apply defaults first for instant UI
    const defaults = getDefaultPaperSettings();
    applyPaperTheme(defaults);

    // Then load from API
    let paperSettings;
    if (typeof QDApi !== 'undefined' && QDApi.isAuthenticated) {
        paperSettings = await loadPaperSettingsAsync();
    } else {
        paperSettings = defaults;
    }
    applyPaperTheme(paperSettings);

    const paperTypesContainer = document.getElementById('paperTypesContainer');
    const paperColorsContainer = document.getElementById('paperColorsContainer');

    if (paperTypesContainer) {
        paperTypesContainer.querySelectorAll('.paper-option-button').forEach((btn) => {
            if (btn.dataset.paper === paperSettings.paperType) btn.classList.add('active');
            btn.addEventListener('click', async () => {
                paperTypesContainer.querySelectorAll('.paper-option-button').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                paperSettings.paperType = btn.dataset.paper;
                await savePaperSettings(paperSettings);
                applyPaperTheme(paperSettings);
            });
        });
    }

    if (paperColorsContainer) {
        paperColorsContainer.querySelectorAll('.paper-color-button').forEach((btn) => {
            if (btn.dataset.color === paperSettings.accentColor) btn.classList.add('active');
            btn.addEventListener('click', async () => {
                paperColorsContainer.querySelectorAll('.paper-color-button').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                paperSettings.accentColor = btn.dataset.color;
                await savePaperSettings(paperSettings);
                applyPaperTheme(paperSettings);
            });
        });
    }
}

// Initialize paper settings on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPaperSettings);
} else {
    initPaperSettings();
}

/* ========== SISTEMA DE GERENCIAMENTO DE FONTES ========== */

let _fontCache = null;

const fontMappings = {
    caveat: 'Caveat',
    'indie-flower': 'Indie Flower',
    'dancing-script': 'Dancing Script',
    literata: 'Literata',
    montserrat: 'Montserrat'
};

function getDefaultFontSettings() {
    return { primaryFont: 'caveat', mode: 'mixed' };
}

async function loadFontSettingsAsync() {
    if (_fontCache) return _fontCache;
    try {
        const data = await QDApi.getFontSettings();
        _fontCache = { primaryFont: data.primaryFont || 'caveat', mode: data.mode || 'mixed' };
        return _fontCache;
    } catch { return getDefaultFontSettings(); }
}

async function saveFontSettings(settings) {
    _fontCache = settings;
    try { await QDApi.updateFontSettings(settings); } catch (e) { console.error(e); }
}

function applyFontTheme(settings) {
    const fontFamily = fontMappings[settings.primaryFont];
    if (!fontFamily) return;

    document.documentElement.style.setProperty('--font-primary', `'${fontFamily}', cursive`);

    if (settings.mode === 'handwriting') {
        document.documentElement.style.setProperty('--font-sans', `'Indie Flower', cursive`);
    } else if (settings.mode === 'formal') {
        document.documentElement.style.setProperty('--font-sans', `'Montserrat', sans-serif`);
    } else {
        document.documentElement.style.setProperty('--font-sans', `'Montserrat', sans-serif`);
    }
}

async function initFontSettings() {
    const defaults = getDefaultFontSettings();
    applyFontTheme(defaults);

    let fontSettings;
    if (typeof QDApi !== 'undefined' && QDApi.isAuthenticated) {
        fontSettings = await loadFontSettingsAsync();
    } else {
        fontSettings = defaults;
    }
    applyFontTheme(fontSettings);

    const fontStylesContainer = document.getElementById('fontStylesContainer');
    const fontModesContainer = document.getElementById('fontModesContainer');

    if (fontStylesContainer) {
        fontStylesContainer.querySelectorAll('.font-option-button').forEach((btn) => {
            if (btn.dataset.font === fontSettings.primaryFont) btn.classList.add('active');
            btn.addEventListener('click', async () => {
                fontStylesContainer.querySelectorAll('.font-option-button').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                fontSettings.primaryFont = btn.dataset.font;
                await saveFontSettings(fontSettings);
                applyFontTheme(fontSettings);
            });
        });
    }

    if (fontModesContainer) {
        fontModesContainer.querySelectorAll('input[name="fontMode"]').forEach((radio) => {
            if (radio.value === fontSettings.mode) radio.checked = true;
            radio.addEventListener('change', async () => {
                fontSettings.mode = radio.value;
                await saveFontSettings(fontSettings);
                applyFontTheme(fontSettings);
            });
        });
    }
}

// Initialize font settings on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFontSettings);
} else {
    initFontSettings();
}

function createStickyNote(noteData) {
    if (!notesBoard) {
        return;
    }

    const boardRect = notesBoard.getBoundingClientRect();
    const noteWidth = window.innerWidth <= 640 ? 190 : 220;
    const noteHeight = window.innerWidth <= 640 ? 170 : 190;

    const noteElement = document.createElement('article');
    noteElement.className = 'sticky-note';
    noteElement.dataset.noteId = noteData.id;
    noteElement.dataset.color = noteData.color;
    noteElement.style.backgroundColor = noteData.color;

    const initialLeft = clamp(noteData.left, 0, Math.max(0, boardRect.width - noteWidth));
    const initialTop = clamp(noteData.top, 0, Math.max(0, boardRect.height - noteHeight));
    noteElement.style.left = `${initialLeft}px`;
    noteElement.style.top = `${initialTop}px`;

    if (noteData.zIndex > highestNoteZIndex) {
        highestNoteZIndex = noteData.zIndex;
    }
    noteElement.style.zIndex = String(noteData.zIndex);

    noteElement.innerHTML = `
        <header class="note-header">
            <span class="note-grip">Arraste</span>
            <button type="button" class="note-delete" aria-label="Excluir nota">x</button>
        </header>
        <textarea class="note-text" placeholder="Escreva aqui...">${noteData.text}</textarea>
    `;

    const header = noteElement.querySelector('.note-header');
    const deleteButton = noteElement.querySelector('.note-delete');
    const textarea = noteElement.querySelector('.note-text');

    function startDrag(event) {
        const pointerX = event.clientX;
        const pointerY = event.clientY;
        const noteRect = noteElement.getBoundingClientRect();
        const boardBounds = notesBoard.getBoundingClientRect();
        const offsetX = pointerX - noteRect.left;
        const offsetY = pointerY - noteRect.top;

        bringNoteToFront(noteElement);

        function onMove(moveEvent) {
            const maxLeft = Math.max(0, boardBounds.width - noteRect.width);
            const maxTop = Math.max(0, boardBounds.height - noteRect.height);
            const nextLeft = clamp(moveEvent.clientX - boardBounds.left - offsetX, 0, maxLeft);
            const nextTop = clamp(moveEvent.clientY - boardBounds.top - offsetY, 0, maxTop);

            noteElement.style.left = `${nextLeft}px`;
            noteElement.style.top = `${nextTop}px`;
        }

        function onUp() {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            saveStickyNotes();
        }

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }

    if (header) {
        header.addEventListener('pointerdown', startDrag);
    }

    noteElement.addEventListener('pointerdown', () => {
        bringNoteToFront(noteElement);
        saveStickyNotes();
    });

    if (textarea) {
        textarea.addEventListener('input', saveStickyNotes);
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            const noteId = noteElement.dataset.noteId;
            noteElement.remove();
            try { await QDApi.deleteNote(noteId); } catch (e) { console.error(e); }
        });
    }

    notesBoard.appendChild(noteElement);
}

if (notesBoard && addNoteButton && noteColorSelect) {
    let noteCounter = Date.now();

    // Load notes from API
    (async () => {
        if (typeof QDApi === 'undefined' || !QDApi.isAuthenticated) return;
        try {
            const storedNotes = await QDApi.getNotes();
            if (Array.isArray(storedNotes) && storedNotes.length) {
                storedNotes.forEach((item) => {
                    createStickyNote({
                        id: item.id || `note-${noteCounter++}`,
                        text: item.text || '',
                        color: item.color || '#fff7a8',
                        left: Number.isFinite(item.left) ? item.left : 20,
                        top: Number.isFinite(item.top) ? item.top : 20,
                        zIndex: Number.isFinite(item.zIndex) ? item.zIndex : 1
                    });
                });
            }
        } catch (e) { console.error('Erro ao carregar notas:', e); }
    })();

    addNoteButton.addEventListener('click', async () => {
        const totalNotes = notesBoard.querySelectorAll('.sticky-note').length;
        const offset = totalNotes * 14;
        const noteData = {
            id: `note-${noteCounter++}`,
            text: '',
            color: noteColorSelect.value,
            left: 24 + offset,
            top: 24 + offset,
            zIndex: highestNoteZIndex + 1
        };
        createStickyNote(noteData);
        try { await QDApi.createNote(noteData); } catch (e) { console.error(e); }
    });
}
