# Zonas seguras (la UI de la red no debe tapar el contenido)

Regla general para toda pieza vertical (Reels, TikTok, Shorts, Stories). Referencia: `reels-9x16_referencia.png`.

## 9:16 — 1080×1920 (Instagram Reels)
| Zona | Valor |
|------|-------|
| Margen superior | 220 px (título "Reels" y cámara) |
| Margen inferior | 420 px (usuario, descripción, hashtags, audio, barra de navegación) |
| Altura segura | 1280 px (y = 220 → 1500) |
| Ancho seguro | 1010 px, centrado (x = 35 → 1045) |

Caja segura en AE: posición (35, 220), tamaño 1010×1280, centro (540, 860).

## Reglas de uso
- **Todo lo que se lee** (texto, logo, CTA, handle, caras, producto) va dentro de la caja segura.
- **Fondos y color pueden sangrar** a pantalla completa; solo el contenido relevante se respeta.
- Criterio propio, más estricto para texto: la columna de iconos (like, comentar, compartir) se mete en la zona segura abajo a la derecha (y > ~1375). Para texto y logos dejar además ~90 px de margen lateral (x = 90 → 990) y evitar la esquina inferior derecha hasta y = 1500.
- Elementos de marca fijos (logo, handle) se ubican dentro de la caja, no pegados al borde de la pieza original (p. ej. un post 4:5 llevado a reel necesita reubicar handle y logo).
- Cada comp vertical lleva la capa guía `SAFE_ZONE` (guide layer: no se renderiza).

## Otros formatos
- 1:1 y 16:9: margen de acción 5 % y de título 10 % del lado. Confirmar y completar aquí cuando se usen.
- TikTok y Shorts tienen UI distinta (más alta en la parte inferior y lateral derecha); la caja de arriba es válida para ambos de forma conservadora. Añadir mediciones propias cuando se tengan.
