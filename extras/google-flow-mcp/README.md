# Google Flow (opcional, no oficial)

Integración con [Google Flow](https://labs.google/flow) para generar **imágenes con Nano Banana** y **video con Omni** desde Claude Code. Usa el MCP de la comunidad **[RohaanA/google-flow-mcp](https://github.com/RohaanA/google-flow-mcp)** (MIT), que maneja Flow a través de un navegador con tu sesión iniciada.

> ⚠️ **No es una API oficial de Google.** Automatiza la interfaz web: puede dejar de funcionar si Flow cambia, y su uso puede no estar permitido por los términos del servicio. Gasta tus créditos de Flow. Úsalo bajo tu propio riesgo. El resto del pipeline funciona sin esto.

## Qué agrega este parche
`parche-productor.patch` (sobre el commit `a357dc3` del repo original):
- Abre Flow siempre en inglés (`?hl=en`, locale `en-US`) para que los selectores funcionen aunque tu cuenta esté en español.
- Arregla la detección del modelo "ya seleccionado" en el menú.
- Reabre el menú de ajustes antes de cada clic (resolución, duración, cantidad) y antes de leer la cotización.
- `generateImages` acepta el parámetro `model` (Nano Banana Pro / Nano Banana 2).

Y dos scripts:
- `imagenes.mjs` — lote de imágenes o videos desde un JSON, usando el código parcheado sin reiniciar el servidor MCP.
- `bajar.mjs` — descarga medios por ID.

## Instalación
```bash
git clone https://github.com/RohaanA/google-flow-mcp.git
```
```bash
cd google-flow-mcp && git checkout a357dc3 && git apply ../productor-audiovisual/extras/google-flow-mcp/parche-productor.patch
```
```bash
npm install && npm run build
```
Copia `imagenes.mjs` y `bajar.mjs` a la carpeta `google-flow-mcp`. Registra el servidor en Claude Code siguiendo el README del repo original e inicia sesión en Flow en el navegador que abre la primera vez.

## Lotes con el runner
`trabajos.json`:
```json
{ "project": "<id-de-tu-proyecto-en-flow>",
  "jobs": [
    { "name": "lupa", "prompt": "A single complete 3D magnifying glass ... isolated on a perfectly flat uniform pure chroma green (#00FF00) background", "aspect": "1:1", "model": "keep" },
    { "name": "toma_scroll", "type": "video", "prompt": "Vertical 9:16 realistic close-up of a thumb scrolling a phone feed ...", "aspect": "9:16" }
  ] }
```
```bash
node imagenes.mjs trabajos.json salida/
```
- Cierra antes cualquier Chrome abierto con el perfil del MCP (bloquea el perfil).
- `"model": "keep"` usa el modelo que ya esté elegido en Flow (evita un fallo del selector).
- Videos: modelo Omni 6 s (`abra_t2v_6s`), `count: 1`, tope de 12 créditos por toma (`maxCredits`).
- El servidor MCP solo carga el código reconstruido en una sesión nueva de Claude Code; el runner lo usa de inmediato.

Estándar sugerido: video **Omni 720p, 6 s** y descarga en 1080p; imágenes **Nano Banana Pro** (Nano Banana 2 para economizar). Cotizar con `dry_run` antes de generar.
