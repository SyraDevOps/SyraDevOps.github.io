function resolveApiBase() {
  const explicitWindow = String(window.KNIMODAS_API_BASE || "").trim();
  const explicitStorage = String(localStorage.getItem("knimodas_api_base") || "").trim();
  const selected = explicitWindow || explicitStorage;
  if (selected) return selected.replace(/\/+$/, "");

  if (location.protocol === "file:") return "http://localhost:8080";

  const host = String(location.hostname || "").toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    if (String(location.port || "") !== "8080") return "http://localhost:8080";
  }
  return "";
}

const API_BASE = resolveApiBase();
let adminToken = sessionStorage.getItem("admin_auth_token") || "";

const byId = (id) => document.getElementById(id);
const fmtBRL = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = (v) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

async function api(path, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Falha na requisicao");
  return data;
}

async function apiUpload(path, formData) {
  const headers = {};
  if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
  const res = await fetch(`${API_BASE}${path}`, { method: "POST", headers, body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Falha na requisicao");
  return data;
}

function parseVariants(text) {
  return String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [size, color, stockRaw, skuRaw] = line.split("|").map((x) => String(x || "").trim());
      return { size, color, stock: Number(stockRaw || 0), sku: skuRaw };
    })
    .filter((v) => v.size && v.color && Number.isFinite(v.stock) && v.sku);
}

function variantRowsToVariants() {
  const rows = [...document.querySelectorAll("#variant-rows tr")];
  return rows
    .map((tr) => {
      const size = String(tr.querySelector('[name="size"]')?.value || "").trim();
      const color = String(tr.querySelector('[name="color"]')?.value || "").trim();
      const stock = Number(tr.querySelector('[name="stock"]')?.value || 0);
      const sku = String(tr.querySelector('[name="sku"]')?.value || "").trim();
      return { size, color, stock, sku };
    })
    .filter((v) => v.size && v.color && Number.isFinite(v.stock) && v.stock >= 0 && v.sku);
}

function renderVariantRows(variants = []) {
  const rows = (variants || [])
    .map(
      (v, idx) => `<tr>
      <td><input name="size" value="${esc(v.size || "")}" placeholder="P/M/G/U" /></td>
      <td><input name="color" value="${esc(v.color || "")}" placeholder="Preto" /></td>
      <td><input name="stock" type="number" min="0" step="1" value="${Number(v.stock || 0)}" /></td>
      <td><input name="sku" value="${esc(v.sku || "")}" placeholder="SKU-${idx + 1}" /></td>
      <td><button class="alt" type="button" data-del-variant="${idx}">Remover</button></td>
    </tr>`,
    )
    .join("");
  byId("variant-rows").innerHTML = rows || `<tr><td colspan="5">Nenhuma variante.</td></tr>`;
  document.querySelectorAll("[data-del-variant]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const curr = variantRowsToVariants();
      curr.splice(Number(btn.dataset.delVariant), 1);
      renderVariantRows(curr);
    }),
  );
}

