# Pipeline de producción audiovisual con IA (After Effects + Claude Code)

Idioma de trabajo: español.
Objetivo: más videos por sesión, por cliente, con mayor calidad visual, automatizando lo repetible.

## Cómo arranca cada sesión
1. El usuario dice el cliente ("este reel es para <MARCA>").
2. Lee `clientes/<cliente>/brand.md`, `historial.md` y `aprendizajes.md` ANTES de proponer nada. No empezar de cero si ya hay historial.
3. Si el cliente no existe: copiar `clientes/_PLANTILLA` y rellenar `brand.md` con el usuario (sitio web, colores, fuentes, logo, tono, contacto real para el CTA).
3b. Los assets originales de cada cliente (logos, iconos, mascota, manual) los indica el usuario; copiar lo necesario a `clientes/<cliente>/03_assets/`.
4. Cada pieza nueva = carpeta `clientes/<cliente>/01_brief/<AAAA-MM-DD>_<slug>/` con `brief.md`, `guion.md`, `shotlist.md`.
5. Ejemplo completo de un cliente ya trabajado: `clientes/INEDITO/` (marca, estilo, aprendizajes, guiones y scripts de AE).

## Flujo, estilo y marca son independientes
- Flujo: skill `motion-explainer` (`.claude/skills/motion-explainer`). Modo guiado o lote.
- Reels con parallax 3D real (cámara en cadena de nulls, objetos recortados a distinta profundidad): skill `reels-3d-parallax`, con Nano Banana + recorte propio (`_sistema/herramientas/recorte-png.py`).
- Música y export: skill `sincronia-musical` (golpes de la pista → viajes/cortes sincronizados → Media Encoder → -14 LUFS).
- Estilo: presets en `_sistema/estilos/`; el cliente elige/sobrescribe en `clientes/<cliente>/estilo.md`.
- Guion: fórmulas en `_sistema/guiones/`.
- Marca: `clientes/<cliente>/brand.md`.
Nunca asumir un estilo, giro o formato único; los presets nuevos se agregan a `_sistema/estilos/` cuando un estilo funciona.

## Pipeline (fases; el usuario puede saltarse o reordenar)
1. **Idea y brief**: objetivo, plataforma/formato (9:16, 1:1, 16:9), duración, CTA, tono, referencias.
2. **Guion + shotlist**: plano por plano, duración, texto en pantalla, audio, origen del clip (grabado / cliente / IA).
3. **Prompts de generación (Google Flow, opcional)**: un prompt por plano IA, versionados (v1, v2...) con nota de qué se afinó. Bloque fijo de personaje/estilo/cámara reutilizado entre planos.
4. **Ingesta**: clips a `04_clips/`. Revisar resolución, fps, duración; renombrar `plano##_descripcion_vN`.
5. **Montaje en AE** (MCP `ae-bridge`): comp por formato, clips en orden de shotlist, cortes y viajes de cámara en los golpes de la música.
6. **Motion graphics**: titulares, kinetic type, transiciones, logo reveal, subtítulos.
7. **Revisión**: el usuario da correcciones; iterar. Preferencias recurrentes van a `aprendizajes.md`.
8. **Export**: Media Encoder (`_sistema/herramientas/exportar-ame.jsx`) a `06_exports/` como `<CLIENTE>_<slug>_<formato>_vN.mp4`; audio a -14 LUFS (`normalizar-audio.sh`).
9. **Cierre**: actualizar `historial.md` (qué se hizo, qué funcionó, qué prompts sirvieron).

## Máxima de diseño y animación (todas las piezas)
**El primer segundo es el más importante del video.** En 0–1 s debe estar lo que más impacta: llamar la atención, presentar la idea y la marca.
- Nada de frames vacíos ni entradas lentas al inicio: el frame 0 ya muestra algo fuerte (titular, héroe, color, luz).
- En el primer segundo aparecen: el gancho (titular/idea), la marca (logo o elemento reconocible) y un visual héroe con movimiento contundente.
- Revisar siempre el frame 0, 0.5 s y 1.0 s antes de dar una pieza por buena.

## Reglas de claridad (todas las piezas, todos los clientes)
1. **Tiempo de lectura.** Cada titular permanece 100 % visible al menos **0.5 s + 0.35 s por palabra** (mínimo 1.5 s; gancho ≥ 2.5 s). Nunca cambiar de escena ni animar encima mientras se lee. Si no cabe, alargar la escena o recortar el texto, no acelerar.
2. **Una idea por escena, imágenes claras.** Máximo 1 mensaje visual principal + titular + 1 línea de apoyo; ≤ 6 elementos de texto y ≤ 1 logo/ícono protagonista.
3. **Solo colores de la marca.** Únicamente la paleta de `brand.md`; variaciones solo por opacidad, mezcla o brillo, nunca tonos nuevos. Énfasis de una palabra = píldora de color de marca con texto contrastado.
4. **Líneas y conexiones limpias.** Layout ordenado; cada línea por la ruta más corta y lógica, sin cruces ni amontonamientos (≥ 40 px entre líneas), dibujadas de la fuente al destino. Más de 4 conexiones = replantear.
5. **Los gráficos ilustran la frase.** Cada escena muestra lo que dice el copy (una mini-interfaz, un dato, un antes/después), no solo un objeto "relacionado".

