/* app.js - controlador do dashboard */
document.addEventListener("DOMContentLoaded", function () {
  // Elements
  const visitsCanvas = document.getElementById("visitsChart");
  const visitsCtx = visitsCanvas.getContext("2d");

  const convCanvas = document.getElementById("conversionsChart");
  const convCtx = convCanvas ? convCanvas.getContext("2d") : null;

  const recentActions = document.getElementById("recentActions");
  const todoForm = document.getElementById("todoForm");
  const todoInput = document.getElementById("todoInput");
  const todoList = document.getElementById("todoList");
  const userForm = document.getElementById("userForm");
  const usersList = document.getElementById("usersList");
  const exportBtn = document.getElementById("exportCsv");
  const addActionBtn = document.getElementById("addActionBtn");
  const autoRefresh = document.getElementById("autoRefresh");

  // Dados mock
  const visitsData = [120, 150, 180, 140, 210, 230, 200];
  const conversionsData = [12, 20, 15, 18, 30, 28, 22];

  // === GRÁFICO: VISITAS ===

  // Correção: gradiente válido
  const gradient = visitsCtx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, "rgba(0,224,255,0.25)");
  gradient.addColorStop(1, "rgba(0,163,255,0.05)");

  const visitsChart = new Chart(visitsCtx, {
    type: "line",
    data: {
      labels: ["6d", "5d", "4d", "3d", "2d", "1d", "Hoje"],
      datasets: [
        {
          label: "Visitas",
          data: visitsData,
          fill: true,
          backgroundColor: gradient,
          borderColor: "#00e0ff",
          pointRadius: 2,
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
    },
  });

  // === GRÁFICO: CONVERSÕES ===
  let conversionsChart = null;

  if (convCtx) {
    conversionsChart = new Chart(convCtx, {
      type: "bar",
      data: {
        labels: ["6d", "5d", "4d", "3d", "2d", "1d", "Hoje"],
        datasets: [
          {
            label: "Conversões",
            data: conversionsData,
            backgroundColor: "#00d2ff",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
      },
    });
  }

  // === Funções utilitárias ===
  function addListItem(el, text) {
    const li = document.createElement("li");
    li.textContent = text;
    el.prepend(li);
  }

  // Inicial
  ["Item A", "Item B", "Item C"].forEach((t) => addListItem(recentActions, t));
  ["Tarefa 1", "Tarefa 2"].forEach((t) => addListItem(todoList, t));
  ["Admin (Owner)"].forEach((u) => addListItem(usersList, u));

  // -- Adicionar ação --
  addActionBtn?.addEventListener("click", () => {
    const action = `Ação adicionada às ${new Date().toLocaleTimeString()}`;
    addListItem(recentActions, action);
  });

  // -- Adicionar tarefa --
  todoForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;
    addListItem(todoList, text);
    todoInput.value = "";
  });

  // -- Adicionar usuário --
  userForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("userName").value.trim();
    const role = document.getElementById("userRole").value.trim();
    if (!name) return;

    addListItem(usersList, role ? `${name} (${role})` : name);

    document.getElementById("userName").value = "";
    document.getElementById("userRole").value = "";
  });

  // -- Exportar CSV --
  exportBtn?.addEventListener("click", () => {
    const rows = [
      ["dia", "visitas", "conversoes"],
      ...visitsData.map((v, i) => [i, v, conversionsData[i] || 0]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "revitarium-visits.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  });

  // -- Auto-refresh (somente visitas) --
  let autoRefreshInterval = null;

  autoRefresh?.addEventListener("change", function () {
    if (this.checked) {
      autoRefreshInterval = setInterval(() => {
        visitsData.push(150 + Math.round(Math.random() * 100));
        visitsData.shift();
        visitsChart.update();
      }, 5000);
    } else {
      clearInterval(autoRefreshInterval);
    }
  });

  // Logout
  document.getElementById("btn-logout")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Atalho (Ctrl+E para exportar)
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "e") exportBtn?.click();
  });
});
