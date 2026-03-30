#!/usr/bin/env bash
set -euo pipefail

# Ensure runtime-writable directories exist and are writable.
mkdir -p storage/framework/{cache,sessions,views} bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true
chmod -R ug+rwX storage bootstrap/cache || true

cmd="${*:-}"
if [[ "$cmd" == *"artisan serve"* || "$cmd" == *"artisan queue:"* || "$cmd" == *"artisan schedule:"* ]]; then
  if [[ "$cmd" != *"artisan key:generate"* ]] && [[ -z "${APP_KEY:-}" ]]; then
    echo "ERROR: APP_KEY is empty. Set APP_KEY in your .env (run: php artisan key:generate)." >&2
    exit 1
  fi
fi

exec "$@"
