# EVIL AI

Monitor principal de **Error 404 — CapDev not found**. Un campo de logs de código que se desplaza sin parar; cada tanto los glifos convergen en el rostro de una IA hostil que dice una frase y se disuelve, y otras veces un corte de señal pasa a un clip de cámara de seguridad y vuelve al campo.

## Ejecutar localmente

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

Abrí la URL que muestre Vite (normalmente `http://127.0.0.1:5173/`) y poné pantalla completa desde el panel (`Shift+O`, luego `F`).

## Cómo se ve una noche

- **Campo**: varias columnas de logs ficticios (`process.freeze("human_trace")`, volcados hex, `heartbeat.desk_07 = FLATLINE`…) que suben a distinta velocidad, con alguna línea en rojo.
- **Rostro**: arranca a los 8 s y después cada 18–40 s cuando no toca video. Converge 3,6 s, se sostiene 5,2 s con una frase escrita debajo y se disuelve en 3 s. Aparece en otra posición cada vez.
- **Video CCTV**: corte de señal de 0,7 s (oscurece y desplaza, sin destellos blancos), clip con overlay REC/cámara/fecha y otro corte de vuelta. Nunca dos videos seguidos, nunca el mismo clip dos veces seguidas, mínimo 70 s entre videos y 4 min antes de repetir un clip.
- Si un clip falla, no tiene codec soportado o se cuelga, la pantalla vuelve sola al campo.

Todos los tiempos están en `src/config.ts`; las frases del rostro en `src/data/captions.ts` y los fragmentos de código en `src/data/codeLines.ts`.

## Videos

Copiá los clips (`.mp4` o `.webm`) en `media/videos/` y reiniciá `npm run dev` o volvé a correr `npm run build`. Entran solos en la playlist; ver `media/videos/LEEME.txt`. Etiqueta de cámara, peso, duración o encuadre por clip se ajustan en `src/data/videos.ts`.

Mientras la carpeta esté vacía se usan tres feeds de prueba que muestran "SIN SEÑAL DE VIDEO", así se puede ensayar el ciclo completo.

## Operador

El público no ve controles. `Shift+O` (o cinco clics rápidos en la esquina superior izquierda) abre el panel; los demás atajos sólo funcionan con el panel abierto.

| Acción | Tecla |
| --- | --- |
| Abrir / cerrar panel | `Shift+O` / `Esc` |
| Pausar / reanudar | `Espacio` o `P` |
| Saltar al siguiente evento | `N` |
| Rostro ahora / video ahora | `C` / `V` |
| Reiniciar | `R` |
| Modo estable | `S` |
| Activar audio / silenciar | `M` |
| Volumen | `+` / `-` o deslizador |
| Pantalla completa | `F` |

El panel muestra estado, próximo evento con cuenta regresiva, seed y el diagnóstico de cada clip (`listo`, `error`, `no soportado`, duración) con un botón **PROBAR**.

Parámetros de URL:

- `?seed=404` repite exactamente la misma secuencia (ensayo). Sin seed, cada arranque es distinto.
- `?stable=1` arranca en modo estable.
- `?safe=0.08` agranda la zona segura (fracción del lado corto; 0,05 por defecto) para marcos de monitor.
- `?panel=1` arranca con el panel abierto.

## Audio

Arranca **siempre en silencio**. `M` en el panel (un gesto) activa un drone sintetizado con Web Audio, un swell grave cuando aparece el rostro y estática en los cortes, y desmutea los clips. Sólo se recuerda el volumen (`error404.evil-ai.volume`). Nada del relato depende del sonido.

## Seguridad visual y burn-in

- Sin destellos: los cortes oscurecen la imagen; el punto REC late lento (2,4 s).
- **Modo estable** (`S`, `?stable=1` o automático con `prefers-reduced-motion`): el rostro aparece con un fundido uniforme, el campo se mueve a un tercio de velocidad y a 20 fps, los cortes son un fundido y se apagan grano y cursor.
- El campo deriva unos píxeles, el rostro cambia de lugar en cada aparición y el HUD rota de esquina cada 5 minutos.

## Sin red

Sin fuentes remotas (usa Cascadia Mono / Consolas / Courier New locales), sin APIs ni telemetría. Los videos se empaquetan desde `media/videos/` con el build.

## Verificación

```powershell
npm test
npm run build
```
