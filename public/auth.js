const form        = document.getElementById('authForm');
const nameField   = document.getElementById('nameField');
const nameInput   = document.getElementById('name');
const emailInput  = document.getElementById('email');
const passInput   = document.getElementById('password');
const confirmField= document.getElementById('confirmField');
const confirmInput= document.getElementById('confirm');
const submitBtn   = document.getElementById('submitBtn');
const errorEl     = document.getElementById('authError');
const titleEl     = document.getElementById('authTitle');
const loginLinks  = document.getElementById('loginLinks');
const toRegister  = document.getElementById('toRegister');
const forgotLink  = document.getElementById('forgotLink');
const eye1        = document.getElementById('eyeBtn');
const eye2        = document.getElementById('eyeBtn2');

let mode = 'login';

const params = new URLSearchParams(location.search);
if (params.get('mode') === 'register') setMode('register');

toRegister.onclick = (e) => { e.preventDefault(); setMode('register'); };
forgotLink.onclick = (e) => { e.preventDefault(); alert('Password reset coming soon'); };
eye1.onclick = () => toggleEye(passInput, eye1);
eye2.onclick = () => toggleEye(confirmInput, eye2);

function toggleEye(input, btn) {
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.textContent = showing ? '👁' : '🙈';
}

function setMode(m) {
  mode = m;
  const isRegister = m === 'register';
  nameField.hidden    = !isRegister;
  confirmField.hidden = !isRegister;
  submitBtn.textContent = isRegister ? 'Sign up' : 'Log in';
  titleEl.textContent   = isRegister ? 'Sign up' : 'Log in';
  loginLinks.style.display = isRegister ? 'none' : 'flex';
  passInput.setAttribute('autocomplete', isRegister ? 'new-password' : 'current-password');
  errorEl.textContent = '';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';
  submitBtn.disabled = true;

  const email = emailInput.value.trim();
  const password = passInput.value;

  if (mode === 'register' && password !== confirmInput.value) {
    errorEl.textContent = 'Passwords do not match';
    submitBtn.disabled = false;
    return;
  }

  const body = { email, password };
  if (mode === 'register') body.name = nameInput.value.trim() || email.split('@')[0];

  try {
    const res = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || 'Something went wrong';
      submitBtn.disabled = false;
      return;
    }

    const pendingQ = sessionStorage.getItem('bluebex_pending_q');
    sessionStorage.removeItem('bluebex_pending_q');
    location.href = pendingQ ? `chat.html?q=${encodeURIComponent(pendingQ)}` : 'chat.html';
  } catch {
    errorEl.textContent = 'Network error';
    submitBtn.disabled = false;
  }
});

(async () => {
  try {
    const r = await fetch('/api/auth/me');
    const { user } = await r.json();
    if (user) location.href = 'chat.html';
  } catch {}
})();