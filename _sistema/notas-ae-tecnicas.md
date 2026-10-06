# Notas técnicas AE + herramientas (aprendidas en producción)

## After Effects 2024 (24.5) vía ae-bridge
- `ae_ejecutar` corre ExtendScript ES3. Con `undo` guarda automático; usar `guardar:false` si el bridge apunta a otro proyecto. Antes de empezar: `ae_autoguardado` con la ruta `clientes/<CLIENTE>/05_proyectos-ae/<...>.aep`.
- UI en español: los nombres de efectos/plantillas vienen traducidos; usar **matchNames** (`ADBE ...`) y buscar plantillas por fragmentos (los acentos fallan en `plantilla_salida` de `ae_render`).
- **SVG no se importa** en AE 2024 → rasterizar con ImageMagick: `magick -background none -density 1200 in.svg -resize 2400x out.png`.
- **No existe Color Halftone** → `_sistema/herramientas/halftone-cutout.ps1` (ffmpeg chromakey + ImageMagick ordered-dither + borde crema) genera secuencia PNG con alpha.
- Keylight: `Keylight 906`; Screen Colour = `Keylight 906-0004`. Muestrear el verde del clip antes (esquinas) y pegarlo.
- Frames de control: `comp.saveFrameToPng(t, File)` y leerlos para verificar visualmente.
- Track matte: `layer.setTrackMatte(matteLayer, TrackMatteType.LUMA)`; el matte debe estar justo encima. Para reutilizar un matte, precomponer (`INK_MATTE`) y usarlo 2 veces con desfase.
- Render: estado `3019` = completado. Plantillas en español: "Sin pérdida" (AVI enorme, 2 GB/15 s) y las H.264 de la cola (el nombre con acentos/NBSP falla al pasarlo a `ae_render`; asignarlas por índice con `applyTemplate` dentro de `ae_ejecutar`). Alternativa fiable: render "Sin pérdida" + `ffmpeg -c:v libx264 -crf 15 -pix_fmt yuv420p -movflags +faststart`.
- Secuencia PNG: `ImportOptions.sequence=true`, `mainSource.conformFrameRate=24`.

- **Fuentes**: el nombre PostScript no siempre es el del archivo. Verificar con `textDocument.fontLocation` (si devuelve `times.ttf`, no se encontró). Hanson = `HansonBold`; Gilroy = `Gilroy-Medium`, `Gilroy-SemiBold`, `Gilroy-Bold`, `Gilroy-ExtraBold`; Bricolage = `BricolageGrotesque-ExtraBold`.
- **Shape layers**: el PRIMER grupo de Contents se dibuja ENCIMA (addProperty agrega abajo). Crear primero lo que va arriba (palomita antes que el círculo, arco antes que la pista).
- **Referencias inválidas** ("El objeto no es válido"): tras `addProperty` de un grupo hermano, las referencias a grupos anteriores mueren. Terminar de configurar un grupo antes de crear el siguiente.
- **Brillos**: un Gaussian Blur sobre una shape se recorta en la caja de la shape (se ve un rectángulo). Usar sólido + máscara elíptica con calado grande.
- **Rotación de capa 2D**: matchName `ADBE Rotate Z` (no `ADBE Rotation`).
- Scripts largos: escribirlos como `.jsx` re-ejecutable (borra lo que creó y lo rehace) y correrlos con `$.evalFile` dentro de `ae_ejecutar` + `try/catch` para obtener el error y la línea.
- Si `ae_ejecutar` responde "Respuesta ilegible", revisar el estado (a veces el render/acción sí se completó) y devolver solo ASCII.

## Reemplazo de pantallas (laptop / celular de Flow) — aprendido en Inédito
1. Pedir a Flow el dispositivo con **pantalla negra apagada** sobre **verde chroma** y que termine quieto 2–3 s.
2. Medir la pantalla con análisis de frames (área negra conectada a una semilla) — nunca a ojo.
3. **Los clips nunca quedan 100 % quietos** (la laptop en ángulo derivaba 28 px): seguir las esquinas cada 1/8 s con `_sistema/herramientas/track-pantalla.py` y animar el Corner Pin con esos datos (suavizado polinomial).
4. El área negra incluye el **marco**: el contenido va en el área activa descontando marco lateral/superior/inferior **en el espacio de la pantalla** (`quadPoint(q,u,v)`), no encogiendo hacia el centro (rompe la perspectiva). Valores usados: lateral 2–2.4 %, superior 3.6–4.2 %, inferior 3.2–3.8 %.
5. Esquinas: máscara de rectángulo redondeado en la capa de la pantalla (radio ~18 px en 1280×800) — las máscaras se aplican antes del Corner Pin.
6. Realismo: copia del clip encima en modo Screen al 20 % enmascarada a la pantalla (reflejo del cristal, también con la máscara seguida). Glow suave en la UI.
7. Entrada: time remap reutilizando los keys por defecto (`setValueAtTime`), acelerar la entrada del clip hasta que se asiente (~0.95 s) y luego 1:1. Para el gancho: "instantáneo" (arranca ya asentado).
8. Key: Keylight con Screen Colour muestreado, clip black 30 / white 85, shrink −1.5, Simple Choker 1.2 y desaturar los objetos plateados para matar el borde verde. **Revisar bordes en la comp final**, no en la comp del rig (su fondo verde de trabajo engaña).
9. UI de la pantalla: fondo un poco más oscuro (`#EAE8F6`) que las tarjetas blancas para que se lean.

## Look y transiciones
- Brillos/niebla: sólidos grandes (3000×3600) + máscara elíptica muy calada; si el sólido es del tamaño del cuadro y se mueve, se le ven los bordes.
- Transiciones suaves: la escena sale (fundido + desenfoque + escala 106 %) y **luego** entra la siguiente (desenfoque → foco, escala 94→100 %), con solape de 0.4 s y un barrido de luz en modo Add. Nada de barridos de color sólido que tapen todo.
- Logo sobre degradados: halo claro detrás (sólido calado) + saturación/contraste para conservar el color oficial (tomarlo del SVG; Inédito = `#7800CF`).

## Entorno (Windows / Git Bash)
- La herramienta Bash colapsa `\\` en `\` dentro de heredocs: en Python usar `chr(92)` o escribir el texto con caracteres UTF-8 literales; en ExtendScript los `.jsx` en UTF-8 con acentos literales funcionan.
- `cat > archivo` sin heredoc deja el comando esperando stdin: siempre `<<'EOF'` o `< /dev/null`.
- Al reemplazar texto en scripts largos, parchear por línea/ancla única y verificar con `grep` que se aplicó.
- ae-bridge tiene guardia de foco (devuelve el foco a la ventana del usuario tras cada orden); desactivar con `AE_BRIDGE_FOCO=0`.

## Flujo de clips Flow como materia prima
- Fondo chroma verde plano (resultó `#19BD2E`) → key limpio. Objetos claros: nunca sobre blanco/gris claro.
- Tinta blanca sobre negro → luma matte de transición (acelerar 4x con `layer.stretch=25`, cerrar con capa blanca que sube a 100 %).
