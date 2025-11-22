/* app.js */

document.addEventListener("DOMContentLoaded", () => {

  // Charts Data
  let visits = [120,150,180,140,210,230,200];
  let conv = [12,20,15,18,30,28,22];

  // Stats
  let usersTotal = 124;
  let sessionsTotal = 987;

  function updateStats(){
    document.getElementById("statUsers").textContent = usersTotal;
    document.getElementById("statSessions").textContent = sessionsTotal;
    const rate = Math.round((conv.reduce((a,b)=>a+b,0) / visits.reduce((a,b)=>a+b,1))*100);
    document.getElementById("statConversion").textContent = rate + "%";
  }
  updateStats();

  // Charts
  const ctx1 = document.getElementById("visitsChart").getContext("2d");
  const ctx2 = document.getElementById("conversionsChart").getContext("2d");

  const chartVisits = new Chart(ctx1, {
    type:"line",
    data:{
      labels:["6d","5d","4d","3d","2d","1d","Hoje"],
      datasets:[{
        data:visits,
        borderColor:"#00eaff",
        backgroundColor:"rgba(0,220,255,0.12)",
        fill:true,
        tension:0.35,
        pointRadius:3
      }]
    },
    options:{responsive:true,plugins:{legend:{display:false}}}
  });

  const chartConv = new Chart(ctx2, {
    type:"bar",
    data:{
      labels:["6d","5d","4d","3d","2d","1d","Hoje"],
      datasets:[{
        data:conv,
        backgroundColor:"#00d2ff",
        borderRadius:6
      }]
    },
    options:{responsive:true,plugins:{legend:{display:false}}}
  });

  // Lists
  function addItem(el,text){
    const li=document.createElement("li");
    li.textContent=text;
    el.prepend(li);
  }

  ["Item C","Item B","Item A"].forEach(x=>addItem(recentActions,x));
  ["Tarefa 2","Tarefa 1"].forEach(x=>addItem(todoList,x));
  ["Admin (Owner)"].forEach(x=>addItem(usersList,x));

  // Add Action
  document.getElementById("addActionBtn").onclick = () => {
    addItem(recentActions,"Ação "+new Date().toLocaleTimeString());
  };

  // Todo
  todoForm.onsubmit = e => {
    e.preventDefault();
    if(!todoInput.value.trim()) return;
    addItem(todoList,todoInput.value);
    todoInput.value="";
  };

  // Users
  userForm.onsubmit = e => {
    e.preventDefault();
    const n=userName.value.trim();
    const r=userRole.value.trim();
    if(!n) return;
    addItem(usersList, `${n}${r?' ('+r+')':''}`);
    usersTotal++;
    updateStats();
    userName.value="";
    userRole.value="";
  };

  // Export CSV
  document.getElementById("exportCsv").onclick = () => {
    const rows = [
      ["dia","visitas","conversoes"],
      ...visits.map((v,i)=>[i+1,v,conv[i]||0])
    ];
    const csv = rows.map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);

    const a=document.createElement("a");
    a.href=url;
    a.download="revitarium-data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto refresh
  let loop=null;
  document.getElementById("autoRefresh").onchange = function(){
    if(this.checked){
      loop=setInterval(()=>{
        visits.push(130+Math.random()*120|0); visits.shift();
        conv.push(10+Math.random()*20|0); conv.shift();
        sessionsTotal+=Math.random()*10|0;
        chartVisits.data.datasets[0].data=visits;
        chartConv.data.datasets[0].data=conv;
        chartVisits.update();
        chartConv.update();
        updateStats();
      },4000);
    } else {
      clearInterval(loop);
    }
  };

  // Logout
  document.getElementById("btn-logout").onclick = ()=>{
    window.location.href="index.html";
  };

});
