# Brief de `evil-ai`

## Estado y objetivo

Documento de planificación original para la experiencia ambiental del monitor principal de **Error 404 — CapDev not found**. Debe funcionar tanto en monitores apaisados como en retrato y sostener una presencia inquietante durante largos períodos.

> **Estado (2026-10-25):** implementado en esta carpeta. Uso en `README.md`, verificación y pendientes en `TASK.md`. Este brief se conserva como especificación.

## Experiencia base

La pantalla mantiene un campo persistente de letras, números y fragmentos de código. Tras un prototipo simple, la implementación debería usar Canvas/WebGL o un DOM cuidadosamente medido para sostener FPS estables y consumo razonable durante muchas horas.

No copiar la lluvia de código, branding, color o composición exacta de *The Matrix*. El lenguaje debe seguir **Error 404 — CapDev not found**: fondo negro/carbón, blanco/gris, rojo, mono display, ruido y fallas de señal clínicas.

En intervalos aleatorios pero acotados y suficientemente deterministas para ensayo, los glifos convergen en un rostro o silueta hostil inspirada libremente en Claude y luego se disuelven otra vez en el campo. Es una IA maliciosa ficticia dentro de **Error 404 — CapDev not found**: no usar logo, trade dress ni assets oficiales de Anthropic salvo aprobación separada.

## Interludios de video

Ocasionalmente, un glitch/flicker corto corta el campo y reproduce un video local generado o provisto en el futuro; por ejemplo, falso CCTV de desarrolladores electrocutados o colapsando. Al terminar o fallar el video, la experiencia debe recuperar el ambiente sin quedar en negro.

Los videos serán assets futuros aportados por el usuario. **No generarlos ni implementarlos ahora.** Evitar gore explícito si no es necesario; el tratamiento CCTV, la interrupción y la consecuencia pueden producir el horror por implicación.

## Manifiesto y scheduler offline

La futura playlist debe vivir en un manifiesto local con identificadores estables, ruta relativa, tipo de medio, duración esperada, orientación/aspect ratio, peso de selección, cooldown y fallback. El scheduler debe:

- definir ventanas mínimas/máximas para rostro e interludios;
- permitir seed fija de ensayo y aleatoriedad en exhibición;
- imponer cooldowns y evitar repeticiones inmediatas;
- impedir que rostro y video compitan;
- precargar con un presupuesto de memoria y anticipación razonable;
- manejar `error`, timeout, codec no soportado y archivo faltante, regresando siempre al campo ambiental;
- registrar estado local útil para operador sin requerir red.

## Layout y operación

- Diseñar explícitamente para 16:9 y 9:16, con zonas seguras configurables para que rostro, texto y CCTV no queden detrás de marcos o UI del monitor.
- Aplicar desplazamientos sutiles y variación de composición para evitar burn-in; no mantener logos, texto o píxeles brillantes fijos durante horas.
- Arrancar en silencio. Video debe poder autoplay en mute y existir un control de operador para desbloquear audio mediante gesto. El flujo no puede depender de autoplay con sonido.
- Controles previstos: fullscreen/kiosco, mute/volumen, pausa, siguiente evento, reinicio, seed de ensayo, diagnóstico de assets y salida segura.
- El modo público debe ocultar controles hasta una combinación deliberada, pero conservar una vía de recuperación para el operador.
- Respetar `prefers-reduced-motion` y disponer de un modo estable con menos convergencia, flicker y desplazamiento. No usar destellos rápidos o peligrosos.

## Separación técnica

La próxima implementación debe elegir su propio paquete y arquitectura. Puede reutilizar tokens de **Error 404 — CapDev not found** y medios de `../assets/`, pero no importar estado ni componentes privados de `interactive-terminal`. Debe ser offline-first, no incluir APIs/telemetría por defecto y documentar exactamente cómo empaqueta y resuelve los medios locales.
