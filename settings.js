// settings.js
const API_BASE = window.__API_BASE__ || location.origin;
const token = localStorage.getItem('rev_token') || '';

async function loadSettings(){
  const r = await fetch(`${API_BASE}/api/settings`, { headers: { Authorization: 'Bearer ' + token }});
  if(r.ok){ const j = await r.json(); console.log('settings', j); }
}

async function saveSettings(payload){
  await fetch(`${API_BASE}/api/settings`, { method:'POST', headers:{'content-type':'application/json', Authorization: 'Bearer ' + token}, body: JSON.stringify(payload) });
}

loadSettings();
