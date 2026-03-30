#!/usr/bin/env bash
set -euo pipefail

# Ensure runtime-writable directories exist and are writable.
mkdir -p storage/framework/{cache,sessions,views} bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true
chmod -R ug+rwX storage bootstrap/cache || true

if [[ "${1:-}" == "php-fpm" || "${1:-}" == "php-fpm8.3" ]]; then
  # Laravel expects an APP_KEY for web requests; allow empty key for one-off admin commands
  # like `php artisan key:generate` before first boot.
  if [[ -z "${APP_KEY:-}" ]]; then
    echo "ERROR: APP_KEY is empty. Set APP_KEY in your .env (run: php artisan key:generate)." >&2
    exit 1
  fi
fi

exec "$@"
