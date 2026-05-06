import { api } from '/js/modules/api.js';
import { t } from '/js/modules/i18n.js';

document.getElementById('auth-body').innerHTML = `
  <h2 style="margin-bottom:8px;font-size:1.3rem">${t('auth.forgot')}</h2>
  <p style="font-size:.875rem;color:var(--muted);margin-bottom:20px">Recibirás instrucciones en tu correo (simulado → logs/email.log)</p>
  <div class="field">
    <label class="field__label">${t('auth.email')}</label>
    <input id="f-email" class="field__input" type="email" placeholder="tu@email.com">
  </div>
  <div id="msg" class="alert" style="display:none"></div>
  <button class="btn btn--primary btn--full" id="submit-btn">${t('auth.send')}</button>
  <div style="text-align:center;margin-top:16px">
    <a href="/login.html" style="font-size:.85rem;color:var(--muted)">${t('auth.back')}</a>
  </div>`;

document.getElementById('submit-btn').addEventListener('click', async () => {
  const btn = document.getElementById('submit-btn');
  const msg = document.getElementById('msg');
  btn.disabled = true;
  try {
    const d = await api.forgot({ email: document.getElementById('f-email').value });
    msg.className = 'alert alert--ok'; msg.textContent = d.message; msg.style.display = 'block';
  } catch(e) {
    msg.className = 'alert alert--err'; msg.textContent = e.message; msg.style.display = 'block';
    btn.disabled = false;
  }
});
