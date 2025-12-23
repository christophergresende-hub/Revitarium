// login.js (frontend)
const API_BASE = window.__API_BASE__ || (location.origin); // ajuste se backend tiver URL diferente

document.getElementById('loginForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('user')?.value || '';
  const pass = document.getElementById('pass')?.value || '';
  try {
    const r = await fetch(`${API_BASE}/api/login`, {
      method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({email, password: pass})
    });
    const j = await r.json();
    if(r.ok && j.token){
      localStorage.setItem('rev_token', j.token);
      localStorage.setItem('rev_user','ok');
      window.location.href = 'dashboard.html';
    } else {
      alert('Falha login: ' + (j.error || JSON.stringify(j)));
    }
  } catch(err){
    alert('Erro de rede: ' + err.message);
  }
});
