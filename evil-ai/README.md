# EVIL AI

Monitor principal de **Error 404 — CapDev not found**. Un campo de logs de código que se desplaza sin parar; cada tanto los glifos convergen en el rostro de una IA hostil que dice una frase y se disuelve, y otras veces un corte de señal pasa a un clip de cámara de seguridad y vuelve al campo.

## Ejecutar localmente

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

Abrí la URL que muestre Vite (normalmente `http://127.0.0.1:5173/`) y poné pantalla completa desde el panel (`Shift+O`, luego `F`).

## Cómo se ve una noche

La pantalla alterna **idle → evento → idle**. En idle sólo corren los logs (varias columnas que suben a distinta velocidad, con alguna línea en rojo). Cada 12–24 s sale un evento, repartido de un mazo barajado con los cuatro: cada uno sale una vez por ronda y nunca el mismo dos veces seguidas.

1. **Se asoma**: entra deslizándose desde el borde izquierdo o derecho con la cabeza inclinada, como alguien que se asoma detrás de una pared, y se queda mirando fijo al frente.
2. **Tiembla en el centro**: se forma grande en el centro, tiembla y mueve las pupilas en todas direcciones.
3. **Video**: corte de señal, `REPRODUCIENDO <archivo>.mp4:` escrito a la izquierda y el clip CCTV ocupando media pantalla a la derecha (en vertical, texto arriba y video abajo). Los nombres están en `src/data/captions.ts`.
4. **El fondo se desboca**: los logs aceleran hacia arriba, glitch, retroceden hacia abajo, glitch, y vuelven a ir para adelante hasta frenar.

El rostro se arma con glifos que convergen en 0,9–1,4 s, entra y sale con un glitch corto y no tiene texto. Las pupilas son dos puntos rojos chicos que saltan de lugar cada ~0,1 s (al asomarse miran fijo).

Ningún glitch blanquea la pantalla: oscurecen y desplazan. Si un clip falla, no tiene codec soportado o se cuelga, la pantalla vuelve sola a idle.

Todos los tiempos están en `src/config.ts` y los fragmentos de código en `src/data/codeLines.ts`.

## Videos

Copiá los clips (`.mp4` o `.webm`) en `media/videos/` y reiniciá `npm run dev` o volvé a correr `npm run build`. Entran solos en la playlist; ver `media/videos/LEEME.txt`. Etiqueta de cámara, peso, duración o encuadre por clip se ajustan en `src/data/videos.ts`.

Mientras la carpeta esté vacía se usan tres feeds de prueba que muestran "SIN SEÑAL DE VIDEO", así se puede ensayar el ciclo completo.

## Operador

El público no ve controles. `Shift+O` (o cinco clics rápidos en la esquina superior izquierda) abre el panel; los demás atajos sólo funcionan con el panel abierto.

| Acción | Tecla |
| --- | --- |
| Abrir / cerrar panel | `Shift+O` / `Esc` |
| Pausar / reanudar | `Espacio` o `P` |
| Saltar: corta el evento actual o adelanta el próximo | `N` |
| Lanzar un evento (1 a 4) | `1` … `4` |
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
