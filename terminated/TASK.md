# Registro de tarea — bucle de tres pasos (2026-10-25)

## Pedido

Pedido del usuario: acortar Terminated. Ahora el bucle muestra foto y nombre en grande con título DEVELOPER y decoración, luego la pantalla parpadea, luego la misma plantilla aparece con la cara tachada en rojo y el cartel TERMINATED, y tras N segundos pasa al siguiente developer. Sólo esos tres pasos, sin pantallas extra.

## Cambios

- `simulation.ts`: fases `profile → flicker → terminated`. Se eliminaron outcomes, builds, capacidad, historial y estadísticas.
- `ArchiveApp.tsx`: una sola plantilla (`DossierView`). Se quitaron el HUD, el índice de fases, el linaje, el archivo, la evolución y el esquema de máquina. El formulario y los controles se mantienen.
- `useArchiveAudio.ts`: cues `profile`, `flicker` y `terminated`.
- `styles.css`: se reescribió la parte de simulación; la del formulario no cambió.

## Comprobaciones

- `npx vitest run src/domain/simulation.test.ts`: **aprobado**, 1 archivo / 6 tests.
- `npm run build`: **aprobado**, 19 módulos.
- Búsqueda de la identidad retirada (patrón del handoff): **cero coincidencias**.
- Escaneo de URLs, `fetch(`, `axios` y Google Fonts en `src/`: **cero coincidencias**.
- `git diff --check`: **aprobado**.
- Navegador integrado (Chromium), con audio silenciado y 3 developers de prueba:
  - Temporización medida: perfil 3,5 s → parpadeo 0,9 s → terminated 3 s → siguiente developer.
  - Capturas de los tres pasos a 1600×900, 1080×1920 y 390×844, sin scroll horizontal.
  - Reinicio y vuelta a dossiers funcionan; las fotos se conservan.

## No ejecutado

- Audio audible y nivel en Chrome real (la QA se hizo silenciada).
- Fullscreen (el panel integrado lo bloquea).
- Emulación de `prefers-reduced-motion` (sólo revisado en CSS).

## Ajustes (2026-10-25, segunda tanda)

- Pedido del usuario: al cambiar de developer, el eliminado debe deslizarse a la izquierda y el nuevo entrar deslizándose desde la derecha; el sonido de eliminación tiene que dar más terror; del tachado solo debe quedar la X.
- Implementado: transición de 0,75 s con ambos expedientes montados; stinger de terror sintetizado (golpe sub, chillido de ruido filtrado, voces con vibrato que caen, cluster disonante); tachado reducido a la X.
- Tests 6/6 y build (19 módulos): **aprobados**.
- Navegador integrado (silenciado): la X se dibuja sola; durante la transición conviven el expediente que sale y el que entra, y el que sale se desmonta al terminar. Se confirmó que el cue de eliminación crea la fuente de ruido.
- **No ejecutado:** escuchar el sonido nuevo y ver la fluidez del slide en Chrome real (el panel integrado no anima de forma continua).

## Ficha creepy y foto opcional (2026-10-26)

- Pedido del usuario: la foto pasa a ser opcional; la ficha debe ser más grande, con una foto más chica y filtros creepy (ruido, baja calidad, pixelada); luego el título DEVELOPER y el nombre, con adornos parecidos a los actuales; y en la ficha mucho texto glitcheado que cambie de caracteres y de colores sin parar.
- Implementado: `CreepyPhoto` (canvas de baja resolución con posterizado y ruido, grano, bandas, etiqueta CAM y silueta si no hay foto), `GlitchText` (32 líneas con mutación continua y curación parcial), ficha a pantalla completa, botón QUITAR FOTO, y textos del formulario actualizados.
- Tests 6/6 y build (21 módulos): **aprobados**. Cero referencias prohibidas en `terminated/`.
- Navegador integrado (silenciado), un developer con foto y otro sin foto: PLAY se habilita sin fotos; la foto se ve pixelada y la silueta funciona; el texto cambia entre lecturas; la X y el sello se ven en terminated. Probado a 1600×900, 1080×1920 y 390×844, sin scroll horizontal.
- **No ejecutado:** fluidez de las animaciones y audio en Chrome real.

## Banner ELIMINADO (2026-10-26)

- Pedido del usuario: usar ELIMINADO en español, como banner recto de lado a lado con animación de entrada; el texto glitcheado debe cubrir todo el ancho; la foto, con un pixelado intermedio.
- Implementado: banner rojo a todo el ancho con franjas en los extremos, que entra con un barrido y luego revela la palabra. El estado ahora dice ELIMINADO. Las líneas se rellenan hasta cubrir el ancho. La foto pasó de 44×55 a 88×110 px, con 10 niveles y menos ruido. El tono rojo de la foto eliminada quedó corregido.
- Build: **aprobado** (21 módulos). Navegador integrado (silenciado): banner, texto a todo el ancho y foto revisados a 1600×900 y 1080×1920.
- **No ejecutado:** fluidez de la animación del banner en Chrome real.
