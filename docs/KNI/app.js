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
const AUTH_TOKEN_KEY = "auth_token";

window.setKnimodasApiBase = function setKnimodasApiBase(url) {
  const normalized = String(url || "").trim().replace(/\/+$/, "");
  if (!normalized) localStorage.removeItem("knimodas_api_base");
  else localStorage.setItem("knimodas_api_base", normalized);
  location.reload();
};

function formatBRL(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtml(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCartToken() {
  let token = localStorage.getItem("cart_token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("cart_token", token);
  }
  return token;
}

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

async function api(path, method = "GET", body = null) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Falha na requisicao");
  }
  return data;
}

function setActiveNav() {
  const curr = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("nav a[data-page]").forEach((a) => {
    if (a.getAttribute("data-page") === curr) a.classList.add("active");
  });
}

function initMobileMenu() {
  const btn = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-header nav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  document.querySelectorAll(".site-header nav a").forEach((a) => {
    a.addEventListener("click", () => nav.classList.remove("open"));
  });
}

function syncHeaderAccountState() {
  const logged = Boolean(getAuthToken());
  document.querySelectorAll("[data-account-dot]").forEach((dot) => {
    dot.classList.toggle("hidden", !logged);
  });
  const accountLink = document.querySelector('[data-header-action="account"]');
  if (accountLink) {
    accountLink.setAttribute("title", logged ? "Minha conta" : "Entrar");
    accountLink.setAttribute("aria-label", logged ? "Minha conta" : "Entrar");
  }
}

function upsertMeta(selector, attrName, value) {
  if (!value) return;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    if (selector.startsWith("meta[property=")) {
      const prop = selector.match(/property=\"([^\"]+)\"/)?.[1];
      if (prop) el.setAttribute("property", prop);
    }
    if (selector.startsWith("meta[name=")) {
      const name = selector.match(/name=\"([^\"]+)\"/)?.[1];
      if (name) el.setAttribute("name", name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attrName, value);
}

function initMarketingPixels() {
  const cfg = window.KNIMODAS_MARKETING || {};
  const metaId = String(cfg.metaPixelId || "").trim();
  const googleAdsId = String(cfg.googleAdsId || "").trim();

  if (metaId && !window.fbq) {
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
    window.fbq = function () {
      window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
    };
    window.fbq.push = window.fbq;
    window.fbq.loaded = true;
    window.fbq.version = "2.0";
    window.fbq.queue = [];
    window.fbq("init", metaId);
    window.fbq("track", "PageView");
  }

  if (googleAdsId && !window.gtag) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAdsId)}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", googleAdsId);
  }
}

function renderHeaderCartPreview(target, items, total) {
  if (!target) return;
  if (!items || items.length === 0) {
    target.innerHTML = `
      <p class="cart-preview-title">Carrinho</p>
      <p class="notice">Seu carrinho esta vazio.</p>
      <div class="cart-preview-actions">
        <a class="btn alt" href="produtos.html">Comprar</a>
      </div>
    `;
    return;
  }

  const rows = items
    .slice(0, 3)
    .map(
      (it) => `
      <div class="cart-preview-item">
        <div>
          <strong>${escapeHtml(it.product_name || "")}</strong>
          <div class="cart-preview-meta">${escapeHtml(it.size || "")} / ${escapeHtml(it.color || "")} | Qtd ${Number(it.quantity || 0)}</div>
        </div>
        <span class="cart-preview-price">${formatBRL(it.line_total || 0)}</span>
      </div>
    `,
    )
    .join("");

  target.innerHTML = `
    <p class="cart-preview-title">Carrinho (${items.length})</p>
    <div class="cart-preview-list">${rows}</div>
    <div class="cart-preview-footer">
      <strong>Total: ${formatBRL(total || 0)}</strong>
      <div class="cart-preview-actions">
        <a class="btn alt" href="carrinho.html">Ver</a>
        <a class="btn" href="checkout.html">Checkout</a>
      </div>
    </div>
  `;
}

