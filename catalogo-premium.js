const WHATSAPP_NUMBER = "558596822257";
  const UNIT_PRICE = 20;
  const FAV_KEY = "toqueDeMae_favoritos";
  const ORDERS_KEY = "toqueDeMae_pedidos";
  const qtyState = {};
  let cart = [];

  function formatBRL(v){ return "R$ " + v.toFixed(2).replace(".", ","); }

  function loadList(key){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }
  function saveList(key, list){
    try{ localStorage.setItem(key, JSON.stringify(list)); }catch(e){ /* segue sem travar o site */ }
  }

  function openExternal(url){
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  document.querySelectorAll(".pp-qty-minus").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = btn.dataset.idx;
      const input = document.getElementById("ppQty" + idx);
      let val = Math.max(1, parseInt(input.value, 10) - 1);
      input.value = val;
      qtyState[idx] = val;
    });
  });
  document.querySelectorAll(".pp-qty-plus").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = btn.dataset.idx;
      const input = document.getElementById("ppQty" + idx);
      let val = Math.min(999, parseInt(input.value, 10) + 1);
      input.value = val;
      qtyState[idx] = val;
    });
  });

  // ---- cart ----
  function renderCart(){
    const listEl = document.getElementById("cartList");
    const totalEl = document.getElementById("cartTotal");
    const totalValueEl = document.getElementById("cartTotalValue");

    if(!cart.length){
      listEl.innerHTML = '<p class="cart-empty">Nenhuma touca adicionada ainda. Escolha a quantidade em um modelo acima e clique em "Adicionar ao pedido".</p>';
      totalEl.style.display = "none";
      return;
    }

    listEl.innerHTML = cart.map((item, i) => `
      <div class="cart-item">
        <span>${item.nome} · qtd ${item.qtd} · ${formatBRL(UNIT_PRICE * item.qtd)}</span>
        <button type="button" class="ci-remove" data-remove="${i}">remover</button>
      </div>
    `).join("");

    listEl.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        cart.splice(parseInt(btn.dataset.remove, 10), 1);
        renderCart();
      });
    });

    const total = cart.reduce((sum, item) => sum + UNIT_PRICE * item.qtd, 0);
    totalValueEl.textContent = formatBRL(total);
    totalEl.style.display = "flex";
  }

  document.querySelectorAll(".pp-add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = btn.dataset.idx;
      const nome = btn.dataset.nome;
      const qtd = parseInt(document.getElementById("ppQty" + idx).value, 10) || 1;
      const existing = cart.find(i => i.nome === nome);
      if(existing){ existing.qtd += qtd; }
      else { cart.push({ nome: nome, qtd: qtd }); }
      renderCart();
      document.getElementById("cartError").classList.remove("show");
      btn.textContent = "Adicionado ✓";
      setTimeout(() => { btn.textContent = "Adicionar ao pedido"; }, 1400);
    });
  });

  // ---- guardar para depois (compartilhado com a página principal) ----
  document.querySelectorAll(".pp-save-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = btn.dataset.idx;
      const nome = btn.dataset.nome;
      const qtd = parseInt(document.getElementById("ppQty" + idx).value, 10) || 1;
      const nomeCliente = (document.getElementById("cartName").value || "").trim();

      const list = loadList(FAV_KEY);
      list.push({
        id: Date.now() + Math.random(),
        nome: nomeCliente,
        tipo: "dupla",
        tipoLabel: "Touca Faixa Dupla Cor",
        cor: nome,
        cor2: null,
        obs: "",
        qtd: qtd,
        pagamento: null,
        atacado: false,
        localizacao: null,
        cidadeEstado: "",
        savedAt: new Date().toISOString()
      });
      saveList(FAV_KEY, list);

      btn.textContent = "Guardado ✓";
      setTimeout(() => { btn.textContent = "Guardar para depois"; }, 1400);
    });
  });

  // ---- enviar pedido do carrinho ----
  document.getElementById("sendCartBtn").addEventListener("click", () => {
    const errorEl = document.getElementById("cartError");
    const nome = (document.getElementById("cartName").value || "").trim();

    if(!nome){
      errorEl.textContent = "Escreva seu nome antes de enviar o pedido.";
      errorEl.classList.add("show");
      document.getElementById("cartName").focus();
      return;
    }
    if(!cart.length){
      errorEl.textContent = "Adicione ao menos uma touca ao pedido antes de enviar.";
      errorEl.classList.add("show");
      return;
    }
    errorEl.classList.remove("show");

    let msg = "Olá! Meu nome é " + nome + " e gostaria de pedir do Catálogo Premium:\n\n";
    let grandTotal = 0;
    cart.forEach((item, i) => {
      const subtotal = UNIT_PRICE * item.qtd;
      grandTotal += subtotal;
      msg += (i + 1) + ") Touca Faixa Dupla Cor - " + item.nome + " - qtd " + item.qtd + " - " + formatBRL(UNIT_PRICE) + " cada, subtotal " + formatBRL(subtotal) + "\n";
    });
    msg += "\nTotal geral: " + formatBRL(grandTotal);
    msg += "\n\nAguardo confirmação, obrigado(a)!";

    openExternal("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg));

    const orders = loadList(ORDERS_KEY);
    cart.forEach(item => {
      orders.push({
        id: Date.now() + Math.random(),
        nome: nome,
        tipo: "dupla",
        tipoLabel: "Touca Faixa Dupla Cor",
        cor: item.nome,
        cor2: null,
        obs: "",
        qtd: item.qtd,
        pagamento: null,
        atacado: false,
        localizacao: null,
        cidadeEstado: "",
        total: UNIT_PRICE * item.qtd,
        date: new Date().toISOString()
      });
    });
    saveList(ORDERS_KEY, orders);

    cart = [];
    renderCart();
  });

  renderCart();