function renderPanel(name) {
  document.querySelectorAll(".admin-nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.panel === name));
  document.querySelectorAll(".admin-panel").forEach((p) => p.classList.toggle("hidden", p.dataset.panel !== name));
}

async function ensureAdminSession() {
  if (!adminToken) return false;
  try {
    const me = await api("/users/me");
    if (String(me.role || "").toLowerCase() !== "admin") throw new Error("acesso restrito");
    return true;
  } catch (_) {
    adminToken = "";
    sessionStorage.removeItem("admin_auth_token");
    return false;
  }
}

async function loadDashboard() {
  const d = await api("/admin/dashboard");
  byId("dash-cards").innerHTML = `
    <article class="status-pill"><strong>${fmtBRL(d.sales_today)}</strong><span>Faturamento hoje</span></article>
    <article class="status-pill"><strong>${d.orders_today || 0}</strong><span>Pedidos hoje</span></article>
    <article class="status-pill"><strong>${fmtBRL(d.avg_ticket_today)}</strong><span>Ticket medio</span></article>
    <article class="status-pill"><strong>${d.active_carts || 0}</strong><span>Carrinhos ativos</span></article>
  `;
  byId("dash-series").innerHTML = (d.sales_last_7_days || [])
    .map((x) => `<tr><td>${esc(x.date)}</td><td>${x.orders || 0}</td><td>${fmtBRL(x.sales)}</td></tr>`)
    .join("");
  byId("dash-orders").innerHTML = (d.latest_orders || [])
    .map((o) => `<tr><td>#${o.id}</td><td>${esc(o.customer_name)}</td><td>${esc(o.status)}</td><td>${fmtBRL(o.total)}</td></tr>`)
    .join("");
  byId("dash-top-products").innerHTML = (d.top_products || [])
    .map((p) => `<article class="card"><strong>${esc(p.name)}</strong><p>${p.sold_qty || 0} unidades</p></article>`)
    .join("");
}

let allProducts = [];
async function loadProducts() {
  const d = await api("/admin/products");
  allProducts = d.products || [];
  const categories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))].sort();
  byId("prod-category").innerHTML = ['<option value="">Todas categorias</option>']
    .concat(categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`))
    .join("");
  renderProductsTable();
}

function renderProductsTable() {
  const q = String(byId("prod-search").value || "").toLowerCase();
  const cat = byId("prod-category").value || "";
  const stockFilter = byId("prod-stock-filter").value || "";
  const promoFilter = byId("prod-promo-filter").value || "";
  const statusFilter = byId("prod-status-filter").value || "";
  const rows = allProducts
    .filter((p) => {
      const stock = (p.variants || []).reduce((n, v) => n + Number(v.stock || 0), 0);
      const hasPromo = typeof p.promo_price === "number" && p.promo_price > 0 && p.promo_price < p.price;
      const hasSchedule = !!(String(p.publish_at || "").trim() || String(p.unpublish_at || "").trim());
      if (q && !`${p.name} ${p.description}`.toLowerCase().includes(q)) return false;
      if (cat && p.category !== cat) return false;
      if (stockFilter === "low" && stock > 3) return false;
      if (promoFilter === "promo" && !hasPromo) return false;
      if (statusFilter === "active" && !p.active) return false;
      if (statusFilter === "inactive" && p.active) return false;
      if (statusFilter === "scheduled" && !hasSchedule) return false;
      return true;
    })
    .map((p) => {
      const stock = (p.variants || []).reduce((n, v) => n + Number(v.stock || 0), 0);
      const windowTxt = `${p.publish_at || "-"} -> ${p.unpublish_at || "-"}`;
      return `<tr>
        <td>${esc(p.name)}</td>
        <td>${esc(p.category)}</td>
        <td>${fmtBRL(p.promo_price || p.price)}</td>
        <td>${stock}</td>
        <td>${p.active ? "Ativo" : "Inativo"}</td>
        <td>${esc(windowTxt)}</td>
        <td class="actions">
          <button class="alt" type="button" data-edit="${p.id}">Editar</button>
          <button class="alt" type="button" data-toggle="${p.id}">${p.active ? "Inativar" : "Ativar"}</button>
        </td>
      </tr>`;
    })
    .join("");
  byId("products-table").innerHTML = rows || `<tr><td colspan="7">Nenhum produto.</td></tr>`;

  document.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.edit);
      const p = allProducts.find((x) => x.id === id);
      if (!p) return;
      const f = byId("product-form");
      f.elements["id"].value = p.id;
      f.name.value = p.name;
      f.description.value = p.description;
      f.category.value = p.category;
      f.price.value = p.price;
      f.promo_price.value = typeof p.promo_price === "number" ? p.promo_price : "";
      f.active.checked = !!p.active;
      f.publish_at.value = p.publish_at || "";
      f.unpublish_at.value = p.unpublish_at || "";
      f.tags.value = (p.tags || []).join(",");
      f.images.value = (p.images || []).join(",");
      f.variants.value = (p.variants || []).map((v) => `${v.size}|${v.color}|${v.stock}|${v.sku || ""}`).join("\n");
      renderVariantRows(p.variants || []);
      byId("products-status").textContent = `Editando produto #${p.id}`;
    }),
  );
  document.querySelectorAll("[data-toggle]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.toggle);
      const p = allProducts.find((x) => x.id === id);
      if (!p) return;
      try {
        await api(`/admin/products/${id}`, "PUT", {
          name: p.name,
          description: p.description,
          category: p.category,
          price: p.price,
          promo_price: p.promo_price ?? null,
          active: !p.active,
          publish_at: p.publish_at || "",
          unpublish_at: p.unpublish_at || "",
          tags: p.tags || [],
          images: p.images || [],
          variants: p.variants || [],
        });
        await loadProducts();
      } catch (e) {
        byId("products-status").textContent = e.message;
        byId("products-status").className = "notice err";
      }
    }),
  );
}