function initHeaderCartPreviewEvents() {
  const wrap = document.querySelector(".header-cart-wrap");
  const panel = document.getElementById("header-cart-preview");
  if (!wrap || !panel || wrap.dataset.ready === "1") return;

  let timer = null;
  const show = () => {
    if (timer) clearTimeout(timer);
    panel.classList.remove("hidden");
  };
  const hide = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => panel.classList.add("hidden"), 120);
  };

  wrap.addEventListener("mouseenter", show);
  wrap.addEventListener("mouseleave", hide);
  wrap.addEventListener("focusin", show);
  wrap.addEventListener("focusout", hide);
  wrap.dataset.ready = "1";
}

async function syncHeaderCartState() {
  const badgeEls = document.querySelectorAll("[data-cart-badge]");
  const panel = document.getElementById("header-cart-preview");
  if (!badgeEls.length && !panel) return;

  try {
    const d = await api(`/cart?cart_token=${encodeURIComponent(getCartToken())}`);
    const items = d.items || [];
    const qty = items.reduce((acc, it) => acc + Number(it.quantity || 0), 0);

    badgeEls.forEach((el) => {
      el.textContent = String(qty);
      el.classList.toggle("hidden", qty <= 0);
    });
    renderHeaderCartPreview(panel, items, d.total || 0);
  } catch (_) {
    badgeEls.forEach((el) => {
      el.textContent = "0";
      el.classList.add("hidden");
    });
    if (panel) {
      panel.innerHTML = `<p class="cart-preview-title">Carrinho</p><p class="notice err">Falha ao carregar pre-visualizacao.</p>`;
    }
  }
}

async function loadProducts() {
  const d = await api("/products");
  return d.products || [];
}

async function loadCategories() {
  const d = await api("/categories");
  return d.categories || [];
}

async function loadPromotions() {
  const d = await api("/promotions");
  return d.promotions || [];
}

async function loadBanners() {
  const d = await api("/banners");
  return d.banners || [];
}

let heroBannerTimer = null;
function renderHeroBanners(banners) {
  const media = document.querySelector(".hero-media");
  if (!media) return;
  if (heroBannerTimer) {
    clearInterval(heroBannerTimer);
    heroBannerTimer = null;
  }
  if (!Array.isArray(banners) || banners.length === 0) return;
  const ordered = [...banners].sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
  let idx = 0;
  const paint = () => {
    const current = ordered[idx] || ordered[0];
    const image = String(current.image || "").trim();
    const link = String(current.link || "").trim();
    if (image) {
      media.style.background = `linear-gradient(170deg, rgba(22, 22, 22, 0.06), rgba(22, 22, 22, 0.2)), url("${encodeURI(image)}") center/cover`;
    }
    media.style.cursor = link ? "pointer" : "default";
    media.onclick = link ? () => window.open(link, "_self") : null;
    media.setAttribute("aria-label", link ? "Banner da campanha atual" : "Banner principal");
  };
  paint();
  if (ordered.length > 1) {
    heroBannerTimer = setInterval(() => {
      idx = (idx + 1) % ordered.length;
      paint();
    }, 6000);
  }
}

function priceHTML(p) {
  const hasPromo = typeof p.promo_price === "number" && p.promo_price > 0 && p.promo_price < p.price;
  const current = hasPromo ? p.promo_price : p.price;
  return `
    <div class="price-row">
      <span class="price">${formatBRL(current)}</span>
      ${hasPromo ? `<span class="price-old">${formatBRL(p.price)}</span>` : ""}
    </div>
  `;
}

function productTagsHTML(p, newestIDs = new Set()) {
  const tags = [];
  const hasPromo = typeof p.promo_price === "number" && p.promo_price > 0 && p.promo_price < p.price;
  const stock = Number((p.variants || []).reduce((acc, v) => acc + Number(v.stock || 0), 0));
  if (newestIDs.has(p.id)) tags.push("Novo");
  if (hasPromo) tags.push("Promocao");
  if (stock > 0 && stock <= 3) tags.push("Ultimas pecas");
  return tags.map((t) => `<span class="badge subtle">${escapeHtml(t)}</span>`).join("");
}

