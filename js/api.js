// api.js — fetches and validates data from the Fake Store API.
const API_BASE_URL = "https://fakestoreapi.com";
const REQUEST_TIMEOUT = 12000;

async function request(endpoint) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`The product service returned an error (${response.status}).`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The request took too long. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchProducts() {
  const data = await request("/products");
  if (!Array.isArray(data)) {
    throw new Error("The product service returned an unexpected response.");
  }

  return data.filter(product =>
    product &&
    Number.isFinite(Number(product.id)) &&
    typeof product.title === "string" &&
    Number.isFinite(Number(product.price))
  ).map(product => ({
    ...product,
    id: Number(product.id),
    price: Number(product.price),
    image: typeof product.image === "string" ? product.image : "",
    category: typeof product.category === "string" ? product.category : "Other",
    description: typeof product.description === "string" ? product.description : "",
    rating: {
      rate: Number(product.rating?.rate) || 0,
      count: Number(product.rating?.count) || 0
    }
  }));
}

export async function fetchCategories() {
  const data = await request("/products/categories");
  if (!Array.isArray(data)) {
    throw new Error("The category service returned an unexpected response.");
  }
  return data.filter(category => typeof category === "string");
}