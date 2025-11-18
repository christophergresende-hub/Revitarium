document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("login-form");
    const userInput = document.getElementById("username");
    const passInput = document.getElementById("password");
    const messageBox = document.getElementById("login-message");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const username = userInput.value.trim();
        const password = passInput.value.trim();

        if (username === "" || password === "") {
            showMessage("Preencha todos os campos.", "error");
            return;
        }

        if (username === "admin" && password === "1234") {
            showMessage("Login realizado com sucesso!", "success");

            setTimeout(() => {
                window.location.href = "../index.html";
            }, 1200);

        } else {
            showMessage("Usuário ou senha incorretos.", "error");
        }
    });

    function showMessage(text, type) {
        messageBox.innerText = text;
        messageBox.className = type;
        messageBox.style.display = "block";

        setTimeout(() => {
            messageBox.style.display = "none";
        }, 2500);
    }
});
