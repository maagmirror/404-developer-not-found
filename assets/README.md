# Medios compartidos de Error 404 — CapDev not found

Este directorio es el hogar compartido de imágenes, audio, video y datos que puedan consumir varias aplicaciones de **Error 404 — CapDev not found**. No contiene assets reales todavía y no debe acoplar una aplicación a las carpetas internas de otra.

Estructura propuesta cuando exista contenido:

```text
assets/
  images/
  audio/
  video/
  data/
  PROVENANCE.md
```

## Convenciones

- Usar nombres sanitizados, estables y descriptivos: minúsculas ASCII, guiones, sin espacios ni caracteres reservados. Ejemplo: `dev-01-portrait-v01.webp`.
- Referenciar por rutas relativas o mediante un manifiesto local; no incrustar rutas absolutas del equipo.
- Registrar en `PROVENANCE.md` el archivo, autor/fuente, fecha, licencia o permiso, transformaciones y aplicaciones autorizadas. No agregar contenido sin procedencia clara.
- Eliminar secretos, coordenadas, nombres privados no aprobados y metadata EXIF/XMP innecesaria antes de incorporar un archivo.
- Documentar dimensiones, aspect ratio, duración, codec y tamaño. Preferencias offline habituales: WebP/PNG/JPEG para imagen, WAV/OGG/MP3 según compatibilidad para audio y MP4 H.264/AAC o WebM como video, verificando los navegadores objetivo.
- Optimizar archivos grandes y generar variantes apropiadas para 16:9, 9:16 o thumbnails cuando evite decodificación y escalado costosos.
- Definir fallbacks de poster, imagen o silencio para archivos faltantes y codecs no soportados.

GitHub impone una preocupación práctica alrededor de **100 MiB por archivo**. Antes de añadir videos grandes, decidir y documentar si se usará Git LFS o almacenamiento alternativo y cómo se obtiene una copia offline reproducible. No subir primero el binario para decidir después.

No ignorar este directorio completo en Git: la documentación, manifiestos, placeholders y assets pequeños aprobados deben poder versionarse deliberadamente.
