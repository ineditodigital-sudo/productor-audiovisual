#!/usr/bin/env bash
# normalizar-audio.sh — deja el audio de un MP4 en -14 LUFS (volumen de Instagram/TikTok/YouTube), sin recodificar el video.
# Uso: bash normalizar-audio.sh video.mp4 [video2.mp4 ...]
# Reemplaza cada archivo (guarda temporal y renombra). Requiere ffmpeg.
set -e
for IN in "$@"; do
  TMP="${IN%.*}_norm_tmp.mp4"
  ffmpeg -v error -y -i "$IN" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 256k \
    -shortest -movflags +faststart "$TMP"
  mv -f "$TMP" "$IN"
  echo "ok $IN"
done
