# TERMINATED

Experiencia local de horror tecnológico para **Error 404 — CapDev not found**. Se carga una nómina de desarrolladores y la pantalla repite un bucle de tres pasos por persona:

1. **Perfil** (3,5 s): foto y nombre en grande, título `DEVELOPER` y elementos decorativos de expediente.
2. **Parpadeo** (0,9 s): flickering de la pantalla.
3. **Terminated** (3 s): la misma plantilla con una X roja sobre la cara, el cartel `TERMINATED` y un golpe de sonido de terror.

Después el expediente eliminado se desliza hacia la izquierda mientras el siguiente entra deslizándose desde la derecha. Cada persona sale una vez por ronda y el orden se vuelve a barajar en cada ronda, sin fin. Las duraciones están en `phaseDurations` (`src/domain/simulation.ts`).

## Ejecutar localmente

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

Abrí la URL exacta que muestre Vite (normalmente `http://127.0.0.1:5173/`).

## Uso y controles

Abrí un dossier por persona con nombre (2+ caracteres) y foto JPG, PNG o WebP de hasta 5 MB, y pulsá **ABRIR ARCHIVO / PLAY** (ese gesto habilita el audio).

| Acción | Botón | Teclado |
| --- | --- | --- |
| Pausar / reanudar | `[Ⅱ] PAUSAR` | `Espacio` o `P` |
| Saltar al siguiente paso | `[→] SIGUIENTE` | `Flecha derecha` o `N` |
| Reiniciar | `[R] REINICIAR` | `R` |
| Volver a dossiers | `[C] DOSSIERS` | `C` |
| Silenciar / activar | `[M] SILENCIAR` | `M` |
| Volumen | deslizador `VOL` | flechas con el deslizador enfocado |
| Pantalla completa | `[F] FULLSCREEN` | `F` |

## Privacidad y red

Las fotos viven sólo en memoria (object URLs) y se pierden al recargar. Sólo se guardan las preferencias de audio (`error404.terminated.muted`, `error404.terminated.volume`). Sin backend, fuentes remotas, archivos de audio ni llamadas de red; el sonido se sintetiza con Web Audio.

## Verificación dirigida

```powershell
npx vitest run src/domain/simulation.test.ts
npm run build
```
