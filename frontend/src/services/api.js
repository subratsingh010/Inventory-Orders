const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

async function request(path, options = {}) {
  const hasBody = options.body !== undefined && options.body !== null;

  const headers = {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Something went wrong");
  }

  return data;
}

export const api = {
  auth: {
    login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
    register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  },
  dashboard: () => request("/dashboard"),
  products: {
    list: () => request("/products"),
    create: (payload) => request("/products", { method: "POST", body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (id) => request(`/products/${id}`, { method: "DELETE" }),
  },
  customers: {
    list: () => request("/customers"),
    create: (payload) => request("/customers", { method: "POST", body: JSON.stringify(payload) }),
    remove: (id) => request(`/customers/${id}`, { method: "DELETE" }),
  },
  orders: {
    list: () => request("/orders"),
    get: (id) => request(`/orders/${id}`),
    create: (payload) => request("/orders", { method: "POST", body: JSON.stringify(payload) }),
    remove: (id) => request(`/orders/${id}`, { method: "DELETE" }),
  },
};
