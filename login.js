/* LOGIN REVITARIUM */
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("errorBox");

  // Se já está logado → vai direto para o dashboard
  if (localStorage.getItem("rev_user") === "ok") {
    window.location.href = "dashboard.html";
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const user = document.getElementById("user").value.trim();
    const pass = document.getElementById("pass").value.trim();

    // 🔐 Credenciais oficiais
    const validUser = "admin";
    const validPass = "123";

    if (user === validUser && pass === validPass) {
      localStorage.setItem("rev_user", "ok");
      window.location.href = "dashboard.html";
    } else {
      errorBox.textContent = "Usuário ou senha incorretos.";
    }
  });
});
