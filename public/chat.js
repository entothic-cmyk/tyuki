console.log('[Bluebex] chat.js loading...');

const $ = id => document.getElementById(id);

const els = {
  messagesWrap:  $('messages'),
  messagesEl:    $('messagesInner'),
  chatEmpty:     $('chatEmpty'),
  chatHeader:    $('chatHeader'),
  historyList:   $('historyList'),
  userAvatar:    $('userAvatar'),
  userName:      $('userName'),
  settingsBtn:   $('settingsBtn'),
  settingsModal: $('settingsModal'),
  modalEmail:    $('modalEmail'),
  themeToggle:   $('themeToggle'),
  fileInput:     $('fileInput'),
  sidebar:       $('sidebar'),
  collapseBtn:   $('collapseBtn'),
  sidebarSearch: $('sidebarSearchBtn'),
  greetingText:  $('greetingText'),
  emptyForm:     $('emptyForm'),
  emptyInput:    $('emptyInput'),
  emptyAttach:   $('emptyAttach'),
  emptyThink:    $('emptyThink'),
  emptySearch:   $('emptySearch'),
  preview:       $('attachPreview'),
  previewBottom: $('attachPreviewBottom'),
  chatForm:      $('chatForm'),
  chatInput:     $('chatInput'),
  attachBtn:     $('attachBtn'),
  bottomThink:   $('bottomThink'),
  bottomSearch:  $('bottomSearch'),
  sendBtn:       $('sendBtn'),
  chatInputWrap: $('chatInputWrap'),
  sendIcon:      $('sendIcon'),
  stopIcon:      $('stopIcon'),
  emptySendBtn:  $('emptySendBtn'),
  emptySendIcon: $('emptySendIcon'),
  emptyStopIcon: $('emptyStopIcon'),
  confirmModal:  $('confirmModal'),
  confirmTitle:  $('confirmTitle'),
  confirmMsg:    $('confirmMsg'),
  confirmOkBtn:  $('confirmOk'),
  confirmCancel: $('confirmCancel'),
  newChatBtn:    $('newChat'),
  closeSettings: $('closeSettings'),
  logoutBtn:     $('logoutBtn'),
  deleteAllBtn:  $('deleteAllBtn')
};

Object.keys(els).forEach(k => {
  if (!els[k]) console.warn('[Bluebex] missing element:', k);
});

function on(el, event, handler) { if (!el) return; el.addEventListener(event, handler); }
function setText(el, txt) { if (el) el.textContent = txt; }
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

if (els.themeToggle && typeof renderThemeToggle === 'function') {
  renderThemeToggle(els.themeToggle);
}

const SVG = {
  X:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  DOC:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  COPY:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  DOWN:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  BRAIN: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>',
  CHEV:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  BOLT:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  UP:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>',
  DOWN2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>',
  VOL:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
  SHR:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>',
  RETRY: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>'
};

const GREETINGS = [
  "Hi. What can I do for you?",
  "Hey! How's it going? What's on your mind today?",
  "Hello! How can I help you today?",
  "Hi there! What would you like to explore?",
  "Where would you like to begin?"
];

let ME = null;
let flags = { deepThink: false, search: false };
try { flags = { ...flags, ...(JSON.parse(sessionStorage.getItem('bluebex_flags') || '{}')) }; } catch {}
sessionStorage.removeItem('bluebex_flags');

let history = [];
let busy = false;
let pending = [];
let activeChatId = null;
let currentAbort = null;

