# Qué modelo de Claude usar en cada pieza (y cómo ahorrar créditos de Flow)

Precios oficiales de la API por millón de tokens (tabla vigente al 2026-09-25). En un plan de suscripción de Claude Code no se paga por token, pero el modelo más potente consume el límite de uso más rápido: la proporción es la misma.

| Modelo | Entrada / salida ($/1M tokens) | Relativo a Sonnet |
|---|---|---|
| Claude Haiku 4.5 | $1 / $5 | 0.5× |
| Claude Sonnet 5.5 | $2 / $10 | 1× |
| Claude Opus 5.5 | $4 / $20 | 2× |
| Claude Fable 5.1 | $10 / $50 | 5× |

Además del modelo, el **nivel de esfuerzo** (effort) cambia el gasto: bajo para tareas rutinarias, alto para creación y depuración.

## Guía por tipo de trabajo en este pipeline

| Trabajo | Modelo recomendado | Por qué |
|---|---|---|
| Ordenar/renombrar clips, ffprobe, copiar assets, sacar frames de revisión, lanzar el render aprobado | **Haiku 4.5** | Tareas mecánicas con instrucciones claras |
| Pieza nueva que **reutiliza** un script/plantilla existente (mismo formato, otro texto, otro cliente con estilo ya definido); variantes A/B; cambios de copy; prompts de Flow para algo ya probado | **Sonnet 5.5** | Buen juicio a mitad de costo de Opus; el trabajo difícil ya está resuelto en el script |
| **Primera pieza de un cliente**, dirección creativa nueva, guion/copy estratégico, escribir un script de AE nuevo, compositing difícil (pantallas, keys, tracking), depurar errores de AE | **Opus 5.5** | Requiere razonamiento visual, código ExtendScript complejo y criterio de diseño |
| Construir una herramienta nueva del sistema o un problema que Opus no resolvió tras 2 intentos | **Fable 5.1** | Máxima capacidad; solo cuando el costo se justifica |

Regla práctica: **Opus para inventar, Sonnet para repetir, Haiku para mover archivos.** En una pieza larga se puede empezar con Opus (guion + script base) y pasar a Sonnet para las iteraciones de corrección.

Al iniciar cada video, Claude dice qué modelo y esfuerzo conviene y por qué (y si conviene cambiar a mitad de la pieza).

## Configuración estándar de Google Flow (la del productor)
| Qué | Ajuste |
|---|---|
| Clips de video | **Omni**, **720p**, **6 s** (hasta **10 s** solo si la toma lo necesita) |
| Descarga | opción de descarga **1080p** (escalado de Flow) |
| Imágenes | **Nano Banana Pro** por defecto; **Nano Banana 2** cuando se busca economizar (pruebas, variantes, referencias internas) |

### Costo real en Flow (captura del productor, 2026-10-02)
Omni 1.1 Flash · 9:16 · 720p · 1 salida (x1):
| Duración | Créditos | Créditos por segundo |
|---|---|---|
| 6 s | **10** | 1.67 |
| 8 s | **12** | 1.50 |
| 10 s | **15** | 1.50 |

- El tope del MCP (`FLOW_MAX_CREDITS_PER_CALL=20`) cubre una toma de hasta 10 s, o 2 variantes (x2) de 6 s. Para x3–x4 hay que pedir permiso explícito.
- 8 s cuesta solo 2 créditos más que 6 s: si la toma va a recortarse a ~5 s, 6 s basta; si se necesita margen para entrada y salida, 8 s es la mejor relación.
- 360p sería más barato, pero el estándar del productor es 720p (calidad final): no se baja salvo para pruebas que él apruebe.
- Modo **Ingredientes** = imágenes de referencia (personaje/objeto/estilo); **Fotogramas** = frame inicial/final. Usar Fotogramas con la imagen aprobada de Nano Banana para fijar el look.

## Ahorro de créditos en Google Flow (MCP `google-flow`)
1. **Cotizar antes de generar:** `dry_run: true` para ver el precio; tope por llamada `FLOW_MAX_CREDITS_PER_CALL=20`.
2. **Fijar el look con imágenes primero:** probar con Nano Banana 2, y la imagen final o de referencia de marca con Nano Banana Pro. La imagen aprobada se usa como frame inicial del video.
3. **Duración justa:** 6 s por defecto; 10 s solo si la toma lo pide (más duración = más créditos).
4. **Pedir solo materia prima** (lo que AE no puede hacer): nada de texto, logos ni UI.
5. **Máximo 2 variantes** por toma; iterar el prompt antes de pedir más.
6. Descargar en 1080p a `clientes/<CLIENTE>/04_clips/generados-ia/` y registrar en `prompts-flow.md` qué prompt y modelo funcionaron y cuántos créditos costaron.
7. `flow_generate_image` no tiene cotización ni tope en el MCP: pedir 1 imagen a la vez.
