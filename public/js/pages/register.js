import { api, auth } from '/js/modules/api.js';
import { cart } from '/js/modules/cart.js';
import { t } from '/js/modules/i18n.js';

document.getElementById('auth-body').innerHTML = `
  <h2 style="margin-bottom:24px;font-size:1.3rem">${t('auth.register')}</h2>
  <div class="field">
    <label class="field__label">${t('auth.name')}</label>
    <input id="f-name" class="field__input" type="text" placeholder="María García" autocomplete="name">
  </div>
  <div class="field">
    <label class="field__label">${t('auth.email')}</label>
    <input id="f-email" class="field__input" type="email" placeholder="tu@email.com" autocomplete="username">
  </div>
  <div class="field">
    <label class="field__label">${t('auth.password')}</label>
    <input id="f-pwd" class="field__input" type="password" placeholder="Mínimo 6 caracteres" autocomplete="new-password">
  </div>
  <div id="err-msg" class="alert alert--err" style="display:none"></div>
  <button class="btn btn--primary btn--full" id="submit-btn">${t('auth.register')}</button>
  <div style="text-align:center;margin-top:16px;font-size:.85rem;color:var(--muted)">
    ¿Ya tienes cuenta? <a href="/login.html" style="color:var(--mid);font-weight:600">${t('nav.login')}</a>
  </div>`;

async function submit() {
  const btn = document.getElementById('submit-btn');
  const err = document.getElementById('err-msg');
  btn.disabled = true; btn.textContent = '...'; err.style.display = 'none';
  try {
    const d = await api.register({
      name: document.getElementById('f-name').value,
      email: document.getElementById('f-email').value,
      password: document.getElementById('f-pwd').value
    });
    auth.set(d.token, d.user);
    await cart.syncOnLogin();
    location.href = '/';
  } catch(e) {
    err.textContent = e.message; err.style.display = 'block';
    btn.disabled = false; btn.textContent = t('auth.register');
  }
}

document.getElementById('submit-btn').addEventListener('click', submit);