setText(els.greetingText, GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

function confirmDialog(title, msg) {
  return new Promise(resolve => {
    if (!els.confirmModal) return resolve(window.confirm(msg));
    setText(els.confirmTitle, title);
    setText(els.confirmMsg, msg);
    els.confirmModal.hidden = false;
    els.confirmModal.classList.add('open');
    const cleanup = (v) => {
      els.confirmModal.hidden = true;
      els.confirmModal.classList.remove('open');
      if (els.confirmOkBtn) els.confirmOkBtn.onclick = null;
      if (els.confirmCancel) els.confirmCancel.onclick = null;
      resolve(v);
    };
    if (els.confirmOkBtn) els.confirmOkBtn.onclick = () => cleanup(true);
    if (els.confirmCancel) els.confirmCancel.onclick = () => cleanup(false);
  });
}

function openSettings() {
  if (!els.settingsModal) return;
  els.settingsModal.hidden = false;
  els.settingsModal.classList.add('open');
}
function closeSettings() {
  if (!els.settingsModal) return;
  els.settingsModal.hidden = true;
  els.settingsModal.classList.remove('open');
}

function setSending(sending) {
  if (els.sendIcon) els.sendIcon.style.display = sending ? 'none' : 'block';
  if (els.stopIcon) els.stopIcon.style.display = sending ? 'block' : 'none';
  if (els.sendBtn) els.sendBtn.classList.toggle('stop-mode', sending);

  if (els.emptySendIcon) els.emptySendIcon.style.display = sending ? 'none' : 'block';
  if (els.emptyStopIcon) els.emptyStopIcon.style.display = sending ? 'block' : 'none';
  if (els.emptySendBtn) els.emptySendBtn.classList.toggle('stop-mode', sending);
}

function stopGeneration() {
  if (currentAbort) { try { currentAbort.abort(); } catch {} currentAbort = null; }
}

(async () => {
  try {
    const r = await fetch('/api/auth/me');
    const { user } = await r.json();
    if (!user) return location.href = 'auth.html';
    ME = user;
    setText(els.userAvatar, (user.name || '?').trim()[0].toUpperCase());
    setText(els.userName, user.name);
    setText(els.modalEmail, user.email);
    history = [makeSystem()];
    await refreshChatList();
    bootHandoff();
    setSending(false);
    console.log('[Bluebex] booted as', user.email);
  } catch (e) { console.error('[Bluebex] boot failed', e); }
})();

function makeSystem() {
  return {
    role: 'system',
    content: 'You are Bluebex AI. Be concise, clear, and helpful. Plain text unless code is asked.' +
      (flags.deepThink ? ' Think step by step, then answer.' : '')
  };
}

on(els.collapseBtn, 'click', () => {
  if (els.sidebar) els.sidebar.classList.toggle('collapsed');
});
on(els.sidebarSearch, 'click', () => {
  const q = prompt('Search chats:');
  if (!q) return;
  els.historyList.querySelectorAll('li').forEach(li => {
    const s = li.querySelector('span').textContent.toLowerCase();
    li.style.display = s.includes(q.toLowerCase()) ? '' : 'none';
  });
});

function pickFile(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (!els.fileInput) return;
  els.fileInput.hidden = false;
  els.fileInput.style.position = 'absolute';
  els.fileInput.style.left = '-9999px';
  els.fileInput.click();
  setTimeout(() => {
    els.fileInput.hidden = true;
    els.fileInput.style.position = '';
    els.fileInput.style.left = '';
  }, 500);
}
on(els.emptyAttach, 'click', pickFile);
on(els.attachBtn, 'click', pickFile);

function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

on(els.fileInput, 'change', async () => {
  const files = Array.from(els.fileInput.files || []);
  for (const f of files) {
    if (f.size > 4 * 1024 * 1024) { alert(`${f.name} is over 4 MB`); continue; }
    try {
      const data = await fileToDataURL(f);
      pending.push({ name: f.name, type: f.type || 'application/octet-stream', size: f.size, data });
    } catch (err) { console.error(err); }
  }
  els.fileInput.value = '';
  renderPreview();
});

function renderPreview() {
  const containers = [els.preview, els.previewBottom].filter(Boolean);
  containers.forEach(container => {
    container.innerHTML = '';
    pending.forEach((a, i) => {
      const c = document.createElement('div');
      c.className = 'attach-chip';
      const isImage = a.type && a.type.startsWith('image/');
      const thumb = isImage
        ? `<img src="${a.data}" alt="" />`
        : `<span class="doc-icon">${SVG.DOC}</span>`;
      c.innerHTML = `${thumb}<span>${escapeHtml(a.name)}</span><button type="button">${SVG.X}</button>`;
      c.querySelector('button').onclick = () => { pending.splice(i, 1); renderPreview(); };
      container.appendChild(c);
    });
  });
}

function toggleThink() {
  flags.deepThink = !flags.deepThink;
  [els.emptyThink, els.bottomThink].forEach(b => { if (b) b.classList.toggle('active', flags.deepThink); });
}
function toggleSearch() {
  flags.search = !flags.search;
  [els.emptySearch, els.bottomSearch].forEach(b => { if (b) b.classList.toggle('active', flags.search); });
}
on(els.emptyThink, 'click', toggleThink);
on(els.bottomThink, 'click', toggleThink);
on(els.emptySearch, 'click', toggleSearch);
on(els.bottomSearch, 'click', toggleSearch);
if (els.emptyThink) els.emptyThink.classList.toggle('active', flags.deepThink);
if (els.bottomThink) els.bottomThink.classList.toggle('active', flags.deepThink);
if (els.emptySearch) els.emptySearch.classList.toggle('active', flags.search);
if (els.bottomSearch) els.bottomSearch.classList.toggle('active', flags.search);

async function refreshChatList() {
  if (!els.historyList) return;
  try {
    const r = await fetch('/api/chats');
    const { chats } = await r.json();
    els.historyList.innerHTML = '';
    chats.forEach(c => {
      const li = document.createElement('li');
      li.className = c.id === activeChatId ? 'active' : '';
      li.innerHTML = `<span>${escapeHtml(c.title)}</span><button class="del" type="button">${SVG.X}</button>`;
      li.querySelector('span').onclick = () => loadChat(c.id);
      li.querySelector('.del').onclick = async (e) => {
        e.stopPropagation();
        const ok = await confirmDialog('Delete chat', 'This conversation will be permanently removed.');
        if (!ok) return;
        await fetch(`/api/chats/${c.id}`, { method: 'DELETE' });
        if (activeChatId === c.id) startNewChat();
        refreshChatList();
      };
      els.historyList.appendChild(li);
    });
  } catch (e) { console.error(e); }
}

async function loadChat(id) {
  const r = await fetch(`/api/chats/${id}`);
  if (!r.ok) return;
  const { chat, messages } = await r.json();
  activeChatId = id;
  setText(els.chatHeader, chat.title);
  els.messagesEl.innerHTML = '';
  history = [makeSystem(), ...messages];
  messages.forEach(m => addMsg(m));
  showActiveChat();
  refreshChatList();
}

function startNewChat() {
  activeChatId = null;
  history = [makeSystem()];
  if (els.messagesEl) els.messagesEl.innerHTML = '';
  setText(els.chatHeader, 'New chat');
  if (els.emptyInput) els.emptyInput.value = '';
  if (els.chatInput) els.chatInput.value = '';
  pending = [];
  renderPreview();
  setText(els.greetingText, GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  showEmptyState();
  refreshChatList();
}

function showEmptyState() {
  if (els.chatEmpty) els.chatEmpty.hidden = false;
  if (els.messagesWrap) els.messagesWrap.hidden = true;
  if (els.chatInputWrap) els.chatInputWrap.hidden = true;
}
function showActiveChat() {
  if (els.chatEmpty) els.chatEmpty.hidden = true;
  if (els.messagesWrap) els.messagesWrap.hidden = false;
  if (els.chatInputWrap) els.chatInputWrap.hidden = false;
}

on(els.newChatBtn, 'click', startNewChat);

function renderAttachments(container, attachments) {
  if (!attachments || !attachments.length) return;
  const images = attachments.filter(a => a.type && a.type.startsWith('image/'));
  const files = attachments.filter(a => !a.type || !a.type.startsWith('image/'));

  if (images.length) {
    const wrap = document.createElement('div');
    wrap.className = 'msg-images';
    images.forEach(a => {
      const img = document.createElement('img');
      img.src = a.data;
      img.className = 'attachment';
      img.alt = a.name || 'image';
      wrap.appendChild(img);
    });
    container.appendChild(wrap);
  }
  if (files.length) {
    const wrap = document.createElement('div');
    wrap.className = 'msg-files';
    files.forEach(a => {
      const p = document.createElement('span');
      p.className = 'file-pill';
      p.innerHTML = `${SVG.DOC}<span>${escapeHtml(a.name || 'file')}</span>`;
      wrap.appendChild(p);
    });
    container.appendChild(wrap);
  }
}

function renderCodeBlock(language, code, fileName) {
  const wrap = document.createElement('div');
  wrap.className = 'code-block';
  wrap.innerHTML = `
    <div class="code-head">
      <span class="lang">${escapeHtml(language || 'code')}</span>
      <div class="actions">
        <button data-act="copy" type="button">${SVG.COPY}<span>Copy</span></button>
        <button data-act="download" type="button">${SVG.DOWN}<span>Download</span></button>
      </div>
    </div>
    <pre><code></code></pre>
  `;
  wrap.querySelector('code').textContent = code || '';
  wrap.querySelector('[data-act="copy"]').onclick = () => navigator.clipboard.writeText(code || '');
  wrap.querySelector('[data-act="download"]').onclick = () => {
    const blob = new Blob([code || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'code.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return wrap;
}

function renderReasoning(text) {
  const box = document.createElement('div');
  box.className = 'reasoning-box';
  box.innerHTML = `
    <button class="reasoning-head" type="button">
      ${SVG.BRAIN}
      <span>Thinking Process</span>
      <span class="chev">${SVG.CHEV}</span>
    </button>
    <div class="reasoning-body"></div>
  `;
  box.querySelector('.reasoning-body').textContent = text || '';
  box.querySelector('.reasoning-head').onclick = () => box.classList.toggle('open');
  return box;
}

function makeActions(m) {
  const actions = document.createElement('div');
  actions.className = 'msg-actions';
  actions.innerHTML = `
    <button data-act="copy" data-tip="Copy" type="button">${SVG.COPY}</button>
    <button data-act="retry" data-tip="Regenerate" type="button">${SVG.RETRY}</button>
    <button data-act="up" data-tip="Good" type="button">${SVG.UP}</button>
    <button data-act="down" data-tip="Bad" type="button">${SVG.DOWN2}</button>
    <button data-act="speak" data-tip="Read aloud" type="button">${SVG.VOL}</button>
    <button data-act="share" data-tip="Share" type="button">${SVG.SHR}</button>
  `;
  actions.querySelectorAll('button').forEach(b => {
    b.onclick = () => handleAction(b.dataset.act, m);
  });
  return actions;
}

function handleAction(act, m) {
  const text = m.blocks
    ? m.blocks.map(b => b.content || b.code || '').join('\n\n')
    : (m.content || '');
  if (act === 'copy') navigator.clipboard.writeText(text);
  else if (act === 'speak') speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  else if (act === 'share') {
    if (navigator.share) navigator.share({ text });
    else navigator.clipboard.writeText(text);
  }
  else if (act === 'retry') {
    const last = history.filter(x => x.role === 'user').pop();
    if (last) send(last.content);
  }
}

function renderAIMessage(m) {
  const wrapper = document.createElement('div');
  wrapper.className = 'msg ai';

  const inner = document.createElement('div');
  inner.className = 'ai-wrapper';

  const avatar = document.createElement('div');
  avatar.className = 'ai-avatar';
  avatar.innerHTML = SVG.BOLT;

  const body = document.createElement('div');
  body.className = 'ai-body';

  if (m.reasoning) body.appendChild(renderReasoning(m.reasoning));

  if (Array.isArray(m.blocks)) {
    m.blocks.forEach(b => {
      if (b.type === 'text') {
        const p = document.createElement('div');
        p.className = 'block-text';
        p.textContent = b.content || '';
        body.appendChild(p);
      } else if (b.type === 'section') {
        const s = document.createElement('div');
        s.className = 'block-section';
        s.innerHTML = `<span class="num">${escapeHtml(String(b.number || ''))}</span><span class="title"></span>`;
        s.querySelector('.title').textContent = b.title || '';
        body.appendChild(s);
      } else if (b.type === 'code') {
        body.appendChild(renderCodeBlock(b.language, b.code, b.fileName));
      }
    });
  } else if (m.content) {
    const p = document.createElement('div');
    p.className = 'block-text';
    p.textContent = m.content;
    body.appendChild(p);
  }

  inner.appendChild(avatar);
  inner.appendChild(body);
  wrapper.appendChild(inner);
  wrapper.appendChild(makeActions(m));
  return wrapper;
}

function addMsg(m) {
  if (!els.messagesEl) return;
  let d;

  if (m.role === 'user') {
    d = document.createElement('div');
    d.className = 'msg user';
    renderAttachments(d, m.attachments);
    if (m.content) {
      const t = document.createElement('div');
      t.className = 'msg-text';
      t.textContent = m.content;
      d.appendChild(t);
    }
  } else {
    d = renderAIMessage(m);
  }

  els.messagesEl.appendChild(d);
  scrollDown();
  return d;
}

function scrollDown() {
  if (els.messagesWrap) els.messagesWrap.scrollTop = els.messagesWrap.scrollHeight;
}

async function send(text) {
  if ((!text && !pending.length) || busy) return;

  busy = true;
  setSending(true);

  const attachments = pending.slice();
  pending = [];
  renderPreview();

  const userMsg = { role: 'user', content: text, attachments };
  history.push(userMsg);
  showActiveChat();
  addMsg(userMsg);

  const aiEl = document.createElement('div');
  aiEl.className = 'msg ai';

  const wrapper = document.createElement('div');
  wrapper.className = 'ai-wrapper';

  const avatar = document.createElement('div');
  avatar.className = 'ai-avatar';
  avatar.innerHTML = SVG.BOLT;

  const body = document.createElement('div');
  body.className = 'ai-body';

  const dotsEl = document.createElement('span');
  dotsEl.className = 'stream-dots';
  dotsEl.innerHTML = '<span></span><span></span><span></span>';

  const aiText = document.createElement('div');
  aiText.className = 'block-text';
  aiText.style.display = 'none';

  body.appendChild(dotsEl);
  body.appendChild(aiText);

  wrapper.appendChild(avatar);
  wrapper.appendChild(body);
  aiEl.appendChild(wrapper);
  els.messagesEl.appendChild(aiEl);
  scrollDown();

  let full = '';
  let dotsRemoved = false;

  const controller = new AbortController();
  currentAbort = controller;

  try {
    if (!activeChatId) {
      const r = await fetch('/api/chats', { method: 'POST' });
      const j = await r.json();
      activeChatId = j.id;
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: activeChatId, messages: history }),
      signal: controller.signal
    });

    if (!res.ok || !res.body) {
      dotsEl.remove();
      aiText.style.display = 'block';
      aiText.textContent = 'Error: request failed.';
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buf.indexOf('\n\n')) !== -1) {
        const chunk = buf.slice(0, idx);
        buf = buf.slice(idx + 2);

        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const json = JSON.parse(payload);
            if (json.delta) {
              if (!dotsRemoved) { dotsEl.remove(); dotsRemoved = true; aiText.style.display = 'block'; }
              full += json.delta;
              aiText.textContent = full;
              scrollDown();
            }
            if (json.error) {
              if (!dotsRemoved) { dotsEl.remove(); dotsRemoved = true; aiText.style.display = 'block'; }
              aiText.textContent = `Error: ${json.error}`;
            }
          } catch {}
        }
      }
    }

    if (!dotsRemoved) dotsEl.remove();
    aiEl.remove();

    history.push({ role: 'assistant', content: full });
    addMsg({
      role: 'assistant',
      reasoning: flags.deepThink
        ? 'Thinking Process:\n1. Parsed the user request\n2. Retrieved relevant context\n3. Composed a structured reply'
        : null,
      blocks: [{ type: 'text', content: full }]
    });

    const list = await fetch('/api/chats').then(r => r.json());
    const me = list.chats.find(c => c.id === activeChatId);
    if (me) setText(els.chatHeader, me.title);
    refreshChatList();
  } catch (e) {
    if (e.name === 'AbortError') {
      if (!dotsRemoved) dotsEl.remove();
      if (full) {
        aiEl.remove();
        history.push({ role: 'assistant', content: full + '\n\n[stopped]' });
        addMsg({ role: 'assistant', content: full + '\n\n[stopped]' });
      } else {
        aiEl.remove();
      }
    } else {
      console.error(e);
      if (!dotsRemoved) dotsEl.remove();
      if (!full) {
        aiText.style.display = 'block';
        aiText.textContent = 'Error: connection failed.';
      }
    }
  } finally {
    currentAbort = null;
    busy = false;
    setSending(false);
  }
}

