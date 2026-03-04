# Project Brief

## Overview
This is a Laravel 12 + Inertia React recruitment platform with role-based portals for **candidates**, **recruiters/admins**, and **company users**.

Primary capabilities in the current codebase:
- Candidate onboarding + resume upload + profile completion workflow
- Recruiter-side candidate pipeline management (status, comments, stars, collections)
- Recruiter-side company management (approve/visibility/review applications)
- Company-side job posting/recruitment management
- Candidate-side job discovery and applications

## Tech Stack
- Backend: Laravel 12, PHP 8.4, Fortify auth, Wayfinder routes
- Frontend: React 19, Inertia v2, TypeScript, Tailwind v4
- DB: SQLite (in this environment), Eloquent ORM
- Testing: Pest

## User Roles
Defined in `App\Enums\Role`:
- `candidate`
- `company`
- `admin`
- `super_admin`

Role checks are done via middleware (`role:*`) and helper methods on `User` model (`isCandidate`, `isAdmin`, etc.).

## Core Route Areas
From `routes/web.php`:
- Public: welcome/home
- Authenticated candidate area:
  - `candidate/onboarding` (profile setup/update)
  - `candidate/resume`
  - `candidate/companies` + apply flow
- Recruiter/admin area (`/recruiter`):
  - dashboard + analytics
  - candidates CRUD-like pipeline operations
  - collections management
  - companies moderation/review
  - status catalog CRUD
- Company area (`/company`):
  - manage own recruitments and applications

## Candidate Onboarding Flow
Key pieces:
- Controller: `App\Http\Controllers\Candidate\OnboardingController`
- Request validation: `App\Http\Requests\Candidate\OnboardingRequest`
- Guard middleware: `EnsureCandidateOnboardingComplete`

Behavior:
- Candidate must complete profile (`profile_completed_at`) to access gated candidate pages.
- Onboarding captures education, address, links, skills, profile narrative fields.
- Resume upload is required if candidate has no existing resume.
- Resume text is parsed (`ScanResume`) and skills normalized (`NormalizeSkills`).

## Data Model (High Level)
Important models:
- `User` (role-based)
- `CandidateProfile`
- `Resume`
- `Company`
- `CompanyApplication`
- `RecruiterCollection`
- `RecruiterComment`
- `CandidateStatusHistory`
- `CandidateWorkflowStatus`
- `Skill`

Notable relationships:
- User has one candidate profile, many resumes
- Company has many applications
- Recruiters can star candidates, comment on candidates, and manage collections

## Frontend Structure
- Inertia pages under `resources/js/pages/...`
- Layouts for app/recruiter/company/auth contexts
- Reusable UI components in `resources/js/components/ui`
- Role-specific navigation and dashboards already implemented

## Current Scope / Limitations
At this commit (`823fcd5`), there is **no active assessment/test module** in routes. The platform is focused on onboarding, recruiting pipeline, company postings, and applications.

## Configuration Notes
- Location hierarchy (country/state/district/city rules): `config/location.php`
- Resume parsing/storage settings: `config/resume.php`
- Auth and role gating are central to flow access.

## Quick Start (Local)
- `composer install`
- `npm install`
- `cp .env.example .env`
- `php artisan key:generate`
- `php artisan migrate`
- `php artisan serve`
- `npm run dev`

## If another model/engine should continue work
When extending this project, first confirm:
1. Role + route guards are preserved.
2. Candidate onboarding middleware expectations remain valid.
3. Existing recruiter/company workflows are not regressed.
4. Inertia page/component naming conventions remain consistent.
5. Validation and policy rules align with current requests/controllers.
