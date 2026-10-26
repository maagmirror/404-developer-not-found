# Contexto actual de `terminated`

## Estado

App independiente React + TypeScript + Vite, sin backend ni recursos externos. El 2026-10-25, a pedido del usuario, se simplificó a un bucle de **tres pasos sin pantallas extra**. Reemplaza al rediseño "archivo de incidentes" del 2026-10-24 (fases de análisis, veredictos, archivo, linaje y evolución), que se consideró demasiado largo.

## Bucle

`profile (3,5 s) → flicker (0,9 s) → terminated (3 s) → siguiente developer`, unos 7,4 s por persona. Una única plantilla de expediente: foto grande, título `DEVELOPER`, nombre grande, esquinas rojas, datos decorativos (clase, ronda, estado) y un código de barras decorativo. En `terminated` se dibuja una X roja sobre la cara, el nombre se raya, el estado pasa a `TERMINATED` y aparece el sello. Al pasar al siguiente, el expediente eliminado sigue montado y se desliza hacia la izquierda mientras el nuevo entra por la derecha (0,75 s; se desmonta en `animationend`).

Cada persona aparece una vez por ronda; con N > 1 la última de una ronda no abre la siguiente. Con N = 1 se repite la misma persona.

## Formulario

N dossiers (N >= 1), nombre de 2+ caracteres y foto JPG/PNG/WebP de hasta 5 MB. PLAY queda deshabilitado mientras haya uno inválido. Las fotos son object URLs en memoria y se revocan al reemplazarlas, al quitar el dossier o al desmontar.

## Audio

`src/audio/useArchiveAudio.ts`: drone grave, pulso periódico y un cue por paso (aviso en perfil, chisporroteo eléctrico en el parpadeo, en terminated, un stinger de terror con golpe sub, chillido de ruido filtrado, voces de sierra con vibrato que caen y un cluster disonante), todo sintetizado. El `AudioContext` se crea en PLAY y se cierra al volver a dossiers. La pausa detiene el pulso. Volumen inicial 58 %; mute y volumen persisten. Los cues se deduplican por `epoch:contador:paso`.

## Archivos

- `src/domain/simulation.ts`: bucle, shuffle inyectable y duraciones (lógica pura con tests).
- `src/ArchiveApp.tsx`: dossiers, plantilla `DossierView`, simulación, controles y atajos.
- `src/App.tsx`: reexporta `ArchiveApp` (conserva comentada la primera versión).
- `src/styles.css`: estética CRT (negro, carbón, blanco sucio, rojo, monoespaciada del sistema) con layouts 16:9, retrato y estrecho.
- `src/data/iterations.ts`: ya no se usa desde el bucle simplificado.

## Seguridad visual

El parpadeo hace como máximo dos caídas profundas por pasada, siempre hacia negro y nunca hacia blanco, más una vibración de baja amplitud. Así queda por debajo de tres destellos por segundo. Con `prefers-reduced-motion` el parpadeo se convierte en un cuadro atenuado fijo y se desactivan los trazos animados, el ruido y el barrido.
