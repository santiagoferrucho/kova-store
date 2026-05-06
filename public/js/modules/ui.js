// js/modules/ui.js — utilidades de interfaz
'use strict';
import { auth } from './api.js';
import { t, getLang, setLang } from './i18n.js';

// ── Formato ──────────────────────────────────────────────────────────
export function fmtPrice(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

export function fmtDate(s) {
  return new Date(s).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function stars(avg, count) {
  if (!avg) return '';
  const filled = Math.round(avg);
  return `<span class="stars">${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}<span>(${count})</span></span>`;
}

export function statusBadge(status) {
  return `<span class="badge badge--${status}">${t('status.' + status)}</span>`;
}

// ── Toast ────────────────────────────────────────────────────────────
let toastWrap;
export function toast(msg, type = 'info', ms = 3200) {
  if (!toastWrap) {
    toastWrap = document.createElement('div');
    toastWrap.id = 'toasts';
    document.body.appendChild(toastWrap);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${type === 'ok' ? 'ok' : type === 'err' ? 'err' : 'info'}`;
  const icons = { ok: '✓', err: '✕', info: 'i' };
  el.innerHTML = `<span>${icons[type] || 'i'}</span> ${msg}`;
  toastWrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 300);
  }, ms);
}

// ── Theme ────────────────────────────────────────────────────────────
export class ThemeController {
  constructor() {
    this.current = localStorage.getItem('kova_theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.apply();
  }
  apply() {
    document.documentElement.setAttribute('data-theme', this.current);
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = this.current === 'dark' ? '☀' : '☾';
  }
  toggle() {
    this.current = this.current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('kova_theme', this.current);
    this.apply();
  }
}

// ── Navbar ───────────────────────────────────────────────────────────
export function renderNav(cartStore) {
  const slot = document.getElementById('nav-slot');
  if (!slot) return;
  const user = auth.getUser();
  const lang = getLang();

  slot.innerHTML = `
    <nav class="nav">
      <div class="nav__inner">
        <a href="/" class="nav__logo" style="text-decoration:none">kova<em style="color:var(--soft);font-style:normal">.</em><span>cosecha buena</span></a>
        <form class="nav__search" id="search-form">
          <input id="search-input" type="text" placeholder="${t('search.ph')}" autocomplete="off">
          <button type="submit" aria-label="Buscar">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.44 1.406a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
            </svg>
          </button>
        </form>
        <div class="nav__actions">
          <div class="nav__controls">
            <select class="nav__lang" id="lang-sel">
              <option value="es" ${lang==='es'?'selected':''}>ES</option>
              <option value="en" ${lang==='en'?'selected':''}>EN</option>
            </select>
            <button class="nav__theme" id="theme-btn" aria-label="Modo oscuro">☾</button>
          </div>
          <a href="/cart.html" class="nav__cart" aria-label="Carrito">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5 13a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
            <span class="cart-count" id="cart-badge">0</span>
          </a>
          ${user ? _userMenu(user) : _guestMenu()}
        </div>
      </div>
    </nav>`;

  // Wire up controls
  document.getElementById('search-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('search-input')?.value?.trim();
    if (q) location.href = `/?q=${encodeURIComponent(q)}`;
  });

  document.getElementById('lang-sel')?.addEventListener('change', e => {
    setLang(e.target.value);
    location.reload();
  });

  const themeCtrl = new ThemeController();
  document.getElementById('theme-btn')?.addEventListener('click', () => themeCtrl.toggle());

  // User dropdown
  document.getElementById('user-btn')?.addEventListener('click', () => {
    document.getElementById('user-dd')?.classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav__user')) {
      document.getElementById('user-dd')?.classList.remove('open');
    }
  });

  // Cart observer — badge update sin recargar página
  if (cartStore) {
    const badge = document.getElementById('cart-badge');
    cartStore.subscribe(({ count }) => {
      if (!badge) return;
      badge.textContent = count;
      badge.classList.toggle('cart-count--visible', count > 0);
      badge.classList.remove('cart-count--bump');
      void badge.offsetWidth; // reflow
      if (count > 0) badge.classList.add('cart-count--bump');
    });
  }
}

function _userMenu(user) {
  return `
    <div class="nav__user">
      <button class="nav__user-btn" id="user-btn">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.029 10 8 10c-2.029 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
        </svg>
        ${user.name.split(' ')[0]}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>
      </button>
      <div class="nav__dropdown" id="user-dd">
        ${user.role === 'admin' ? `<a href="/admin/">${t('nav.admin')}</a><hr>` : ''}
        <a href="/profile.html">${t('nav.orders')}</a>
        <hr>
        <button onclick="import('/js/modules/api.js').then(m=>{m.auth.clear();location.href='/';})">
          ${t('nav.logout')}
        </button>
      </div>
    </div>`;
}

function _guestMenu() {
  return `
    <a href="/login.html" class="nav__btn nav__btn--ghost">${t('nav.login')}</a>
    <a href="/register.html" class="nav__btn nav__btn--solid">${t('nav.register')}</a>`;
}

// ── Modal helpers ────────────────────────────────────────────────────
export function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}
export function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}
