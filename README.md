# 🦖 Dino Runner

Juego de corredor sin fin inspirado en el clásico que aparece cuando se cae
internet en Chrome, **reconstruido desde cero** con tecnologías propias.

> Proyecto Web Temática Libre · Programación Front End · INACAP · 2026

## 🎮 Cómo jugar

- **Espacio** o **↑** para saltar.
- **↓** para agacharse (esquivar aves).
- **P** para pausar.
- En móvil: **toca la pantalla** para saltar.

Salta los cactus, agáchate ante las aves y bate tu récord. La velocidad sube
cada 100 puntos y la noche cae alrededor de los 700.

## 🧱 Tecnologías

Hecho **solo** con:

- HTML5 semántico
- CSS3 (variables, *media queries*, sin frameworks)
- JavaScript Vanilla (HTML5 Canvas, Web Audio API, localStorage)

Sin Bootstrap, Tailwind ni jQuery. Cero dependencias externas.

## 📁 Estructura de carpetas

```
proyecto-dino/
├── index.html            Página de inicio
├── juego.html            El juego (Canvas)
├── instrucciones.html    Cómo jugar
├── puntajes.html         Tabla de mejores marcas
├── contacto.html         Formulario validado
├── css/
│   ├── estilos.css        Estilos generales + temas + responsive
│   └── juego.css          Estilos propios de la pantalla del juego
└── js/
    ├── navegacion.js      Menú móvil + cambio de tema (compartido)
    ├── juego.js           Motor del juego
    ├── puntajes.js        Ranking (localStorage)
    └── contacto.js        Validación del formulario
```

## 🧩 Reparto de funcionalidades JS (por integrante)

| Funcionalidad | Archivo | Descripción |
|---|---|---|
| Motor y físicas del jugador | `juego.js` (Bloque 1) | Salto, agacharse, gravedad, bucle de animación |
| Obstáculos, dificultad y colisiones | `juego.js` (Bloque 2) | Cactus, aves, velocidad creciente, detección de choques |
| Puntaje, récord y ranking | `juego.js` (Bloque 3) + `puntajes.js` | Guardado y lectura en `localStorage` |
| Validación del formulario | `contacto.js` | Reglas por campo, mensajes de error y éxito |
| Navegación y tema | `navegacion.js` | Menú hamburguesa + modo claro/oscuro persistente |
| Sonido y ciclo día/noche | `juego.js` (Bloques 4 y 5) | Efectos con Web Audio API y cambio de paleta |

> Cada integrante debe poder explicar **cualquier línea** del bloque que presenta.

## ▶️ Cómo ejecutar

1. Descarga o clona el repositorio.
2. Abre `index.html` en el navegador.

> 💡 Para que el ranking (`localStorage`) funcione siempre, conviene abrirlo
> con un servidor local, por ejemplo la extensión **Live Server** de VS Code,
> en lugar de abrir el archivo directamente.
