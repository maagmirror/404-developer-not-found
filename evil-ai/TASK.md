# Registro de tarea — Evil AI completa (2026-10-25)

## Pedido

Pedido del usuario: implementar Evil AI completa. Campo de código que de vez en cuando forma un rostro de IA y se corta con clips estilo CCTV, siguiendo `evil-ai/context.md` y `TODO.md`. Mismo stack que `interactive-terminal/` y `terminated/`. Videos todavía no disponibles: placeholders y forma simple de agregarlos. Sin flashes fuertes. Sin internet ni fuentes externas.

## Decisiones

- **Canvas 2D** para el campo: ~10 000 celdas agrupadas por color (una docena de `fillStyle` por frame), limitado a 30 fps (20 en modo estable). En Chromium headless a 1600×900 el loop se mantuvo a 60 fps de rAF. No se usó WebGL: no hizo falta.
- El rostro se dibuja una vez por aparición en un canvas fuera de pantalla (luminancia, rojo y silueta), se submuestrea a la grilla y se sombrea con una rampa ASCII. Se dibuja en una grilla fija aparte de las columnas de logs para que no se desalinee entre columnas que suben a distinta velocidad. Original: sin logo ni trade dress de Anthropic, sin lluvia verde estilo *Matrix*.
- Videos descubiertos con `import.meta.glob` sobre `media/videos/`: copiar un archivo basta. Sin archivos, tres feeds de prueba.
- Scheduler puro (`src/domain/scheduler.ts`) con reloj de show que se detiene en pausa.

## Comprobaciones

- `npm test`: 3 archivos / 16 tests (scheduler, manifiesto, rostro).
- `npm run build`: TypeScript + Vite aprobado.
- Navegador integrado (Chromium, silenciado), `?seed=404`:
  - 1600×900: campo, convergencia, rostro con frase, corte, feed placeholder, panel.
  - 1080×1920 y 390×844: rostro dentro de la zona segura, frase legible.
  - Clip WebM de prueba: se reprodujo, terminó y volvió al campo; diagnóstico `listo · 4.0 s`.
  - Archivo `.mp4` corrupto: marcado `error` y vuelta al campo sin pantalla negra.
  - Sin errores de consola; el bundle no hace pedidos de red.
  - Los archivos de prueba se borraron después.

## No ejecutado

- Chrome real: audio audible, fullscreen, H.264 (Chromium de pruebas no trae ese codec) y `prefers-reduced-motion`.
- Soak test de varias horas (FPS, memoria, deriva).
- Videos finales: pendientes del usuario y sujetos a revisión de procedencia y privacidad.