function productCardHTML(p) {
  const img = (p.images && p.images[0]) || "https://placehold.co/700x880?text=Knimodas";
  return `
    <article class="card product-card">
      <a href="produto.html?id=${p.id}" class="product-media-link">
        <div class="product-media">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" loading="lazy" />
        </div>
      </a>
      <div class="badges-inline">
        <span class="badge">${escapeHtml(p.category)}</span>
      </div>
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml((p.description || "").slice(0, 90))}...</p>
      ${priceHTML(p)}
      <a class="btn alt" href="produto.html?id=${p.id}">Ver produto</a>
    </article>
  `;
}

async function loadHome() {
  const productWrap = document.getElementById("home-products");
  const categoriesWrap = document.getElementById("home-categories");
  const promotionsWrap = document.getElementById("home-promotions");
  const heroMedia = document.querySelector(".hero-media");
  if (!productWrap && !categoriesWrap && !promotionsWrap && !heroMedia) return;

  const [products, categories, promotions, banners] = await Promise.all([
    loadProducts(),
    loadCategories(),
    loadPromotions(),
    loadBanners().catch(() => []),
  ]);
  renderHeroBanners(banners);

  if (categoriesWrap) {
    const preferred = ["Feminino", "Masculino", "Novidades", "Promocoes"];
    const map = new Map(categories.map((c) => [String(c.name).toLowerCase(), c]));
    const merged = [];
    preferred.forEach((name) => {
      const found = map.get(name.toLowerCase());
      merged.push(found || { id: `virtual-${name}`, name });
    });
    categoriesWrap.innerHTML = merged
      .map(
        (c) => `
      <a class="category-card" href="produtos.html?category=${encodeURIComponent(c.name)}">
        <h3>${escapeHtml(c.name)}</h3>
        <p>Curadoria exclusiva Knimodas</p>
      </a>
    `,
      )
      .join("");
  }

  if (productWrap) {
    productWrap.innerHTML = products.slice(0, 8).map(productCardHTML).join("");
  }
  if (promotionsWrap) {
    promotionsWrap.innerHTML = promotions
      .slice(0, 3)
      .map(
        (p) => `
      <article class="card promo-card">
        <div class="promo-media">${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.title)}" loading="lazy" />` : ""}</div>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description || "")}</p>
        <a class="btn alt" href="${escapeHtml(p.cta_link || "produtos.html")}">${escapeHtml(p.cta_label || "Ver Oferta")}</a>
      </article>
    `,
      )
      .join("");
  }
}

async function loadCatalog() {
  const list = document.getElementById("catalog-grid");
  const categoryFilter = document.getElementById("category-filter");
  const sizeFilter = document.getElementById("size-filter");
  const colorFilter = document.getElementById("color-filter");
  const priceFilter = document.getElementById("price-filter");
  const sortFilter = document.getElementById("sort-filter");
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");
  const clearBtn = document.getElementById("clear-filters-btn");
  const loadMoreBtn = document.getElementById("load-more-btn");
  const resultCount = document.getElementById("result-count");
  const promotionsWrap = document.getElementById("store-promotions");
  if (!list) return;

  const params = new URLSearchParams(location.search);
  const [products, categories, promotions] = await Promise.all([loadProducts(), loadCategories(), loadPromotions()]);
  const newestIDs = new Set(products.slice(0, 5).map((p) => p.id));
  const allSizes = [...new Set(products.flatMap((p) => (p.variants || []).map((v) => v.size)).filter(Boolean))].sort();
  const allColors = [...new Set(products.flatMap((p) => (p.variants || []).map((v) => v.color)).filter(Boolean))].sort();

  if (categoryFilter) {
    const opts = ['<option value="">Todas as categorias</option>']
      .concat(categories.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`))
      .join("");
    categoryFilter.innerHTML = opts;
  }

  if (sizeFilter) {
    sizeFilter.innerHTML = ['<option value="">Todos os tamanhos</option>']
      .concat(allSizes.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`))
      .join("");
  }
  if (colorFilter) {
    colorFilter.innerHTML = ['<option value="">Todas as cores</option>']
      .concat(allColors.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`))
      .join("");
  }
  if (promotionsWrap) {
    promotionsWrap.innerHTML = promotions
      .slice(0, 3)
      .map(
        (p) => `
      <article class="card promo-card">
        <span class="badge">Promocao</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description || "")}</p>
        <a class="btn alt" href="${escapeHtml(p.cta_link || "produtos.html")}">${escapeHtml(p.cta_label || "Aproveitar")}</a>
      </article>
    `,
      )
      .join("");
  }

  const syncControlsFromParams = () => {
    if (categoryFilter) categoryFilter.value = params.get("category") || "";
    if (sizeFilter) sizeFilter.value = params.get("size") || "";
    if (colorFilter) colorFilter.value = params.get("color") || "";
    if (priceFilter) priceFilter.value = params.get("price") || "";
    if (sortFilter) sortFilter.value = params.get("sort") || "best";
    if (searchInput) searchInput.value = params.get("q") || "";
  };
  syncControlsFromParams();

  let visibleCount = Number(params.get("limit") || 8);
  if (!Number.isFinite(visibleCount) || visibleCount < 1) visibleCount = 8;

  const applyFilters = () => {
    const category = (params.get("category") || "").toLowerCase();
    const size = (params.get("size") || "").toLowerCase();
    const color = (params.get("color") || "").toLowerCase();
    const q = (params.get("q") || "").toLowerCase();
    const price = params.get("price") || "";
    const sort = params.get("sort") || "best";

    let out = products.filter((p) => {
      const variants = p.variants || [];
      const categoryOk = !category || String(p.category).toLowerCase() === category;
      const sizeOk = !size || variants.some((v) => String(v.size).toLowerCase() === size);
      const colorOk = !color || variants.some((v) => String(v.color).toLowerCase() === color);
      const searchable = `${p.name} ${p.description} ${p.category}`.toLowerCase();
      const queryOk = !q || searchable.includes(q);
      const current = typeof p.promo_price === "number" && p.promo_price > 0 ? p.promo_price : p.price;
      let priceOk = true;
      if (price === "ate-100") priceOk = current <= 100;
      if (price === "100-200") priceOk = current > 100 && current <= 200;
      if (price === "200-400") priceOk = current > 200 && current <= 400;
      if (price === "400+") priceOk = current > 400;
      return categoryOk && sizeOk && colorOk && queryOk && priceOk;
    });

    if (sort === "price-asc") out = out.sort((a, b) => (a.promo_price || a.price) - (b.promo_price || b.price));
    if (sort === "price-desc") out = out.sort((a, b) => (b.promo_price || b.price) - (a.promo_price || a.price));
    if (sort === "newest") out = out.sort((a, b) => Number(b.id) - Number(a.id));
    if (sort === "best") out = out.sort((a, b) => {
      const aStock = (a.variants || []).reduce((n, v) => n + Number(v.stock || 0), 0);
      const bStock = (b.variants || []).reduce((n, v) => n + Number(v.stock || 0), 0);
      return bStock - aStock;
    });

    return out;
  };

  const renderCatalog = () => {
    const filtered = applyFilters();
    const chunk = filtered.slice(0, visibleCount);
    if (resultCount) resultCount.textContent = `${filtered.length} resultado(s)`;
    if (filtered.length === 0) {
      list.innerHTML = `<div class="card"><p>Nenhum produto encontrado para esse filtro.</p></div>`;
      if (loadMoreBtn) loadMoreBtn.classList.add("hidden");
      return;
    }
    list.innerHTML = chunk
      .map((p) => {
        const base = productCardHTML(p);
        const tags = productTagsHTML(p, newestIDs);
        return base.replace('<div class="badges-inline">', `<div class="badges-inline">${tags}`);
      })
      .join("");
    if (loadMoreBtn) {
      const shouldShow = visibleCount < filtered.length;
      loadMoreBtn.classList.toggle("hidden", !shouldShow);
    }
  };

  const updateParam = (key, value) => {
    if (!value) params.delete(key);
    else params.set(key, value);
  };

  const rerenderWithState = () => {
    const q = params.toString();
    history.replaceState({}, "", `${location.pathname}${q ? `?${q}` : ""}`);
    renderCatalog();
  };

  const onFilterChanged = () => {
    visibleCount = 8;
    params.set("limit", String(visibleCount));
    updateParam("category", categoryFilter?.value || "");
    updateParam("size", sizeFilter?.value || "");
    updateParam("color", colorFilter?.value || "");
    updateParam("price", priceFilter?.value || "");
    updateParam("sort", sortFilter?.value || "best");
    rerenderWithState();
  };

  categoryFilter?.addEventListener("change", onFilterChanged);
  sizeFilter?.addEventListener("change", onFilterChanged);
  colorFilter?.addEventListener("change", onFilterChanged);
  priceFilter?.addEventListener("change", onFilterChanged);
  sortFilter?.addEventListener("change", onFilterChanged);

  const applySearch = () => {
    visibleCount = 8;
    params.set("limit", String(visibleCount));
    updateParam("q", (searchInput?.value || "").trim());
    rerenderWithState();
  };
  searchBtn?.addEventListener("click", applySearch);
  searchInput?.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      applySearch();
    }
  });

  clearBtn?.addEventListener("click", () => {
    ["category", "size", "color", "price", "sort", "q", "limit"].forEach((k) => params.delete(k));
    syncControlsFromParams();
    visibleCount = 8;
    rerenderWithState();
  });

  loadMoreBtn?.addEventListener("click", () => {
    visibleCount += 8;
    params.set("limit", String(visibleCount));
    rerenderWithState();
  });

  renderCatalog();
  if (loadMoreBtn && visibleCount <= 8 && !params.get("limit")) {
    params.set("limit", String(visibleCount));
    rerenderWithState();
  }
}

