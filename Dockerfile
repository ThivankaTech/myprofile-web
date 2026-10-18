# ── Build stage ────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Copy only manifest files first so `npm ci` is cached
# independently of source-code changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# next.config.ts has output: "export", so this writes plain static files to
# /app/out. The profile data is bundled from src/data/profile.json, so the
# site needs no backend (NEXT_PUBLIC_API_URL is intentionally unset).
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS final
LABEL org.opencontainers.image.source="https://github.com/ThivankaTech/myprofile-web"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html

EXPOSE 8080

ENTRYPOINT ["nginx", "-g", "daemon off;"]
