---
name: sincronia-musical
description: Elige música de fondo, encuentra sus golpes reales y sincroniza los viajes de cámara, cortes y transiciones de un reel de After Effects a esos golpes; después exporta con Media Encoder y normaliza el audio a -14 LUFS. Úsala cuando el usuario pida "ponle música", "sincroniza con la música / con los beats", "que los cortes caigan en el golpe" o "exporta en Media Encoder".
---

# Sincronía musical + export

## 1. Elegir la pista
- Buscar primero en `_biblioteca/06_musica/FICHAS.md` y en las carpetas de música del usuario (mp3/wav/mp4). Una pista distinta por pieza del mismo lote.
- Licencia: confirmar que el usuario puede usarla comercialmente (bibliotecas con suscripción, música propia, libre de regalías con licencia clara). Las descargas de YouTube "no copyright" se marcan como **sin verificar** y se avisa.
- Si viene en un formato raro (AAC dentro de .mp3, nombre con apóstrofo), convertir antes: `ffmpeg -i entrada pista.wav`. AE no importa AAC disfrazado de mp3.
- Recortar al largo del reel + 1–2 s, con fade de salida (`afade=t=out`). Guardar en `_biblioteca/06_musica/` con su ficha (pulso, primer golpe, uso).

## 2. Encontrar el pulso
`python _sistema/herramientas/analizar-beats.py pista.wav --json pista_beats.json`
- Da `BP` (periodo del golpe, s), `B0` (primer golpe, s) y los bpm. Los múltiplos del tempo (mitad/doble) puntúan parecido: si el pulso reportado suena lento, usar `BP/2` (el script lo sugiere).
- Revisar dónde "pega" la pista (golpes fuertes): las transiciones importantes van ahí; si la intro es suave, que el gancho no dependa del golpe.

## 3. Sincronizar en el script del reel
```js
var BP = 0.5, B0 = 0.23, MOFF = 0.35;   // MOFF = segundo del reel en que arranca la pista
function beatAt(t) { var k = Math.ceil((t - MOFF - B0) / BP - 1e-6); return B0 + MOFF + k * BP; }
```
- **Parallax 3D**: cada viaje de cámara empieza en `beatAt(fin_de_lectura - 0.1)` y dura un múltiplo del pulso (`MD = 3 * BP`) para llegar también sobre un golpe. Ver `clientes/INEDITO/05_proyectos-ae/scripts/build_reel_web3d_claro.jsx`.
- **Cortes/escenas**: duración de escena = `beatAt(inicio + entrada + lectura) - inicio`, siempre ≥ tiempo de lectura (regla de claridad). Nunca recortar lectura para caer en golpe: se alarga hasta el siguiente.
- Probar `MOFF` entre 0 y 1 s para que el total quepa en la pista; si la pista se adelgaza al final, el último viaje va al último golpe fuerte.
- **Escenas ya armadas en precomps** (retimear sin reconstruir): mover las capas de escena a su nuevo inicio; mover sus keys de fade-out a la siguiente transición; si la escena queda más larga que su fuente, activar `timeRemapEnabled` (congela el último cuadro), porque el out point no puede pasar la duración de la fuente.
- Música en la comp: nivel ~-8 dB, fade in 0.6 s, fade out 1.5 s.

## 4. Verificar
- Frames en cada transición (`saveFrameToPng`) y, tras exportar, comparar movimiento (diferencia entre cuadros con ffmpeg) contra golpes del audio: debe quedar a 1–3 cuadros.

## 5. Exportar (solo con aprobación del usuario)
1. `ae_autoguardado` → proyecto abierto; guardar.
2. Por `ae_ejecutar`:
   ```js
   $.global.EXPORTAR = [{ comp: "<nombre exacto de la comp>", archivo: "<ruta>/clientes/<CLIENTE>/06_exports/<CLIENTE>_<slug>_9x16_vN.mp4" }];
   $.evalFile(new File("<raíz>/_sistema/herramientas/exportar-ame.jsx")); $.global.EXPORTAR_LOG;
   ```
   Plantilla H.264 15 Mbps buscada por fragmentos ("264" + "15"). Media Encoder no sobrescribe: si el archivo existe crea `_1`.
3. Esperar a que aparezcan los MP4 y queden estables; luego `bash _sistema/herramientas/normalizar-audio.sh <mp4...>` (-14 LUFS, pico -1.5 dB, video sin recodificar).
4. Revisar con ffprobe (1080×1920, h264 + aac, duración) y frames sueltos; borrar exports viejos solo si el usuario lo pide.
5. Anotar en `historial.md`: pista, pulso, MOFF y archivos exportados.
