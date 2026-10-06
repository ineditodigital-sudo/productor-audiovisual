# Productor audiovisual con IA — Claude Code × After Effects

Un espacio de trabajo listo para producir **reels y motion graphics por cliente** con [Claude Code](https://claude.com/claude-code) manejando **Adobe After Effects** directamente: Claude escribe el guion, arma las comps con ExtendScript, sincroniza la animación con la música, revisa con fotogramas y exporta con Media Encoder.

Lo que se comparte aquí no es solo código: es **una manera de trabajar** (reglas de copy, claridad y limpieza visual aprendidas en producción real) que Claude sigue en cada pieza.

## Qué incluye
| Parte | Dónde | Qué hace |
|---|---|---|
| Reglas del productor | `CLAUDE.md` | Arranque de sesión por cliente, pipeline, primer segundo, reglas de claridad, copy dolor → solución → CTA, revisión sin render |
| Skills | `.claude/skills/` | `motion-explainer` (flujo completo de una pieza), `reels-3d-parallax` (cámara en cadena de nulls, objetos 3D a distinta Z), `sincronia-musical` (golpes de la música → cortes/viajes, export Media Encoder, -14 LUFS) |
| Puente a After Effects | `mcp/ae-bridge/` + `.mcp.json` | Servidor MCP que ejecuta ExtendScript en el AE abierto (sin panel CEP). Se instala solo la primera vez |
| Herramientas | `_sistema/herramientas/` | Recorte de fondo chroma (con modo vidrio), halftone tipo collage, seguimiento de pantallas, análisis de golpes musicales, export a Media Encoder, normalización de audio, transcripción |
| Sistema reutilizable | `_sistema/` | Fórmulas de guion, presets de estilo, zonas seguras 9:16, notas técnicas de AE, guía de modelos y costos |
| Biblioteca | `_biblioteca/` | Fichas de clips y objetos 3D generados con IA (los archivos pesados están en Drive) |
| Plantilla de cliente | `clientes/_PLANTILLA/` | `brand.md`, `estilo.md`, `historial.md`, `aprendizajes.md` y carpetas por fase |
| Ejemplo real | `clientes/INEDITO/` | Marca, estilo, guiones y **3 motores .jsx** de reels (3D parallax claro, auditoría con laptops y pantallas seguidas, posicionamiento en IA) |
| Opcional | `extras/google-flow-mcp/` | Parche y runner por lotes para el MCP (no oficial) de Google Flow: imágenes Nano Banana y video Omni |

## Recursos pesados (Google Drive)
Clips de IA, objetos 3D recortados y los assets del ejemplo:
**https://drive.google.com/drive/folders/1ERIAAfrxXWBtJA7RgzycoNWjsO6zFxdT**
Cada ZIP trae las rutas del repo: descomprímelo en la raíz del repositorio.

## Inicio rápido
1. Requisitos: Windows, After Effects 2022–2026, Media Encoder, Node.js 18+, Python 3.10+ (`pip install numpy pillow scipy`), ffmpeg e ImageMagick en el PATH, y Claude Code.
2. `git clone https://github.com/ineditodigital-sudo/productor-audiovisual.git` y descarga los ZIP de Drive en la raíz.
3. En After Effects: *Edit > Preferences > Scripting & Expressions* → activar **Allow Scripts to Write Files and Access Network**.
4. Abre After Effects y luego Claude Code **en la carpeta del repo**. Aprueba el servidor MCP `ae-bridge` cuando lo pida.
5. Escribe: *"Este reel es para <TU MARCA>"*. Claude crea el cliente desde la plantilla y te guía.

Guía completa: [`docs/INSTALACION.md`](docs/INSTALACION.md) · Cómo se trabaja: [`docs/COMO-SE-TRABAJA.md`](docs/COMO-SE-TRABAJA.md)

## Qué NO incluye (y por qué)
- **Música, LUTs, transiciones y paquetes de terceros** (Motion Array, etc.): tienen licencia propia. `_biblioteca/06_musica/FICHAS.md` explica cómo agregar la tuya.
- **Fuentes comerciales** (Hanson, Gilroy, Bricolage…): instala las de tu marca; los scripts usan los nombres PostScript que pongas en la configuración.
- **Logos de terceros** (p. ej. de las IA): cada quien pone los suyos; los scripts los omiten si faltan.
- **Material de clientes reales** distintos al ejemplo.

## Licencia
Código y documentación bajo MIT (ver `LICENSE`). La identidad de Inédito incluida como ejemplo es solo de referencia. El MCP de Google Flow es un proyecto de terceros (MIT) y no oficial: úsalo bajo tu propio riesgo y respetando los términos de Google.
