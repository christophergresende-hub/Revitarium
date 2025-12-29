const zonas = {
  cranio: "head",
  cervical: "cervical",
  toracica: "thoracic",
  torax: "ribcage",
  pelve: "pelvis",
  membros: "lowerLimbs",
  full: "fullBody"
};

function selecionarZona(zona) {
  console.log("Zona selecionada:", zonas[zona]);
  // Aqui futuramente aciona iluminação / highlight / 3D
}
