/* app.js - controlador do dashboard (frontend only, mock data) */

document.addEventListener("DOMContentLoaded", function(){
  // Auth guard: redirect to index.html if no logged user
  const logged = localStorage.getItem('rev_user');
  if(!logged){
    // small delay to show if user opened direct file, then redirect
    setTimeout(()=> {
      window.location.href = 'index.html';
    }, 150);
    return;
  }

  // Elements
  const visitsCtxEl = document.getElementById('visitsChart');
  const convCtxEl = document.getElementById('conversionsChart');
  const recentActions = document.getElementById('recentActions');
  const todoForm = document.getElementById('todoForm');
  const todoInput = document.getElementById('todoInput');
  const todoList = document.getElementById('todoList');
  const userForm = document.getElementById('userForm');
  const usersList = document.getElementById('usersList');
  const exportBtn = document.getElementById('exportCsv');
  const addActionBtn = document.getElementById('addActionBtn');
  const autoRefresh = document.getElementById('autoRefresh');
  const statUsers = document.getElementById('statUsers');
  const statSessions = document.getElementById('statSessions');
  const statConversion = document.getElementById('statConversion');
  const btnLogout = document.getElementById('btn-logout');

  // Mock data
  let visitsData = [120,150,180,140,210,230,200];
  let conversionsData = [12,20,15,18,30,28,22];
  let usersTotal = 124;
  let sessionsTotal = 987;

  // Update stats
  function updateStats(){
    statUsers && (statUsers.textContent = usersTotal);
    statSessions && (statSessions.textContent = sessionsTotal);
    if(statConversion){
      const conv = conversionsData.reduce((a,b)=>a+b,0);
      const vis = visitsData.reduce((a,b)=>a+b,1);
      const rate = Math.round((conv/vis)*100);
      statConversion.textContent = rate + '%';
    }
  }
  updateStats();

  // Utility gradient
  function createGradient(ctx, topColor, bottomColor){
    const h = ctx.canvas.height;
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, topColor);
    g.addColorStop(1, bottomColor);
    return g;
  }

  // Create charts
  let visitsChart = null, convChart = null;
  function createCharts(){
    if(visitsCtxEl){
      const ctx = visitsCtxEl.getContext('2d');
      if(visitsChart) visitsChart.destroy();
      const fill = createGradient(ctx, 'rgba(0,224,255,0.12)', 'rgba(0,163,255,0.04)');
      visitsChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['6d','5d','4d','3d','2d','1d','Hoje'],
          datasets: [{
            label:'Visitas',
            data: visitsData,
            fill: true,
            backgroundColor: fill,
            borderColor: '#00e0ff',
            pointBackgroundColor:'#00e0ff',
            tension: 0.36,
            pointRadius: 3,
            borderWidth: 2
          }]
        },
        options: {
          responsive:true,
          maintainAspectRatio:false,
          plugins:{legend:{display:false}},
          scales:{ x:{ ticks:{ color:'rgba(255,255,255,0.6)'} }, y:{ ticks:{ color:'rgba(255,255,255,0.5)'} } }
        }
      });
    }

    if(convCtxEl){
      const ctx2 = convCtxEl.getContext('2d');
      if(convChart) convChart.destroy();
      convChart = new Chart(ctx2, {
        type:'bar',
        data:{
          labels: ['6d','5d','4d','3d','2d','1d','Hoje'],
          datasets:[{ label:'Conversões', data: conversionsData, backgroundColor:'#00d2ff', borderRadius:6, barThickness:20 }]
        },
        options:{
          responsive:true,
          maintainAspectRatio:false,
          plugins:{legend:{display:false}},
          scales:{ x:{ ticks:{ color:'rgba(255,255,255,0.6)'} }, y:{ ticks:{ color:'rgba(255,255,255,0.5)'} } }
        }
      });
    }
  }

  // Init UI lists
  function addListItem(el, text){
    const li = document.createElement('li');
    li.textContent = text;
    el && el.prepend(li);
  }

  ['Item C','Item B','Item A'].forEach(t => addListItem(recentActions,t));
  ['Tarefa 2','Tarefa 1'].forEach(t => addListItem(todoList,t));
  ['Admin (Owner)'].forEach(t=> addListItem(usersList,t));

  // Handlers
  addActionBtn && addActionBtn.addEventListener('click', ()=>{
    const action = `Ação adicionada em ${new Date().toLocaleTimeString()}`;
    addListItem(recentActions, action);
  });

  todoForm && todoForm.addEventListener('submit', (e)=> {
    e.preventDefault();
    const v = (todoInput.value||'').trim();
    if(!v) return;
    addListItem(todoList, v);
    todoInput.value = '';
  });

  userForm && userForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = (document.getElementById('userName').value||'').trim();
    const role = (document.getElementById('userRole').value||'').trim();
    if(!name) return;
    addListItem(usersList, `${name}${role ? ' ('+role+')' : ''}`);
    usersTotal++;
    updateStats();
    document.getElementById('userName').value='';
    document.getElementById('userRole').value='';
  });

  // Export CSV
  exportBtn && exportBtn.addEventListener('click', ()=>{
    const rows = [
      ['dia','visitas','conversoes'],
      ...visitsData.map((v,i)=>[i+1, v, conversionsData[i]||0])
    ];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'revitarium-data.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });

  // Auto refresh simulation
  let autoInterval = null;
  autoRefresh && autoRefresh.addEventListener('change', function(){
    if(this.checked){
      autoInterval = setInterval(()=> {
        visitsData.push(Math.round(130 + Math.random()*120)); visitsData.shift();
        conversionsData.push(Math.round(8 + Math.random()*25)); conversionsData.shift();
        if(visitsChart){ visitsChart.data.datasets[0].data = visitsData; visitsChart.update(); }
        if(convChart){ convChart.data.datasets[0].data = conversionsData; convChart.update(); }
        sessionsTotal += Math.round(Math.random()*5);
        updateStats();
      }, 4200);
    } else {
      clearInterval(autoInterval); autoInterval = null;
    }
  });

  // Logout
  btnLogout && btnLogout.addEventListener('click', ()=>{
    localStorage.removeItem('rev_user');
    window.location.href = 'index.html';
  });

  // Nav buttons feedback
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', ()=> {
      document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e){
    if((e.ctrlKey || e.metaKey) && e.key === 'e') exportBtn && exportBtn.click();
  });

  // Create charts on load
  function init(){
    createCharts();
    window.addEventListener('resize', ()=> createCharts());
  }

  if(typeof Chart !== 'undefined') init();
  else setTimeout(init, 300);
});
