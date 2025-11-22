// login.js
document.addEventListener("DOMContentLoaded", () => {
  
  const form = document.getElementById("loginForm");
  const user = document.getElementById("user");
  const pass = document.getElementById("pass");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const u = user.value.trim();
    const p = pass.value.trim();

    if (u === "" || p === "") {
      alert("Preencha todos os campos!");
      return;
    }

    // Login padrão
    if (u === "admin" && p === "123") {
      // Salva sessão local
      localStorage.setItem("rev_user", "admin");
      window.location.href = "dashboard.html";
    } else {
      alert("Usuário ou senha incorretos!");
    }
  });

});
