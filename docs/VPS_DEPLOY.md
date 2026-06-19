# Deploy VPS - desdeelpie.com.ar

## Contexto Actual

- Servidor: `31.97.241.220`.
- Directorio del proyecto: `/home/socioeducativo`.
- Dominio: `https://desdeelpie.com.ar`.
- Nginx Proxy Manager apunta `desdeelpie.com.ar` a `socio_nginx:80`.
- Por eso `socio_nginx` debe estar unido a la red Docker externa `nginx-proxy-manager_default`.
- Puerto directo de prueba: `8094`.

## Variables Requeridas

El archivo real de produccion va en la VPS, no en GitHub:

```bash
/home/socioeducativo/.env
```

Debe tener exactamente estos nombres:

```bash
DB_PASSWORD=CAMBIAR_POR_PASSWORD_LARGO_POSTGRES

JWT_ACCESS_SECRET=CAMBIAR_POR_SECRETO_LARGO_ACCESS
JWT_REFRESH_SECRET=CAMBIAR_POR_SECRETO_LARGO_REFRESH
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

CORS_ORIGIN=https://desdeelpie.com.ar
COOKIE_DOMAIN=
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax

ADMIN_EMAIL=admin@desdeelpie.com.ar
ADMIN_PASSWORD=CAMBIAR_POR_PASSWORD_TEMPORAL_ADMIN

NGINX_PORT=8094

MAX_IMAGE_SIZE=10485760
MAX_DOCUMENT_SIZE=26214400
MAX_AUDIO_SIZE=52428800
MAX_VIDEO_SIZE=262144000
```

Notas:

- `DATABASE_URL` no se carga en el `.env` raiz de la VPS. `docker-compose.yml` la construye internamente usando `DB_PASSWORD`.
- `COOKIE_DOMAIN` queda vacio para cookie host-only en `desdeelpie.com.ar`.
- `ADMIN_PASSWORD` se usa para crear o asegurar el admin inicial. Debe cambiarse despues del primer ingreso.
- Los secretos JWT deben ser largos, distintos entre si y no reutilizados en otros proyectos.
- No subir `/home/socioeducativo/.env` a GitHub.

No usar los nombres viejos `JWT_SECRET`, `JWT_EXPIRATION` ni `JWT_REFRESH_EXPIRATION` en el deploy con Docker Compose.

## Secrets Requeridos En GitHub Actions

GitHub solo necesita secretos para entrar por SSH a la VPS:

```bash
VPS_HOST=31.97.241.220
VPS_USER=USUARIO_SSH
VPS_PASSWORD=PASSWORD_DEL_USUARIO_SSH
VPS_PORT=22
```
        
Se cargan en:           

```text
GitHub > Settings > Secrets and variables > Actions
```

o en el environment `production` si el repositorio lo usa:

```text
GitHub > Settings > Environments > production > Environment secrets
```

No cargar `DB_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` ni `ADMIN_PASSWORD` como GitHub secrets para este deploy. Esas variables viven en `/home/socioeducativo/.env`.

Nota: este workflow esta configurado para autenticar por password porque el repositorio ya tiene `VPS_PASSWORD` cargado. Si mas adelante se quiere usar clave privada SSH, cambiar `password` por `key` en `.github/workflows/deploy.yml` y crear el secret `VPS_PRIVATE_KEY`.

## Crear El .env En La VPS

En la VPS:

```bash
cd /home/socioeducativo
nano .env
```

Pegar el bloque de variables de arriba y reemplazar todos los valores `CAMBIAR_POR_...`.

Para generar secretos desde la VPS:

```bash
openssl rand -base64 48
```

Ejecutar ese comando una vez para `DB_PASSWORD`, otra para `JWT_ACCESS_SECRET`, otra para `JWT_REFRESH_SECRET` y otra para `ADMIN_PASSWORD`.

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
