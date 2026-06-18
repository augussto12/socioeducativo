# QA Checklist Socioeducativo

## Publico

- [ ] Home carga sin login.
- [ ] Quienes somos carga sin login.
- [ ] Proyectos publicos cargan sin login.
- [ ] Detalle de proyecto publico carga por slug.
- [ ] Registro `PUBLIC + PUBLISHED` se ve publicamente.
- [ ] Registro `PRIVATE` no se ve publicamente.
- [ ] Registro `PENDING_REVIEW` no se ve publicamente.
- [ ] Registro de proyecto `PRIVATE` no se ve publicamente.

## Auth

- [ ] Login ADMIN.
- [ ] Login STAFF.
- [ ] Logout.
- [ ] Refresh token.
- [ ] Refresh token solo funciona por cookie HttpOnly, no por body.
- [ ] `GET /api/auth/me`.
- [ ] Usuario desactivado no puede operar.
- [ ] Usuario no autenticado no entra a `/admin`.
- [ ] Usuario no autenticado no entra a `/staff`.

## Admin

- [ ] Dashboard carga.
- [ ] Editar contenido institucional.
- [ ] Crear proyecto.
- [ ] Editar proyecto.
- [ ] Eliminar proyecto con soft delete.
- [ ] Cambiar proyecto `PUBLIC/PRIVATE`.
- [ ] Asignar STAFF.
- [ ] Quitar STAFF.
- [ ] Crear usuario STAFF.
- [ ] Desactivar usuario STAFF.
- [ ] Moderar registro.
- [ ] Publicar registro.
- [ ] Rechazar registro con comentario.
- [ ] Ver auditoria.
- [ ] Mutaciones admin criticas generan auditoria en la misma transaccion.

## Staff

- [ ] Ver solo proyectos asignados.
- [ ] No ver proyectos no asignados.
- [ ] Crear registro en proyecto asignado.
- [ ] No crear registro en proyecto no asignado.
- [ ] Ver estado de revision.
- [ ] Ver comentario de rechazo.
- [ ] Subir archivo permitido.
- [ ] Rechazar archivo no permitido.
- [ ] Descargar archivo privado autenticado.
- [ ] No publicar registros.

## Permisos y Seguridad

- [ ] STAFF no puede llamar endpoints admin.
- [ ] STAFF no puede editar proyecto.
- [ ] STAFF no puede asignarse a proyectos.
- [ ] STAFF no puede publicar registros.
- [ ] STAFF no puede editar registros de proyectos no asignados.
- [ ] Publico no puede acceder a endpoints privados.
- [ ] Publico no puede descargar archivos privados.
- [ ] `/uploads/private` no se sirve directo por Nginx.
- [ ] Tokens invalidos o expirados devuelven 401.
- [ ] POST cross-site con cookie de refresh se rechaza por CSRF.
- [ ] Roles insuficientes devuelven 403.
- [ ] Soft deletes no aparecen en listados publicos.

## Uploads

- [ ] `UPLOAD_PUBLIC_DIR` existe.
- [ ] `UPLOAD_PRIVATE_DIR` existe.
- [ ] Carpetas se crean si no existen.
- [ ] Nombres fisicos usan UUID/nombre seguro.
- [ ] `originalName` se guarda solo como metadata.
- [ ] Imagen permitida funciona.
- [ ] PDF permitido funciona.
- [ ] Audio permitido funciona.
- [ ] Video permitido funciona.
- [ ] Documento permitido funciona.
- [ ] Extension y MIME se validan juntos.
- [ ] `.exe` rechazado.
- [ ] `.bat` rechazado.
- [ ] `.sh` rechazado.
- [ ] `.php` rechazado.
- [ ] `.js` rechazado.
- [ ] Archivo privado requiere token.
- [ ] Archivo publico se sirve por `/api/files/:id` solo si el registro/proyecto siguen publicados.
- [ ] Eliminacion borra metadata y archivo fisico.

## Docker

- [ ] `docker compose config --quiet`.
- [ ] `docker compose build backend frontend`.
- [ ] `docker compose up -d`.
- [ ] Logs backend sin errores.
- [ ] Logs frontend/nginx sin errores.
- [ ] Frontend carga desde puerto configurado.
- [ ] `/api/health` responde desde Nginx.
- [ ] `/api/ready` responde `ready` desde Nginx.
- [ ] Login funciona desde contenedores.
- [ ] Carga publica funciona.
- [ ] Panel admin funciona.
- [ ] Panel staff funciona.
- [ ] Uploads funcionan dentro de contenedores.
- [ ] Persistencia de uploads validada.
- [ ] Persistencia PostgreSQL validada.

## Deploy

- [ ] `.env` real creado fuera de git.
- [ ] Secrets largos y unicos.
- [ ] `COOKIE_SECURE=true` con HTTPS.
- [ ] `CORS_ORIGIN` apunta al dominio real.
- [ ] `COOKIE_SAME_SITE` usa `strict`, `lax` o `none`.
- [ ] Backup PostgreSQL ejecutado antes de migrar.
- [ ] Backup uploads ejecutado antes de migrar.
- [ ] `npx prisma migrate status` revisado.
- [ ] Post-deploy smoke test completo.
