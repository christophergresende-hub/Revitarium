// =========================
// LOGIN
// =========================
if (window.location.pathname.includes("login.html")) {
    const form = document.getElementById("loginForm");

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const user = document.getElementById("usuario").value;
        const pass = document.getElementById("senha").value;

        if (user === "admin" && pass === "1234") {
            localStorage.setItem("revitariumUser", user);
            window.location.href = "dashboard.html";
        } else {
            alert("Usuário ou senha incorretos.");
        }
    });
}

// =========================
// DASHBOARD
// =========================
if (window.location.pathname.includes("dashboard.html")) {
    const user = localStorage.getItem("revitariumUser");

    if (!user) {
        window.location.href = "login.html";
    }

    document.getElementById("user").innerText = user;

    function logout() {
        localStorage.removeItem("revitariumUser");
        window.location.href = "login.html";
    }

    window.logout = logout;
}
</div>

<script src="app/app.js" defer></script>
</body>
</html>
