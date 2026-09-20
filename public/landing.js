(async () => {
  const navRight = document.getElementById('navRight');
  const themeToggle = document.getElementById('themeToggle');

  let user = null;
  try {
    const r = await fetch('/api/auth/me');
    const j = await r.json();
    user = j.user;
  } catch {}

  navRight.querySelectorAll('.link').forEach(el => el.remove());

  if (user) {
    const hi = document.createElement('button');
    hi.className = 'link';
    hi.textContent = `Hi, ${user.name.split(' ')[0]}`;
    hi.onclick = () => location.href = 'chat.html';
    navRight.insertBefore(hi, themeToggle);

    const open = document.createElement('a');
    open.className = 'link primary';
    open.textContent = 'Open chat';
    open.href = 'chat.html';
    navRight.insertBefore(open, themeToggle);
  } else {
    const signIn = document.createElement('a');
    signIn.className = 'link';
    signIn.textContent = 'Sign in';
    signIn.href = 'auth.html';
    navRight.insertBefore(signIn, themeToggle);

    const signUp = document.createElement('a');
    signUp.className = 'link primary';
    signUp.textContent = 'Sign up';
    signUp.href = 'auth.html?mode=register';
    navRight.insertBefore(signUp, themeToggle);
  }
})();

const form      = document.getElementById('promptForm');
const input     = document.getElementById('promptInput');
const fileInput = document.getElementById('fileInput');
const attachBtn = document.getElementById('attachBtn');
const preview   = document.getElementById('attachPreview');
const thinkBtn  = document.getElementById('thinkBtn');
const searchBtn = document.getElementById('searchBtn');

let attachments = [];
let deepThink = false;
let search = false;

thinkBtn.onclick = () => { deepThink = !deepThink; thinkBtn.classList.toggle('active', deepThink); };
searchBtn.onclick = () => { search = !search; searchBtn.classList.toggle('active', search); };
attachBtn.onclick = () => fileInput.click();

fileInput.onchange = async () => {
  for (const file of fileInput.files) {
    if (file.size > 4 * 1024 * 1024) { alert(`${file.name} is too large (max 4 MB).`); continue; }
    const data = await readAsDataURL(file);
    attachments.push({ name: file.name, type: file.type, size: file.size, data });
  }
  fileInput.value = '';
  renderPreview();
};

function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function renderPreview() {
  preview.innerHTML = '';
  attachments.forEach((a, i) => {
    const chip = document.createElement('div');
    chip.className = 'attach-chip';
    chip.innerHTML = `
      ${a.type.startsWith('image/') ? `<img src="${a.data}" />` : `<span>📄</span>`}
      <span>${a.name}</span>
      <button type="button">✕</button>`;
    chip.querySelector('button').onclick = () => { attachments.splice(i, 1); renderPreview(); };
    preview.appendChild(chip);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q && !attachments.length) return;

  let signedIn = false;
  try {
    const r = await fetch('/api/auth/me');
    const j = await r.json();
    signedIn = !!j.user;
  } catch {}

  if (!signedIn) {
    if (attachments.length) sessionStorage.setItem('bluebex_attachments', JSON.stringify(attachments));
    else sessionStorage.removeItem('bluebex_attachments');
    sessionStorage.setItem('bluebex_flags', JSON.stringify({ deepThink, search }));
    if (q) sessionStorage.setItem('bluebex_pending_q', q);
    location.href = 'auth.html';
    return;
  }

  if (attachments.length) sessionStorage.setItem('bluebex_attachments', JSON.stringify(attachments));
  else sessionStorage.removeItem('bluebex_attachments');
  sessionStorage.setItem('bluebex_flags', JSON.stringify({ deepThink, search }));

  location.href = q ? `chat.html?q=${encodeURIComponent(q)}` : 'chat.html';
});