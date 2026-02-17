(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  const store = {
    get apiBase() { return localStorage.getItem("sory_api_base") || ""; },
    set apiBase(v) { localStorage.setItem("sory_api_base", v || ""); },
    get username() { return localStorage.getItem("sory_username") || ""; },
    set username(v) { localStorage.setItem("sory_username", v || ""); },
    get userSession() { return localStorage.getItem("sory_user_session") || ""; },
    set userSession(v) { localStorage.setItem("sory_user_session", v || ""); },
    get adminSession() { return localStorage.getItem("sory_admin_session") || ""; },
    set adminSession(v) { localStorage.setItem("sory_admin_session", v || ""); },
    get lastToken() { return localStorage.getItem("sory_last_token") || ""; },
    set lastToken(v) { localStorage.setItem("sory_last_token", v || ""); },
    get lastAdminCode() { return localStorage.getItem("sory_last_admin") || ""; },
    set lastAdminCode(v) { localStorage.setItem("sory_last_admin", v || ""); },
    clearAuth() {
      this.userSession = "";
      this.adminSession = "";
    }
  };

  function defaultApiBase() {
    const fromQuery = new URLSearchParams(window.location.search).get("api") || "";
    if (fromQuery) return fromQuery;
    if (store.apiBase) return store.apiBase;
    // If served from same host as API, origin works. If opened via file://, user must set.
    if (window.location.origin && window.location.origin !== "null") return window.location.origin;
    return "http://localhost:80";
  }

  async function api(path, opts) {
    opts = opts || {};
    const base = (opts.base || store.apiBase || defaultApiBase()).replace(/\/+$/, "");
    const url = base + path;
    const method = opts.method || "GET";
    const bearer = opts.bearer || "";
    const body = opts.body;
    const headers = {};
    if (bearer) headers["Authorization"] = "Bearer " + bearer;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!res.ok) {
      const e = new Error("http " + res.status);
      e.status = res.status;
      e.json = json;
      throw e;
    }
    return json;
  }

  function setJson(outId, obj) {
    const el = $(outId);
    if (!el) return;
    el.textContent = JSON.stringify(obj, null, 2);
  }

  function safeParseJSON(raw, fallback) {
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  function toSessionHash(text) {
    const s = String(text || "");
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function chatScopeKey() {
    const username = (store.username || "anon").trim().toLowerCase();
    const sess = store.userSession || "";
    const sessionHash = sess ? toSessionHash(sess) : "nosession";
    return `sory_chat_log::${username}::${sessionHash}`;
  }

  function loadChatHistory() {
    const key = chatScopeKey();
    return safeParseJSON(localStorage.getItem(key) || "[]", []);
  }

  function saveChatHistory(lines) {
    const key = chatScopeKey();
    localStorage.setItem(key, JSON.stringify(Array.isArray(lines) ? lines : []));
  }

  function toast(msg, obj) {
    const el = $("toast");
    if (!el) return;
    el.classList.add("show");
    $("toastTitle").textContent = msg;
    $("toastBody").textContent = obj ? JSON.stringify(obj, null, 2) : "";
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 4500);
  }

  function wireCommon() {
    const baseInput = $("apiBase");
    if (baseInput) {
      baseInput.value = defaultApiBase();
      store.apiBase = baseInput.value;
      baseInput.addEventListener("change", () => {
        store.apiBase = (baseInput.value || "").trim();
        toast("API base atualizada", { api_base: store.apiBase });
      });
    }

    const who = $("whoami");
    if (who) {
      const u = store.username || "-";
      const us = store.userSession ? "set" : "-";
      const as = store.adminSession ? "set" : "-";
      who.textContent = `user=${u} user_session=${us} admin_session=${as}`;
    }

    const btnLogout = $("btnLogout");
    if (btnLogout) {
      btnLogout.addEventListener("click", async () => {
        const user = store.userSession;
        const admin = store.adminSession;
        try { if (user) await api("/v1/auth/logout", { method: "POST", bearer: user }); } catch {}
        try { if (admin) await api("/v1/auth/logout", { method: "POST", bearer: admin }); } catch {}
        store.clearAuth();
        toast("Sessoes encerradas");
        location.reload();
      });
    }
  }

  function wireRegister() {
    const btn = $("btnRegister");
    if (!btn) return;

    $("regUsername").value = store.username || "";
    if ($("regEmail")) {
      $("regEmail").value = localStorage.getItem("sory_email") || "";
    }

    btn.addEventListener("click", async () => {
      const username = ($("regUsername").value || "").trim();
      const email = ($("regEmail") ? ($("regEmail").value || "").trim() : "");
      if (!username) { toast("Informe username"); return; }
      if (!email) { toast("Informe email"); return; }
      try {
        const out = await api("/v1/users/register", { method: "POST", body: { username, email } });
        setJson("out", out);
        store.username = out.username || username;
        store.lastToken = out.token || "";
        store.lastAdminCode = out.admin_code || "";
        localStorage.setItem("sory_email", out.email || email);
        localStorage.setItem("sory_user_id", out.id || "");
        localStorage.setItem("sory_recovery_token", out.recovery_token || "");
        $("token").textContent = out.token || "-";
        $("admin").textContent = out.admin_code || "-";
        if ($("recovery")) $("recovery").textContent = out.recovery_token || "-";
        toast("Usuario criado", { username: store.username });
      } catch (e) {
        setJson("out", e.json || { error: e.message });
        toast("Falha ao registrar", e.json || { error: e.message });
      }
    });
  }

  function wireLogin() {
    const btn = $("btnLogin");
    if (!btn) return;

    $("loginUsername").value = store.username || "";
    $("loginToken").value = store.lastToken || "";

    btn.addEventListener("click", async () => {
      const username = ($("loginUsername").value || "").trim();
      const token = ($("loginToken").value || "").trim();
      if (!username || !token) { toast("Informe username e token"); return; }
      try {
        const out = await api("/v1/auth/login", { method: "POST", body: { username, token } });
        setJson("out", out);
        store.username = username;
        store.userSession = out.session || "";
        toast("Login OK", { username });
      } catch (e) {
        setJson("out", e.json || { error: e.message });
        toast("Falha no login", e.json || { error: e.message });
      }
    });
  }

  function wireChat() {
    const btnChat = $("btnChat");
    const btnRun = $("btnRun");
    if (!btnChat && !btnRun) return;

    const chatUsername = $("chatUsername");
    const chatSession = $("chatSession");
    if (chatUsername) chatUsername.textContent = store.username || "-";
    if (chatSession) chatSession.textContent = store.userSession ? "set" : "-";

    hydrateChatLog();

    if (btnChat) {
      btnChat.addEventListener("click", async () => {
        const message = ($("chatMsg").value || "").trim();
        if (!message) { toast("Mensagem vazia"); return; }
        if (!store.userSession) { toast("Faca login antes"); return; }
        try {
          const out = await api("/v1/chat", { method: "POST", bearer: store.userSession, body: { message } });
          setJson("outChat", out);
          appendChat("user", message);
          appendChat("assistant", out.reply || "");
          if ($("chatMsg")) $("chatMsg").value = "";
        } catch (e) {
          setJson("outChat", e.json || { error: e.message });
          toast("Falha no chat", e.json || { error: e.message });
        }
      });
    }

    if (btnRun) {
      btnRun.addEventListener("click", async () => {
        const input = ($("runInput").value || "").trim();
        const turn_id = ($("runTurnID").value || "").trim();
        if (!input) { toast("Input vazio"); return; }
        if (!store.userSession) { toast("Faca login antes"); return; }
        try {
          const out = await api("/v1/run", { method: "POST", bearer: store.userSession, body: { input, turn_id } });
          setJson("outRun", out);
          maybeRunActions(out);
          toast("Run OK", { handled: out.handled, plugin: out.plugin });
        } catch (e) {
          setJson("outRun", e.json || { error: e.message });
          toast("Falha no run", e.json || { error: e.message });
        }
      });
    }

    function appendChat(role, text) {
      const box = $("chatLog");
      if (!box) return;
      const at = new Date().toISOString().replace("T", " ").slice(0, 19);
      const line = `[${at}] ${role.toUpperCase()}: ${text}`;
      const history = loadChatHistory();
      history.push(line);
      saveChatHistory(history);
      box.textContent = history.join("\n\n");
      box.scrollTop = box.scrollHeight;
    }

    function hydrateChatLog() {
      const box = $("chatLog");
      if (!box) return;
      const history = loadChatHistory();
      box.textContent = history.join("\n\n");
      box.scrollTop = box.scrollHeight;
    }

    function maybeRunActions(out) {
      try {
        const acts = (out && out.actions) ? out.actions : [];
        for (const a of acts) {
          if (!a || a.type !== "open_url" || !a.url) continue;
          // Open on the same device that made the request (browser).
          window.open(a.url, "_blank", "noopener,noreferrer");
        }
      } catch { /* best-effort */ }
    }
  }

  function wireAdmin() {
    const btnAdmin = $("btnAdminLogin");
    const btnList = $("btnPluginsList");
    const btnSet = $("btnPluginSet");
    const btnPresetsList = $("btnPresetsList");
    const btnPresetSave = $("btnPresetSave");
    const btnPresetLoad = $("btnPresetLoad");
    if (!btnAdmin && !btnList && !btnSet) return;

    $("adminCode").value = store.lastAdminCode || "";
    $("adminSession").textContent = store.adminSession ? "set" : "-";

    if (btnAdmin) {
      btnAdmin.addEventListener("click", async () => {
        const admin_code = ($("adminCode").value || "").trim().toUpperCase();
        if (admin_code.length !== 4) { toast("Admin code deve ter 4 letras"); return; }
        try {
          const out = await api("/v1/auth/admin_code", { method: "POST", body: { admin_code } });
          setJson("out", out);
          store.adminSession = out.session || "";
          store.username = out.username || store.username;
          $("adminSession").textContent = store.adminSession ? "set" : "-";
          toast("Admin OK", { username: store.username });
        } catch (e) {
          setJson("out", e.json || { error: e.message });
          toast("Falha admin", e.json || { error: e.message });
        }
      });
    }

    if (btnList) {
      btnList.addEventListener("click", async () => {
        if (!store.adminSession) { toast("Entre no admin antes"); return; }
        try {
          const out = await api("/v1/plugins", { bearer: store.adminSession });
          setJson("out", out);
          renderPlugins(out.plugins || []);
        } catch (e) {
          setJson("out", e.json || { error: e.message });
          toast("Falha ao listar", e.json || { error: e.message });
        }
      });
    }

    if (btnSet) {
      btnSet.addEventListener("click", async () => {
        if (!store.adminSession) { toast("Entre no admin antes"); return; }
        const plugin = ($("setPluginName").value || "").trim();
        const enabled = ($("setPluginEnabled").value || "true") === "true";
        if (!plugin) { toast("Informe plugin"); return; }
        try {
          const out = await api("/v1/admin/plugins/set", { method: "POST", bearer: store.adminSession, body: { plugin, enabled } });
          setJson("out", out);
          toast("Plugin atualizado", out);
        } catch (e) {
          setJson("out", e.json || { error: e.message });
          toast("Falha ao atualizar plugin", e.json || { error: e.message });
        }
      });
    }

    // Presets (userdb). These endpoints accept either user_session or admin_session.
    if (btnPresetsList) {
      btnPresetsList.addEventListener("click", async () => {
        const bearer = store.userSession || store.adminSession;
        if (!bearer) { toast("Faça login ou entre no admin antes"); return; }
        try {
          const out = await api("/v1/user/presets", { bearer });
          setJson("outPresets", out);
          toast("Presets listados", { count: (out.presets || []).length });
        } catch (e) {
          setJson("outPresets", e.json || { error: e.message });
          toast("Falha ao listar presets", e.json || { error: e.message });
        }
      });
    }

    function getPresetName() {
      const shortcut = ($("presetShortcut") && $("presetShortcut").value) ? $("presetShortcut").value.trim() : "";
      if (shortcut) return shortcut;
      return ($("presetName") ? $("presetName").value.trim() : "");
    }

    if (btnPresetSave) {
      btnPresetSave.addEventListener("click", async () => {
        const bearer = store.userSession || store.adminSession;
        if (!bearer) { toast("Faça login ou entre no admin antes"); return; }
        const name = getPresetName();
        if (!name) { toast("Informe nome do preset"); return; }
        try {
          const out = await api("/v1/user/presets/save", { method: "POST", bearer, body: { name } });
          setJson("outPresets", out);
          toast("Preset salvo", { name });
        } catch (e) {
          setJson("outPresets", e.json || { error: e.message });
          toast("Falha ao salvar preset", e.json || { error: e.message });
        }
      });
    }

    if (btnPresetLoad) {
      btnPresetLoad.addEventListener("click", async () => {
        const bearer = store.userSession || store.adminSession;
        if (!bearer) { toast("Faça login ou entre no admin antes"); return; }
        const name = getPresetName();
        if (!name) { toast("Informe nome do preset"); return; }
        try {
          const out = await api("/v1/user/presets/load", { method: "POST", bearer, body: { name } });
          setJson("outPresets", out);
          toast("Preset carregado", out);
        } catch (e) {
          setJson("outPresets", e.json || { error: e.message });
          toast("Falha ao carregar preset", e.json || { error: e.message });
        }
      });
    }

    function renderPlugins(items) {
      const wrap = $("pluginsWrap");
      if (!wrap) return;
      if (!items || items.length === 0) { wrap.innerHTML = "<div class='muted'>Nenhum plugin.</div>"; return; }
      const rows = items.map(p => {
        const name = esc(p.Name || "");
        const enabled = !!p.Enabled;
        const compat = !!p.Compatible;
        return `<tr>
          <td><code>${name}</code></td>
          <td>${enabled ? "true" : "false"}</td>
          <td>${Number(p.Priority || 0)}</td>
          <td>${compat ? "ok" : "bad"}</td>
          <td class="muted">${esc(p.CompatibilityNote || "")}</td>
        </tr>`;
      }).join("");
      wrap.innerHTML = `<table>
        <thead><tr><th>plugin</th><th>enabled</th><th>prio</th><th>compat</th><th>note</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    }

    function esc(s) {
      return String(s || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }
  }

  window.SoryWeb = { api, store };

  document.addEventListener("DOMContentLoaded", () => {
    // Ensure api base is always set once.
    if (!store.apiBase) store.apiBase = defaultApiBase();

    wireCommon();
    wireRegister();
    wireLogin();
    wireChat();
    wireAdmin();
  });
})();
