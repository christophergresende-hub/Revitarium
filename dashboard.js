/* dashboard.js - frontend mock controller */
(function(){
  const visitsCtx = document.getElementById('visitsChart')?.getContext('2d');
  const convCtx = document.getElementById('conversionsChart')?.getContext('2d');
  const recentActions = document.getElementById('recentActions');
  const todoForm = document.getElementById('todoForm');
  const todoInput = document.getElementById('todoInput');
  const todoList = document.getElementById('todoList');
  const userBtnLogout = document.getElementById('btn-logout');
  const exportBtn = document.getElementById('exportCsv');
  const addActionBtn = document.getElementById('addActionBtn');

  let visitsData = [120,150,180,140,210,230,200];
  let convData = [12,20,15,18,30,28,22];
  let usersTotal = 124; let sessionsTotal = 987;

  function addItem(listEl, text){const li=document.createElement('li');li.textContent=text;listEl.prepend(li)}
  ['Item C','Item B','Item A'].forEach(t=>addItem(recentActions,t));['Tarefa 2','Tarefa 1'].forEach(t=>addItem(todoList,t));

  function createG(ctx, c1, c2){const g=ctx.createLinearGradient(0,0,0,ctx.canvas.height);g.addColorStop(0,c1);g.addColorStop(1,c2);return g}

  let visitsChart=null, convChart=null;
  function createCharts(){
    if(visitsCtx){ if(visitsChart) visitsChart.destroy(); visitsChart=new Chart(visitsCtx,{type:'line',data:{labels:['6d','5d','4d','3d','2d','1d','Hoje'],datasets:[{label:'Visitas',data:visitsData,fill:true,backgroundColor:createG(visitsCtx,'rgba(0,224,255,0.12)','rgba(0,163,255,0.03)'),borderColor:'#00e0ff',tension:0.36,pointRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}});
    }
    if(convCtx){ if(convChart) convChart.destroy(); convChart=new Chart(convCtx,{type:'bar',data:{labels:['6d','5d','4d','3d','2d','1d','Hoje'],datasets:[{label:'Conversões',data:convData,backgroundColor:'#00d2ff'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}});
    }
  }

  createCharts(); window.addEventListener('resize', ()=>{createCharts()});

  document.getElementById('todoForm')?.addEventListener('submit',function(e){e.preventDefault();const v=(todoInput.value||'').trim();if(!v) return;addItem(todoList,v);todoInput.value='';});
  document.getElementById('addActionBtn')?.addEventListener('click',()=>{addItem(recentActions,'Ação adicionada em '+new Date().toLocaleTimeString());});

  document.getElementById('btn-logout')?.addEventListener('click',()=>{localStorage.removeItem('rev_user');window.location.href='index.html';});

  document.getElementById('toggleTheme')?.addEventListener('click', function(){document.body.classList.toggle('light');this.textContent = document.body.classList.contains('light')? 'Dark' : 'Light';});

  document.getElementById('exportCsv')?.addEventListener('click', ()=>{
    const rows=[['dia','visitas','conversoes'],...visitsData.map((v,i)=>[i+1,v,convData[i]||0])];
    const csv = rows.map(r=>r.join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='revitarium.csv'; document.body.appendChild(a); a.click(); a.remove();
  });
})();
