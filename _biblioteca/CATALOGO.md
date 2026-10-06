# Biblioteca de assets reutilizables

**Regla:** antes de generar en Flow o construir algo desde cero, buscar aquí. Reutilizar entre clientes ahorra créditos y tiempo; para no verse repetido, adaptar color, encuadre, velocidad, espejado y contenido a cada marca.

Los archivos pesados no van en Git: se descargan de la carpeta de Drive del proyecto (ver `docs/INSTALACION.md`) y se descomprimen en la raíz del repo. Aquí quedan las fichas.

| Carpeta | Contenido | Ficha |
|---|---|---|
| `01_clips-ia/` | Clips generados con IA (Flow/Omni): laptops con pantalla negra sobre verde (con seguimiento de pantalla), lupa y megáfono sobre verde, megáfono halftone con alpha, tinta para transición matte, 4 tomas realistas 9:16 | `01_clips-ia/FICHAS.md` |
| `10_objetos-3d/` | Objetos 3D recortados (PNG con alpha) para parallax: cursor, burbuja de chat, número 1, lupa con cristal, papel arrugado y 12 objetos estilo emoji (incluida una laptop con pantalla para Corner Pin) | `10_objetos-3d/FICHAS.md` |
| `04_fondos-loops/` | **Vacía**: pon aquí tus fondos en loop (p. ej. `fondo ondas topo.mp4`, que usa el reel 3D de ejemplo) | — |
| `06_musica/` | **Vacía**: pon aquí música con licencia y anótala en la ficha (pulso con `analizar-beats.py`) | `06_musica/FICHAS.md` |

Sugerencias para crecerla: `02_transiciones/` (proyectos + SFX), `03_luts/`, `05_mockups/`, `08_iconos-graficos/`, `09_tomas-propias/`, y catálogos CSV de los paquetes que tengas en disco (ruta, categoría, vista previa) para que Claude los encuentre sin copiarlos.

## Mantener la biblioteca
- Cada clip u objeto genérico nuevo (sin marca) se copia aquí con su ficha: color de key, caja del objeto, segundo en que se asienta, seguimiento, prompt.
- Cada efecto/transición/script que funcione en una pieza y sea reutilizable va a `_sistema/` o aquí.