function optionsFromVariants(variants, field) {
  return [...new Set((variants || []).map((v) => v[field]).filter(Boolean))];
}

async function addToCart(payload) {
  return api("/cart/add", "POST", payload);
}

async function loadProductPage() {
  const box = document.getElementById("product-detail");
  if (!box) return;

  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    box.innerHTML = `<p class="notice err">Produto nao informado.</p>`;
    return;
  }

  try {
    const productData = await api(`/products/${id}`);
    const p = productData.product || productData;
    const images = p.images?.length ? p.images : ["https://placehold.co/900x1100?text=Knimodas"];
    const sizes = optionsFromVariants(p.variants, "size");
    const colors = optionsFromVariants(p.variants, "color");

    document.title = `${p.name} | Knimodas`;
    const desc = (p.description || "").slice(0, 160);
    const ogURL = `${location.origin}${location.pathname}?id=${encodeURIComponent(id)}`;
    upsertMeta("#meta-desc", "content", desc);
    upsertMeta("#meta-og-title", "content", `${p.name} | Knimodas`);
    upsertMeta("#meta-og-desc", "content", desc);
    upsertMeta("#meta-og-image", "content", images[0]);
    upsertMeta("#meta-og-url", "content", ogURL);
    upsertMeta('meta[name="description"]', "content", desc);

    box.innerHTML = `
      <section class="product-layout">
        <article class="gallery">
          <img id="main-image" class="main-image" src="${escapeHtml(images[0])}" alt="${escapeHtml(p.name)}" />
          <div class="thumb-row">
            ${images
              .map(
                (img) =>
                  `<img class="thumb" src="${escapeHtml(img)}" alt="thumb" data-img="${escapeHtml(img)}" />`,
              )
              .join("")}
          </div>
        </article>

        <article class="card">
          <span class="badge">${escapeHtml(p.category)}</span>
          <h1>${escapeHtml(p.name)}</h1>
          <p>${escapeHtml(p.description)}</p>
          ${priceHTML(p)}

          <div class="option-grid">
            <div>
              <label for="size">Tamanho</label>
              <select id="size">${sizes.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("")}</select>
            </div>
            <div>
              <label for="color">Cor</label>
              <select id="color">${colors.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}</select>
            </div>
            <div>
              <label for="qty">Quantidade</label>
              <input id="qty" type="number" min="1" max="20" value="1" />
            </div>
          </div>

          <p id="stock-label" class="notice"></p>

          <div class="measure-table">
            <table>
              <thead><tr><th>Tamanho</th><th>Busto</th><th>Cintura</th><th>Quadril</th></tr></thead>
              <tbody>
                <tr><td>P</td><td>86-90</td><td>66-70</td><td>92-96</td></tr>
                <tr><td>M</td><td>91-96</td><td>71-76</td><td>97-102</td></tr>
                <tr><td>G</td><td>97-102</td><td>77-82</td><td>103-108</td></tr>
              </tbody>
            </table>
          </div>

          <div class="cta-row">
            <button id="add-btn" class="primary">Adicionar ao Carrinho</button>
            <a class="btn alt" href="carrinho.html">Ver carrinho</a>
          </div>
          <p id="prod-status" class="notice"></p>
        </article>
      </section>
    `;

    const mainImage = document.getElementById("main-image");
    box.querySelectorAll(".thumb").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        mainImage.src = thumb.dataset.img;
      });
    });

    const sizeEl = document.getElementById("size");
    const colorEl = document.getElementById("color");
    const stockEl = document.getElementById("stock-label");

    const refreshStock = () => {
      const v = (p.variants || []).find((it) => it.size === sizeEl.value && it.color === colorEl.value);
      if (!v) {
        stockEl.textContent = "Combinacao indisponivel no momento.";
        stockEl.className = "notice err";
        return 0;
      }
      stockEl.textContent = `Estoque disponivel: ${v.stock}`;
      stockEl.className = "notice";
      return Number(v.stock || 0);
    };

    sizeEl.addEventListener("change", refreshStock);
    colorEl.addEventListener("change", refreshStock);
    refreshStock();

    document.getElementById("add-btn").addEventListener("click", async () => {
      const qty = Number(document.getElementById("qty").value || 1);
      const status = document.getElementById("prod-status");
      const stock = refreshStock();
      if (!stock || qty > stock) {
        status.textContent = "Quantidade acima do estoque para esta variacao.";
        status.className = "notice err";
        return;
      }

      try {
        await addToCart({
          cart_token: getCartToken(),
          product_id: p.id,
          size: sizeEl.value,
          color: colorEl.value,
          quantity: qty,
        });
        status.textContent = "Peca adicionada ao carrinho.";
        status.className = "notice ok";
        await syncHeaderCartState();
      } catch (e) {
        status.textContent = e.message;
        status.className = "notice err";
      }
    });
  } catch (e) {
    box.innerHTML = `<p class="notice err">${escapeHtml(e.message)}</p>`;
  }
}

