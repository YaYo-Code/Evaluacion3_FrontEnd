/* ============================================================
   contacto.js  —  Validación del formulario de contacto
   Se carga solo en contacto.html.
   Valida cada campo con JavaScript (sin usar el envío nativo del
   navegador), muestra mensajes de error específicos y, si todo
   está correcto, muestra un aviso de éxito.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("formContacto");
  if (!formulario) return; // No estamos en la página de contacto.

  const avisoGlobal = document.getElementById("avisoFormulario");

  // Expresión regular simple para validar un correo electrónico.
  const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* Reglas de validación por campo: cada función devuelve un
     texto de error (string) o "" si el campo es válido. */
  const reglas = {
    nombre: (valor) => {
      if (valor.trim().length < 3) return "Escribe al menos 3 caracteres.";
      return "";
    },
    correo: (valor) => {
      if (!REGEX_CORREO.test(valor.trim())) return "Ingresa un correo válido.";
      return "";
    },
    asunto: (valor) => {
      if (valor === "") return "Selecciona un asunto.";
      return "";
    },
    mensaje: (valor) => {
      if (valor.trim().length < 10) return "El mensaje debe tener al menos 10 caracteres.";
      return "";
    },
  };

  /* Pinta (o limpia) el error de un campo concreto. */
  function mostrarError(campo, mensaje) {
    const contenedor = campo.closest(".campo");
    const cajaError = contenedor.querySelector(".campo__error");
    if (mensaje) {
      contenedor.classList.add("tiene-error");
      cajaError.textContent = mensaje;
      campo.setAttribute("aria-invalid", "true");
    } else {
      contenedor.classList.remove("tiene-error");
      cajaError.textContent = "";
      campo.setAttribute("aria-invalid", "false");
    }
  }

  /* Valida un solo campo según su nombre. Devuelve true si es válido. */
  function validarCampo(campo) {
    const regla = reglas[campo.name];
    if (!regla) return true;
    const error = regla(campo.value);
    mostrarError(campo, error);
    return error === "";
  }

  // Validación en vivo: al salir de un campo lo revisamos.
  formulario.querySelectorAll("input, textarea, select").forEach((campo) => {
    campo.addEventListener("blur", () => validarCampo(campo));
  });

  /* Al enviar: validamos TODO. Si hay errores, no enviamos. */
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault(); // controlamos el envío nosotros

    let todoOk = true;
    formulario.querySelectorAll("input, textarea, select").forEach((campo) => {
      if (!validarCampo(campo)) todoOk = false;
    });

    if (!todoOk) {
      mostrarAviso("Revisa los campos marcados en rojo.", "error");
      return;
    }

    // Todo correcto: mostramos éxito y limpiamos el formulario.
    mostrarAviso("¡Mensaje enviado! Te responderemos pronto. 🦖", "ok");
    formulario.reset();
  });

  /* Muestra el aviso global de éxito o error sobre el formulario. */
  function mostrarAviso(texto, tipo) {
    if (!avisoGlobal) return;
    avisoGlobal.textContent = texto;
    avisoGlobal.className = "aviso aviso--" + (tipo === "ok" ? "ok" : "error");
    avisoGlobal.style.display = "block";
    avisoGlobal.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});
