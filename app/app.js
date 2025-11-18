// Núcleo do Revitarium
export const Revitarium = {
    screens: {},
    currentScreen: null,

    register(name, renderFunction) {
        this.screens[name] = renderFunction;
    },

    navigate(name) {
        if (!this.screens[name]) {
            alert("Tela não encontrada: " + name);
            return;
        }
        this.currentScreen = name;
        document.getElementById("app").innerHTML = this.screens[name]();
    }
};

// Tela inicial padrão
Revitarium.register("home", () => `
    <div class="card">
        <h2>Bem-vindo ao Revitarium</h2>
        <p>Seu ambiente está pronto. Agora podemos criar telas ilimitadas.</p>
        <button onclick="Revitarium.navigate('sobre')">Ir para Sobre</button>
    </div>
`);

// Tela 2 – exemplo
Revitarium.register("sobre", () => `
    <div class="card">
        <h2>Sobre o App</h2>
        <p>O Revitarium já está funcionando com navegação interna.</p>
        <button onclick="Revitarium.navigate('home')">Voltar</button>
    </div>
`);

// Inicializar app
document.addEventListener("DOMContentLoaded", () => {
    Revitarium.navigate("home");
});
