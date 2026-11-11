
// ===============================
// CAFÉ MANAGER - JAVASCRIPT
// ===============================

const defaultProducts = [
  { id: 1, name: "Café Noir", price: 10 },
  { id: 2, name: "Café Crème", price: 12 },
  { id: 3, name: "Nous-Nous", price: 12 },
  { id: 4, name: "Thé", price: 8 },
  { id: 5, name: "Jus", price: 15 },
  { id: 6, name: "Eau", price: 6 },
  { id: 7, name: "Pâtisserie", price: 12 },
  { id: 8, name: "Croissant", price: 7 },
  { id: 9, name: "Panaché", price: 18 }
];

let products = JSON.parse(localStorage.getItem("cafeProducts")) || defaultProducts;
let cart = [];
let sales = JSON.parse(localStorage.getItem("cafeSales")) || [];

function saveData() {
  localStorage.setItem("cafeProducts", JSON.stringify(products));
  localStorage.setItem("cafeSales", JSON.stringify(sales));
}

function money(value) {
  return Number(value).toFixed(2) + " DH";
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// ===============================
// NAVIGATION
// ===============================

function showPage(page, button) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  document.getElementById(page).classList.add("active");
  button.classList.add("active");

  if (page === "produits") renderManageProducts();
  if (page === "historique") renderHistory();
}

// ===============================
// PRODUCTS
// ===============================

function renderProducts() {
  const container = document.getElementById("products");
  const search = document.getElementById("search").value.toLowerCase();

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search)
  );

  container.innerHTML = filtered.map(p => `
    <div class="product-card" onclick="addToCart(${p.id})">
      <h3>${escapeHTML(p.name)}</h3>
      <strong>${money(p.price)}</strong>
    </div>
  `).join("");
}

function addProduct() {
  const nameInput = document.getElementById("productName");
  const priceInput = document.getElementById("productPrice");

  const name = nameInput.value.trim();
  const price = Number(priceInput.value);

  if (!name || priceInput.value === "" || !Number.isFinite(price) || price < 0) {
    alert("Veuillez saisir un nom et un prix valide.");
    return;
  }

  products.push({
    id: Date.now(),
    name,
    price
  });

  saveData();
  nameInput.value = "";
  priceInput.value = "";

  renderManageProducts();
  renderProducts();
}

function renderManageProducts() {
  const container = document.getElementById("manageProducts");

  container.innerHTML = products.map(p => `
    <div class="manage-row">
      <div>
        <strong>${escapeHTML(p.name)}</strong>
        <br>
        ${money(p.price)}
      </div>
      <div>
        <button onclick="editProduct(${p.id})">Modifier</button>
        <button onclick="deleteProduct(${p.id})">Supprimer</button>
      </div>
    </div>
  `).join("");
}

function editProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const name = prompt("Nouveau nom :", product.name);
  if (name === null) return;

  const price = prompt("Nouveau prix DH :", product.price);
  if (price === null) return;

  const newName = name.trim();
  const newPrice = Number(price);

  if (!newName || price.trim() === "" || !Number.isFinite(newPrice) || newPrice < 0) {
    alert("Informations invalides.");
    return;
  }

  product.name = newName;
  product.price = newPrice;

  // Mettre à jour le prix des articles déjà dans le panier
  cart.forEach(item => {
    if (item.id === id) {
      item.name = newName;
      item.price = newPrice;
    }
  });

  saveData();
  renderManageProducts();
  renderProducts();
  renderCart();
}

function deleteProduct(id) {
  if (!confirm("Supprimer ce produit ?")) return;

  products = products.filter(p => p.id !== id);
  cart = cart.filter(item => item.id !== id);

  saveData();
  renderManageProducts();
  renderProducts();
  renderCart();
}

// ===============================
// CART / COMMANDES
// ===============================

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }

  renderCart();
}

