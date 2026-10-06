"""
Analisis de video/audio para recorte inteligente y sync.

Uso:
    python analizar.py "video.mp4" silencios [--umbral -35] [--min 0.5] [--margen 0.08]
    python analizar.py "audio.mp3" beats   [--sensibilidad 1.5]
    python analizar.py "video.mp4" escenas [--umbral 0.35]
    python analizar.py "video.mp4" info

Salida: JSON por stdout Y archivo <nombre>.<modo>.json junto al original.
Los tiempos estan en segundos, listos para markers / trim en After Effects.
"""
import argparse, json, os, re, subprocess, sys, shutil

FFMPEG = shutil.which("ffmpeg")
FFPROBE = shutil.which("ffprobe")


def need_ffmpeg():
    if not FFMPEG or not FFPROBE:
        sys.exit("Falta ffmpeg/ffprobe en el PATH. Instala ffmpeg (winget install Gyan.FFmpeg)")


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True,
                          encoding="utf-8", errors="replace")


def info(path):
    need_ffmpeg()
    r = run([FFPROBE, "-v", "quiet", "-print_format", "json",
             "-show_format", "-show_streams", path])
    return json.loads(r.stdout)


def duracion(path):
    d = info(path)
    return float(d["format"]["duration"])


def silencios(path, umbral, minimo, margen):
    """Devuelve tramos CON voz (keep) y tramos de silencio (cut)."""
    need_ffmpeg()
    r = run([FFMPEG, "-i", path, "-af",
             "silencedetect=noise=%ddB:d=%s" % (umbral, minimo),
             "-f", "null", "-"])
    log = r.stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]

    total = duracion(path)
    cortes = []
    for i, s in enumerate(starts):
        e = ends[i] if i < len(ends) else total
        cortes.append([max(0.0, s + margen), min(total, e - margen)])
    cortes = [c for c in cortes if c[1] - c[0] > 0.05]

    # Tramos a conservar = complemento de los silencios
    keep, cursor = [], 0.0
    for s, e in cortes:
        if s - cursor > 0.05:
            keep.append([round(cursor, 3), round(s, 3)])
        cursor = e
    if total - cursor > 0.05:
        keep.append([round(cursor, 3), round(total, 3)])

    return {
        "modo": "silencios",
        "duracion_original": round(total, 3),
        "duracion_recortada": round(sum(b - a for a, b in keep), 3),
        "ahorro_seg": round(total - sum(b - a for a, b in keep), 3),
        "conservar": keep,
        "eliminar": [[round(a, 3), round(b, 3)] for a, b in cortes],
    }


def beats(path, sensibilidad):
    """Detecta picos de energia (golpes musicales) para sincronizar animacion."""
    need_ffmpeg()
    import wave, array, math, tempfile
    tmp = os.path.join(tempfile.gettempdir(), "aemcp_beat.wav")
    run([FFMPEG, "-y", "-i", path, "-ac", "1", "-ar", "22050", tmp])
    w = wave.open(tmp, "rb")
    n = w.getnframes()
    raw = array.array("h", w.readframes(n))
    sr = w.getframerate()
    w.close()

    hop = int(sr * 0.02)  # ventanas de 20 ms
    energia = []
    for i in range(0, len(raw) - hop, hop):
        ventana = raw[i:i + hop]
        energia.append(math.sqrt(sum(float(s) * s for s in ventana) / hop))

    media = sum(energia) / max(len(energia), 1)
    picos, ultimo = [], -1.0
    for i, e in enumerate(energia):
        t = i * hop / sr
        if e > media * sensibilidad and t - ultimo > 0.25:
            picos.append(round(t, 3))
            ultimo = t
    try:
        os.remove(tmp)
    except OSError:
        pass

    return {"modo": "beats", "cantidad": len(picos), "marcadores": picos}


def escenas(path, umbral):
    """Detecta cambios de plano (para cortar o poner transiciones)."""
    need_ffmpeg()
    r = run([FFMPEG, "-i", path, "-filter:v",
             "select='gt(scene,%s)',showinfo" % umbral, "-f", "null", "-"])
    tiempos = [round(float(x), 3)
               for x in re.findall(r"pts_time:([\d.]+)", r.stderr)]
    return {"modo": "escenas", "cantidad": len(tiempos), "cortes": tiempos}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("entrada")
    p.add_argument("modo", choices=["silencios", "beats", "escenas", "info"])
    p.add_argument("--umbral", type=float, default=None)
    p.add_argument("--min", type=float, default=0.5)
    p.add_argument("--margen", type=float, default=0.08)
    p.add_argument("--sensibilidad", type=float, default=1.5)
    a = p.parse_args()

    if not os.path.exists(a.entrada):
        sys.exit("No existe: " + a.entrada)

    if a.modo == "silencios":
        res = silencios(a.entrada, int(a.umbral if a.umbral is not None else -35),
                        a.min, a.margen)
    elif a.modo == "beats":
        res = beats(a.entrada, a.sensibilidad)
    elif a.modo == "escenas":
        res = escenas(a.entrada, a.umbral if a.umbral is not None else 0.35)
    else:
        res = {"modo": "info", "datos": info(a.entrada)}

    salida = os.path.splitext(a.entrada)[0] + "." + a.modo + ".json"
    with open(salida, "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
    print(json.dumps(res, ensure_ascii=False, indent=2))
    print("\nGuardado en: " + salida, file=sys.stderr)


if __name__ == "__main__":
    main()
