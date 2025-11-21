document.getElementById("loginForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const user = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();

  if (user === "" || pass === "") {
    alert("Preencha todos os campos!");
    return;
  }

  if (user === "admin" && pass === "123") {
    window.location.href = "dashboard.html";
  } else {
    alert("Usuário ou senha incorretos!");
  }
});
