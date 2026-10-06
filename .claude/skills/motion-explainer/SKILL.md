---
name: motion-explainer
description: Produce un video corto de motion graphics (explainer, reel, promo) para cualquier cliente y giro, con estilo intercambiable. Úsala cuando el usuario diga "crea un reel/explainer/motion para <cliente>", pida ideas, guion, prompts de imagen/video, o armar escenas en After Effects.
---

# Motion Explainer: flujo único, estilo y marca intercambiables

El flujo es siempre el mismo. Lo que cambia viene de archivos:

| Qué | De dónde sale |
|---|---|
| Marca (colores, fuentes, logo, tono, prohibiciones) | `clientes/<cliente>/brand.md` |
| Estilo visual y de movimiento | `clientes/<cliente>/estilo.md` → apunta a un preset en `_sistema/estilos/` y puede sobrescribirlo |
| Fórmula de guion | `_sistema/guiones/` (elegir una o crear otra) |
| Historial y preferencias | `clientes/<cliente>/historial.md` y `aprendizajes.md` |

Nunca hardcodear nicho, estilo, formato ni duración. Si falta un dato, usar el valor por defecto del preset y decirlo.

## Parámetros (preguntar solo lo que falte)
cliente · idea/tema · formato (9:16 | 1:1 | 16:9) · duración total · voz (con locución | solo texto+SFX) · estilo (preset o custom) · modo (guiado | lote) · generadores disponibles (imagen, video).

## Modos
- **Guiado**: una etapa a la vez, esperar respuesta del usuario entre etapas.
- **Lote**: correr todas las etapas con defaults y entregar paquete completo para revisión. Si hay varios temas, repetir por tema.

## Etapas
1. **Ideas**: 5 ángulos de tema, adaptados al giro y objetivo del cliente (no genéricos). Leer historial para no repetir.
2. **Guion**: aplicar la fórmula elegida de `_sistema/guiones/`. Con locución: texto hablado. Sin locución: texto en pantalla por escena. Respetar tono de `brand.md`.
3. **Estilo bloqueado**: leer `estilo.md`; si no existe, proponer 3 opciones (preset ya existente, variación, nuevo) y bloquear la elegida. Guardar la decisión en `estilo.md`.
4. **Escenas**: dividir el guion en escenas. Duración por escena = derivada del audio/ritmo del guion (con locución usar `_sistema/herramientas/transcribir.py` para tiempos). Sin audio: 3–6 s por defecto. Tabla: id, línea, duración, héroe, texto en pantalla, origen (IA imagen / IA video / grabado / vector AE).
5. **Prompts de héroes**: para cada escena que use objeto IA, un prompt de imagen autocontenido, objeto aislado sobre fondo liso (para recorte), con el bloque de estilo fijo del preset. NO pedir a la IA texto tipográfico ni el fondo/grid: eso se construye en AE. Para planos de video IA (Omni/Flow) usar el bloque de personaje/estilo/cámara fijo del cliente y versionar (v1, v2...).
6. **Spec de movimiento por escena**: escalar la línea de tiempo del preset a la duración de la escena (proporciones, no segundos fijos): fondo limpio → entrada → micro-movimiento/hold → salida. Indicar easing, overshoot, capas, SFX.
7. **Build en AE** (MCP): comp por formato, plantilla de escena de `_sistema/plantillas-ae`, sustituir héroe y texto, aplicar spec, montar secuencia con transiciones. Listar comps/capas antes de modificar. Guardar `.aep` versionado SIEMPRE en `clientes/<cliente>/05_proyectos-ae/` (configurar primero `ae_autoguardado` con esa ruta).
8. **Revisión → Export**: aplicar correcciones, exportar a `06_exports` con nombre `<cliente>_<slug>_<formato>_vN`.
9. **Cierre**: actualizar `historial.md` y `aprendizajes.md`; proponer mejoras, assets faltantes, qué extraer a `_sistema/` y 2–3 piezas derivadas.

## Salidas por pieza (en `clientes/<cliente>/01_brief/<fecha>_<slug>/`)
`brief.md` · `guion.md` · `escenas.md` (tabla) · `prompts-heroes.md` · `spec-movimiento.md`

## Máxima: el primer segundo
El primer segundo es el que más impacta: en 0–1 s deben estar el gancho/idea, la marca y un visual héroe con movimiento contundente. Frame 0 nunca vacío. Al revisar, sacar siempre frames en 0, 0.5 y 1.0 s.

## Reglas de claridad (obligatorias)
Seguir las 4 reglas de `CLAUDE.md` > "Reglas de claridad": (1) tiempo de lectura ≥ 0.5 s + 0.35 s/palabra, (2) una idea por escena con imágenes claras y poco texto, (3) solo colores de la marca, (4) líneas y conexiones limpias, sin cruces. Verificar con frames al final de cada animación de texto (que quede ≥ el tiempo de lectura antes del corte).

## Lo aprendido (Inédito, 2026-10-02)
- Piezas comerciales: usar `_sistema/guiones/formula-dolor-solucion-cta.md` (dolor de ventas en 1 s → marca en "nosotros" → beneficio → CTA de contacto real).
- Dispositivos con pantalla: Flow con pantalla negra + verde; contenido en AE con Corner Pin seguido (`_sistema/herramientas/track-pantalla.py`), área activa sin marco, esquinas redondeadas.
- Objetos de Flow que deben verse como recorte de marca: `_sistema/herramientas/halftone-cutout.ps1`.
- Revisar con frames, no renderizar hasta aprobación; técnica completa en `_sistema/notas-ae-tecnicas.md`.

## Reglas
- **AE primero, Flow solo si hace falta.** Todo lo gráfico y de marca (logo, texto, mascota, iconos, formas, ondas, fondos de color, PNG/SVG del cliente) se anima en AE/Remotion: más control, cero regeneraciones. Pregunta de decisión antes de pedir un clip a Flow: "¿puedo lograrlo con assets del cliente + keyframes/expresiones/efectos?" Si sí, va en AE. Flow se reserva para materia prima que AE no logra bien: física realista (tinta, humo, fuego, líquidos, telas), objetos fotográficos/3D, personas, planos cinematográficos, texturas orgánicas. Los clips de Flow se piden como "materia prima" (fondo liso, sin texto/logo/mascota) y se estilizan en AE (key, halftone, color, matte).
- Zonas seguras: respetar `_sistema/safe-zones/safe-zones.md` en todo contenido legible; crear la capa guía `SAFE_ZONE` en cada comp vertical; en la spec de movimiento y en los prompts dejar libres esas franjas.
- Coherencia: el mismo bloque de estilo en todos los prompts de una pieza.
- Máximo un héroe principal por escena salvo que el preset diga otra cosa.
- Si el usuario corrige algo recurrente, registrarlo en `aprendizajes.md` del cliente.
