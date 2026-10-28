# Una sola imagen con las tres pantallas, servidas por nginx bajo rutas:
#   /            portada con los tres links
#   /evil-ai/    monitor con la IA hostil
#   /terminal/   terminal interactiva
#   /terminated/ archivo de eliminados

FROM node:22-alpine AS build
WORKDIR /src

# Dependencias primero, para cachear la capa de npm ci entre builds.
COPY evil-ai/package.json evil-ai/package-lock.json ./evil-ai/
COPY interactive-terminal/package.json interactive-terminal/package-lock.json ./interactive-terminal/
COPY terminated/package.json terminated/package-lock.json ./terminated/
RUN cd evil-ai && npm ci \
 && cd ../interactive-terminal && npm ci \
 && cd ../terminated && npm ci

COPY evil-ai ./evil-ai
COPY interactive-terminal ./interactive-terminal
COPY terminated ./terminated

# --base hace que Vite genere las URLs de assets relativas a cada subruta.
RUN cd evil-ai && npm run build -- --base=/evil-ai/ \
 && cd ../interactive-terminal && npm run build -- --base=/terminal/ \
 && cd ../terminated && npm run build -- --base=/terminated/

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/index.html /usr/share/nginx/html/index.html
COPY --from=build /src/evil-ai/dist /usr/share/nginx/html/evil-ai
COPY --from=build /src/interactive-terminal/dist /usr/share/nginx/html/terminal
COPY --from=build /src/terminated/dist /usr/share/nginx/html/terminated

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
