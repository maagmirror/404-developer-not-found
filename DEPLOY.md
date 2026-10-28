# Deploy con Docker / Easypanel

Las tres pantallas se buildean en **una sola imagen** y se sirven con un solo
nginx en el puerto 80, bajo rutas:

| Ruta           | Pantalla                                 |
| -------------- | ---------------------------------------- |
| `/`            | Portada con los tres links               |
| `/evil-ai/`    | Monitor con la IA hostil                 |
| `/terminal/`   | Terminal interactiva                     |
| `/terminated/` | Archivo de desarrolladores eliminados    |

El `Dockerfile` está en la raíz del repo: `node:22-alpine` corre `npm ci` y
`npm run build -- --base=/<ruta>/` en cada carpeta, y `nginx:1.27-alpine` sirve
los tres `dist/` más la portada (`docker/index.html`). La config de nginx está
en `docker/nginx.conf` (fallback SPA por pantalla, cache larga para `/assets/`,
endpoint `/healthz`).

## Easypanel (una sola App)

1. **+ Service → App**, por ejemplo `404_dev`.
2. **Source → GitHub**: este repo, rama `main`. **Build Path**: `/` (la raíz;
   ahí está el `Dockerfile`).
3. **Build → Dockerfile**. En *File* dejá `Dockerfile`.
4. **Domains**: un solo dominio, por ejemplo `404.nibiru.com.uy`, apuntando al
   **puerto 80** del contenedor. No hace falta poner puertos en el dominio ni
   agregar un dominio por pantalla: todo sale por el mismo host.
5. **Deploy**. El primer build tarda unos minutos (instala y compila las tres
   apps).

Después quedan accesibles en `https://404.nibiru.com.uy/evil-ai/`,
`https://404.nibiru.com.uy/terminal/` y `https://404.nibiru.com.uy/terminated/`,
y la portada en `https://404.nibiru.com.uy/`.

Para redeployar después de un push, usá el botón **Deploy** o activá el webhook
de auto-deploy en **Source**.

## Local

```bash
docker compose up --build
```

Abre en http://localhost:8080 (o `docker build -t error404 . && docker run --rm -p 8080:80 error404`).

## Notas

- No hay variables de entorno: todo es estático y se resuelve en build.
- Los videos de `evil-ai/media/videos/` y los recursos de `public/` entran en la
  imagen en el build. Si agregás clips, hacé commit y redeployá.
- `npm run dev` en cada carpeta sigue funcionando igual en `/`; el prefijo de
  ruta sólo se aplica en el build de Docker.
- Las apps piden pantalla completa y reproducen audio después de un gesto del
  usuario; abrilas en Chrome/Chromium y hacé un click inicial en la página.
