const drawingToggleButton = document.getElementById('drawingToggleButton');
const drawingPanel = document.getElementById('drawingPanel');
const drawingPanelClose = document.getElementById('drawingPanelClose');
const drawingCanvas = document.getElementById('drawingCanvas');
const drawingClearBtn = document.getElementById('drawingClearBtn');
const drawingUndoBtn = document.getElementById('drawingUndoBtn');
const drawingSizeSlider = document.getElementById('drawingSize');
const drawingSizeValue = document.getElementById('drawingSizeValue');
const drawingOpacitySlider = document.getElementById('drawingOpacity');
const drawingOpacityValue = document.getElementById('drawingOpacityValue');

let isDrawing = false;
let currentTool = 'pen';
let currentColor = '#000000';
let currentSize = 3;
let currentOpacity = 1;
let lastX = 0;
let lastY = 0;
let lastVelocity = 0;
let drawingHistory = [];
const maxHistorySteps = 50;

const toolConfigs = {
    pen: {
        name: 'Caneta',
        minSize: 0.5,
        maxSize: 4,
        default: 2,
        opacity: 1,
        hardness: 1,
        smoothness: 0.3
    },
    marker: {
        name: 'Marcador',
        minSize: 3,
        maxSize: 12,
        default: 6,
        opacity: 0.7,
        hardness: 0.6,
        smoothness: 0.5
    },
    brush: {
        name: 'Pincel',
        minSize: 4,
        maxSize: 20,
        default: 8,
        opacity: 0.8,
        hardness: 0.4,
        smoothness: 0.7
    },
    pencil: {
        name: 'Lápis',
        minSize: 1,
        maxSize: 6,
        default: 1.5,
        opacity: 0.9,
        hardness: 0.9,
        smoothness: 0.2
    },
    highlighter: {
        name: 'Marca-texto',
        minSize: 8,
        maxSize: 20,
        default: 12,
        opacity: 0.4,
        hardness: 0.3,
        smoothness: 0.6
    }
};

function initDrawing() {
    if (!drawingCanvas) return;

    const diaryChat = document.querySelector('.diary-chat');
    if (!diaryChat) return;

    const rect = diaryChat.getBoundingClientRect();
    drawingCanvas.width = diaryChat.offsetWidth;
    drawingCanvas.height = diaryChat.offsetHeight;

    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const diaryChat = document.querySelector('.diary-chat');
    if (!diaryChat || !drawingCanvas) return;

    const imageData = drawingCanvas.toDataURL();
    drawingCanvas.width = diaryChat.offsetWidth;
    drawingCanvas.height = diaryChat.offsetHeight;

    const img = new Image();
    img.onload = () => {
        const ctx = drawingCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
    };
    img.src = imageData;
}

function getCanvasContext() {
    if (!drawingCanvas) return null;
    return drawingCanvas.getContext('2d');
}

function saveToHistory() {
    const ctx = getCanvasContext();
    if (!ctx) return;

    if (drawingHistory.length >= maxHistorySteps) {
        drawingHistory.shift();
    }

    drawingHistory.push(drawingCanvas.toDataURL());

    saveDrawingToStorage();
}

let _drawingSaveTimeout = null;

function saveDrawingToStorage() {
    try {
        const canvasData = drawingCanvas.toDataURL('image/png');
        clearTimeout(_drawingSaveTimeout);
        _drawingSaveTimeout = setTimeout(async () => {
            try { await QDApi.updateDrawing(canvasData); } catch (e) { console.warn('Could not save drawing to API', e); }
        }, 800);
    } catch (e) {
        console.warn('Could not save drawing');
    }
}

async function loadDrawingFromStorage() {
    try {
        const data = await QDApi.getDrawing();
        if (data && data.dataUrl) {
            const img = new Image();
            img.onload = () => {
                const ctx = getCanvasContext();
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    saveToHistory();
                }
            };
            img.src = data.dataUrl;
        }
    } catch (e) {
        console.warn('Could not load drawing from API');
    }
}

function drawLine(fromX, fromY, toX, toY, size, color, opacity, tool) {
    const ctx = getCanvasContext();
    if (!ctx) return;

    const config = toolConfigs[tool] || toolConfigs.pen;
    const velocity = Math.hypot(toX - fromX, toY - fromY);
    
    let adaptiveSize = size;
    if (config.hardness < 1) {
        const maxVelocity = 50;
        const velocityFactor = Math.min(velocity / maxVelocity, 1);
        adaptiveSize = size * (0.6 + velocityFactor * 0.4);
    }

    ctx.globalAlpha = opacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = adaptiveSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (config.smoothness > 0.5) {
        ctx.shadowColor = `rgba(0, 0, 0, ${0.05 * config.hardness})`;
        ctx.shadowBlur = adaptiveSize * 0.5;
    }

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}

