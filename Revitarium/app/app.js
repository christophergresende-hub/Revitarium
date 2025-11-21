function login() {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (usuario === "" || senha === "") {
        alert("Preencha usuário e senha.");
        return;
    }

    // Aqui você pode futuramente adicionar validação real
    sessionStorage.setItem("user", usuario);

    // Redireciona para o dashboard
    window.location.href = "dashboard.html";
}
