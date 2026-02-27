# Project Documentation

## Overview
This project is a modern recruitment and applicant tracking platform built to handle role-based access, candidate profiles, and robust resume parsing. It provides a seamless experience for both candidates submitting their details and recruiters actively searching for talent.

## Technology Stack
- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: React 19 with Inertia.js 2.0
- **Styling & UI**: Tailwind CSS 4.0, Radix UI Primitives, Lucide Icons
- **Key Libraries**: 
  - `smalot/pdfparser` for extracting text and skills from PDF resumes.
  - `laravel/wayfinder` for tight frontend-backend routing integration.

## Recently Implemented Features

## Work Completed Today (February 27, 2026)

### 1. Recruiter Collections + Dashboard Module
- Added complete recruiter workflows:
  - Recruiter dashboard with candidate pipeline metrics.
  - Candidate listing/detail pages with status updates and starring.
  - Collection management (create, update, nested collections, attach candidates).
  - Recruiter comments and audit history tracking for status changes.
- Introduced backend foundations:
  - New recruiter controllers, requests, resources, policies, middleware, and `RecruiterService`.
  - New models: `RecruiterCollection`, `RecruiterComment`, `CandidateStatusHistory`, `Skill`.
  - New enum: `CandidateStatus`.
- Extended schema:
  - Added recruiter collections/comment/star/history tables.
  - Added `candidate_status`, education progress fields, and collection hierarchy support.
- Added/updated feature tests for login redirection, recruiter module flows, onboarding, and resume paths.

### 2. Candidate Story + Location Data Enhancements
- Extended `candidate_profiles` with storytelling and locality fields:
  - Added candidate story fields for richer profile context.
  - Added district support and location config (`config/location.php`).
- Updated candidate onboarding validation and save logic.
- Updated recruiter filtering/index requests and recruiter resources/service to expose and use new fields.
- Refreshed relevant recruiter and candidate UI pages/components to surface the new data.

### 3. Welcome Page UX Improvements
- Redesigned `resources/js/pages/welcome.tsx` with an improved layout and explicit workflow stages.
- Updated feature coverage in `tests/Feature/ExampleTest.php` for the welcome experience.

### 1. Role-Based Access Control
- **`Role` Enum**: Introduced a strict type-safe enum (`app/Enums/Role.php`) defining the core capabilities of users across the platform:
  - `Candidate`
  - `Admin` (Recruiters)
  - `SuperAdmin`

### 2. Resume Management System
- **`Resume` Model**: Built a comprehensive model (`app/Models/Resume.php`) to handle uploaded resumes.
- **Migration**: Added database schema (`2026_02_26_061251_create_resumes_table.php`) to store vital document metadata:
  - File properties: `original_name`, `file_path`, `mime_type`, `file_size`.
  - Content analysis: `raw_text` (the extracted text from the PDF) and `extracted_skills` (a parsed JSON array of detected skills for searchable indexing).
  - State management: `is_primary` flag to indicate the candidate's currently active resume.

### 3. Frontend Type Definitions
- **Auth Types (`auth.ts`)**: Structured the TypeScript definitions for the authenticated user object, including proper typing for standard attributes and Two-Factor Authentication (`TwoFactorSetupData`, `TwoFactorSecretKey`) to ensure type safety across the React frontend.

### 4. Database Seeding Implementation
- **E2E Test Data**: Updated `DatabaseSeeder.php` to provide a ready-to-use local environment. It automatically spins up:
  - A test Candidate user.
  - A Candidate Profile populated with initial skills (React, Laravel, Tailwind CSS).
  - A comprehensive Resume record to simulate document uploads and test the skill extraction schema.

### 5. Recruiter (Admin) Module

The Recruiter Module has been fully implemented with a SaaS-grade UI and robust backend architecture, fulfilling all requirements.

#### 1. Database Migrations
We created pivot tables and entities for the recruiter feature set:
- `recruiter_candidate_stars`: Tracks starred candidates per recruiter.
- `recruiter_collections` & `recruiter_collection_candidate`: Allows assigning candidates to custom collections.
- `recruiter_comments`: Private recruiter notes on candidates.
- `candidate_status_histories`: Audit log for candidate status changes.
- `candidate_status`: Enum column added to candidate profiles.

#### 2. Model Relationships
- **User**: Added `recruiterCollections`, `recruiterComments`, `starredByRecruiters`.
- **CandidateProfile**: Casts `candidate_status` to the `CandidateStatus` enum.
- **RecruiterCollection** / **RecruiterComment**: Belongs to `User` (Recruiter) and `User` (Candidate).

#### 3. Controller Skeletons
The backend is powered by localized singular controllers:
- `RecruiterDashboardController`: High-level recruitment metrics.
- `RecruiterCandidateController`: Core candidate listing, viewing, starring, and status updates.
- `RecruiterCollectionController`: Collection management.
- `RecruiterCandidateCommentController`: Private comment handling.

#### 4. Policies
Authorization is handled via Laravel Policies to ensure data isolation:
- `CandidateProfilePolicy`, `RecruiterCollectionPolicy`, `RecruiterCommentPolicy`.
- SuperAdmins bypass restrictions (`Gate::before`), while regular Recruiters (`Admin`) only view/modify their own collections and comments.

#### 5. Route Definitions
Routes are protected by `['auth', 'role:admin']` and prefixed with `/recruiter`:
- `GET /recruiter/dashboard`
- `GET /recruiter/candidates`, `GET /recruiter/candidates/{candidate}`
- `POST /recruiter/candidates/{candidate}/star`
- `PATCH /recruiter/candidates/{candidate}/status`
- `POST /recruiter/collections`

#### 6. Service Class Example
The `RecruiterService` encapsulates complex business logic to keep controllers clean. It handles candidate querying with efficient eager loading to prevent N+1 issues:
```php
public function queryCandidates(User $user, array $filters): LengthAwarePaginator
{
    return User::query()
        ->candidatesWithSkills($filters['search'] ? [$filters['search']] : [])
        // Filtering, sorting, and eager loading logic...
        ->paginate($filters['per_page']);
}
```

#### 7. React Layout Component
`RecruiterLayout.tsx` provides a responsive left-sidebar navigation with a clean content area, sticky header, global search, and a user dropdown, mirroring modern SaaS applications.

#### 8. Candidate Table Component
`candidate-table.tsx` features a modern data table mapping candidates to columns: Avatar, Name/Email, Skills (rendered as tag chips), Status Badge, and inline Star toggle actions.

#### 9. Example Filter Logic
In `index.tsx`, filtering relies on React state synchronized with Inertia routing completely debounced:
```tsx
const query = useMemo(() => ({
    search: search.trim() === '' ? null : search,
    status: status === '' ? null : status,
    starred: starred ? 1 : null,
}), [search, status, starred]);

useEffect(() => {
    router.get(index.url({ query }), {}, { preserveState: true, replace: true });
}, [query]);
```

#### 10. UI Styling Examples
Using TailwindCSS v4 with CSS-first configuration:
- Soft shadows, rounded-xl cards: `rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm`
- Status Badges: Defined dynamically using color maps (e.g., `bg-blue-100 text-blue-700`).

#### 11. Architectural Decisions
- **Inertia.js + Wayfinder**: We use `laravel/wayfinder` for strongly typed frontend routing, eliminating hardcoded URLs.
- **Service Repository Pattern**: `RecruiterService` isolates database queries from controllers.
- **Resource Classes**: `RecruiterCandidateResource` strictly shapes JSON responses, ensuring no sensitive data leaks.
- **Action-Driven Endpoints**: Features like starring and commenting use specific RESTful endpoints rather than massive generic update controllers.
