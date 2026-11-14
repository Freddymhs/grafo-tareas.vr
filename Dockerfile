# La VR servida desde el Mac Mini (FASE 27 de grafo-tareas): build estático con npm y nginx sin root.
# El build lo hace Docker con npm, nunca pnpm (package-lock.json es el lockfile de este repo).
FROM node:22-alpine AS build
WORKDIR /app
# Vite fija las VITE_* en el build: la URL de la API viaja en los archivos. Sin ella el build falla en vez de caer
# en silencio a localhost:3000, que en el visor solo existe con `adb reverse`.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# Husky instala hooks de git en `prepare`; en la imagen no hay .git ni commits.
ENV HUSKY=0
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN test -n "$VITE_API_URL" || { echo "falta --build-arg VITE_API_URL" >&2; exit 1; }
RUN npm run build

# nginx-unprivileged ya corre como el usuario `nginx` (uid 101) y escucha en 8080: la regla global §9 sin adduser.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS production
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
