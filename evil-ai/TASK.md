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

# Registro de tarea — rostro más rápido y cinco eventos (2026-10-26)

## Pedido

Rick: el mismo rostro pero generándose más rápido, entre glitches, sin texto abajo, con pupilas más chicas que miran erráticamente muy rápido. La cámara sin "sala de operaciones" y en PISO 5. Cinco eventos barajados, idle > evento > idle: (1) aparece y desaparece en varios lugares, (2) se asoma desde un costado mirando fijo, (3) se genera en el centro, tiembla y mueve las pupilas en todas direcciones, (4) video a media pantalla a la derecha con texto grande a la izquierda, (5) el fondo sube muy rápido, a veces baja, con glitch.

## Cambios

- `src/domain/events.ts` (nuevo): planificación pura de cada evento (apariciones, posiciones, deslizamiento, temblor, perfil del desboque).
- `src/domain/scheduler.ts`: mazo barajado de los cinco eventos, sin repetir en el borde de ronda; el video sale sólo como evento 4.
- `src/field/FieldEngine.ts`: pupilas dibujadas por frame (fijas o erráticas), desplazamiento del rostro (asomarse, temblar), velocidad del campo hacia arriba o abajo y filas rotas de costado.
- `src/field/faceMask.ts`: ranuras de los ojos en rojo tenue; el rojo brillante queda sólo en las pupilas.
- `src/components/VideoInterlude.tsx` y `styles.css`: titular a la izquierda y video en marco a la derecha (apilados en vertical).
- `src/data/videos.ts`: etiqueta `PISO 5` en los dos clips de sala.
- Panel: un botón por evento y atajos `1`–`5`.

## Comprobaciones

- `npm test`: 4 archivos / 24 tests.
- `npm run build`: aprobado.
- Chromium (silenciado), `?seed=404`, 1600×900 y 1080×1920: capturas de los cinco eventos; cada uno vuelve a idle; sin errores de consola. Clip WebM de prueba usado y borrado.

## No ejecutado

- Ver la velocidad real de las pupilas y del desboque en Chrome (las capturas son estáticas).
- Los MP4 reales (Chromium de pruebas no trae H.264).

# Registro de tarea — ajustes de eventos (2026-10-26, segunda tanda)

- Pedido de Rick: quitar la cara que salta por la pantalla; el desboque debe acelerar, glitchear, ir para atrás y de nuevo para adelante; al asomarse, inclinar la cabeza como una cara real; en el video, en vez de la frase, `REPRODUCIENDO <archivo creepy>.mp4:` más chico.
- Quedan cuatro eventos (`peek`, `stare`, `video`, `rush`; atajos `1`–`4`). La velocidad del desboque ahora se interpola por tramos (acelera en vez de saltar). El asomarse rota la máscara del rostro ±0,38 rad y las pupilas giran con la cabeza.
- `npm test`: 4 archivos / 23 tests. `npm run build`: aprobado. Capturas en Chromium a 1600×900 de los cuatro eventos, sin errores de consola.
