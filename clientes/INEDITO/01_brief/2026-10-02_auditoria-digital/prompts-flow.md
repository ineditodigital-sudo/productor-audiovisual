# Prompts Flow (Omni) — Reel "Auditoría Digital" (Inédito) — v1

Regla: Flow solo genera **materia prima fotorrealista** (laptop, lupa 3D). Pantallas, dashboards, tarjetas, texto, logo y transiciones se animan en AE.
- **Pantalla de la laptop: NEGRA/apagada.** El dashboard (Auditoría Digital, gráficas, %) lo pongo yo en AE encima con corner pin, con texto real y controlable.
- **Fondo verde chroma plano** para recortar limpio (funciona perfecto para el key).
- Que cada clip **termine quieto 2–3 s** (cámara fija): ahí monto la pantalla.
- 9:16, 6–8 s, 2 variantes de cada uno. Guardar en `clientes/INEDITO/04_clips/generados-ia/`.

## Bloque fijo (pegar al final de cada prompt)
```
Photorealistic premium tech product shot, vertical 9:16. Perfectly flat, uniform, saturated chroma-key green background (#00FF00), even lighting across the whole background, no shadows or reflections on the background, no gradient, no vignette. Soft violet (#6A1FDC) rim light on the object's edges, clean modern studio look, sharp edges, no green spill on the object. Locked-off camera. No text, no logos, no user interface, no watermark, no people, no hands.
```

## Clip 1 — Laptop 3/4 (escenas CONECTA y CONVIERTE; en AE también se espeja)
```
A modern slim silver aluminium laptop with no brand logo, lid open at about 110 degrees, the screen completely black and glossy (turned off). Three-quarter hero view from the front-left, slightly from above. The laptop glides up into frame from the bottom with a smooth 25-degree rotation, eases out with a gentle overshoot and settles in the lower centre of the frame, then holds perfectly still for the last 3 seconds. [bloque fijo]
```
Nombre: `plano01_laptop-34_v1.mp4`

## Clip 2 — Laptop frontal (escenas DETECTA y PRIORIZA)
```
A modern slim silver aluminium laptop with no brand logo, lid open at about 105 degrees, the screen completely black and glossy (turned off). Straight front view, camera slightly above, the laptop centred. It rises smoothly into frame from below with a soft ease-out and a tiny settle, then holds perfectly still for the last 3 seconds. [bloque fijo]
```
Nombre: `plano02_laptop-frontal_v1.mp4`

## Clip 3 — Lupa 3D violeta (escena DETECTA)
```
A glossy 3D magnifying glass with a violet (#6A1FDC) rim and handle and a clear glass lens, premium soft studio lighting with subtle reflections. It flies in from the right with a smooth rotation, settles tilted at about 35 degrees, then floats very gently in place. [bloque fijo]
```
Nombre: `plano03_lupa-violeta_v1.mp4`

## Clip 4 (opcional) — Destellos de luz para transiciones
Se usa en AE en modo Screen sobre los cortes.
```
Pure black background. Fast diagonal streaks of soft white and violet (#6A1FDC) light sweep across the frame from bottom-left to top-right, like a premium light leak, with subtle glow and motion blur, then fade to black. Vertical 9:16, locked-off camera. No text, no logos, no objects.
```
Nombre: `plano04_destellos_v1.mp4`

## Iteración
Anotar aquí qué variante funcionó y por qué.
