// dashboard.js — Versão avançada (localStorage + Chart.js + Export CSV)

// ---------- UTILIDADES ----------
const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));
const ls = { get: k => JSON.parse(localStorage.getItem(k) || 'null'), set: (k,v) => localStorage.setItem(k, JSON.stringify(v)) };

// Dados iniciais se não existir
if (!ls.get('rev_actions')) ls.set('rev_actions', [{id:Date.now(), text:'Sistema iniciado', date:new Date().toISOString()}]);
if (!ls.get('rev_tasks')) ls.set('rev_tasks', [{id:Date.now(), title:'Revisar pipeline', done:false}]);
if (!ls.get('rev_users')) ls.set('rev_users', [{id:Date.now(), name:'Administrador', role:'Admin'}]);

// ---------- ELEMENTOS ----------
const visitsCtx = qs('#visitsChart').getContext('2d');
const conversionsCtx = qs('#conversionsChart').getContext('2d');

const actionsList = qs('#actionsList');
const tasksList = qs('#tasksList');
const usersList = qs('#usersList');
const summaryList = qs('#summaryList');

const addActionBtn = qs('#addAction');
const addTaskBtn = qs('#addTask');
const newTaskInput = qs('#newTask');

const userForm = qs('#userForm');
const userNameInput = qs('#userName');
const userRoleInput = qs('#userRole');

const exportCsvBtn = qs('#exportCsv');
const autoRefreshCheckbox = qs('#autoRefresh');
const btnLogout = qs('#btnLogout');

// ---------- GRÁFICOS (Chart.js) ----------
const sampleVisits = () => {
  // gera valores aleatórios para os 7 dias
  const labels = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const data = labels.map(()=> Math.round(200 + Math.random()*300));
  return { labels, data };
};

const visitsData = sampleVisits();
const visitsChart = new Chart(visitsCtx, {
  type: 'line',
  data: {
    labels: visitsData.labels,
    datasets: [{
      label: 'Visitas',
      data: visitsData.data,
      fill: true,
      tension: 0.35,
      pointRadius: 2,
      backgroundColor: gradient(visitsCtx, '#07ffd8', '#004d7a'),
      borderColor: '#2be8cf',
      borderWidth: 2
    }]
  },
  options: chartOptions()
});

const conversionsChart = new Chart(conversionsCtx, {
  type: 'doughnut',
  data: {
    labels: ['Conversões','Não-conversões'],
    datasets: [{
      data: [Math.round(Math.random()*60)+20, Math.round(Math.random()*120)+40],
      backgroundColor: ['#00f2ff','#134d6a']
    }]
  },
  options: { responsive:true, plugins:{legend:{position:'bottom'}} }
});

// helper para gradiente
function gradient(ctx, c1, c2) {
  const g = ctx.createLinearGradient(0,0,0,200);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  return g;
}

function chartOptions() {
  return {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { display: true },
      y: { display: true, beginAtZero: false }
    }
  };
}

// ---------- RENDERIZAÇÕES ----------
function renderActions() {
  const actions = ls.get('rev_actions') || [];
  actionsList.innerHTML = '';
  actions.slice().reverse().forEach(a => {
    const li = document.createElement('li');
    li.innerHTML = `<div class="action-item"><div class="text">${escapeHtml(a.text)}</div><small class="meta">${new Date(a.date).toLocaleString()}</small></div>`;
    actionsList.appendChild(li);
  });
}

function renderTasks() {
  const tasks = ls.get('rev_tasks') || [];
  tasksList.innerHTML = '';
  tasks.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `
      <label class="task">
        <input type="checkbox" data-id="${t.id}" ${t.done ? 'checked' : ''} />
        <span class="task-title">${escapeHtml(t.title)}</span>
        <button class="btn-small btn-delete" data-id="${t.id}">✕</button>
      </label>
    `;
    tasksList.appendChild(li);
  });
}

