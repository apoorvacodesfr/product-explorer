// app.js — product rendering, search, filters, sorting and shopping bag.
import { fetchProducts, fetchCategories } from "./api.js";
import { loadCart, saveCart, loadPreferences, savePreferences } from "./storage.js";

const elements = {
  search: document.querySelector("#searchInput"),
  sort: document.querySelector("#sortSelect"),
  tabs: document.querySelector("#categoryTabs"),
  grid: document.querySelector("#productGrid"),
  skeleton: document.querySelector("#skeletonGrid"),
  count: document.querySelector("#resultCount"),
  error: document.querySelector("#errorBanner"),
  errorMessage: document.querySelector("#errorMessage"),
  retry: document.querySelector("#retryButton"),
  empty: document.querySelector("#emptyState"),
  clear: document.querySelector("#clearFiltersButton"),
  cartButton: document.querySelector("#cartButton"),
  cartCount: document.querySelector("#cartCount"),
  cartDialog: document.querySelector("#cartDialog"),
  closeCart: document.querySelector("#closeCartButton"),
  cartItems: document.querySelector("#cartItems"),
  subtotal: document.querySelector("#cartSubtotal"),
  toast: document.querySelector("#toast")
};

let products = [];
let cart = loadCart();
const preferences = loadPreferences();
let activeCategory = preferences.category;
let searchTerm = "";
let sortMode = preferences.sort;
let toastTimer;
let toastMessage = "";

const money = value => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
}).format(Number(value) || 0);

const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

function showToast(message) {
  toastMessage = message;
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2100);
}

function setLoading(isLoading) {
  elements.skeleton.hidden = !isLoading;
  elements.grid.hidden = isLoading;
  if (isLoading) elements.empty.hidden = true;
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.error.hidden = false;
}

async function initialise() {
  setLoading(true);
  elements.error.hidden = true;
  elements.retry.disabled = true;

  try {
    const [productData, categoryData] = await Promise.all([
      fetchProducts(),
      fetchCategories()
    ]);

    products = productData;
    if (!products.length) throw new Error("There are no products to display right now.");

    if (!categoryData.includes(activeCategory)) activeCategory = "all";
    renderCategories(categoryData);
    elements.sort.value = sortMode;
    updateActiveTab();
    renderProducts();
    updateCartCount();
  } catch (error) {
    console.error("Shoply could not load its data:", error);
    showError(error.message || "Please check your internet connection and try again.");
    elements.count.textContent = "Collection unavailable";
  } finally {
    setLoading(false);
    elements.retry.disabled = false;
  }
}

function renderCategories(categories) {
  const allButton = '<button class="category-tab" data-category="all" type="button">Everything</button>';
  elements.tabs.innerHTML = allButton + categories.map(category => {
    const safeCategory = escapeHTML(category);
    return `<button class="category-tab" data-category="${safeCategory}" type="button">${safeCategory}</button>`;
  }).join("");
}

function updateActiveTab() {
  elements.tabs.querySelectorAll(".category-tab").forEach(button => {
    const isActive = button.dataset.category === activeCategory;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function getVisibleProducts() {
  let result = [...products];

  if (activeCategory !== "all") {
    result = result.filter(product => product.category === activeCategory);
  }

  if (searchTerm) {
    result = result.filter(product =>
      `${product.title} ${product.description} ${product.category}`
        .toLowerCase()
        .includes(searchTerm)
    );
  }

  switch (sortMode) {
    case "price-low":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      result.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      result.sort((a, b) => b.rating.rate - a.rating.rate);
      break;
    case "name":
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      result.sort((a, b) => a.id - b.id);
  }

  return result;
}

function renderProducts() {
  const visible = getVisibleProducts();
  elements.count.textContent = `${visible.length} ${visible.length === 1 ? "find" : "finds"} to explore`;

  elements.grid.innerHTML = visible.map(product => {
    const rating = product.rating.rate.toFixed(1);
    const image = product.image
      ? `<img class="product-image" src="${escapeHTML(product.image)}" alt="${escapeHTML(product.title)}" loading="lazy">`
      : '<span class="image-fallback" aria-hidden="true">✳</span>';

    return `
      <article class="product-card">
        <div class="product-image-wrap">
          <span class="product-category">${escapeHTML(product.category)}</span>
          ${image}
        </div>
        <div class="product-info">
          <h3 class="product-title" title="${escapeHTML(product.title)}">${escapeHTML(product.title)}</h3>
          <div class="product-rating" aria-label="${rating} out of 5 stars">★ ${rating} <span>(${product.rating.count} reviews)</span></div>
          <div class="product-bottom">
            <strong class="product-price">${money(product.price)}</strong>
            <button class="add-button" data-add="${product.id}" type="button">+ Add to bag</button>
          </div>
        </div>
      </article>`;
  }).join("");

  elements.empty.hidden = visible.length !== 0;
  elements.grid.hidden = visible.length === 0;
}

function saveCurrentPreferences() {
  savePreferences({ category: activeCategory, sort: sortMode });
}

function addToCart(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, 99);
  } else {
    cart.push({ id: productId, quantity: 1 });
  }

  saveCart(cart);
  updateCartCount();
  showToast("A good find. Added to your bag!");
}

function updateCartCount() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  elements.cartCount.textContent = count > 99 ? "99+" : String(count);
  elements.cartButton.setAttribute("aria-label", `Open shopping bag, ${count} items`);
}

