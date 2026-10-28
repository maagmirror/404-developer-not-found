# Deploy con Docker / Easypanel

El repo tiene tres pantallas independientes, cada una es una app Vite + React
estática sin backend:

| Carpeta                | Pantalla                    | Puerto local (compose) |
| ---------------------- | --------------------------- | ---------------------- |
| `evil-ai/`             | Monitor con la IA hostil    | http://localhost:8081  |
| `interactive-terminal/`| Terminal interactiva        | http://localhost:8082  |
| `terminated/`          | Archivo de eliminados       | http://localhost:8083  |

Cada carpeta tiene su propio `Dockerfile` (multi-stage: `node:22-alpine` para
el build, `nginx:1.27-alpine` para servir `dist/` en el puerto 80), su
`nginx.conf` (fallback SPA a `index.html`, cache larga para `/assets/`, soporte
de range requests para video) y un endpoint `/healthz` para el health check.

## Local

```bash
docker compose up --build
```

O una sola pantalla:

```bash
docker build -t error404/evil-ai ./evil-ai
docker run --rm -p 8081:80 error404/evil-ai
```

## Easypanel

Opción recomendada: **una App por pantalla**, así cada una tiene su dominio y se
puede redeployar por separado.

Para cada pantalla (`evil-ai`, `interactive-terminal`, `terminated`):

1. En el proyecto de Easypanel: **+ Service → App**. Nombre: `evil-ai` (etc.).
2. **Source → GitHub**: elegí este repo y la rama (`main`).
   - **Build Path**: `/evil-ai` (la carpeta de la pantalla; es el contexto de
     build, así el `Dockerfile` y el `nginx.conf` se encuentran solos).
3. **Build → Dockerfile**. En *File* dejá `Dockerfile`.
4. **Domains**: agregá el dominio o usá el que genera Easypanel. **Port**: `80`.
5. **Deploy**. Easypanel clona el repo, corre `npm ci && npm run build` dentro
   de la imagen y levanta nginx. El primer build tarda un par de minutos.

Si preferís un solo servicio, también podés usar **+ Service → Compose** y pegar
el `docker-compose.yml` de la raíz (sacá los `ports` y mapeá cada servicio a un
dominio desde Easypanel, puerto `80`).

Para redeployar después de un push, usá el botón **Deploy** o activá el webhook
de auto-deploy en **Source**.

## Notas

- No hay variables de entorno: todo es estático y se resuelve en build.
- Los videos de `evil-ai/media/videos/` y los recursos de `public/` entran en la
  imagen en el build. Si agregás clips, hacé commit y redeployá.
- Las apps piden pantalla completa y reproducen audio después de un gesto del
  usuario; abrilas en Chrome/Chromium con un click inicial en la página.