on(els.emptyForm, 'submit', (e) => {
  e.preventDefault();
  const t = els.emptyInput.value.trim();
  if (!t && !pending.length) return;
  els.emptyInput.value = '';
  send(t);
});

on(els.chatForm, 'submit', (e) => {
  e.preventDefault();
  const t = els.chatInput.value.trim();
  if (!t && !pending.length) return;
  els.chatInput.value = '';
  els.chatInput.style.height = 'auto';
  send(t);
});

on(els.sendBtn, 'click', (e) => {
  e.preventDefault();
  if (busy) { stopGeneration(); return; }
  const t = els.chatInput.value.trim();
  if (!t && !pending.length) return;
  els.chatInput.value = '';
  els.chatInput.style.height = 'auto';
  send(t);
});

on(els.emptySendBtn, 'click', (e) => {
  e.preventDefault();
  if (busy) { stopGeneration(); return; }
  const t = els.emptyInput.value.trim();
  if (!t && !pending.length) return;
  els.emptyInput.value = '';
  send(t);
});

[els.emptyInput, els.chatInput].forEach(el => {
  on(el, 'keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (busy) return;
      const form = el === els.emptyInput ? els.emptyForm : els.chatForm;
      if (form) form.requestSubmit();
    }
  });
  on(el, 'input', () => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  });
});

