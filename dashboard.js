// MOCK DATA
let visitsData = [120, 150, 180, 140, 210, 230, 200];
let conversionsData = [12, 20, 15, 18, 30, 28, 22];

document.addEventListener("DOMContentLoaded", () => {

    // STATS
    document.getElementById("statUsers").textContent = 124;
    document.getElementById("statSessions").textContent = 987;

    const convRate = Math.round(
      (conversionsData.reduce((a,b)=>a+b,0) /
       visitsData.reduce((a,b)=>a+b,0)) * 100
    );

    document.getElementById("statConversion").textContent = convRate + "%";

    // VISITS CHART
    new Chart(document.getElementById("visitsChart"), {
      type: "line",
      data: {
        labels: ["6d","5d","4d","3d","2d","1d","Hoje"],
        datasets: [{
          data: visitsData,
          borderColor: "#00eaff",
          borderWidth: 3,
          tension: 0.4,
          fill: false
        }]
      },
      options: { responsive: true }
    });

    // CONVERSIONS CHART
    new Chart(document.getElementById("convChart"), {
      type: "bar",
      data: {
        labels: ["6d","5d","4d","3d","2d","1d","Hoje"],
        datasets: [{
          data: conversionsData,
          backgroundColor: "#00c8ff"
        }]
      },
      options: { responsive: true }
    });

    // LOGOUT
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("rev_user");
      window.location.href = "index.html";
    });

});
