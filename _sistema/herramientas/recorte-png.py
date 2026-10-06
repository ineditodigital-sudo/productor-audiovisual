"""
recorte-png.py — recorta un objeto generado (Nano Banana / Flow) sobre FONDO PLANO a PNG con transparencia,
y genera la verificación sobre un color contrastante (regla de la skill reels-3d-parallax).

Uso:
  python recorte-png.py entrada.png salida.png [--fondo auto|00FF00|FF00FF|FFFFFF] [--tolerancia 60] [--suavizado 18]
                        [--encoger 1] [--verificar] [--vidrio]

- --fondo auto: toma el color de fondo de las 4 esquinas (recomendado).
- Pedir siempre a Nano Banana el objeto sobre fondo PLANO de un color que NO tenga el objeto:
  verde chroma #00FF00 por defecto; magenta #FF00FF si el objeto es verde; nunca blanco si el objeto es claro.
- --verificar crea <salida>_check.png (objeto sobre #00FF66 o magenta si el fondo era verde) para revisar bordes,
  piso pegado o silueta rota. Si el recorte sale mal: regenerar la imagen con mejor prompt, no "arreglar" el recorte.
Requiere: numpy, pillow, scipy.
"""
import argparse, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument('entrada'); ap.add_argument('salida')
ap.add_argument('--fondo', default='auto'); ap.add_argument('--tolerancia', type=float, default=60)
ap.add_argument('--suavizado', type=float, default=18); ap.add_argument('--encoger', type=int, default=1)
ap.add_argument('--verificar', action='store_true')
ap.add_argument('--vidrio', action='store_true', help='objetos con cristal/huecos (lupa, vaso): no rellenar huecos; el fondo visto a traves queda transparente')
a = ap.parse_args()

img = np.asarray(Image.open(a.entrada).convert('RGB')).astype(np.float32)
h, w, _ = img.shape
if a.fondo == 'auto':
    m = max(4, min(h, w) // 40)
    esq = np.concatenate([img[:m, :m].reshape(-1, 3), img[:m, -m:].reshape(-1, 3), img[-m:, :m].reshape(-1, 3), img[-m:, -m:].reshape(-1, 3)])
    bg = np.median(esq, axis=0)
else:
    bg = np.array([int(a.fondo[i:i + 2], 16) for i in (0, 2, 4)], np.float32)
dist = np.sqrt(((img - bg) ** 2).sum(2))
alpha = np.clip((dist - a.tolerancia) / max(1, a.suavizado), 0, 1)
# quedarse con el objeto principal (componente mas grande) y rellenar huecos internos
solido = alpha > 0.5
lab, n = ndimage.label(solido)
if n > 1:
    tam = ndimage.sum(solido, lab, range(1, n + 1)); keep = 1 + int(np.argmax(tam))
    solido = lab == keep
if not a.vidrio: solido = ndimage.binary_fill_holes(solido)
if a.encoger > 0: solido = ndimage.binary_erosion(solido, iterations=a.encoger)
borde = ndimage.binary_dilation(solido, iterations=2) & ~solido
alpha = np.where(solido, 1.0, np.where(borde, alpha, 0.0))
# quitar el tinte del fondo en los bordes (despill hacia el canal dominante del fondo)
dom = int(np.argmax(bg)); otros = [c for c in range(3) if c != dom]
lim = img[:, :, otros].max(axis=2) if bg[dom] > 150 and bg[otros].max() < 120 else None
if lim is not None:
    img[:, :, dom] = np.minimum(img[:, :, dom], lim + (img[:, :, dom] - lim) * (1 - np.clip(borde * 1.0, 0, 1)))
rgba = np.dstack([img, alpha * 255]).clip(0, 255).astype(np.uint8)
# recortar al objeto con margen
ys, xs = np.nonzero(alpha > 0.02)
if len(xs) == 0: sys.exit('No se encontro objeto: revisar color de fondo/tolerancia')
pad = 12
y0, y1, x0, x1 = max(0, ys.min() - pad), min(h, ys.max() + pad), max(0, xs.min() - pad), min(w, xs.max() + pad)
toca = ys.min() <= 1 or xs.min() <= 1 or ys.max() >= h - 2 or xs.max() >= w - 2
Image.fromarray(rgba[y0:y1, x0:x1]).save(a.salida)
print('ok', a.salida, 'tam', x1 - x0, 'x', y1 - y0, '| fondo', bg.astype(int).tolist(), '| TOCA BORDE (regenerar)' if toca else '| no toca bordes')
if a.verificar:
    c = (255, 0, 255) if bg[1] > 150 and bg[0] < 120 else (0, 255, 102)
    base = Image.new('RGBA', (x1 - x0, y1 - y0), c + (255,))
    base.alpha_composite(Image.fromarray(rgba[y0:y1, x0:x1]))
    base.convert('RGB').save(a.salida.rsplit('.', 1)[0] + '_check.png')