on(document, 'keydown', (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'j') {
    e.preventDefault();
    startNewChat();
  }
  if (e.key === 'Escape') {
    closeSettings();
    if (els.confirmModal && !els.confirmModal.hidden) {
      els.confirmModal.hidden = true;
      els.confirmModal.classList.remove('open');
    }
  }
});

on(els.settingsBtn, 'click', (e) => { e.preventDefault(); openSettings(); });
on(els.closeSettings, 'click', (e) => { e.preventDefault(); closeSettings(); });
on(els.settingsModal, 'click', (e) => {
  if (e.target === els.settingsModal) closeSettings();
});

document.querySelectorAll('.theme-choice').forEach(b => {
  b.onclick = async () => {
    try {
      await window.setTheme(b.dataset.theme);
      updateThemeChoices();
    } catch (err) { console.error(err); }
  };
});

function updateThemeChoices() {
  const cur = typeof window.getTheme === 'function' ? window.getTheme() : 'dark';
  document.querySelectorAll('.theme-choice').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === cur);
  });
}
updateThemeChoices();

on(els.logoutBtn, 'click', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (err) { console.error(err); }
  window.location.href = 'index.html';
});

on(els.deleteAllBtn, 'click', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  const ok = await confirmDialog(
    'Delete all chats',
    'Every conversation will be permanently removed. This cannot be undone.'
  );
  if (!ok) return;
  try {
    const r = await fetch('/api/chats');
    const { chats } = await r.json();
    for (const c of chats) await fetch(`/api/chats/${c.id}`, { method: 'DELETE' });
    startNewChat();
  } catch (err) { console.error(err); }
});

function bootHandoff() {
  const params = new URLSearchParams(location.search);
  const q = params.get('q') || '';
  const stored = sessionStorage.getItem('bluebex_attachments');
  if (stored) {
    try {
      pending = JSON.parse(stored);
      sessionStorage.removeItem('bluebex_attachments');
      renderPreview();
    } catch {}
  }
  if (q || pending.length) {
    history.replaceState({}, '', 'chat.html');
    send(q);
  } else {
    showEmptyState();
  }
}

console.log('[Bluebex] chat.js ready');