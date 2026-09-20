(async function initTheme() {
  let theme = 'dark';
  try {
    const cached = localStorage.getItem('bluebex_theme');
    if (cached) theme = cached;
  } catch {}

  try {
    const r = await fetch('/api/settings');
    if (r.ok) {
      const j = await r.json();
      if (j.theme) theme = j.theme;
    }
  } catch {}

  applyTheme(theme);

  window.setTheme = async function (t) {
    applyTheme(t);
    try { localStorage.setItem('bluebex_theme', t); } catch {}
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: t })
      });
    } catch {}
    updateAllToggles();
  };

  window.getTheme = () => theme;

  function applyTheme(t) {
    theme = t;
    const eff = t === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    document.documentElement.setAttribute('data-theme', eff);
  }

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme === 'system') applyTheme('system');
  });
})();

function updateAllToggles() {
  const eff = document.documentElement.getAttribute('data-theme');
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = eff === 'dark' ? '☀︎' : '☾';
  });
}

window.renderThemeToggle = function (btn) {
  btn.onclick = async () => {
    const eff = document.documentElement.getAttribute('data-theme');
    await window.setTheme(eff === 'dark' ? 'light' : 'dark');
  };
  updateAllToggles();
};

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    const eff = document.documentElement.getAttribute('data-theme');
    window.setTheme(eff === 'dark' ? 'light' : 'dark');
  }
});

document.addEventListener('DOMContentLoaded', updateAllToggles);