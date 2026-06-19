#!/bin/sh
set -e

mkdir -p /app/uploads/public /app/uploads/private /app/uploads/tmp
chown -R node:node /app/uploads

exec su-exec node "$@"
