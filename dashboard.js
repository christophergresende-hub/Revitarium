/* dashboard.js - advanced dashboard controller (root) */

document.addEventListener("DOMContentLoaded", () => {
  // Auth guard
  if (!localStorage.getItem("rev_user")) {
    window.location.href = "index.html";
    return;
  }

  // Elements
  const visitsCtx = document.getElementById("visitsChart");
  const convCtx = document.getElementById("conversionsChart");
  const recentActions = document.getElementById("recentActions");
  const addActionBtn = document.getElementById("addActionBtn");
  const clearActionsBtn = document.getElementById("clearActions");
  const todoForm = document.getElementById("todoForm");
  const todoInput = document.getElementById("todoInput");
  const todoList = document.getElementById("todoList");
  const userForm = document.getElementById("userForm");
  const usersList = document.getElementById("usersList");
  const exportBtn = document.getElementById("exportCsv");
  const autoRefresh = document.getElementById("autoRefresh");
  const btnLogout = document.getElementById("btn-logout");
  const toggleTheme = document.getElementById("toggleTheme");

  // Mock initial data (7 days)
  let visitsData = [120,150,180,140,210,230,200];
  let convData = [12,20,15,18,30,28,22];
  let usersTotal = 124;
  let sessionsTotal = 987;

  // Local persistence keys
  const KEY_ACTIONS = "rev_actions_v1";
  const KEY_TODOS = "rev_todos_v1";
  const KEY_USERS = "rev_users_v1";
  const KEY_THEME = "rev_theme_v1";

  // Utilities
  const el = id => document.getElementById(id);
  function save(key, data){ localStorage.setItem(key, JSON.stringify(data)); }
  function load(key, fallback){ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }

  // Populate UI lists
  function addListItem(container, text){ const li=document.createElement("li"); li.textContent=text; container.prepend(li); }
  function rebuildList(container, arr){ container.innerHTML = ""; arr.slice().reverse().forEach(i=> addListItem(container, i)); }

  // Load persisted
  let actions = load(KEY_ACTIONS, ["Iniciado sistema"]);
  let todos = load(KEY_TODOS, ["Verificar backup"]);
  let users = load(KEY_USERS, ["Admin (Owner)"]);

  rebuildList(recentActions, actions);
  rebuildList(todoList, todos);
  rebuildList(usersList, users);

  // Charts creation
  function createGradient(ctx, c1, c2){
    const g = ctx.createLinearGradient(0,0,0,ctx.canvas.height||220);
    g.addColorStop(0, c1); g.addColorStop(1,c2); return g;
  }

  let visitsChart, convChart;
  function createCharts(){
    if(visitsChart) visitsChart.destroy();
    if(convChart) convChart.destroy();

    const vCtx = visitsCtx.getContext("2d");
    const fill = createGradient(vCtx, 'rgba(0,224,255,0.12)', 'rgba(0,163,255,0.03)');
    visitsChart = new Chart(vCtx, {
      type: "line",
      data: {
        labels: ['6d','5d','4d','3d','2d','1d','Hoje'],
        datasets: [{ label:'Visitas', data: visitsData, fill:true, backgroundColor: fill, borderColor:'#00e0ff', tension:0.36, pointRadius:3 }]
      },
      options: { responsive:true, plugins:{ legend:{display:false} }, maintainAspectRatio:false }
    });

    const cCtx = convCtx.getContext("2d");
    convChart = new Chart(cCtx, {
      type: "bar",
      data: { labels: ['6d','5d','4d','3d','2d','1d','Hoje'], datasets:[{ label:'Conversões', data: convData, backgroundColor:'#00d2ff', borderRadius:6 }] },
      options: { responsive:true, plugins:{ legend:{display:false} }, maintainAspectRatio:false }
    });
  }

  createCharts();

  // Stats
  function updateStats(){
    el("statUsers").textContent = usersTotal;
    el("statSessions").textContent = sessionsTotal;
    const convSum = convData.reduce((a,b)=>a+b,0);
    const visSum = visitsData.reduce((a,b)=>a+b,0) || 1;
    el("statConversion").textContent = Math.round((convSum/visSum)*100) + "%";
  }
  updateStats();

  // Actions
  addActionBtn.addEventListener("click", () => {
    const t = `Ação — ${new Date().toLocaleString()}`;
    actions.unshift(t); save(KEY_ACTIONS, actions); rebuildList(recentActions, actions);
  });
  clearActionsBtn.addEventListener("click", () => { actions = []; save(KEY_ACTIONS, actions); rebuildList(recentActions, actions); });

  // Todos
  todoForm.addEventListener("submit", e => {
    e.preventDefault();
    const v = (todoInput.value||"").trim(); if(!v) return;
    todos.unshift(v); save(KEY_TODOS, todos); rebuildList(todoList, todos); todoInput.value="";
  });

  // Users
  userForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = (el("userName").value||"").trim();
    const role = (el("userRole").value||"").trim();
    if(!name) return;
    const label = role ? `${name} (${role})` : name;
    users.unshift(label); save(KEY_USERS, users); rebuildList(usersList, users);
    usersTotal++; updateStats();
    el("userName").value=""; el("userRole").value="";
  });

  // Export CSV
  exportBtn.addEventListener("click", () => {
    const rows = [["dia","visitas","conversoes"], ...visitsData.map((v,i)=>[i+1,v,convData[i]||0])];
    const csv = rows.map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"}); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="revitarium-data.csv"; a.click(); URL.revokeObjectURL(url);
  });

  // Auto refresh
  let interval = null;
  autoRefresh.addEventListener("change", function(){
    if(this.checked){
      interval = setInterval(()=> {
        visitsData.push(Math.round(120 + Math.random()*140)); visitsData.shift();
        convData.push(Math.round(8 + Math.random()*30)); convData.shift();
        sessionsTotal += Math.round(Math.random()*6);
        if(visitsChart){ visitsChart.data.datasets[0].data = visitsData; visitsChart.update(); }
        if(convChart){ convChart.data.datasets[0].data = convData; convChart.update(); }
        updateStats();
      }, 4200);
    } else { clearInterval(interval); interval = null; }
  });

  // Theme toggle (persist)
  function applyTheme(theme){
    if(theme === "light"){ document.documentElement.classList.add("light"); toggleTheme.textContent = "Dark"; }
    else { document.documentElement.classList.remove("light"); toggleTheme.textContent = "Light"; }
    localStorage.setItem(KEY_THEME, theme);
  }
  const savedTheme = localStorage.getItem(KEY_THEME) || "dark";
  applyTheme(savedTheme);
  toggleTheme.addEventListener("click", () => applyTheme(document.documentElement.classList.contains("light") ? "dark" : "light"));

  // Logout
  btnLogout.addEventListener("click", () => { localStorage.removeItem("rev_user"); window.location.href = "index.html"; });

  // Responsive: recreate charts on resize for gradient fix
  window.addEventListener("resize", () => { createCharts(); });

  // Keyboard shortcuts
  document.addEventListener("keydown", e => { if((e.ctrlKey||e.metaKey) && e.key === "e") exportBtn.click(); });

});
