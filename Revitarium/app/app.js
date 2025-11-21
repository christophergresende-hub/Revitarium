/* ==========================
    FUNÇÕES DO DASHBOARD
========================== */

/* ----- LOGOUT ----- */
document.getElementById("logoutBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});

/* ----- EXPORTAR CSV ----- */
document.getElementById("exportCSV").addEventListener("click", () => {
  const data = [
    ["Dia", "Visitas"],
    ["Seg", 120],
    ["Ter", 87],
    ["Qua", 95],
    ["Qui", 130],
    ["Sex", 160],
    ["Sab", 200],
    ["Dom", 180]
  ];

  let csv = "";
  data.forEach(row => csv += row.join(",") + "\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "relatorio.csv";
  a.click();
});

/* ----- CHARTS ----- */
const chartVisits = new Chart(document.getElementById("chartVisits"), {
  type: "line",
  data: {
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"],
    datasets: [{
      label: "Visitas",
      data: [120, 87, 95, 130, 160, 200, 180],
      borderColor: "cyan",
      borderWidth: 3,
      fill: false
    }]
  }
});

const chartConversions = new Chart(document.getElementById("chartConversions"), {
  type: "bar",
  data: {
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
    datasets: [{
      label: "Conversões",
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: "cyan"
    }]
  }
});

/* ----- ÚLTIMAS AÇÕES ----- */
document.getElementById("addActionBtn").addEventListener("click", () => {
  const text = prompt("Descreva a ação:");
  if (!text) return;
  const li = document.createElement("li");
  li.innerText = text;
  document.getElementById("actionsList").appendChild(li);
});

/* ----- TAREFAS ----- */
document.getElementById("addTaskBtn").addEventListener("click", () => {
  const task = document.getElementById("taskInput").value;
  if (!task) return;
  const li = document.createElement("li");
  li.innerText = task;
  document.getElementById("tasksList").appendChild(li);
  document.getElementById("taskInput").value = "";
});

/* ----- USUÁRIOS ----- */
document.getElementById("addUserBtn").addEventListener("click", () => {
  const name = document.getElementById("newUserName").value;
  const role = document.getElementById("newUserRole").value;
  if (!name || !role) return;
  const li = document.createElement("li");
  li.innerText = `${name} – ${role}`;
  document.getElementById("usersList").appendChild(li);
  document.getElementById("newUserName").value = "";
  document.getElementById("newUserRole").value = "";
});

/* ----- RESUMO ----- */
document.getElementById("summaryBox").innerHTML = `
  <li>Visitas totais: 8.450</li>
  <li>Conversões totais: 720</li>
  <li>Taxa de conversão: 8.5%</li>
`;
