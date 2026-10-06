# Instalación

## 1. Programas
| Programa | Para qué | Cómo |
|---|---|---|
| Adobe After Effects 2022–2026 + Media Encoder | Armado y export | Creative Cloud |
| Claude Code | El agente | https://claude.com/claude-code (terminal, app de escritorio o VS Code) |
| Node.js 18+ | Puente MCP con AE | `winget install OpenJS.NodeJS.LTS` |
| Python 3.10+ | Herramientas | `winget install Python.Python.3.12` y luego `pip install numpy pillow scipy` (`pip install faster-whisper` para transcribir) |
| ffmpeg | Audio, análisis, normalización | `winget install Gyan.FFmpeg` |
| ImageMagick 7 | Halftone, hojas de contacto, SVG → PNG | `winget install ImageMagick.ImageMagick` |
| Git Bash | Scripts `.sh` | Viene con Git for Windows |

> El puente `ae-bridge` usa `AfterFX.com -r` y por ahora funciona **solo en Windows**. Si AE está en una ruta no estándar, define la variable `AE_DIR` con la carpeta `Support Files` (o `AE_EXE` con el ejecutable).

## 2. Repositorio y recursos
```bash
git clone https://github.com/ineditodigital-sudo/productor-audiovisual.git
```
Descarga de la carpeta de Drive (https://drive.google.com/drive/folders/1ERIAAfrxXWBtJA7RgzycoNWjsO6zFxdT) los ZIP que necesites y **descomprímelos en la raíz del repo** (ya traen las rutas `_biblioteca/...` y `clientes/INEDITO/...`):
- `biblioteca_objetos-3d.zip` — objetos 3D recortados (cursor, lupa con cristal, burbuja, número 1, papel, 12 emojis 3D y laptop con pantalla para Corner Pin).
- `biblioteca_clips-dispositivos-objetos.zip` — laptops con pantalla negra sobre verde (para reemplazo de pantalla), lupa y megáfono sobre verde, tinta para transición matte.
- `biblioteca_megafono-halftone-secuencia.zip` — megáfono en halftone con alpha (secuencia PNG).
- `biblioteca_clips-tomas-reales.zip` — 4 tomas realistas 9:16 (scroll aburrido, scroll rápido, producción de contenido, alguien que se detiene).
- `ejemplo_inedito_assets.zip` — objetos, logos y clips para correr los 3 reels de ejemplo.
- `ejemplo_inedito_referencias-y-decorativos.zip` — carrusel de referencia, manual de identidad y formas decorativas de la marca de ejemplo.
- `ejemplo_inedito_originales-nano-banana.zip` — imágenes originales sobre verde (antes del recorte) + el JSON de prompts: muestra el proceso completo de generar → recortar.

## 3. After Effects
- *Edit > Preferences > Scripting & Expressions*: activar **Allow Scripts to Write Files and Access Network**.
- Deja AE abierto con un proyecto (puede ser nuevo) antes de pedirle algo a Claude.

## 4. Claude Code
Abre Claude Code en la carpeta del repo. La primera vez:
- Aprueba el servidor MCP del proyecto `ae-bridge` (está en `.mcp.json`). Al arrancar instala sus dependencias solo (tarda 1–3 min la primera vez).
- Prueba: *"revisa el estado de After Effects"* → debe responder con la versión y el proyecto abierto.

## 5. Probar con el ejemplo
Con los assets del ejemplo descomprimidos, pide: *"Corre el reel 3D de Inédito (`clientes/INEDITO/05_proyectos-ae/scripts/build_reel_web3d_claro.jsx`) y muéstrame frames de 0, 0.5 y 1 s"*.
Si faltan fuentes (Hanson, Gilroy), AE usará una de reemplazo; cambia los nombres en el bloque `F = {...}` del script por fuentes que tengas.
Sin música ni fondo topográfico el script usa reemplazos (sólido claro, sin audio): agrega los tuyos en `_biblioteca/04_fondos-loops/` y `_biblioteca/06_musica/`.

## 6. Tu primer cliente
Escribe *"Este reel es para <MARCA>, su web es <url>"*. Claude copia `clientes/_PLANTILLA`, investiga la marca, te pregunta solo lo que falte (colores, fuentes, contacto del CTA) y propone guion + estilo.

## 7. Opcional: Google Flow (imágenes Nano Banana y video Omni)
Ver `extras/google-flow-mcp/README.md`. Sin Flow, todo lo demás funciona: los objetos se pueden generar en cualquier herramienta (fondo verde plano) y recortar con `_sistema/herramientas/recorte-png.py`.