async function loadOrders() {
  const status = byId("orders-status-filter").value || "";
  const date = byId("orders-date-filter").value || "";
  const email = byId("orders-email-filter").value || "";
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (date) qs.set("date", date);
  if (email) qs.set("email", email);
  const d = await api(`/admin/orders?${qs.toString()}`);
  byId("orders-table").innerHTML = (d.orders || [])
    .map(
      (o) => `<tr>
      <td>#${o.id}</td><td>${esc(o.customer_name)}</td><td>${esc(o.payment_method)}</td><td>${esc(o.status)}</td>
      <td>${fmtBRL(o.total)}</td><td>${esc(o.created_at)}</td>
      <td><button class="alt" type="button" data-order="${o.id}">Ver</button></td>
    </tr>`,
    )
    .join("");
  document.querySelectorAll("[data-order]").forEach((btn) =>
    btn.addEventListener("click", () => loadOrderDetail(Number(btn.dataset.order))),
  );
}

async function loadOrderDetail(orderID) {
  const d = await api(`/admin/orders/${orderID}`);
  const o = d.order;
  const history = d.history || [];
  const detail = byId("order-detail");
  detail.classList.remove("hidden");
  detail.innerHTML = `
    <h3>Pedido #${o.id}</h3>
    <p><strong>Cliente:</strong> ${esc(o.customer_name)} | ${esc(o.email)}</p>
    <p><strong>Endereco:</strong> ${esc(o.street)}, ${esc(o.number)} - ${esc(o.district)} - ${esc(o.city)}/${esc(o.state)} - CEP ${esc(o.zip_code)}</p>
    <p><strong>Frete:</strong> ${fmtBRL(o.shipping_cost)} (${esc(o.shipping_name)}) | <strong>Total:</strong> ${fmtBRL(o.total)}</p>
    <p><strong>Status atual:</strong> ${esc(o.status)} | <strong>Tracking:</strong> ${esc(o.tracking_code || "-")}</p>
    <div class="actions">
      <input id="order-tracking-input" placeholder="Codigo de rastreio" value="${esc(o.tracking_code || "")}" />
      <button class="alt" type="button" data-status="paid">Marcar Pago</button>
      <button class="alt" type="button" data-status="shipped">Marcar Enviado</button>
      <button class="alt" type="button" data-status="cancelled">Cancelar</button>
    </div>
    <h4>Editar pedido</h4>
    <form id="order-edit-form">
      <div class="grid grid-3">
        <input name="customer_name" value="${esc(o.customer_name)}" placeholder="Nome cliente" required />
        <input name="email" value="${esc(o.email)}" placeholder="Email" required />
        <input name="phone" value="${esc(o.phone)}" placeholder="Telefone" required />
      </div>
      <div class="grid grid-3">
        <input name="street" value="${esc(o.street)}" placeholder="Rua" required />
        <input name="number" value="${esc(o.number)}" placeholder="Numero" required />
        <input name="district" value="${esc(o.district)}" placeholder="Bairro" required />
      </div>
      <div class="grid grid-3">
        <input name="city" value="${esc(o.city)}" placeholder="Cidade" required />
        <input name="state" value="${esc(o.state)}" placeholder="UF" required />
        <input name="zip_code" value="${esc(o.zip_code)}" placeholder="CEP" required />
      </div>
      <div class="grid grid-3">
        <input name="payment_method" value="${esc(o.payment_method)}" placeholder="Pagamento" required />
        <input name="shipping_name" value="${esc(o.shipping_name)}" placeholder="Frete" required />
        <input name="shipping_cost" type="number" step="0.01" min="0" value="${Number(o.shipping_cost || 0)}" />
      </div>
      <div class="grid grid-3">
        <input name="status" value="${esc(o.status)}" placeholder="Status" required />
        <input name="tracking_code" value="${esc(o.tracking_code || "")}" placeholder="Tracking" />
        <input name="address" value="${esc(o.address || "")}" placeholder="Endereco consolidado" />
      </div>
      <button class="primary" type="submit">Salvar pedido</button>
    </form>
    <h4>Itens</h4>
    <div class="table-wrap"><table><thead><tr><th>Produto</th><th>Var.</th><th>Qtd</th><th>Total</th></tr></thead>
    <tbody>${(o.items || []).map((it) => `<tr><td>${esc(it.product_name)}</td><td>${esc(it.size)}/${esc(it.color)}</td><td>${it.quantity}</td><td>${fmtBRL(it.line_total)}</td></tr>`).join("")}</tbody></table></div>
    <h4>Historico</h4>
    <ul>${history.map((h) => `<li>${esc(h.created_at)} - ${esc(h.status)} ${h.tracking_code ? `(${esc(h.tracking_code)})` : ""}</li>`).join("")}</ul>
    <p id="order-detail-status" class="notice"></p>
  `;
  detail.querySelectorAll("[data-status]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const tracking = byId("order-tracking-input").value || "";
      try {
        await api(`/admin/orders/${orderID}/status`, "PUT", { status: btn.dataset.status, tracking_code: tracking });
        byId("order-detail-status").textContent = "Status atualizado.";
        byId("order-detail-status").className = "notice ok";
        await loadOrders();
        await loadOrderDetail(orderID);
      } catch (e) {
        byId("order-detail-status").textContent = e.message;
        byId("order-detail-status").className = "notice err";
      }
    }),
  );
  byId("order-edit-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const payload = {
      customer_name: String(fd.get("customer_name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      street: String(fd.get("street") || "").trim(),
      number: String(fd.get("number") || "").trim(),
      district: String(fd.get("district") || "").trim(),
      city: String(fd.get("city") || "").trim(),
      state: String(fd.get("state") || "").trim(),
      zip_code: String(fd.get("zip_code") || "").trim(),
      address: String(fd.get("address") || "").trim(),
      payment_method: String(fd.get("payment_method") || "").trim(),
      shipping_name: String(fd.get("shipping_name") || "").trim(),
      shipping_cost: Number(fd.get("shipping_cost") || 0),
      status: String(fd.get("status") || "").trim(),
      tracking_code: String(fd.get("tracking_code") || "").trim(),
    };
    try {
      await api(`/admin/orders/${orderID}`, "PUT", payload);
      byId("order-detail-status").textContent = "Pedido atualizado.";
      byId("order-detail-status").className = "notice ok";
      await loadOrders();
      await loadOrderDetail(orderID);
    } catch (e) {
      byId("order-detail-status").textContent = e.message;
      byId("order-detail-status").className = "notice err";
    }
  });
}

