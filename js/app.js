// app.js — UI rendering, filtering, sorting and cart state.
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

const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 1900);
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
  try {
    // Fetch products and categories asynchronously from the public API.
    const [productData, categoryData] = await Promise.all([fetchProducts(), fetchCategories()]);
    products = productData;
    renderCategories(categoryData);
    elements.sort.value = sortMode;
    elements.tabs.querySelectorAll(".category-tab").forEach(button => {
      button.classList.toggle("active", button.dataset.category === activeCategory);
    });
    renderProducts();
  } catch (error) {
    console.error("Initial data load failed:", error);
    showError("Please check your internet connection. The product service may also be temporarily unavailable.");
    elements.count.textContent = "Collection unavailable";
  } finally {
    setLoading(false);
  }
}

function renderCategories(categories) {
  const allButton = '<button class="category-tab" data-category="all" type="button">All items</button>';
  elements.tabs.innerHTML = allButton + categories.map(category =>
    `<button class="category-tab" data-category="${escapeHTML(category)}" type="button">${escapeHTML(category)}</button>`
  ).join("");
  elements.tabs.querySelectorAll(".category-tab").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      saveCurrentPreferences();
      updateActiveTab();
      renderProducts();
    });
  });
}

function updateActiveTab() {
  elements.tabs.querySelectorAll(".category-tab").forEach(button => {
    button.classList.toggle("active", button.dataset.category === activeCategory);
  });
}

function getVisibleProducts() {
  let result = [...products];
  if (activeCategory !== "all") result = result.filter(product => product.category === activeCategory);
  if (searchTerm) {
    result = result.filter(product =>
      `${product.title} ${product.description} ${product.category}`.toLowerCase().includes(searchTerm)
    );
  }
  switch (sortMode) {
    case "price-low": result.sort((a, b) => a.price - b.price); break;
    case "price-high": result.sort((a, b) => b.price - a.price); break;
    case "rating": result.sort((a, b) => b.rating.rate - a.rating.rate); break;
    case "name": result.sort((a, b) => a.title.localeCompare(b.title)); break;
    default: result.sort((a, b) => a.id - b.id);
  }
  return result;
}

function renderProducts() {
  const visible = getVisibleProducts();
  elements.count.textContent = `${visible.length} ${visible.length === 1 ? "item" : "items"} found`;
  elements.grid.innerHTML = visible.map(product => `
    <article class="product-card">
      <div class="product-image-wrap">
        <span class="product-category">${escapeHTML(product.category)}</span>
        <img class="product-image" src="${escapeHTML(product.image)}" alt="${escapeHTML(product.title)}" loading="lazy">
      </div>
      <div class="product-info">
        <h3 class="product-title" title="${escapeHTML(product.title)}">${escapeHTML(product.title)}</h3>
        <div class="product-rating" aria-label="${product.rating.rate} out of 5 stars">★ ${product.rating.rate} <span>(${product.rating.count} reviews)</span></div>
        <div class="product-bottom">
          <strong class="product-price">${money(product.price)}</strong>
          <button class="add-button" data-add="${product.id}" type="button">+ Add</button>
        </div>
      </div>
    </article>`).join("");
  elements.empty.hidden = visible.length !== 0;
  elements.grid.hidden = visible.length === 0;
}

function saveCurrentPreferences() {
  savePreferences({ category: activeCategory, sort: sortMode });
}

function addToCart(productId) {
  const existing = cart.find(item => item.id === productId);
  if (existing) existing.quantity += 1;
  else cart.push({ id: productId, quantity: 1 });
  saveCart(cart);
  updateCartCount();
  const product = products.find(item => item.id === productId);
  showToast(`${product.title} added to your bag`);
}

function updateCartCount() {
  elements.cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
}

function renderCart() {
  if (cart.length === 0) {
    elements.cartItems.innerHTML = '<p class="cart-empty">Your bag is looking a little empty.</p>';
    elements.subtotal.textContent = money(0);
    return;
  }
  const cartProducts = cart.map(item => {
    const product = products.find(entry => entry.id === item.id);
    return product ? { ...product, quantity: item.quantity } : null;
  }).filter(Boolean);
  elements.cartItems.innerHTML = cartProducts.map(item => `
    <div class="cart-item">
      <img src="${escapeHTML(item.image)}" alt="">
      <div class="cart-item-info"><strong>${escapeHTML(item.title)}</strong><span>${item.quantity} × ${money(item.price)}</span></div>
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
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  cart = cart.filter(item => item.id !== Number(button.dataset.remove));
  saveCart(cart);
  updateCartCount();
  renderCart();
});

document.addEventListener("keydown", event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    elements.search.focus();
  }
});

updateCartCount();
initialise();
