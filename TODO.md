# TODO maestro — Error 404 — CapDev not found

Backlog operativo y de producto actualizado el **2026-10-26**. Las casillas completadas reflejan evidencia ya disponible; las pendientes no implican autorización para desplegar, publicar, hacer push ni activar producción.

## P0 — Branding y operaciones del repositorio

- [x] Adoptar como marca humana canónica **Error 404 — CapDev not found** y permitir `ERROR 404 — CAPDEV NOT FOUND` sólo en contextos de display.
- [x] Actualizar el nombre del paquete a `error-404-capdev-not-found-terminal` y las claves activas a `error404.remembered-names` y `error404.muted`.
- [ ] Renombrar físicamente la carpeta raíz a `<workspace>\Error404-CapDev-not-found` después de cerrar y verificar este cambio.
- [ ] Crear el repositorio nuevo en la cuenta de destino y confirmar su visibilidad antes de la primera publicación.
- [ ] Inicializar un historial nuevo, configurar el `origin` de destino y publicar en `main` sólo después de revisar el contenido exacto.
- [ ] Verificar antes de publicar que el repositorio no contenga identidades personales retiradas, rutas locales, secretos, multimedia real ni artefactos generados.
- [ ] Confirmar que es aceptable el reinicio único de nombres recordados y mute en navegadores ya usados. No reintroducir claves antiguas sólo para migrarlas.

## P0 — Terminal interactiva existente

- [x] Mantener siete variantes registradas: `anticipado`, `jumpscare`, `cuenta`, `emergencia`, `facial`, `captcha` y `sobrevive`.
- [x] Conservar pin de ensayo mediante `?v=<id>` y rotación en bolsa sin repetición inmediata entre rondas.
- [ ] Sustituir las nueve imágenes placeholder de oficina y los dos registros genéricos por material aprobado de los seis desarrolladores reales, con nombres, roles y encuadres correctos.
- [ ] Auditar consentimiento, privacidad, procedencia y permisos de cada nombre, alias, fotografía, audio o dato antes de incorporarlo.
- [ ] Validar manualmente en navegador cada variante de punta a punta, incluida identidad conocida, desconocida, ambigua y recordada.
- [ ] Hacer QA visual en 16:9 y retrato: legibilidad a distancia, zonas seguras, recortes, contraste, overlays, HUD y controles.
- [ ] Verificar teclado y foco: Enter, Escape/R, F, M, Alt+1..7, números/flechas de variantes y retorno correcto del foco al reiniciar.
- [ ] Verificar fullscreen, políticas de autoplay, desbloqueo de Web Audio, mute persistente y comportamiento ante permisos denegados.
- [ ] Verificar `prefers-reduced-motion` y una experiencia estable que no dependa de animación para comunicar estado.
- [ ] **P0:** eliminar las referencias externas a Google Fonts de `index.html`: empaquetar/autohospedar las fuentes con procedencia y licencia verificadas, o decidir usar sólo los fallbacks locales. No declarar offline estricto hasta cerrar y comprobar este punto.
- [ ] Revisar el strobe rojo/blanco de 900 ms; eliminarlo o suavizarlo si no supera la revisión de seguridad y confort visual.
- [ ] Ensayar como operador las siete rutas fijadas (`?v=anticipado`, `jumpscare`, `cuenta`, `emergencia`, `facial`, `captcha`, `sobrevive`) y documentar URLs/atajos definitivos.
- [ ] Después de resolver las fuentes externas, probar cold-start completamente offline con caché limpia y dependencias ya instaladas; confirmar en DevTools/Network que hay **cero solicitudes externas** durante todo el flujo.
- [ ] Actualizar o retirar el contenido histórico desactualizado de `interactive-terminal/TASK.md` y alinear README/contexto con el producto actual.
- [ ] Decidir si las dependencias declaradas como `latest` deben fijarse a versiones explícitas además del lockfile; documentar la política de actualización.

## P1 — Medios compartidos

- [ ] Crear `assets/images/`, `assets/audio/`, `assets/video/` y `assets/data/` cuando exista contenido aprobado; no agregar carpetas vacías sólo para simular avance.
- [ ] Crear `assets/PROVENANCE.md` antes del primer medio y registrar fuente/autor, permiso o licencia, fecha, transformaciones y usos autorizados.
- [ ] Definir nombres ASCII estables, manifiestos y metadata técnica; remover EXIF/XMP, coordenadas y datos privados no aprobados.
- [ ] Preparar tamaños, compresión, codecs y variantes 16:9/9:16/thumbnails según el consumidor, con presupuesto de decodificación y almacenamiento.
- [ ] Decidir Git LFS o una fuente offline reproducible antes de incorporar cualquier video mayor de 100 MiB.
- [ ] Definir manifiestos locales, posters, silencio, imagen genérica y recuperación para archivo faltante o codec no soportado.

## P1 — `terminated` (aplicación implementada)

