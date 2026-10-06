# Aprendizajes y preferencias: Inédito

- Marca: logo oficial `#7800CF` (SVG del sitio 2026: `03_assets/logos/inedito-negro.svg`); Hanson = `HansonBold`, Gilroy instalada. Sobre el degradado violeta del reel el logo necesita halo claro + saturación.
- Estilo aprobado: fondo claro con destellos diagonales + "aura mística" (nieblas violeta, rayos, partículas), laptops fotorrealistas de Flow con dashboards en AE, transiciones suaves (desenfoque + barrido de luz).
- Copy que funciona: dolor del dueño de negocio ("INVIERTES EN MARKETING ¿Y NO VENDES?") → Inédito lo resuelve en "nosotros" (CONECTAMOS / DETECTAMOS / PRIORIZAMOS / CONVERTIMOS) → beneficio en ventas → CTA WhatsApp 449 120 4353 (del sitio web; confirmar).
- El primer segundo debe traer gancho + marca + héroe (laptop con dashboard ya encendido).
- Clips Flow: la laptop en ángulo deriva ~28 px aunque "termine quieta" → siempre seguir la pantalla (`track_pantallas.jsx`). La lupa de Flow salió azul marino: teñir a violeta en AE.
- Reels previos de Inédito (scripts originales de la marca): texto a la izquierda x≈64, revelado con desplazamiento, pops 70→104→100, píldoras que crecen desde la izquierda, motion blur.
- Pendiente: referencia de "aura mística" (la imagen nunca llegó), música, aprobación para render.
- **Piezas de servicios de Inédito: nunca mencionar ni mostrar clientes concretos** (ni nombres ni capturas de sus sitios): deben servir para cualquier cliente y giro. Usar maquetas genéricas ("Tu marca", "tunegocio.com").
- Reel 3D (web con IA): textos aprobados por escena — ¿TU WEB NO VENDE? / PÁGINA 5 / sitios PREMIUM / CON IA / EN GOOGLE (con el 1) / TU WEB, A VENDER. Pendiente confirmar qué hace la IA en los sitios (se usó "atiende a tus clientes 24/7").
- **Sincronizar con música:** analizar la pista (ffmpeg+numpy), ajustar `moff`/recorte inicial para que una transición caiga en un pulso y separar escenas en múltiplos de pulso ≥ su tiempo de lectura; el hueco extra se cubre congelando el último cuadro de la escena (Time Remap) y moviendo su fade-out a la siguiente transición. **Cuidado con `ae_ejecutar` + `undo`: guarda en la ruta de `ae_autoguardado`; configurar el autoguardado del proyecto actual ANTES de cada ejecución con `undo`** (una vez se sobrescribió un .aep por no hacerlo; se restauró desde `_versiones`).
