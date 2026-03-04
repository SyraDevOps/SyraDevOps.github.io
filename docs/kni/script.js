function resolveApiBase() {
  const DEFAULT_API_BASE = "https://store.syradevops.com";
  const explicitWindow = String(window.KNIMODAS_API_BASE || "").trim();
  const explicitStorage = String(localStorage.getItem("knimodas_api_base") || "").trim();
  const selected = explicitWindow || explicitStorage;
  if (selected) return selected.replace(/\/+$/, "");

  if (location.protocol === "file:") return "http://localhost:8080";

  const host = String(location.hostname || "").toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    if (String(location.port || "") !== "8080") return "http://localhost:8080";
  }
  return DEFAULT_API_BASE;
}

const API_BASE_ACCOUNT = resolveApiBase();
const authCard = document.getElementById("auth-card");
const accountCard = document.getElementById("account-card");
const authStatus = document.getElementById("auth-status");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const adminPanelLink = document.getElementById("admin-panel-link");

let token = localStorage.getItem("auth_token") || "";

function formatBRL(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR");
}

function setStatus(msg, isError = false, isOk = false) {
  if (!authStatus) return;
  authStatus.textContent = msg;
  authStatus.className = isError ? "notice err" : isOk ? "notice ok" : "notice";
}

function emitAuthChanged() {
  window.dispatchEvent(new Event("auth:changed"));
}

async function api(path, method = "GET", body = null, withAuth = false) {
  const headers = { "Content-Type": "application/json" };
  if (withAuth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_ACCOUNT}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro na requisicao");
  return data;
}

function showLoggedIn() {
  authCard?.classList.add("hidden");
  accountCard?.classList.remove("hidden");
}

function showLoggedOut() {
  accountCard?.classList.add("hidden");
  authCard?.classList.remove("hidden");
  adminPanelLink?.classList.add("hidden");
}

function setField(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setupTabs() {
  const tabs = Array.from(document.querySelectorAll("[data-account-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-account-panel]"));
  if (!tabs.length || !panels.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const key = tab.getAttribute("data-account-tab");
      tabs.forEach((it) => it.classList.toggle("active", it === tab));
      panels.forEach((p) => {
        p.classList.toggle("hidden", p.getAttribute("data-account-panel") !== key);
      });
    });
  });
}

function renderOrders(orders) {
  const target = document.getElementById("orders-list");
  if (!target) return;

  if (!orders || orders.length === 0) {
    target.innerHTML = `<p class="notice">Voce ainda nao possui pedidos.</p>`;
    return;
  }

  target.innerHTML = orders
    .map((o) => {
      const items = (o.items || [])
        .map(
          (it) =>
            `<div>${it.quantity}x ${it.product_name} (${it.size}/${it.color}) - ${formatBRL(it.line_total)}</div>`,
        )
        .join("");

      return `
        <article class="order-card">
          <div class="order-head">
            <strong>Pedido #${o.id}</strong>
            <span class="badge subtle">${o.status || "created"}</span>
          </div>
          <div class="order-head">
            <span>${formatDate(o.created_at)}</span>
            <strong>${formatBRL(o.total)}</strong>
          </div>
          <div class="order-items">${items}</div>
        </article>
      `;
    })
    .join("");
}

async function refreshAccountData() {
  if (!token) return;

  const [me, myOrders] = await Promise.all([api("/users/me", "GET", null, true), api("/users/me/orders", "GET", null, true)]);
  const orders = myOrders.orders || [];

  setField("acc-username", me.username || "-");
  setField("acc-email", me.email || "-");
  setField("acc-role", me.role || "customer");

  const totalSpent = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  setField("acc-orders-count", String(orders.length));
  setField("acc-total-spent", formatBRL(totalSpent));
  setField("acc-last-order", orders.length > 0 ? `#${orders[0].id}` : "-");

  const role = String(me.role || "").toLowerCase();
  adminPanelLink?.classList.toggle("hidden", role !== "admin");
  renderOrders(orders);
}

async function register() {
  const username = usernameInput?.value?.trim() || "";
  const password = passwordInput?.value || "";
  if (!username || !password) {
    setStatus("Informe usuario e senha.", true);
    return;
  }

  try {
    await api("/auth/register", "POST", { username, password });
    setStatus("Registro criado. Agora faca login.", false, true);
  } catch (e) {
    setStatus(e.message, true);
  }
}

async function login() {
  const username = usernameInput?.value?.trim() || "";
  const password = passwordInput?.value || "";
  if (!username || !password) {
    setStatus("Informe usuario e senha.", true);
    return;
  }

  try {
    const data = await api("/auth/login", "POST", { username, password });
    token = data.access_token || data.token || "";
    if (!token) throw new Error("Token nao retornado pelo servidor");
    localStorage.setItem("auth_token", token);
    emitAuthChanged();
    setStatus("", false);
    showLoggedIn();
    await refreshAccountData();
  } catch (e) {
    setStatus(e.message, true);
  }
}

async function logout() {
  try {
    if (token) await api("/auth/logout", "POST", null, true);
  } catch (_) {}
  token = "";
  localStorage.removeItem("auth_token");
  emitAuthChanged();
  showLoggedOut();
  setStatus("Sessao encerrada.", false, true);
}

function setup() {
  const registerBtn = document.getElementById("register-btn");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  setupTabs();
  registerBtn?.addEventListener("click", register);
  loginBtn?.addEventListener("click", login);
  logoutBtn?.addEventListener("click", logout);

  if (token) {
    showLoggedIn();
    refreshAccountData().catch((e) => {
      showLoggedOut();
      setStatus(e.message, true);
    });
  } else {
    showLoggedOut();
  }
}

setup();
