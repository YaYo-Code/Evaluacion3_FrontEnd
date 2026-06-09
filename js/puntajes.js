/* ============================================================
   puntajes.js  —  Tabla de mejores puntajes (ranking)
   Se carga solo en puntajes.html.
   Lee la lista que guarda el juego en localStorage, la ordena
   de mayor a menor y la muestra en una tabla. También permite
   borrar todo el historial.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const cuerpoTabla = document.getElementById("cuerpoRanking");
  const estadoVacio = document.getElementById("rankingVacio");
  const btnBorrar = document.getElementById("btnBorrarRanking");

  if (!cuerpoTabla) return; // No estamos en la página de puntajes.

  const CLAVE_PUNTAJES = "dino_puntajes";

  /* Devuelve el ranking ordenado de mayor a menor puntaje. */
  function obtenerRanking() {
    let lista = [];
    try {
      lista = JSON.parse(localStorage.getItem(CLAVE_PUNTAJES)) || [];
    } catch (error) {
      lista = [];
    }
    // Ordenamos de mayor a menor y dejamos los 10 mejores.
    return lista.sort((a, b) => b.puntaje - a.puntaje).slice(0, 10);
  }

  /* Dibuja la tabla en pantalla a partir de la lista. */
  function mostrarRanking() {
    const ranking = obtenerRanking();
    cuerpoTabla.innerHTML = ""; // limpiamos antes de redibujar

    if (ranking.length === 0) {
      if (estadoVacio) estadoVacio.classList.remove("oculto");
      if (btnBorrar) btnBorrar.disabled = true;
      return;
    }

    if (estadoVacio) estadoVacio.classList.add("oculto");
    if (btnBorrar) btnBorrar.disabled = false;

    const medallas = ["🥇", "🥈", "🥉"];

    ranking.forEach((registro, indice) => {
      const fila = document.createElement("tr");
      const posicion = medallas[indice] || `#${indice + 1}`;

      fila.innerHTML = `
        <td class="medalla">${posicion}</td>
        <td>${escaparTexto(registro.nombre)}</td>
        <td>${String(registro.puntaje).padStart(5, "0")}</td>
        <td>${escaparTexto(registro.fecha || "—")}</td>
      `;
      cuerpoTabla.appendChild(fila);
    });
  }

  /* Evita que un nombre con símbolos rompa el HTML (seguridad básica). */
  function escaparTexto(texto) {
    const div = document.createElement("div");
    div.textContent = String(texto);
    return div.innerHTML;
  }

  /* Borra todo el ranking tras confirmar. */
  if (btnBorrar) {
    btnBorrar.addEventListener("click", () => {
      const seguro = confirm("¿Borrar todos los puntajes guardados?");
      if (!seguro) return;
      try {
        localStorage.removeItem(CLAVE_PUNTAJES);
      } catch (error) { /* se ignora */ }
      mostrarRanking();
    });
  }

  mostrarRanking(); // primera carga
});
