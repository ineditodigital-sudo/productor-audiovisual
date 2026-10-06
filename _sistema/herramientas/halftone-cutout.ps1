<#
  halftone-cutout.ps1
  Convierte un clip sobre fondo chroma (p. ej. un objeto generado en Flow sobre verde)
  en una secuencia PNG con alpha: recorte + halftone blanco y negro + borde "sticker" crema.
  Requiere ffmpeg e ImageMagick (magick) en el PATH.

  Uso:
    .\halftone-cutout.ps1 -Source clip.mp4 -OutDir salida -KeyColor 19BD2E
  Luego en AE: importar la primera imagen con "Secuencia de PNG" activado, 24 fps.

  Parámetros útiles:
    -Similarity  tolerancia del key (0.10-0.20)
    -Cell        patrón de puntos (h6x6a más fino, h8x8a normal, h8x8o ortogonal)
    -Scale       % al que se reduce antes del dither (67 = puntos de ~12 px; 100 = ~8 px)
    -Outline     grosor del borde en px
    -Cream       color del borde y de las luces
#>
param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$OutDir,
  [string]$KeyColor = "19BD2E",
  [double]$Similarity = 0.13,
  [string]$Cell = "h8x8a",
  [int]$Scale = 67,
  [int]$Outline = 14,
  [string]$Cream = "#FAF6EC",
  [int]$Fps = 24,
  [string]$Levels = "6%,88%"
)
$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force $OutDir | Out-Null
$tmp = Join-Path $env:TEMP ("htcut_" + [guid]::NewGuid().ToString("N").Substring(0, 8))
New-Item -ItemType Directory -Force $tmp | Out-Null
$inv = [math]::Round(10000 / $Scale)

# 1) extraer frames con key + despill (alpha en el PNG)
ffmpeg -v error -y -i $Source -vf "fps=$Fps,chromakey=color=0x${KeyColor}:similarity=${Similarity}:blend=0.04,despill=type=green:mix=0.6:expand=0.2,format=rgba" "$tmp\k_%04d.png"
$frames = Get-ChildItem $tmp -Filter "k_*.png" | Sort-Object Name
Write-Output ("frames: " + $frames.Count)

# 2) halftone + borde por frame
$i = 0
foreach ($f in $frames) {
  $i++
  $out = Join-Path $OutDir ("htcut_{0:0000}.png" -f $i)
  magick $f.FullName -alpha off -colorspace Gray -level $Levels -resize "$Scale%" -ordered-dither $Cell -filter point -resize "$inv%!" -resize 1080x1920! -colorspace sRGB -fill $Cream -opaque white `
    '(' $f.FullName -channel A -separate +channel -write mpr:A +delete ')' mpr:A -alpha off -compose CopyOpacity -composite `
    '(' mpr:A -morphology Dilate "Disk:$Outline" -threshold 40% -write mpr:M +delete ')' `
    '(' -size 1080x1920 "xc:$Cream" mpr:M -alpha off -compose CopyOpacity -composite ')' `
    -compose DstOver -composite $out
  if ($i % 20 -eq 0) { Write-Output "  $i / $($frames.Count)" }
}
Remove-Item $tmp -Recurse -Force
Write-Output "listo: $OutDir"
