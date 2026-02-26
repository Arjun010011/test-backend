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
