document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const userInput = document.getElementById("user");
  const passInput = document.getElementById("pass");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const user = userInput.value.trim();
    const pass = passInput.value.trim();

    if (user === "admin" && pass === "123") {
      localStorage.setItem("rev_user", "admin");
      window.location.href = "dashboard.html";
    } else {
      alert("Usuário ou senha incorretos.");
    }
  });
});