function drawDot(x, y, size, color, opacity, tool) {
    const ctx = getCanvasContext();
    if (!ctx) return;

    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function startDrawing(e) {
    if (!drawingCanvas.classList.contains('active')) return;

    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawing = true;
    lastX = x;
    lastY = y;

    drawDot(x, y, currentSize, currentColor, currentOpacity, currentTool);
    saveToHistory();
}

function draw(e) {
    if (!isDrawing || !drawingCanvas.classList.contains('active')) return;

    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawLine(lastX, lastY, x, y, currentSize, currentColor, currentOpacity, currentTool);

    lastX = x;
    lastY = y;
}

function stopDrawing(e) {
    if (!isDrawing) return;

    isDrawing = false;
    saveToHistory();
    saveDrawingToStorage();
}

function clearDrawing() {
    if (!drawingCanvas || !confirm('Tem certeza que quer limpar todo o desenho?')) return;

    const ctx = getCanvasContext();
    if (ctx) {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    }

    drawingHistory = [];
    QDApi.updateDrawing('').catch(() => {});
}

function undoDrawing() {
    if (drawingHistory.length <= 1) return;

    drawingHistory.pop();

    const ctx = getCanvasContext();
    if (!ctx) return;

    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

    if (drawingHistory.length > 0) {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            saveDrawingToStorage();
        };
        img.src = drawingHistory[drawingHistory.length - 1];
    } else {
        QDApi.updateDrawing('').catch(() => {});
    }
}

function toggleDrawingMode() {
    const isCurrentlyActive = drawingCanvas.classList.contains('active');

    if (isCurrentlyActive) {
        closeDrawingMode();
    } else {
        openDrawingMode();
    }
}

function openDrawingMode() {
    if (!drawingCanvas || !drawingPanel) return;

    // Fechar outros painéis
    const chatPanel = document.getElementById('chatPanel');
    const stickerPanel = document.getElementById('stickerPanel');
    if (chatPanel) chatPanel.classList.remove('open');
    if (stickerPanel) stickerPanel.classList.remove('open');

    drawingCanvas.classList.add('active');
    drawingPanel.classList.add('open');
    drawingToggleButton.classList.add('active');
    drawingCanvas.setAttribute('aria-hidden', 'false');
    drawingPanel.setAttribute('aria-hidden', 'false');

    resizeCanvas();
    loadDrawingFromStorage();
    
    // Atualizar overlay
    if (typeof updateOverlay === 'function') {
        updateOverlay();
    }
}

function closeDrawingMode() {
    if (!drawingCanvas || !drawingPanel) return;

    drawingCanvas.classList.remove('active');
    drawingPanel.classList.remove('open');
    drawingToggleButton.classList.remove('active');
    drawingCanvas.setAttribute('aria-hidden', 'true');
    drawingPanel.setAttribute('aria-hidden', 'true');

    isDrawing = false;
    
    // Atualizar overlay
    if (typeof updateOverlay === 'function') {
        updateOverlay();
    }
}

function initToolButtons() {
    const toolsContainer = document.getElementById('drawingToolsContainer');
    if (!toolsContainer) return;

    toolsContainer.querySelectorAll('.drawing-tool-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            toolsContainer.querySelectorAll('.drawing-tool-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
        });
    });
}

function initColorButtons() {
    const colorsContainer = document.getElementById('drawingColorsContainer');
    if (!colorsContainer) return;

    colorsContainer.querySelectorAll('.drawing-color-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            colorsContainer.querySelectorAll('.drawing-color-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            currentColor = btn.dataset.color;
        });
    });
}

function initSliders() {
    if (drawingSizeSlider) {
        drawingSizeSlider.addEventListener('input', (e) => {
            currentSize = parseFloat(e.target.value);
            drawingSizeValue.textContent = currentSize.toFixed(1) + 'px';
        });
    }

    if (drawingOpacitySlider) {
        drawingOpacitySlider.addEventListener('input', (e) => {
            currentOpacity = parseFloat(e.target.value);
            drawingOpacityValue.textContent = Math.round(currentOpacity * 100) + '%';
        });
    }
}

function initDrawingPanel() {
    if (drawingToggleButton) {
        drawingToggleButton.addEventListener('click', toggleDrawingMode);
    }

    if (drawingPanelClose) {
        drawingPanelClose.addEventListener('click', closeDrawingMode);
    }

    if (drawingClearBtn) {
        drawingClearBtn.addEventListener('click', clearDrawing);
    }

    if (drawingUndoBtn) {
        drawingUndoBtn.addEventListener('click', undoDrawing);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawingCanvas.classList.contains('active')) {
            closeDrawingMode();
        }
        if (e.ctrlKey && e.key === 'z' && drawingCanvas.classList.contains('active')) {
            e.preventDefault();
            undoDrawing();
        }
    });
}

function initCanvasEvents() {
    if (!drawingCanvas) return;

    drawingCanvas.addEventListener('pointerdown', startDrawing, false);
    drawingCanvas.addEventListener('pointermove', draw, false);
    drawingCanvas.addEventListener('pointerup', stopDrawing, false);
    drawingCanvas.addEventListener('pointerout', stopDrawing, false);
    
    drawingCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrawing(e.touches[0]);
    }, false);

    drawingCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        draw(e.touches[0]);
    }, false);

    drawingCanvas.addEventListener('touchend', stopDrawing, false);
}

function initDrawingSystem() {
    initDrawing();
    initCanvasEvents();
    initDrawingPanel();
    initToolButtons();
    initColorButtons();
    initSliders();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDrawingSystem);
} else {
    initDrawingSystem();
}