async function loadCart() {
  const area = document.getElementById("cart-area");
  const checkoutNote = document.getElementById("checkout-cart-note");
  const miniSummary = document.getElementById("cart-mini-summary");
  if (!area && !checkoutNote) return;

  const d = await api(`/cart?cart_token=${encodeURIComponent(getCartToken())}`);
  const items = d.items || [];
  await syncHeaderCartState();

  if (checkoutNote) {
    checkoutNote.textContent = items.length > 0 ? `Resumo atual: ${formatBRL(d.total)} em ${items.length} item(ns).` : "Seu carrinho esta vazio.";
  }
  if (miniSummary) {
    miniSummary.textContent = items.length > 0 ? `${items.length} item(ns) | Total ${formatBRL(d.total)}` : "Seu carrinho esta vazio.";
  }

  if (!area) return;

  if (items.length === 0) {
    area.innerHTML = `<div class="card"><p>Seu carrinho esta vazio.</p><a class="btn" href="produtos.html">Explorar colecao</a></div>`;
    return;
  }

  const rows = items
    .map(
      (it) => `
      <tr>
        <td>${escapeHtml(it.product_name)}</td>
        <td>${escapeHtml(it.size)} / ${escapeHtml(it.color)}</td>
        <td>${it.quantity}</td>
        <td>${formatBRL(it.unit_price)}</td>
        <td>${formatBRL(it.line_total)}</td>
        <td>
          <details class="item-menu">
            <summary>Opcoes</summary>
            <div class="item-menu-row">
              <input class="qty-input" type="number" min="1" value="${it.quantity}" data-update="${it.item_id}" />
              <button class="alt" data-remove="${it.item_id}" type="button">Remover</button>
            </div>
          </details>
        </td>
      </tr>
    `,
    )
    .join("");

  area.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Produto</th><th>Variacao</th><th>Qtd</th><th>Preco</th><th>Total</th><th></th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="summary">
      <strong>Total: ${formatBRL(d.total)}</strong>
      <a class="btn" href="checkout.html">Finalizar Compra</a>
    </div>
  `;

  area.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api("/cart/remove", "DELETE", { cart_token: getCartToken(), item_id: Number(btn.dataset.remove) });
      await loadCart();
    });
  });

  area.querySelectorAll("[data-update]").forEach((input) => {
    input.addEventListener("change", async () => {
      const q = Number(input.value || 1);
      if (q < 1) {
        input.value = "1";
        return;
      }
      await api("/cart/update", "PUT", {
        cart_token: getCartToken(),
        item_id: Number(input.dataset.update),
        quantity: q,
      });
      await loadCart();
    });
  });
}

async function initCheckout() {
  const form = document.getElementById("checkout-form");
  if (!form) return;
  const out = document.getElementById("checkout-status");
  const quoteBtn = document.getElementById("quote-shipping-btn");
  const cepInput = document.getElementById("destination-cep");
  const optionSelect = document.getElementById("shipping-option");
  const shippingNote = document.getElementById("shipping-note");

  let selectedShipping = null;

  const renderShippingOptions = (quote) => {
    const options = quote.options || [];
    optionSelect.innerHTML = '<option value="">Selecione o frete</option>';
    options.forEach((op, idx) => {
      const label = `${op.service} - ${op.company || "Transportadora"} (${formatBRL(op.price)} | ${op.delivery_days} dia(s))`;
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = label;
      opt.dataset.price = String(op.price || 0);
      opt.dataset.name = op.service || "";
      optionSelect.appendChild(opt);
    });
    if (options.length > 0) {
      optionSelect.value = "0";
      selectedShipping = {
        name: options[0].service || "",
        price: Number(options[0].price || 0),
      };
    }
    if (shippingNote) {
      shippingNote.textContent =
        quote.provider_status === "live"
          ? `Frete calculado pela API Melhor Envio a partir de Sao Francisco de Paula (${quote.origin_cep}).`
          : "Frete calculado em modo fallback local. Configure MELHOR_ENVIO_TOKEN para cotacao real.";
      shippingNote.className = quote.provider_status === "live" ? "notice ok" : "notice";
    }
  };

  optionSelect?.addEventListener("change", () => {
    const sel = optionSelect.options[optionSelect.selectedIndex];
    if (!sel || !sel.dataset.name) {
      selectedShipping = null;
      return;
    }
    selectedShipping = {
      name: sel.dataset.name,
      price: Number(sel.dataset.price || 0),
    };
  });

  quoteBtn?.addEventListener("click", async () => {
    const cep = String(cepInput?.value || "").trim();
    if (!cep) {
      if (shippingNote) {
        shippingNote.textContent = "Informe o CEP para calcular frete.";
        shippingNote.className = "notice err";
      }
      return;
    }
    try {
      const quote = await api("/api/shipping/quote", "POST", {
        cart_token: getCartToken(),
        destination_cep: cep,
      });
      renderShippingOptions(quote);
    } catch (e) {
      selectedShipping = null;
      optionSelect.innerHTML = '<option value="">Selecione o frete</option>';
      if (shippingNote) {
        shippingNote.textContent = e.message;
        shippingNote.className = "notice err";
      }
    }
  });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!selectedShipping) {
      out.textContent = "Calcule e selecione o frete antes de finalizar.";
      out.className = "notice err";
      return;
    }
    const fd = new FormData(form);
    const payload = {
      cart_token: getCartToken(),
      customer_name: String(fd.get("customer_name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      street: String(fd.get("street") || ""),
      number: String(fd.get("number") || ""),
      district: String(fd.get("district") || ""),
      city: String(fd.get("city") || ""),
      state: String(fd.get("state") || ""),
      zip_code: String(fd.get("destination_cep") || ""),
      address: String(fd.get("address") || ""),
      destination_cep: String(fd.get("destination_cep") || ""),
      payment_method: String(fd.get("payment_method") || "pix"),
      coupon_code: String(fd.get("coupon_code") || ""),
      shipping_name: selectedShipping.name,
      shipping_price: selectedShipping.price,
    };

    try {
      const d = await api("/api/checkout", "POST", payload);
      localStorage.removeItem("cart_token");
      out.textContent = `Obrigado por escolher a Knimodas. Pedido #${d.order_id} confirmado. Subtotal ${formatBRL(d.subtotal)}, frete ${formatBRL(d.shipping_cost)}, total ${formatBRL(d.total)}.`;
      out.className = "notice ok";
      form.reset();
      optionSelect.innerHTML = '<option value="">Selecione o frete</option>';
      selectedShipping = null;
      await loadCart();
      await syncHeaderCartState();
    } catch (e) {
      out.textContent = e.message;
      out.className = "notice err";
    }
  });
}

