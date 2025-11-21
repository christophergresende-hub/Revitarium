/* app.js - controlador do dashboard (frontend only, mock data + sidebar) */
document.addEventListener("DOMContentLoaded", function(){
  // Sidebar controls
  const sidebar = document.getElementById('sidebar');
  const btnOpen = document.getElementById('btn-open');
  const btnCollapse = document.getElementById('btn-collapse');

  function setSidebar(open){
    if(open){
      sidebar.classList.remove('closed'); sidebar.classList.add('open');
      sidebar.setAttribute('aria-hidden','false');
    } else {
      sidebar.classList.remove('open'); sidebar.classList.add('closed');
      sidebar.setAttribute('aria-hidden','true');
    }
    // save preference
    try{ localStorage.setItem('rv_sidebar_open', open ? '1' : '0'); }catch(e){}
  }

  // initial state
  const persisted = localStorage.getItem('rv_sidebar_open');
  const startOpen = persisted === '1' || window.innerWidth >= 1100;
  setSidebar(startOpen);

  btnOpen?.addEventListener('click', ()=> setSidebar(true));
  btnCollapse?.addEventListener('click', ()=> setSidebar(sidebar.classList.contains('closed')));

  // Chart + dashboard logic (mock)
  const visitsCtx = document.getElementById('visitsChart')?.getContext('2d');
  const convCtx = document.getElementById('conversionsChart')?.getContext('2d');

  // Mock data
  let visitsData = [120,150,180,140,210,230,200];
  let conversionsData = [12,20,15,18,30,28,22];

  // create gradient function
  function gradientFor(ctx, colorA, colorB){
    const g = ctx.createLinearGradient(0,0,0,200);
    g.addColorStop(0, colorA);
    g.addColorStop(1, colorB);
    return g;
  }

  let visitsChart = null;
  if(visitsCtx){
    visitsChart = new Chart(visitsCtx, {
      type: 'line',
      data: {
        labels: ['6d','5d','4d','3d','2d','1d','Hoje'],
        datasets: [{
          label:'Visitas',
          data: visitsData,
          fill: true,
          backgroundColor: function(ctx){
            return gradientFor(ctx.chart.ctx, 'rgba(0,224,255,0.12)','rgba(0,163,255,0.02)');
          },
          borderColor: '#00e0ff',
          tension: .35,
          pointRadius:3,
        }]
      },
      options:{
        responsive:true,
        plugins:{legend:{display:false}},
        scales:{
          x:{grid:{display:false},ticks:{color:'rgba(255,255,255,0.6)'}},
          y:{grid:{color:'rgba(255,255,255,0.03)'},ticks:{color:'rgba(255,255,255,0.6)'}}
        }
      }
    });
  }

  if(convCtx){
    new Chart(convCtx,{
      type:'bar',
      data:{
        labels:['6d','5d','4d','3d','2d','1d','Hoje'],
        datasets:[{
          label:'Conversões',
          data:conversionsData,
          backgroundColor:'#00d2ff'
        }]
      },
      options:{ responsive:true, plugins:{legend:{display:false}}, scales:{x:{ticks:{color:'rgba(255,255,255,0.6)'}}, y:{ticks:{color:'rgba(255,255,255,0.6)}}}}
    });
  }

  // UI lists and forms
  const recentActions = document.getElementById('recentActions');
  const todoForm = document.getElementById('todoForm');
  const todoInput = document.getElementById('todoInput');
  const todoList = document.getElementById('todoList');
  const userForm = document.getElementById('userForm');
  const usersList = document.getElementById('usersList');
  const exportBtn = document.getElementById('exportCsv');
  const addActionBtn = document.getElementById('addActionBtn');
  const autoRefresh = document.getElementById('autoRefresh');
  const logoutBtn = document.getElementById('btn-logout');

  function addListItem(el, text){
    const li = document.createElement('li');
    li.textContent = text;
    el.prepend(li);
  }

  // populate initial mock
  ['Item A','Item B','Item C'].forEach(t => addListItem(recentActions,t));
  ['Tarefa 1','Tarefa 2'].forEach(t => addListItem(todoList,t));
  ['Admin (Owner)'].forEach(u => addListItem(usersList,u));

  addActionBtn?.addEventListener('click', ()=>{
    addListItem(recentActions, `Ação - ${new Date().toLocaleString()}`);
  });

  todoForm?.addEventListener('submit', e=>{
    e.preventDefault();
    const v = todoInput.value.trim(); if(!v) return;
    addListItem(todoList, v);
    todoInput.value = '';
  });

  userForm?.addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('userName').value.trim();
    const role = document.getElementById('userRole').value.trim();
    if(!name) return;
    addListItem(usersList, `${name} ${role ? '('+role+')' : ''}`);
    document.getElementById('userName').value=''; document.getElementById('userRole').value='';
  });

  // export CSV
  exportBtn?.addEventListener('click', ()=>{
    const rows = [['dia','visitas','conversoes'], ...visitsData.map((v,i)=>[i, v, conversionsData[i]||0])];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download='revitarium-visits.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // auto-refresh (simulate)
  let autoInterval=null;
  autoRefresh?.addEventListener('change', function(){
    if(this.checked){
      autoInterval = setInterval(()=>{
        visitsData.push(Math.round(150 + Math.random()*100));
        visitsData.shift();
        if(visitsChart){ visitsChart.data.datasets[0].data = visitsData; visitsChart.update(); }
      },5000);
    } else {
      clearInterval(autoInterval); autoInterval=null;
    }
  });

  // logout
  logoutBtn?.addEventListener('click', ()=> window.location.href='index.html');

  // keyboard shortcuts (optional)
  document.addEventListener('keydown', (e)=>{
    if(e.ctrlKey && e.key === 'b') { setSidebar(!sidebar.classList.contains('open')); }
  });

  // small resize handler to adapt sidebar
  window.addEventListener('resize', ()=> {
    if(window.innerWidth < 900){ setSidebar(false); }
    else { const retained = localStorage.getItem('rv_sidebar_open'); if(retained==='1') setSidebar(true); }
  });
});
