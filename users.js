// users.js
const API_BASE = window.__API_BASE__ || location.origin;
const token = localStorage.getItem('rev_token') || '';

async function loadUsers(){
  const listEl = document.getElementById('usersList');
  try{
    const res = await fetch(`${API_BASE}/api/users`, { headers: { Authorization: 'Bearer ' + token }});
    if(!res.ok) throw new Error('no users api');
    const j = await res.json();
    (j.users || []).forEach(u=>{
      const li = document.createElement('li'); li.textContent = `${u.name} (${u.role})`; listEl.appendChild(li);
    });
  }catch(e){
    // fallback: show message
    const li = document.createElement('li'); li.textContent = 'Não foi possível carregar usuários (API).'; listEl.appendChild(li);
  }
}

document.getElementById('userForm')?.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const name = document.getElementById('userName').value;
  const role = document.getElementById('userRole').value;
  const email = document.getElementById('userEmail')?.value || `${Math.random().toString(36).substr(2,6)}@local`;
  const password = 'changeme'; // force change
  try{
    const r = await fetch(`${API_BASE}/api/users`, { method:'POST', headers:{'content-type':'application/json', Authorization: 'Bearer ' + token}, body: JSON.stringify({name,email,role,password}) });
    if(!r.ok) throw new Error('create fail');
    const j = await r.json();
    alert('Usuário criado: ' + j.id);
    location.reload();
  }catch(e){
    alert('Erro criar usuário: ' + e.message);
  }
});

loadUsers();
