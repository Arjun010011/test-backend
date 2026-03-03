import { Head, Link, usePage } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    FileText,
    GraduationCap,
    MapPin,
    Sparkles,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { edit as editOnboarding } from '@/routes/candidate/onboarding';
import { show as showResume } from '@/routes/candidate/resume';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

type CandidateResume = {
    id: number;
    original_name: string;
    file_size: number;
    extracted_skills: string[];
    raw_text_preview: string | null;
    created_at: string | null;
};

type CandidateProfile = {
    phone: string | null;
    university: string | null;
    degree: string | null;
    major: string | null;
    graduation_year: number | null;
    is_currently_studying: boolean;
    current_semester: number | null;
    total_semesters: number | null;
    education: {
        is_currently_studying: boolean;
        current_semester: number | null;
        total_semesters: number | null;
        projected_semester: number | null;
        is_completed: boolean;
        status_label: string;
    };
    location: string | null;
    skills: string[];
    skill_categories: Record<string, string[]>;
    achievements: string | null;
    hackathons_experience: string | null;
    projects_description: string | null;
};

type PageProps = {
    candidateResume: CandidateResume | null;
    candidateProfile: CandidateProfile | null;
    status?: string;
};

export default function Dashboard() {
    const { candidateResume, candidateProfile, status } =
        usePage<PageProps>().props;
    const hasScannedSkills =
        (candidateResume?.extracted_skills.length ?? 0) > 0;
    const categorizedSkills = Object.entries(
        candidateProfile?.skill_categories ?? {},
    ).filter(([, skills]) => skills.length > 0);
    const totalSkills = candidateProfile?.skills.length ?? 0;
    const completedProfileSections = [
        candidateProfile?.phone,
        candidateProfile?.university,
        candidateProfile?.degree,
        candidateProfile?.major,
        candidateProfile?.location,
    ].filter(Boolean).length;
    const profileCompletionPercent = Math.round(
        (completedProfileSections / 5) * 100,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="mx-auto flex h-full w-full max-w-none flex-1 flex-col gap-6 px-3 py-4 sm:px-4">
                {status === 'profile-updated' && (
                    <div className="rounded-lg border border-blue-300/70 bg-blue-200/70 px-4 py-3 text-sm text-blue-950 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200">
                        Profile updated successfully.
                    </div>
                )}

                <section className="rounded-2xl border border-border/70 bg-card p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-heading text-xl font-bold">
                                Candidate Dashboard
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Track your profile strength, resume visibility,
                                and recruiter-facing readiness.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={editOnboarding().url}
                                className="text-primary-dark rounded-md border border-primary px-3 py-2 text-sm font-semibold hover:bg-secondary"
                            >
                                Edit profile
                            </Link>
                            {candidateResume && (
                                <a
                                    href={showResume(candidateResume.id).url}
                                    className="text-primary-dark rounded-md border border-primary px-3 py-2 text-sm font-semibold hover:bg-secondary"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    View resume
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-xl border border-border/70 bg-card p-4">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Profile completion
                        </p>
                        <p className="text-heading mt-2 text-2xl font-bold">
                            {profileCompletionPercent}%
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Keep key profile fields updated.
                        </p>
                    </article>
                    <article className="rounded-xl border border-border/70 bg-card p-4">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Resume status
                        </p>
                        <p className="text-heading mt-2 text-2xl font-bold">
                            {candidateResume ? 'Uploaded' : 'Missing'}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Recruiters prefer complete profiles.
                        </p>
                    </article>
                    <article className="rounded-xl border border-border/70 bg-card p-4">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Skills listed
                        </p>
                        <p className="text-heading mt-2 text-2xl font-bold">
                            {totalSkills}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Add role-relevant and recent skills.
                        </p>
                    </article>
                    <article className="rounded-xl border border-border/70 bg-card p-4">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Resume parsing
                        </p>
                        <p className="text-heading mt-2 text-2xl font-bold">
                            {hasScannedSkills ? 'Ready' : 'Pending'}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Parsed skills improve discoverability.
                        </p>
                    </article>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-xl border border-border/70 bg-card p-5">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <FileText className="size-4 text-primary" />
                                    Resume
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Keep your resume updated for better matches.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {candidateResume && (
                                    <a
                                        href={
                                            showResume(candidateResume.id).url
                                        }
                                        className="text-sm font-medium text-primary hover:text-primary/80"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        View
                                    </a>
                                )}
                                <Link
                                    href={editOnboarding().url}
                                    className="text-sm font-medium text-primary hover:text-primary/80"
                                >
                                    {candidateResume ? 'Replace' : 'Upload'}
                                </Link>
                            </div>
                        </div>

                        {candidateResume ? (
                            <div className="mt-5 space-y-4">
                                <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium">
                                            {candidateResume.original_name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {(
                                                candidateResume.file_size / 1024
                                            ).toFixed(1)}{' '}
                                            KB
                                        </span>
                                    </div>
                                    {candidateResume.created_at && (
                                        <div className="text-xs text-muted-foreground">
                                            Uploaded{' '}
                                            {candidateResume.created_at}
                                        </div>
                                    )}
                                </div>

                                {candidateResume.extracted_skills.length >
                                    0 && (
                                    <div>
                                        <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Extracted skills
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {candidateResume.extracted_skills.map(
                                                (skill) => (
                                                    <span
                                                        key={skill}
                                                        className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs text-card-foreground"
                                                    >
                                                        {skill}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                                {candidateResume.raw_text_preview && (
                                    <div className="rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground">
                                        {candidateResume.raw_text_preview}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-5 rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                                No resume uploaded yet.
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-border/70 bg-card p-5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Sparkles className="size-4 text-primary" />
                                Profile snapshot
                            </div>
                            <Link
                                href={editOnboarding().url}
                                className="text-sm font-medium text-primary hover:text-primary/80"
                            >
                                Edit profile
                            </Link>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {hasScannedSkills
                                ? 'Visible to recruiters.'
                                : 'Visible to recruiters once your resume is scanned.'}
                        </p>

                        {candidateProfile ? (
                            <div className="mt-4 space-y-3 text-sm text-foreground">
                                {candidateProfile.university && (
                                    <div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase">
                                            <GraduationCap className="size-3.5" />
                                            University
                                        </div>
                                        <div>{candidateProfile.university}</div>
                                    </div>
                                )}

                                {(candidateProfile.degree ||
                                    candidateProfile.major) && (
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase">
                                            Degree
                                        </div>
                                        <div>
                                            {[
                                                candidateProfile.degree,
                                                candidateProfile.major,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="text-xs text-muted-foreground uppercase">
                                        Education status
                                    </div>
                                    <div>
                                        {
                                            candidateProfile.education
                                                .status_label
                                        }
                                    </div>
                                </div>

                                {candidateProfile.location && (
                                    <div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase">
                                            <MapPin className="size-3.5" />
                                            Location
                                        </div>
                                        <div>{candidateProfile.location}</div>
                                    </div>
                                )}

                                {candidateProfile.skills.length > 0 && (
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase">
                                            Skills
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {candidateProfile.skills.map(
                                                (skill) => (
                                                    <span
                                                        key={skill}
                                                        className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs text-card-foreground"
                                                    >
                                                        {skill}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                                {categorizedSkills.length > 0 && (
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase">
                                            Skill categories
                                        </div>
                                        <div className="mt-2 space-y-3">
                                            {categorizedSkills.map(
                                                ([category, skills]) => (
                                                    <div key={category}>
                                                        <div className="text-xs font-semibold text-foreground">
                                                            {category}
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {skills.map(
                                                                (skill) => (
                                                                    <span
                                                                        key={`${category}-${skill}`}
                                                                        className="rounded-full border border-secondary/40 bg-secondary/40 px-3 py-1 text-xs text-card-foreground"
                                                                    >
                                                                        {skill}
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                                {(candidateProfile.achievements ||
                                    candidateProfile.hackathons_experience ||
                                    candidateProfile.projects_description) && (
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase">
                                            Additional experience
                                        </div>
                                        <div className="mt-2 space-y-2 text-sm">
                                            {candidateProfile.achievements && (
                                                <p>
                                                    <span className="font-medium">
                                                        Achievements:
                                                    </span>{' '}
                                                    {
                                                        candidateProfile.achievements
                                                    }
                                                </p>
                                            )}
                                            {candidateProfile.hackathons_experience && (
                                                <p>
                                                    <span className="font-medium">
                                                        Hackathons:
                                                    </span>{' '}
                                                    {
                                                        candidateProfile.hackathons_experience
                                                    }
                                                </p>
                                            )}
                                            {candidateProfile.projects_description && (
                                                <p>
                                                    <span className="font-medium">
                                                        Projects:
                                                    </span>{' '}
                                                    {
                                                        candidateProfile.projects_description
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                                Complete your profile details to show up here.
                            </div>
                        )}
                    </div>
                </div>

                <section className="rounded-xl border border-border/70 bg-card p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <BriefcaseBusiness className="size-4 text-primary" />
                        Recommended next steps
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
                            Keep resume keywords aligned with your target roles.
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
                            Add projects and achievements for stronger profile
                            quality.
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
                            Update profile details regularly to stay
                            recruiter-ready.
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
