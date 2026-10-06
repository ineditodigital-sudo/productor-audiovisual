#!/usr/bin/env bash
# halftone-still.sh — sticker halftone B/N con borde crema a partir de un PNG recortado (transparente),
# estilo collage/recorte de revista. Para clips de video usar halftone-cutout.ps1.
# Uso: bash halftone-still.sh entrada_recortada.png salida.png [crema=#FAF6EC] [borde=16] [escala=80]
#   1) recortar antes: python recorte-png.py original.png recorte.png --verificar
#   2) escala: % al que se reduce antes del tramado (80 = puntos medianos; 100 = finos; 67 = gruesos)
set -e
IN="$1"; OUT="$2"; CREAM="${3:-#FAF6EC}"; BORDE="${4:-16}"; ESC="${5:-80}"
INV=$(python -c "print(round(10000/$ESC,2))")
TMP="${OUT%.*}_pad_tmp.png"
magick "$IN" -bordercolor none -border 40 "$TMP"
magick "$TMP" -alpha off -colorspace Gray -level 6%,90% -resize "$ESC%" -ordered-dither h8x8a -filter point -resize "$INV%" \
  -colorspace sRGB -fill "$CREAM" -opaque white \
  \( "$TMP" -alpha extract -write mpr:A +delete \) mpr:A -alpha off -compose CopyOpacity -composite \
  \( mpr:A -morphology Dilate "Disk:$BORDE" -threshold 40% -write mpr:M +delete \) \
  \( mpr:M -fill "$CREAM" -colorize 100 -alpha off mpr:M -compose CopyOpacity -composite \) \
  -compose DstOver -composite "$OUT"
rm -f "$TMP"
echo "ok $OUT"
