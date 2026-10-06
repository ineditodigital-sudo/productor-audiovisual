# Fichas técnicas de clips reutilizables (generados en Flow)

Todos 1080×1920, 24 fps, 6 s, salvo que se indique. Los videos se descargan de la carpeta de Drive del proyecto (ver `docs/INSTALACION.md`); aquí quedan sus fichas. Antes de generar un clip nuevo en Flow, revisar si alguno de estos sirve (se pueden espejar, recolorear, re-encuadrar, acelerar o invertir en AE para que no se vean repetidos).

## dispositivos/
| Archivo | Qué es | Datos para AE |
|---|---|---|
| `laptop-plata_34-izq_pantalla-negra_verde.mp4` | Laptop plateada sin logo, vista 3/4 desde la izquierda, entra desde abajo y se asienta | Verde RGB (40,165,66). Se asienta ≈2.95 s pero **sigue girando** (~28 px en 3 s): usar seguimiento `track_pantallas_laptops.jsx` clave `lap34`. Caja del objeto x80–1017 y802–1445. Marco pantalla: lateral 2.4 %, sup. 4.2 %, inf. 3.2 % |
| `laptop-plata_frontal_pantalla-negra_verde.mp4` | Laptop plateada frontal, sube y se asienta | Verde RGB (22,201,43). Quieta desde ≈3.2 s; clave `lapFr`. Caja x84–991 y662–1281. Marco: lateral 2 %, sup. 3.6 %, inf. 3.8 % |
| `_sistema/herramientas/track_pantallas_laptops.jsx` | Esquinas de pantalla por tiempo (ambas laptops) | `$.evalFile` → `TRACK.lap34` / `TRACK.lapFr` (ver `clientes/INEDITO/05_proyectos-ae/scripts/build_reel_auditoria.jsx`, funciones `laptopRig` / `placeRig`) |

## objetos/
| Archivo | Qué es | Datos para AE |
|---|---|---|
| `lupa-3d-azul-marino_flotando_verde.mp4` | Lupa 3D brillante (aro y mango azul marino, lente transparente), entra desde la derecha y flota | Verde RGB (25,180,46) arriba → (90,205,96) abajo (degradado: subir tolerancia). Aro centro ≈(495,795), diámetro ≈480 px. Teñible con Hue/Saturation (Inédito: +38° → violeta) |
| `megafono-blanco_entra-vibra_verde.mp4` | Megáfono real blanco/gris, entra desde la izquierda, vibra con trazos de sonido, hold | Verde uniforme RGB (25,189,46) → Keylight limpio. Megáfono centro ≈(490,935) |
| `megafono-halftone-borde-crema_secuencia-alpha/` | El mismo megáfono ya convertido a halftone B/N con borde crema (estilo collage) | Secuencia PNG con alpha, 143 cuadros, 24 fps. Hecha con `_sistema/herramientas/halftone-cutout.ps1` |

## liquidos-particulas/
| Archivo | Qué es | Datos para AE |
|---|---|---|
| `tinta-blanca-salpica-llena-cuadro_negro_MATTE.mp4` | Salpicadura de tinta blanca sobre negro que crece hasta llenar el cuadro | Usar como **luma matte** de transición; acelerar ×4 (`stretch 25`) y cerrar con capa blanca al final. Teñible con Fill/Tint |

## Cómo no verse repetido al reutilizar
- Espejar (escala X −100), rotar unos grados, cambiar el encuadre o la escala.
- Recolorear (Hue/Saturation, Tint, LUTs de `03_luts/`).
- Cambiar velocidad o usar otro tramo del clip (time remap).
- Cambiar el contenido de pantalla, el fondo y la iluminación (glows) según la marca.
| `toma_aburrida.mp4` | Mujer en sofá haciendo scroll aburrida (Omni 720p 6 s, 9:16, realista) | Sin key. Uso: dolor "nadie se detiene" con velo oscuro + texto |
| `toma_scroll.mp4` | Pulgar haciendo scroll rápido en un feed (Omni 720p 6 s) | Ojo: aparece la palabra "Instagram" arriba del teléfono |
| `toma_produccion.mp4` | Sesión de foto de producto (tenis blanco) en estudio (Omni 720p 6 s) | Producción de contenido |
| `toma_detiene.mp4` | Hombre en café deja de hacer scroll y sonríe (Omni 720p 6 s) | Resultado "detiene el scroll" |
