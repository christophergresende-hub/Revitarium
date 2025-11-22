document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const user = document.getElementById("user").value.trim();
    const pass = document.getElementById("pass").value.trim();

    if (user === "admin" && pass === "123") {
        localStorage.setItem("rev_user", "ok");
        window.location.href = "dashboard.html";
    } else {
        alert("Usuário ou senha incorretos");
    }
});
