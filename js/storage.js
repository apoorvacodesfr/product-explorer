// storage.js — safe localStorage helpers for cart and preferences.
const CART_KEY = "shoply-cart-v1";
const CATEGORY_KEY = "shoply-category-v1";
const SORT_KEY = "shoply-sort-v1";
const VALID_SORTS = ["featured", "price-low", "price-high", "rating", "name"];

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
  const saved = readJSON(CART_KEY, []);
  if (!Array.isArray(saved)) return [];

  return saved
    .filter(item => item && Number.isInteger(Number(item.id)) && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0)
    .map(item => ({ id: Number(item.id), quantity: Math.min(Number(item.quantity), 99) }));
}

export function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("Cart could not be saved:", error);
  }
}

export function loadPreferences() {
  const category = readJSON(CATEGORY_KEY, "all");
  const sort = readJSON(SORT_KEY, "featured");

  return {
    category: typeof category === "string" ? category : "all",
    sort: VALID_SORTS.includes(sort) ? sort : "featured"
  };
}

export function savePreferences({ category, sort }) {
  try {
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(category));
    localStorage.setItem(SORT_KEY, JSON.stringify(VALID_SORTS.includes(sort) ? sort : "featured"));
  } catch (error) {
    console.warn("Preferences could not be saved:", error);
  }
}