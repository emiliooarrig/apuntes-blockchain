# ChainNotes — Portafolio de apuntes de Blockchain

Landing page estática (HTML + CSS + JavaScript, sin frameworks ni dependencias)
que presenta un portafolio de apuntes de Blockchain. Diseño inspirado en
**Claymorphism**: superficies suaves, esquinas muy redondeadas y sombras dobles
(exterior + interior) que dan sensación de plastilina.

## Estructura

```
apuntes-blockchain/
├─ index.html                   # Landing / punto de entrada del sitio
├─ temas/                       # Una página de apuntes por tema del temario
│  ├─ hash.html                 # 01 · Hash y sus aplicaciones
│  ├─ compromisos.html          # 02 · Esquemas y aplicaciones de compromiso
│  ├─ firma-digital.html        # 03 · Firma digital
│  ├─ encadenamiento.html       # 04 · Encadenamiento
│  └─ timestamping.html         # 05 · Time stamping
├─ assets/                      # Recursos estáticos compartidos por todas las páginas
│  ├─ favicon.svg               # Icono de pestaña
│  ├─ css/                      # Hojas de estilo
│  │  ├─ styles.css             # Sistema de diseño + secciones + responsive
│  │  └─ apuntes.css            # Estilos propios de las páginas de tema
│  └─ js/                       # Scripts del sitio
│     ├─ main.js                # Interacciones y animaciones globales
│     └─ hash.js                # Laboratorios interactivos del tema de hash
├─ latex/                       # Documento LaTeX de los apuntes (en elaboración)
└─ README.md
```

- **Raíz**: solo `index.html`, que es lo que sirve GitHub Pages al abrir el sitio.
- **`temas/`**: todas las páginas de tema; enlazan a `assets/` e `index.html` con el prefijo `../`.
- **`assets/`**: CSS, JavaScript e iconos compartidos; no contiene contenido de los apuntes.
- **`latex/`**: versión en LaTeX de los apuntes, independiente del sitio estático.

## Secciones

1. **Header** fijo, con navegación, scroll spy, botón de tema y menú hamburguesa en móvil.
2. **Hero** con blobs de arcilla animados, cadena de bloques ilustrada en 3D y etiquetas flotantes.
3. **Introducción rápida** con tarjetas de propuesta de valor y una barra de estadísticas animadas.
4. **Temario**: 12 módulos, de fundamentos a casos de uso, en tarjetas con inclinación 3D.
5. **Equipo**: 5 integrantes + tarjeta de invitación a colaborar.
6. **CTA** de descarga / repositorio.
7. **Footer** con navegación, recursos y redes.

## Animaciones (todas nativas)

| Efecto | Implementación |
| --- | --- |
| Entrada del hero en cascada | `@keyframes riseIn` con `--d` como retraso por elemento |
| Blobs orgánicos | `@keyframes morph` sobre `border-radius` + `drift` |
| Parallax de blobs | `IntersectionObserver` no; scroll + puntero vía `requestAnimationFrame` |
| Revelado al hacer scroll | `IntersectionObserver` que añade `.is-visible` |
| Contadores | `requestAnimationFrame` con easing `easeOutCubic` |
| Inclinación 3D de tarjetas | `mousemove` → `rotateX/rotateY` + foco de luz con `--mx` / `--my` |
| Barra de progreso de lectura | Ancho calculado sobre `scrollHeight` |
| Gradiente animado del título | `background-position` en bucle |

Todo respeta `prefers-reduced-motion: reduce`: las animaciones se desactivan y
los elementos se muestran en su estado final.

## Tema claro / oscuro

El botón del header alterna `data-theme` en `<html>` y guarda la preferencia en
`localStorage`. Por defecto sigue a `prefers-color-scheme` del sistema.

## Cómo verlo

Abre `index.html` directamente en el navegador, o sirve la carpeta:

```bash
python -m http.server 8000
# http://localhost:8000
```

## Qué personalizar

- **Nombres del equipo**: sección `#equipo` en `index.html` (iniciales del avatar,
  nombre, rol, bio, módulos a cargo y enlaces — hoy apuntan a `#`).
- **Cifras**: atributo `data-count` de cada `.stat__num`.
- **Temas**: cada `<article class="topic">` lleva su propio `--accent`.
- **Paleta**: variables `--violet`, `--mint`, `--coral`, `--amber`, `--sky` en
  el bloque `:root` de `styles.css`.
- **Enlaces reales**: los `href="#"` del CTA, del footer y de las redes.