- [x] Crear una SPA React + TypeScript + Vite independiente, sin acoplarla a los internos de la terminal.
- [x] Aceptar una nómina arbitraria de N personas (mínimo una), con edición, alta/baja, nombre y foto obligatorios, previews y validación de formato/tamaño.
- [x] Mantener las fotos sólo en memoria de la sesión, sin backend ni persistencia, y explicarlo en la interfaz.
- [x] Definir un manifiesto versionado de generaciones ficticias de IA con etiquetas, capacidades y doctrina.
- [x] Simplificar a bucle de tres pasos `profile -> flicker -> terminated` (~7,4 s por persona) con una sola plantilla de expediente, sin pantallas extra (2026-10-25; reemplaza el rediseño "archivo de incidentes").
- [x] Paisaje sonoro Web Audio local (drone, pulso, cue por paso), mute y volumen persistentes, sin duplicados con StrictMode ni reinicios.
- [ ] Confirmar en Chrome real que el audio se escucha y su nivel inicial (58 %) es cómodo en la sala.
- [x] Implementar scheduler por rondas con shuffle inyectable y sin repetición de persona al cruzar rondas cuando N > 1.
- [x] Adaptar 16:9, retrato y pantallas estrechas, con pausa/reanudación, avance, reinicio, configuración, mute, volumen y fullscreen.
- [x] Añadir tests dirigidos (6): seed determinista, orden de los tres pasos, misma persona en los tres pasos, cobertura de ronda sin repetición en el borde, N = 1 y roster vacío.
- [x] Mantener una dirección original sin personajes, interfaz, composición, audio ni assets de Disney/Pixar.
- [x] QA en navegador integrado (Chromium, silenciado) a 1600×900, 1080×1920 y 390×844: temporización del bucle, los tres pasos, reinicio y dossiers. Detalle en `terminated/TASK.md`.
- [ ] Completar aceptación en Chrome real: audio audible, fullscreen y `prefers-reduced-motion`.
- [ ] Sustituir las fotos de sesión por el conjunto final aprobado sólo después de auditar consentimiento, privacidad y procedencia; conservar el modo de carga local si sigue siendo parte de la operación.
- [ ] Autorizar y ejecutar por separado cualquier publicación o despliegue.

## P1 — `evil-ai` (aplicación futura)

- [x] Implementar con Canvas 2D (celdas agrupadas por color, 30 fps; 20 en modo estable). Falta medir FPS/memoria en el equipo real durante horas.
- [x] Layouts 16:9 y 9:16 con zona segura configurable (`?safe=`); revisado a 1600×900, 1080×1920 y 390×844.
- [x] Campo original de columnas de logs que suben, gris/blanco/rojo, sin lluvia verde.
- [x] Rostro ficticio en ASCII sombreado que converge y se disuelve, sin logo ni branding de Anthropic.
- [x] Scheduler con seed de ensayo, ventanas acotadas, cooldowns, exclusión entre rostro/video y sin repetición inmediata (tests).
- [x] Manifiesto automático desde `evil-ai/media/videos/` con overrides (etiqueta, duración, peso, encuadre), precarga 6 s antes, timeout y vuelta al campo ante error/codec no soportado (probado con clip corrupto).
- [ ] Copiar los videos CCTV reales en `evil-ai/media/videos/` y probarlos en Chrome real (H.264).
- [x] Arranca en mute, autoplay silencioso y desbloqueo de audio con gesto desde el panel.
- [x] Panel de operador oculto (`Shift+O` o 5 clics en la esquina): fullscreen, volumen/mute, pausa, siguiente evento, rostro/video ahora, reinicio, seed y diagnóstico de clips.
- [x] Deriva del campo, rostro en otra posición cada vez y HUD que rota de esquina cada 5 min.
- [x] Modo estable (automático con reduced motion); cortes que oscurecen en vez de destellar. Falta verificarlo en Chrome real.
- [ ] Ejecutar soak tests de varias horas y registrar FPS, memoria, errores de reproducción, recuperación y deriva del scheduler.
- [ ] Auditar licencias y procedencia de glifos, rostros, tipografías, audio y videos antes de exhibición.

## P2 — Integración y preparación de exhibición

- [ ] Definir tokens visuales compartidos (color, tipografía, espaciado, ruido y movimiento) como contrato documentado, sin acoplar código entre aplicaciones.
- [ ] Crear scripts de arranque o launcher multimonitor sólo cuando se solicite y exista un mapa de aplicaciones aprobado.
- [ ] Fijar y documentar monitor, orientación, resolución, URL/ruta y modo fullscreen de cada aplicación.
- [ ] Ensayar el conjunto sin red desde un arranque en frío, verificando resolución de medios, fuentes y rutas locales.
- [ ] Verificar reproducción real de todos los codecs en el hardware/navegador objetivo y confirmar fallbacks.
- [ ] Probar recuperación tras crash y reinicio del equipo sin lanzar procesos no autorizados ni perder control del operador.
- [ ] Definir logging local mínimo para diagnóstico, sin nombres, entradas ni otros datos de visitantes.
- [ ] Hacer revisión final de contenido, consentimiento, privacidad, licencias, reduced motion, flashes y material perturbador.
- [ ] Preparar checklist final de encendido, operación, apagado y rollback local. Esta preparación no concede autorización de producción, publicación ni despliegue.

## Evidencia completada y estado conocido

- [x] La terminal interactiva contiene **7 variantes** registradas.
- [x] El **2026-10-22** pasó la suite enfocada de **5 archivos / 19 tests** (`recognition`, `memory`, `sabotage`, `registry`, `sfx`).
- [x] El **2026-10-22** pasó `npm run build` (TypeScript + Vite, 36 módulos transformados).
- [ ] Falta aceptación visual y funcional manual en navegador; los checks automáticos anteriores no la sustituyen.
- [x] Revalidar los cinco archivos Vitest y el build sobre el rebrand antes de considerar el candidato cerrado: **5 archivos / 19 tests** y build de **36 módulos transformados** pasaron el 2026-10-22.
