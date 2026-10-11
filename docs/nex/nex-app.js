/* Nex — login + app (agenda de contatos e conversas múltiplas, ponto a ponto via WebRTC/PeerJS) */
(function () {
  'use strict';

  const N = window.Nex;
  const t = N.t;
  const $ = (id) => document.getElementById(id);

  N.initPage();

  // ================= constantes =================
  const PROTOCOL_VERSION = 3;
  // O PeerJS refragmenta mensagens acima de ~16300 bytes e devolve Uint8Array na remontagem.
  // Mantemos o chunk abaixo desse teto para o dado chegar no tipo esperado.
  const CHUNK_SIZE = 15000;
  const TRANSFER_WINDOW_CHUNKS = 16;
  const MAX_QUEUED_RECEIVE_BYTES = CHUNK_SIZE * TRANSFER_WINDOW_CHUNKS * 2;
  const MAX_FILE_BYTES = 512 * 1024 * 1024;
  const MAX_IN_MEMORY_FILE_BYTES = 32 * 1024 * 1024;
  const MAX_VOICE_BYTES = 8 * 1024 * 1024;
  const MAX_TEXT_CHARS = 8000;
  const MAX_FILENAME_CHARS = 180;
  const MAX_RECORD_MS = 60000;
  const FILE_READY_TIMEOUT_MS = 120000;
  const FILE_PROGRESS_TIMEOUT_MS = 30000;
  const FILE_FINAL_ACK_TIMEOUT_MS = 45000;
  const CALL_RING_TIMEOUT_MS = 45000;
  const HANDSHAKE_TIMEOUT_MS = 12000;
  const HIST_MAX = 300;
  const MAX_REQUESTS = 20;
  const PRESENCE_INTERVAL_MS = 45000;
  const SIGNAL_SERVERS = [
    null, // usa o padrão embutido da lib (0.peerjs.com / 443 / secure)
    { host: '0.peerjs.com', port: 443, secure: true, path: '/' },
    { host: 'peerjs-server.herokuapp.com', port: 443, secure: true, path: '/' }
  ];
  const AV_COLORS = ['#9B6BFF', '#E8A33F', '#4FC3E8', '#E86BA8', '#6BD99B', '#B08CFF', '#E8785A'];

  // ================= elementos =================
  const loginView = $('loginView'), app = $('app'), toastEl = $('toast');
  // login
  const loginTabs = $('loginTabs'), tabToken = $('tabToken'), tabFile = $('tabFile');
  const acctWrap = $('acctWrap'), acctList = $('acctList'), noAcctInfo = $('noAcctInfo');
  const loginForm = $('loginForm'), loginUser = $('loginUser'), loginSecret = $('loginSecret'), secretToggle = $('secretToggle');
  const loginBtn = $('loginBtn'), loginFile = $('loginFile'), loginFileBtn = $('loginFileBtn');
  const loginError = $('loginError'), loginBusy = $('loginBusy');
  // barra lateral
  const meAvatar = $('meAvatar'), meName = $('meName'), meId = $('meId');
  const statusDot = $('statusDot'), statusLabel = $('statusLabel');
  const addContactBtn = $('addContactBtn'), addContactBtn2 = $('addContactBtn2'), shareBtn = $('shareBtn'), logoutBtn = $('logoutBtn');
  const searchInput = $('searchInput'), requestsBox = $('requestsBox'), requestsList = $('requestsList');
  const contactList = $('contactList'), sideEmpty = $('sideEmpty');
  // conversa
  const chatPlaceholder = $('chatPlaceholder'), chatView = $('chatView'), backBtn = $('backBtn');
  const chatAvatar = $('chatAvatar'), chatAvatarLetter = $('chatAvatarLetter'), chatPresence = $('chatPresence');
  const chatName = $('chatName'), chatState = $('chatState');
  const safetyBtn = $('safetyBtn'), voiceCallBtn = $('voiceCallBtn'), videoCallBtn = $('videoCallBtn');
  const menuBtn = $('menuBtn'), chatMenu = $('chatMenu');
  const menuRename = $('menuRename'), menuVerify = $('menuVerify'), menuResetKey = $('menuResetKey'), menuClear = $('menuClear'), menuRemove = $('menuRemove');
  const messagesHost = $('messagesHost');
  const msgInput = $('msgInput'), sendBtn = $('sendBtn'), attachBtn = $('attachBtn'), fileInput = $('fileInput');
  const pendingFileBox = $('pendingFile'), pendingPreviewImg = $('pendingPreviewImg'), pendingPreviewIcon = $('pendingPreviewIcon');
  const pendingFileName = $('pendingFileName'), pendingCancel = $('pendingCancel');
  const voiceBtn = $('voiceBtn'), composerRow = $('composerRow'), recordingBar = $('recordingBar');
  const recTime = $('recTime'), recWave = $('recWave'), recHint = $('recHint');
  // modais
  const addModal = $('addModal'), addModalClose = $('addModalClose'), addForm = $('addForm'), addError = $('addError');
  const addUserInput = $('addUserInput'), addNickInput = $('addNickInput');
  const shareModal = $('shareModal'), shareModalClose = $('shareModalClose'), qrCanvasWrap = $('qrCanvasWrap'), qrCaptionId = $('qrCaptionId');
  const qrDownloadBtn = $('qrDownloadBtn'), qrCopyLinkBtn = $('qrCopyLinkBtn'), shareNativeRow = $('shareNativeRow'), shareNativeBtn = $('shareNativeBtn');
  const safetyModal = $('safetyModal'), safetyModalClose = $('safetyModalClose'), safetySub = $('safetySub'), safetyCodeDisplay = $('safetyCodeDisplay');
  const lightbox = $('lightbox'), lightboxImg = $('lightboxImg'), lightboxCaption = $('lightboxCaption');
  const lightboxCloseBtn = $('lightboxCloseBtn'), lightboxDownloadBtn = $('lightboxDownloadBtn');
  // chamadas
  const callOverlay = $('callOverlay'), callRemoteVideo = $('callRemoteVideo'), callLocalVideo = $('callLocalVideo'), callRemoteAudio = $('callRemoteAudio');
  const callPeerName = $('callPeerName'), callStatusText = $('callStatusText');
  const callAcceptBtn = $('callAcceptBtn'), callDeclineBtn = $('callDeclineBtn');
  const callMuteBtn = $('callMuteBtn'), callCameraBtn = $('callCameraBtn'), callHangupBtn = $('callHangupBtn');
  // PWA
  const installBanner = $('installBanner'), installConfirm = $('installConfirm'), installDismiss = $('installDismiss');

  // ================= estado =================
  let me = null;                 // { user, name, pub, pubStr, signKey }
  let appStarted = false;
  let peer = null, peerReady = false;
  let serverAttemptIndex = 0, peerOpenWatchdog = null, idRetries = 0;
  const PEER_OPEN_TIMEOUT_MS = 7000;
  const convs = new Map();       // userId -> conversa
  const requests = new Map();    // userId -> pedido de conversa de desconhecido autenticado
  let blocked = new Set();
  let activeUser = null;
  let pendingFile = null;
  let statusState = 'busy', statusKey = 'statusEstablishing', statusArgs = [];
  let presenceTimer = null;

  const outgoingTransfers = new Map();
  const incomingTransfers = new Map();
  const sessionObjectUrls = new Set();

  // chamadas
  let activeCall = null, localCallStream = null, callKind = null, callState = 'idle', callConv = null;
  let callStartTime = 0, callDurationInterval = null, ringtoneInterval = null, callTimeoutHandle = null;
  let isCallMuted = false, isCallCameraOff = false, iceFailureTimeout = null;

  // gravação de voz
  let mediaRecorder = null, recordedChunks = [], recordStream = null, recordStartTime = 0;
  let recordTimerInterval = null, recordCancelled = false, recordPointerStartY = 0, recordConv = null;

  // ================= utilidades =================
  function showToast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove('show'), ms || 2600);
  }

  function uid() {
    return Date.now().toString(36) + N.toB64(N.randomBytes(6)).replace(/[^a-z0-9]/gi, '').slice(0, 8);
  }

  function iconHtml(name) { return `<svg class="icon"><use href="#icon-${name}"></use></svg>`; }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatMessageHtml(rawText) {
    let safe = escapeHtml(rawText);
    safe = safe.replace(/(https?:\/\/[^\s<]+)/g, (url) => {
      const trimmed = url.replace(/[.,;:!?)\]]+$/, '');
      const trailing = url.slice(trimmed.length);
      return `<a href="${trimmed}" target="_blank" rel="noopener noreferrer">${trimmed}</a>${trailing}`;
    });
    safe = safe.replace(/\*\*([^*<>]+?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/__([^_<>]+?)__/g, '<strong>$1</strong>');
    safe = safe.replace(/\*([^*<>]+?)\*/g, '<em>$1</em>');
    safe = safe.replace(/(?<![a-zA-Z0-9])_([^_<>]+?)_(?![a-zA-Z0-9])/g, '<em>$1</em>');
    safe = safe.replace(/`([^`<>]+?)`/g, '<code>$1</code>');
    safe = safe.replace(/~~([^~<>]+?)~~/g, '<del>$1</del>');
    safe = safe.replace(/\n/g, '<br>');
    return safe;
  }

  function pad2(n) { return String(n).padStart(2, '0'); }
  function timeLabel(ts) {
    const d = new Date(ts || Date.now());
    const hm = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    return isSameDay(d, new Date()) ? hm : pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + ' ' + hm;
  }
  function shortTimeLabel(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return isSameDay(d, new Date()) ? pad2(d.getHours()) + ':' + pad2(d.getMinutes()) : pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1);
  }
  function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function avatarColor(s) {
    let h = 0;
    for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return AV_COLORS[h % AV_COLORS.length];
  }
  function initialOf(name) { return (Array.from(String(name || '?').trim())[0] || '?'); }

  function fileIconFor(mime, name) {
    if (mime && mime.startsWith('image/')) return iconHtml('image');
    if (mime === 'application/pdf') return iconHtml('pdf');
    if (mime && mime.startsWith('audio/')) return iconHtml('audio');
    if (mime && mime.startsWith('video/')) return iconHtml('video-file');
    if (/\.(zip|rar|7z)$/i.test(name || '')) return iconHtml('archive');
    if (/\.(doc|docx)$/i.test(name || '')) return iconHtml('document');
    return iconHtml('file');
  }

  function isValidTransferId(v) { return typeof v === 'string' && /^t-[a-f0-9]{32}$/.test(v); }
  function sanitizeFileName(v) {
    const clean = String(v || 'arquivo').replace(/[\u0000-\u001f\u007f]/g, '').replace(/[\\/:*?"<>|]/g, '-').trim().slice(0, MAX_FILENAME_CHARS);
    return clean || 'arquivo';
  }
  function sanitizeMime(v) {
    const mime = String(v || 'application/octet-stream').slice(0, 100).toLowerCase();
    return /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(mime) ? mime : 'application/octet-stream';
  }
  function managedObjectUrl(blob) { const url = URL.createObjectURL(blob); sessionObjectUrls.add(url); return url; }
  function clearSessionObjectUrls() { sessionObjectUrls.forEach((u) => URL.revokeObjectURL(u)); sessionObjectUrls.clear(); }

  // ================= SHA-256 incremental (verificação de arquivos sem carregá-los inteiros) =================
  const SHA256_K = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ]);
  function rotr32(v, n) { return (v >>> n) | (v << (32 - n)); }

  class IncrementalSha256 {
    constructor() {
      this.h = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
      this.buffer = new Uint8Array(64);
      this.bufferLength = 0;
      this.bytesHashed = 0;
      this.words = new Uint32Array(64);
      this.finished = false;
      this.hexValue = null;
    }
    update(data) {
      if (this.finished) throw new Error('SHA-256 já finalizado');
      const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
      this.bytesHashed += bytes.byteLength;
      let offset = 0;
      while (offset < bytes.byteLength) {
        const take = Math.min(64 - this.bufferLength, bytes.byteLength - offset);
        this.buffer.set(bytes.subarray(offset, offset + take), this.bufferLength);
        this.bufferLength += take;
        offset += take;
        if (this.bufferLength === 64) { this.compress(); this.bufferLength = 0; }
      }
      return this;
    }
    compress() {
      const w = this.words;
      const view = new DataView(this.buffer.buffer, this.buffer.byteOffset, 64);
      for (let i = 0; i < 16; i++) w[i] = view.getUint32(i * 4, false);
      for (let i = 16; i < 64; i++) {
        const a = w[i - 15], b = w[i - 2];
        const s0 = rotr32(a, 7) ^ rotr32(a, 18) ^ (a >>> 3);
        const s1 = rotr32(b, 17) ^ rotr32(b, 19) ^ (b >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let a = this.h[0], b = this.h[1], c = this.h[2], d = this.h[3];
      let e = this.h[4], f = this.h[5], g = this.h[6], h = this.h[7];
      for (let i = 0; i < 64; i++) {
        const s1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + s1 + ch + SHA256_K[i] + w[i]) >>> 0;
        const s0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (s0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      this.h[0] = (this.h[0] + a) >>> 0; this.h[1] = (this.h[1] + b) >>> 0;
      this.h[2] = (this.h[2] + c) >>> 0; this.h[3] = (this.h[3] + d) >>> 0;
      this.h[4] = (this.h[4] + e) >>> 0; this.h[5] = (this.h[5] + f) >>> 0;
      this.h[6] = (this.h[6] + g) >>> 0; this.h[7] = (this.h[7] + h) >>> 0;
    }
    hex() {
      if (this.finished) return this.hexValue;
      const bitLength = this.bytesHashed * 8;
      let pos = this.bufferLength;
      this.buffer[pos++] = 0x80;
      if (pos > 56) { this.buffer.fill(0, pos, 64); this.compress(); pos = 0; }
      this.buffer.fill(0, pos, 56);
      const view = new DataView(this.buffer.buffer, this.buffer.byteOffset, 64);
      view.setUint32(56, Math.floor(bitLength / 0x100000000), false);
      view.setUint32(60, bitLength >>> 0, false);
      this.compress();
      this.finished = true;
      this.hexValue = Array.from(this.h, (n) => n.toString(16).padStart(8, '0')).join('');
      return this.hexValue;
    }
  }

  // ================= áudio (bipes de notificação e toque de chamada) =================
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    return audioCtx;
  }
  function unlockAudioOnce() {
    const ctx = getAudioCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    window.removeEventListener('touchstart', unlockAudioOnce);
    window.removeEventListener('mousedown', unlockAudioOnce);
    window.removeEventListener('keydown', unlockAudioOnce);
  }
  window.addEventListener('touchstart', unlockAudioOnce, { once: true, passive: true });
  window.addEventListener('mousedown', unlockAudioOnce, { once: true });
  window.addEventListener('keydown', unlockAudioOnce, { once: true });

  function playTones(freqs, step, dur, vol) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * step;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(start); osc.stop(start + dur + 0.02);
    });
  }
  function playNotifyTone() { playTones([880, 1174.66], 0.09, 0.16, 0.14); }
  function ringtoneBeep() { playTones([740, 740], 0.22, 0.15, 0.15); }
  function startRingtone() { ringtoneBeep(); clearInterval(ringtoneInterval); ringtoneInterval = setInterval(ringtoneBeep, 1800); }
  function stopRingtone() { clearInterval(ringtoneInterval); ringtoneInterval = null; }

  // ================= PWA =================
  if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
    window.addEventListener('load', () => {
      fetch('./sw.js', { method: 'HEAD' }).then((res) => {
        if (res.ok) navigator.serviceWorker.register('./sw.js').catch(() => {});
      }).catch(() => {});
    });
  }
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    let dismissed = false;
    try { dismissed = !!localStorage.getItem('nexus_install_dismissed'); } catch (err) { /* ignora */ }
    if (!dismissed) installBanner.classList.add('show');
  });
  installConfirm.addEventListener('click', async () => {
    installBanner.classList.remove('show');
    if (deferredInstallPrompt) { deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; }
  });
  installDismiss.addEventListener('click', () => {
    installBanner.classList.remove('show');
    try { localStorage.setItem('nexus_install_dismissed', '1'); } catch (e) { /* ignora */ }
  });
  window.addEventListener('appinstalled', () => { installBanner.classList.remove('show'); showToast(t('installedToast')); });

  // =====================================================================================
  //  LOGIN
  // =====================================================================================
  function showLoginError(msg) { loginError.textContent = msg; loginError.hidden = false; }
  function clearLoginError() { loginError.hidden = true; }
  function setBusy(b) { loginBusy.classList.toggle('show', b); loginBtn.disabled = b; loginFileBtn.disabled = b; }

  const wipeAllBtn = $('wipeAllBtn'), deleteAcctBtn = $('deleteAcctBtn');
  wipeAllBtn.addEventListener('click', () => {
    if (!confirm(t('confirmWipeAll'))) return;
    N.wipeAll();
    loginUser.value = ''; loginSecret.value = '';
    renderAccounts();
    showToast(t('allWiped'));
  });

  function renderAccounts() {
    const list = Object.values(N.getAccounts()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    acctWrap.hidden = list.length === 0;
    noAcctInfo.hidden = list.length > 0;
    acctList.innerHTML = '';
    list.forEach((a) => {
      const item = document.createElement('div');
      item.className = 'acct-item';
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'acct-chip';
      const n = document.createElement('b'); n.textContent = a.name;
      const u = document.createElement('span'); u.textContent = a.user;
      b.appendChild(n); b.appendChild(u);
      b.addEventListener('click', () => {
        loginUser.value = a.user;
        acctList.querySelectorAll('.acct-chip').forEach((c) => c.classList.toggle('active', c === b));
        loginSecret.focus();
      });
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'acct-del';
      del.innerHTML = iconHtml('trash');
      del.title = t('btnRemoveAcct'); del.setAttribute('aria-label', t('btnRemoveAcct'));
      del.addEventListener('click', () => {
        if (!confirm(t('confirmDeleteAccount', a.name, a.user))) return;
        N.deleteAccount(a.user);
        if (loginUser.value === a.user) { loginUser.value = ''; loginSecret.value = ''; }
        renderAccounts();
        showToast(t('accountDeleted'));
      });
      item.appendChild(b); item.appendChild(del);
      acctList.appendChild(item);
    });
    wipeAllBtn.hidden = list.length === 0;
    const last = N.lastUser();
    if (last && N.getAccounts()[last] && !loginUser.value) loginUser.value = last;
  }

  loginTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    loginTabs.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
    tabToken.hidden = btn.dataset.tab !== 'token';
    tabFile.hidden = btn.dataset.tab !== 'file';
    clearLoginError();
  });

  function syncSecretToggleLabel() { secretToggle.textContent = loginSecret.type === 'password' ? t('btnShow') : t('btnHide'); }
  secretToggle.addEventListener('click', () => {
    loginSecret.type = loginSecret.type === 'password' ? 'text' : 'password';
    syncSecretToggleLabel();
  });

  function cryptoAvailable() { return !!(window.crypto && window.crypto.subtle); }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearLoginError();
    if (!cryptoAvailable()) { showLoginError(t('noCrypto')); return; }
    const user = loginUser.value.trim().toLowerCase();
    const secret = loginSecret.value;
    if (!N.isValidUserId(user)) { showLoginError(t('loginErrBadId')); return; }
    setBusy(true);
    try {
      const identity = await N.unlockAccount(user, secret);
      N.saveSession(user, secret);
      setBusy(false);
      startApp(identity);
    } catch (err) {
      setBusy(false);
      const code = err && err.code;
      showLoginError(code === 'no-account' ? t('loginErrNoAccount') : code === 'no-crypto' ? t('noCrypto') :
        code === 'bad-id' ? t('loginErrBadId') : t('loginErrBadSecret'));
    }
  });

  loginFileBtn.addEventListener('click', () => loginFile.click());
  loginFile.addEventListener('change', async () => {
    const f = loginFile.files && loginFile.files[0];
    loginFile.value = '';
    if (!f) return;
    clearLoginError();
    if (!cryptoAvailable()) { showLoginError(t('noCrypto')); return; }
    if (f.size > 200000) { showLoginError(t('loginErrFile')); return; }
    setBusy(true);
    try {
      const obj = JSON.parse(await f.text());
      const r = await N.importBackup(obj);
      N.saveSession(r.identity.user, r.secret);
      setBusy(false);
      renderAccounts();
      startApp(r.identity);
    } catch (err) {
      setBusy(false);
      showLoginError(err && err.code === 'no-crypto' ? t('noCrypto') : t('loginErrFile'));
    }
  });

  // convite via link/QR: ?add=ID — guardado até o login terminar
  (function captureInviteParam() {
    try {
      const params = new URLSearchParams(location.search);
      const raw = params.get('add');
      if (raw) {
        const id = N.parseUserInput(raw);
        if (id) sessionStorage.setItem('nex_pending_add', id);
        history.replaceState(null, '', location.pathname);
      }
    } catch (e) { /* ignora */ }
  })();

  renderAccounts();
  syncSecretToggleLabel();

  (async function autoLogin() {
    const s = N.loadSession();
    if (!s || !cryptoAvailable()) return;
    setBusy(true);
    try {
      const identity = await N.unlockAccount(s.user, s.secret);
      setBusy(false);
      startApp(identity);
    } catch (e) {
      setBusy(false);
      N.clearSession();
    }
  })();

  // =====================================================================================
  //  DADOS LOCAIS (agenda + histórico de texto + bloqueados)
  // =====================================================================================
  function makeConv(c) {
    return {
      user: c.user, nick: c.nick || '', remoteName: c.remoteName || '', pubStr: c.pubStr || null,
      addedAt: c.addedAt || Date.now(),
      msgs: [], unread: 0, lastTs: 0, preview: '',
      conn: null, authed: false, connecting: false, attempt: null, state: 'offline', keyAlert: false,
      remoteTyping: false, typingTimer: null, lastTypingSent: 0, localTypingTimer: null,
      el: null, emptyEl: null, metaEls: new Map(),
      sendQueue: [], isSending: false, currentIncomingTransferId: null
    };
  }
  function displayName(c) { return c.nick || c.remoteName || c.user; }
  function histKey(conv) { return 'nex_hist_' + me.user + '_' + conv.user; }

  function loadBlocked() { blocked = new Set(N.store.get('nex_blocked_' + me.user, [])); }
  function saveBlocked() { N.store.set('nex_blocked_' + me.user, Array.from(blocked)); }

  function saveContacts() {
    N.store.set('nex_contacts_' + me.user, Array.from(convs.values()).map((c) => ({
      user: c.user, nick: c.nick, remoteName: c.remoteName, pubStr: c.pubStr, addedAt: c.addedAt
    })));
  }

  function loadContacts() {
    const list = N.store.get('nex_contacts_' + me.user, []);
    (Array.isArray(list) ? list : []).forEach((c) => {
      if (!c || !N.isValidUserId(c.user) || c.user === me.user) return;
      const conv = makeConv({
        user: c.user, nick: N.cleanName(c.nick), remoteName: N.cleanName(c.remoteName),
        pubStr: N.parsePub(c.pubStr) ? c.pubStr : null, addedAt: Number(c.addedAt) || Date.now()
      });
      loadHistory(conv);
      convs.set(conv.user, conv);
    });
  }

  function loadHistory(conv) {
    const arr = N.store.get(histKey(conv), []);
    conv.msgs = (Array.isArray(arr) ? arr : []).filter((m) =>
      m && typeof m.id === 'string' && (m.from === 'me' || m.from === 'them') &&
      typeof m.text === 'string' && m.text.length <= MAX_TEXT_CHARS && Number.isFinite(m.ts)
    ).map((m) => ({ id: m.id, from: m.from, text: m.text, ts: m.ts, status: m.status === 'pending' ? 'pending' : 'sent' })).slice(-HIST_MAX);
    const last = conv.msgs[conv.msgs.length - 1];
    conv.lastTs = last ? last.ts : conv.addedAt;
    conv.preview = last ? last.text : '';
  }

  function saveHistory(conv) {
    if (conv.msgs.length > HIST_MAX) conv.msgs = conv.msgs.slice(-HIST_MAX);
    N.store.set(histKey(conv), conv.msgs.map((m) => ({ id: m.id, from: m.from, text: m.text, ts: m.ts, status: m.status })));
  }

  // =====================================================================================
  //  INÍCIO DO APP
  // =====================================================================================
  function startApp(identity) {
    if (appStarted) return;
    appStarted = true;
    me = identity;
    document.documentElement.setAttribute('data-title-key', 'pageTitleApp');
    N.applyTranslations();
    loginView.hidden = true;
    app.hidden = false;
    document.body.style.overflow = 'hidden';

    meName.textContent = me.name;
    meId.textContent = me.user;
    meId.title = me.user;
    meAvatar.textContent = initialOf(me.name);
    meAvatar.style.setProperty('--av', avatarColor(me.user));

    loadBlocked();
    loadContacts();
    renderSidebar();
    renderRequests();
    setStatus('busy', 'statusEstablishing');
    initPeer(false);
    presenceTimer = setInterval(presenceTick, PRESENCE_INTERVAL_MS);

    let pend = null;
    try { pend = sessionStorage.getItem('nex_pending_add'); sessionStorage.removeItem('nex_pending_add'); } catch (e) { /* ignora */ }
    if (pend && pend !== me.user) { openAddModal(pend); showToast(t('idFromLink')); }
  }

  function setStatus(state, key, ...args) {
    statusState = state; statusKey = key; statusArgs = args;
    statusDot.className = 'dot' + (state ? ' ' + state : '');
    statusLabel.textContent = t(key, ...args);
  }

  // =====================================================================================
  //  CONVERSAS: elementos, mensagens, barra lateral
  // =====================================================================================
  function activeConv() { return activeUser ? convs.get(activeUser) || null : null; }

  function ensureConvEl(conv) {
    if (conv.el) return conv.el;
    const el = document.createElement('div');
    el.className = 'conv-messages';
    el.hidden = true;
    conv.emptyEl = document.createElement('div');
    conv.emptyEl.className = 'empty-state';
    conv.emptyEl.innerHTML = '<div class="glyph">§</div><p></p>';
    conv.emptyEl.querySelector('p').textContent = t('chatEmpty');
    el.appendChild(conv.emptyEl);
    messagesHost.appendChild(el);
    conv.el = el;
    conv.msgs.forEach((m) => renderMsg(conv, m));
    updateEmpty(conv);
    return el;
  }

  function updateEmpty(conv) {
    if (!conv.el || !conv.emptyEl) return;
    conv.emptyEl.style.display = conv.el.querySelector('.msg-row') ? 'none' : '';
  }

  function scrollToBottom(conv) {
    if (!conv.el) return;
    requestAnimationFrame(() => { conv.el.scrollTop = conv.el.scrollHeight; });
  }

  function renderMsg(conv, m) {
    const row = document.createElement('div');
    row.className = 'msg-row ' + (m.from === 'me' ? 'mine' : 'theirs');
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = formatMessageHtml(m.text);
    const meta = document.createElement('div');
    meta.className = 'msg-meta';
    meta.textContent = timeLabel(m.ts);
    if (m.from === 'me') {
      const tick = document.createElement('span');
      tick.className = 'tick';
      tick.innerHTML = iconHtml(m.status === 'pending' ? 'clock' : 'check');
      meta.appendChild(tick);
      conv.metaEls.set(m.id, tick);
    }
    bubble.appendChild(meta);
    row.appendChild(bubble);
    conv.el.appendChild(row);
    updateEmpty(conv);
    scrollToBottom(conv);
  }

  function setMsgStatus(conv, m, status) {
    m.status = status;
    const tick = conv.metaEls.get(m.id);
    if (tick) tick.innerHTML = iconHtml(status === 'pending' ? 'clock' : 'check');
  }

  function addSystemNote(conv, text) {
    ensureConvEl(conv);
    const row = document.createElement('div');
    row.className = 'msg-row system';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    conv.el.appendChild(row);
    updateEmpty(conv);
    scrollToBottom(conv);
  }

  function pushMsg(conv, m) {
    conv.msgs.push(m);
    if (conv.el) renderMsg(conv, m);
    conv.lastTs = m.ts;
    conv.preview = m.text;
    saveHistory(conv);
  }

  function touchMedia(conv, previewText, incoming) {
    conv.lastTs = Date.now();
    conv.preview = previewText;
    if (incoming) {
      if (activeUser !== conv.user || document.hidden) conv.unread++;
      updateTitle();
      playNotifyTone();
    }
    renderSidebar();
  }

  function updateTitle() {
    let n = 0;
    convs.forEach((c) => { n += c.unread; });
    document.title = (n > 0 ? `(${n}) ` : '') + t('pageTitleApp');
  }

  function renderSidebar() {
    if (!me) return;
    const q = searchInput.value.trim().toLowerCase();
    const list = Array.from(convs.values())
      .filter((c) => !q || displayName(c).toLowerCase().includes(q) || c.user.includes(q))
      .sort((a, b) => ((b.lastTs || b.addedAt) - (a.lastTs || a.addedAt)) || displayName(a).localeCompare(displayName(b)));
    contactList.innerHTML = '';
    list.forEach((c) => contactList.appendChild(buildContactItem(c)));
    sideEmpty.hidden = convs.size > 0;
    contactList.hidden = convs.size === 0;
  }

  function buildAvatar(name, user, small) {
    const av = document.createElement('div');
    av.className = 'avatar' + (small ? ' sm' : '');
    av.style.setProperty('--av', avatarColor(user));
    const letter = document.createElement('span');
    letter.textContent = initialOf(name);
    av.appendChild(letter);
    return av;
  }

  function buildContactItem(conv) {
    const item = document.createElement('div');
    item.className = 'contact' + (conv.user === activeUser ? ' active' : '');
    const av = buildAvatar(displayName(conv), conv.user, false);
    const pres = document.createElement('span');
    pres.className = 'presence' + (conv.state === 'online' ? ' online' : conv.state === 'connecting' ? ' connecting' : '');
    av.appendChild(pres);

    const main = document.createElement('div');
    main.className = 'contact-main';
    const top = document.createElement('div');
    top.className = 'contact-top';
    const name = document.createElement('div');
    name.className = 'contact-name';
    name.textContent = displayName(conv);
    const time = document.createElement('div');
    time.className = 'contact-time';
    time.textContent = conv.preview ? shortTimeLabel(conv.lastTs) : '';
    top.appendChild(name); top.appendChild(time);

    const bottom = document.createElement('div');
    bottom.className = 'contact-bottom';
    const prev = document.createElement('div');
    prev.className = 'contact-preview' + (conv.remoteTyping ? ' typing' : '');
    prev.textContent = conv.remoteTyping ? t('typingShort') : (conv.preview || conv.user);
    bottom.appendChild(prev);
    if (conv.unread > 0) {
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = conv.unread > 99 ? '99+' : String(conv.unread);
      bottom.appendChild(badge);
    }
    main.appendChild(top); main.appendChild(bottom);
    item.appendChild(av); item.appendChild(main);
    item.addEventListener('click', () => openChat(conv.user));
    return item;
  }

  function refreshState(conv) {
    const prev = conv.state;
    conv.state = (conv.authed && conv.conn && conv.conn.open) ? 'online' : conv.connecting ? 'connecting' : 'offline';
    if (conv.user === activeUser) updateChatHeader();
    if (prev !== conv.state) renderSidebar();
  }

  function updateChatHeader() {
    const conv = activeConv();
    if (!conv) return;
    const nm = displayName(conv);
    chatName.textContent = nm;
    chatAvatarLetter.textContent = initialOf(nm);
    chatAvatar.style.setProperty('--av', avatarColor(conv.user));
    chatPresence.className = 'presence' + (conv.state === 'online' ? ' online' : conv.state === 'connecting' ? ' connecting' : '');
    let cls = '', text;
    if (conv.keyAlert) { cls = 'alert'; text = t('keyChanged', nm); }
    else if (conv.remoteTyping) { cls = 'typing'; text = t('stateTyping'); }
    else if (conv.state === 'online') { cls = 'online'; text = t('stateOnline'); }
    else if (conv.state === 'connecting') { text = t('stateConnecting'); }
    else { text = t('stateOffline'); }
    chatState.className = 'chat-state ' + cls;
    chatState.textContent = text;
  }

  function openChat(user) {
    const conv = convs.get(user);
    if (!conv) return;
    if (activeUser && activeUser !== user) {
      stopTypingLocal(activeConv());
      clearPendingFile();
      closeChatMenu();
    }
    activeUser = user;
    conv.unread = 0;
    ensureConvEl(conv);
    convs.forEach((c) => { if (c.el) c.el.hidden = c !== conv; });
    chatPlaceholder.hidden = true;
    chatView.hidden = false;
    app.classList.add('chat-open');
    if (!history.state || !history.state.nexChat) history.pushState({ nexChat: true }, '');
    updateChatHeader();
    renderSidebar();
    updateTitle();
    scrollToBottom(conv);
    if (!conv.authed) connectTo(conv);
    if (window.matchMedia('(min-width: 821px)').matches) setTimeout(() => msgInput.focus(), 60);
  }

  function closeChatUI() {
    stopTypingLocal(activeConv());
    clearPendingFile();
    closeChatMenu();
    activeUser = null;
    convs.forEach((c) => { if (c.el) c.el.hidden = true; });
    app.classList.remove('chat-open');
    chatView.hidden = true;
    chatPlaceholder.hidden = false;
    renderSidebar();
  }

  backBtn.addEventListener('click', () => {
    if (history.state && history.state.nexChat) history.back(); else closeChatUI();
  });
  window.addEventListener('popstate', () => { if (app.classList.contains('chat-open')) closeChatUI(); });
  searchInput.addEventListener('input', renderSidebar);

  // ---- menu da conversa ----
  function closeChatMenu() { chatMenu.hidden = true; }
  menuBtn.addEventListener('click', (e) => { e.stopPropagation(); chatMenu.hidden = !chatMenu.hidden; });
  document.addEventListener('click', (e) => { if (!chatMenu.hidden && !chatMenu.contains(e.target)) closeChatMenu(); });

  function renameContact() {
    const conv = activeConv(); closeChatMenu();
    if (!conv) return;
    const v = prompt(t('renamePrompt'), displayName(conv));
    if (v === null) return;
    conv.nick = N.cleanName(v);
    saveContacts();
    updateChatHeader();
    renderSidebar();
  }
  function clearConversation() {
    const conv = activeConv(); closeChatMenu();
    if (!conv || !confirm(t('confirmClear'))) return;
    conv.msgs = [];
    conv.preview = '';
    conv.metaEls.clear();
    if (conv.el) { conv.el.querySelectorAll('.msg-row').forEach((r) => r.remove()); updateEmpty(conv); }
    saveHistory(conv);
    renderSidebar();
    showToast(t('clearedToast'));
  }
  function removeContact() {
    const conv = activeConv(); closeChatMenu();
    if (!conv || !confirm(t('confirmRemove'))) return;
    markAllTransfersInterrupted(conv);
    if (conv.conn) { try { conv.conn.close(); } catch (e) { /* ignora */ } }
    if (callConv === conv && callState !== 'idle') hangupCall();
    if (conv.el) conv.el.remove();
    convs.delete(conv.user);
    N.store.del(histKey(conv));
    saveContacts();
    closeChatUI();
    updateTitle();
    showToast(t('removedToast'));
  }
  function resetContactKey() {
    const conv = activeConv(); closeChatMenu();
    if (!conv || !confirm(t('confirmResetKey'))) return;
    conv.pubStr = null;
    conv.keyAlert = false;
    saveContacts();
    updateChatHeader();
    showToast(t('keyResetDone'), 4000);
  }
  menuRename.addEventListener('click', renameContact);
  menuClear.addEventListener('click', clearConversation);
  menuRemove.addEventListener('click', removeContact);
  menuResetKey.addEventListener('click', resetContactKey);
  menuVerify.addEventListener('click', () => { closeChatMenu(); openSafetyModal(); });

  // =====================================================================================
  //  REDE: sinalização (PeerJS), conexões, autenticação mútua
  // =====================================================================================
  function initPeer(isRetry) {
    if (!isRetry) serverAttemptIndex = 0;
    peerReady = false;
    setStatus('busy', serverAttemptIndex === 0 ? 'statusEstablishing' : 'statusEstablishingRetry', serverAttemptIndex + 1);

    if (peer) { try { peer.destroy(); } catch (e) { /* ignora */ } }
    clearTimeout(peerOpenWatchdog);

    const cfg = SIGNAL_SERVERS[serverAttemptIndex];
    peer = cfg ? new Peer(me.user, Object.assign({ debug: 0 }, cfg)) : new Peer(me.user, { debug: 0 });
    const thisPeer = peer;

    peerOpenWatchdog = setTimeout(() => {
      if (thisPeer !== peer) return;
      serverAttemptIndex++;
      if (serverAttemptIndex < SIGNAL_SERVERS.length) { initPeer(true); }
      else { setStatus(null, 'statusNoResponse'); showToast(t('toastNoIdentity'), 5000); }
    }, PEER_OPEN_TIMEOUT_MS);

    thisPeer.on('open', () => {
      if (thisPeer !== peer) return;
      clearTimeout(peerOpenWatchdog);
      idRetries = 0;
      peerReady = true;
      setStatus('online', 'statusOnline');
      Array.from(convs.values()).forEach((c, i) => setTimeout(() => connectTo(c), 250 * i));
    });

    thisPeer.on('connection', (conn) => { if (thisPeer === peer) onIncomingConnection(conn); });

    thisPeer.on('call', (call) => {
      if (thisPeer !== peer) return;
      const conv = convs.get(String(call.peer).toLowerCase());
      if (!conv || !conv.authed || !conv.conn || !conv.conn.open) { try { call.close(); } catch (e) { /* ignora */ } return; }
      handleIncomingCall(call, conv);
    });

    thisPeer.on('error', (err) => {
      if (thisPeer !== peer) return;
      console.warn('Peer error:', err.type, err.message);
      if (err.type === 'unavailable-id') {
        clearTimeout(peerOpenWatchdog);
        idRetries++;
        if (idRetries > 8) { setStatus(null, 'statusIdBusyFinal'); showToast(t('statusIdBusyFinal'), 6000); return; }
        setStatus('busy', 'statusIdBusy', idRetries);
        setTimeout(() => { if (thisPeer === peer) initPeer(true); }, 5000);
      } else if (err.type === 'peer-unavailable') {
        const m = /peer\s+([a-z0-9-]+)/i.exec(err.message || '');
        const conv = m ? convs.get(m[1].toLowerCase()) : null;
        if (conv && conv.attempt) failAttempt(conv.attempt);
        else if (conv) { conv.connecting = false; refreshState(conv); }
      } else if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error' || err.type === 'socket-closed') {
        clearTimeout(peerOpenWatchdog);
        serverAttemptIndex++;
        if (serverAttemptIndex < SIGNAL_SERVERS.length) initPeer(true);
        else setStatus(null, 'statusUnstable');
      } else {
        setStatus(null, 'statusUnstable');
      }
    });

    thisPeer.on('disconnected', () => {
      if (thisPeer !== peer) return;
      peerReady = false;
      setStatus('busy', 'statusReconnecting');
      try { thisPeer.reconnect(); } catch (e) { /* ignora */ }
    });
  }

  function presenceTick() {
    if (!peerReady || document.hidden) return;
    Array.from(convs.values()).filter((c) => !c.authed && !c.connecting).forEach((c, i) => setTimeout(() => connectTo(c), 400 * i));
  }

  function newNonce() { return N.toB64(N.randomBytes(16)); }

  function newConnState(role, conn, conv) {
    const st = {
      role, conn, conv: conv || null, authed: false, helloDone: false, ackDone: false,
      myNonce: newNonce(), theirNonce: null, remote: null,
      chain: Promise.resolve(), timer: null, closed: false, request: false, superseded: false
    };
    conn._nex = st;
    return st;
  }

  function bindConn(st) {
    const conn = st.conn;
    conn.on('open', () => {
      if (st.role === 'init') {
        try { conn.send({ type: 'hello', v: PROTOCOL_VERSION, user: me.user, name: me.name, pub: me.pubStr, nonce: st.myNonce }); }
        catch (e) { /* o timeout cuida */ }
      }
    });
    // os pacotes são processados em fila: o handshake usa criptografia assíncrona e a ordem importa
    conn.on('data', (d) => {
      st.chain = st.chain.then(() => onPacket(st, d)).catch((e) => console.warn('Pacote rejeitado:', e));
    });
    conn.on('close', () => onConnClosed(st));
    conn.on('error', () => onConnClosed(st));
  }

  function connectTo(conv) {
    if (!peer || !peerReady || !me) return;
    if (conv.connecting || conv.authed) return;
    conv.connecting = true;
    refreshState(conv);
    let conn;
    try { conn = peer.connect(conv.user, { reliable: true, metadata: { v: PROTOCOL_VERSION } }); }
    catch (e) { conv.connecting = false; refreshState(conv); return; }
    const st = newConnState('init', conn, conv);
    conv.attempt = st;
    st.timer = setTimeout(() => { if (!st.authed) failAttempt(st); }, HANDSHAKE_TIMEOUT_MS);
    bindConn(st);
  }

  function failAttempt(st) {
    try { st.conn.close(); } catch (e) { /* ignora */ }
    const conv = st.conv;
    if (conv && conv.attempt === st && !st.authed) {
      conv.attempt = null;
      conv.connecting = false;
      refreshState(conv);
    }
  }

  function onIncomingConnection(conn) {
    const st = newConnState('resp', conn, null);
    st.timer = setTimeout(() => { if (!st.authed) { try { conn.close(); } catch (e) { /* ignora */ } } }, HANDSHAKE_TIMEOUT_MS);
    const remoteId = String(conn.peer || '').toLowerCase();
    const protoOk = conn.metadata && conn.metadata.v === PROTOCOL_VERSION;
    if (!protoOk || blocked.has(remoteId)) {
      conn.on('open', () => {
        if (!protoOk) { try { conn.send({ type: 'reject', reason: 'protocol' }); } catch (e) { /* ignora */ } }
        setTimeout(() => { try { conn.close(); } catch (e) { /* ignora */ } }, 150);
      });
      return;
    }
    bindConn(st);
  }

  async function onPacket(st, d) {
    if (!d || typeof d !== 'object' || typeof d.type !== 'string') return;
    // ---- handshake ----
    if (d.type === 'hello' && st.role === 'resp' && !st.helloDone) { await handleHello(st, d); return; }
    if (d.type === 'hello-ack' && st.role === 'init' && !st.ackDone) { await handleHelloAck(st, d); return; }
    if (d.type === 'auth' && st.role === 'resp' && st.helloDone && !st.authed) { await handleAuth(st, d); return; }
    if (d.type === 'reject' && st.role === 'init') { handleReject(st, d); return; }
    if (!st.authed || !st.conv) return;   // nada passa antes da autenticação (nem de desconhecidos pendentes)

    const conv = st.conv, conn = st.conn;
    if (conv.conn !== conn) return;
    switch (d.type) {
      case 'msg':
        if (typeof d.text !== 'string' || d.text.length === 0 || d.text.length > MAX_TEXT_CHARS) { try { conn.close(); } catch (e) { /* ignora */ } return; }
        receiveText(conv, d.text);
        break;
      case 'typing': showRemoteTyping(conv); break;
      case 'stop-typing': hideRemoteTyping(conv); break;
      case 'file-meta': beginIncomingTransfer(conv, d); break;
      case 'file-ready': handleFileReady(conv, d); break;
      case 'file-chunk': handleIncomingFileChunk(conv, d); break;
      case 'file-progress-ack': handleFileProgressAck(conv, d); break;
      case 'file-end': await finishIncomingTransfer(conv, d); break;
      case 'file-ack': handleFileFinalAck(conv, d); break;
      case 'file-reject': handleFileReject(conv, d); break;
      case 'file-cancel': cancelIncomingTransfer(conv, d.transferId, t('peerCancelledSend')); break;
      default: break;
    }
  }

  function safeClose(conn) { try { conn.close(); } catch (e) { /* ignora */ } }

  // responder: recebe hello, prova a própria identidade assinando o nonce de quem ligou
  async function handleHello(st, d) {
    st.helloDone = true;
    const conn = st.conn;
    const user = typeof d.user === 'string' ? d.user : '';
    if (d.v !== PROTOCOL_VERSION || !N.isValidUserId(user) || user !== String(conn.peer).toLowerCase() || user === me.user ||
        !N.parsePub(d.pub) || typeof d.nonce !== 'string' || d.nonce.length > 40 || typeof d.name !== 'string') {
      try { conn.send({ type: 'reject', reason: 'invalid' }); } catch (e) { /* ignora */ }
      setTimeout(() => safeClose(conn), 150);
      return;
    }
    if (blocked.has(user)) { safeClose(conn); return; }
    const conv = convs.get(user);
    if (conv && conv.pubStr && conv.pubStr !== d.pub) {
      keyChanged(conv);
      try { conn.send({ type: 'reject', reason: 'key-changed' }); } catch (e) { /* ignora */ }
      setTimeout(() => safeClose(conn), 150);
      return;
    }
    if (!conv && !requests.has(user) && requests.size >= MAX_REQUESTS) { safeClose(conn); return; }

    st.remote = { user, name: N.cleanName(d.name) || user, pubStr: d.pub };
    st.theirNonce = d.nonce;
    const sig = await N.sign(me.signKey, `nex-v1|resp|${d.nonce}|${me.user}|${user}`);
    conn.send({ type: 'hello-ack', user: me.user, name: me.name, pub: me.pubStr, nonce: st.myNonce, sig });
  }

  // iniciador: confere a assinatura de quem atendeu e responde com a própria
  async function handleHelloAck(st, d) {
    st.ackDone = true;
    const conv = st.conv, conn = st.conn;
    if (!conv || d.user !== conv.user || !N.parsePub(d.pub) || typeof d.nonce !== 'string' || d.nonce.length > 40 || typeof d.sig !== 'string') {
      failAttempt(st);
      return;
    }
    const ok = await N.verify(d.pub, `nex-v1|resp|${st.myNonce}|${d.user}|${me.user}`, d.sig);
    if (!ok) { failAttempt(st); return; }
    if (conv.pubStr && conv.pubStr !== d.pub) {
      keyChanged(conv);
      failAttempt(st);
      return;
    }
    const sig = await N.sign(me.signKey, `nex-v1|init|${d.nonce}|${me.user}|${d.user}`);
    conn.send({ type: 'auth', sig });
    st.remote = { user: d.user, name: N.cleanName(d.name) || d.user, pubStr: d.pub };
    completeAuth(st);
  }

  async function handleAuth(st, d) {
    const ok = typeof d.sig === 'string' &&
      await N.verify(st.remote.pubStr, `nex-v1|init|${st.myNonce}|${st.remote.user}|${me.user}`, d.sig);
    if (!ok) { safeClose(st.conn); return; }
    completeAuth(st);
  }

  function handleReject(st, d) {
    const conv = st.conv;
    if (conv && d.reason === 'key-changed') {
      if (!conv.keyAlert) { conv.keyAlert = true; addSystemNote(conv, t('peerRejectedKey')); updateChatHeader(); }
    }
    failAttempt(st);
  }

  function completeAuth(st) {
    clearTimeout(st.timer);
    st.authed = true;
    const r = st.remote;
    const conv = st.role === 'init' ? st.conv : convs.get(r.user);
    if (conv) { adoptConn(conv, st); }
    else { addRequest(st); }
  }

  function initiatorOf(st) { return st.role === 'init' ? me.user : st.remote.user; }

  // liga uma conexão já autenticada à conversa do contato
  function adoptConn(conv, st) {
    const old = conv.conn;
    if (old && old !== st.conn && old.open && conv.authed && old._nex) {
      // duas conexões simultâneas (os dois ligaram ao mesmo tempo): os dois lados mantêm a iniciada pelo MENOR ID
      const oi = initiatorOf(old._nex), ni = initiatorOf(st);
      if (oi !== ni && oi < ni) {
        st.superseded = true;
        if (conv.attempt === st) { conv.attempt = null; conv.connecting = false; }
        safeClose(st.conn);
        refreshState(conv);
        return;
      }
    }
    if (old && old !== st.conn) {
      if (old._nex) old._nex.superseded = true;
      conv.conn = st.conn;
      markAllTransfersInterrupted(conv);
      safeClose(old);
    }
    st.conv = conv;
    conv.conn = st.conn;
    conv.authed = true;
    conv.connecting = false;
    conv.attempt = null;
    conv.keyAlert = false;
    const r = st.remote;
    if (!conv.pubStr) { conv.pubStr = r.pubStr; addSystemNote(conv, t('keyPinned')); }
    if (r.name) conv.remoteName = r.name;
    saveContacts();
    refreshState(conv);
    flushOutbox(conv);
    renderSidebar();
    updateChatHeader();
  }

  function onConnClosed(st) {
    if (st.closed) return;
    st.closed = true;
    clearTimeout(st.timer);
    if (st.request) {
      const r = st.remote && requests.get(st.remote.user);
      if (r && r.st === st) { requests.delete(st.remote.user); renderRequests(); }
      return;
    }
    const conv = st.conv;
    if (!conv) return;
    if (conv.attempt === st) { conv.attempt = null; if (!st.authed) conv.connecting = false; }
    if (conv.conn === st.conn) {
      conv.conn = null;
      conv.authed = false;
      conv.connecting = false;
      conv.remoteTyping = false;
      markAllTransfersInterrupted(conv);
      if (callState !== 'idle' && callConv === conv) endCallCleanup();
    }
    refreshState(conv);
    renderSidebar();
  }

  function keyChanged(conv) {
    if (!conv.keyAlert) {
      conv.keyAlert = true;
      addSystemNote(conv, t('keyChanged', displayName(conv)));
      showToast(t('keyChangedToast', displayName(conv)), 5000);
    }
    updateChatHeader();
  }

  // ---- pedidos de conversa de desconhecidos (já autenticados, mas ainda fora da agenda) ----
  function addRequest(st) {
    const r = st.remote;
    const prev = requests.get(r.user);
    if (prev && prev.st !== st) safeClose(prev.st.conn);
    st.request = true;
    requests.set(r.user, { user: r.user, name: r.name, pubStr: r.pubStr, st, ts: Date.now() });
    renderRequests();
    playNotifyTone();
    showToast(t('requestToast', r.name), 4000);
  }

  function renderRequests() {
    requestsList.innerHTML = '';
    requestsBox.hidden = requests.size === 0;
    requests.forEach((r) => {
      const card = document.createElement('div');
      card.className = 'request-card';
      const text = document.createElement('div');
      text.className = 'request-text';
      text.textContent = t('requestWants', r.name);
      const id = document.createElement('div');
      id.className = 'request-id';
      id.textContent = r.user;
      const actions = document.createElement('div');
      actions.className = 'request-actions';
      const mk = (label, cls, fn) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn ' + cls; b.textContent = label;
        b.addEventListener('click', fn);
        return b;
      };
      actions.appendChild(mk(t('btnAccept'), 'accept', () => acceptRequest(r.user)));
      actions.appendChild(mk(t('btnIgnore'), '', () => dismissRequest(r.user, false)));
      actions.appendChild(mk(t('btnBlock'), 'danger', () => dismissRequest(r.user, true)));
      card.appendChild(text); card.appendChild(id); card.appendChild(actions);
      requestsList.appendChild(card);
    });
  }

  function acceptRequest(user, nick) {
    const r = requests.get(user);
    if (!r) return null;
    requests.delete(user);
    const conv = makeConv({ user, nick: nick || '', remoteName: r.name, pubStr: r.pubStr, addedAt: Date.now() });
    conv.lastTs = conv.addedAt;
    convs.set(user, conv);
    saveContacts();
    renderRequests();
    adoptConn(conv, r.st);
    r.st.request = false;
    r.st.conv = conv;
    renderSidebar();
    return conv;
  }

  function dismissRequest(user, block) {
    const r = requests.get(user);
    if (!r) return;
    requests.delete(user);
    if (block) { blocked.add(user); saveBlocked(); showToast(t('blockedToast')); }
    safeClose(r.st.conn);
    renderRequests();
  }

  // =====================================================================================
  //  MENSAGENS DE TEXTO
  // =====================================================================================
  function sendText(conv, text) {
    const m = { id: uid(), from: 'me', text, ts: Date.now(), status: 'pending' };
    pushMsg(conv, m);
    if (conv.authed && conv.conn && conv.conn.open) {
      try { conv.conn.send({ type: 'msg', id: m.id, text }); setMsgStatus(conv, m, 'sent'); saveHistory(conv); }
      catch (e) { /* continua na fila */ }
    } else {
      showToast(t('channelNotOpen'), 2400);
      connectTo(conv);
    }
    renderSidebar();
  }

  function flushOutbox(conv) {
    if (!conv.authed || !conv.conn || !conv.conn.open) return;
    let changed = false;
    conv.msgs.filter((m) => m.from === 'me' && m.status === 'pending').forEach((m) => {
      try { conv.conn.send({ type: 'msg', id: m.id, text: m.text }); setMsgStatus(conv, m, 'sent'); changed = true; }
      catch (e) { /* tenta na próxima conexão */ }
    });
    if (changed) saveHistory(conv);
  }

  function receiveText(conv, text) {
    const m = { id: 'r' + uid(), from: 'them', text, ts: Date.now(), status: 'sent' };
    pushMsg(conv, m);
    hideRemoteTyping(conv);
    if (activeUser !== conv.user || document.hidden) conv.unread++;
    renderSidebar();
    updateTitle();
    playNotifyTone();
  }

  function showRemoteTyping(conv) {
    conv.remoteTyping = true;
    clearTimeout(conv.typingTimer);
    conv.typingTimer = setTimeout(() => hideRemoteTyping(conv), 2600);
    if (conv.user === activeUser) updateChatHeader();
    renderSidebar();
  }
  function hideRemoteTyping(conv) {
    if (!conv.remoteTyping) return;
    conv.remoteTyping = false;
    clearTimeout(conv.typingTimer);
    if (conv.user === activeUser) updateChatHeader();
    renderSidebar();
  }
  function stopTypingLocal(conv) {
    if (!conv) return;
    clearTimeout(conv.localTypingTimer);
    if (conv.authed && conv.conn && conv.conn.open && conv.lastTypingSent) {
      try { conv.conn.send({ type: 'stop-typing' }); } catch (e) { /* ignora */ }
    }
    conv.lastTypingSent = 0;
  }

  msgInput.addEventListener('input', () => {
    const conv = activeConv();
    if (!conv || !conv.authed || !conv.conn || !conv.conn.open) return;
    const now = Date.now();
    if (now - conv.lastTypingSent > 1000) {
      try { conv.conn.send({ type: 'typing' }); conv.lastTypingSent = now; } catch (e) { /* ignora */ }
    }
    clearTimeout(conv.localTypingTimer);
    conv.localTypingTimer = setTimeout(() => stopTypingLocal(conv), 1400);
  });

  function sendMessage() {
    const conv = activeConv();
    if (!conv) return;
    if (pendingFile) { sendPendingFile(); return; }
    const text = msgInput.value.trim();
    if (!text) return;
    if (text.length > MAX_TEXT_CHARS) { showToast(t('textTooLong', MAX_TEXT_CHARS)); return; }
    sendText(conv, text);
    msgInput.value = '';
    msgInput.focus();
    stopTypingLocal(conv);
  }
  sendBtn.addEventListener('click', sendMessage);
  msgInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

  function isOnline(conv) { return !!(conv && conv.authed && conv.conn && conv.conn.open); }

  // =====================================================================================
  //  TRANSFERÊNCIA DE ARQUIVOS (protocolo v2 dentro da sessão autenticada)
  //  metadados → aceite → janelas de chunks com ACK → SHA-256 → ACK final
  // =====================================================================================
  function makeTransferId() { return 't-' + Array.from(N.randomBytes(16), b => b.toString(16).padStart(2, '0')).join(''); }

  function createTransferCard(conv, name, mime, size, who, isOutgoing) {
    ensureConvEl(conv);
    const row = document.createElement('div');
    row.className = 'msg-row ' + who;
    const bubble = document.createElement('div');
    bubble.className = 'bubble attachment';
    const card = document.createElement('div');
    card.className = 'file-card transfer-card';
    const cardRow = document.createElement('div');
    cardRow.className = 'transfer-card-row';
    const icon = document.createElement('div');
    icon.className = 'file-icon';
    icon.innerHTML = fileIconFor(mime, name);
    const info = document.createElement('div');
    info.className = 'file-info';
    const nameEl = document.createElement('div');
    nameEl.className = 'file-name';
    nameEl.textContent = name || 'arquivo';
    const progressWrap = document.createElement('div');
    progressWrap.className = 'transfer-progress-track';
    const progressFill = document.createElement('div');
    progressFill.className = 'transfer-progress-fill';
    progressWrap.appendChild(progressFill);
    const statusLine = document.createElement('div');
    statusLine.className = 'file-size transfer-status';
    statusLine.textContent = (isOutgoing ? t('sendingProgress') : t('receivingProgress')) + ' 0% · ' + formatBytes(size);
    info.appendChild(nameEl); info.appendChild(progressWrap); info.appendChild(statusLine);
    cardRow.appendChild(icon); cardRow.appendChild(info);

    let cancelBtn = null;
    if (isOutgoing) {
      cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'transfer-cancel-btn';
      cancelBtn.title = t('btnCancelTransfer');
      cancelBtn.setAttribute('aria-label', t('btnCancelTransfer'));
      cancelBtn.innerHTML = iconHtml('close');
      cardRow.appendChild(cancelBtn);
    }
    card.appendChild(cardRow);
    bubble.appendChild(card);
    row.appendChild(bubble);
    conv.el.appendChild(row);
    updateEmpty(conv);
    scrollToBottom(conv);

    const ui = { conv, row, bubble, card, cardRow, info, progressFill, statusLine, nameEl, icon, cancelBtn };
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => { if (ui._cancel) ui._cancel(); cancelBtn.disabled = true; });
    }
    return ui;
  }

  function updateTransferProgress(ui, done, total, isOutgoing) {
    const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
    ui.progressFill.style.width = pct + '%';
    ui.statusLine.textContent = (isOutgoing ? t('sendingProgress') : t('receivingProgress')) + ' ' + pct + '% · ' + formatBytes(done) + ' / ' + formatBytes(total);
  }

  function removeTransferActions(ui) { const a = ui.card.querySelector('.transfer-actions'); if (a) a.remove(); }

  function addTransferActions(ui, actions) {
    removeTransferActions(ui);
    const wrap = document.createElement('div');
    wrap.className = 'transfer-actions';
    actions.forEach((action) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'transfer-action-btn' + (action.primary ? ' primary' : '');
      btn.textContent = action.label;
      btn.addEventListener('click', () => action.onClick(btn));
      wrap.appendChild(btn);
    });
    ui.info.appendChild(wrap);
  }

  function finalizeTransferCardAsImage(ui, url, name, size) {
    ui.card.classList.add('done');
    ui.bubble.innerHTML = '';
    const frame = document.createElement('div');
    frame.className = 'img-frame';
    const img = document.createElement('img');
    img.src = url;
    img.alt = name || 'imagem';
    img.loading = 'lazy';
    img.addEventListener('click', () => openLightbox(url, name));
    frame.appendChild(img);
    const ind = document.createElement('div');
    ind.className = 'img-expand-indicator';
    ind.innerHTML = iconHtml('expand');
    frame.appendChild(ind);
    ui.bubble.appendChild(frame);
    const meta = document.createElement('div');
    meta.className = 'msg-meta';
    meta.style.padding = '6px 4px 0';
    meta.textContent = (name ? name + ' · ' : '') + formatBytes(size) + ' · ' + timeLabel(Date.now());
    ui.bubble.appendChild(meta);
    scrollToBottom(ui.conv);
  }

  function finalizeTransferCardAsFile(ui, blobUrl, name, size) {
    ui.card.classList.add('done');
    ui.statusLine.remove();
    const cb = ui.card.querySelector('.transfer-cancel-btn'); if (cb) cb.remove();
    const size2 = document.createElement('div');
    size2.className = 'file-size';
    size2.textContent = formatBytes(size) + ' · ' + timeLabel(Date.now());
    const dl = document.createElement('a');
    dl.className = 'file-download';
    dl.innerHTML = iconHtml('download') + ' ' + t('btnDownloadFile');
    dl.href = blobUrl;
    dl.download = name || 'arquivo';
    const info = ui.card.querySelector('.file-info');
    info.appendChild(size2); info.appendChild(dl);
    const track = ui.card.querySelector('.transfer-progress-track'); if (track) track.remove();
    scrollToBottom(ui.conv);
  }

  function finalizeTransferCardAsSaved(ui, size) {
    ui.card.classList.add('done');
    const cb = ui.card.querySelector('.transfer-cancel-btn'); if (cb) cb.remove();
    const track = ui.card.querySelector('.transfer-progress-track'); if (track) track.remove();
    removeTransferActions(ui);
    ui.statusLine.classList.remove('is-error');
    ui.statusLine.textContent = t('transferSavedToDevice') + ' · ' + formatBytes(size) + ' · ' + timeLabel(Date.now());
  }

  function renderTransferFailed(ui, isOutgoing, message) {
    ui.card.classList.add('failed');
    const cb = ui.card.querySelector('.transfer-cancel-btn'); if (cb) cb.remove();
    removeTransferActions(ui);
    ui.progressFill.style.width = '100%';
    ui.statusLine.classList.add('is-error');
    ui.statusLine.textContent = message || (isOutgoing ? t('transferSendFailed') : t('transferIncomplete'));
  }

  // ---------- quem ENVIA ----------
  function queueFileSend(conv, file, caption, options) {
    options = options || {};
    const kind = options.kind === 'voice' ? 'voice' : 'file';
    const maxBytes = kind === 'voice' ? MAX_VOICE_BYTES : MAX_FILE_BYTES;
    if (!(file instanceof Blob) || !Number.isSafeInteger(file.size) || file.size < 0 || file.size > maxBytes) {
      showToast(t('fileTooLarge', formatBytes((file && file.size) || 0), formatBytes(maxBytes)), 3400);
      return;
    }
    conv.sendQueue.push({
      file, kind,
      caption: typeof caption === 'string' ? caption.slice(0, MAX_TEXT_CHARS) : '',
      transferId: makeTransferId(),
      durationMs: Number.isFinite(options.durationMs) ? Math.max(0, Math.round(options.durationMs)) : 0
    });
    processSendQueue(conv);
  }

  function processSendQueue(conv) {
    if (conv.isSending || conv.sendQueue.length === 0) return;
    conv.isSending = true;
    const job = conv.sendQueue.shift();
    sendFileChunked(conv, job, () => { conv.isSending = false; processSendQueue(conv); });
  }

  function settleOutgoingTransfer(state) {
    if (!state || state.settled) return;
    state.settled = true;
    clearTimeout(state.timer);
    outgoingTransfers.delete(state.transferId);
    state.onDone();
  }

  function failOutgoingTransfer(state, message, allowRetry) {
    if (!state || state.settled) return;
    const conn = state.conv.conn;
    if (conn && conn.open) { try { conn.send({ type: 'file-cancel', transferId: state.transferId }); } catch (e) { /* ignora */ } }
    renderTransferFailed(state.ui, true, message || t('transferSendFailed'));
    if (allowRetry) {
      addTransferActions(state.ui, [{
        label: t('btnRetryTransfer'), primary: true,
        onClick: () => {
          removeTransferActions(state.ui);
          queueFileSend(state.conv, state.job.file, state.job.caption, { kind: state.job.kind, durationMs: state.job.durationMs });
        }
      }]);
    }
    settleOutgoingTransfer(state);
  }

  function armOutgoingTimer(state, ms, message) {
    clearTimeout(state.timer);
    state.timer = setTimeout(() => failOutgoingTransfer(state, message || t('transferTimedOut'), true), ms);
  }

  function sendFileChunked(conv, job, onDone) {
    if (!isOnline(conv)) { onDone(); return; }
    const file = job.file, transferId = job.transferId;
    const ui = createTransferCard(conv, file.name, file.type, file.size, 'mine', true);
    ui.statusLine.textContent = t('transferWaitingAcceptance') + ' · ' + formatBytes(file.size);
    const state = {
      conv, job, file, transferId, ui, onDone,
      stage: 'waiting-ready', offset: 0, index: 0, ackedBytes: 0,
      hasher: new IncrementalSha256(), pumping: false, timer: null, settled: false
    };
    outgoingTransfers.set(transferId, state);
    conv.conn.send({
      type: 'file-meta', protocolVersion: 2, transferId, kind: job.kind,
      name: sanitizeFileName(file.name || (job.kind === 'voice' ? 'audio-nex.webm' : 'arquivo')),
      mime: file.type || 'application/octet-stream', size: file.size,
      durationMs: job.kind === 'voice' ? job.durationMs : 0
    });
    armOutgoingTimer(state, FILE_READY_TIMEOUT_MS, t('transferTimedOut'));
    ui._cancel = () => {
      if (state.settled) return;
      failOutgoingTransfer(state, t('youCancelledSend'), false);
    };
  }

  function handleFileReady(conv, data) {
    if (!isValidTransferId(data.transferId)) return;
    const state = outgoingTransfers.get(data.transferId);
    if (!state || state.conv !== conv || state.settled || state.stage !== 'waiting-ready') return;
    if (data.mode !== 'memory' && data.mode !== 'disk') { failOutgoingTransfer(state, t('transferInvalidData'), true); return; }
    clearTimeout(state.timer);
    state.stage = 'sending';
    pumpOutgoingTransfer(state);
  }

  async function pumpOutgoingTransfer(state) {
    if (!state || state.settled || state.pumping || state.stage !== 'sending') return;
    const conv = state.conv;
    if (!isOnline(conv)) { failOutgoingTransfer(state, t('transferInterrupted'), true); return; }
    state.pumping = true;
    try {
      let windowCount = 0;
      while (state.offset < state.file.size && windowCount < TRANSFER_WINDOW_CHUNKS) {
        const end = Math.min(state.offset + CHUNK_SIZE, state.file.size);
        const buffer = await state.file.slice(state.offset, end).arrayBuffer();
        if (state.settled || state.stage !== 'sending') return;
        if (!isOnline(conv)) throw new Error('canal fechado');
        const bytes = new Uint8Array(buffer);
        if (bytes.byteLength === 0 || bytes.byteLength > CHUNK_SIZE) throw new Error('chunk inválido');
        state.hasher.update(bytes);
        conv.conn.send({ type: 'file-chunk', transferId: state.transferId, index: state.index, offset: state.offset, data: buffer });
        state.offset += bytes.byteLength;
        state.index++;
        windowCount++;
        updateTransferProgress(state.ui, state.offset, state.file.size, true);
      }
      if (state.offset >= state.file.size) {
        state.stage = 'awaiting-final-ack';
        state.sha256 = state.hasher.hex();
        conv.conn.send({ type: 'file-end', transferId: state.transferId, size: state.file.size, chunks: state.index, sha256: state.sha256 });
        state.ui.statusLine.textContent = t('transferAwaitingConfirmation');
        armOutgoingTimer(state, FILE_FINAL_ACK_TIMEOUT_MS, t('transferTimedOut'));
      } else {
        state.stage = 'awaiting-progress-ack';
        armOutgoingTimer(state, FILE_PROGRESS_TIMEOUT_MS, t('transferTimedOut'));
      }
    } catch (e) {
      console.warn('Falha ao enviar bloco:', e);
      failOutgoingTransfer(state, t('transferReadError'), true);
    } finally {
      state.pumping = false;
    }
  }

  function handleFileProgressAck(conv, data) {
    if (!isValidTransferId(data.transferId)) return;
    const state = outgoingTransfers.get(data.transferId);
    if (!state || state.conv !== conv || state.settled || state.stage !== 'awaiting-progress-ack') return;
    if (!Number.isSafeInteger(data.receivedBytes) || !Number.isSafeInteger(data.nextIndex) ||
        data.receivedBytes !== state.offset || data.nextIndex !== state.index) {
      failOutgoingTransfer(state, t('transferInvalidData'), true);
      return;
    }
    clearTimeout(state.timer);
    state.ackedBytes = data.receivedBytes;
    state.stage = 'sending';
    pumpOutgoingTransfer(state);
  }

  function handleFileFinalAck(conv, data) {
    if (!isValidTransferId(data.transferId)) return;
    const state = outgoingTransfers.get(data.transferId);
    if (!state || state.conv !== conv || state.settled || typeof data.ok !== 'boolean') return;
    clearTimeout(state.timer);
    if (!data.ok) {
      failOutgoingTransfer(state, data.reason === 'hash-mismatch' ? t('transferHashMismatch') : t('transferSendFailed'), true);
      return;
    }
    if (state.stage !== 'awaiting-final-ack' || typeof data.sha256 !== 'string' || data.sha256 !== state.sha256) {
      failOutgoingTransfer(state, t('transferInvalidData'), true);
      return;
    }
    const ui = state.ui;
    ui.card.classList.add('done');
    const cb = ui.card.querySelector('.transfer-cancel-btn'); if (cb) cb.remove();
    const track = ui.card.querySelector('.transfer-progress-track'); if (track) track.remove();
    ui.statusLine.classList.remove('is-error');
    ui.statusLine.textContent = t('transferVerified') + ' · ' + formatBytes(state.file.size) + ' · ' + timeLabel(Date.now());

    if (state.job.kind === 'voice') {
      const url = managedObjectUrl(state.file);
      ui.row.remove();
      addVoiceMessage(conv, { url, durationMs: state.job.durationMs }, 'mine');
      touchMedia(conv, t('previewVoice'), false);
    } else {
      touchMedia(conv, t('previewFile', state.file.name || 'arquivo'), false);
      if (state.job.caption) sendText(conv, state.job.caption);
    }
    settleOutgoingTransfer(state);
  }

  function handleFileReject(conv, data) {
    if (!isValidTransferId(data.transferId)) return;
    const state = outgoingTransfers.get(data.transferId);
    if (!state || state.conv !== conv || state.settled) return;
    failOutgoingTransfer(state, t('transferRejected'), true);
  }

  // ---------- quem RECEBE ----------
  function validateIncomingMeta(meta) {
    if (!meta || meta.protocolVersion !== 2 || !isValidTransferId(meta.transferId)) return null;
    if (meta.kind !== 'file' && meta.kind !== 'voice') return null;
    if (!Number.isSafeInteger(meta.size) || meta.size < 0) return null;
    const maxBytes = meta.kind === 'voice' ? MAX_VOICE_BYTES : MAX_FILE_BYTES;
    if (meta.size > maxBytes) return null;
    if (typeof meta.name !== 'string' || meta.name.length > MAX_FILENAME_CHARS * 2) return null;
    if (typeof meta.mime !== 'string' || meta.mime.length > 100) return null;
    if (meta.kind === 'voice' && (!Number.isSafeInteger(meta.durationMs) || meta.durationMs < 0 || meta.durationMs > MAX_RECORD_MS + 5000)) return null;
    return {
      transferId: meta.transferId, kind: meta.kind, name: sanitizeFileName(meta.name), mime: sanitizeMime(meta.mime),
      size: meta.size, durationMs: meta.kind === 'voice' ? meta.durationMs : 0
    };
  }

  function beginIncomingTransfer(conv, meta) {
    const conn = conv.conn;
    const safe = validateIncomingMeta(meta);
    if (!safe) {
      if (isValidTransferId(meta && meta.transferId)) conn.send({ type: 'file-reject', transferId: meta.transferId, reason: 'invalid-meta' });
      return;
    }
    if (conv.currentIncomingTransferId) { conn.send({ type: 'file-reject', transferId: safe.transferId, reason: 'busy' }); return; }

    const ui = createTransferCard(conv, safe.name, safe.mime, safe.size, 'theirs', false);
    const transfer = Object.assign({}, safe, {
      ui, conv, conn, stage: 'pending', mode: null, chunks: [], writable: null,
      receivedBytes: 0, expectedIndex: 0, queuedBytes: 0,
      hasher: new IncrementalSha256(), writeChain: Promise.resolve(), failed: false
    });
    incomingTransfers.set(safe.transferId, transfer);
    conv.currentIncomingTransferId = safe.transferId;

    if (safe.kind === 'voice') { acceptIncomingMemory(transfer); return; }

    if (safe.size <= MAX_IN_MEMORY_FILE_BYTES) {
      ui.statusLine.textContent = t('transferWaitingAcceptance') + ' · ' + formatBytes(safe.size);
      addTransferActions(ui, [
        { label: t('btnReceiveFile'), primary: true, onClick: () => acceptIncomingMemory(transfer) },
        { label: t('btnRejectTransfer'), onClick: () => rejectIncomingTransfer(transfer) }
      ]);
    } else if (typeof window.showSaveFilePicker === 'function' && window.isSecureContext) {
      ui.statusLine.textContent = t('transferChooseLocation') + ' · ' + formatBytes(safe.size);
      addTransferActions(ui, [
        { label: t('btnSaveReceive'), primary: true, onClick: (btn) => acceptIncomingDisk(transfer, btn) },
        { label: t('btnRejectTransfer'), onClick: () => rejectIncomingTransfer(transfer) }
      ]);
    } else {
      renderTransferFailed(ui, false, t('transferDiskUnsupported'));
      incomingTransfers.delete(safe.transferId);
      conv.currentIncomingTransferId = null;
      conn.send({ type: 'file-reject', transferId: safe.transferId, reason: 'disk-unsupported' });
    }
  }

  function acceptIncomingMemory(transfer) {
    if (!transfer || transfer.stage !== 'pending') return;
    transfer.mode = 'memory';
    transfer.stage = 'ready';
    removeTransferActions(transfer.ui);
    transfer.ui.statusLine.textContent = t('receivingProgress') + ' 0% · ' + formatBytes(transfer.size);
    transfer.conn.send({ type: 'file-ready', transferId: transfer.transferId, mode: 'memory' });
  }

  async function acceptIncomingDisk(transfer, button) {
    if (!transfer || transfer.stage !== 'pending') return;
    button.disabled = true;
    try {
      const handle = await window.showSaveFilePicker({ suggestedName: transfer.name });
      if (transfer.stage !== 'pending') return;
      const writable = await handle.createWritable();
      if (transfer.stage !== 'pending') { await Promise.resolve(writable.abort()).catch(() => {}); return; }
      transfer.writable = writable;
      transfer.mode = 'disk';
      transfer.stage = 'ready';
      removeTransferActions(transfer.ui);
      transfer.ui.statusLine.textContent = t('receivingProgress') + ' 0% · ' + formatBytes(transfer.size);
      transfer.conn.send({ type: 'file-ready', transferId: transfer.transferId, mode: 'disk' });
    } catch (e) {
      button.disabled = false;
      if (e && e.name !== 'AbortError') rejectIncomingTransfer(transfer);
    }
  }

  function dropIncoming(transfer) {
    incomingTransfers.delete(transfer.transferId);
    if (transfer.conv.currentIncomingTransferId === transfer.transferId) transfer.conv.currentIncomingTransferId = null;
    if (transfer.writable) { Promise.resolve(transfer.writable.abort()).catch(() => {}); }
  }

  function rejectIncomingTransfer(transfer) {
    if (!transfer || transfer.failed) return;
    transfer.failed = true;
    transfer.stage = 'failed';
    dropIncoming(transfer);
    renderTransferFailed(transfer.ui, false, t('transferRejected'));
    if (transfer.conn && transfer.conn.open) transfer.conn.send({ type: 'file-reject', transferId: transfer.transferId, reason: 'rejected' });
  }

  function failIncomingTransfer(transfer, message, reason, notifyPeer) {
    if (!transfer || transfer.failed) return;
    transfer.failed = true;
    transfer.stage = 'failed';
    dropIncoming(transfer);
    renderTransferFailed(transfer.ui, false, message || t('transferIncomplete'));
    if (notifyPeer && transfer.conn && transfer.conn.open) {
      try { transfer.conn.send({ type: 'file-ack', transferId: transfer.transferId, ok: false, reason: reason || 'invalid' }); } catch (e) { /* ignora */ }
    }
  }

  function normalizeChunkBytes(value) {
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    return null;
  }

  function handleIncomingFileChunk(conv, packet) {
    if (!isValidTransferId(packet.transferId)) return;
    const transfer = incomingTransfers.get(packet.transferId);
    if (!transfer || transfer.conv !== conv || transfer.conn !== conv.conn) { safeClose(conv.conn); return; }
    if (transfer.stage !== 'ready' && transfer.stage !== 'receiving') {
      failIncomingTransfer(transfer, t('transferInvalidData'), 'not-ready', true);
      return;
    }
    const bytes = normalizeChunkBytes(packet.data);
    if (!bytes || bytes.byteLength < 1 || bytes.byteLength > CHUNK_SIZE ||
        !Number.isSafeInteger(packet.index) || !Number.isSafeInteger(packet.offset)) {
      failIncomingTransfer(transfer, t('transferInvalidData'), 'invalid-chunk', true);
      return;
    }
    if (transfer.queuedBytes + bytes.byteLength > MAX_QUEUED_RECEIVE_BYTES) {
      failIncomingTransfer(transfer, t('transferInvalidData'), 'flow-control', true);
      return;
    }
    const cleanBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    transfer.queuedBytes += cleanBuffer.byteLength;
    transfer.stage = 'receiving';
    transfer.writeChain = transfer.writeChain
      .then(async () => {
        if (transfer.failed) return;
        if (packet.index !== transfer.expectedIndex || packet.offset !== transfer.receivedBytes ||
            transfer.receivedBytes + cleanBuffer.byteLength > transfer.size ||
            cleanBuffer.byteLength !== Math.min(CHUNK_SIZE, transfer.size - transfer.receivedBytes)) {
          throw new Error('sequência de chunks inválida');
        }
        const cleanBytes = new Uint8Array(cleanBuffer);
        transfer.hasher.update(cleanBytes);
        if (transfer.mode === 'disk') await transfer.writable.write(cleanBytes);
        else transfer.chunks.push(cleanBuffer);
        transfer.receivedBytes += cleanBuffer.byteLength;
        transfer.expectedIndex++;
        updateTransferProgress(transfer.ui, transfer.receivedBytes, transfer.size, false);
        if (transfer.expectedIndex % TRANSFER_WINDOW_CHUNKS === 0 || transfer.receivedBytes === transfer.size) {
          transfer.conn.send({ type: 'file-progress-ack', transferId: transfer.transferId, receivedBytes: transfer.receivedBytes, nextIndex: transfer.expectedIndex });
        }
      })
      .catch((e) => {
        console.warn('Bloco recebido rejeitado:', e);
        failIncomingTransfer(transfer, t('transferInvalidData'), 'invalid-chunk', true);
      })
      .finally(() => { transfer.queuedBytes = Math.max(0, transfer.queuedBytes - cleanBuffer.byteLength); });
  }

  async function finishIncomingTransfer(conv, packet) {
    if (!isValidTransferId(packet.transferId)) return;
    const transfer = incomingTransfers.get(packet.transferId);
    if (!transfer || transfer.conv !== conv || transfer.conn !== conv.conn || transfer.failed) return;
    if (transfer.stage !== 'ready' && transfer.stage !== 'receiving') {
      failIncomingTransfer(transfer, t('transferInvalidData'), 'not-ready', true);
      return;
    }
    if (!Number.isSafeInteger(packet.size) || !Number.isSafeInteger(packet.chunks) ||
        typeof packet.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(packet.sha256)) {
      failIncomingTransfer(transfer, t('transferInvalidData'), 'invalid-end', true);
      return;
    }
    transfer.stage = 'finishing';
    try {
      await transfer.writeChain;
      if (transfer.failed) return;
      const complete = transfer.receivedBytes === transfer.size && packet.size === transfer.size && transfer.expectedIndex === packet.chunks;
      if (!complete) { failIncomingTransfer(transfer, t('transferIncomplete'), 'incomplete', true); return; }
      const calculatedHash = transfer.hasher.hex();
      if (calculatedHash !== packet.sha256) { failIncomingTransfer(transfer, t('transferHashMismatch'), 'hash-mismatch', true); return; }

      let previewText;
      if (transfer.mode === 'disk') {
        await transfer.writable.close();
        transfer.writable = null;
        finalizeTransferCardAsSaved(transfer.ui, transfer.size);
        previewText = t('previewFile', transfer.name);
      } else {
        const blob = new Blob(transfer.chunks, { type: transfer.mime });
        const url = managedObjectUrl(blob);
        if (transfer.kind === 'voice') {
          transfer.ui.row.remove();
          addVoiceMessage(conv, { url, durationMs: transfer.durationMs }, 'theirs');
          previewText = t('previewVoice');
        } else if (transfer.mime.startsWith('image/')) {
          finalizeTransferCardAsImage(transfer.ui, url, transfer.name, transfer.size);
          const meta = transfer.ui.bubble.querySelector('.msg-meta');
          if (meta) meta.textContent += ' · SHA-256 ✓';
          previewText = t('previewFile', transfer.name);
        } else {
          finalizeTransferCardAsFile(transfer.ui, url, transfer.name, transfer.size);
          const sizeLine = transfer.ui.card.querySelector('.file-size');
          if (sizeLine) sizeLine.textContent += ' · SHA-256 ✓';
          previewText = t('previewFile', transfer.name);
        }
      }
      incomingTransfers.delete(transfer.transferId);
      if (conv.currentIncomingTransferId === transfer.transferId) conv.currentIncomingTransferId = null;
      try { transfer.conn.send({ type: 'file-ack', transferId: transfer.transferId, ok: true, sha256: calculatedHash }); }
      catch (e) { console.warn('Arquivo verificado, mas a confirmação não pôde ser enviada:', e); }
      hideRemoteTyping(conv);
      touchMedia(conv, previewText, true);
    } catch (e) {
      console.warn('Falha ao finalizar transferência:', e);
      failIncomingTransfer(transfer, t('transferIncomplete'), 'write-failed', true);
    }
  }

  function cancelIncomingTransfer(conv, transferId, message) {
    if (!isValidTransferId(transferId)) return;
    const transfer = incomingTransfers.get(transferId);
    if (!transfer || transfer.conv !== conv) return;
    failIncomingTransfer(transfer, message || t('peerCancelledSend'), 'cancelled', false);
  }

  function markAllTransfersInterrupted(conv) {
    conv.sendQueue = [];
    Array.from(outgoingTransfers.values()).filter((s) => s.conv === conv).forEach((s) => failOutgoingTransfer(s, t('transferInterrupted'), false));
    Array.from(incomingTransfers.values()).filter((tr) => tr.conv === conv).forEach((tr) => failIncomingTransfer(tr, t('transferInterrupted'), 'closed', false));
    conv.currentIncomingTransferId = null;
    conv.isSending = false;
  }

  // ---------- anexar arquivos ----------
  attachBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) setPendingFile(file);
    fileInput.value = '';
  });

  function setPendingFile(file) {
    if (file.size > MAX_FILE_BYTES) { showToast(t('fileTooLarge', formatBytes(file.size), formatBytes(MAX_FILE_BYTES)), 3400); return; }
    pendingFile = file;
    pendingFileBox.classList.add('show');
    pendingFileName.textContent = file.name;
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      pendingPreviewImg.src = objectUrl;
      pendingPreviewImg.style.display = 'block';
      pendingPreviewIcon.style.display = 'none';
      pendingPreviewImg.onload = () => URL.revokeObjectURL(objectUrl);
    } else {
      pendingPreviewImg.style.display = 'none';
      pendingPreviewIcon.style.display = 'flex';
      pendingPreviewIcon.innerHTML = fileIconFor(file.type, file.name);
    }
    msgInput.placeholder = t('msgInputPlaceholderCaption');
    msgInput.focus();
  }

  function clearPendingFile() {
    pendingFile = null;
    pendingFileBox.classList.remove('show');
    pendingPreviewImg.src = '';
    msgInput.placeholder = t('msgInputPlaceholder');
  }
  pendingCancel.addEventListener('click', clearPendingFile);

  function sendPendingFile() {
    const conv = activeConv();
    if (!pendingFile || !conv) return;
    if (!isOnline(conv)) { showToast(t('fileNeedsOnline'), 3200); return; }
    const file = pendingFile;
    const caption = msgInput.value.trim();
    clearPendingFile();
    msgInput.value = '';
    queueFileSend(conv, file, caption);
  }

  // arrastar e soltar na área de mensagens
  let dragCounter = 0;
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((evt) => {
    messagesHost.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
  });
  messagesHost.addEventListener('dragenter', () => { dragCounter++; messagesHost.classList.add('dragging'); });
  messagesHost.addEventListener('dragleave', () => { dragCounter--; if (dragCounter <= 0) { dragCounter = 0; messagesHost.classList.remove('dragging'); } });
  messagesHost.addEventListener('drop', (e) => {
    dragCounter = 0;
    messagesHost.classList.remove('dragging');
    const conv = activeConv();
    if (!conv) return;
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) setPendingFile(file);
  });

  // =====================================================================================
  //  MENSAGENS DE VOZ (segurar para gravar)
  // =====================================================================================
  function buildRecWaveBars() {
    recWave.innerHTML = '';
    for (let i = 0; i < 28; i++) {
      const bar = document.createElement('span');
      bar.style.animationDelay = (Math.random() * 0.6).toFixed(2) + 's';
      bar.style.animationDuration = (0.4 + Math.random() * 0.5).toFixed(2) + 's';
      recWave.appendChild(bar);
    }
  }
  function formatClock(ms) {
    const s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  async function startRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') return;
    const conv = activeConv();
    if (!conv) return;
    if (!isOnline(conv)) { showToast(t('fileNeedsOnline'), 3200); return; }
    try {
      recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) { showToast(t('micAccessDenied')); return; }

    recordConv = conv;
    recordedChunks = [];
    recordCancelled = false;
    let mimeType = 'audio/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
    try { mediaRecorder = mimeType ? new MediaRecorder(recordStream, { mimeType }) : new MediaRecorder(recordStream); }
    catch (e) { mediaRecorder = new MediaRecorder(recordStream); }

    mediaRecorder.addEventListener('dataavailable', (e) => { if (e.data && e.data.size > 0) recordedChunks.push(e.data); });
    mediaRecorder.addEventListener('stop', () => {
      try { recordStream.getTracks().forEach((tr) => tr.stop()); } catch (e) { /* ignora */ }
      if (recordCancelled || recordedChunks.length === 0) { recordedChunks = []; return; }
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      recordedChunks = [];
      if (blob.size > MAX_VOICE_BYTES) { showToast(t('audioTooLong', formatBytes(blob.size)), 3200); return; }
      const ext = (blob.type || '').includes('mp4') ? 'm4a' : 'webm';
      const voiceFile = new File([blob], `audio-nex-${Date.now()}.${ext}`, { type: blob.type || 'audio/webm' });
      if (recordConv && isOnline(recordConv)) queueFileSend(recordConv, voiceFile, '', { kind: 'voice', durationMs: Date.now() - recordStartTime });
    });

    mediaRecorder.start();
    recordStartTime = Date.now();
    voiceBtn.classList.add('recording');
    voiceBtn.innerHTML = iconHtml('stop');
    composerRow.style.display = 'none';
    recordingBar.classList.add('show');
    recHint.textContent = t('recHintCancel');
    buildRecWaveBars();
    recTime.textContent = '0:00';
    recordTimerInterval = setInterval(() => {
      const elapsed = Date.now() - recordStartTime;
      recTime.textContent = formatClock(elapsed);
      if (elapsed >= MAX_RECORD_MS) stopRecording(false);
    }, 200);
  }

  function stopRecording(cancelled) {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') { resetRecordingUI(); return; }
    recordCancelled = !!cancelled;
    mediaRecorder.stop();
    clearInterval(recordTimerInterval);
    resetRecordingUI();
    if (cancelled) showToast(t('recordingCancelled'));
  }

  function resetRecordingUI() {
    voiceBtn.classList.remove('recording');
    voiceBtn.innerHTML = iconHtml('mic');
    composerRow.style.display = 'flex';
    recordingBar.classList.remove('show');
  }

  function onRecordStart(e) {
    e.preventDefault();
    recordPointerStartY = e.touches ? e.touches[0].clientY : e.clientY;
    startRecording();
  }
  function onRecordMove(e) {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    if (recordPointerStartY - y > 60) { recHint.textContent = t('recHintCancelNow'); recHint.style.color = 'var(--danger)'; }
    else { recHint.textContent = t('recHintCancel'); recHint.style.color = ''; }
  }
  function onRecordEnd(e) {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
    const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    stopRecording(recordPointerStartY - y > 60);
  }
  voiceBtn.addEventListener('mousedown', onRecordStart);
  window.addEventListener('mousemove', onRecordMove);
  window.addEventListener('mouseup', onRecordEnd);
  voiceBtn.addEventListener('touchstart', onRecordStart, { passive: false });
  window.addEventListener('touchmove', onRecordMove, { passive: true });
  window.addEventListener('touchend', onRecordEnd);
  window.addEventListener('touchcancel', () => stopRecording(true));

  // velocidade de reprodução dos áudios (lembrada entre sessões; vale para todos os áudios)
  const VOICE_SPEEDS = [1, 1.5, 2];
  let voiceSpeedIdx = Math.max(0, VOICE_SPEEDS.indexOf(parseFloat(N.store.get('nex_voice_speed'))));

  function addVoiceMessage(conv, data, who) {
    ensureConvEl(conv);
    const row = document.createElement('div');
    row.className = 'msg-row ' + who;
    const bubble = document.createElement('div');
    bubble.className = 'bubble attachment';
    const player = document.createElement('div');
    player.className = 'voice-msg';
    const audioEl = document.createElement('audio');
    audioEl.className = 'voice-audio-el';
    audioEl.src = data.url;
    audioEl.preload = 'metadata';
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'voice-play-btn';
    playBtn.innerHTML = iconHtml('play');
    playBtn.setAttribute('aria-label', 'Play');
    const body = document.createElement('div');
    body.className = 'voice-body';
    const track = document.createElement('div');
    track.className = 'voice-track';
    const bars = [];
    for (let i = 0; i < 34; i++) {
      const b = document.createElement('span');
      b.style.height = (4 + Math.round(Math.abs(Math.sin(i * 0.6)) * 14 + Math.random() * 4)) + 'px';
      track.appendChild(b);
      bars.push(b);
    }
    const meta = document.createElement('div');
    meta.className = 'voice-meta';
    const durLabel = document.createElement('span');
    durLabel.textContent = formatClock(data.durationMs || 0);
    const timeEl = document.createElement('span');
    timeEl.textContent = timeLabel(Date.now());
    meta.appendChild(durLabel); meta.appendChild(timeEl);
    body.appendChild(track); body.appendChild(meta);
    const speedBtn = document.createElement('button');
    speedBtn.type = 'button';
    speedBtn.className = 'voice-speed';
    const applySpeed = () => {
      audioEl.playbackRate = VOICE_SPEEDS[voiceSpeedIdx];
      speedBtn.textContent = VOICE_SPEEDS[voiceSpeedIdx] + 'x';
      speedBtn.classList.toggle('fast', VOICE_SPEEDS[voiceSpeedIdx] !== 1);
      speedBtn.title = speedBtn.ariaLabel = t('voiceSpeed');
    };
    applySpeed();
    speedBtn.addEventListener('click', () => {
      voiceSpeedIdx = (voiceSpeedIdx + 1) % VOICE_SPEEDS.length;
      N.store.set('nex_voice_speed', String(VOICE_SPEEDS[voiceSpeedIdx]));
      document.querySelectorAll('.voice-msg').forEach((m) => { if (m._applySpeed) m._applySpeed(); });
    });
    player._applySpeed = applySpeed;
    // alguns navegadores zeram a velocidade ao (re)iniciar a mídia
    audioEl.addEventListener('play', () => { audioEl.playbackRate = VOICE_SPEEDS[voiceSpeedIdx]; });
    player.appendChild(playBtn); player.appendChild(body); player.appendChild(speedBtn); player.appendChild(audioEl);
    bubble.appendChild(player);
    row.appendChild(bubble);
    conv.el.appendChild(row);
    updateEmpty(conv);
    scrollToBottom(conv);

    let isPlaying = false;
    const setProgress = (ratio) => {
      const n = Math.round(ratio * bars.length);
      bars.forEach((b, i) => b.classList.toggle('played', i < n));
    };
    playBtn.addEventListener('click', () => {
      if (isPlaying) audioEl.pause();
      else {
        document.querySelectorAll('audio.voice-audio-el').forEach((a) => { if (a !== audioEl) a.pause(); });
        audioEl.play().catch(() => showToast(t('audioPlayFailed')));
      }
    });
    audioEl.addEventListener('play', () => { isPlaying = true; playBtn.innerHTML = iconHtml('pause'); });
    audioEl.addEventListener('pause', () => { isPlaying = false; playBtn.innerHTML = iconHtml('play'); });
    audioEl.addEventListener('ended', () => { isPlaying = false; playBtn.innerHTML = iconHtml('play'); setProgress(0); });
    audioEl.addEventListener('timeupdate', () => { if (audioEl.duration) setProgress(audioEl.currentTime / audioEl.duration); });
    track.addEventListener('click', (e) => {
      if (!audioEl.duration) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      audioEl.currentTime = ratio * audioEl.duration;
      setProgress(ratio);
    });
  }

  // =====================================================================================
  //  CHAMADAS DE VOZ / VÍDEO (uma de cada vez, só com contatos autenticados e online)
  // =====================================================================================
  function setCallState(state) {
    callState = state;
    callOverlay.classList.remove('state-outgoing', 'state-incoming', 'state-active');
    if (state !== 'idle') callOverlay.classList.add('state-' + state);
  }
  function setCallKindClass(kind) {
    callKind = kind;
    callOverlay.classList.toggle('kind-video', kind === 'video');
    callOverlay.classList.toggle('kind-voice', kind === 'voice');
  }
  function secureForMedia() {
    return typeof window.isSecureContext === 'boolean' ? window.isSecureContext :
      (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  }
  function getCallStream(kind) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.reject(new Error('mediaDevices indisponível'));
    return navigator.mediaDevices.getUserMedia(kind === 'video' ? { audio: true, video: { facingMode: 'user' } } : { audio: true, video: false });
  }
  function openCallOverlay() { callOverlay.classList.add('show'); }
  function closeCallOverlayUI() {
    callOverlay.classList.remove('show', 'remote-connected', 'kind-video', 'kind-voice');
    setCallState('idle');
  }
  function updateCallControlIcons() {
    callMuteBtn.innerHTML = iconHtml(isCallMuted ? 'mic-off' : 'mic');
    callMuteBtn.classList.toggle('active-off', isCallMuted);
    callCameraBtn.innerHTML = iconHtml(isCallCameraOff ? 'video-off' : 'video-camera');
    callCameraBtn.classList.toggle('active-off', isCallCameraOff);
    callCameraBtn.style.display = callKind === 'video' ? 'flex' : 'none';
  }

  function attachIceMonitoring(call) {
    call.on('iceStateChanged', (state) => {
      if (state === 'failed' || (state === 'disconnected' && callState !== 'idle')) {
        clearTimeout(iceFailureTimeout);
        iceFailureTimeout = setTimeout(() => {
          const pc = call.peerConnection;
          const bad = !pc || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected';
          if (bad && callState !== 'idle') { showToast(t('callConnectionFailed'), 4600); hangupCall(); }
        }, state === 'failed' ? 300 : 6000);
      } else if (state === 'connected' || state === 'completed') {
        clearTimeout(iceFailureTimeout);
      }
    });
  }

  function onRemoteStreamReceived(remoteStream) {
    clearTimeout(callTimeoutHandle);
    if (callKind === 'video') { callRemoteVideo.srcObject = remoteStream; callOverlay.classList.add('remote-connected'); }
    else { callRemoteAudio.srcObject = remoteStream; callRemoteAudio.play().catch(() => {}); }
    setCallState('active');
    callStartTime = Date.now();
    callStatusText.textContent = '0:00';
    clearInterval(callDurationInterval);
    callDurationInterval = setInterval(() => { callStatusText.textContent = formatClock(Date.now() - callStartTime); }, 1000);
    playNotifyTone();
  }

  async function startCall(kind) {
    const conv = activeConv();
    if (!conv) return;
    if (!isOnline(conv)) { showToast(t('callNeedsOnline'), 3000); return; }
    if (callState !== 'idle') return;
    if (!secureForMedia()) { showToast(t('callNeedsHttps'), 5200); return; }
    let stream;
    try { stream = await getCallStream(kind); }
    catch (e) { showToast(kind === 'video' ? t('callCameraPermissionDenied') : t('micAccessDenied')); return; }

    localCallStream = stream;
    callConv = conv;
    isCallMuted = false; isCallCameraOff = false;
    setCallKindClass(kind);
    setCallState('outgoing');
    openCallOverlay();
    callPeerName.textContent = displayName(conv);
    callStatusText.textContent = t('callCalling');
    if (kind === 'video') callLocalVideo.srcObject = stream;
    updateCallControlIcons();

    const call = peer.call(conv.user, stream, { metadata: { kind } });
    activeCall = call;
    call.on('stream', onRemoteStreamReceived);
    call.on('close', endCallCleanup);
    call.on('error', endCallCleanup);
    attachIceMonitoring(call);
    callTimeoutHandle = setTimeout(() => {
      if (callState === 'outgoing') { showToast(t('callNoAnswer')); hangupCall(); }
    }, CALL_RING_TIMEOUT_MS);
  }

  function handleIncomingCall(call, conv) {
    if (callState !== 'idle') { try { call.close(); } catch (e) { /* ignora */ } return; }
    activeCall = call;
    callConv = conv;
    const kind = (call.metadata || {}).kind === 'video' ? 'video' : 'voice';
    isCallMuted = false; isCallCameraOff = false;
    setCallKindClass(kind);
    setCallState('incoming');
    openCallOverlay();
    callPeerName.textContent = displayName(conv);
    callStatusText.textContent = kind === 'video' ? t('callIncomingVideo') : t('callIncomingVoice');
    updateCallControlIcons();
    startRingtone();
    callTimeoutHandle = setTimeout(() => { if (callState === 'incoming') declineCall(); }, CALL_RING_TIMEOUT_MS);
  }

  async function acceptCall() {
    if (!activeCall) return;
    stopRingtone();
    clearTimeout(callTimeoutHandle);
    if (!secureForMedia()) { showToast(t('callNeedsHttps'), 5200); hangupCall(); return; }
    let stream;
    try { stream = await getCallStream(callKind); }
    catch (e) { showToast(callKind === 'video' ? t('callCameraPermissionDenied') : t('micAccessDenied')); hangupCall(); return; }
    localCallStream = stream;
    if (callKind === 'video') callLocalVideo.srcObject = stream;
    updateCallControlIcons();
    activeCall.answer(stream);
    activeCall.on('stream', onRemoteStreamReceived);
    activeCall.on('close', endCallCleanup);
    activeCall.on('error', endCallCleanup);
    attachIceMonitoring(activeCall);
    callStatusText.textContent = t('callConnecting');
  }

  function declineCall() { stopRingtone(); clearTimeout(callTimeoutHandle); if (activeCall) { try { activeCall.close(); } catch (e) { /* ignora */ } } endCallCleanup(); }
  function hangupCall() { stopRingtone(); clearTimeout(callTimeoutHandle); if (activeCall) { try { activeCall.close(); } catch (e) { /* ignora */ } } endCallCleanup(); }

  function endCallCleanup() {
    stopRingtone();
    clearTimeout(callTimeoutHandle);
    clearTimeout(iceFailureTimeout);
    clearInterval(callDurationInterval);
    if (localCallStream) { localCallStream.getTracks().forEach((tr) => tr.stop()); localCallStream = null; }
    callRemoteVideo.srcObject = null;
    callLocalVideo.srcObject = null;
    callRemoteAudio.srcObject = null;
    activeCall = null;
    callConv = null;
    closeCallOverlayUI();
  }

  if (!secureForMedia()) {
    [voiceCallBtn, videoCallBtn].forEach((btn) => { btn.style.opacity = '0.45'; btn.title = t('callNeedsHttps'); });
  }
  voiceCallBtn.addEventListener('click', () => startCall('voice'));
  videoCallBtn.addEventListener('click', () => startCall('video'));
  callAcceptBtn.addEventListener('click', acceptCall);
  callDeclineBtn.addEventListener('click', declineCall);
  callHangupBtn.addEventListener('click', hangupCall);
  callMuteBtn.addEventListener('click', () => {
    isCallMuted = !isCallMuted;
    if (localCallStream) localCallStream.getAudioTracks().forEach((tr) => { tr.enabled = !isCallMuted; });
    updateCallControlIcons();
  });
  callCameraBtn.addEventListener('click', () => {
    isCallCameraOff = !isCallCameraOff;
    if (localCallStream) localCallStream.getVideoTracks().forEach((tr) => { tr.enabled = !isCallCameraOff; });
    updateCallControlIcons();
  });

  // =====================================================================================
  //  MODAIS: adicionar contato, compartilhar (QR), verificar identidade, imagem
  // =====================================================================================
  function openAddModal(prefill) {
    addError.hidden = true;
    addUserInput.value = prefill || '';
    addNickInput.value = '';
    addModal.classList.add('show');
    setTimeout(() => (prefill ? addNickInput : addUserInput).focus(), 60);
  }
  function closeAddModal() { addModal.classList.remove('show'); }
  addContactBtn.addEventListener('click', () => openAddModal(''));
  addContactBtn2.addEventListener('click', () => openAddModal(''));
  addModalClose.addEventListener('click', closeAddModal);
  addModal.addEventListener('click', (e) => { if (e.target === addModal) closeAddModal(); });

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fail = (msg) => { addError.textContent = msg; addError.hidden = false; };
    const id = N.parseUserInput(addUserInput.value);
    if (!id) { fail(t('addErrInvalid')); return; }
    if (id === me.user) { fail(t('addErrSelf')); return; }
    const nick = N.cleanName(addNickInput.value);
    if (convs.has(id)) {
      closeAddModal();
      showToast(t('alreadyContact'));
      openChat(id);
      return;
    }
    if (blocked.has(id)) { blocked.delete(id); saveBlocked(); } // adicionar de propósito desfaz o bloqueio
    let conv;
    if (requests.has(id)) {
      conv = acceptRequest(id, nick);
    } else {
      conv = makeConv({ user: id, nick, addedAt: Date.now() });
      conv.lastTs = conv.addedAt;
      convs.set(id, conv);
      saveContacts();
    }
    closeAddModal();
    renderSidebar();
    showToast(t('addedToast', displayName(conv)));
    openChat(id);
  });

  // ---- compartilhar meu ID ----
  function buildShareUrl() {
    const url = new URL(location.href);
    url.hash = '';
    url.search = '';
    url.searchParams.set('add', me.user);
    return url.toString();
  }
  function renderQr() {
    qrCaptionId.textContent = me.user;
    qrCanvasWrap.innerHTML = '';
    try {
      new QRCode(qrCanvasWrap, {
        text: buildShareUrl(), width: 190, height: 190,
        colorDark: '#1A0F33', colorLight: '#FFFFFF', correctLevel: QRCode.CorrectLevel.M
      });
    } catch (e) {
      console.warn('QRCode indisponível:', e);
      qrCanvasWrap.textContent = 'QR indisponível';
    }
  }
  function openShareModal() {
    renderQr();
    shareNativeRow.hidden = !navigator.share;
    shareModal.classList.add('show');
  }
  function closeShareModal() { shareModal.classList.remove('show'); }
  shareBtn.addEventListener('click', openShareModal);
  shareModalClose.addEventListener('click', closeShareModal);
  shareModal.addEventListener('click', (e) => { if (e.target === shareModal) closeShareModal(); });
  qrCopyLinkBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(buildShareUrl()); showToast(t('linkCopied')); }
    catch (e) { showToast(t('linkCopyFailed')); }
  });
  shareNativeBtn.addEventListener('click', () => {
    if (navigator.share) navigator.share({ title: 'Nex', text: t('shareText', me.user), url: buildShareUrl() }).catch(() => {});
  });
  meId.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(me.user); showToast(t('idCopied')); }
    catch (e) { showToast(t('linkCopyFailed')); }
  });

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  qrDownloadBtn.addEventListener('click', () => {
    const img = qrCanvasWrap.querySelector('img') || qrCanvasWrap.querySelector('canvas');
    if (!img) { showToast(t('qrNotReady')); return; }
    const out = document.createElement('canvas');
    const W = 420, H = 500;
    out.width = W; out.height = H;
    const ctx = out.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#20153F');
    grad.addColorStop(1, '#170F2E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    const drawRest = (qrImgEl) => {
      const card = 260, cx = (W - card) / 2, cy = 64;
      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, cx, cy, card, card, 18);
      ctx.fill();
      ctx.drawImage(qrImgEl, cx + 16, cy + 16, card - 32, card - 32);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#F1ECFF';
      ctx.font = 'italic 600 24px Georgia, serif';
      ctx.fillText(me.user, W / 2, cy + card + 56);
      ctx.fillStyle = '#7C6AB0';
      ctx.font = '10px monospace';
      ctx.fillText('NEX · SINAL PARA SINAL', W / 2, H - 28);
      out.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `nex-${me.user}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(t('imageDownloaded'));
      });
    };
    if (img.tagName === 'CANVAS') { const tmp = new Image(); tmp.onload = () => drawRest(tmp); tmp.src = img.toDataURL(); }
    else if (img.complete) drawRest(img); else img.onload = () => drawRest(img);
  });

  // ---- verificar identidade ----
  async function openSafetyModal() {
    const conv = activeConv();
    if (!conv) return;
    safetySub.textContent = t('safetySub', displayName(conv));
    safetyModal.classList.add('show');
    if (!conv.pubStr) {
      safetyCodeDisplay.textContent = t('safetyNotYet');
      safetyCodeDisplay.classList.add('unavailable');
      return;
    }
    safetyCodeDisplay.classList.remove('unavailable');
    safetyCodeDisplay.textContent = '···· · ···· · ····';
    try { safetyCodeDisplay.textContent = await N.safetyCode(me.pubStr, conv.pubStr); }
    catch (e) { safetyCodeDisplay.textContent = t('safetyNotYet'); safetyCodeDisplay.classList.add('unavailable'); }
  }
  function closeSafetyModal() { safetyModal.classList.remove('show'); }
  safetyBtn.addEventListener('click', openSafetyModal);
  safetyModalClose.addEventListener('click', closeSafetyModal);
  safetyModal.addEventListener('click', (e) => { if (e.target === safetyModal) closeSafetyModal(); });

  // ---- imagem em tela cheia ----
  function openLightbox(url, name) {
    lightboxImg.src = url;
    lightboxImg.alt = name || '';
    lightboxCaption.textContent = name || '';
    lightbox.classList.add('show');
  }
  function closeLightbox() { lightbox.classList.remove('show'); lightboxImg.src = ''; }
  lightboxCloseBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  lightboxImg.addEventListener('click', closeLightbox);
  lightboxDownloadBtn.addEventListener('click', () => {
    if (!lightboxImg.src) return;
    const a = document.createElement('a');
    a.href = lightboxImg.src;
    a.download = lightboxImg.alt || 'imagem.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (lightbox.classList.contains('show')) closeLightbox();
    else if (addModal.classList.contains('show')) closeAddModal();
    else if (shareModal.classList.contains('show')) closeShareModal();
    else if (safetyModal.classList.contains('show')) closeSafetyModal();
    else if (!chatMenu.hidden) closeChatMenu();
  });

  // =====================================================================================
  //  SAIR, VISIBILIDADE, IDIOMA
  // =====================================================================================
  function teardownSession() {
    if (callState !== 'idle') hangupCall();
    if (mediaRecorder && mediaRecorder.state === 'recording') stopRecording(true);
    clearInterval(presenceTimer);
    convs.forEach((c) => { markAllTransfersInterrupted(c); if (c.conn) safeClose(c.conn); });
    requests.forEach((r) => safeClose(r.st.conn));
    clearSessionObjectUrls();
    if (peer) { try { peer.destroy(); } catch (e) { /* ignora */ } }
    N.clearSession();
  }

  logoutBtn.addEventListener('click', () => {
    if (!confirm(t('confirmLogout'))) return;
    teardownSession();
    location.href = location.pathname;
  });

  deleteAcctBtn.addEventListener('click', () => {
    if (!me) return;
    if (!confirm(t('confirmDeleteAccount', me.name, me.user))) return;
    const user = me.user;
    teardownSession();
    N.deleteAccount(user);
    me = null;
    location.href = location.pathname;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden || !me) return;
    const conv = activeConv();
    if (conv && conv.unread) { conv.unread = 0; renderSidebar(); }
    updateTitle();
    if (peer && peer.disconnected && !peer.destroyed) { try { peer.reconnect(); } catch (e) { /* ignora */ } }
    presenceTick();
  });

  N.onLangChange(() => {
    syncSecretToggleLabel();
    if (!me) return;
    setStatus(statusState, statusKey, ...statusArgs);
    msgInput.placeholder = pendingFile ? t('msgInputPlaceholderCaption') : t('msgInputPlaceholder');
    convs.forEach((c) => { if (c.emptyEl) c.emptyEl.querySelector('p').textContent = t('chatEmpty'); });
    renderSidebar();
    renderRequests();
    updateChatHeader();
    updateTitle();
  });

})();
