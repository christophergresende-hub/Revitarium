document.addEventListener("DOMContentLoaded", () => {

  /* ----------------- ELEMENTOS ----------------- */
  const visitsCtx = document.getElementById("visitsChart").getContext("2d");
  const convCtx = document.getElementById("conversionsChart").getContext("2d");

  const recentActions = document.getElementById("recentActions");
  const todoForm = document.getElementById("todoForm");
  const todoInput = document.getElementById("todoInput");
  const todoList = document.getElementById("todoList");
  const userForm = document.getElementById("userForm");
  const usersList = document.getElementById("usersList");
  const exportBtn = document.getElementById("exportCsv");
  const addActionBtn = document.getElementById("addActionBtn");
  const autoRefresh = document.getElementById("autoRefresh");


  /* ----------------- MOCK DATA ----------------- */
  const visitsData = [120, 150, 180, 140, 210, 230, 200];
  const conversionsData = [12, 20, 15, 18, 30, 28, 22];


  /* ----------------- GRÁFICO VISITAS ----------------- */
  const visitsChart = new Chart(visitsCtx, {
    type: "line",
    data: {
      labels: ["6d","5d","4d","3d","2d","1d","Hoje"],
      datasets: [{
        label: "Visitas",
        data: visitsData,
        borderColor: "#00e0ff",
        backgroundColor: "rgba(0,224,255,0.14)",
        fill: true,
        tension: 0.35,
        pointRadius: 2
      }]
    },
    options: { responsive: true, plugins:{legend:{display:false}} }
  });


  /* ----------------- GRÁFICO CONVERSÕES ----------------- */
  const conversionsChart = new Chart(convCtx, {
    type: "bar",
    data: {
      labels: ["6d","5d","4d","3d","2d","1d","Hoje"],
      datasets: [{
        label: "Conversões",
        data: conversionsData,
        backgroundColor: "#00e0ff"
      }]
    },
    options: { responsive:true, plugins:{legend:{display:false}} }
  });


  /* ----------------- LISTAS DINÂMICAS ----------------- */
  const addListItem = (el, text) => {
    const li = document.createElement("li");
    li.textContent = text;
    el.prepend(li);
  };

  ["Item A","Item B","Item C"].forEach(t => addListItem(recentActions,t));
  ["Tarefa 1","Tarefa 2"].forEach(t => addListItem(todoList,t));
  ["Admin (Owner)"].forEach(u => addListItem(usersList,u));


  /* ----------------- AÇÕES ----------------- */
  addActionBtn.addEventListener("click", () => {
    addListItem(
      recentActions,
      `Ação registrada às ${new Date().toLocaleTimeString()}`
    );
  });


  /* ----------------- TODO ----------------- */
  todoForm.addEventListener("submit", e => {
    e.preventDefault();
    if(!todoInput.value.trim()) return;
    addListItem(todoList, todoInput.value.trim());
    todoInput.value = "";
  });


  /* ----------------- USUÁRIOS ----------------- */
  userForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("userName").value.trim();
    const role = document.getElementById("userRole").value.trim();
    if(!name) return;

    addListItem(usersList, `${name} ${role ? "(" + role + ")" : ""}`);

    document.getElementById("userName").value = "";
    document.getElementById("userRole").value = "";
  });


  /* ----------------- EXPORTAR CSV ----------------- */
  exportBtn.addEventListener("click", () => {
    const rows = [
      ["dia","visitas","conversoes"],
      ...visitsData.map((v,i)=>[i,v, conversionsData[i] || 0])
    ];

    const csv = rows.map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "revitarium.csv";
    a.click();

    URL.revokeObjectURL(url);
  });


  /* ----------------- AUTOREFRESH ----------------- */
  autoRefresh.addEventListener("change", function(){
    if(this.checked){
      refreshInterval = setInterval(()=>{
        visitsData.push(150 + Math.round(Math.random()*120));
        visitsData.shift();

        visitsChart.data.datasets[0].data = visitsData;
        visitsChart.update();
      }, 5000);
    } else {
      clearInterval(refreshInterval);
    }
  });


  /* ----------------- LOGOUT ----------------- */
  document.getElementById("btn-logout").addEventListener("click", () => {
    window.location.href = "index.html";
  });

});