function initContact() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      message: String(fd.get("message") || ""),
    };

    const out = document.getElementById("contact-status");
    try {
      await api("/api/contact", "POST", payload);
      out.textContent = "Mensagem enviada. Nosso time retornara em breve.";
      out.className = "notice ok";
      form.reset();
    } catch (e) {
      out.textContent = e.message;
      out.className = "notice err";
    }
  });
}

function initNewsletter() {
  const form = document.getElementById("newsletter-form");
  if (!form) return;
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const out = document.getElementById("newsletter-status");
    out.textContent = "Voce agora recebe novidades exclusivas da Knimodas.";
    out.className = "notice ok";
    form.reset();
  });
}

async function loadRuntimeStatus() {
  const wrap = document.getElementById("runtime-status");
  if (!wrap) return;
  const note = document.getElementById("runtime-status-note");

  try {
    const [health, products, categories] = await Promise.all([api("/api/health"), api("/products"), api("/categories")]);
    const pCount = (products.products || []).length;
    const cCount = (categories.categories || []).length;
    const now = new Date().toLocaleString("pt-BR");

    wrap.innerHTML = `
      <article class="status-pill"><strong>API</strong><span>${escapeHtml(health.status || "ok")}</span></article>
      <article class="status-pill"><strong>Produtos</strong><span>${pCount}</span></article>
      <article class="status-pill"><strong>Categorias</strong><span>${cCount}</span></article>
      <article class="status-pill"><strong>Atualizado</strong><span>${escapeHtml(now)}</span></article>
    `;
    if (note) {
      note.textContent = "Status validado com chamadas reais para /api/health, /products e /categories.";
      note.className = "notice ok";
    }
  } catch (e) {
    wrap.innerHTML = `<article class="status-pill"><strong>Status</strong><span>offline</span></article>`;
    if (note) {
      note.textContent = `Falha ao consultar API: ${e.message}`;
      note.className = "notice err";
    }
  }
}

async function run() {
  setActiveNav();
  initMobileMenu();
  initHeaderCartPreviewEvents();
  syncHeaderAccountState();
  initMarketingPixels();
  initNewsletter();
  initContact();
  window.addEventListener("storage", (ev) => {
    if (ev.key === AUTH_TOKEN_KEY) syncHeaderAccountState();
  });
  window.addEventListener("auth:changed", syncHeaderAccountState);
  await Promise.all([loadHome(), loadCatalog(), loadProductPage(), loadCart(), initCheckout(), loadRuntimeStatus()]);
  await syncHeaderCartState();
}

run().catch((e) => {
  const n = document.getElementById("page-error");
  if (n) {
    n.textContent = e.message;
    n.className = "notice err";
  }
});

