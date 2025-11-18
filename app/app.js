// Teste inicial — confirma que o app.js está conectado ao site

document.addEventListener("DOMContentLoaded", () => {
  const box = document.createElement("div");
  box.style.padding = "20px";
  box.style.margin = "20px";
  box.style.background = "#2c3e50";
  box.style.color = "white";
  box.style.borderRadius = "8px";
  box.innerText = "O app.js está funcionando perfeitamente!";
  
  document.body.appendChild(box);
});
