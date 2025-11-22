// ======== RELATÓRIOS PRO — REVITARIUM ========

// Dados simulados
const visitsHistory = [120,150,180,140,210,230,200,185,190,230,240,260];
const conversionsHistory = [10,18,22,15,18,30,28,24,26,32,33,29];

// === Gráfico de Visitas ===
const ctxV = document.getElementById("chartVisitsHistory");
if (ctxV) {
  new Chart(ctxV, {
    type: "line",
    data: {
      labels: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
      datasets: [{
        data: visitsHistory,
        borderColor: "#00e0ff",
        backgroundColor: "rgba(0,224,255,0.12)",
        borderWidth: 2,
        tension: 0.35,
        fill: true
      }]
    },
    options: { plugins:{ legend:{display:false} }, responsive:true }
  });
}

// === Gráfico de Conversões ===
const ctxC = document.getElementById("chartConversionsHistory");
if (ctxC) {
  new Chart(ctxC, {
    type: "bar",
    data: {
      labels: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
      datasets: [{
        data: conversionsHistory,
        backgroundColor: "#00d2ff",
        borderRadius: 6
      }]
    },
    options: { plugins:{ legend:{display:false} }, responsive:true }
  });
}

// === Exportação CSV ===
document.getElementById("exportFull").onclick = () => {
  const csv =
    "mes,visitas,conversoes\n" +
    visitsHistory.map((v,i)=> `${i+1},${v},${conversionsHistory[i]}`).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "relatorios-revitarium.csv";
  a.click();

  URL.revokeObjectURL(url);
};

// === Logout ===
document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("rev_user");
  window.location.href = "index.html";
};
