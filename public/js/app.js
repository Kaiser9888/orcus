// public/js/app.js
function escapeHtml(s){ return String(s||'').replace(/[&<>\"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]); }
