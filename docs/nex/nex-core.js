/* Nex — núcleo compartilhado (login, registro e app)
 * Identidade, criptografia, armazenamento local e traduções PT/EN.
 * Tudo roda no navegador: não existe servidor de contas. */
(function (root) {
  'use strict';

  const enc = new TextEncoder();
  const subtle = (root.crypto && root.crypto.subtle) || null;

  const PBKDF2_ITER = 200000;
  const EPOCH_S = 1735689600; // 2025-01-01 — o ID usa segundos desde essa data (curto, mas único no tempo)
  const USER_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32 (sem I, L, O, U)

  class NexError extends Error {
    constructor(code) { super(code); this.code = code; }
  }

  // ================= utilidades =================
  function randomBytes(n) {
    const b = new Uint8Array(n);
    root.crypto.getRandomValues(b);
    return b;
  }

  function toB64(buf) {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(s);
  }

  function fromB64(b64) {
    const s = atob(b64);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }

  function slugify(label) {
    return String(label || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function cleanName(v) {
    return String(v || '')
      .replace(/[\u0000-\u001f\u007f<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 24);
  }

  // ================= ID de usuário curto =================
  // formato: <apelido até 10 letras>-<segundos desde 2025 em base36><2 caracteres aleatórios>
  // ex.: ana-fk3a9z2x  — curto, legível, único (timestamp + aleatório) e válido como ID do PeerJS.
  function makeUserId(name) {
    const slug = slugify(name).slice(0, 10).replace(/-+$/g, '') || 'nx';
    const ts = Math.max(0, Math.floor(Date.now() / 1000) - EPOCH_S).toString(36);
    const r = randomBytes(2);
    const rnd = (r[0] % 36).toString(36) + (r[1] % 36).toString(36);
    return `${slug}-${ts}${rnd}`;
  }

  function isValidUserId(id) {
    return typeof id === 'string' && id.length >= 3 && id.length <= 40 && USER_RE.test(id);
  }

  // aceita um ID puro ou um link de convite (?add=ID)
  function parseUserInput(raw) {
    let s = String(raw || '').trim();
    try {
      if (/^https?:\/\//i.test(s)) {
        const u = new URL(s);
        const a = u.searchParams.get('add');
        if (a) s = a;
      }
    } catch (e) { /* segue com o texto original */ }
    s = s.toLowerCase().replace(/\s+/g, '-');
    return isValidUserId(s) ? s : null;
  }

  // ================= token secreto =================
  // 30 símbolos de 5 bits = 150 bits de entropia, em 6 grupos de 5: XXXXX-XXXXX-...
  function generateSecret() {
    const b = randomBytes(30);
    let s = '';
    for (let i = 0; i < 30; i++) s += B32[b[i] & 31];
    return s.match(/.{5}/g).join('-');
  }

  function normalizeSecret(s) {
    return String(s || '')
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, '')
      .replace(/O/g, '0')
      .replace(/[IL]/g, '1');
  }

  function isValidSecretNorm(n) {
    return /^[0-9A-HJKMNP-TV-Z]{30}$/.test(n);
  }

  function formatSecret(norm) {
    return norm.match(/.{1,5}/g).join('-');
  }

  // ================= armazenamento local =================
  const store = {
    get(k, def) {
      try { const v = root.localStorage.getItem(k); return v == null ? def : JSON.parse(v); }
      catch (e) { return def; }
    },
    set(k, v) {
      try { root.localStorage.setItem(k, JSON.stringify(v)); return true; }
      catch (e) { return false; }
    },
    del(k) { try { root.localStorage.removeItem(k); } catch (e) { /* ignora */ } }
  };

  // ================= criptografia =================
  function requireCrypto() {
    if (!subtle) throw new NexError('no-crypto');
  }

  function cleanPub(j) { return { crv: j.crv, kty: j.kty, x: j.x, y: j.y }; }
  function pubToString(j) { const c = cleanPub(j); return JSON.stringify({ crv: c.crv, kty: c.kty, x: c.x, y: c.y }); }

  function parsePub(str) {
    if (typeof str !== 'string' || str.length > 300) return null;
    try {
      const j = JSON.parse(str);
      if (!j || j.kty !== 'EC' || j.crv !== 'P-256' || typeof j.x !== 'string' || typeof j.y !== 'string' ||
          j.x.length !== 43 || j.y.length !== 43) return null;
      return cleanPub(j);
    } catch (e) { return null; }
  }

  async function generateIdentityKeys() {
    requireCrypto();
    const kp = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const pub = await subtle.exportKey('jwk', kp.publicKey);
    const priv = await subtle.exportKey('jwk', kp.privateKey);
    return { pub: cleanPub(pub), priv };
  }

  async function importSignKey(privJwk) {
    requireCrypto();
    return subtle.importKey('jwk', privJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  }

  async function sign(key, str) {
    return toB64(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(str)));
  }

  async function verify(pubStr, str, sigB64) {
    try {
      const pub = parsePub(pubStr);
      if (!pub || typeof sigB64 !== 'string' || sigB64.length > 200) return false;
      const key = await subtle.importKey('jwk', Object.assign({ ext: true }, pub),
        { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      return await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, fromB64(sigB64), enc.encode(str));
    } catch (e) { return false; }
  }

  // código de verificação estável, calculado das duas chaves públicas (igual nos dois lados)
  async function safetyCode(pubA, pubB) {
    requireCrypto();
    const combined = [pubA, pubB].sort().join('|');
    const hash = new Uint8Array(await subtle.digest('SHA-256', enc.encode('nex-safety-v1|' + combined)));
    const hex = Array.from(hash.subarray(0, 12), (b) => b.toString(16).padStart(2, '0').toUpperCase()).join('');
    const groups = hex.match(/.{4}/g); // 6 grupos de 4 = 96 bits
    return groups.slice(0, 3).join(' · ') + '\n' + groups.slice(3).join(' · ');
  }

  async function deriveAesKey(secretNorm, salt, iter, usage) {
    const base = await subtle.importKey('raw', enc.encode(secretNorm), 'PBKDF2', false, ['deriveKey']);
    return subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, usage);
  }

  async function encryptPrivate(privJwk, secretNorm) {
    requireCrypto();
    const salt = randomBytes(16), iv = randomBytes(12);
    const key = await deriveAesKey(secretNorm, salt, PBKDF2_ITER, ['encrypt']);
    const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(privJwk)));
    return { salt: toB64(salt), iv: toB64(iv), data: toB64(ct), iter: PBKDF2_ITER };
  }

  async function decryptPrivate(box, secretNorm) {
    requireCrypto();
    try {
      const key = await deriveAesKey(secretNorm, fromB64(box.salt), box.iter || PBKDF2_ITER, ['decrypt']);
      const pt = await subtle.decrypt({ name: 'AES-GCM', iv: fromB64(box.iv) }, key, fromB64(box.data));
      return JSON.parse(new TextDecoder().decode(pt));
    } catch (e) { throw new NexError('bad-secret'); }
  }

  // ================= contas =================
  function getAccounts() { return store.get('nex_accounts', {}); }

  function saveAccount(rec) {
    const a = getAccounts();
    a[rec.user] = rec;
    const ok = store.set('nex_accounts', a);
    store.set('nex_last_user', rec.user);
    return ok;
  }

  function lastUser() { return store.get('nex_last_user', ''); }

  // apaga uma conta e tudo que é dela neste aparelho (conta, contatos, histórico, bloqueados)
  function deleteAccount(user) {
    const ls = root.localStorage;
    const a = getAccounts();
    delete a[user];
    store.set('nex_accounts', a);
    if (lastUser() === user) store.del('nex_last_user');
    store.del('nex_contacts_' + user);
    store.del('nex_blocked_' + user);
    try {
      const prefix = 'nex_hist_' + user + '_';
      const doomed = [];
      for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && k.indexOf(prefix) === 0) doomed.push(k); }
      doomed.forEach((k) => ls.removeItem(k));
    } catch (e) { /* ignora */ }
    const sess = loadSession();
    if (sess && sess.user === user) clearSession();
  }

  // apaga TUDO que o Nex guardou neste aparelho (contas, contatos, históricos e preferências)
  function wipeAll() {
    try {
      const ls = root.localStorage, doomed = [];
      for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && /^(nex_|nexus_)/.test(k)) doomed.push(k); }
      doomed.forEach((k) => ls.removeItem(k));
    } catch (e) { /* ignora */ }
    try { root.sessionStorage.clear(); } catch (e) { /* ignora */ }
  }

  async function buildIdentity(user, name, pub, priv) {
    return { user, name, pub: cleanPub(pub), pubStr: pubToString(pub), signKey: await importSignKey(priv) };
  }

  // cria a conta: ID curto + token secreto + par de chaves. A chave privada fica cifrada com o token.
  async function createAccount(name) {
    requireCrypto();
    const displayName = cleanName(name);
    if (!displayName) throw new NexError('bad-name');
    const user = makeUserId(displayName);
    const secret = generateSecret();
    const keys = await generateIdentityKeys();
    const createdAt = Date.now();
    const record = {
      v: 1, user, name: displayName, createdAt, pub: keys.pub,
      enc: await encryptPrivate(keys.priv, normalizeSecret(secret))
    };
    const savedLocally = saveAccount(record);
    const backup = {
      format: 'nex-account', version: 1, user, name: displayName, createdAt,
      secret, publicKey: keys.pub, privateKey: keys.priv
    };
    return { user, name: displayName, secret, backup, savedLocally };
  }

  async function unlockAccount(userRaw, secretRaw) {
    requireCrypto();
    const user = String(userRaw || '').trim().toLowerCase();
    if (!isValidUserId(user)) throw new NexError('bad-id');
    const rec = getAccounts()[user];
    if (!rec) throw new NexError('no-account');
    const norm = normalizeSecret(secretRaw);
    if (!isValidSecretNorm(norm)) throw new NexError('bad-secret');
    const priv = await decryptPrivate(rec.enc, norm);
    return buildIdentity(rec.user, rec.name, rec.pub, priv);
  }

  async function importBackup(obj) {
    requireCrypto();
    if (!obj || obj.format !== 'nex-account') throw new NexError('bad-file');
    const user = String(obj.user || '').toLowerCase();
    if (!isValidUserId(user)) throw new NexError('bad-file');
    const norm = normalizeSecret(obj.secret);
    if (!isValidSecretNorm(norm)) throw new NexError('bad-file');
    const pub = obj.publicKey, priv = obj.privateKey;
    if (!pub || !priv || priv.kty !== 'EC' || priv.crv !== 'P-256' || typeof priv.d !== 'string' ||
        pub.x !== priv.x || pub.y !== priv.y || !parsePub(pubToString(pub))) throw new NexError('bad-file');
    // autoteste: a chave privada precisa mesmo corresponder à pública
    const key = await importSignKey(priv);
    const probe = await sign(key, 'nex-selftest');
    if (!(await verify(pubToString(pub), 'nex-selftest', probe))) throw new NexError('bad-file');
    const name = cleanName(obj.name) || user;
    saveAccount({
      v: 1, user, name, createdAt: Number(obj.createdAt) || Date.now(), pub: cleanPub(pub),
      enc: await encryptPrivate(priv, norm)
    });
    return { identity: await buildIdentity(user, name, pub, priv), secret: formatSecret(norm) };
  }

  // ================= sessão (dura só enquanto a aba estiver aberta) =================
  function saveSession(user, secret) {
    try { root.sessionStorage.setItem('nex_session', JSON.stringify({ user, secret })); } catch (e) { /* ignora */ }
  }
  function loadSession() {
    try { return JSON.parse(root.sessionStorage.getItem('nex_session') || 'null'); } catch (e) { return null; }
  }
  function clearSession() {
    try { root.sessionStorage.removeItem('nex_session'); } catch (e) { /* ignora */ }
  }

  // ================= i18n (PT / EN) =================
  const I18N = {
    pt: {
      brandTag: 'Sinal para Sinal',
      navHowItWorks: 'Como funciona',
      navLearnMore: 'O que é o Nex, como funciona e para que usar ↗',
      madeBy: 'Feito por',
      pageTitleLogin: 'Nex — Entrar',
      pageTitleRegister: 'Nex — Criar conta',
      pageTitleApp: 'Nex',
      copied: 'Copiado ✓',
      copyFailed: 'Não foi possível copiar automaticamente.',
      noCrypto: 'Este navegador não oferece a criptografia necessária. Use HTTPS (ou localhost) e um navegador atualizado.',

      // login
      loginEyebrow: 'Acesso',
      loginTitle: 'Entrar no Nex',
      loginSub: 'Use o ID e o token secreto da sua conta. Tudo fica neste aparelho — não existe servidor de contas.',
      tabToken: 'Token',
      tabFile: 'Arquivo .json',
      labelUserId: 'Seu ID',
      labelSecret: 'Token secreto',
      placeholderUserId: 'ex: ana-fk3a9z2x',
      placeholderSecret: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
      btnLogin: 'Entrar',
      btnShow: 'Mostrar',
      btnHide: 'Ocultar',
      labelAccountsHere: 'Contas neste aparelho',
      noAccountsHere: 'Nenhuma conta neste aparelho ainda. Crie uma conta ou importe seu arquivo .json.',
      fileHint: 'Escolha o arquivo .json que você baixou ao criar a conta. Ele traz o ID, o token e as chaves — serve para entrar em um aparelho novo.',
      btnChooseFile: 'Escolher arquivo .json',
      linkCreate: 'Ainda não tem conta? Criar conta',
      loginUnlocking: 'Abrindo sua conta…',
      loginErrNoAccount: 'Não há conta com esse ID neste aparelho. Importe o arquivo .json.',
      loginErrBadSecret: 'Token incorreto.',
      loginErrBadId: 'ID inválido.',
      loginErrFile: 'Arquivo inválido ou corrompido.',

      // registro
      regEyebrow: 'Nova conta',
      regTitle: 'Criar sua conta',
      regSub: 'Escolha um nome. Vamos gerar seu ID curto (para os amigos te acharem) e um token secreto (a sua senha).',
      labelDisplayName: 'Nome de exibição',
      placeholderName: 'ex: Ana',
      btnCreate: 'Criar conta',
      regCreating: 'Gerando chaves…',
      regNameRequired: 'Digite um nome (até 24 caracteres).',
      regYourId: 'Seu ID — compartilhe com os amigos',
      regYourSecret: 'Token secreto — só você deve ter',
      btnCopyId: 'Copiar ID',
      btnCopySecret: 'Copiar token',
      btnDownloadJson: 'Baixar arquivo .json',
      jsonDownloaded: 'Arquivo baixado.',
      themeToLight: 'Mudar para o tema claro',
      themeToDark: 'Mudar para o tema escuro',
      voiceSpeed: 'Velocidade do áudio',
      pageTitleAbout: 'Nex — Sobre',
      navEnter: 'Entrar',
      aboutEyebrow: 'SOBRE O NEX',
      aboutCtaCreate: 'Criar conta',
      aboutCtaLogin: 'Já tenho conta',
      confirmDeleteAccount: (n, u) => `Apagar a conta "${n}" (${u}) deste aparelho?\n\nIsso remove a conta, os contatos e as conversas daqui. Sem o arquivo .json você NÃO conseguirá entrar de novo. Não dá para desfazer.`,
      confirmWipeAll: 'Apagar TODOS os dados do Nex neste aparelho?\n\nContas, contatos, conversas e preferências serão removidos. Sem os arquivos .json não há como recuperar as contas. Não dá para desfazer.',
      accountDeleted: 'Conta apagada deste aparelho.',
      allWiped: 'Todos os dados do Nex foram apagados.',
      btnDeleteAccount: 'Apagar conta deste aparelho',
      btnWipeAll: 'Apagar todos os dados deste aparelho',
      btnRemoveAcct: 'Remover esta conta do aparelho',
      peerRejectedKey: 'A chave deste contato mudou ou a verificação falhou. Confira o código de segurança antes de continuar.',
      fileNeedsOnline: 'O contato precisa estar online para enviar arquivos.',
      regWarn: 'Guarde o arquivo em um lugar seguro. Quem tiver o token controla a sua conta, e se você perdê-lo não há como recuperar — não existe servidor com cópia.',
      regNotSavedLocally: 'Atenção: este navegador não conseguiu guardar a conta localmente (modo privado?). O arquivo .json é a única cópia.',
      regConfirm: 'Guardei o arquivo e o token',
      btnEnterNow: 'Entrar agora',
      regHaveAccount: 'Já tenho conta — entrar',

      // app: geral
      statusEstablishing: 'estabelecendo identidade',
      statusEstablishingRetry: (n) => `estabelecendo identidade (tentativa ${n})...`,
      statusOnline: 'online',
      statusIdBusy: (n) => `ID em uso — tentando de novo (${n})...`,
      statusIdBusyFinal: 'Esta conta já está aberta em outro lugar. Feche a outra aba e entre de novo.',
      statusNoResponse: 'sem resposta dos servidores — verifique sua conexão',
      statusUnstable: 'sinal instável — tentando religar',
      statusReconnecting: 'reconectando ao relay...',
      toastNoIdentity: 'Não foi possível conectar à rede de sinalização. Verifique sua internet.',
      btnLogout: 'Sair',
      confirmLogout: 'Sair desta conta? Seus contatos e conversas continuam salvos neste aparelho.',
      searchPlaceholder: 'Buscar contatos…',
      sideEmptyTitle: 'Sua agenda está vazia',
      sideEmptySub: 'Adicione um amigo pelo ID dele, ou compartilhe o seu.',
      btnAddContact: 'Adicionar contato',
      btnShareMe: 'Compartilhar meu ID',
      placeholderChatTitle: 'Escolha uma conversa',
      placeholderChatSub: 'As mensagens vão direto de um navegador ao outro. Quando o contato está offline, elas ficam na fila e saem quando ele voltar.',
      myIdLabel: 'Seu ID',
      idCopied: 'ID copiado.',

      // contatos
      addEyebrow: 'Agenda',
      addTitle: 'Adicionar contato',
      addSub: 'Digite o ID do seu amigo (ou cole o link de convite dele).',
      labelFriendId: 'ID do contato',
      placeholderFriendId: 'ex: bia-fk3b1c7q',
      labelFriendNick: 'Apelido (opcional)',
      placeholderFriendNick: 'como você quer chamá-lo',
      btnAdd: 'Adicionar',
      addErrInvalid: 'ID inválido. Confira com o seu amigo.',
      addErrSelf: 'Esse é o seu próprio ID.',
      addErrBlocked: 'Esse contato está bloqueado. Desbloqueie antes de adicionar.',
      addedToast: (n) => `${n} adicionado à agenda.`,
      alreadyContact: 'Já está na sua agenda — abrindo a conversa.',
      shareEyebrow: 'Compartilhar',
      shareTitle: 'Seu ID em QR',
      shareSub: 'Quem escanear este código (ou abrir o link) vai direto para a tela de adicionar você.',
      qrScanHint: 'Escaneie para me adicionar',
      btnCopyLink: 'Copiar link',
      btnDownloadImg: 'Baixar imagem',
      btnShareNative: 'Compartilhar…',
      linkCopied: 'Link copiado.',
      linkCopyFailed: 'Não foi possível copiar automaticamente.',
      qrNotReady: 'QR ainda não está pronto.',
      imageDownloaded: 'Imagem baixada.',
      shareText: (n) => `Fale comigo no Nex — meu ID é ${n}`,
      idFromLink: 'ID preenchido a partir do link.',

      // pedidos de conversa
      requestsTitle: 'Pedidos de conversa',
      requestWants: (n) => `${n} quer conversar com você`,
      btnAccept: 'Aceitar',
      btnIgnore: 'Ignorar',
      btnBlock: 'Bloquear',
      requestToast: (n) => `Novo pedido de conversa: ${n}`,
      blockedToast: 'Contato bloqueado.',

      // conversa
      chatEmpty: 'Nenhuma mensagem ainda. Diga a primeira palavra — ou arraste um arquivo aqui.',
      stateOnline: 'online',
      stateConnecting: 'conectando…',
      stateOffline: 'offline — mensagens ficam na fila',
      stateTyping: 'digitando…',
      typingShort: 'digitando…',
      msgInputPlaceholder: 'Escreva sua mensagem...',
      msgInputPlaceholderCaption: 'Adicione uma legenda (opcional) e envie...',
      btnSend: 'Enviar',
      dropHere: 'Solte para enviar',
      previewFile: (n) => `Arquivo: ${n}`,
      previewVoice: 'Mensagem de voz',
      menuRename: 'Renomear contato',
      menuVerify: 'Verificar identidade',
      menuResetKey: 'Redefinir chave verificada',
      menuClear: 'Limpar conversa',
      menuRemove: 'Remover contato',
      renamePrompt: 'Novo apelido para este contato:',
      confirmClear: 'Apagar o histórico desta conversa neste aparelho?',
      confirmRemove: 'Remover este contato e a conversa deste aparelho?',
      confirmResetKey: 'Aceitar a próxima chave que este contato apresentar? Faça isso só se ele confirmar que mudou de aparelho.',
      keyResetDone: 'Chave redefinida. Na próxima conexão, a nova chave será registrada.',
      keyPinned: 'Chave deste contato registrada. Compare o código de verificação (escudo) por outro meio.',
      keyChanged: (n) => `A chave de ${n} mudou. A conexão foi bloqueada — pode ser alguém se passando por ele.`,
      keyChangedToast: (n) => `Alerta: a chave de ${n} mudou. Conexão bloqueada.`,
      removedToast: 'Contato removido.',
      clearedToast: 'Conversa limpa.',
      channelNotOpen: 'O contato está offline. A mensagem entrou na fila.',
      callNeedsOnline: 'O contato precisa estar online para chamadas.',

      // verificação
      safetyEyebrow: 'Segurança',
      safetyTitle: 'Verificar identidade',
      safetySub: (n) => `Este código nasce das chaves públicas suas e de ${n}. Leiam em voz alta — por telefone ou pessoalmente, por qualquer meio diferente deste chat. Se forem idênticos, ninguém se passou por ele.`,
      safetyHint: 'O código só muda se uma das chaves mudar.',
      safetyNotYet: 'Ainda não houve conexão com este contato — não há chave para verificar.',

      // áudio / chamadas
      recHintCancel: 'solte para cancelar ↑',
      recHintCancelNow: 'solte agora para cancelar',
      micAccessDenied: 'Não foi possível acessar o microfone.',
      callCameraPermissionDenied: 'Não foi possível acessar a câmera.',
      callCalling: 'Chamando...',
      callIncomingVoice: 'Chamada de voz',
      callIncomingVideo: 'Chamada de vídeo',
      callConnecting: 'Conectando...',
      callNoAnswer: 'Sem resposta.',
      callNeedsHttps: 'Chamadas só funcionam em conexão segura (HTTPS). Testando celular e PC juntos? Use um endereço https:// ou uma ferramenta de túnel — um IP local (http://192.168...) bloqueia câmera e microfone.',
      callConnectionFailed: 'Não foi possível conectar a chamada — a rede de um dos lados pode estar bloqueando. Tente novamente.',
      recordingCancelled: 'Gravação cancelada.',
      audioTooLong: (size) => `Áudio muito longo (${size}). Grave algo mais curto.`,
      audioPlayFailed: 'Não foi possível tocar o áudio.',

      // arquivos
      fileTooLarge: (size, max) => `Arquivo muito grande (${size}). Limite de ${max}.`,
      textTooLong: (max) => `Mensagem muito longa. Limite de ${max} caracteres.`,
      peerCancelledSend: 'A outra pessoa cancelou o envio.',
      youCancelledSend: 'Você cancelou o envio.',
      btnCancelTransfer: 'Cancelar envio',
      btnReceiveFile: 'Receber arquivo',
      btnSaveReceive: 'Escolher local e receber',
      btnRejectTransfer: 'Recusar',
      btnRetryTransfer: 'Tentar novamente',
      btnDownloadFile: 'Baixar arquivo',
      transferWaitingAcceptance: 'Aguardando aceite do destinatário…',
      transferChooseLocation: 'Arquivo grande: escolha onde salvar para receber sem usar a memória da aba.',
      transferDiskUnsupported: 'Este navegador não permite salvar arquivos grandes progressivamente. Limite seguro nesta plataforma: 32 MB.',
      transferRejected: 'Transferência recusada.',
      transferAwaitingConfirmation: 'Verificando integridade no destinatário…',
      transferVerified: 'Entregue e verificado por SHA-256',
      transferHashMismatch: 'A verificação SHA-256 falhou — o arquivo foi descartado.',
      transferSavedToDevice: 'Recebido, verificado e salvo no dispositivo.',
      transferTimedOut: 'Tempo esgotado aguardando confirmação.',
      transferInvalidData: 'Transferência bloqueada por dados inválidos.',
      transferIncomplete: 'Transferência incompleta — tente reenviar.',
      sendingProgress: 'Enviando…',
      receivingProgress: 'Recebendo…',
      transferInterrupted: 'Envio interrompido — canal fechado.',
      transferSendFailed: 'Falha no envio.',
      transferReadError: 'Erro ao ler o arquivo.',

      // PWA
      installTitle: 'Instalar o Nex',
      installSub: 'Abra como app, direto da tela inicial.',
      installDismiss: 'Agora não',
      installConfirm: 'Instalar',
      installedToast: 'Nex instalado. Encontre o app na sua tela inicial.'
    },
    en: {
      brandTag: 'Signal to Signal',
      navHowItWorks: 'How it works',
      navLearnMore: 'What Nex is, how it works, and what to use it for ↗',
      madeBy: 'Made by',
      pageTitleLogin: 'Nex — Sign in',
      pageTitleRegister: 'Nex — Create account',
      pageTitleApp: 'Nex',
      copied: 'Copied ✓',
      copyFailed: 'Could not copy automatically.',
      noCrypto: 'This browser lacks the required cryptography. Use HTTPS (or localhost) and an up-to-date browser.',

      loginEyebrow: 'Access',
      loginTitle: 'Sign in to Nex',
      loginSub: 'Use your account ID and secret token. Everything stays on this device — there is no account server.',
      tabToken: 'Token',
      tabFile: '.json file',
      labelUserId: 'Your ID',
      labelSecret: 'Secret token',
      placeholderUserId: 'e.g. ana-fk3a9z2x',
      placeholderSecret: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
      btnLogin: 'Sign in',
      btnShow: 'Show',
      btnHide: 'Hide',
      labelAccountsHere: 'Accounts on this device',
      noAccountsHere: 'No accounts on this device yet. Create an account or import your .json file.',
      fileHint: 'Choose the .json file you downloaded when creating the account. It holds the ID, token and keys — use it to sign in on a new device.',
      btnChooseFile: 'Choose .json file',
      linkCreate: "Don't have an account yet? Create one",
      loginUnlocking: 'Opening your account…',
      loginErrNoAccount: 'No account with this ID on this device. Import your .json file.',
      loginErrBadSecret: 'Wrong token.',
      loginErrBadId: 'Invalid ID.',
      loginErrFile: 'Invalid or corrupted file.',

      regEyebrow: 'New account',
      regTitle: 'Create your account',
      regSub: "Pick a name. We'll generate your short ID (so friends can find you) and a secret token (your password).",
      labelDisplayName: 'Display name',
      placeholderName: 'e.g. Ana',
      btnCreate: 'Create account',
      regCreating: 'Generating keys…',
      regNameRequired: 'Enter a name (up to 24 characters).',
      regYourId: 'Your ID — share it with friends',
      regYourSecret: 'Secret token — for your eyes only',
      btnCopyId: 'Copy ID',
      btnCopySecret: 'Copy token',
      btnDownloadJson: 'Download .json file',
      jsonDownloaded: 'File downloaded.',
      themeToLight: 'Switch to light theme',
      themeToDark: 'Switch to dark theme',
      voiceSpeed: 'Audio speed',
      pageTitleAbout: 'Nex — About',
      navEnter: 'Sign in',
      aboutEyebrow: 'ABOUT NEX',
      aboutCtaCreate: 'Create account',
      aboutCtaLogin: 'I already have an account',
      confirmDeleteAccount: (n, u) => `Delete the account "${n}" (${u}) from this device?\n\nThis removes the account, contacts and chats from here. Without the .json file you will NOT be able to sign in again. This cannot be undone.`,
      confirmWipeAll: 'Delete ALL Nex data on this device?\n\nAccounts, contacts, chats and preferences will be removed. Without the .json files there is no way to recover the accounts. This cannot be undone.',
      accountDeleted: 'Account deleted from this device.',
      allWiped: 'All Nex data has been deleted.',
      btnDeleteAccount: 'Delete account from this device',
      btnWipeAll: 'Delete all data on this device',
      btnRemoveAcct: 'Remove this account from the device',
      peerRejectedKey: 'This contact\'s key changed or verification failed. Check the safety code before continuing.',
      fileNeedsOnline: 'The contact must be online to send files.',
      regWarn: 'Keep the file somewhere safe. Whoever has the token controls your account, and if you lose it there is no way to recover it — no server keeps a copy.',
      regNotSavedLocally: 'Heads up: this browser could not store the account locally (private mode?). The .json file is the only copy.',
      regConfirm: 'I saved the file and the token',
      btnEnterNow: 'Enter now',
      regHaveAccount: 'I already have an account — sign in',

      statusEstablishing: 'establishing identity',
      statusEstablishingRetry: (n) => `establishing identity (attempt ${n})...`,
      statusOnline: 'online',
      statusIdBusy: (n) => `ID in use — retrying (${n})...`,
      statusIdBusyFinal: 'This account is already open somewhere else. Close the other tab and sign in again.',
      statusNoResponse: 'no response from servers — check your connection',
      statusUnstable: 'unstable signal — reconnecting',
      statusReconnecting: 'reconnecting to relay...',
      toastNoIdentity: 'Could not reach the signaling network. Check your internet.',
      btnLogout: 'Sign out',
      confirmLogout: 'Sign out of this account? Your contacts and chats stay saved on this device.',
      searchPlaceholder: 'Search contacts…',
      sideEmptyTitle: 'Your contact list is empty',
      sideEmptySub: "Add a friend by their ID, or share yours.",
      btnAddContact: 'Add contact',
      btnShareMe: 'Share my ID',
      placeholderChatTitle: 'Pick a conversation',
      placeholderChatSub: "Messages go straight from one browser to the other. When a contact is offline, they wait in a queue and go out when they're back.",
      myIdLabel: 'Your ID',
      idCopied: 'ID copied.',

      addEyebrow: 'Contacts',
      addTitle: 'Add contact',
      addSub: "Type your friend's ID (or paste their invite link).",
      labelFriendId: 'Contact ID',
      placeholderFriendId: 'e.g. bia-fk3b1c7q',
      labelFriendNick: 'Nickname (optional)',
      placeholderFriendNick: 'what you want to call them',
      btnAdd: 'Add',
      addErrInvalid: 'Invalid ID. Check it with your friend.',
      addErrSelf: 'That is your own ID.',
      addErrBlocked: 'This contact is blocked. Unblock before adding.',
      addedToast: (n) => `${n} added to your contacts.`,
      alreadyContact: 'Already in your contacts — opening the chat.',
      shareEyebrow: 'Share',
      shareTitle: 'Your ID as QR',
      shareSub: 'Whoever scans this code (or opens the link) goes straight to the screen to add you.',
      qrScanHint: 'Scan to add me',
      btnCopyLink: 'Copy link',
      btnDownloadImg: 'Download image',
      btnShareNative: 'Share…',
      linkCopied: 'Link copied.',
      linkCopyFailed: 'Could not copy automatically.',
      qrNotReady: 'QR is not ready yet.',
      imageDownloaded: 'Image downloaded.',
      shareText: (n) => `Talk to me on Nex — my ID is ${n}`,
      idFromLink: 'ID filled in from the link.',

      requestsTitle: 'Chat requests',
      requestWants: (n) => `${n} wants to chat with you`,
      btnAccept: 'Accept',
      btnIgnore: 'Ignore',
      btnBlock: 'Block',
      requestToast: (n) => `New chat request: ${n}`,
      blockedToast: 'Contact blocked.',

      chatEmpty: 'No messages yet. Say the first word — or drop a file here.',
      stateOnline: 'online',
      stateConnecting: 'connecting…',
      stateOffline: 'offline — messages wait in the queue',
      stateTyping: 'typing…',
      typingShort: 'typing…',
      msgInputPlaceholder: 'Write your message...',
      msgInputPlaceholderCaption: 'Add a caption (optional) and send...',
      btnSend: 'Send',
      dropHere: 'Drop to send',
      previewFile: (n) => `File: ${n}`,
      previewVoice: 'Voice message',
      menuRename: 'Rename contact',
      menuVerify: 'Verify identity',
      menuResetKey: 'Reset verified key',
      menuClear: 'Clear chat',
      menuRemove: 'Remove contact',
      renamePrompt: 'New nickname for this contact:',
      confirmClear: "Delete this chat's history on this device?",
      confirmRemove: 'Remove this contact and chat from this device?',
      confirmResetKey: 'Accept the next key this contact presents? Only do this if they confirm they changed devices.',
      keyResetDone: 'Key reset. On the next connection, the new key will be recorded.',
      keyPinned: "This contact's key was recorded. Compare the verification code (shield) through another channel.",
      keyChanged: (n) => `${n}'s key changed. The connection was blocked — someone may be impersonating them.`,
      keyChangedToast: (n) => `Alert: ${n}'s key changed. Connection blocked.`,
      removedToast: 'Contact removed.',
      clearedToast: 'Chat cleared.',
      channelNotOpen: 'The contact is offline. The message was queued.',
      callNeedsOnline: 'The contact must be online for calls.',

      safetyEyebrow: 'Security',
      safetyTitle: 'Verify identity',
      safetySub: (n) => `This code comes from your public keys and ${n}'s. Read it out loud — by phone or in person, through any channel other than this chat. If they match, nobody is impersonating them.`,
      safetyHint: 'The code only changes if one of the keys changes.',
      safetyNotYet: 'No connection with this contact yet — there is no key to verify.',

      recHintCancel: 'release to cancel ↑',
      recHintCancelNow: 'release now to cancel',
      micAccessDenied: 'Could not access the microphone.',
      callCameraPermissionDenied: 'Could not access the camera.',
      callCalling: 'Calling...',
      callIncomingVoice: 'Voice call',
      callIncomingVideo: 'Video call',
      callConnecting: 'Connecting...',
      callNoAnswer: 'No answer.',
      callNeedsHttps: 'Calls only work over a secure connection (HTTPS). Testing phone and computer together? Use an https:// address or a tunneling tool — a local IP (http://192.168...) blocks camera and microphone.',
      callConnectionFailed: "Couldn't connect the call — one side's network may be blocking it. Please try again.",
      recordingCancelled: 'Recording cancelled.',
      audioTooLong: (size) => `Audio too long (${size}). Record something shorter.`,
      audioPlayFailed: 'Could not play the audio.',

      fileTooLarge: (size, max) => `File too large (${size}). Limit is ${max}.`,
      textTooLong: (max) => `Message too long. Limit is ${max} characters.`,
      peerCancelledSend: 'The other person cancelled the transfer.',
      youCancelledSend: 'You cancelled the transfer.',
      btnCancelTransfer: 'Cancel transfer',
      btnReceiveFile: 'Receive file',
      btnSaveReceive: 'Choose location and receive',
      btnRejectTransfer: 'Reject',
      btnRetryTransfer: 'Try again',
      btnDownloadFile: 'Download file',
      transferWaitingAcceptance: 'Waiting for recipient approval…',
      transferChooseLocation: 'Large file: choose where to save it so the tab does not hold it in memory.',
      transferDiskUnsupported: 'This browser cannot save large files progressively. Safe limit on this platform: 32 MB.',
      transferRejected: 'Transfer rejected.',
      transferAwaitingConfirmation: 'Verifying integrity on the recipient…',
      transferVerified: 'Delivered and verified with SHA-256',
      transferHashMismatch: 'SHA-256 verification failed — the file was discarded.',
      transferSavedToDevice: 'Received, verified, and saved to the device.',
      transferTimedOut: 'Timed out waiting for confirmation.',
      transferInvalidData: 'Transfer blocked because it contained invalid data.',
      transferIncomplete: 'Incomplete transfer — try sending again.',
      sendingProgress: 'Sending…',
      receivingProgress: 'Receiving…',
      transferInterrupted: 'Transfer interrupted — channel closed.',
      transferSendFailed: 'Send failed.',
      transferReadError: 'Error reading the file.',

      installTitle: 'Install Nex',
      installSub: 'Open it as an app, right from your home screen.',
      installDismiss: 'Not now',
      installConfirm: 'Install',
      installedToast: 'Nex installed. Find the app on your home screen.'
    }
  };

  function detectLang() {
    try {
      const saved = root.localStorage.getItem('nexus_lang'); // chave mantida p/ não perder a preferência já salva
      if (saved === 'pt' || saved === 'en') return saved;
    } catch (e) { /* ignora */ }
    const nav = ((root.navigator && root.navigator.language) || 'en').toLowerCase();
    return nav.startsWith('pt') ? 'pt' : 'en';
  }

  let currentLang = detectLang();

  function t(key, ...args) {
    const entry = (I18N[currentLang] && I18N[currentLang][key] !== undefined) ? I18N[currentLang][key] : I18N.en[key];
    return typeof entry === 'function' ? entry(...args) : entry;
  }

  function applyTranslations() {
    const doc = root.document;
    if (!doc) return;
    doc.documentElement.lang = currentLang === 'pt' ? 'pt-BR' : 'en';
    const titleKey = doc.documentElement.getAttribute('data-title-key');
    if (titleKey) doc.title = t(titleKey);
    doc.querySelectorAll('[data-i18n]').forEach((node) => {
      const v = t(node.getAttribute('data-i18n'));
      if (v === undefined) return;
      if (node.hasAttribute('data-i18n-html')) node.innerHTML = v; else node.textContent = v;
    });
    doc.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const v = t(node.getAttribute('data-i18n-placeholder'));
      if (v !== undefined) node.setAttribute('placeholder', v);
    });
    doc.querySelectorAll('[data-i18n-title]').forEach((node) => {
      const v = t(node.getAttribute('data-i18n-title'));
      if (v !== undefined) { node.setAttribute('title', v); node.setAttribute('aria-label', v); }
    });
    doc.querySelectorAll('#langToggle,[data-lang-toggle]').forEach((tog) => {
      tog.textContent = currentLang === 'pt' ? 'EN' : 'PT'; // mostra o idioma para o qual vai trocar
    });
  }

  const langListeners = [];
  function toggleLang() {
    currentLang = currentLang === 'pt' ? 'en' : 'pt';
    try { root.localStorage.setItem('nexus_lang', currentLang); } catch (e) { /* ignora */ }
    applyTranslations();
    langListeners.forEach((fn) => { try { fn(currentLang); } catch (e) { /* ignora */ } });
  }
  function onLangChange(fn) { langListeners.push(fn); }


  // ---------- tema claro / escuro ----------
  const THEME_KEY = 'nex_theme';
  const SVG_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
  const SVG_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  function systemTheme() {
    try { return root.matchMedia && root.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; } catch (e) { return 'dark'; }
  }
  function theme() {
    const saved = store.get(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : systemTheme();
  }
  function paintTheme() {
    const doc = root.document;
    if (!doc) return;
    const cur = theme();
    doc.documentElement.setAttribute('data-theme', cur);
    const meta = doc.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', cur === 'light' ? '#F5F2FB' : '#0A0812');
    const label = t(cur === 'light' ? 'themeToDark' : 'themeToLight');
    doc.querySelectorAll('[data-theme-toggle]').forEach((b) => {
      b.innerHTML = cur === 'light' ? SVG_MOON : SVG_SUN;
      b.title = label; b.setAttribute('aria-label', label);
    });
  }
  function toggleTheme() {
    store.set(THEME_KEY, theme() === 'light' ? 'dark' : 'light');
    paintTheme();
  }

  function initPage() {
    const doc = root.document;
    if (!doc) return;
    applyTranslations();
    paintTheme();
    doc.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', toggleTheme));
    onLangChange(paintTheme);
    doc.querySelectorAll('#langToggle,[data-lang-toggle]').forEach((tog) => tog.addEventListener('click', toggleLang));
    const setVh = () => doc.documentElement.style.setProperty('--vh', (root.innerHeight * 0.01) + 'px');
    setVh();
    root.addEventListener('resize', setVh);
    root.addEventListener('orientationchange', setVh);
  }

  root.Nex = {
    NexError, USER_RE, EPOCH_S,
    randomBytes, toB64, fromB64, slugify, cleanName,
    makeUserId, isValidUserId, parseUserInput,
    generateSecret, normalizeSecret, isValidSecretNorm, formatSecret,
    store,
    cleanPub, pubToString, parsePub,
    sign, verify, safetyCode,
    getAccounts, lastUser, createAccount, unlockAccount, importBackup,
    saveSession, loadSession, clearSession, deleteAccount, wipeAll,
    t, applyTranslations, toggleLang, onLangChange, initPage, theme, toggleTheme,
    get lang() { return currentLang; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