function changeQuantity(productId, change) {
  const item = cart.find(entry => entry.id === productId);
  if (!item) return;

  item.quantity += change;
  if (item.quantity <= 0) {
    cart = cart.filter(entry => entry.id !== productId);
  } else {
    item.quantity = Math.min(item.quantity, 99);
  }

  saveCart(cart);
  updateCartCount();
  renderCart();
}

function renderCart() {
  const cartProducts = cart.map(item => {
    const product = products.find(entry => entry.id === item.id);
    return product ? { ...product, quantity: item.quantity } : null;
  }).filter(Boolean);

  if (!cartProducts.length) {
    elements.cartItems.innerHTML = '<p class="cart-empty">Your bag is looking a little empty. Find something you love.</p>';
    elements.subtotal.textContent = money(0);
    return;
  }

  elements.cartItems.innerHTML = cartProducts.map(item => `
    <div class="cart-item">
      <img src="${escapeHTML(item.image)}" alt="">
      <div class="cart-item-info">
        <strong>${escapeHTML(item.title)}</strong>
        <span>${money(item.price)} each</span>
        <div class="quantity-controls" aria-label="Quantity controls">
          <button data-change="-1" data-id="${item.id}" type="button" aria-label="Decrease quantity">−</button>
          <span>${item.quantity}</span>
          <button data-change="1" data-id="${item.id}" type="button" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <button class="remove-item" data-remove="${item.id}" type="button">Remove</button>
    </div>`).join("");

  const total = cartProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
  elements.subtotal.textContent = money(total);
}

elements.search.addEventListener("input", event => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderProducts();
});

elements.sort.addEventListener("change", event => {
  sortMode = event.target.value;
  saveCurrentPreferences();
  renderProducts();
});

elements.tabs.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  saveCurrentPreferences();
  updateActiveTab();
  renderProducts();
});

elements.grid.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(Number(button.dataset.add));
});

elements.clear.addEventListener("click", () => {
  searchTerm = "";
  activeCategory = "all";
  sortMode = "featured";
  elements.search.value = "";
  elements.sort.value = sortMode;
  saveCurrentPreferences();
  updateActiveTab();
  renderProducts();
});

elements.retry.addEventListener("click", initialise);
elements.cartButton.addEventListener("click", () => {
  renderCart();
  elements.cartDialog.showModal();
});
elements.closeCart.addEventListener("click", () => elements.cartDialog.close());

elements.cartDialog.addEventListener("click", event => {
  if (event.target === elements.cartDialog) elements.cartDialog.close();
});

elements.cartItems.addEventListener("click", event => {
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    cart = cart.filter(item => item.id !== Number(removeButton.dataset.remove));
    saveCart(cart);
    updateCartCount();
    renderCart();
    return;
  }

  const quantityButton = event.target.closest("[data-change]");
  if (quantityButton) {
    changeQuantity(Number(quantityButton.dataset.id), Number(quantityButton.dataset.change));
  }
});

document.addEventListener("keydown", event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    elements.search.focus();
  }
});

updateCartCount();
initialise();