## Limpieza visual
- **Cero desenfoque en lo que se lee**: sin profundidad de campo, sin blur en entradas de texto, sin radial blur encima de titulares. El desenfoque solo se acepta en decorativos lejanos fuera de la lectura (y mejor ninguno).
- Pocos efectos: si un efecto no ayuda a entender, se quita. Sin Wave Warp ni deformaciones en fondos.
- **Nada aparece ni desaparece de golpe**: toda capa con entrada/salida lleva fundido (~0.5 s).
- En un lote de varias piezas para la misma marca, **variar el estilo de animación** (p. ej. parallax 3D / tipografía cinética / tomas reales con velo) para que no se vean iguales.

## Copy que vende (piezas comerciales)
- La pieza es una historia: **gancho (dolor) → situación → la marca lo resuelve → resultado → CTA**. Cada escena es una frase completa que se entiende sola; nada de palabras sueltas.
- Gancho = dolor concreto del cliente ligado a ventas/dinero, reconocible en 1 s.
- La marca es la solución, en primera persona plural ("conectamos, detectamos…").
- Cierre con **un solo CTA de contacto** y un dato real (WhatsApp/DM/web) tomado de los archivos del cliente y confirmado por el usuario.
- Fórmula completa: `_sistema/guiones/formula-dolor-solucion-cta.md`. Dejar 2–3 ganchos alternativos y sugerir el texto de la publicación.

## Reutilizar antes de crear (biblioteca)
- Antes de pedir un clip a Flow o construir algo desde cero, buscar en `_biblioteca/` (`CATALOGO.md` y las `FICHAS.md`).
- Reutilizar sin verse repetido: espejar, recolorear, re-encuadrar, cambiar velocidad/tramo y contenido de pantalla.
- Todo clip u objeto genérico nuevo se agrega a `_biblioteca/` con su ficha técnica.

## Modelo de Claude y créditos de Flow (en cada video)
- Al iniciar cada pieza, recomendar **qué modelo de Claude y qué esfuerzo** usar (Opus para inventar, Sonnet para repetir, Haiku para tareas mecánicas). Guía: `_sistema/modelos-y-costos.md`.
- Clips con el MCP `google-flow` (opcional): video **Omni 720p, 6 s** (máx. 10 s) y descarga en **1080p**; imágenes **Nano Banana Pro** (Nano Banana 2 para economizar). Cotizar con `dry_run`, fijar el look con imágenes primero, máximo 2 variantes por toma y reportar los créditos gastados.

## Revisión y render
- **No renderizar hasta que el usuario apruebe.** Revisar con frames sueltos (`saveFrameToPng`) y hojas de contacto; siempre incluir 0 / 0.5 / 1.0 s y cada transición.
- Render final en segundo plano (Media Encoder), sin cambiar la vista de AE del usuario (nada de `openInViewer`).
- Logo de la marca siempre con su color oficial: si hay degradados detrás, halo claro + saturación/contraste.

## Pantallas y dispositivos
- Contenido de pantallas (dashboards, apps) siempre en AE sobre el dispositivo con Corner Pin **seguido cuadro a cuadro** (`_sistema/herramientas/track-pantalla.py`), descontando el marco y con esquinas levemente redondeadas. Detalle en `_sistema/notas-ae-tecnicas.md`.

## Reglas de proyecto
- Cada proyecto AE se guarda dentro de la carpeta del cliente: `clientes/<CLIENTE>/05_proyectos-ae/<CLIENTE>_<slug>_vN.aep`.
- **Antes de cualquier `ae_ejecutar` con `undo`, configurar `ae_autoguardado` con la ruta del proyecto que está abierto**: el puente guarda en la última ruta configurada y puede sobrescribir otro proyecto.
- Guardar antes y después de cambios grandes; nunca sobrescribir una versión aprobada, usar `_vN`.
- Antes de acciones masivas en AE, listar comps/capas para verificar nombres.
- AE primero, Flow solo si hace falta: logo, texto, mascota, iconos, formas y fondos se animan en AE con los PNG/SVG del cliente. A Flow solo se le pide "materia prima" que AE no logra (líquidos, humo, objetos fotográficos, personas, planos cinematográficos), sin texto ni marca, y se estiliza en AE.
- Zonas seguras: todo contenido legible dentro de la caja segura de `_sistema/safe-zones/safe-zones.md` (9:16: margen sup. 220 px, inf. 420 px).
- Todo asset de marca (colores, fuentes, logos) sale de `brand.md`; no inventar.
- Al final de cada pieza sugerir: mejoras, assets que faltaron, plantillas reutilizables y 2–3 ideas de contenido derivadas.
- Lo repetible entre clientes va a `_sistema/`; lo específico, al cliente.

## Herramientas
- MCP `ae-bridge` (incluido en `mcp/ae-bridge`, se registra solo con `.mcp.json`): ejecuta ExtendScript en el After Effects abierto (`ae_ejecutar`, `ae_autoguardado`, `ae_guardar`, `ae_render`, `ae_inspeccionar`…). Windows. No necesita panel CEP.
- Herramientas en `_sistema/herramientas/`: `recorte-png.py` (quitar fondo chroma, `--vidrio` para cristal), `halftone-still.sh` / `halftone-cutout.ps1` (estilo collage), `track-pantalla.py` (seguir pantallas), `analizar-beats.py` (pulso de la música), `exportar-ame.jsx` (Media Encoder), `normalizar-audio.sh` (-14 LUFS), `transcribir.py` / `analizar.py` (locución).
- Opcional: MCP `google-flow` (no oficial) en `extras/google-flow-mcp/`.
- Detalles técnicos y trampas de ExtendScript: `_sistema/notas-ae-tecnicas.md`.
