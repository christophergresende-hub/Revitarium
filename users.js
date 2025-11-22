// Inicialização
if (!localStorage.getItem("rev_users")) {
  localStorage.setItem("rev_users", JSON.stringify([]));
}

function loadUsers() {
  const area = document.getElementById("usersList");
  area.innerHTML = "";

  const users = JSON.parse(localStorage.getItem("rev_users"));

  users.forEach((u, index) => {
    area.innerHTML += `
      <div class="user-row">
        <div>
          <strong>${u.name}</strong><br>
          <small>${u.email}</small> — <b>${u.role}</b>
        </div>

        <div>
          <button onclick="deleteUser(${index})" class="delete">Excluir</button>
        </div>
      </div>
    `;
  });
}

document.getElementById("formAddUser").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = userName.value.trim();
  const email = userEmail.value.trim();
  const role = userRole.value;

  if (name === "" || email === "") {
    alert("Preencha todos os campos!");
    return;
  }

  const users = JSON.parse(localStorage.getItem("rev_users"));

  users.push({ name, email, role });

  localStorage.setItem("rev_users", JSON.stringify(users));

  this.reset();
  loadUsers();
});

function deleteUser(i) {
  const users = JSON.parse(localStorage.getItem("rev_users"));
  users.splice(i, 1);
  localStorage.setItem("rev_users", JSON.stringify(users));
  loadUsers();
}

loadUsers();
