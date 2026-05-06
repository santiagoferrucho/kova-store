// Admin shared nav renderer
import { auth } from '/js/modules/api.js';
import { ThemeController } from '/js/modules/ui.js';

export function renderAdminNav(active) {
  const user = auth.getUser();
  if (!user || user.role !== 'admin') { location.href = '/login.html'; return false; }

  const slot = document.getElementById('admin-nav');
  if (!slot) return true;
  slot.innerHTML = `
    <nav class="admin-bar">
      <span class="admin-bar__brand">kova. admin</span>
      <a href="/admin/" class="${active==='dash'?'active':''}">Resumen</a>
      <a href="/admin/products.html" class="${active==='products'?'active':''}">Productos</a>
      <a href="/admin/categories.html" class="${active==='categories'?'active':''}">Categorías</a>
      <a href="/admin/orders.html" class="${active==='orders'?'active':''}">Pedidos</a>
      <div class="admin-bar__end">
        <span style="font-size:.78rem;color:rgba(255,255,255,.5)">${user.name}</span>
        <a href="/" style="font-size:.78rem">← Tienda</a>
        <button style="height:26px;padding:0 10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:4px;color:rgba(255,255,255,.7);font-size:.78rem;cursor:pointer"
          onclick="import('/js/modules/api.js').then(m=>{m.auth.clear();location.href='/'})">Salir</button>
        <button id="theme-btn" class="nav__theme" style="height:26px">☾</button>
      </div>
    </nav>`;

  const tc = new ThemeController();
  document.getElementById('theme-btn')?.addEventListener('click', () => tc.toggle());
  return true;
}
