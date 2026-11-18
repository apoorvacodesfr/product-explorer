// api.js — all communication with the external REST API lives here.
const API_BASE_URL = "https://fakestoreapi.com";

export async function fetchProducts() {
  const response = await fetch(`${API_BASE_URL}/products`);
  if (!response.ok) {
    throw new Error(`The server responded with status ${response.status}.`);
  }
  return response.json();
}

export async function fetchCategories() {
  const response = await fetch(`${API_BASE_URL}/products/categories`);
  if (!response.ok) {
    throw new Error(`Could not load categories (${response.status}).`);
  }
  return response.json();
}