function renderUsers() {
  const users = ls.get('rev_users') || [];
  usersList.innerHTML = '';
  users.forEach(u => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="user-row">
        <div><strong>${escapeHtml(u.name)}</strong><br/><small>${escapeHtml(u.role)}</small></div>
        <div class="user-actions">
          <button class="btn-small edit-user" data-id="${u.id}">Editar</button>
          <button class="btn-small delete-user" data-id="${u.id}">Apagar</button>
        </div>
      </div>
    `;
    usersList.appendChild(li);
  });
}

function renderSummary() {
  summaryList.innerHTML = '';
  const users = ls.get('rev_users') || [];
  const tasks = ls.get('rev_tasks') || [];
  const actions = ls.get('rev_actions') || [];
  const items = [
    `Usuários: ${users.length}`,
    `Tarefas pendentes: ${tasks.filter(t=>!t.done).length}`,
    `Ações totais: ${actions.length}`
  ];
  items.forEach(i => {
    const li = document.createElement('li');
    li.textContent = i;
    summaryList.appendChild(li);
  });
}

// ---------- EVENTOS / AÇÕES ----------
addActionBtn.addEventListener('click', () => {
  const text = prompt('Descreva a ação rápida:');
  if (!text) return;
  const actions = ls.get('rev_actions') || [];
  actions.push({ id:Date.now(), text, date:new Date().toISOString() });
  ls.set('rev_actions', actions);
  renderActions();
  renderSummary();
});

addTaskBtn.addEventListener('click', () => {
  const title = newTaskInput.value.trim();
  if (!title) return;
  const tasks = ls.get('rev_tasks') || [];
  tasks.push({ id:Date.now(), title, done:false });
  ls.set('rev_tasks', tasks);
  newTaskInput.value = '';
  renderTasks(); renderSummary();
});

// delegado para tarefas (checkbox e delete)
tasksList.addEventListener('click', (e) => {
  const id = e.target.dataset.id;
  if (!id) return;
  if (e.target.matches('.btn-delete')) {
    let tasks = ls.get('rev_tasks') || [];
    tasks = tasks.filter(t => String(t.id) !== String(id));
    ls.set('rev_tasks', tasks);
    renderTasks(); renderSummary();
  }
});

tasksList.addEventListener('change', (e) => {
  if (e.target.matches('input[type="checkbox"]')) {
    const id = e.target.dataset.id;
    const tasks = ls.get('rev_tasks') || [];
    const t = tasks.find(x => String(x.id) === String(id));
    if (t) { t.done = e.target.checked; ls.set('rev_tasks', tasks); renderSummary(); }
  }
});

// Usuários: adicionar / editar / apagar
userForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = userNameInput.value.trim();
  const role = userRoleInput.value.trim();
  if (!name || !role) return alert('Preencha nome e cargo.');
  const users = ls.get('rev_users') || [];
  users.push({ id:Date.now(), name, role });
  ls.set('rev_users', users);
  userNameInput.value = ''; userRoleInput.value = '';
  renderUsers(); renderSummary();
});

usersList.addEventListener('click', (e) => {
  const id = e.target.dataset.id;
  if (!id) return;
  const users = ls.get('rev_users') || [];
  if (e.target.matches('.delete-user')) {
    if (!confirm('Deseja apagar este usuário?')) return;
    const filtered = users.filter(u => String(u.id) !== String(id));
    ls.set('rev_users', filtered);
    renderUsers(); renderSummary();
  } else if (e.target.matches('.edit-user')) {
    const u = users.find(x => String(x.id) === String(id));
    if (!u) return;
    const newName = prompt('Nome:', u.name);
    const newRole = prompt('Cargo:', u.role);
    if (newName) u.name = newName;
    if (newRole) u.role = newRole;
    ls.set('rev_users', users);
    renderUsers(); renderSummary();
  }
});

// Export CSV (ações + tarefas + usuários)
exportCsvBtn.addEventListener('click', () => {
  const actions = ls.get('rev_actions') || [];
  const tasks = ls.get('rev_tasks') || [];
  const users = ls.get('rev_users') || [];
  const rows = [
    ['tipo','id','titulo','detalhe','extra']
  ];
  actions.forEach(a => rows.push(['action', a.id, a.text, a.date]));
  tasks.forEach(t => rows.push(['task', t.id, t.title, t.done ? 'done' : 'pending']));
  users.forEach(u => rows.push(['user', u.id, u.name, u.role]));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `revitarium-export-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
});

// Logout
btnLogout.addEventListener('click', () => {
  window.location.href = 'index.html';
});

// Auto-refresh charts
let autoRefInterval = null;
autoRefreshCheckbox.addEventListener('change', () => {
  if (autoRefreshCheckbox.checked) {
    autoRefInterval = setInterval(() => updateCharts(true), 60000);
  } else {
    clearInterval(autoRefInterval);
    autoRefInterval = null;
  }
});

// Update charts function (data refresh)
function updateCharts(randomize=false) {
  if (randomize) {
    const v = sampleVisits();
    visitsChart.data.labels = v.labels;
    visitsChart.data.datasets[0].data = v.data;
    const c = Math.round(Math.random()*100);
    conversionsChart.data.datasets[0].data = [c, 200-c];
  }
  visitsChart.update();
  conversionsChart.update();
}

// escape html
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]); }

// ---------- BOOTSTRAP ----------
function boot() {
  renderActions(); renderTasks(); renderUsers(); renderSummary();
  updateCharts(true);
}

document.addEventListener('DOMContentLoaded', boot);
