// storage.js — small helpers for saving client-side state.
const CART_KEY = "shoply-cart-v1";
const CATEGORY_KEY = "shoply-category-v1";
const SORT_KEY = "shoply-sort-v1";

function readJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.warn(`Could not read ${key} from localStorage:`, error);
    return fallback;
  }
}

export function loadCart() {
  return readJSON(CART_KEY, []);
}

export function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("Cart could not be saved:", error);
  }
}

export function loadPreferences() {
  return {
    category: readJSON(CATEGORY_KEY, "all"),
    sort: readJSON(SORT_KEY, "featured")
  };
}

export function savePreferences({ category, sort }) {
  try {
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(category));
    localStorage.setItem(SORT_KEY, JSON.stringify(sort));
  } catch (error) {
    console.warn("Preferences could not be saved:", error);
  }
}
