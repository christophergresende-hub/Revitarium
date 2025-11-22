/* login.js */
document.getElementById('loginForm').addEventListener('submit', function(e){
  e.preventDefault();
  const user = document.getElementById('user').value.trim();
  const pass = document.getElementById('pass').value.trim();
  if(!user || !pass){ alert('Preencha usuário e senha'); return; }
  // credenciais demo: admin / 123
  if(user === 'admin' && pass === '123'){
    localStorage.setItem('rev_user','ok');
    // pequena proteção: evita cache antigo
    window.location.href = 'dashboard.html';
  } else {
    alert('Usuário ou senha incorretos');
  }
});
