/* ============================================================
   navegacion.js  —  Funcionalidad compartida por TODAS las páginas
   Responsable sugerido: Integrante encargado de UI/navegación
   Incluye 2 funcionalidades:
     (A) Menú hamburguesa para móvil
     (B) Interruptor de tema claro/oscuro con memoria (localStorage)
   ============================================================ */

/* Esperamos a que el HTML esté cargado para tomar los elementos. */
document.addEventListener("DOMContentLoaded", () => {
  console.log("[navegacion] DOM cargado: iniciando menú móvil y tema");
  iniciarMenuMovil();
  iniciarTema();
});

/* ---------- (A) MENÚ MÓVIL ---------- */
/* Muestra u oculta la lista de enlaces al tocar la hamburguesa. */
function iniciarMenuMovil() {
  const boton = document.querySelector("[data-menu-boton]");
  const lista = document.querySelector("[data-menu-lista]");

  // Si la página no tiene estos elementos, salimos sin error.
  if (!boton || !lista) return;

  // En móvil el menú arranca cerrado.
  cerrarMenu();

  boton.addEventListener("click", () => {
    const estaAbierto = !lista.classList.contains("oculto");
    if (estaAbierto) {
      console.log("[navegacion] Cerrando menú móvil");
      cerrarMenu();
    } else {
      console.log("[navegacion] Abriendo menú móvil");
      lista.classList.remove("oculto");
      boton.setAttribute("aria-expanded", "true");
    }
  });

  function cerrarMenu() {
    // Solo ocultamos cuando estamos en vista móvil (<=760px).
    if (window.innerWidth <= 760) {
      lista.classList.add("oculto");
    } else {
      lista.classList.remove("oculto");
    }
    boton.setAttribute("aria-expanded", "false");
  }

  // Al cambiar el tamaño de ventana, reajustamos la visibilidad.
  window.addEventListener("resize", cerrarMenu);
}

/* ---------- (B) TEMA CLARO / OSCURO ---------- */
const CLAVE_TEMA = "dino_tema";

function iniciarTema() {
  const boton = document.querySelector("[data-tema-boton]");

  // Aplicamos el tema guardado apenas carga la página.
  const temaGuardado = leerTemaGuardado();
  console.log("[navegacion] Tema guardado leído:", temaGuardado);
  aplicarTema(temaGuardado);

  if (!boton) return;

  boton.addEventListener("click", () => {
    // Si está en claro pasamos a oscuro y viceversa.
    const actual = document.documentElement.getAttribute("data-tema");
    const nuevo = actual === "claro" ? "oscuro" : "claro";
    console.log("[navegacion] Cambiando tema:", actual, "->", nuevo);
    aplicarTema(nuevo);
    guardarTema(nuevo);
  });
}

/* Pone el atributo en <html> y actualiza el ícono del botón. */
function aplicarTema(tema) {
  document.documentElement.setAttribute("data-tema", tema);
  const boton = document.querySelector("[data-tema-boton]");
  if (boton) {
    boton.textContent = tema === "claro" ? "🌙" : "☀️";
    boton.setAttribute(
      "aria-label",
      tema === "claro" ? "Activar modo oscuro" : "Activar modo claro"
    );
  }
}

/* Lectura segura desde localStorage (puede fallar en file://). */
function leerTemaGuardado() {
  try {
    return localStorage.getItem(CLAVE_TEMA) || "oscuro";
  } catch (error) {
    return "oscuro"; // valor por defecto si no hay acceso
  }
}

function guardarTema(tema) {
  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch (error) {
    // Si el navegador bloquea localStorage, el tema igual funciona
    // durante la sesión; solo no se recuerda al recargar.
  }
}