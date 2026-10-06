# Cómo se trabaja con este pipeline

## La idea
Claude Code es el productor-animador; tú eres el director. Tú das la marca, el tema y las correcciones. Claude propone, construye en After Effects por scripts, revisa con fotogramas y solo exporta cuando apruebas.

## Una pieza, de punta a punta
1. **"Este reel es para <MARCA>, sobre <servicio/tema>."** Claude lee `brand.md`, `historial.md` y `aprendizajes.md` del cliente (o lo crea desde la plantilla) y te recomienda qué modelo de Claude usar.
2. **Guion**: historia completa gancho (dolor) → situación → la marca lo resuelve → resultado → CTA con contacto real. Con 2 propuestas y ganchos alternativos. En modo lote no pide aprobación y elige.
3. **Materia prima**: primero busca en `_biblioteca/`; si falta un objeto o una toma, la genera (Nano Banana / Omni vía Flow, opcional) sobre fondo verde y la recorta.
4. **Armado en AE**: un `.jsx` re-ejecutable por pieza en `clientes/<CLIENTE>/05_proyectos-ae/scripts/`, corrido por el puente. Proyecto guardado como `<CLIENTE>_<slug>_vN.aep`.
5. **Revisión con fotogramas**: 0 / 0.5 / 1 s, el final de cada animación y cada transición, en hojas de contacto. Nada de renders intermedios.
6. **Correcciones**: tú dices qué no funciona; Claude corrige y anota lo recurrente en `aprendizajes.md` (y lo general en `CLAUDE.md`/skills).
7. **Música y sincronía**: pista con licencia, golpes analizados, viajes/cortes sobre el pulso.
8. **Export**: Media Encoder H.264, audio a -14 LUFS, en `06_exports/`. Se registra en `historial.md`.

## Frases útiles
- "Haz 3 reels de <MARCA> sobre 3 servicios distintos, cada uno con un estilo diferente, sin pedirme aprobar guiones."
- "Ponle música del disco y sincroniza los cortes con los golpes."
- "Exporta los 3 en Media Encoder."
- "Estas son referencias de cómo publica la marca, ajusta el estilo." (adjunta imágenes)
- "¿Qué modelo conviene para esto?"

## Lo que el sistema aprendió (y aplica siempre)
- El primer segundo manda: gancho + marca + héroe en 0–1 s.
- Se lee completo: 0.5 s + 0.35 s por palabra antes de mover nada.
- Una idea por escena; los gráficos ilustran la frase.
- Cero desenfoque en lo que se lee; pocos efectos; todo entra y sale con fundido.
- Solo colores de la marca; énfasis = píldora de color.
- AE primero; la IA generativa solo para lo que AE no logra.
- Reutilizar la biblioteca antes de gastar créditos.
- En lotes, variar el estilo de cada pieza.

## Hacerlo tuyo
- Agrega estilos a `_sistema/estilos/` y fórmulas de guion a `_sistema/guiones/` cuando algo funcione.
- Agrega clips y objetos genéricos a `_biblioteca/` con su ficha.
- Cambia las reglas de `CLAUDE.md` a tu gusto: Claude las sigue en cada sesión.
