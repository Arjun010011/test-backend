##
# App image for production.
# Runs PHP 8.3 in-container so the EC2 host PHP version doesn't matter.
#
# Note: Vite Wayfinder plugin runs `php artisan wayfinder:generate` during `npm run build`,
# so the build stage includes PHP + Composer.
##

FROM php:8.4-cli-bookworm AS build
WORKDIR /var/www/html

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    gnupg \
    pkg-config \
    unzip \
    libicu-dev \
    libonig-dev \
    libsqlite3-dev \
    libzip-dev \
    libxml2-dev \
  && docker-php-ext-install \
    intl \
    mbstring \
    opcache \
    pdo_mysql \
    pdo_sqlite \
    zip \
  && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Node.js (for Vite build)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get update && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

COPY . .

# Build-time env to keep Artisan commands from requiring external services.
# (Wayfinder runs `php artisan wayfinder:generate` during `npm run build`.)
ENV APP_ENV=production
ENV APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
ENV DB_CONNECTION=sqlite
ENV DB_DATABASE=/var/www/html/database/database.sqlite
ENV CACHE_STORE=array
ENV SESSION_DRIVER=array
ENV QUEUE_CONNECTION=sync
ENV FILESYSTEM_DISK=local
ENV RESUME_STORAGE_DISK=local
ENV VIEW_COMPILED_PATH=/var/www/html/storage/framework/views

RUN mkdir -p database && touch database/database.sqlite
RUN mkdir -p storage/framework/{cache,sessions,views} bootstrap/cache

RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader

# Some apps touch the DB during boot; ensure tables exist for build-time artisan commands.
RUN php artisan migrate --force --no-interaction || (echo "---- laravel.log ----" && (tail -n 200 storage/logs/laravel.log 2>/dev/null || true) && exit 1)

# Wayfinder's Vite plugin runs this during `npm run build`. Running it explicitly first
# surfaces any underlying Laravel boot errors in Docker build logs.
RUN php artisan wayfinder:generate --with-form -vvv || (echo "---- laravel.log ----" && (tail -n 200 storage/logs/laravel.log 2>/dev/null || true) && exit 1)

RUN npm ci
RUN npm run build

FROM build AS app

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
