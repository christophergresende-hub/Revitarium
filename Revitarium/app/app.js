/* app.js - controlador simples do dashboard (frontend only, mock data) */
document.addEventListener("DOMContentLoaded", function(){
  // Elements
  const visitsCtx = document.getElementById('visitsChart').getContext('2d');
  const convCtx = document.getElementById('conversionsChart') ?
                  document.getElementById('conversionsChart').getContext('2d') : null;
  const recentActions = document.getElementById('recentActions');
  const todoForm = document.getElementById('todoForm');
  const todoInput = document.getElementById('todoInput');
  const todoList = document.getElementById('todoList');
  const userForm = document.getElementById('userForm');
  const usersList = document.getElementById('usersList');
  const exportBtn = document.getElementById('exportCsv');
  const addActionBtn = document.getElementById('addActionBtn');
  const autoRefresh = document.getElementById('autoRefresh');

  // Mock data
  const visitsData = [120, 150, 180, 140, 210, 230, 200]; // 7 dias
  const conversionsData = [12, 20, 15, 18, 30, 28, 22];

  // Chart: Visits
  const visitsChart = new Chart(visitsCtx, {
    type: 'line',
    data: {
      labels: ['6d','5d','4d','3d','2d','1d','Hoje'],
      datasets: [{
        label: 'Visitas',
        data: visitsData,
        fill: true,
        backgroundColor: 'linear-gradient(90deg, rgba(0,224,255,0.16), rgba(0,163,255,0.08))',
        borderColor: '#00e0ff',
        tension: 0.35,
        pointRadius: 2
      }]
    },
    options: { responsive: true, plugins:{legend:{display:false}}}
  });

  // Chart: Conversions (if present)
  let conversionsChart = null;
  if(convCtx){
    conversionsChart = new Chart(convCtx,{
      type:'bar',
      data:{ labels:['6d','5d','4d','3d','2d','1d','Hoje'], datasets:[{label:'Conversões', data:conversionsData, backgroundColor:'#00d2ff'}]},
      options:{ responsive:true, plugins:{legend:{display:false}}}
    });
  }

  // Utilities to add list item
  function addListItem(el, text){
    const li = document.createElement('li');
    li.textContent = text;
    el.prepend(li);
  }

  // Populate initial
  ['Item A','Item B','Item C'].forEach(t => addListItem(recentActions,t));
  ['Tarefa 1','Tarefa 2'].forEach(t => addListItem(todoList,t));
  ['Admin, Owner'].forEach(u => addListItem(usersList,u));

  // Add action btn
  addActionBtn?.addEventListener('click', () => {
    const action = `Ação adicionada em ${new Date().toLocaleTimeString()}`;
    addListItem(recentActions, action);
  });

  // Todo add
  todoForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const val = todoInput.value.trim();
    if(!val) return;
    addListItem(todoList, val);
    todoInput.value = '';
  });

  // Users add
  userForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = document.getElementById('userName').value.trim();
    const role = document.getElementById('userRole').value.trim();
    if(!name) return;
    addListItem(usersList, `${name} ${role ? '('+role+')' : ''}`);
    document.getElementById('userName').value='';
    document.getElementById('userRole').value='';
  });

  // Export CSV (simple mock export)
  exportBtn?.addEventListener('click', ()=>{
    const rows = [
      ['dia','visitas','conversoes'],
      ...visitsData.map((v,i)=>[i, v, conversionsData[i] || 0])
    ];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'revitarium-visits.csv'; document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  });

  // Auto-refresh mock (re-renders data)
  let autoRefreshInterval = null;
  autoRefresh?.addEventListener('change', function(e){
    if(this.checked){
      autoRefreshInterval = setInterval(()=> {
        // simulate data change
        visitsData.push(Math.round(150 + Math.random()*100));
        visitsData.shift();
        visitsChart.data.datasets[0].data = visitsData;
        visitsChart.update();
      }, 5000);
    } else {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
  });

  // Logout button (simple redirect to index)
  document.getElementById('btn-logout')?.addEventListener('click', function(){
    window.location.href = 'index.html';
  });

  // Accessibility: keyboard shortcuts (optional)
  document.addEventListener('keydown', function(e){
    if(e.ctrlKey && e.key === 'e') {
      exportBtn?.click();
    }
  });
});
