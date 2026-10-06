"""
track-pantalla.py — sigue las 4 esquinas de una pantalla NEGRA (laptop, celular, tablet) en un clip
de Flow sobre fondo chroma y genera un .jsx con los datos para animar el Corner Pin en After Effects.

Por qué: los clips de Flow nunca quedan 100 % quietos (la laptop en ángulo de Inédito seguía girando
~28 px en 3 s). Medir un solo cuadro hace que el contenido "se salga" de la pantalla.

Uso:
  python track-pantalla.py CLIP.mp4 SALIDA.jsx --clave lap34 --desde 2.9 --semilla 300 1000 [--fps 8] [--umbral 45]
  (varias pantallas: correrlo una vez por clip con --anexar para sumarlas al mismo .jsx)

  --desde    segundo del clip a partir del cual la pantalla ya está casi quieta
  --semilla  un punto (x y) dentro de la pantalla negra en ese cuadro
Salida: var TRACK = { clave: [[t, [[TLx,TLy],[TRx,TRy],[BRx,BRy],[BLx,BLy]]], ...] }
  t en segundos del clip fuente; esquinas suavizadas con polinomio de grado 2 (quita la vibración de 1–3 px).
En AE: tiempo del rig = tAsentado + (t - settle); Corner Pin = área activa (descontar marco) + máscara redondeada.
Requiere: ffmpeg, numpy, pillow, scipy.
"""
import argparse, glob, os, re, subprocess, tempfile
import numpy as np
from PIL import Image
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument('clip'); ap.add_argument('salida')
ap.add_argument('--clave', required=True); ap.add_argument('--desde', type=float, required=True)
ap.add_argument('--semilla', type=int, nargs=2, required=True)
ap.add_argument('--fps', type=float, default=8); ap.add_argument('--umbral', type=float, default=45)
ap.add_argument('--anexar', action='store_true')
a = ap.parse_args()

tmp = tempfile.mkdtemp(prefix='trk_')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(a.desde), '-i', a.clip, '-vf', f'fps={a.fps}', os.path.join(tmp, 'f_%03d.png')], check=True)
fs = sorted(glob.glob(os.path.join(tmp, 'f_*.png')))
ts, P = [], []
for i, f in enumerate(fs):
    img = np.asarray(Image.open(f).convert('RGB')).astype(np.int16)
    lab, _ = ndimage.label(img.mean(2) < a.umbral)
    sx, sy = a.semilla; l = lab[sy, sx]
    if l == 0:
        ys, xs = np.nonzero(lab); j = ((xs - sx) ** 2 + (ys - sy) ** 2).argmin(); l = lab[ys[j], xs[j]]
    ys, xs = np.nonzero(lab == l); s = xs + ys; d = xs - ys
    q = [(xs[s.argmin()], ys[s.argmin()]), (xs[d.argmax()], ys[d.argmax()]), (xs[s.argmax()], ys[s.argmax()]), (xs[d.argmin()], ys[d.argmin()])]
    ts.append(a.desde + i / a.fps); P.append([v for xy in q for v in xy])
t = np.array(ts); P = np.array(P, float); tc = t - t.mean(); sm = np.zeros_like(P)
for c in range(8):
    sm[:, c] = np.polyval(np.polyfit(tc, P[:, c], 2), tc)
print(a.clave, 'muestras', len(t), '| residuo max px', round(float(np.abs(P - sm).max()), 2),
      '| deriva borde der. px', round(float(sm[-1, 2] - sm[0, 2]), 1))
fila = f'  {a.clave}: [' + ', '.join(
    f'[{round(float(t[i]), 3)}, ' + str([[round(float(sm[i, 2 * j]), 1), round(float(sm[i, 2 * j + 1]), 1)] for j in range(4)]) + ']'
    for i in range(len(t))) + ']'
previo = []
if a.anexar and os.path.exists(a.salida):
    previo = [ln for ln in open(a.salida, encoding='utf-8').read().splitlines() if re.match(r'^\s{2}\w+: \[', ln) and not ln.strip().startswith(a.clave + ':')]
    previo = [ln.rstrip(',') for ln in previo]
filas = previo + [fila]
open(a.salida, 'w', encoding='utf-8').write(
    '// esquinas de pantalla (TL,TR,BR,BL) por tiempo del clip fuente — generado por _sistema/herramientas/track-pantalla.py\nvar TRACK = {\n' + ',\n'.join(filas) + '\n};\n')
print('escrito', a.salida)
