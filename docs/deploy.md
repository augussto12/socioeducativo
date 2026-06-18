# Socioeducativo - Deploy y Operacion

## Descripcion

Sistema socioeducativo para publicar informacion institucional, proyectos pedagogicos y registros/evidencias. Incluye sitio publico, panel ADMIN, panel STAFF, autenticacion, auditoria, uploads publicos/privados y persistencia en PostgreSQL.

Para la VPS actual de `desdeelpie.com.ar`, usar tambien [VPS_DEPLOY.md](./VPS_DEPLOY.md).

## Arquitectura

- Frontend: React + Vite, servido por Nginx.
- Backend: Node.js + Express + Prisma.
- Base de datos: PostgreSQL.
- Proxy: Nginx principal para `/`, `/api` y `/uploads/public`.
- Uploads:
  - Publicos: se descargan por `GET /api/files/:id` solo si el registro/proyecto siguen publicados.
  - Privados: se descargan por `GET /api/files/:id` con control de acceso.

## Roles

- ADMIN: gestiona contenido institucional, proyectos, miembros, usuarios, moderacion, publicacion y auditoria.
- STAFF: ve proyectos asignados, crea registros, edita registros propios si no estan publicados, sube archivos y consulta estados.
- Publico: ve contenido publico, proyectos publicos y registros `PUBLIC + PUBLISHED`.

## Comandos Locales

Backend:

```bash
cd Backend
npm install
npx prisma validate
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm start
```

Frontend:

```bash
cd Frontend
npm install
npm run build
npm run dev
```

Docker Compose:

```bash
cp .env.example .env
# Editar .env con secretos reales antes de levantar.
docker compose config --quiet
docker compose build backend frontend
docker compose up -d
docker compose logs -f backend
docker compose logs -f nginx
```

## Variables de Entorno

Backend minimas:

- `NODE_ENV`: `development` o `production`.
- `PORT`: puerto interno del backend.
- `DATABASE_URL`: URL PostgreSQL.
- `JWT_ACCESS_SECRET`: secreto largo para access tokens.
- `JWT_REFRESH_SECRET`: secreto largo para refresh tokens.
- `ACCESS_TOKEN_EXPIRES_IN`: ejemplo `15m`.
- `REFRESH_TOKEN_EXPIRES_IN`: ejemplo `7d`.
- `CORS_ORIGIN`: origenes permitidos separados por coma. Tambien define los origenes aceptados por la proteccion CSRF de endpoints con cookie.
- `COOKIE_DOMAIN`: dominio de cookie en produccion. En `desdeelpie.com.ar` dejar vacio para cookie host-only.
- `COOKIE_SECURE`: `true` con HTTPS.
- `COOKIE_SAME_SITE`: `strict`, `lax` o `none`. Normalmente `lax`; usar `none` solo con HTTPS y necesidad cross-site.
- `ADMIN_EMAIL`: email inicial de admin.
- `ADMIN_PASSWORD`: password inicial temporal.
- `UPLOAD_PUBLIC_DIR`: carpeta de uploads publicos.
- `UPLOAD_PRIVATE_DIR`: carpeta de uploads privados.
- `MAX_IMAGE_SIZE`, `MAX_DOCUMENT_SIZE`, `MAX_AUDIO_SIZE`, `MAX_VIDEO_SIZE`: limites en bytes.

Frontend:

- `VITE_API_URL`: URL base de API. En local: `http://localhost:3001/api`. En produccion con mismo dominio: `/api`.

Reglas:

- No commitear `.env`.
- No usar passwords ni secretos de desarrollo en produccion. Los secretos JWT deben ser largos, unicos y no reutilizados.
- `CORS_ORIGIN` debe apuntar al dominio real, no usar comodin.
- `COOKIE_SECURE=true` si hay HTTPS.
- El refresh token viaja solo en cookie HttpOnly bajo `/api/auth`; no enviarlo en body, query string ni storage del navegador.
- `REFRESH_TOKEN_EXPIRES_IN` tambien determina la vida de la cookie de refresh.
- `uploads/` debe ser escribible por el usuario no-root del contenedor backend.
- La CSP de Nginx permite recursos propios, imagenes HTTPS/data/blob y fuentes de Google; si se agregan proveedores externos hay que declararlos explicitamente.

## Prisma y Seed

Validacion:

```bash
cd Backend
npx prisma validate
npx prisma migrate status
npx prisma generate
```

Seed:

```bash
cd Backend
npm run db:seed
```

En produccion el seed omite proyectos de ejemplo por `NODE_ENV=production`. Debe crear solo admin inicial, contenidos institucionales minimos y categorias aprobadas.

## Nginx

El Nginx principal debe cumplir:

- `/` proxya al frontend.
- `/api/` proxya al backend.
- `/uploads/public/` devuelve 404; los archivos se sirven por `/api/files/:id` con control de acceso.
- `/uploads/private/` devuelve 404.
- `client_max_body_size` debe ser igual o mayor que `MAX_VIDEO_SIZE`.
- React Router fallback queda en el Nginx del frontend.
- No exponer `.env`, dotfiles ni directorios privados.
- En la VPS actual, Nginx Proxy Manager apunta a `socio_nginx:80`; por eso el servicio `nginx` debe estar conectado a la red externa `nginx-proxy-manager_default`.

## Healthchecks

- `GET /api/health`: liveness liviano. Debe responder `ok` si el proceso Express esta vivo. No expone `NODE_ENV` ni detalles internos.
- `GET /api/ready`: readiness. Devuelve 200 solo si PostgreSQL responde y las carpetas de uploads publicos/privados son escribibles por el backend.
- Docker usa `/api/ready` como healthcheck del backend y Nginx espera a que el backend este healthy antes de arrancar.
- Si `/api/ready` devuelve 503, revisar conectividad a PostgreSQL, migraciones pendientes y permisos del volumen `uploads/`.

## Backups

Backup PostgreSQL:

```bash
docker compose exec postgres pg_dump -U socio_admin -d socioeducativo -Fc > backups/socioeducativo_$(date +%Y%m%d_%H%M).dump
```

Restore PostgreSQL:

```bash
docker compose exec -T postgres pg_restore -U socio_admin -d socioeducativo --clean --if-exists < backups/socioeducativo_YYYYMMDD_HHMM.dump
```

Backup uploads:

```bash
tar -czf backups/uploads_$(date +%Y%m%d_%H%M).tar.gz uploads/
```

Antes de migraciones destructivas:

- Detener escrituras de usuarios.
- Ejecutar backup de PostgreSQL.
- Respaldar `uploads/`.
- Verificar que el dump restaura en entorno de prueba.
- Ejecutar `npx prisma migrate status`.

## Checklist Post Deploy

- `docker compose ps` muestra servicios healthy/running.
- `GET /api/health` responde `ok` desde Nginx.
- `GET /api/ready` responde `ready` desde Nginx.
- Home publica carga.
- Login ADMIN funciona.
- Login STAFF funciona.
- Registro `PUBLIC + PUBLISHED` se ve publicamente.
- Registro privado o pendiente no se ve publicamente.
- Upload permitido funciona.
- Upload privado no abre por URL directa.
- Logs no muestran secrets ni stack traces al cliente.
- Backups programados y probados.