async function loadCustomers() {
  const d = await api("/admin/customers");
  byId("customers-table").innerHTML = (d.customers || [])
    .map(
      (c) =>
        `<tr><td>${esc(c.username)}</td><td>${esc(c.email)}</td><td>${esc(c.created_at)}</td><td>${c.orders_count || 0}</td><td>${fmtBRL(c.total_spent)}</td></tr>`,
    )
    .join("");
}

async function loadCoupons() {
  const d = await api("/admin/coupons");
  byId("coupons-table").innerHTML = (d.coupons || [])
    .map(
      (c) => `<tr>
      <td>${esc(c.code)}</td><td>${esc(c.type)}</td><td>${c.type === "percent" ? `${c.value}%` : fmtBRL(c.value)}</td>
      <td>${esc(c.expires_at)}</td><td>${c.used_count}/${c.max_uses}</td><td>${c.active ? "Sim" : "Nao"}</td>
      <td><button class="alt" data-del-coupon="${c.id}" type="button">Excluir</button></td></tr>`,
    )
    .join("");
  document.querySelectorAll("[data-del-coupon]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        await api(`/admin/coupons/${Number(btn.dataset.delCoupon)}`, "DELETE");
        await loadCoupons();
      } catch (e) {
        byId("coupons-status").textContent = e.message;
        byId("coupons-status").className = "notice err";
      }
    }),
  );
}

