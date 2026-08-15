const MODES = {
  geocolor: { name: "GeoColor", description: "Visual natural de dia e nuvens realçadas à noite.", path: "GOES19/ABI/FD/GEOCOLOR/", suffix: "_GOES19-ABI-FD-GEOCOLOR-1808x1808.jpg" },
  infrared: { name: "Infravermelho", description: "Mostra nuvens frias e tempestades, inclusive durante a noite.", path: "GOES19/ABI/FD/13/", suffix: "_GOES19-ABI-FD-13-1808x1808.jpg" },
  waterVapor: { name: "Vapor d'água", description: "Evidencia a umidade na alta atmosfera e sua circulação.", path: "GOES19/ABI/FD/08/", suffix: "_GOES19-ABI-FD-08-1808x1808.jpg" },
  airMass: { name: "Massas de ar", description: "Combina infravermelho e vapor d'água para destacar frentes.", path: "GOES19/ABI/FD/AirMass/", suffix: "_GOES19-ABI-FD-AirMass-1808x1808.jpg" },
  cloudPhase: { name: "Fase de nuvens", description: "Diferencia a fase do topo das nuvens de dia e nevoeiro à noite.", path: "GOES19/ABI/FD/DayNightCloudMicroCombo/", suffix: "_GOES19-ABI-FD-DayNightCloudMicroCombo-1808x1808.jpg" }
};

const VIEWS = {
  brasil: { name: "Brasil completo", left: 925, right: 1525, top: 730, bottom: 1515, margin: 1.32 },
  norte: { name: "Região Norte", left: 900, right: 1360, top: 680, bottom: 1090, margin: 1.22 },
  nordeste: { name: "Região Nordeste", left: 1230, right: 1570, top: 820, bottom: 1215, margin: 1.22 },
  centroOeste: { name: "Centro-Oeste", left: 1040, right: 1355, top: 980, bottom: 1295, margin: 1.22 },
  sudeste: { name: "Região Sudeste", left: 1220, right: 1480, top: 1120, bottom: 1380, margin: 1.25 },
  sul: { name: "Região Sul", left: 1135, right: 1405, top: 1270, bottom: 1540, margin: 1.25 }
};
const IMAGE_WIDTH = 1808;
const VIDEO_FORMATS = {
  story: { width: 1080, height: 1920, bitrate: 16000000 },
  post: { width: 1080, height: 1350, bitrate: 14000000 },
  square: { width: 1080, height: 1080, bitrate: 12000000 },
  landscape: { width: 1920, height: 1080, bitrate: 18000000 }
};
const $ = (selector) => document.querySelector(selector);
const ui = {
  viewer: $("#viewer"), image: $("#satelliteImage"), loading: $("#loading"), loadingText: $("#loadingText"),
  statusDot: $("#statusDot"), statusText: $("#statusText"), modeSelect: $("#modeSelect"), modeBadge: $("#modeBadge"),
  modeHelp: $("#modeHelp"), sourceNote: $("#sourceNote"), imageTime: $("#imageTime"), frameCounter: $("#frameCounter"),
  speedRange: $("#speedRange"), speedOutput: $("#speedOutput"), playButton: $("#playButton"), playLabel: $("#playLabel"),
  playIcon: $("#playIcon"), previousButton: $("#previousButton"), nextButton: $("#nextButton"), refreshButton: $("#refreshButton"), installButton: $("#installButton"), viewLabel: $("#viewLabel"),
  menuButton: $("#menuButton"), closeMenuButton: $("#closeMenuButton"), sideMenu: $("#sideMenu"), menuBackdrop: $("#menuBackdrop"),
  fullscreenButton: $("#fullscreenButton"), fullscreenLabel: $("#fullscreenLabel"), exitFullscreenButton: $("#exitFullscreenButton"),
  watermark: $("#watermark"), watermarkToggle: $("#watermarkToggle"), videoFormat: $("#videoFormatSelect"), generateVideoButton: $("#generateVideoButton"),
  videoPreview: $("#videoPreview"), videoPreviewPlayer: $("#videoPreviewPlayer"), closeVideoPreview: $("#closeVideoPreview"), shareVideoButton: $("#shareVideoButton"), downloadVideoButton: $("#downloadVideoButton")
};

