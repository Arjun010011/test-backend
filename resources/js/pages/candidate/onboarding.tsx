import { Form, Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
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
    is_currently_studying: boolean;
    current_semester: number | null;
    total_semesters: number | null;
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
    const [isCurrentlyStudying, setIsCurrentlyStudying] = useState(
        profile?.is_currently_studying ?? false,
    );
    const catalogMap = new Map(skillCatalog.map((skill) => [skill.toLowerCase(), skill]));
    const initialSkillTags = (profile?.skills ?? []).map((skill) => {
        const normalized = catalogMap.get(skill.toLowerCase());

        return {
            value: normalized ?? skill,
            valid: normalized !== undefined,
        };
    });
    const [skillTags, setSkillTags] = useState<Array<{ value: string; valid: boolean }>>(
        initialSkillTags,
    );
    const [skillInput, setSkillInput] = useState('');
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
    const filteredSkillSuggestions = skillCatalog
        .filter(
            (skill) =>
                skill.toLowerCase().includes(skillInput.trim().toLowerCase()) &&
                !skillTags.some((tag) => tag.value.toLowerCase() === skill.toLowerCase()),
        )
        .slice(0, 8);
    const validSkillTags = skillTags.filter((tag) => tag.valid).map((tag) => tag.value);

    const addSkillTag = (rawValue: string) => {
        const trimmed = rawValue.trim();

        if (trimmed === '') {
            return;
        }

        const canonical = catalogMap.get(trimmed.toLowerCase());
        const value = canonical ?? trimmed;
        const exists = skillTags.some((tag) => tag.value.toLowerCase() === value.toLowerCase());

        if (exists) {
            setSkillInput('');

            return;
        }

        setSkillTags((previous) => [
            ...previous,
            {
                value,
                valid: canonical !== undefined,
            },
        ]);
        setSkillInput('');
    };

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

                                    <div className="grid gap-2 sm:col-span-2">
                                        <input type="hidden" name="is_currently_studying" value="0" />
                                        <label className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm">
                                            <input
                                                id="is_currently_studying"
                                                name="is_currently_studying"
                                                type="checkbox"
                                                value="1"
                                                defaultChecked={profile?.is_currently_studying ?? false}
                                                onChange={(event) => setIsCurrentlyStudying(event.target.checked)}
                                                className="size-4"
                                            />
                                            I am currently studying this degree
                                        </label>
                                        <InputError message={errors.is_currently_studying} />
                                    </div>

                                    {isCurrentlyStudying && (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="current_semester">Current semester</Label>
                                                <Input
                                                    id="current_semester"
                                                    name="current_semester"
                                                    type="number"
                                                    min={1}
                                                    max={20}
                                                    defaultValue={profile?.current_semester ?? ''}
                                                    required={isCurrentlyStudying}
                                                />
                                                <InputError message={errors.current_semester} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="total_semesters">Total semesters</Label>
                                                <Input
                                                    id="total_semesters"
                                                    name="total_semesters"
                                                    type="number"
                                                    min={1}
                                                    max={20}
                                                    defaultValue={profile?.total_semesters ?? ''}
                                                    required={isCurrentlyStudying}
                                                />
                                                <InputError message={errors.total_semesters} />
                                            </div>
                                        </>
                                    )}
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
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                                            <div className="flex flex-wrap gap-2">
                                                {skillTags.map((tag) => (
                                                    <button
                                                        key={`${tag.value}-${tag.valid ? 'valid' : 'invalid'}`}
                                                        type="button"
                                                        onClick={() =>
                                                            setSkillTags((previous) =>
                                                                previous.filter(
                                                                    (item) => item.value !== tag.value,
                                                                ),
                                                            )
                                                        }
                                                        className={`rounded-full border px-2.5 py-1 text-xs ${
                                                            tag.valid
                                                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                                : 'border-amber-200 bg-amber-50 text-amber-700'
                                                        }`}
                                                    >
                                                        {tag.value} ×
                                                    </button>
                                                ))}
                                            </div>
                                            <Input
                                                id="skills"
                                                value={skillInput}
                                                onChange={(event) => setSkillInput(event.target.value)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter' || event.key === ',') {
                                                        event.preventDefault();
                                                        addSkillTag(skillInput);
                                                    }
                                                }}
                                                placeholder="Type skill and press Enter (e.g. Java)"
                                                className="mt-3 border-slate-300 bg-white"
                                            />
                                            {filteredSkillSuggestions.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {filteredSkillSuggestions.map((skill) => (
                                                        <button
                                                            key={skill}
                                                            type="button"
                                                            onClick={() => addSkillTag(skill)}
                                                            className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                                                        >
                                                            {skill}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {validSkillTags.map((skill) => (
                                                <input key={skill} type="hidden" name="skills[]" value={skill} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Skills are validated against predefined tags. Unrecognized tags stay visible but are not saved.
                                        </p>
                                        <InputError message={errors.skills} />
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
