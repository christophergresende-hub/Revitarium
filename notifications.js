// -------------------------------
// CONFIGURAÇÃO INICIAL
// -------------------------------
if (!localStorage.getItem("notifications")) {
  localStorage.setItem("notifications", JSON.stringify([]));
}

const notifList = document.getElementById("notifList");
const notifCount = document.getElementById("notifCount");

// -------------------------------
// FUNÇÃO PARA ADICIONAR NOTIFICAÇÃO
// -------------------------------
function addNotification(text) {
  const data = JSON.parse(localStorage.getItem("notifications"));

  const item = {
    id: Date.now(),
    text,
    time: new Date().toLocaleString("pt-BR")
  };

  data.unshift(item);
  localStorage.setItem("notifications", JSON.stringify(data));

  playSound();
  renderNotifications();
}

// -------------------------------
// RENDERIZAR LISTA
// -------------------------------
function renderNotifications() {
  const data = JSON.parse(localStorage.getItem("notifications"));

  notifCount.innerText = data.length;

  notifList.innerHTML = data.map(n => `
      <div class="notif-card">
        <p>${n.text}</p>
        <span class="time">${n.time}</span>
      </div>
  `).join("");
}

renderNotifications();

// -------------------------------
// SOM DE ALERTA
// -------------------------------
function playSound() {
  const beep = new Audio(
    "https://cdn.pixabay.com/download/audio/2021/09/16/audio_3f4fad71f9.mp3?filename=notification-1-126505.mp3"
  );
  beep.volume = 0.6;
  beep.play();
}

// -------------------------------
// GERA NOTIFICAÇÕES AUTOMÁTICAS
// -------------------------------
setInterval(() => {
  const exemplos = [
    "Novo usuário registrado.",
    "Backup finalizado com sucesso.",
    "Tentativa de login detectada.",
    "Meta de visitas ultrapassada hoje!",
    "Servidor respondeu em alta performance.",
    "Novo relatório disponível."
  ];

  const sort = exemplos[Math.floor(Math.random() * exemplos.length)];

  addNotification(sort);

}, 15000); // A cada 15 segundos
