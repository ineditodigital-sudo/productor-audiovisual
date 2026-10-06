"""
Transcribe un video/audio y genera .srt + .json (con timings por palabra).
Uso:
    python transcribir.py "C:\\ruta\\video.mp4" [--modelo small] [--idioma es]

Salidas (junto al archivo de entrada):
    video.srt   -> subtitulos listos para importar
    video.json  -> segmentos y palabras con timecodes (para AE)
"""
import argparse, json, os, sys


def fmt(t):
    h = int(t // 3600); m = int((t % 3600) // 60); s = int(t % 60)
    ms = int(round((t - int(t)) * 1000))
    return "%02d:%02d:%02d,%03d" % (h, m, s, ms)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("entrada")
    p.add_argument("--modelo", default="small",
                   help="tiny|base|small|medium|large-v3 (mas grande = mejor y mas lento)")
    p.add_argument("--idioma", default=None, help="es, en, ... (auto si se omite)")
    p.add_argument("--max-chars", type=int, default=42,
                   help="maximo de caracteres por linea de subtitulo")
    a = p.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("Falta faster-whisper. Instala con: pip install faster-whisper")

    if not os.path.exists(a.entrada):
        sys.exit("No existe: " + a.entrada)

    print("Cargando modelo %s..." % a.modelo)
    model = WhisperModel(a.modelo, device="auto", compute_type="int8")

    print("Transcribiendo...")
    segments, info = model.transcribe(
        a.entrada, language=a.idioma, word_timestamps=True, vad_filter=True
    )

    base = os.path.splitext(a.entrada)[0]
    data = {"idioma": info.language, "duracion": info.duration, "segmentos": []}

    srt_lines, idx = [], 1
    for seg in segments:
        words = [{"t": w.start, "e": w.end, "p": w.word.strip()}
                 for w in (seg.words or [])]
        data["segmentos"].append(
            {"inicio": seg.start, "fin": seg.end, "texto": seg.text.strip(), "palabras": words}
        )

        # Partir en lineas cortas legibles
        texto = seg.text.strip()
        chunks, actual = [], ""
        for palabra in texto.split():
            if len(actual) + len(palabra) + 1 > a.max_chars and actual:
                chunks.append(actual); actual = palabra
            else:
                actual = (actual + " " + palabra).strip()
        if actual:
            chunks.append(actual)

        dur = (seg.end - seg.start) / max(len(chunks), 1)
        for i, c in enumerate(chunks):
            ini = seg.start + i * dur
            fin = ini + dur
            srt_lines.append("%d\n%s --> %s\n%s\n" % (idx, fmt(ini), fmt(fin), c))
            idx += 1

    with open(base + ".srt", "w", encoding="utf-8") as f:
        f.write("\n".join(srt_lines))
    with open(base + ".json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("OK")
    print("  " + base + ".srt")
    print("  " + base + ".json")


if __name__ == "__main__":
    main()