function changeQuantity(id, change) {
  const item = cart.find(p => p.id === id);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(p => p.id !== id);
  }

  renderCart();
}

function removeItem(id) {
  cart = cart.filter(p => p.id !== id);
  renderCart();
}

function getTotal() {
  return cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
}

function renderCart() {
  const container = document.getElementById("cart");

  if (cart.length === 0) {
    container.innerHTML = "<p>Aucun produit sélectionné.</p>";
  } else {
    container.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div>
          <strong>${escapeHTML(item.name)}</strong>
          <small>${money(item.price)} × ${item.quantity}</small>
        </div>

        <div class="quantity">
          <button onclick="changeQuantity(${item.id}, -1)">−</button>
          <strong>${item.quantity}</strong>
          <button onclick="changeQuantity(${item.id}, 1)">+</button>
          <button class="remove-btn" onclick="removeItem(${item.id})">✕</button>
        </div>
      </div>
    `).join("");
  }

  document.getElementById("total").textContent = money(getTotal());
}

function clearCart() {
  if (cart.length === 0) return;

  if (confirm("Vider toute la commande ?")) {
    cart = [];
    renderCart();
  }
}

// ===============================
// VALIDATION ET TICKET
// ===============================

function finishSale() {
  if (cart.length === 0) {
    alert("Veuillez ajouter des produits à la commande.");
    return;
  }

  const sale = {
    id: Date.now(),
    date: new Date().toLocaleString("fr-FR"),
    items: cart.map(item => ({ ...item })),
    total: getTotal()
  };

  sales.unshift(sale);
  saveData();

  printTicket(sale);

  cart = [];
  renderCart();
}

function printTicket(sale) {
  const receipt = document.getElementById("receipt");

  const itemsHTML = sale.items.map(item => `
    <div class="receipt-line">
      <span>${escapeHTML(item.name)} x${item.quantity}</span>
      <span>${money(item.price * item.quantity)}</span>
    </div>
  `).join("");

  receipt.innerHTML = `
    <div class="receipt-title">
      <h2>☕ CAFÉ</h2>
      <p>Ticket de caisse</p>
      <p>${escapeHTML(sale.date)}</p>
      <p>N° ${sale.id}</p>
    </div>

    <hr>

    ${itemsHTML}

    <div class="receipt-line receipt-total">
      <span>TOTAL</span>
      <span>${money(sale.total)}</span>
    </div>

    <div class="receipt-footer">
      <p>Merci pour votre visite !</p>
      <p>À bientôt ❤️</p>
    </div>
  `;

  window.print();
}

// ===============================
// HISTORIQUE DES VENTES
// ===============================

function renderHistory() {
  const total = sales.reduce((sum, sale) => sum + sale.total, 0);

  document.getElementById("salesCount").textContent = sales.length;
  document.getElementById("salesTotal").textContent = money(total);

  const container = document.getElementById("salesHistory");

  if (sales.length === 0) {
    container.innerHTML = "<p>Aucune vente enregistrée.</p>";
    return;
  }

  container.innerHTML = sales.map(sale => `
    <div class="sale-row">
      <strong>Vente N° ${sale.id}</strong>
      <p>${escapeHTML(sale.date)}</p>
      <p>${sale.items.map(item =>
        `${escapeHTML(item.name)} x${item.quantity}`
      ).join(", ")}</p>
      <strong>${money(sale.total)}</strong>
      <button onclick="reprintSale(${sale.id})">Réimprimer</button>
    </div>
  `).join("");
}

function reprintSale(id) {
  const sale = sales.find(s => s.id === id);
  if (sale) printTicket(sale);
}

// ===============================
// HORLOGE
// ===============================

function updateClock() {
  document.getElementById("clock").textContent =
    new Date().toLocaleString("fr-FR");
}

setInterval(updateClock, 1000);
updateClock();

// ===============================
// INITIALISATION
// ===============================

renderProducts();
renderCart();
