import { Form, Head, usePage } from '@inertiajs/react';
import {
    edit,
    store,
} from '@/actions/App/Http/Controllers/Candidate/OnboardingController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile setup',
        href: edit().url,
    },
];

type CandidateProfile = {
    phone: string | null;
    university: string | null;
    degree: string | null;
    major: string | null;
    cgpa: number | null;
    graduation_year: number | null;
    location: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    portfolio_url: string | null;
    bio: string | null;
    skills: string[];
};

type PageProps = {
    profile: CandidateProfile | null;
    hasResume: boolean;
    isCompleted: boolean;
    skillCatalog: string[];
    status?: string;
};

const degreeOptions = [
    'B.Tech',
    'B.E',
    'M.Tech',
    'BCA',
    'MCA',
    'B.Sc',
    'M.Sc',
    'Other',
];

const majorOptions = [
    'Computer Science',
    'Information Technology',
    'Electronics and Communication',
    'Electrical and Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Data Science',
    'Artificial Intelligence',
    'Other',
];

export default function CandidateOnboarding() {
    const { profile, hasResume, isCompleted, skillCatalog, status } =
        usePage<PageProps>().props;
    const skillsValue = profile?.skills?.length ? profile.skills.join(', ') : '';
    const currentYear = new Date().getFullYear();
    const defaultGraduationYears = Array.from(
        { length: 41 },
        (_, index) => String(currentYear - 20 + index),
    );
    const graduationYears = profile?.graduation_year
        ? Array.from(new Set([String(profile.graduation_year), ...defaultGraduationYears]))
        : defaultGraduationYears;
    const headingTitle = isCompleted
        ? 'Update your candidate profile'
        : 'Complete your candidate profile';
    const headingDescription = isCompleted
        ? 'Keep your information up to date so recruiters can reach you quickly.'
        : 'Fill in your details and upload your resume so recruiters can find you.';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile setup" />

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                <Heading title={headingTitle} description={headingDescription} />

                {status === 'onboarding-complete' && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                        Profile completed successfully.
                    </div>
                )}

                <Form
                    {...store.form()}
                    encType="multipart/form-data"
                    className="space-y-8"
                >
                    {({ processing, errors }) => (
                        <>
                            {Object.keys(errors).length > 0 && (
                                <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                                    Please fix the highlighted fields and submit again.
                                </section>
                            )}

                            <section className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-xs">
                                <div className="text-sm font-semibold text-foreground">
                                    Contact information
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            placeholder="+1 555 123 4567"
                                            defaultValue={profile?.phone ?? ''}
                                            required
                                        />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="location">Location</Label>
                                        <Input
                                            id="location"
                                            name="location"
                                            placeholder="San Francisco, CA"
                                            defaultValue={profile?.location ?? ''}
                                            required
                                        />
                                        <InputError message={errors.location} />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-xs">
                                <div className="text-sm font-semibold text-foreground">
                                    Education
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="university">College / University</Label>
                                        <Input
                                            id="university"
                                            name="university"
                                            placeholder="State University"
                                            defaultValue={profile?.university ?? ''}
                                            required
                                        />
                                        <InputError message={errors.university} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="degree">Degree</Label>
                                        <select
                                            id="degree"
                                            name="degree"
                                            defaultValue={profile?.degree ?? ''}
                                            required
                                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                        >
                                            <option value="" disabled>
                                                Select degree
                                            </option>
                                            {degreeOptions.map((degree) => (
                                                <option key={degree} value={degree}>
                                                    {degree}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.degree} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="major">Major</Label>
                                        <select
                                            id="major"
                                            name="major"
                                            defaultValue={profile?.major ?? ''}
                                            required
                                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                        >
                                            <option value="" disabled>
                                                Select major
                                            </option>
                                            {majorOptions.map((major) => (
                                                <option key={major} value={major}>
                                                    {major}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.major} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="cgpa">CGPA</Label>
                                        <Input
                                            id="cgpa"
                                            name="cgpa"
                                            type="number"
                                            step="0.01"
                                            placeholder="8.5"
                                            defaultValue={profile?.cgpa ?? ''}
                                        />
                                        <InputError message={errors.cgpa} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="graduation_year">Graduation year</Label>
                                        <select
                                            id="graduation_year"
                                            name="graduation_year"
                                            defaultValue={profile?.graduation_year ?? ''}
                                            required
                                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                        >
                                            <option value="" disabled>
                                                Select graduation year
                                            </option>
                                            {graduationYears.map((year) => (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.graduation_year} />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-xs">
                                <div className="text-sm font-semibold text-foreground">
                                    Address
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="address_line_1">Address line 1</Label>
                                        <Input
                                            id="address_line_1"
                                            name="address_line_1"
                                            placeholder="123 Market Street"
                                            defaultValue={profile?.address_line_1 ?? ''}
                                            required
                                        />
                                        <InputError message={errors.address_line_1} />
                                    </div>

                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="address_line_2">Address line 2</Label>
                                        <Input
                                            id="address_line_2"
                                            name="address_line_2"
                                            placeholder="Apt 4B"
                                            defaultValue={profile?.address_line_2 ?? ''}
                                        />
                                        <InputError message={errors.address_line_2} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            name="city"
                                            placeholder="San Francisco"
                                            defaultValue={profile?.city ?? ''}
                                            required
                                        />
                                        <InputError message={errors.city} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="state">State</Label>
                                        <Input
                                            id="state"
                                            name="state"
                                            placeholder="California"
                                            defaultValue={profile?.state ?? ''}
                                            required
                                        />
                                        <InputError message={errors.state} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="country">Country</Label>
                                        <Input
                                            id="country"
                                            name="country"
                                            placeholder="United States"
                                            defaultValue={profile?.country ?? ''}
                                            required
                                        />
                                        <InputError message={errors.country} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="postal_code">Postal code</Label>
                                        <Input
                                            id="postal_code"
                                            name="postal_code"
                                            placeholder="94105"
                                            defaultValue={profile?.postal_code ?? ''}
                                            required
                                        />
                                        <InputError message={errors.postal_code} />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-xs">
                                <div className="text-sm font-semibold text-foreground">
                                    Links
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    These links are optional, but they help recruiters verify your
                                    work.
                                </p>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="linkedin_url">LinkedIn</Label>
                                        <Input
                                            id="linkedin_url"
                                            name="linkedin_url"
                                            type="url"
                                            placeholder="https://linkedin.com/in/username"
                                            defaultValue={profile?.linkedin_url ?? ''}
                                        />
                                        <InputError message={errors.linkedin_url} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="github_url">GitHub</Label>
                                        <Input
                                            id="github_url"
                                            name="github_url"
                                            type="url"
                                            placeholder="https://github.com/username"
                                            defaultValue={profile?.github_url ?? ''}
                                        />
                                        <InputError message={errors.github_url} />
                                    </div>

                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="portfolio_url">Portfolio</Label>
                                        <Input
                                            id="portfolio_url"
                                            name="portfolio_url"
                                            type="url"
                                            placeholder="https://your-site.com"
                                            defaultValue={profile?.portfolio_url ?? ''}
                                        />
                                        <InputError message={errors.portfolio_url} />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-xs">
                                <div className="text-sm font-semibold text-foreground">
                                    Skills and bio
                                </div>

                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="skills">Skills</Label>
                                        <Input
                                            id="skills"
                                            name="skills"
                                            placeholder="Laravel, React, AWS"
                                            defaultValue={skillsValue}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Enter comma-separated skills. We will merge these with the
                                            resume scan.
                                        </p>
                                        <InputError message={errors.skills} />
                                        {skillCatalog.length > 0 && (
                                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                {skillCatalog.slice(0, 10).map((skill) => (
                                                    <span
                                                        key={skill}
                                                        className="rounded-full border border-muted-foreground/20 bg-muted/40 px-2 py-1"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                                {skillCatalog.length > 10 && (
                                                    <span className="rounded-full border border-muted-foreground/20 bg-muted/40 px-2 py-1">
                                                        +{skillCatalog.length - 10} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="bio">Short bio</Label>
                                        <textarea
                                            id="bio"
                                            name="bio"
                                            rows={4}
                                            defaultValue={profile?.bio ?? ''}
                                            className="border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground min-h-[110px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
                                            placeholder="Share a quick summary of your experience"
                                        />
                                        <InputError message={errors.bio} />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-xs">
                                <div className="text-sm font-semibold text-foreground">
                                    Resume upload
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="resume">
                                        Resume file {hasResume ? '(optional)' : ''}
                                    </Label>
                                    <Input
                                        id="resume"
                                        name="resume"
                                        type="file"
                                        required={!hasResume}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {hasResume
                                            ? 'Upload only if you want to replace your existing resume. Accepted formats: PDF, DOC, DOCX, TXT. Max 5MB.'
                                            : 'Accepted formats: PDF, DOC, DOCX, TXT. Max 5MB.'}
                                    </p>
                                    <InputError message={errors.resume} />
                                </div>
                            </section>

                            <Button type="submit" disabled={processing}>
                                {processing
                                    ? 'Saving...'
                                    : isCompleted
                                      ? 'Update profile'
                                      : 'Complete profile'}
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
