# Recruitment Platform (Laravel + Inertia)

## Overview
This is a role-based recruitment platform built with Laravel 12, Inertia React, and Tailwind CSS.

The app supports 4 roles:
- `candidate`
- `company`
- `admin` (recruiter)
- `super_admin`

## Stack
- PHP 8.4
- Laravel 12
- Inertia.js v2 + React 19 + TypeScript
- Tailwind CSS v4
- Fortify authentication
- Pest test suite

## Local Setup
1. Install dependencies:
```bash
composer install
npm install
```
2. Configure environment:
```bash
cp .env.example .env
php artisan key:generate
```
3. Run database migrations and seed:
```bash
php artisan migrate --seed
```
4. Start development services:
```bash
composer run dev
```

## Demo Accounts (from Seeder)
Password for all seeded users: `password`

- Recruiter (`admin`): `priya.menon@talentbridge.demo`
- Company: `ananya.iyer@cloudmosaic.demo`
- Company: `rahul.malhotra@zenithpay.demo`
- Candidate: `aarav.sharma@candidate.demo`
- Candidate: `nisha.verma@candidate.demo`

## Features by Login Role
### Candidate Login
- Complete onboarding profile (education, skills, links, profile story)
- Upload resume and keep a primary resume
- Browse public approved jobs and apply
- Take assigned assessments and view results
- View personal dashboard/profile summary

Notes:
- Candidate routes are protected by `verified` and `candidate.onboarding` middleware.
- Candidate onboarding completion unlocks full candidate flows.

### Recruiter Login (`admin` / `super_admin`)
- Recruiter dashboard and analytics
- Candidate pipeline management:
  - status updates
  - stars
  - comments
  - collections
  - resume download
- Company moderation:
  - review company postings
  - approve/visibility controls
  - review applications
- Assessment management:
  - create assessments
  - assign to candidates
  - view analytics and scoreboard

### Company Login
- Create and manage own recruitment postings
- Control visibility (private/public) after approval
- Review incoming applications and update application status
- View candidate details for own applications

## Why Recruiter/Admin Is Created Through Terminal
Public registration intentionally supports only:
- `candidate`
- `company`

Recruiter/admin users are privileged users and are intentionally **not** self-signup roles. Creating recruiter accounts through terminal/admin provisioning prevents role escalation by public users and keeps access controlled.

This is enforced in `app/Actions/Fortify/CreateNewUser.php`, where allowed signup roles are only candidate and company.

## Create Users Through Terminal
Use `php artisan tinker --execute` for one-line provisioning.

### 1) Create Candidate
```bash
php artisan tinker --execute="use App\Models\User; use App\Enums\Role; use Illuminate\Support\Facades\Hash; User::updateOrCreate(['email' => 'candidate.new@example.com'], ['name' => 'New Candidate', 'password' => Hash::make('password'), 'role' => Role::Candidate, 'email_verified_at' => now()]);"
```

### 2) Create Company User
```bash
php artisan tinker --execute="use App\Models\User; use App\Enums\Role; use Illuminate\Support\Facades\Hash; User::updateOrCreate(['email' => 'company.new@example.com'], ['name' => 'New Company User', 'password' => Hash::make('password'), 'role' => Role::Company, 'email_verified_at' => now()]);"
```

### 3) Create Recruiter (`admin`)
```bash
php artisan tinker --execute="use App\Models\User; use App\Enums\Role; use Illuminate\Support\Facades\Hash; User::updateOrCreate(['email' => 'recruiter.new@example.com'], ['name' => 'New Recruiter', 'password' => Hash::make('password'), 'role' => Role::Admin, 'email_verified_at' => now()]);"
```

### 4) Optional: Create Super Admin
```bash
php artisan tinker --execute="use App\Models\User; use App\Enums\Role; use Illuminate\Support\Facades\Hash; User::updateOrCreate(['email' => 'superadmin.new@example.com'], ['name' => 'New Super Admin', 'password' => Hash::make('password'), 'role' => Role::SuperAdmin, 'email_verified_at' => now()]);"
```

### 5) Confirm a User Role
```bash
php artisan tinker --execute="use App\Models\User; dump(User::query()->where('email', 'recruiter.new@example.com')->value('role'));"
```

## Login Redirect Behavior
After login, users are redirected by role:
- `admin` / `super_admin` -> recruiter dashboard
- `company` -> company dashboard
- `candidate` -> candidate dashboard

## Testing
Run all tests:
```bash
php artisan test --compact
```

Run a specific file:
```bash
php artisan test --compact tests/Feature/Recruiter/RecruiterModuleTest.php
```

## Deploy on EC2 (Docker, PHP 8.3 in-container)
This repo includes a production-oriented `Dockerfile` + `docker-compose.yml` that runs PHP inside containers, so the EC2 host PHP version does not need to match.

### 1) Copy env + set production values
```bash
cp .env.example .env
```
Update at least:
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=http://<your-ec2-ip-or-domain>`
- `APP_KEY=...` (generate once)
- Database (`DB_*`) to your production DB (recommended: RDS)
- Resume storage: set `RESUME_STORAGE_DISK=s3` (recommended) or `local`

### 2) Build + start containers
```bash
docker-compose build
docker-compose run --rm app php artisan key:generate
docker-compose up -d
docker-compose exec app php artisan migrate --force
docker-compose exec app php artisan optimize
```

### 3) Open inbound ports
In the EC2 Security Group inbound rules:
- Allow `80` (and `443` if you add TLS) from `0.0.0.0/0`
- Restrict `22` (SSH) to your IP
