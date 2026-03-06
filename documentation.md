# Project Documentation

Last updated: March 6, 2026

## 1. Product Summary
This project is a role-based recruitment platform where:
- Candidates complete onboarding, upload resumes, and apply to published company opportunities.
- Recruiters manage candidate pipelines, comments, stars, collections, workflow statuses, and company approvals.
- Company users create and manage their own recruitment postings and review applications.

The app is server-driven Laravel with Inertia + React pages for the frontend.

## 2. Stack and Runtime
- Backend: Laravel 12.53.0
- PHP: 8.4.1
- Frontend: React 19.2 + Inertia.js 2 (`@inertiajs/react`, `inertiajs/inertia-laravel`)
- Styling: Tailwind CSS 4
- Authentication: Laravel Fortify
- Routing integration in frontend: Laravel Wayfinder
- Tests: Pest 4 + PHPUnit 12
- Database engine in this environment: SQLite

## 3. High-Level Architecture
The application follows a domain-oriented structure:
- HTTP controllers orchestrate requests and return Inertia pages.
- Form Request classes encapsulate validation.
- Policies and role middleware enforce authorization.
- Service layer (`RecruiterService`) handles heavier recruiter workflows and query logic.
- Eloquent models define relationships and persistence.

Core domain areas:
- Candidate domain
- Recruiter domain
- Company domain
- Shared auth/settings domain

## 4. Role Model and Access Control
Roles are defined in `App\Enums\Role`:
- `candidate`
- `company`
- `admin` (recruiter)
- `super_admin`

Access is enforced by:
- `role:*` middleware alias (`EnsureUserHasRole`)
- `candidate.onboarding` middleware alias (`EnsureCandidateOnboardingComplete`)
- Policy classes for candidate profiles, recruiter collections, and recruiter comments

Important behavior:
- `super_admin` bypasses role checks in middleware and has cross-recruiter visibility in recruiter features.
- Non-super-admin recruiters only access completed candidate profiles.
- Public signup allows only candidate and company roles; recruiter/admin must be provisioned through trusted admin/terminal flow.

## 5. Route and Module Breakdown

### Public
- `GET /` -> welcome page

### Candidate Routes (`auth`, `verified`, `candidate.onboarding`)
- `GET/POST candidate/onboarding`
- `GET/POST candidate/resume`
- `GET candidate/resume/{resume}`
- `GET candidate/companies`
- `POST candidate/companies/{company}/apply`
- `GET dashboard`

### Recruiter Routes (`auth`, `role:admin`, `/recruiter` prefix)
- Dashboard and analytics
- Candidate list/show/update/delete
- Candidate status updates
- Candidate comments CRUD
- Candidate star toggling
- Candidate collection attach/remove
- Candidate primary resume download
- Collection CRUD and detail
- Company moderation and application review
- Workflow status create/delete

### Company Routes (`auth`, `verified`, `role:company`, `/company` prefix)
- Company dashboard
- Recruitment CRUD
- Recruitment visibility update
- Recruitment application detail/update/delete

## 6. Data Model Overview

### User-Centric Tables
- `users`: role-aware identity and authentication
- `candidate_profiles`: onboarding profile + education progress + candidate status + location and story fields
- `resumes`: uploaded resume metadata, extracted skills, raw parsed text

### Recruiter Workflow Tables
- `recruiter_candidate_stars`
- `recruiter_collections`
- `recruiter_collection_candidate`
- `recruiter_comments`
- `candidate_status_histories`
- `candidate_workflow_statuses`

### Company Workflow Tables
- `companies`
- `company_applications`

## 7. Key Workflows

### Candidate Onboarding and Resume Flow
1. Candidate visits onboarding form.
2. Candidate submits profile and optionally resume.
3. Resume is scanned and parsed (`ScanResume`) for extracted skills and raw text.
4. Candidate profile is updated with merged/normalized skills and categorized skill buckets.
5. `profile_completed_at` is set, enabling full candidate visibility to recruiters.

Notes:
- Skills are constrained against active skill catalog (`skills` table) when available.
- Semester progression fields are tracked for pass-out projections.

### Candidate Resume Upload Flow
- Upload creates a new `resumes` row.
- Uploaded resume is marked `is_primary = true`.
- Older resumes for the same user are demoted to `is_primary = false`.
- Recruiters can fetch candidate primary resume inline view through recruiter route.

### Recruiter Candidate Pipeline Flow
- Candidate listing supports filtering by:
  - search text (name/email/resume raw text/skill arrays)
  - status
  - starred
  - passed-out
  - collection
- Recruiters can:
  - toggle star
  - update status (with history logging)
  - add/update/delete private comments
  - attach/remove candidate in collections
  - apply global update (status + comment + collection sync)

### Status Management Flow
- Default workflow statuses are seeded by migration:
  - `new`, `in_review`, `shortlisted`, `rejected`, `hired`
- Recruiters can create custom statuses (`recruiter/statuses`) with generated keys and color.
- Default statuses cannot be deleted.
- A status currently used by any `candidate_profiles.candidate_status` cannot be deleted.

### Company Posting and Application Flow
Company user:
- Creates recruitment posting (`source = company`, `approval_status = pending`, `visibility = private`, `is_active = false`).
- Can update posting details and visibility.
- Can review and update application status + review note.

Recruiter user:
- Views all company postings with filters.
- Can create recruiter-origin postings (`source = recruiter`, auto-approved).
- Can approve pending postings and manage visibility.
- Can review company applications similarly.

Candidate user:
- Can only see companies where `is_active = true`, `approval_status = approved`, and `visibility = public`.
- Applies once per company via `firstOrCreate` behavior.

