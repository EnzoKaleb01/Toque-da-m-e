const WHATSAPP_NUMBER = "558596822257";

const colors = [
  { name: "Rosa bebê", hex: "#F2C6C2" },
  { name: "Lilás", hex: "#C9B8E4" },
  { name: "Preto", hex: "#232323" },
  { name: "Branco", hex: "#F7F3EC" },
  { name: "Vermelho", hex: "#B23A3A" },
  { name: "Vinho", hex: "#6B2439" },
  { name: "Verde oliva", hex: "#7C8B5E" },
  { name: "Azul sereno", hex: "#9FB8D9" },
  { name: "Nude", hex: "#D9B99B" },
  { name: "Dourado", hex: "#C99A55" },
  { name: "Cinza", hex: "#A8A29B" }
];

function shade(hex, percent) {
  let f = parseInt(hex.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent;
  let R = f >> 16, G = (f >> 8) & 0x00FF, B = f & 0x0000FF;
  let nr = Math.round((t - R) * p) + R, ng = Math.round((t - G) * p) + G, nb = Math.round((t - B) * p) + B;
  return "#" + (0x1000000 + nr * 0x10000 + ng * 0x100 + nb).toString(16).slice(1);
}

const prices = { simples: 10, dupla: 20, xuxinha: 3 };
const ATACADO_PRICE = 12;
const ATACADO_MIN_QTY = 10;
function formatBRL(v) { return "R$ " + v.toFixed(2).replace(".", ","); }
function unitPriceFor(state) {
  if (state.atacado && state.qtd >= ATACADO_MIN_QTY) return ATACADO_PRICE;
  return prices[state.tipo];
}

const state = { nome: "", tipo: null, tipoLabel: null, cor: null, cor2: null, obs: "", qtd: 1, pagamento: null, atacado: false, localizacao: null, cidadeEstado: "" };

// ---- build swatches ----
function buildSwatches(container, onPick) {
  container.innerHTML = "";
  colors.forEach(c => {
    const el = document.createElement("div");
    el.className = "swatch";
    el.style.background = c.hex;
    el.title = c.name;
    el.dataset.hex = c.hex;
    el.dataset.name = c.name;
    el.addEventListener("click", () => {
      [...container.children].forEach(s => s.classList.remove("selected"));
      el.classList.add("selected");
      onPick(c);
    });
    container.appendChild(el);
  });
}
buildSwatches(document.getElementById("swatchesMain"), c => { state.cor = c.name; document.getElementById("customColor").value = ""; renderPreview(); updateSummary(); });
buildSwatches(document.getElementById("swatchesSecond"), c => { state.cor2 = c.name; renderPreview(); updateSummary(); });

document.getElementById("customColor").addEventListener("input", e => {
  if (e.target.value.trim()) {
    state.cor = e.target.value.trim();
    [...document.getElementById("swatchesMain").children].forEach(s => s.classList.remove("selected"));
  } else {
    state.cor = null;
  }
  updateSummary();
});

// ---- type selection ----
const typeGrid = document.getElementById("typeGrid");
typeGrid.querySelectorAll(".type-option").forEach(opt => {
  opt.addEventListener("click", () => {
    typeGrid.querySelectorAll(".type-option").forEach(o => o.classList.remove("selected"));
    opt.classList.add("selected");
    opt.querySelector("input").checked = true;
    state.tipo = opt.dataset.type;
    state.tipoLabel = opt.querySelector("input").value;
    document.getElementById("secondColorField").style.display = state.tipo === "dupla" ? "block" : "none";
    document.getElementById("colorLabelExtra").textContent = state.tipo === "dupla" ? "(lado principal)" : "";
    renderPreview();
    updateSummary();
  });
});

// product-card quick pick links
document.querySelectorAll(".pick").forEach(link => {
  link.addEventListener("click", () => {
    const t = link.dataset.type;
    const opt = typeGrid.querySelector('.type-option[data-type="' + t + '"]');
    if (opt) opt.click();
  });
});

// ---- payment ----
const payOptions = document.querySelectorAll("#paymentGrid .pay-option");
payOptions.forEach(opt => {
  opt.addEventListener("click", () => {
    payOptions.forEach(o => o.classList.remove("selected"));
    opt.classList.add("selected");
    opt.querySelector("input").checked = true;
    state.pagamento = opt.dataset.pay;
    updateSummary();
  });
});

// ---- location ----
const locationOptions = document.querySelectorAll("#locationGrid .pay-option");
const cityStateField = document.getElementById("cityStateField");
const cityStateInput = document.getElementById("cityState");
locationOptions.forEach(opt => {
  opt.addEventListener("click", () => {
    locationOptions.forEach(o => o.classList.remove("selected"));
    opt.classList.add("selected");
    opt.querySelector("input").checked = true;
    state.localizacao = opt.dataset.loc;
    cityStateField.style.display = state.localizacao === "fora" ? "block" : "none";
    updateSummary();
  });
});
cityStateInput.addEventListener("input", (e) => { state.cidadeEstado = e.target.value; });

// ---- quantity ----
const qtyInput = document.getElementById("qtyValue");
document.getElementById("qtyMinus").addEventListener("click", () => {
  state.qtd = Math.max(1, state.qtd - 1);
  qtyInput.value = state.qtd;
  updateAtacadoHint();
  updateSummary();
});
document.getElementById("qtyPlus").addEventListener("click", () => {
  state.qtd = Math.min(999, state.qtd + 1);
  qtyInput.value = state.qtd;
  updateAtacadoHint();
  updateSummary();
});

// ---- wholesale (atacado) ----
const atacadoCheck = document.getElementById("atacadoCheck");
const atacadoHint = document.getElementById("atacadoHint");
function updateAtacadoHint() {
  if (!state.atacado) { atacadoHint.classList.remove("show"); return; }
  if (state.qtd < ATACADO_MIN_QTY) {
    const falta = ATACADO_MIN_QTY - state.qtd;
    atacadoHint.textContent = "Faltam " + falta + " unidade" + (falta > 1 ? "s" : "") + " para o preço de atacado (mínimo " + ATACADO_MIN_QTY + ").";
    atacadoHint.classList.add("show");
  } else {
    atacadoHint.textContent = "Preço de atacado ativado: " + formatBRL(ATACADO_PRICE) + " a peça.";
    atacadoHint.classList.add("show");
  }
}
atacadoCheck.addEventListener("change", () => {
  state.atacado = atacadoCheck.checked;
  updateAtacadoHint();
  updateSummary();
});

document.getElementById("obs").addEventListener("input", e => { state.obs = e.target.value; });
document.getElementById("customerName").addEventListener("input", e => { state.nome = e.target.value; updateSummary(); });

// ---- SVG preview rendering ----
function scallopPath(cx, cy, rOuter, rInner, bumps) {
  let d = "";
  for (let i = 0; i <= bumps; i++) {
    const aIn = (i / bumps) * 2 * Math.PI - Math.PI / 2;
    const xin = cx + rInner * Math.cos(aIn);
    const yin = cy + rInner * Math.sin(aIn);
    if (i === 0) { d += `M ${xin.toFixed(1)} ${yin.toFixed(1)} `; continue; }
    const aMid = ((i - 0.5) / bumps) * 2 * Math.PI - Math.PI / 2;
    const xmid = cx + rOuter * Math.cos(aMid);
    const ymid = cy + rOuter * Math.sin(aMid);
    d += `Q ${xmid.toFixed(1)} ${ymid.toFixed(1)} ${xin.toFixed(1)} ${yin.toFixed(1)} `;
  }
  return d + "Z";
}

function foldLines(cx, cy, rIn, rOut, count, color) {
  let lines = "";
  for (let i = 0; i < count; i++) {
    const a = (i / count) * 2 * Math.PI;
    const x1 = cx + rIn * Math.cos(a), y1 = cy + rIn * Math.sin(a);
    const x2 = cx + rOut * Math.cos(a), y2 = cy + rOut * Math.sin(a);
    lines += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="1.4" opacity="0.32" stroke-linecap="round"/>`;
  }
  return lines;
}

function bonnetSVG(main, opening) {
  const cx = 100, cy = 100;
  const shadow = scallopPath(cx, cy + 5, 74, 60, 12);
  const outer = scallopPath(cx, cy, 74, 60, 12);
  const inner = scallopPath(cx, cy, 38, 29, 10);
  const dark = shade(main, -0.16);
  return `
      <ellipse cx="${cx}" cy="164" rx="58" ry="9" fill="#000" opacity="0.08"/>
      <path d="${shadow}" fill="${dark}" opacity="0.55"/>
      <path d="${outer}" fill="${main}"/>
      ${foldLines(cx, cy, 34, 66, 8, dark)}
      <path d="${inner}" fill="${opening}"/>
      <path d="M84 70 Q100 60 116 70" stroke="${shade(opening, -0.28)}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.6"/>
      <circle cx="100" cy="63" r="2.6" fill="${shade(main, -0.3)}" opacity="0.6"/>
    `;
}

function domeSVG(main, band) {
  return bonnetSVG(main, band);
}
function duplaSVG(c1, c2) {
  return bonnetSVG(c1, c2);
}
function xuxinhaSVG(main) {
  const cx = 100, cy = 100;
  const dark = shade(main, -0.2);
  const shadow = scallopPath(cx, cy + 5, 70, 54, 14);
  const outer = scallopPath(cx, cy, 70, 54, 14);
  const hole = scallopPath(cx, cy, 27, 20, 10);
  return `
      <ellipse cx="${cx}" cy="158" rx="54" ry="8" fill="#000" opacity="0.08"/>
      <path d="${shadow}" fill="${dark}" opacity="0.5"/>
      <path d="${outer}" fill="${main}"/>
      ${foldLines(cx, cy, 30, 60, 10, dark)}
      <path d="${hole}" fill="#FBF1E7"/>
      <path d="M84 82 Q100 74 116 82" stroke="${dark}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.55"/>
    `;
}

function colorToHex(name) {
  const found = colors.find(c => c.name === name);
  return found ? found.hex : "#c98f83";
}

function renderPreview() {
  const live = document.getElementById("livePreview");
  const hero = document.getElementById("heroPreview");
  let svgInner;
  const c1 = state.cor ? colorToHex(state.cor) : "#E9B9B1";
  const c2 = state.cor2 ? colorToHex(state.cor2) : "#C99A55";

  if (state.tipo === "dupla") {
    svgInner = duplaSVG(c1, c2);
  } else if (state.tipo === "xuxinha") {
    svgInner = xuxinhaSVG(c1);
  } else {
    svgInner = domeSVG(c1, shade(c1, -0.18));
  }
  live.innerHTML = svgInner;
  hero.innerHTML = svgInner;
}
renderPreview();

function updateSummary() {
  const box = document.getElementById("summaryBox");
  if (!state.tipo && !state.cor) {
    box.innerHTML = "Escolha o modelo, a cor e a quantidade ao lado para ver o resumo do seu pedido aqui.";
    return;
  }
  const unit = state.tipo ? unitPriceFor(state) : null;
  const total = unit ? unit * state.qtd : null;
  let html = "";
  if (state.nome && state.nome.trim()) {
    html += "<b>Nome:</b> " + state.nome.trim() + "<br>";
  }
  html += "<b>Modelo:</b> " + (state.tipoLabel || "—") + (unit ? " · " + formatBRL(unit) + " cada" : "") + "<br>";
  html += "<b>Cor:</b> " + (state.cor || "—");
  if (state.tipo === "dupla") html += " / " + (state.cor2 || "—");
  html += "<br><b>Quantidade:</b> " + state.qtd + "<br>";
  if (state.localizacao === "fora") {
    html += "<b>Local:</b> " + (state.cidadeEstado.trim() || "fora de Fortaleza-CE (frete a combinar)") + "<br>";
  } else if (state.localizacao === "fortaleza") {
    html += "<b>Local:</b> Fortaleza-CE<br>";
  }
  html += "<b>Pagamento:</b> " + (state.pagamento || "—");
  if (total) { html += "<br><b>Total:</b> " + formatBRL(total); }
  box.innerHTML = html;
}

// ---- reliable external link opener (avoids popup/CSP issues with window.open) ----
function openExternal(url) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---- favorites ("guardar para depois") & order history, saved on this device ----
const FAV_KEY = "toqueDeMae_favoritos";
const ORDERS_KEY = "toqueDeMae_pedidos";

function loadList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function saveList(key, list) {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { /* storage indisponível, segue sem travar o site */ }
}
function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch (e) { return ""; }
}

function describeItem(item) {
  let s = "";
  if (item.nome) s += "<b>" + item.nome + "</b> — ";
  s += "<b>" + item.tipoLabel + "</b> · " + item.cor;
  if (item.tipo === "dupla" && item.cor2) s += " / " + item.cor2;
  s += " · qtd " + item.qtd;
  if (item.atacado) s += " · atacado";
  if (item.localizacao === "fora" && item.cidadeEstado) s += " · " + item.cidadeEstado;
  else if (item.localizacao === "fortaleza") s += " · Fortaleza-CE";
  if (item.pagamento) s += " · " + item.pagamento;
  if (item.total) s += " · " + formatBRL(item.total);
  return s;
}

function buildItemsMessage(items, nome) {
  let msg = "Olá! Meu nome é " + nome + " e gostaria de comprar:\n\n";
  let grandTotal = 0;
  items.forEach((item, idx) => {
    const unit = unitPriceFor(item);
    const total = unit * item.qtd;
    grandTotal += total;
    msg += (idx + 1) + ") " + item.tipoLabel + " - " + item.cor;
    if (item.tipo === "dupla" && item.cor2) msg += " / " + item.cor2;
    msg += " - qtd " + item.qtd;
    if (item.atacado && item.qtd >= ATACADO_MIN_QTY) msg += " (atacado)";
    if (item.obs && item.obs.trim()) msg += " - obs: " + item.obs.trim();
    if (item.localizacao === "fora" && item.cidadeEstado) msg += " - local: " + item.cidadeEstado;
    else if (item.localizacao === "fortaleza") msg += " - local: Fortaleza-CE";
    msg += " - " + formatBRL(unit) + " cada, subtotal " + formatBRL(total) + "\n";
  });
  msg += "\nTotal geral: " + formatBRL(grandTotal);
  if (items.length === 1 && items[0].pagamento) {
    msg += "\nForma de pagamento: " + items[0].pagamento;
  }
  msg += "\n\nAguardo confirmação, obrigado(a)!";
  return msg;
}

function getCustomerNameOrWarn() {
  const nameInput = document.getElementById("customerName");
  const name = (nameInput.value || "").trim();
  if (!name) {
    const errorMsg = document.getElementById("errorMsg");
    errorMsg.textContent = "Escreva seu nome no formulário de pedido antes de comprar.";
    errorMsg.classList.add("show");
    nameInput.scrollIntoView({ behavior: "smooth", block: "center" });
    nameInput.focus();
    return null;
  }
  return name;
}

function moveFavoriteToOrders(item, nome) {
  const unit = unitPriceFor(item);
  const total = unit * item.qtd;
  const orders = loadList(ORDERS_KEY);
  orders.push(Object.assign({}, item, {
    id: Date.now() + Math.random(),
    nome: nome || item.nome,
    total: total,
    date: new Date().toISOString()
  }));
  saveList(ORDERS_KEY, orders);
}

function buyFavorite(id) {
  const nome = getCustomerNameOrWarn();
  if (!nome) return;
  const list = loadList(FAV_KEY);
  const item = list.find(i => String(i.id) === String(id));
  if (!item) return;

  const msg = buildItemsMessage([item], nome);
  openExternal("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg));

  moveFavoriteToOrders(item, nome);
  saveList(FAV_KEY, list.filter(i => String(i.id) !== String(id)));
  renderFavorites();
  renderOrders();
}

function buyAllFavorites() {
  const nome = getCustomerNameOrWarn();
  if (!nome) return;
  const list = loadList(FAV_KEY);
  if (!list.length) return;

  const msg = buildItemsMessage(list, nome);
  openExternal("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg));

  list.forEach(item => moveFavoriteToOrders(item, nome));
  saveList(FAV_KEY, []);
  renderFavorites();
  renderOrders();
}

function renderFavorites() {
  const list = loadList(FAV_KEY);
  const box = document.getElementById("favoritesList");
  if (!list.length) {
    box.innerHTML = '<p class="list-empty">Você ainda não guardou nenhum modelo. Monte um pedido acima e clique em "Guardar para depois".</p>';
    return;
  }

  const grandTotal = list.reduce((sum, item) => sum + unitPriceFor(item) * item.qtd, 0);
  let html = '<div class="fh-buyall"><span>' + list.length + (list.length === 1 ? " item guardado · total " : " itens guardados · total ") + formatBRL(grandTotal) + '</span><button type="button" class="btn-primary" id="buyAllBtn" style="padding:10px 18px;font-size:0.85rem;">Comprar todas</button></div>';

  html += list.map(item => `
      <div class="fh-item">
        <div class="fh-info">${describeItem(item)}${item.obs ? '<br><span class="fh-date">' + item.obs + '</span>' : ''}<span class="fh-date">guardado em ${formatDate(item.savedAt)}</span></div>
        <div class="fh-actions">
          <button type="button" class="fh-btn" data-buy="${item.id}">Comprar</button>
          <button type="button" class="fh-btn" data-load="${item.id}">Editar</button>
          <button type="button" class="fh-btn danger" data-remove="${item.id}">Remover</button>
        </div>
      </div>
    `).join("");

  box.innerHTML = html;

  document.getElementById("buyAllBtn").addEventListener("click", buyAllFavorites);
  box.querySelectorAll("[data-buy]").forEach(btn => {
    btn.addEventListener("click", () => buyFavorite(btn.dataset.buy));
  });
  box.querySelectorAll("[data-load]").forEach(btn => {
    btn.addEventListener("click", () => loadFavoriteIntoForm(btn.dataset.load));
  });
  box.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      const updated = loadList(FAV_KEY).filter(i => String(i.id) !== btn.dataset.remove);
      saveList(FAV_KEY, updated);
      renderFavorites();
    });
  });
}

function renderOrders() {
  const list = loadList(ORDERS_KEY);
  const box = document.getElementById("ordersList");
  if (!list.length) {
    box.innerHTML = '<p class="list-empty">Seus pedidos confirmados vão aparecer aqui, com a data de cada um.</p>';
    return;
  }
  box.innerHTML = list.slice().reverse().map(item => `
      <div class="fh-item">
        <div class="fh-info">${describeItem(item)}<span class="fh-date">enviado em ${formatDate(item.date)}</span></div>
      </div>
    `).join("");
}

function loadFavoriteIntoForm(id) {
  const item = loadList(FAV_KEY).find(i => String(i.id) === String(id));
  if (!item) return;

  document.getElementById("customerName").value = item.nome || "";
  state.nome = item.nome || "";

  const typeOpt = typeGrid.querySelector('.type-option[data-type="' + item.tipo + '"]');
  if (typeOpt) typeOpt.click();

  const mainSwatch = [...document.getElementById("swatchesMain").children].find(s => s.dataset.name === item.cor);
  if (mainSwatch) { mainSwatch.click(); }
  else { document.getElementById("customColor").value = item.cor; document.getElementById("customColor").dispatchEvent(new Event("input")); }

  if (item.tipo === "dupla" && item.cor2) {
    const secondSwatch = [...document.getElementById("swatchesSecond").children].find(s => s.dataset.name === item.cor2);
    if (secondSwatch) secondSwatch.click();
  }

  document.getElementById("obs").value = item.obs || "";
  state.obs = item.obs || "";

  state.qtd = item.qtd || 1;
  qtyInput.value = state.qtd;

  state.atacado = !!item.atacado;
  atacadoCheck.checked = state.atacado;
  updateAtacadoHint();

  if (item.localizacao) {
    const locOpt = [...locationOptions].find(o => o.dataset.loc === item.localizacao);
    if (locOpt) locOpt.click();
    if (item.localizacao === "fora") {
      cityStateInput.value = item.cidadeEstado || "";
      state.cidadeEstado = item.cidadeEstado || "";
    }
  }

  if (item.pagamento) {
    const payOpt = [...payOptions].find(o => o.dataset.pay === item.pagamento);
    if (payOpt) payOpt.click();
  }

  updateSummary();
  document.getElementById("pedido").scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("saveForLaterBtn").addEventListener("click", () => {
  const errorMsg = document.getElementById("errorMsg");
  if (!state.tipo || !state.cor) {
    errorMsg.textContent = "Escolha ao menos o modelo e a cor antes de guardar para depois.";
    errorMsg.classList.add("show");
    return;
  }
  errorMsg.classList.remove("show");

  const list = loadList(FAV_KEY);
  list.push({
    id: Date.now(),
    nome: state.nome,
    tipo: state.tipo, tipoLabel: state.tipoLabel,
    cor: state.cor, cor2: state.cor2,
    obs: state.obs, qtd: state.qtd, pagamento: state.pagamento,
    atacado: state.atacado,
    localizacao: state.localizacao, cidadeEstado: state.cidadeEstado,
    savedAt: new Date().toISOString()
  });
  saveList(FAV_KEY, list);
  renderFavorites();

  const savedMsg = document.getElementById("savedMsg");
  savedMsg.classList.add("show");
  setTimeout(() => savedMsg.classList.remove("show"), 3500);
});

// ---- submit ----
document.getElementById("orderForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const errorMsg = document.getElementById("errorMsg");
  if (!state.nome || !state.nome.trim()) {
    errorMsg.textContent = "Escreva seu nome antes de enviar o pedido.";
    errorMsg.classList.add("show");
    return;
  }
  if (!state.tipo || !state.cor || !state.pagamento) {
    errorMsg.textContent = "Escolha o modelo, a cor, o pagamento e confira a quantidade antes de enviar.";
    errorMsg.classList.add("show");
    return;
  }
  if (state.localizacao === "fora" && !state.cidadeEstado.trim()) {
    errorMsg.textContent = "Escreva sua cidade e estado, já que o pedido é de fora de Fortaleza.";
    errorMsg.classList.add("show");
    return;
  }
  errorMsg.classList.remove("show");

  let msg = "Olá! Meu nome é " + state.nome.trim() + " e gostaria de fazer um pedido na Toque de Mãe 🎀\n\n";
  msg += "Tipo de touca: " + state.tipoLabel + "\n";
  msg += "Cor: " + state.cor;
  if (state.tipo === "dupla" && state.cor2) {
    msg += " / " + state.cor2;
  }
  msg += "\n";
  if (state.obs && state.obs.trim()) {
    msg += "Estilo/observações: " + state.obs.trim() + "\n";
  }
  if (state.localizacao === "fora") {
    msg += "Local: " + state.cidadeEstado.trim() + " (fora de Fortaleza-CE, combinar frete)\n";
  } else if (state.localizacao === "fortaleza") {
    msg += "Local: Fortaleza-CE\n";
  }
  const unit = unitPriceFor(state);
  const total = unit * state.qtd;
  msg += "Quantidade: " + state.qtd + "\n";
  if (state.atacado && state.qtd >= ATACADO_MIN_QTY) {
    msg += "Pedido para revenda (atacado)\n";
  }
  msg += "Valor: " + formatBRL(unit) + " cada, total " + formatBRL(total) + "\n";
  msg += "Forma de pagamento: " + state.pagamento + "\n\n";
  msg += "Aguardo confirmação, obrigado(a)!";

  const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg);
  openExternal(url);

  const orders = loadList(ORDERS_KEY);
  orders.push({
    id: Date.now(),
    nome: state.nome,
    tipo: state.tipo, tipoLabel: state.tipoLabel,
    cor: state.cor, cor2: state.cor2,
    obs: state.obs, qtd: state.qtd, pagamento: state.pagamento,
    atacado: state.atacado,
    localizacao: state.localizacao, cidadeEstado: state.cidadeEstado,
    total: total,
    date: new Date().toISOString()
  });
  saveList(ORDERS_KEY, orders);
  renderOrders();
});

// ---- photo carousel per model type ----
function getImgSrc(altText) {
  const el = document.querySelector('img[alt="' + altText + '"]');
  return el ? el.src : '';
}
const xuxinhaPhotos = [
  "FOTOS/foto 12.jpeg",
  "FOTOS/foto 13.jpeg",
  "FOTOS/foto 14.jpeg",
  "FOTOS/foto 15.jpeg",
  "FOTOS/foto 16.jpeg",
  
];

const simplesPhotos = [
  "FOTOS/foto 2.jpeg",
  "FOTOS/foto 3.jpeg",
  "FOTOS/foto 4.jpeg",
  "FOTOS/foto 5.jpeg",
  "FOTOS/foto 6.jpeg",
];
const duplaPhotos = [
  "FOTOS/foto 8.jpeg",
  "FOTOS/foto 9.jpeg",
  "FOTOS/foto 10.jpeg",
  "FOTOS/foto 11.jpeg",
  
];

const galleryImages = {
  simples: simplesPhotos,
  dupla: duplaPhotos,
  xuxinha: xuxinhaPhotos
};

const carouselTitles = { simples: "Touca Simples", dupla: "Touca Faixa Dupla Cor", xuxinha: "Xuxinha" };
let carouselImages = [];
let carouselIndex = 0;

function renderCarousel() {
  const vp = document.getElementById("carouselViewport");
  const dots = document.getElementById("carouselDots");
  if (!carouselImages.length) {
    vp.innerHTML = '<p style="padding:20px;text-align:center;color:var(--ink-soft);font-size:0.9rem;">Ainda não temos fotos para este modelo.</p>';
    dots.innerHTML = "";
    return;
  }
  vp.innerHTML = carouselImages.map((src, i) => '<img src="' + src + '" class="' + (i === carouselIndex ? 'active' : '') + '">').join("");
  dots.innerHTML = carouselImages.map((_, i) => '<span class="' + (i === carouselIndex ? 'active' : '') + '" data-i="' + i + '"></span>').join("");
  dots.querySelectorAll("span").forEach(s => {
    s.addEventListener("click", () => { carouselIndex = parseInt(s.dataset.i, 10); renderCarousel(); });
  });
}
function openCarousel(type) {
  carouselImages = galleryImages[type] || [];
  carouselIndex = 0;
  document.getElementById("carouselTitle").textContent = carouselTitles[type] || "Fotos";
  renderCarousel();
  document.getElementById("carouselOverlay").classList.add("open");
}
document.querySelectorAll("[data-carousel]").forEach(btn => {
  btn.addEventListener("click", () => openCarousel(btn.dataset.carousel));
});
document.getElementById("carouselPrev").addEventListener("click", () => {
  if (!carouselImages.length) return;
  carouselIndex = (carouselIndex - 1 + carouselImages.length) % carouselImages.length;
  renderCarousel();
});
document.getElementById("carouselNext").addEventListener("click", () => {
  if (!carouselImages.length) return;
  carouselIndex = (carouselIndex + 1) % carouselImages.length;
  renderCarousel();
});
document.getElementById("carouselClose").addEventListener("click", () => {
  document.getElementById("carouselOverlay").classList.remove("open");
});
document.getElementById("carouselOverlay").addEventListener("click", (e) => {
  if (e.target.id === "carouselOverlay") document.getElementById("carouselOverlay").classList.remove("open");
});


// ---- premium marquee carousel ----
const premiumItems = [
  { src: "assets/faixa_a_roxo_lilas.jpg", label: "Roxo & Lilás" },
  { src: "assets/faixa_b_marrom_pele.jpg", label: "Marrom & Pele" },
  { src: "assets/faixa_c_roxo_lilas2.jpg", label: "Roxo Escuro & Lilás" },
  { src: "assets/faixa_d_petroleo_escuro.jpg", label: "Petróleo & Preto" },
  { src: "assets/faixa_e_petroleo_roxo.jpg", label: "Petróleo & Roxo" }
];
const marqueeTrack = document.getElementById("marqueeTrack");
if (marqueeTrack) {
  const itemsHtml = premiumItems.map(it => '<div class="marquee-item"><img src=' + it.src + ' alt="Touca faixa dupla cor ' + it.label + '" loading="lazy"><span class="cap">' + it.label + '</span></div>').join("");
  marqueeTrack.innerHTML = itemsHtml + itemsHtml;
}

renderFavorites();
renderOrders();
