# Deploy VPS - desdeelpie.com.ar

## Contexto Actual

- Servidor: `31.97.241.220`.
- Directorio del proyecto: `/home/socioeducativo`.
- Dominio: `https://desdeelpie.com.ar`.
- Nginx Proxy Manager apunta `desdeelpie.com.ar` a `socio_nginx:80`.
- Por eso `socio_nginx` debe estar unido a la red Docker externa `nginx-proxy-manager_default`.
- Puerto directo de prueba: `8094`.

## Variables Requeridas

El archivo `/home/socioeducativo/.env` debe usar los nombres nuevos:

```bash
DB_PASSWORD=...

JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

CORS_ORIGIN=https://desdeelpie.com.ar
COOKIE_DOMAIN=
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax

ADMIN_EMAIL=admin@desdeelpie.com.ar
ADMIN_PASSWORD=...

NGINX_PORT=8094

MAX_IMAGE_SIZE=10485760
MAX_DOCUMENT_SIZE=26214400
MAX_AUDIO_SIZE=52428800
MAX_VIDEO_SIZE=262144000
```

No usar los nombres viejos `JWT_SECRET`, `JWT_EXPIRATION` ni `JWT_REFRESH_EXPIRATION` en el deploy con Docker Compose.

## Deploy Manual

```bash
cd /home/socioeducativo
git fetch origin main
git reset --hard origin/main

docker network inspect nginx-proxy-manager_default >/dev/null
docker compose config --quiet
docker compose up -d --build --remove-orphans
docker compose ps
```

El backend ejecuta `npx prisma migrate deploy` al arrancar. La migracion `20260618190000_add_refresh_sessions` debe aplicarse en este deploy si aun no existe la tabla `refresh_sessions`.

## Smoke Test

```bash
curl -fsS http://127.0.0.1:8094/api/health
curl -fsS http://127.0.0.1:8094/api/ready
curl -I https://desdeelpie.com.ar/
curl -fsS https://desdeelpie.com.ar/api/health
curl -fsS https://desdeelpie.com.ar/api/ready
```

Resultado esperado:

- `/api/health`: `{"status":"ok",...}`.
- `/api/ready`: `{"status":"ready",...}`.
- `docker compose ps`: `socio_backend` healthy, `socio_db` healthy, frontend/nginx running.

## Si Algo Falla

```bash
docker compose ps
docker compose logs --tail=160 backend
docker compose logs --tail=160 nginx
docker compose exec backend npx prisma migrate status
docker compose exec postgres psql -U socio_admin -d socioeducativo -c '\dt'
```

Errores tipicos:

- Falta `refresh_sessions`: no corrio `migrate deploy` o el backend no arranco.
- `socio_nginx` no responde por dominio: revisar que este conectado a `nginx-proxy-manager_default`.
- Login falla con cookies: revisar `CORS_ORIGIN=https://desdeelpie.com.ar`, `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=lax` y que el sitio cargue por HTTPS.