## 8. Service-Layer Details (`RecruiterService`)
`RecruiterService` centralizes recruiter business logic:
- Candidate listing query composition and pagination
- Recruiter dashboard metrics
- Candidate visibility checks
- Status updates with transaction + history row
- Comment creation
- Candidate deletion with resume file cleanup
- Collection creation/update/delete and hierarchy safety
- Collection membership sync logic
- Cross-database JSON-like skill search handling (SQLite/MySQL/Postgres branches)
- Passed-out computation query logic based on graduation year or projected semester

This service is the primary place to extend recruiter business rules.

## 9. Middleware, Policy, and Safety Notes
- `EnsureCandidateOnboardingComplete`: candidates without completed onboarding are redirected to onboarding routes.
- `EnsureUserHasRole`: role gate with super admin bypass.
- Policies limit recruiter-owned comments/collections to owner recruiters unless super admin.

Operational safety defaults in `AppServiceProvider`:
- Production destructive DB commands are prohibited.
- Production password defaults are stricter.
- Carbon immutable dates are used globally.

## 10. Frontend Structure (Inertia Pages)
Pages live under `resources/js/pages` and are grouped by domain:
- `auth/*`
- `candidate/*`
- `recruiter/*`
- `company/*`
- `settings/*`
- `dashboard.tsx`, `welcome.tsx`

This keeps backend route groups and frontend page groups aligned.

## 11. Validation Layer
Validation is handled through Form Request classes, including:
- Candidate requests for onboarding/resume/apply
- Recruiter requests for candidate filters, status updates, comment/collection actions, and company actions
- Company requests for recruitment CRUD and application review
- Settings requests for profile/password/2FA updates

When adding endpoints, follow the same pattern: create a dedicated Form Request instead of inline controller validation.

## 12. Seed Data and Catalogs
`DatabaseSeeder` currently seeds:
- Skill catalog entries from `config('resume.skill_catalog')`
- A demo verified candidate user
- A candidate profile with sample skills
- A sample primary resume record

Useful for local bootstrapping and quick UI verification.

## 13. Testing Coverage Snapshot
Current tests include:
- Auth and verification flows
- Candidate onboarding and resume features
- Recruiter module behavior
- Company enrollment and company portal workflow
- Dashboard and login redirection behavior
- Settings pages (profile/password/2FA)

Representative suites:
- `tests/Feature/Recruiter/RecruiterModuleTest.php`
- `tests/Feature/CompanyPortalWorkflowTest.php`
- `tests/Feature/CandidateOnboardingTest.php`
- `tests/Feature/CandidateResumeTest.php`

## 14. Local Development
Install and run:
- `composer install`
- `npm install`
- `php artisan migrate --seed`
- `composer run dev`

Run tests:
- `php artisan test --compact`

If frontend assets are stale or missing:
- `npm run dev` for watch mode
- `npm run build` for production build

## 15. Role Provisioning Through Terminal
Recommended for local/dev bootstrap of privileged roles.

Why:
- Public registration intentionally allows only `candidate` and `company`.
- `admin` and `super_admin` are privileged roles and are kept out of self-signup to prevent privilege escalation.

Create users:
```bash
# Candidate
php artisan tinker --execute="use App\Models\User; use App\Enums\Role; use Illuminate\Support\Facades\Hash; User::updateOrCreate(['email' => 'candidate.new@example.com'], ['name' => 'New Candidate', 'password' => Hash::make('password'), 'role' => Role::Candidate, 'email_verified_at' => now()]);"

# Company
php artisan tinker --execute="use App\Models\User; use App\Enums\Role; use Illuminate\Support\Facades\Hash; User::updateOrCreate(['email' => 'company.new@example.com'], ['name' => 'New Company User', 'password' => Hash::make('password'), 'role' => Role::Company, 'email_verified_at' => now()]);"

# Recruiter (admin)
php artisan tinker --execute="use App\Models\User; use App\Enums\Role; use Illuminate\Support\Facades\Hash; User::updateOrCreate(['email' => 'recruiter.new@example.com'], ['name' => 'New Recruiter', 'password' => Hash::make('password'), 'role' => Role::Admin, 'email_verified_at' => now()]);"
```

Login redirects:
- `admin` / `super_admin` -> `recruiter.dashboard`
- `company` -> `company.dashboard`
- `candidate` -> `dashboard`

## 16. Extension Guidance for Next Developers
When adding features, prefer existing patterns:
- Add new business logic in service classes if controller actions become complex.
- Add dedicated Form Requests for each write operation.
- Reuse role middleware and policies for access constraints.
- Keep domain alignment across:
  - routes in `routes/web.php`
  - controllers in `app/Http/Controllers/<Domain>`
  - Inertia pages in `resources/js/pages/<domain>`
- Add/update Pest feature tests for every behavior change.

Recommended order for larger feature work:
1. Migration + model relationship updates.
2. Form Request validation.
3. Service-layer logic.
4. Controller endpoints.
5. Inertia page updates.
6. Feature tests.

## 17. Work Completed Today (March 6, 2026)
- Updated the welcome page UI copy and visual styling for workflow stage communication.
- Refactored settings pages to use a shared `SettingsPageLayout` component and adjusted related layout rendering.
- Improved recruiter company applications UX with search, filter, and sort controls.
- Enhanced candidate assessment flow:
  - Improved scoring and result display (including correct answers and total question count).
  - Improved fullscreen/session handling and appearance cookie behavior.
  - Integrated MediaPipe tasks for stronger face detection/landmarking behavior during assessments.
- Updated recruiter and candidate assessment pages/controllers and related routing/request handling, including removal of obsolete assignment request/page files.
- Expanded and adjusted seed data for local development in `DatabaseSeeder`.
- Added/updated test coverage for assessment behavior, appearance cookie behavior, auth flow, candidate assessment flow, and settings profile updates.
- Removed an accidental `host` gitlink from the repository history.
