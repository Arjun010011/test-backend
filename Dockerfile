##
# Production container for Laravel + Inertia (React) app.
# Uses PHP 8.3 in-container so the EC2 host PHP version doesn't matter.
##

FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
  --no-dev \
  --prefer-dist \
  --no-interaction \
  --no-progress \
  --optimize-autoloader

FROM node:22-bookworm-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY resources ./resources
COPY public ./public
COPY vite.config.ts tsconfig.json components.json eslint.config.js .prettierrc .prettierignore ./
RUN npm run build

FROM php:8.3-fpm-bookworm AS app
WORKDIR /var/www/html

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libicu-dev \
    libonig-dev \
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

COPY . .
COPY --from=vendor /app/vendor ./vendor
COPY --from=frontend /app/public/build ./public/build

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["php-fpm"]

FROM nginx:1.27-alpine AS web
WORKDIR /var/www/html

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY public ./public
COPY --from=frontend /app/public/build ./public/build
