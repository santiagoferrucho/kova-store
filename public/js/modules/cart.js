// js/modules/cart.js — Patrón Observer (RF Arquitectura 6.13.5)
// CartStore = Sujeto · observadores = badge + vista del carrito
'use strict';
import { api, auth } from './api.js';
import { toast } from './ui.js';
import { t } from './i18n.js';

class CartStore {
  #observers = [];
  #items     = [];
  #total     = 0;

  subscribe(fn)   { this.#observers.push(fn); }
  unsubscribe(fn) { this.#observers = this.#observers.filter(o => o !== fn); }

  #emit() {
    const state = {
      items: this.#items,
      total: this.#total,
      count: this.#items.reduce((s, i) => s + i.quantity, 0),
    };
    this.#observers.forEach(fn => fn(state));
  }

  get items() { return this.#items; }
  get total() { return this.#total; }
  get count() { return this.#items.reduce((s, i) => s + i.quantity, 0); }

  // ── Persistencia local (invitados) ────────────────────────────────
  #saveLocal() {
    localStorage.setItem('kova_cart', JSON.stringify(this.#items));
  }
  #loadLocal() {
    try { this.#items = JSON.parse(localStorage.getItem('kova_cart') || '[]'); }
    catch { this.#items = []; }
    this.#total = this.#items.reduce((s, i) => s + i.price * i.quantity, 0);
  }

  // ── Init ──────────────────────────────────────────────────────────
  async init() {
    if (auth.getToken()) {
      await this.#loadServer();
    } else {
      this.#loadLocal();
      this.#emit(); // FIX: notificar observadores ya suscritos
    }
  }

  async #loadServer() {
    try {
      const d = await api.cart();
      this.#fromSummary(d);
    } catch {
      this.#loadLocal();
    }
    this.#emit();
  }

  // ── Sincronizar carrito de invitado al iniciar sesión ─────────────
  async syncOnLogin() {
    const local = JSON.parse(localStorage.getItem('kova_cart') || '[]');
    if (local.length) {
      await api.syncCart(
        local.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
      ).catch(() => {});
      localStorage.removeItem('kova_cart');
    }
    await this.#loadServer();
  }

  // ── Agregar ───────────────────────────────────────────────────────
  async add(product, quantity = 1) {
    if (auth.getToken()) {
      try {
        const d = await api.addToCart(product.id, quantity);
        this.#fromSummary(d);
      } catch (e) {
        toast(e.message, 'err');
        return;
      }
    } else {
      const ex = this.#items.find(i => i.product_id === product.id);
      if (ex) {
        ex.quantity = Math.min(ex.quantity + quantity, product.stock);
      } else {
        this.#items.push({
          product_id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          quantity,
          stock: product.stock,
        });
      }
      this.#total = this.#items.reduce((s, i) => s + i.price * i.quantity, 0);
      this.#saveLocal();
    }
    this.#emit();
    toast(t('toast.added', product.name), 'ok');
  }

  // ── Actualizar cantidad ───────────────────────────────────────────
  async update(itemId, quantity) {
    if (auth.getToken()) {
      try {
        const d = await api.updateCartItem(itemId, quantity);
        this.#fromSummary(d);
      } catch (e) {
        toast(e.message, 'err');
        return;
      }
    } else {
      // FIX: comparar como número (dataset.id siempre es string)
      const id = Number(itemId);
      if (quantity <= 0) {
        this.#items = this.#items.filter(i => i.product_id !== id);
      } else {
        const item = this.#items.find(i => i.product_id === id);
        if (item) item.quantity = quantity;
      }
      this.#total = this.#items.reduce((s, i) => s + i.price * i.quantity, 0);
      this.#saveLocal();
    }
    this.#emit();
  }

  // ── Eliminar ──────────────────────────────────────────────────────
  async remove(itemId) {
    if (auth.getToken()) {
      try {
        const d = await api.removeCartItem(itemId);
        this.#fromSummary(d);
      } catch (e) {
        toast(e.message, 'err');
        return;
      }
    } else {
      // FIX: comparar como número
      const id = Number(itemId);
      this.#items = this.#items.filter(i => i.product_id !== id);
      this.#total = this.#items.reduce((s, i) => s + i.price * i.quantity, 0);
      this.#saveLocal();
    }
    this.#emit();
  }

  // ── Vaciar ────────────────────────────────────────────────────────
  async clear() {
    if (auth.getToken()) {
      try { await api.clearCart(); } catch {}
    }
    this.#items = [];
    this.#total = 0;
    this.#saveLocal();
    this.#emit();
  }

  // ── Mapear respuesta del servidor ─────────────────────────────────
  #fromSummary(d) {
    this.#items = d.items.map(i => ({
      item_id:   i.id,
      product_id: i.product_id,
      name:      i.name,
      price:     i.price,
      image_url: i.image_url,
      quantity:  i.quantity,
      stock:     i.stock,
    }));
    this.#total = d.total;
  }
}

export const cart = new CartStore();