let currentMode = "geocolor";
let frames = [];
let frameIndex = 0;
let isPlaying = true;
let animationTimer = null;
let requestId = 0;
let installPrompt = null;
let currentView = "brasil";
let fallbackFullscreen = false;
let exporting = false;
let videoPreviewUrl = null;
let videoPreviewBlob = null;
let videoExtension = "webm";

function noaaCode(date) {
  const year = date.getUTCFullYear();
  const day = String(Math.floor((Date.UTC(year, date.getUTCMonth(), date.getUTCDate()) - Date.UTC(year, 0, 0)) / 86400000)).padStart(3, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(Math.floor(date.getUTCMinutes() / 10) * 10).padStart(2, "0");
  return `${year}${day}${hour}${minute}`;
}

function frameUrl(date) {
  const mode = MODES[currentMode];
  return `https://cdn.star.nesdis.noaa.gov/${mode.path}${noaaCode(date)}${mode.suffix}`;
}

function proxyUrl(url) {
  if (!/^https?:$/.test(location.protocol)) return url;
  return `${location.origin}/api/noaa?url=${encodeURIComponent(url)}`;
}

function loadFrameImage(url, cors = false) {
  return new Promise((resolve) => {
    const image = new Image();
    if (cors) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

async function resolveFrameUrl(url) {
  const proxiedUrl = proxyUrl(url);
  const candidates = proxiedUrl === url
    ? [{ url, cors: true, exportable: true }, { url, cors: false, exportable: false }]
    : [{ url: proxiedUrl, cors: true, exportable: true }, { url, cors: true, exportable: true }, { url, cors: false, exportable: false }];
  for (const candidate of candidates) {
    const image = await loadFrameImage(candidate.url, candidate.cors);
    if (image) return { ...candidate, image };
  }
  return null;
}

function formatTime(date) {
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).replace(".", "");
}

function setStatus(text, ready = false) {
  ui.statusText.textContent = text;
  ui.statusDot.classList.toggle("ready", ready);
}

function applyCamera() {
  const width = ui.viewer.clientWidth;
  const height = ui.viewer.clientHeight;
  const camera = VIEWS[currentView];
  const scale = Math.min(width / ((camera.right - camera.left) * camera.margin), height / ((camera.bottom - camera.top) * camera.margin));
  const centerX = (camera.left + camera.right) / 2;
  const centerY = (camera.top + camera.bottom) / 2;
  ui.image.style.width = `${IMAGE_WIDTH * scale}px`;
  ui.image.style.left = `${width / 2 - centerX * scale}px`;
  ui.image.style.top = `${height / 2 - centerY * scale}px`;
}

function showFrame() {
  if (!frames.length) return;
  const frame = frames[frameIndex];
  ui.image.src = frame.url;
  ui.imageTime.textContent = formatTime(frame.date);
  ui.frameCounter.textContent = `${frameIndex + 1} / ${frames.length}`;
}

function nextFrame() { if (frames.length) { frameIndex = (frameIndex + 1) % frames.length; showFrame(); } }
function previousFrame() { if (frames.length) { frameIndex = (frameIndex - 1 + frames.length) % frames.length; showFrame(); } }

function startAnimation() {
  clearInterval(animationTimer);
  if (isPlaying && frames.length) animationTimer = setInterval(nextFrame, Number(ui.speedRange.value));
}

function updatePlayButton() {
  ui.playLabel.textContent = isPlaying ? "Pausar" : "Reproduzir";
  ui.playIcon.innerHTML = isPlaying ? '<path d="M7 5v14M17 5v14"/>' : '<path d="M8 5v14l11-7z"/>';
  ui.playButton.setAttribute("aria-label", isPlaying ? "Pausar animação" : "Reproduzir animação");
}

async function loadFrames() {
  clearInterval(animationTimer);
  const activeRequest = ++requestId;
  frames = []; frameIndex = 0;
  ui.generateVideoButton.disabled = false;
  ui.loading.style.display = "flex";
  setStatus("Procurando imagens recentes...");
  const now = new Date();
  now.setUTCMinutes(now.getUTCMinutes() - 10);

  for (let index = 0; index < 24; index += 1) {
    const date = new Date(now.getTime() - index * 600000);
    const frame = await resolveFrameUrl(frameUrl(date));
    if (activeRequest !== requestId) return;
    if (frame) frames.push({ ...frame, date });
    ui.loadingText.textContent = `Encontrando imagens: ${frames.length}`;
  }

  if (!frames.length) {
    ui.loadingText.textContent = "Nenhuma imagem disponível agora.";
    setStatus("NOAA indisponível no momento.");
    return;
  }

  frames.reverse();
  applyCamera(); showFrame(); startAnimation();
  ui.loading.style.display = "none";
  ui.generateVideoButton.disabled = frames.length < 2;
  setStatus(`Syra-Sat · ${MODES[currentMode].name} atualizado`, true);
}

function changeMode() {
  currentMode = ui.modeSelect.value;
  const mode = MODES[currentMode];
  ui.modeBadge.textContent = mode.name;
  ui.modeHelp.textContent = mode.description;
  ui.sourceNote.textContent = `Orbis · Feito pela @SyraDevOps · Syra-Sat · ${mode.name}`;
  ui.image.alt = `Imagem Syra-Sat sobre o Brasil — ${mode.name}`;
  loadFrames();
}

function setMenu(open) {
  ui.sideMenu.classList.toggle("open", open);
  ui.sideMenu.setAttribute("aria-hidden", String(!open));
  ui.menuButton.setAttribute("aria-expanded", String(open));
  ui.menuBackdrop.hidden = !open;
  document.body.classList.toggle("menu-open", open);
}

function changeView(viewId) {
  if (!VIEWS[viewId]) return;
  currentView = viewId;
  ui.viewLabel.innerHTML = `<i></i>${VIEWS[viewId].name}`;
  ui.sideMenu.querySelectorAll(".view-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewId);
  });
  applyCamera();
  setMenu(false);
}

function nativeFullscreenActive() {
  return document.fullscreenElement === ui.viewer || document.webkitFullscreenElement === ui.viewer;
}

function updateFullscreenButton() {
  const active = nativeFullscreenActive() || fallbackFullscreen;
  ui.fullscreenLabel.textContent = active ? "Sair da tela cheia" : "Tela cheia";
  ui.fullscreenButton.setAttribute("aria-label", ui.fullscreenLabel.textContent);
}

function setWatermark(visible) {
  ui.watermark.hidden = !visible;
  ui.watermarkToggle.checked = visible;
  try { localStorage.setItem("orbis-watermark-visible", String(visible)); } catch (error) { /* armazenamento pode estar bloqueado */ }
}

function setFallbackFullscreen(open) {
  fallbackFullscreen = open;
  ui.viewer.classList.toggle("viewer-fullscreen", open);
  document.body.classList.toggle("viewer-fullscreen-open", open);
  applyCamera();
  updateFullscreenButton();
}

async function toggleFullscreen() {
  if (nativeFullscreenActive() || fallbackFullscreen) {
    exitViewerFullscreen();
    return;
  }
  const request = ui.viewer.requestFullscreen || ui.viewer.webkitRequestFullscreen;
  if (request) {
    try {
      await request.call(ui.viewer);
      return;
    } catch (error) {
      // Alguns navegadores móveis bloqueiam a API; o modo visual abaixo continua funcionando.
    }
  }
  setFallbackFullscreen(true);
}

function exitViewerFullscreen() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (nativeFullscreenActive() && exit) {
    exit.call(document);
    return;
  }
  setFallbackFullscreen(false);
}

function formatVideoTime(date) {
  return `${date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).replace(".", "").toUpperCase()} BRT`;
}

function drawVideoFrame(context, frame, width, height) {
  const camera = VIEWS[currentView];
  const smallSide = Math.min(width, height);
  const pad = Math.round(smallSide * 0.04);
  const topBar = Math.round(smallSide * 0.105);
  const footer = Math.round(smallSide * 0.145);
  const viewport = { x: pad, y: topBar + pad, width: width - pad * 2, height: height - topBar - footer - pad * 2 };
  const frameScale = Math.min(viewport.width / ((camera.right - camera.left) * camera.margin), viewport.height / ((camera.bottom - camera.top) * camera.margin));
  const centerX = (camera.left + camera.right) / 2;
  const centerY = (camera.top + camera.bottom) / 2;
  const imageX = viewport.x + viewport.width / 2 - centerX * frameScale;
  const imageY = viewport.y + viewport.height / 2 - centerY * frameScale;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.save();
  context.beginPath();
  if (context.roundRect) context.roundRect(viewport.x, viewport.y, viewport.width, viewport.height, Math.round(smallSide * 0.018));
  else context.rect(viewport.x, viewport.y, viewport.width, viewport.height);
  context.clip();
  context.drawImage(frame.image, imageX, imageY, IMAGE_WIDTH * frameScale, IMAGE_WIDTH * frameScale);
  context.restore();
  context.strokeStyle = "rgba(0,0,0,.25)";
  context.lineWidth = Math.max(2, Math.round(smallSide * .002));
  context.strokeRect(viewport.x, viewport.y, viewport.width, viewport.height);
  context.fillStyle = "rgba(0,0,0,.95)";
  context.textAlign = "left";
  context.font = `600 ${Math.round(smallSide * .033)}px Georgia, 'Times New Roman', serif`;
  context.fillText(VIEWS[currentView].name, pad, Math.round(topBar * .58));
  context.fillStyle = "rgba(0,0,0,.68)";
  context.font = `${Math.round(smallSide * .018)}px Arial, sans-serif`;
  context.fillText(`SYRA-SAT · ${MODES[currentMode].name.toUpperCase()}`, pad, Math.round(topBar * .82));
  context.fillStyle = "rgba(255,255,255,.96)";
  context.fillRect(0, height - footer, width, footer);
  context.fillStyle = "rgba(0,0,0,.98)";
  context.font = `600 ${Math.round(smallSide * .025)}px Georgia, 'Times New Roman', serif`;
  context.fillText(formatVideoTime(frame.date), pad, height - Math.round(footer * .57));
  context.fillStyle = "rgba(0,0,0,.68)";
  context.font = `${Math.round(smallSide * .017)}px Arial, sans-serif`;
  context.fillText("ATMOSFERA EM MOVIMENTO", pad, height - Math.round(footer * .28));
  context.fillStyle = "rgba(0,0,0,.98)";
  context.textAlign = "right";
  context.font = `600 ${Math.round(smallSide * .041)}px Georgia, 'Times New Roman', serif`;
  context.fillText("ORBIS", width - pad, height - Math.round(footer * .57));
  context.fillStyle = "rgba(0,0,0,.82)";
  context.font = `italic ${Math.round(smallSide * .019)}px Georgia, 'Times New Roman', serif`;
  context.fillText("feito pela @SyraDevOps · @planetariosj", width - pad, height - Math.round(footer * .28));
}

function setVideoExporting(active) {
  exporting = active;
  ui.generateVideoButton.disabled = active || frames.length < 2;
  ui.generateVideoButton.textContent = active ? "Gerando vídeo..." : "Gerar vídeo com marca d’água";
}

function closeVideoPreview() {
  ui.videoPreviewPlayer.pause();
  ui.videoPreview.hidden = true;
  if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
  videoPreviewUrl = null;
  videoPreviewBlob = null;
  ui.videoPreviewPlayer.removeAttribute("src");
}

function downloadVideo() {
  if (!videoPreviewBlob) return;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(videoPreviewBlob);
  link.download = `orbis-${ui.videoFormat.value}-${currentView}-${currentMode}.${videoExtension}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function shareVideo() {
  if (!videoPreviewBlob) return;
  const file = new File([videoPreviewBlob], `orbis-${ui.videoFormat.value}-${currentView}-${currentMode}.${videoExtension}`, { type: videoPreviewBlob.type });
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    try { await navigator.share({ title: "Orbis · Syra-Sat", files: [file] }); return; } catch (error) { if (error.name === "AbortError") return; }
  }
  downloadVideo();
}

function preferredVideoMime() {
  const types = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function generateVideo() {
  const selectedFrames = frames.filter((frame) => frame.exportable);
  if (exporting || !window.MediaRecorder) {
    setStatus("Este navegador não oferece gravação de vídeo.");
    return;
  }
  if (selectedFrames.length < 2) {
    setStatus("Os frames ainda não estão prontos para vídeo. Atualize as imagens e tente novamente.");
    return;
  }
  const mimeType = preferredVideoMime();
  if (!mimeType) { setStatus("Este navegador não oferece gravação de vídeo."); return; }
  setVideoExporting(true);
  await wait(40);
  const profile = VIDEO_FORMATS[ui.videoFormat.value] || VIDEO_FORMATS.story;
  const { width, height } = profile;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const stream = canvas.captureStream(30);
  const chunks = [];
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: profile.bitrate });
  recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
  const finished = new Promise((resolve) => recorder.addEventListener("stop", resolve, { once: true }));
  try {
    recorder.start();
    const chosenFrames = selectedFrames;
    for (let index = 0; index < chosenFrames.length; index += 1) {
      const frame = chosenFrames[index];
      context.clearRect(0, 0, width, height);
      drawVideoFrame(context, frame, width, height);
      ui.generateVideoButton.textContent = `Gerando vídeo ${Math.round(((index + 1) / chosenFrames.length) * 100)}%`;
      stream.getVideoTracks()[0].requestFrame?.();
      await wait(1000);
    }
    recorder.stop();
    await finished;
    stream.getTracks().forEach((track) => track.stop());
    videoPreviewBlob = new Blob(chunks, { type: mimeType });
    videoExtension = mimeType.startsWith("video/mp4") ? "mp4" : "webm";
    videoPreviewUrl = URL.createObjectURL(videoPreviewBlob);
    ui.videoPreviewPlayer.src = videoPreviewUrl;
    ui.videoPreview.hidden = false;
    setVideoExporting(false);
    setStatus(`${videoExtension.toUpperCase()} pronto para compartilhar`, true);
  } catch (error) {
    console.error(error);
    if (recorder.state !== "inactive") recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    setVideoExporting(false);
    setStatus("Não foi possível criar o vídeo. Atualize as imagens e tente novamente.");
  }
}

ui.modeSelect.addEventListener("change", changeMode);
ui.speedRange.addEventListener("input", () => { ui.speedOutput.textContent = `${ui.speedRange.value} ms`; startAnimation(); });
ui.previousButton.addEventListener("click", previousFrame);
ui.nextButton.addEventListener("click", nextFrame);
ui.refreshButton.addEventListener("click", loadFrames);
ui.playButton.addEventListener("click", () => { isPlaying = !isPlaying; updatePlayButton(); startAnimation(); });
ui.fullscreenButton.addEventListener("click", toggleFullscreen);
ui.exitFullscreenButton.addEventListener("click", exitViewerFullscreen);
ui.watermarkToggle.addEventListener("change", () => setWatermark(ui.watermarkToggle.checked));
ui.generateVideoButton.addEventListener("click", generateVideo);
ui.closeVideoPreview.addEventListener("click", closeVideoPreview);
ui.downloadVideoButton.addEventListener("click", downloadVideo);
ui.shareVideoButton.addEventListener("click", shareVideo);
ui.videoPreview.addEventListener("click", (event) => { if (event.target === ui.videoPreview) closeVideoPreview(); });
ui.menuButton.addEventListener("click", () => setMenu(true));
ui.closeMenuButton.addEventListener("click", () => setMenu(false));
ui.menuBackdrop.addEventListener("click", () => setMenu(false));
ui.sideMenu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
ui.sideMenu.querySelectorAll(".view-button").forEach((button) => button.addEventListener("click", () => changeView(button.dataset.view)));
window.addEventListener("keydown", (event) => { if (event.key === "Escape") { setMenu(false); exitViewerFullscreen(); closeVideoPreview(); } });
window.addEventListener("resize", applyCamera);
document.addEventListener("fullscreenchange", () => { applyCamera(); updateFullscreenButton(); });
document.addEventListener("webkitfullscreenchange", () => { applyCamera(); updateFullscreenButton(); });

window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); installPrompt = event; ui.installButton.hidden = false; });
ui.installButton.addEventListener("click", async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; ui.installButton.hidden = true; });
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js?v=18"));
}

let savedWatermark = null;
try { savedWatermark = localStorage.getItem("orbis-watermark-visible"); } catch (error) { /* usa o padrão visível */ }
setWatermark(savedWatermark !== "false");
updatePlayButton();
loadFrames();
setInterval(loadFrames, 10 * 60 * 1000);
