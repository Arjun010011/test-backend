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
    district: string | null;
    country: string | null;
    postal_code: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    portfolio_url: string | null;
    bio: string | null;
    achievements: string | null;
    hackathons_experience: string | null;
    projects_description: string | null;
    skills: string[];
};

type PageProps = {
    profile: CandidateProfile | null;
    hasResume: boolean;
    isCompleted: boolean;
    skillCatalog: string[];
    defaultCountry: string;
    locationHierarchy: Record<
        string,
        {
            districts: string[];
            cities: string[];
            city_postal_patterns?: Record<string, string>;
        }
    >;
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

function RequiredStar() {
    return <span className="ml-1 text-red-500">*</span>;
}

export default function CandidateOnboarding() {
    const {
        profile,
        hasResume,
        isCompleted,
        skillCatalog,
        defaultCountry,
        locationHierarchy,
        status,
    } =
        usePage<PageProps>().props;
    const initialState =
        profile?.state !== null &&
        profile?.state !== undefined &&
        Object.prototype.hasOwnProperty.call(locationHierarchy, profile.state)
            ? profile.state
            : '';
    const initialDistrict =
        initialState !== '' &&
        profile?.district !== null &&
        profile?.district !== undefined &&
        locationHierarchy[initialState]?.districts.includes(profile.district)
            ? profile.district
            : '';
    const initialCity =
        initialState !== '' &&
        profile?.city !== null &&
        profile?.city !== undefined &&
        locationHierarchy[initialState]?.cities.includes(profile.city)
            ? profile.city
            : '';
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
    const [selectedState, setSelectedState] = useState(initialState);
    const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
    const [selectedCity, setSelectedCity] = useState(initialCity);
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
    const availableStates = Object.keys(locationHierarchy);
    const availableDistricts = selectedState === ''
        ? []
        : locationHierarchy[selectedState]?.districts ?? [];
    const availableCities = selectedState === ''
        ? []
        : locationHierarchy[selectedState]?.cities ?? [];

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

            <div className="mx-auto flex w-[95vw] max-w-[95vw] flex-col gap-6">
                <Heading title={headingTitle} description={headingDescription} />
                <section className="rounded-xl border border-sky-300/40 bg-gradient-to-r from-sky-500/15 via-cyan-500/10 to-indigo-500/15 px-4 py-3 text-sm text-foreground dark:border-sky-400/20 dark:from-sky-500/20 dark:via-cyan-500/10 dark:to-indigo-500/20">
                    A complete profile with clear skills and resume improves recruiter visibility.
                </section>
                <p className="text-xs text-muted-foreground">
                    Fields marked with <span className="text-red-500">*</span> are required.
                </p>

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

                            <section className="space-y-4 rounded-xl border border-border/60 bg-gradient-to-br from-card to-sky-500/5 p-5 shadow-xs dark:to-sky-400/10">
                                <div className="text-sm font-semibold text-foreground">
                                    Contact information
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone<RequiredStar /></Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            placeholder="+91 98765 43210"
                                            defaultValue={profile?.phone ?? ''}
                                            required
                                        />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="location">Location<RequiredStar /></Label>
                                        <Input
                                            id="location"
                                            name="location"
                                            placeholder="Bengaluru, Karnataka"
                                            defaultValue={profile?.location ?? ''}
                                            required
                                        />
                                        <InputError message={errors.location} />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-border/60 bg-gradient-to-br from-card to-sky-500/5 p-5 shadow-xs dark:to-sky-400/10">
                                <div className="text-sm font-semibold text-foreground">
                                    Education
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="university">College / University<RequiredStar /></Label>
                                        <Input
                                            id="university"
                                            name="university"
                                            placeholder="IIT Bombay"
                                            defaultValue={profile?.university ?? ''}
                                            required
                                        />
                                        <InputError message={errors.university} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="degree">Degree<RequiredStar /></Label>
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
                                        <Label htmlFor="major">Major<RequiredStar /></Label>
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
                                        <Label htmlFor="graduation_year">Graduation year<RequiredStar /></Label>
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

                            <section className="space-y-4 rounded-xl border border-border/60 bg-gradient-to-br from-card to-sky-500/5 p-5 shadow-xs dark:to-sky-400/10">
                                <div className="text-sm font-semibold text-foreground">
                                    Address
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="address_line_1">Address line 1<RequiredStar /></Label>
                                        <Input
                                            id="address_line_1"
                                            name="address_line_1"
                                            placeholder="42 Residency Road"
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
                                            placeholder="Near Brigade Road"
                                            defaultValue={profile?.address_line_2 ?? ''}
                                        />
                                        <InputError message={errors.address_line_2} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="country_display">Country<RequiredStar /></Label>
                                        <input type="hidden" name="country" value={defaultCountry} />
                                        <Input
                                            id="country_display"
                                            value={defaultCountry}
                                            disabled
                                            className="disabled:opacity-100"
                                        />
                                        <InputError message={errors.country} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="state">State<RequiredStar /></Label>
                                        <select
                                            id="state"
                                            name="state"
                                            value={selectedState}
                                            onChange={(event) => {
                                                const nextState = event.target.value;
                                                setSelectedState(nextState);
                                                setSelectedDistrict('');
                                                setSelectedCity('');
                                            }}
                                            required
                                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:opacity-60"
                                        >
                                            <option value="" disabled>
                                                Select state
                                            </option>
                                            {availableStates.map((stateOption) => (
                                                <option key={stateOption} value={stateOption}>
                                                    {stateOption}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.state} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="district">District<RequiredStar /></Label>
                                        <select
                                            id="district"
                                            name="district"
                                            value={selectedDistrict}
                                            onChange={(event) => {
                                                setSelectedDistrict(event.target.value);
                                                setSelectedCity('');
                                            }}
                                            required
                                            disabled={selectedState === ''}
                                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:opacity-60"
                                        >
                                            <option value="" disabled>
                                                Select district
                                            </option>
                                            {availableDistricts.map((districtOption) => (
                                                <option key={districtOption} value={districtOption}>
                                                    {districtOption}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.district} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="city">City<RequiredStar /></Label>
                                        <select
                                            id="city"
                                            name="city"
                                            value={selectedCity}
                                            onChange={(event) => {
                                                setSelectedCity(event.target.value);
                                            }}
                                            required
                                            disabled={selectedDistrict === ''}
                                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:opacity-60"
                                        >
                                            <option value="" disabled>
                                                Select city
                                            </option>
                                            {availableCities.map((cityOption) => (
                                                <option key={cityOption} value={cityOption}>
                                                    {cityOption}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.city} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="postal_code">Postal code<RequiredStar /></Label>
                                        <Input
                                            id="postal_code"
                                            name="postal_code"
                                            placeholder="560001"
                                            defaultValue={profile?.postal_code ?? ''}
                                            required
                                        />
                                        <InputError message={errors.postal_code} />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-border/60 bg-gradient-to-br from-card to-sky-500/5 p-5 shadow-xs dark:to-sky-400/10">
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

                            <section className="space-y-4 rounded-xl border border-border/60 bg-gradient-to-br from-card to-sky-500/5 p-5 shadow-xs dark:to-sky-400/10">
                                <div className="text-sm font-semibold text-foreground">
                                    Skills and bio
                                </div>

                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="skills">Skills</Label>
                                        <div className="rounded-xl border border-border bg-muted/30 p-3">
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
                                                                ? 'border-sky-300/40 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                                                                : 'border-amber-300/50 bg-amber-500/10 text-amber-700 dark:text-amber-300'
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
                                                className="mt-3 border-border bg-background"
                                            />
                                            {filteredSkillSuggestions.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {filteredSkillSuggestions.map((skill) => (
                                                        <button
                                                            key={skill}
                                                            type="button"
                                                            onClick={() => addSkillTag(skill)}
                                                            className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground hover:bg-accent/60"
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

                            <section className="space-y-4 rounded-xl border border-border/60 bg-gradient-to-br from-card to-sky-500/5 p-5 shadow-xs dark:to-sky-400/10">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    Additional experience
                                    <span className="rounded-full border border-border/70 bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                        Optional
                                    </span>
                                </div>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="achievements">Achievements (Optional)</Label>
                                        <textarea
                                            id="achievements"
                                            name="achievements"
                                            rows={3}
                                            defaultValue={profile?.achievements ?? ''}
                                            className="border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground min-h-[90px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
                                            placeholder="Awards, certifications, rankings, or notable accomplishments"
                                        />
                                        <InputError message={errors.achievements} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="hackathons_experience">Hackathons experience (Optional)</Label>
                                        <textarea
                                            id="hackathons_experience"
                                            name="hackathons_experience"
                                            rows={3}
                                            defaultValue={profile?.hackathons_experience ?? ''}
                                            className="border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground min-h-[90px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
                                            placeholder="Events participated in, problems solved, team roles, or results"
                                        />
                                        <InputError message={errors.hackathons_experience} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="projects_description">Projects description (Optional)</Label>
                                        <textarea
                                            id="projects_description"
                                            name="projects_description"
                                            rows={4}
                                            defaultValue={profile?.projects_description ?? ''}
                                            className="border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground min-h-[110px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
                                            placeholder="Summarize key projects, stack used, and impact"
                                        />
                                        <InputError message={errors.projects_description} />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-border/60 bg-gradient-to-br from-card to-sky-500/5 p-5 shadow-xs dark:to-sky-400/10">
                                <div className="text-sm font-semibold text-foreground">
                                    Resume upload
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="resume">
                                        Resume file {hasResume ? '(optional)' : ''}
                                        {!hasResume && <RequiredStar />}
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
