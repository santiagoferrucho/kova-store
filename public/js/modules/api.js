// js/modules/api.js — Módulo HTTP centralizado
'use strict';

const BASE = '/api';

export const auth = {
  getToken: () => localStorage.getItem('kova_token'),
  getUser:  () => { try { return JSON.parse(localStorage.getItem('kova_user')); } catch { return null; } },
  set:  (token, user) => { localStorage.setItem('kova_token', token); localStorage.setItem('kova_user', JSON.stringify(user)); },
  clear: () => { localStorage.removeItem('kova_token'); localStorage.removeItem('kova_user'); },
  isAdmin: () => auth.getUser()?.role === 'admin',
};

async function http(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  register:  (b) => http('POST', '/auth/register', b),
  login:     (b) => http('POST', '/auth/login', b),
  me:        ()  => http('GET',  '/auth/me'),
  updateMe:  (b) => http('PUT',  '/auth/me', b),
  forgot:    (b) => http('POST', '/auth/forgot-password', b),

  // Products
  products:      (p) => http('GET', '/products?' + new URLSearchParams(p)),
  product:       (id) => http('GET', `/products/${id}`),
  createProduct: (b)  => http('POST', '/products', b),
  updateProduct: (id, b) => http('PUT', `/products/${id}`, b),
  deleteProduct: (id) => http('DELETE', `/products/${id}`),

  // Categories
  categories:     ()     => http('GET', '/categories'),
  createCategory: (b)    => http('POST', '/categories', b),
  updateCategory: (id,b) => http('PUT', `/categories/${id}`, b),
  deleteCategory: (id)   => http('DELETE', `/categories/${id}`),

  // Cart
  cart:           ()     => http('GET', '/cart'),
  syncCart:       (items) => http('POST', '/cart/sync', { items }),
  addToCart:      (product_id, quantity) => http('POST', '/cart/items', { product_id, quantity }),
  updateCartItem: (id, quantity) => http('PUT', `/cart/items/${id}`, { quantity }),
  removeCartItem: (id) => http('DELETE', `/cart/items/${id}`),
  clearCart:      ()   => http('DELETE', '/cart'),

  // Orders
  checkout:         (b)  => http('POST', '/orders/checkout', b),
  myOrders:         ()   => http('GET', '/orders/my'),
  adminOrders:      (p)  => http('GET', '/orders?' + new URLSearchParams(p || {})),
  adminOrder:       (id) => http('GET', `/orders/${id}`),
  updateOrderStatus:(id, status) => http('PUT', `/orders/${id}/status`, { status }),

  // Reviews
  reviews:      (pid) => http('GET', `/products/${pid}/reviews`),
  createReview: (pid, b) => http('POST', `/products/${pid}/reviews`, b),
};
