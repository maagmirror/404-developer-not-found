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
