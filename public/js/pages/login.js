import { api, auth } from '/js/modules/api.js';
import { cart } from '/js/modules/cart.js';
import { toast } from '/js/modules/ui.js';
import { t } from '/js/modules/i18n.js';

if (auth.getUser()) location.href = '/';

document.getElementById('auth-body').innerHTML = `
  <h2 style="margin-bottom:24px;font-size:1.3rem">${t('auth.login')}</h2>
  <div class="field">
    <label class="field__label">${t('auth.email')}</label>
    <input id="f-email" class="field__input" type="email" placeholder="admin@kova.co" autocomplete="username">
  </div>
  <div class="field">
    <label class="field__label">${t('auth.password')}</label>
    <input id="f-pwd" class="field__input" type="password" placeholder="••••••" autocomplete="current-password">
  </div>
  <div id="err-msg" class="alert alert--err" style="display:none"></div>
  <button class="btn btn--primary btn--full" id="submit-btn">${t('auth.login')}</button>
  <div style="text-align:center;margin-top:16px;font-size:.85rem;color:var(--muted)">
    <a href="/forgot.html" style="color:var(--muted)">${t('auth.forgot')}</a>
  </div>
  <div style="text-align:center;margin-top:10px;font-size:.85rem;color:var(--muted)">
    ¿No tienes cuenta? <a href="/register.html" style="color:var(--mid);font-weight:600">${t('nav.register')}</a>
  </div>
  <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--line);font-size:.75rem;color:var(--muted)">
    Demo: admin@kova.co / Admin2026! · maria@example.com / Cliente123
  </div>`;

async function submit() {
  const btn = document.getElementById('submit-btn');
  const err = document.getElementById('err-msg');
  btn.disabled = true; btn.textContent = '...'; err.style.display = 'none';
  try {
    const d = await api.login({
      email: document.getElementById('f-email').value,
      password: document.getElementById('f-pwd').value
    });
    auth.set(d.token, d.user);
    await cart.syncOnLogin();
    location.href = d.user.role === 'admin' ? '/admin/' : '/';
  } catch(e) {
    err.textContent = e.message; err.style.display = 'block';
    btn.disabled = false; btn.textContent = t('auth.login');
  }
}

document.getElementById('submit-btn').addEventListener('click', submit);
document.getElementById('f-pwd').addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
