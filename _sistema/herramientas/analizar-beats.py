"""
analizar-beats.py — encuentra el pulso real de una pista para sincronizar viajes de cámara y cortes.

Método: ffmpeg decodifica a mono 22 050 Hz → flujo espectral (ventana 1024, hop 128) → envolvente de
ataques → se ajusta un "peine" (periodo BP + fase B0) que maximiza la energía de ataques sobre sus dientes.
Ojo: el tempo "obvio" de una autocorrelación suele salir a la mitad o al doble; el peine prueba todos
los periodos entre --min y --max y reporta los mejores candidatos.

Uso:
  python analizar-beats.py pista.wav                 # resumen + candidatos
  python analizar-beats.py pista.mp3 --json salida.json
  python analizar-beats.py pista.wav --min 0.3 --max 1.0 --top 5

En el .jsx del reel:
  BP = periodo, B0 = primer golpe (s), MOFF = segundo del reel en que arranca la pista
  function beatAt(t) { var k = Math.ceil((t - MOFF - B0) / BP - 1e-6); return B0 + MOFF + k * BP; }
Requiere: ffmpeg en el PATH, numpy.
"""
import argparse, json, subprocess, sys
import numpy as np

SR, WIN, HOP = 22050, 1024, 128


def decodificar(ruta):
    cmd = ["ffmpeg", "-v", "error", "-i", ruta, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def envolvente(x):
    n = 1 + (len(x) - WIN) // HOP
    idx = np.arange(WIN)[None, :] + HOP * np.arange(n)[:, None]
    mag = np.abs(np.fft.rfft(x[idx] * np.hanning(WIN), axis=1))
    mag = np.log1p(100 * mag)
    flux = np.maximum(0, np.diff(mag, axis=0)).sum(axis=1)
    flux = np.concatenate([[0], flux])
    # quitar la tendencia lenta (media móvil de ~0.5 s) para quedarnos con los ataques
    k = int(0.5 * SR / HOP)
    flux = np.maximum(0, flux - np.convolve(flux, np.ones(k) / k, mode="same"))
    return flux / (flux.max() + 1e-9)


def ajustar_peine(env, pmin, pmax):
    fps = SR / HOP
    resultados = []
    for bp in np.arange(pmin, pmax, 0.0005):
        paso = bp * fps
        mejor = (-1, 0)
        for fase in np.arange(0, bp, 0.005):
            pos = np.round((fase + bp * np.arange(int((len(env) / fps - fase) / bp))) * fps).astype(int)
            pos = pos[pos < len(env)]
            if len(pos) < 4:
                continue
            v = env[pos].mean()
            if v > mejor[0]:
                mejor = (v, fase)
        resultados.append((mejor[0], bp, mejor[1]))
    resultados.sort(reverse=True)
    return resultados


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("pista")
    ap.add_argument("--min", type=float, default=0.3, help="periodo mínimo en s (0.3 = 200 bpm)")
    ap.add_argument("--max", type=float, default=1.0, help="periodo máximo en s (1.0 = 60 bpm)")
    ap.add_argument("--top", type=int, default=3)
    ap.add_argument("--json")
    a = ap.parse_args()

    x = decodificar(a.pista)
    dur = len(x) / SR
    env = envolvente(x)
    res = ajustar_peine(env, a.min, a.max)
    # quitar candidatos casi iguales
    cand = []
    for v, bp, b0 in res:
        if all(abs(bp - c[1]) > 0.01 for c in cand):
            cand.append((v, bp, b0))
        if len(cand) >= max(a.top, 6):
            break
    # los múltiplos del pulso real (mitad / tercio de tempo) puntúan casi igual: entre los candidatos con
    # afinidad >= 95 % del mejor, quedarse con el más rápido (periodo >= 0.4 s, como un golpe de bombo/caja)
    casi = [c for c in cand if c[0] >= 0.95 * cand[0][0] and c[1] >= 0.4]
    if casi:
        elegido = min(casi, key=lambda c: c[1])
        cand.remove(elegido); cand.insert(0, elegido)
    cand = cand[:a.top]
    v, BP, B0 = cand[0]
    fps = SR / HOP
    golpes = [round(B0 + i * BP, 4) for i in range(int((dur - B0) / BP) + 1)]
    fuerza = [round(float(env[min(len(env) - 1, int(round(g * fps)))]), 3) for g in golpes]
    # tramo donde la pista "pega" (golpes fuertes) para colocar los viajes importantes
    fuertes = [g for g, f in zip(golpes, fuerza) if f >= 0.35]

    print(f"Pista: {a.pista}  ({dur:.2f} s)")
    print(f"PULSO: BP = {BP:.4f} s  ({60 / BP:.1f} bpm)   B0 = {B0:.3f} s   afinidad {v:.3f}")
    for v2, bp2, b02 in cand[1:]:
        print(f"  alternativa: BP = {bp2:.4f} s ({60 / bp2:.1f} bpm), B0 = {b02:.3f} s, afinidad {v2:.3f}")
    if BP >= 0.75:
        print(f"  ojo: pulso lento; si al oído va al doble, usa BP = {BP / 2:.4f} s ({120 / BP:.1f} bpm), misma B0")
    print(f"Golpes fuertes (>=0.35): {len(fuertes)} de {len(golpes)}; primero en {fuertes[0] if fuertes else '-'} s")
    if a.json:
        json.dump({"pista": a.pista, "duracion": dur, "BP": BP, "B0": B0, "bpm": 60 / BP,
                   "golpes": golpes, "fuerza": fuerza,
                   "alternativas": [{"BP": c[1], "B0": c[2], "afinidad": c[0]} for c in cand[1:]]},
                  open(a.json, "w", encoding="utf-8"), indent=1)
        print("JSON:", a.json)


if __name__ == "__main__":
    sys.exit(main())
