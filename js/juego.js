/* ============================================================
   juego.js  —  Motor del "Dino Runner" (HTML5 Canvas, JS Vanilla)
   Se carga solo en juego.html.

   FUNCIONALIDADES (para repartir entre integrantes):
     1) Motor y físicas del jugador  ......... saltar / agacharse / gravedad
     2) Obstáculos + dificultad + colisiones . cactus, aves, velocidad creciente
     3) Marcador, récord y guardado .......... puntaje en vivo + localStorage
     4) Sonido (Web Audio API) ............... efectos de salto / punto / choque
     5) Ciclo día / noche .................... cambio de paleta por hitos
   ============================================================ */

document.addEventListener("DOMContentLoaded", iniciarJuego);

function iniciarJuego() {
  const lienzo = document.getElementById("lienzoJuego");
  if (!lienzo) return; // No estamos en la página del juego.
  const ctx = lienzo.getContext("2d");
  console.log("[juego] Motor del Dino Runner iniciado");

  /* -------------------- CONFIGURACIÓN -------------------- */
  const ANCHO = 640;            // ancho lógico del lienzo
  const ALTO = 200;             // alto lógico del lienzo
  const PISO_Y = ALTO - 24;     // altura del suelo (pies del dino)
  const GRAVEDAD = 2600;        // px por segundo al cuadrado
  const FUERZA_SALTO = -820;    // velocidad inicial del salto
  const VEL_INICIAL = 330;      // velocidad de desplazamiento inicial
  const VEL_MAXIMA = 900;       // tope de velocidad
  const U = 4;                  // tamaño de cada "pixel" de los sprites

  lienzo.width = ANCHO;
  lienzo.height = ALTO;

  /* Paletas del juego (independientes del tema del sitio). */
  const PALETA_DIA = { cielo: "#f5f0e6", tinta: "#3a3f44", suelo: "#9aa0a6" };
  const PALETA_NOCHE = { cielo: "#181c22", tinta: "#d7dadf", suelo: "#566066" };

  /* -------------------- ESTADO DEL JUEGO -------------------- */
  // estado: "listo" | "jugando" | "pausa" | "fin"
  let estado = "listo";
  let velocidad = VEL_INICIAL;
  let puntaje = 0;
  let record = leerRecord();
  let esNoche = false;
  let ultimoTiempo = 0;
  let cronometroAnim = 0;     // controla la animación de las patas
  let frameAnim = 0;
  let desplazamientoSuelo = 0;
  let proximoHito = 100;      // siguiente puntaje que dispara sonido/dificultad

  // El jugador (dino). y = borde superior del sprite.
  const dino = {
    x: 56,
    ancho: 44,
    alto: 48,
    altoAgachado: 28,
    y: PISO_Y - 48,
    vy: 0,
    enSalto: false,
    agachado: false,
  };

  let obstaculos = [];
  let distanciaProxObstaculo = 0; // px que faltan para soltar el próximo

  // Elementos decorativos
  let nubes = [];
  let estrellas = generarEstrellas();

  /* Referencias a elementos del HUD y capas (pueden no existir). */
  const elPuntaje = document.getElementById("marcadorPuntaje");
  const elRecord = document.getElementById("marcadorRecord");
  const capaInicio = document.getElementById("capaInicio");
  const capaPausa = document.getElementById("capaPausa");
  const capaFin = document.getElementById("capaFin");
  const elPuntajeFinal = document.getElementById("puntajeFinal");
  const btnIniciar = document.getElementById("btnIniciar");
  const btnReiniciar = document.getElementById("btnReiniciar");
  const btnPausa = document.getElementById("btnPausa");
  const btnSonido = document.getElementById("btnSonido");
  const btnGuardar = document.getElementById("btnGuardarPuntaje");
  const inputNombre = document.getElementById("nombreJugador");

  if (elRecord) elRecord.textContent = record;

  /* ============================================================
     BLOQUE 4: SONIDO (Web Audio API)
     ============================================================ */
  let sonidoActivo = leerSonidoActivo();
  let contextoAudio = null;

  function asegurarAudio() {
    // Creamos el contexto la primera vez (requiere gesto del usuario).
    if (!contextoAudio) {
      try {
        const Clase = window.AudioContext || window.webkitAudioContext;
        contextoAudio = new Clase();
        console.log("[juego] Contexto de audio (Web Audio API) creado");
      } catch (error) {
        contextoAudio = null;
        console.warn("[juego] No se pudo crear el contexto de audio");
      }
    }
  }

  // Genera un "bip" corto con una frecuencia dada.
  function reproducirBip(frecuencia, duracion) {
    if (!sonidoActivo || !contextoAudio) return;
    const oscilador = contextoAudio.createOscillator();
    const ganancia = contextoAudio.createGain();
    oscilador.type = "square"; // onda cuadrada = sonido retro
    oscilador.frequency.value = frecuencia;
    ganancia.gain.value = 0.05;
    oscilador.connect(ganancia);
    ganancia.connect(contextoAudio.destination);
    oscilador.start();
    oscilador.stop(contextoAudio.currentTime + duracion);
  }

  function actualizarBotonSonido() {
    if (btnSonido) btnSonido.textContent = sonidoActivo ? "🔊 Sonido" : "🔇 Sonido";
  }
  actualizarBotonSonido();

  /* ============================================================
     BLOQUE 1: ENTRADA Y FÍSICAS DEL JUGADOR
     ============================================================ */

  // Hace saltar al dino si está en el suelo.
  function saltar() {
    if (dino.enSalto) return;
    dino.vy = FUERZA_SALTO;
    dino.enSalto = true;
    dino.agachado = false;
    reproducirBip(620, 0.08);
    console.log("[juego] Acción: saltar");
  }

  // Activa o desactiva la postura agachada.
  function agacharse(activar) {
    dino.agachado = activar && !dino.enSalto;
    if (dino.agachado) console.log("[juego] Acción: agacharse");
  }

  // Aplica gravedad y mantiene al dino sobre el suelo.
  function actualizarJugador(dt) {
    dino.vy += GRAVEDAD * dt;
    dino.y += dino.vy * dt;

    const alturaActual = dino.agachado ? dino.altoAgachado : dino.alto;
    const tope = PISO_Y - alturaActual;

    if (dino.y >= tope) {
      dino.y = tope;
      dino.vy = 0;
      dino.enSalto = false;
    }
  }

  /* Teclado: barra/flecha arriba = salto, flecha abajo = agacharse,
     P = pausa, Enter/barra reinician en game over. */
  document.addEventListener("keydown", (evento) => {
    const tecla = evento.code;

    if (tecla === "Space" || tecla === "ArrowUp") {
      evento.preventDefault(); // evita que la página haga scroll
      asegurarAudio();
      if (estado === "listo") { comenzar(); return; }
      if (estado === "fin") { reiniciar(); return; }
      if (estado === "jugando") saltar();
    }

    if (tecla === "ArrowDown" && estado === "jugando") {
      evento.preventDefault();
      agacharse(true);
    }

    if (tecla === "KeyP") alternarPausa();
    if (tecla === "Enter" && estado === "fin") reiniciar();
  });

  document.addEventListener("keyup", (evento) => {
    if (evento.code === "ArrowDown") agacharse(false);
  });

  // Toque o clic sobre el lienzo: empezar / saltar / reiniciar.
  lienzo.addEventListener("pointerdown", () => {
    asegurarAudio();
    if (estado === "listo") comenzar();
    else if (estado === "fin") reiniciar();
    else if (estado === "jugando") saltar();
  });

  /* ============================================================
     BLOQUE 2: OBSTÁCULOS, DIFICULTAD Y COLISIONES
     ============================================================ */

  // Crea un cactus (1 a 3 juntos) o un ave, según el puntaje.
  function crearObstaculo() {
    const apareceAve = puntaje > 250 && Math.random() < 0.25;

    if (apareceAve) {
      // Aves a tres alturas distintas (algunas obligan a agacharse).
      const alturas = [PISO_Y - 80, PISO_Y - 52, PISO_Y - 30];
      const y = alturas[Math.floor(Math.random() * alturas.length)];
      console.log("[juego] Obstáculo generado: ave");
      return { tipo: "ave", x: ANCHO + 20, y: y, ancho: 42, alto: 28, frame: 0 };
    }

    // Cactus: 1, 2 o 3 pegados, de tamaño chico o grande.
    const cantidad = 1 + Math.floor(Math.random() * 3);
    const grande = Math.random() < 0.4;
    const altoCactus = grande ? 50 : 36;
    const anchoUnidad = grande ? 22 : 18;
    console.log("[juego] Obstáculo generado: cactus x" + cantidad + (grande ? " (grande)" : ""));
    return {
      tipo: "cactus",
      x: ANCHO + 20,
      y: PISO_Y - altoCactus,
      ancho: anchoUnidad * cantidad,
      alto: altoCactus,
      cantidad: cantidad,
      grande: grande,
    };
  }

  // Mueve los obstáculos, genera nuevos y elimina los que salen.
  function actualizarObstaculos(dt) {
    distanciaProxObstaculo -= velocidad * dt;

    if (distanciaProxObstaculo <= 0) {
      obstaculos.push(crearObstaculo());
      // Hueco aleatorio: más velocidad => algo más de separación.
      const base = 260 + velocidad * 0.35;
      distanciaProxObstaculo = base + Math.random() * 220;
    }

    for (const obs of obstaculos) {
      obs.x -= velocidad * dt;
      if (obs.tipo === "ave") {
        obs.frame += dt; // para animar el aleteo
      }
    }

    // Quitamos los que ya salieron por la izquierda.
    obstaculos = obstaculos.filter((obs) => obs.x + obs.ancho > -10);
  }

  // Detección de colisión por cajas (AABB) con un margen de gracia.
  function hayColision() {
    const margen = 6; // hace el juego más justo
    const alturaDino = dino.agachado ? dino.altoAgachado : dino.alto;
    const caja = {
      x: dino.x + margen,
      y: dino.y + margen,
      ancho: dino.ancho - margen * 2,
      alto: alturaDino - margen * 2,
    };

    return obstaculos.some((obs) => {
      return (
        caja.x < obs.x + obs.ancho - margen &&
        caja.x + caja.ancho > obs.x + margen &&
        caja.y < obs.y + obs.alto - margen &&
        caja.y + caja.alto > obs.y + margen
      );
    });
  }

  // Sube la velocidad y dispara sonidos en cada hito de 100 puntos.
  function actualizarDificultad() {
    if (puntaje >= proximoHito) {
      proximoHito += 100;
      velocidad = Math.min(velocidad + 22, VEL_MAXIMA);
      reproducirBip(880, 0.07);
      console.log("[juego] Hito alcanzado:", proximoHito - 100, "pts | velocidad:", Math.round(velocidad));

      // BLOQUE 5: cada 700 puntos cambia de día a noche.
      const eraNoche = esNoche;
      if (Math.floor(puntaje / 700) % 2 === 1) esNoche = true;
      else esNoche = false;
      if (esNoche !== eraNoche) console.log("[juego] Ciclo día/noche ->", esNoche ? "noche" : "día");
    }
  }

  /* ============================================================
     BLOQUE 3: MARCADOR Y RÉCORD (localStorage)
     ============================================================ */
  const CLAVE_RECORD = "dino_record";
  const CLAVE_PUNTAJES = "dino_puntajes";

  function leerRecord() {
    try {
      return parseInt(localStorage.getItem(CLAVE_RECORD)) || 0;
    } catch (error) {
      return 0;
    }
  }

  function guardarRecord(valor) {
    try {
      localStorage.setItem(CLAVE_RECORD, String(valor));
    } catch (error) {
      /* sin acceso a localStorage: se ignora silenciosamente */
    }
  }

  // Guarda {nombre, puntaje, fecha} en la lista que lee puntajes.html.
  function guardarEnRanking(nombre, valor) {
    const registro = {
      nombre: nombre.slice(0, 16),
      puntaje: valor,
      fecha: new Date().toLocaleDateString("es-CL"),
    };
    try {
      const lista = JSON.parse(localStorage.getItem(CLAVE_PUNTAJES)) || [];
      lista.push(registro);
      localStorage.setItem(CLAVE_PUNTAJES, JSON.stringify(lista));
      console.log("[juego] Puntaje guardado en ranking:", registro);
      return true;
    } catch (error) {
      console.warn("[juego] No se pudo guardar el puntaje en localStorage");
      return false;
    }
  }

  function actualizarMarcador() {
    if (elPuntaje) elPuntaje.textContent = String(Math.floor(puntaje)).padStart(5, "0");
    if (elRecord) elRecord.textContent = String(record).padStart(5, "0");
  }

  /* ============================================================
     DIBUJO DE SPRITES (rectángulos = pixel art propio)
     ============================================================ */

  // Atajo para dibujar un rectángulo escalado por U.
  function px(col, fila, ancho, alto, color) {
    ctx.fillStyle = color;
    ctx.fillRect(col * U, fila * U, ancho * U, alto * U);
  }

  // Dibuja el dino en (bx, by) usando coordenadas absolutas del lienzo.
  function dibujarDino(bx, by, paleta) {
    ctx.save();
    ctx.translate(bx, by);
    const c = paleta.tinta;

    if (dino.agachado) {
      // Postura agachada: cuerpo largo y bajo (encaja en 44x28 px).
      px(0, 2, 2, 2, c);     // cola
      px(2, 1, 8, 3, c);     // cuerpo
      px(9, 1, 2, 3, c);     // cabeza estirada
      px(3, 5, 2, 2, c);     // pata trasera
      px(7, 5, 2, 2, c);     // pata delantera
      px(10, 1, 1, 1, paleta.cielo); // ojo
    } else {
      // Postura de pie.
      px(0, 6, 3, 2, c);     // cola
      px(2, 5, 6, 4, c);     // cuerpo
      px(3, 4, 4, 1, c);     // lomo
      px(7, 1, 4, 5, c);     // cabeza
      px(6, 4, 2, 2, c);     // cuello
      px(6, 7, 1, 1, c);     // brazo
      px(9, 2, 1, 1, paleta.cielo); // ojo

      // Patas con animación al correr.
      if (estado === "jugando" && !dino.enSalto) {
        if (frameAnim === 0) {
          px(6, 9, 2, 3, c);
          px(3, 9, 2, 2, c);
        } else {
          px(6, 9, 2, 2, c);
          px(3, 9, 2, 3, c);
        }
      } else {
        px(6, 9, 2, 3, c);
        px(3, 9, 2, 3, c);
      }
    }
    ctx.restore();
  }

  // Dibuja un cactus (puede ser un grupo de varios).
  function dibujarCactus(obs, paleta) {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    const c = paleta.tinta;
    const unidad = obs.grande ? 22 : 18;
    const altoU = obs.grande ? 12 : 9;

    for (let i = 0; i < obs.cantidad; i++) {
      ctx.save();
      ctx.translate(i * unidad, 0);
      px(2, 0, 2, altoU, c);          // tronco
      px(0, 3, 1, 3, c);              // brazo izq. vertical
      px(0, 5, 2, 1, c);              // brazo izq. horizontal
      px(4, 2, 1, 3, c);              // brazo der. vertical
      px(3, 4, 2, 1, c);              // brazo der. horizontal
      ctx.restore();
    }
    ctx.restore();
  }

  // Dibuja un ave con aleteo (dos frames).
  function dibujarAve(obs, paleta) {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    const c = paleta.tinta;
    const alaArriba = Math.floor(obs.frame * 6) % 2 === 0;

    px(2, 2, 6, 2, c);   // cuerpo
    px(8, 1, 2, 2, c);   // cabeza
    px(10, 2, 1, 1, c);  // pico
    if (alaArriba) px(2, 0, 4, 2, c);  // ala arriba
    else px(2, 4, 4, 2, c);            // ala abajo
    ctx.restore();
  }

  /* Fondo: cielo, suelo punteado, nubes (día) o estrellas (noche). */
  function generarEstrellas() {
    const lista = [];
    for (let i = 0; i < 18; i++) {
      lista.push({
        x: Math.random() * ANCHO,
        y: Math.random() * (PISO_Y - 60),
        t: Math.random() < 0.5 ? 1 : 2,
      });
    }
    return lista;
  }

  function dibujarFondo(paleta) {
    // Cielo
    ctx.fillStyle = paleta.cielo;
    ctx.fillRect(0, 0, ANCHO, ALTO);

    if (esNoche) {
      // Estrellas
      ctx.fillStyle = paleta.tinta;
      for (const e of estrellas) ctx.fillRect(e.x, e.y, e.t, e.t);
      // Luna
      ctx.beginPath();
      ctx.arc(ANCHO - 70, 44, 16, 0, Math.PI * 2);
      ctx.fillStyle = paleta.tinta;
      ctx.fill();
    } else {
      // Nubes (rectángulos suaves)
      ctx.fillStyle = paleta.suelo;
      for (const n of nubes) {
        ctx.fillRect(n.x, n.y, 30, 6);
        ctx.fillRect(n.x + 8, n.y - 5, 16, 5);
      }
    }

    // Suelo: línea punteada que se desplaza.
    ctx.fillStyle = paleta.suelo;
    for (let x = -desplazamientoSuelo; x < ANCHO; x += 14) {
      ctx.fillRect(x, PISO_Y + 2, 8, 2);
    }
  }

  function actualizarNubes(dt) {
    // Genera nubes de vez en cuando y las mueve lento.
    if (!esNoche && Math.random() < 0.01 && nubes.length < 4) {
      nubes.push({ x: ANCHO, y: 20 + Math.random() * 50 });
    }
    for (const n of nubes) n.x -= velocidad * 0.25 * dt;
    nubes = nubes.filter((n) => n.x > -40);
  }

  /* ============================================================
     BUCLE PRINCIPAL DEL JUEGO
     ============================================================ */

  function actualizar(dt) {
    velocidadDeAnimacion(dt);
    actualizarJugador(dt);
    actualizarObstaculos(dt);
    actualizarNubes(dt);

    puntaje += velocidad * dt * 0.06; // el puntaje crece con la distancia
    actualizarDificultad();
    actualizarMarcador();

    if (hayColision()) terminar();
  }

  // Avanza el desplazamiento del suelo y alterna el frame de patas.
  function velocidadDeAnimacion(dt) {
    desplazamientoSuelo = (desplazamientoSuelo + velocidad * dt) % 14;
    cronometroAnim += dt;
    if (cronometroAnim > 0.12) {
      cronometroAnim = 0;
      frameAnim = frameAnim === 0 ? 1 : 0;
    }
  }

  function dibujar() {
    const paleta = esNoche ? PALETA_NOCHE : PALETA_DIA;
    dibujarFondo(paleta);
    for (const obs of obstaculos) {
      if (obs.tipo === "cactus") dibujarCactus(obs, paleta);
      else dibujarAve(obs, paleta);
    }
    dibujarDino(dino.x, dino.y, paleta);
  }

  // Cada cuadro: calcula el tiempo transcurrido y actualiza+dibuja.
  function bucle(tiempo) {
    let dt = (tiempo - ultimoTiempo) / 1000;
    ultimoTiempo = tiempo;
    // Limitamos dt para que un cambio de pestaña no rompa la física.
    if (dt > 0.05) dt = 0.05;

    if (estado === "jugando") actualizar(dt);
    dibujar();

    requestAnimationFrame(bucle);
  }

  /* ============================================================
     CONTROL DE ESTADOS (inicio / pausa / fin / reinicio)
     ============================================================ */

  function comenzar() {
    estado = "jugando";
    if (capaInicio) capaInicio.classList.add("oculto");
    if (capaFin) capaFin.classList.add("oculto");
    console.log("[juego] Estado -> jugando (partida iniciada)");
  }

  function reiniciar() {
    velocidad = VEL_INICIAL;
    puntaje = 0;
    proximoHito = 100;
    esNoche = false;
    obstaculos = [];
    nubes = [];
    distanciaProxObstaculo = 0;
    dino.y = PISO_Y - dino.alto;
    dino.vy = 0;
    dino.enSalto = false;
    dino.agachado = false;
    actualizarMarcador();
    if (capaFin) capaFin.classList.add("oculto");
    estado = "jugando";
    console.log("[juego] Estado -> jugando (partida reiniciada)");
  }

  function terminar() {
    estado = "fin";
    reproducirBip(160, 0.25);
    const final = Math.floor(puntaje);
    console.log("[juego] Estado -> fin. Puntaje:", final, "| Récord:", record);

    if (final > record) {
      record = final;
      guardarRecord(record);
      console.log("[juego] ¡Nuevo récord!:", record);
    }
    if (elPuntajeFinal) elPuntajeFinal.textContent = String(final).padStart(5, "0");
    if (capaFin) capaFin.classList.remove("oculto");
  }

  function alternarPausa() {
    if (estado === "jugando") {
      estado = "pausa";
      if (capaPausa) capaPausa.classList.remove("oculto");
      console.log("[juego] Estado -> pausa");
    } else if (estado === "pausa") {
      estado = "jugando";
      if (capaPausa) capaPausa.classList.add("oculto");
      console.log("[juego] Estado -> jugando (reanudado)");
    }
  }

  /* -------------------- BOTONES DE LA INTERFAZ -------------------- */
  if (btnIniciar) btnIniciar.addEventListener("click", () => { asegurarAudio(); comenzar(); });
  if (btnReiniciar) btnReiniciar.addEventListener("click", reiniciar);
  if (btnPausa) btnPausa.addEventListener("click", alternarPausa);

  if (btnSonido) {
    btnSonido.addEventListener("click", () => {
      sonidoActivo = !sonidoActivo;
      guardarSonidoActivo(sonidoActivo);
      actualizarBotonSonido();
      console.log("[juego] Sonido:", sonidoActivo ? "activado" : "silenciado");
    });
  }

  if (btnGuardar) {
    btnGuardar.addEventListener("click", () => {
      const nombre = (inputNombre && inputNombre.value.trim()) || "Anónimo";
      const final = Math.floor(puntaje);
      const ok = guardarEnRanking(nombre, final);
      btnGuardar.textContent = ok ? "✓ Guardado" : "No se pudo guardar";
      btnGuardar.disabled = true;
    });
  }

  /* Persistencia de la preferencia de sonido. */
  function leerSonidoActivo() {
    try {
      return localStorage.getItem("dino_sonido") !== "off";
    } catch (error) {
      return true;
    }
  }
  function guardarSonidoActivo(activo) {
    try {
      localStorage.setItem("dino_sonido", activo ? "on" : "off");
    } catch (error) { /* se ignora */ }
  }

  // Si el usuario cambia de pestaña mientras juega, pausamos solo.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && estado === "jugando") alternarPausa();
  });

  /* -------------------- ARRANQUE -------------------- */
  actualizarMarcador();
  requestAnimationFrame(bucle); // dibuja la pantalla "listo"
  console.log("[juego] Listo para jugar (pantalla de inicio dibujada)");
}