async function loadSettings() {
  const d = await api("/admin/settings");
  const s = d.settings || {};
  const form = byId("settings-form");
  form.free_shipping_above.value = s.free_shipping_above ?? "";
  form.extra_fee_fixed.value = s.extra_fee_fixed ?? "";
  form.store_email.value = s.store_email ?? "";
  form.company_name.value = s.company_name ?? "";
  form.company_document.value = s.company_document ?? "";
  form.payment_gateway_key.value = s.payment_gateway_key ?? "";
}

async function loadPromotionsAdmin() {
  const d = await api("/admin/promotions");
  byId("promotions-table").innerHTML = (d.promotions || [])
    .map(
      (p) => `<tr>
      <td>${esc(p.title)}</td>
      <td>${esc(p.starts_at)} ate ${esc(p.ends_at)}</td>
      <td>${p.position || 0}</td>
      <td>${p.active ? "Sim" : "Nao"}</td>
      <td>
        <button class="alt" type="button" data-edit-promo="${p.id}">Editar</button>
        <button class="alt" type="button" data-del-promo="${p.id}">Excluir</button>
      </td>
    </tr>`,
    )
    .join("");
  document.querySelectorAll("[data-edit-promo]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const p = (d.promotions || []).find((x) => x.id === Number(btn.dataset.editPromo));
      if (!p) return;
      const form = byId("promotion-form");
      form.elements["id"].value = p.id;
      form.title.value = p.title || "";
      form.description.value = p.description || "";
      form.image_url.value = p.image_url || "";
      form.cta_label.value = p.cta_label || "";
      form.cta_link.value = p.cta_link || "";
      form.position.value = Number(p.position || 0);
      form.starts_at.value = p.starts_at || "";
      form.ends_at.value = p.ends_at || "";
      form.active.checked = !!p.active;
      byId("promotions-status").textContent = `Editando promocao #${p.id}`;
      byId("promotions-status").className = "notice";
    }),
  );
  document.querySelectorAll("[data-del-promo]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        await api(`/admin/promotions/${Number(btn.dataset.delPromo)}`, "DELETE");
        await loadPromotionsAdmin();
      } catch (e) {
        byId("promotions-status").textContent = e.message;
        byId("promotions-status").className = "notice err";
      }
    }),
  );
}

async function loadBannersAdmin() {
  const d = await api("/admin/banners");
  byId("banners-table").innerHTML = (d.banners || [])
    .map(
      (b) => `<tr>
      <td>${b.image ? `<a href="${esc(b.image)}" target="_blank" rel="noreferrer">abrir</a>` : "-"}</td>
      <td>${esc(b.link || "-")}</td>
      <td>${esc(b.start_at || "-")} ate ${esc(b.end_at || "-")}</td>
      <td>${Number(b.position || 0)}</td>
      <td>${b.active ? "Sim" : "Nao"}</td>
      <td>
        <button class="alt" type="button" data-edit-banner="${b.id}">Editar</button>
        <button class="alt" type="button" data-del-banner="${b.id}">Excluir</button>
      </td>
    </tr>`,
    )
    .join("");
  document.querySelectorAll("[data-edit-banner]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const b = (d.banners || []).find((x) => x.id === Number(btn.dataset.editBanner));
      if (!b) return;
      const form = byId("banner-form");
      form.elements["id"].value = b.id;
      form.image.value = b.image || "";
      form.link.value = b.link || "";
      form.position.value = Number(b.position || 0);
      form.start_at.value = b.start_at || "";
      form.end_at.value = b.end_at || "";
      form.active.checked = !!b.active;
      byId("banners-status").textContent = `Editando banner #${b.id}`;
      byId("banners-status").className = "notice";
    }),
  );
  document.querySelectorAll("[data-del-banner]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        await api(`/admin/banners/${Number(btn.dataset.delBanner)}`, "DELETE");
        await loadBannersAdmin();
      } catch (e) {
        byId("banners-status").textContent = e.message;
        byId("banners-status").className = "notice err";
      }
    }),
  );
}

