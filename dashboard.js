// dashboard.js (frontend)
const API_BASE = window.__API_BASE__ || (location.origin);
const token = localStorage.getItem('rev_token') || '';

async function fetchDashboard(){
  try {
    const res = await fetch(`${API_BASE}/api/dashboard`, { headers: { Authorization: 'Bearer ' + token } });
    if(!res.ok) throw new Error('no api');
    const j = await res.json();
    return {ok:true, data:j};
  } catch(e){
    // fallback mock (compat)
    return { ok:false, data: {
      visits: [120,150,180,140,210,230,200],
      conversions: [12,20,15,18,30,28,22],
      usersTotal: 124,
      sessions: 987,
      conversionRate: 12
    }};
  }
}

(async function init(){
  const domVisits = document.getElementById('visitsChart')?.getContext('2d');
  const domConv = document.getElementById('conversionsChart')?.getContext('2d');
  const statUsers = document.getElementById('statUsers');
  const statSessions = document.getElementById('statSessions');
  const statConversion = document.getElementById('statConversion');
  const recentActions = document.getElementById('recentActions');
  const todoList = document.getElementById('todoList');

  const resp = await fetchDashboard();
  const data = resp.data;

  statUsers && (statUsers.textContent = data.usersTotal || '-');
  statSessions && (statSessions.textContent = data.sessions || '-');
  statConversion && (statConversion.textContent = (data.conversionRate || '-') + '%');

  // create charts similar to before
  function createGradient(ctx, a,b){
    const g = ctx.createLinearGradient(0,0,0,ctx.canvas.height);
    g.addColorStop(0,a); g.addColorStop(1,b);
    return g;
  }
  if(domVisits){
    new Chart(domVisits, {
      type:'line',
      data:{ labels:['6d','5d','4d','3d','2d','1d','Hoje'], datasets:[{ data: data.visits || [], fill:true, backgroundColor: createGradient(domVisits,'rgba(0,224,255,0.12)','rgba(0,163,255,0.03)'), borderColor:'#00e0ff', pointRadius:3, tension:0.36 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }
    });
  }
  if(domConv){
    new Chart(domConv, {
      type:'bar',
      data:{ labels:['6d','5d','4d','3d','2d','1d','Hoje'], datasets:[{ data: data.conversions || [], backgroundColor:'#00d2ff' }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }
    });
  }

  // actions & todos from API
  try {
    const aRes = await fetch(`${API_BASE}/api/actions`, { headers: { Authorization: 'Bearer ' + token }});
    if(aRes.ok){
      const aJson = await aRes.json();
      (aJson.actions||[]).forEach(act => {
        const li = document.createElement('li'); li.textContent = act.text; recentActions.appendChild(li);
      });
    }
    const tRes = await fetch(`${API_BASE}/api/todos`, { headers: { Authorization: 'Bearer ' + token }});
    if(tRes.ok){
      const tJson = await tRes.json();
      (tJson.todos||[]).forEach(t=> { const li=document.createElement('li'); li.textContent=t.text; todoList.appendChild(li); });
    }
  } catch(e){
    // ignore (already fallback earlier)
  }

})();
