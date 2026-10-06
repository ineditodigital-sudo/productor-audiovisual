# Música de fondo

No se distribuye música (cada pista tiene su licencia). Agrega aquí las tuyas y anota su ficha: así Claude elige una distinta por pieza y sincroniza sin volver a analizar.

1. Copia la pista (WAV o MP3 real; si AE no la importa, `ffmpeg -i entrada.ext pista.wav`).
2. `python _sistema/herramientas/analizar-beats.py pista.wav` → pulso (`BP`), primer golpe (`B0`), bpm.
3. Anótala:

| Archivo | Duración | Carácter | Pulso | Licencia | Uso |
|---|---|---|---|---|---|
| `ejemplo_tech_30s.wav` | 30.0 s | optimista, limpia, arranque con energía | 120 bpm (BP 0.5, B0 0.23) | biblioteca con suscripción | reels de servicios/tech |

Mezcla usada en los reels: -8 dB, fade in 0.6 s, fade out 1.5 s; export normalizado a -14 LUFS.

Pistas usadas en los reels de ejemplo de Inédito (no incluidas; de Motion Array): *Bright Future Ahead* (sitios web 3D, 120 bpm), *Let's Do It Faster* (auditoría, 140 bpm), *Innovation Station* (posicionamiento IA, 143 bpm).