async function bootstrapAdminUI() {
  byId("admin-login-card").classList.add("hidden");
  byId("admin-app").classList.remove("hidden");
  await Promise.all([loadDashboard(), loadProducts(), loadOrders(), loadCustomers(), loadCoupons(), loadSettings(), loadPromotionsAdmin(), loadBannersAdmin()]);
}

function bindEvents() {
  const menuBtn = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-header nav");
  menuBtn?.addEventListener("click", () => nav?.classList.toggle("open"));

  document.querySelectorAll(".admin-nav-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      renderPanel(btn.dataset.panel);
      if (btn.dataset.panel === "dashboard") loadDashboard().catch(console.error);
      if (btn.dataset.panel === "products") loadProducts().catch(console.error);
      if (btn.dataset.panel === "orders") loadOrders().catch(console.error);
      if (btn.dataset.panel === "customers") loadCustomers().catch(console.error);
      if (btn.dataset.panel === "coupons") loadCoupons().catch(console.error);
      if (btn.dataset.panel === "promotions") loadPromotionsAdmin().catch(console.error);
      if (btn.dataset.panel === "banners") loadBannersAdmin().catch(console.error);
      if (btn.dataset.panel === "settings") loadSettings().catch(console.error);
    }),
  );

  byId("admin-login-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    try {
      const d = await api("/auth/admin/login", "POST", {
        username: String(fd.get("username") || ""),
        password: String(fd.get("password") || ""),
      });
      adminToken = d.access_token || d.token || "";
      sessionStorage.setItem("admin_auth_token", adminToken);
      byId("admin-login-status").textContent = "";
      await bootstrapAdminUI();
    } catch (e) {
      byId("admin-login-status").textContent = e.message;
      byId("admin-login-status").className = "notice err";
    }
  });

  byId("admin-logout-btn").addEventListener("click", () => {
    adminToken = "";
    sessionStorage.removeItem("admin_auth_token");
    byId("admin-app").classList.add("hidden");
    byId("admin-login-card").classList.remove("hidden");
  });

  ["prod-search", "prod-category", "prod-stock-filter", "prod-promo-filter", "prod-status-filter"].forEach((id) => {
    byId(id).addEventListener("input", renderProductsTable);
    byId(id).addEventListener("change", renderProductsTable);
  });

  byId("product-form-clear").addEventListener("click", () => {
    byId("product-form").reset();
    byId("product-form").elements["id"].value = "";
    renderVariantRows([]);
  });
  byId("variant-add-btn").addEventListener("click", () => {
    const curr = variantRowsToVariants();
    curr.push({ size: "", color: "", stock: 0, sku: "" });
    renderVariantRows(curr);
  });

  byId("product-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const id = Number(form.elements["id"].value || 0);
    const payload = {
      name: String(form.name.value || "").trim(),
      description: String(form.description.value || "").trim(),
      category: String(form.category.value || "").trim(),
      price: Number(form.price.value || 0),
      promo_price: form.promo_price.value ? Number(form.promo_price.value) : null,
      active: !!form.active.checked,
      publish_at: String(form.publish_at.value || "").trim(),
      unpublish_at: String(form.unpublish_at.value || "").trim(),
      tags: String(form.tags.value || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      images: String(form.images.value || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      variants: (() => {
        const fromRows = variantRowsToVariants();
        if (fromRows.length > 0) return fromRows;
        return parseVariants(form.variants.value || "");
      })(),
    };
    try {
      if (id > 0) await api(`/admin/products/${id}`, "PUT", payload);
      else await api("/admin/products", "POST", payload);
      byId("products-status").textContent = "Produto salvo.";
      byId("products-status").className = "notice ok";
      form.reset();
      form.elements["id"].value = "";
      renderVariantRows([]);
      await loadProducts();
    } catch (e) {
      byId("products-status").textContent = e.message;
      byId("products-status").className = "notice err";
    }
  });

  byId("product-image-upload-btn").addEventListener("click", async () => {
    const file = byId("product-image-file").files?.[0];
    if (!file) {
      byId("products-status").textContent = "Selecione uma imagem.";
      byId("products-status").className = "notice err";
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const out = await apiUpload("/admin/images/upload", formData);
      const current = String(byId("product-form").images.value || "").trim();
      byId("product-form").images.value = current ? `${current},${out.url}` : String(out.url || "");
      byId("products-status").textContent = `Imagem processada: ${out.url}`;
      byId("products-status").className = "notice ok";
    } catch (e) {
      byId("products-status").textContent = e.message;
      byId("products-status").className = "notice err";
    }
  });

  byId("products-import-preview-btn").addEventListener("click", async () => {
    const file = byId("products-import-file").files?.[0];
    if (!file) {
      byId("products-status").textContent = "Selecione um arquivo CSV.";
      byId("products-status").className = "notice err";
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const out = await apiUpload("/admin/products/import?preview=1", formData);
      const rows = (out.preview || [])
        .map(
          (p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td>${fmtBRL(p.price)}</td><td>${(p.variants || []).length}</td></tr>`,
        )
        .join("");
      byId("products-import-preview-table").innerHTML = rows || `<tr><td colspan="4">Sem preview.</td></tr>`;
      byId("products-status").textContent = `Preview carregado: ${(out.total || 0)} produto(s).`;
      byId("products-status").className = "notice ok";
    } catch (e) {
      byId("products-status").textContent = e.message;
      byId("products-status").className = "notice err";
    }
  });

  byId("products-import-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const file = byId("products-import-file").files?.[0];
    if (!file) {
      byId("products-status").textContent = "Selecione um arquivo CSV.";
      byId("products-status").className = "notice err";
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const out = await apiUpload("/admin/products/import", formData);
      byId("products-status").textContent = `Importacao concluida. Criados: ${out.created || 0}; Atualizados: ${out.updated || 0}.`;
      byId("products-status").className = "notice ok";
      ev.currentTarget.reset();
      await loadProducts();
    } catch (e) {
      byId("products-status").textContent = e.message;
      byId("products-status").className = "notice err";
    }
  });
  byId("products-sync-stock-btn").addEventListener("click", async () => {
    try {
      const out = await api("/admin/stock/sync", "POST");
      byId("products-status").textContent = `Sync concluido. Atualizados: ${out.updated || 0}/${out.total || 0}`;
      byId("products-status").className = "notice ok";
      await loadProducts();
    } catch (e) {
      byId("products-status").textContent = e.message;
      byId("products-status").className = "notice err";
    }
  });
  byId("products-reconcile-btn").addEventListener("click", async () => {
    try {
      const out = await api("/admin/products/reconcile", "POST");
      byId("products-status").textContent = `Agendamento aplicado. Ativados: ${out.activated || 0}; Desativados: ${out.deactivated || 0}.`;
      byId("products-status").className = "notice ok";
      await loadProducts();
    } catch (e) {
      byId("products-status").textContent = e.message;
      byId("products-status").className = "notice err";
    }
  });

  byId("orders-filter-btn").addEventListener("click", () => loadOrders().catch(console.error));

  byId("coupon-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const payload = {
      code: String(fd.get("code") || "").trim(),
      type: String(fd.get("type") || "percent"),
      value: Number(fd.get("value") || 0),
      expires_at: String(fd.get("expires_at") || "").trim(),
      max_uses: Number(fd.get("max_uses") || 0),
      active: fd.get("active") === "on",
    };
    try {
      await api("/admin/coupons", "POST", payload);
      byId("coupons-status").textContent = "Cupom salvo.";
      byId("coupons-status").className = "notice ok";
      ev.currentTarget.reset();
      await loadCoupons();
    } catch (e) {
      byId("coupons-status").textContent = e.message;
      byId("coupons-status").className = "notice err";
    }
  });

  byId("settings-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const payload = {
      free_shipping_above: Number(fd.get("free_shipping_above") || 0),
      extra_fee_fixed: Number(fd.get("extra_fee_fixed") || 0),
      store_email: String(fd.get("store_email") || "").trim(),
      company_name: String(fd.get("company_name") || "").trim(),
      company_document: String(fd.get("company_document") || "").trim(),
      payment_gateway_key: String(fd.get("payment_gateway_key") || "").trim(),
    };
    try {
      await api("/admin/settings", "PUT", payload);
      byId("settings-status").textContent = "Configuracoes atualizadas.";
      byId("settings-status").className = "notice ok";
    } catch (e) {
      byId("settings-status").textContent = e.message;
      byId("settings-status").className = "notice err";
    }
  });
  byId("backup-btn").addEventListener("click", async () => {
    try {
      const out = await api("/admin/backup", "POST");
      byId("settings-status").textContent = `Backup gerado: ${out.file_name || out.file || ""}`;
      byId("settings-status").className = "notice ok";
    } catch (e) {
      byId("settings-status").textContent = e.message;
      byId("settings-status").className = "notice err";
    }
  });
  byId("restore-test-btn").addEventListener("click", async () => {
    try {
      const out = await api("/admin/backup/restore-test", "POST");
      byId("settings-status").textContent = `Restore test OK: ${out.file_name || ""}`;
      byId("settings-status").className = "notice ok";
    } catch (e) {
      byId("settings-status").textContent = e.message;
      byId("settings-status").className = "notice err";
    }
  });

  byId("promotion-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const payload = {
      title: String(fd.get("title") || "").trim(),
      description: String(fd.get("description") || "").trim(),
      image_url: String(fd.get("image_url") || "").trim(),
      cta_label: String(fd.get("cta_label") || "").trim(),
      cta_link: String(fd.get("cta_link") || "").trim(),
      starts_at: String(fd.get("starts_at") || "").trim(),
      ends_at: String(fd.get("ends_at") || "").trim(),
      position: Number(fd.get("position") || 0),
      active: fd.get("active") === "on",
    };
    const id = Number(fd.get("id") || 0);
    try {
      if (id > 0) await api(`/admin/promotions/${id}`, "PUT", payload);
      else await api("/admin/promotions", "POST", payload);
      byId("promotions-status").textContent = "Promocao salva.";
      byId("promotions-status").className = "notice ok";
      ev.currentTarget.reset();
      ev.currentTarget.elements["id"].value = "";
      await loadPromotionsAdmin();
    } catch (e) {
      byId("promotions-status").textContent = e.message;
      byId("promotions-status").className = "notice err";
    }
  });

  byId("banner-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const payload = {
      image: String(fd.get("image") || "").trim(),
      link: String(fd.get("link") || "").trim(),
      position: Number(fd.get("position") || 0),
      start_at: String(fd.get("start_at") || "").trim(),
      end_at: String(fd.get("end_at") || "").trim(),
      active: fd.get("active") === "on",
    };
    const id = Number(fd.get("id") || 0);
    try {
      if (id > 0) await api(`/admin/banners/${id}`, "PUT", payload);
      else await api("/admin/banners", "POST", payload);
      byId("banners-status").textContent = "Banner salvo.";
      byId("banners-status").className = "notice ok";
      ev.currentTarget.reset();
      ev.currentTarget.elements["id"].value = "";
      await loadBannersAdmin();
    } catch (e) {
      byId("banners-status").textContent = e.message;
      byId("banners-status").className = "notice err";
    }
  });
}

async function run() {
  bindEvents();
  renderVariantRows([]);
  const ok = await ensureAdminSession();
  if (ok) await bootstrapAdminUI();
}

run().catch((e) => {
  const el = byId("admin-login-status");
  el.textContent = e.message;
  el.className = "notice err";
});
