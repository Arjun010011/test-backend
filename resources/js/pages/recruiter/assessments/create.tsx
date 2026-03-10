import { Head, useForm } from '@inertiajs/react';
import { Calculator, Clock3, Layers3, Sparkles } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RecruiterLayout from '@/layouts/recruiter-layout';
import { store } from '@/routes/recruiter/assessments';

type TopicBlueprint = {
    topic: string;
    easy_count: number;
    medium_count: number;
    hard_count: number;
};

type Props = {
    topics: Record<string, string>;
    coding_topics: Record<string, Record<string, string>>;
};

export default function RecruiterAssessmentsCreate({
    topics,
    coding_topics,
}: Props) {
    const aptitudeTopicEntries = Object.entries(topics);

    const form = useForm({
        assessment_type: 'aptitude' as 'aptitude' | 'coding',
        title: '',
        description: '',
        duration_minutes: 60,
        passing_score: 60,
        randomize_questions: true,
        show_results_immediately: true,
        status: 'draft' as 'draft' | 'active' | 'private',
        question_blueprint: aptitudeTopicEntries.map(([topic]) => ({
            topic,
            easy_count: 0,
            medium_count: 0,
            hard_count: 0,
        })) as TopicBlueprint[],
    });

    const activeTopics =
        form.data.assessment_type === 'coding'
            ? (coding_topics[form.data.assessment_type] ?? {})
            : topics;
    const activeTopicEntries = Object.entries(activeTopics);

    const totalQuestions = form.data.question_blueprint.reduce(
        (sum, row) => sum + row.easy_count + row.medium_count + row.hard_count,
        0,
    );

    const setAssessmentType = (value: 'aptitude' | 'coding') => {
        form.setData('assessment_type', value);
        form.setData(
            'question_blueprint',
            (value === 'coding'
                ? Object.entries(coding_topics[value] ?? {})
                : aptitudeTopicEntries
            ).map(([topic]) => ({
                topic,
                easy_count: 0,
                medium_count: 0,
                hard_count: 0,
            })),
        );
    };

    const updateCount = (
        index: number,
        field: 'easy_count' | 'medium_count' | 'hard_count',
        value: number,
    ) => {
        const sanitized = Number.isFinite(value)
            ? Math.max(0, Math.min(100, Math.trunc(value)))
            : 0;

        form.setData(
            'question_blueprint',
            form.data.question_blueprint.map((row, rowIndex) =>
                rowIndex === index
                    ? {
                          ...row,
                          [field]: sanitized,
                      }
                    : row,
            ),
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(store().url, {
            preserveScroll: true,
        });
    };

    return (
        <RecruiterLayout title="Create Assessment">
            <Head title="Create Assessment" />

            <section className="rounded-3xl border border-cyan-300/40 bg-cyan-50 p-6 shadow-sm dark:bg-slate-900">
                <div className="space-y-5">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            {form.data.assessment_type === 'coding'
                                ? 'Design a coding assessment'
                                : 'Design a premium aptitude assessment'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {form.data.assessment_type === 'coding'
                                ? 'Pick topics and difficulty levels. Candidates choose Java, Python, or JavaScript at runtime. Each problem has exactly 3 sample test cases plus hidden grading cases.'
                                : 'Mix multiple topics and pick exact easy/medium/hard counts. Questions are sampled randomly from the CS aptitude dataset.'}
                        </p>
                    </div>

                    <form
                        onSubmit={submit}
                        className="grid gap-4 md:grid-cols-2"
                    >
                        <div className="space-y-2">
                            <label
                                htmlFor="assessment_type"
                                className="text-sm font-medium"
                            >
                                Assessment type
                            </label>
                            <select
                                id="assessment_type"
                                value={form.data.assessment_type}
                                onChange={(event) =>
                                    setAssessmentType(
                                        event.target.value as
                                            | 'aptitude'
                                            | 'coding',
                                    )
                                }
                                className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold"
                            >
                                <option value="aptitude">Aptitude (MCQ)</option>
                                <option value="coding">
                                    Coding (Multi-language)
                                </option>
                            </select>
                            <InputError message={form.errors.assessment_type} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label
                                htmlFor="title"
                                className="text-sm font-medium"
                            >
                                Assessment title
                            </label>
                            <Input
                                id="title"
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                                placeholder="Campus Placement Readiness Test"
                                className="bg-white/90 dark:bg-slate-950/70"
                            />
                            <InputError message={form.errors.title} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label
                                htmlFor="description"
                                className="text-sm font-medium"
                            >
                                Instructions
                            </label>
                            <textarea
                                id="description"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                rows={3}
                                className="w-full rounded-md border border-input bg-white/90 px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-slate-950/70"
                                placeholder="Explain test pattern, allowed tools, and passing criteria"
                            />
                            <InputError message={form.errors.description} />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="duration_minutes"
                                className="text-sm font-medium"
                            >
                                Timer (minutes)
                            </label>
                            <Input
                                id="duration_minutes"
                                type="number"
                                min={5}
                                max={180}
                                value={form.data.duration_minutes}
                                onChange={(event) =>
                                    form.setData(
                                        'duration_minutes',
                                        Number(event.target.value),
                                    )
                                }
                                className="bg-white/90 dark:bg-slate-950/70"
                            />
                            <InputError
                                message={form.errors.duration_minutes}
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="passing_score"
                                className="text-sm font-medium"
                            >
                                Passing score (%)
                            </label>
                            <Input
                                id="passing_score"
                                type="number"
                                min={0}
                                max={100}
                                value={form.data.passing_score}
                                onChange={(event) =>
                                    form.setData(
                                        'passing_score',
                                        Number(event.target.value),
                                    )
                                }
                                className="bg-white/90 dark:bg-slate-950/70"
                            />
                            <InputError message={form.errors.passing_score} />
                        </div>

                        <div className="grid gap-3 rounded-2xl border border-sky-300/40 bg-white/80 p-4 md:col-span-2 lg:grid-cols-4 dark:bg-slate-950/60">
                            <div className="flex items-center gap-2 text-sm">
                                <Layers3 className="size-4 text-cyan-600" />
                                <span>Total questions</span>
                                <span className="ml-auto rounded-md bg-cyan-600 px-2 py-0.5 text-xs font-semibold text-white">
                                    {totalQuestions}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Clock3 className="size-4 text-sky-600" />
                                <span>
                                    {form.data.duration_minutes} min timer
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Calculator className="size-4 text-indigo-600" />
                                <span>{form.data.passing_score}% passing</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Sparkles className="size-4 text-emerald-600" />
                                <span>Status: {form.data.status}</span>
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label
                                htmlFor="status"
                                className="text-sm font-medium"
                            >
                                Visibility status
                            </label>
                            <select
                                id="status"
                                value={form.data.status}
                                onChange={(event) =>
                                    form.setData(
                                        'status',
                                        event.target.value as
                                            | 'draft'
                                            | 'active'
                                            | 'private',
                                    )
                                }
                                className="w-full rounded-md border border-input bg-white/90 px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-slate-950/70"
                            >
                                <option value="draft">
                                    Draft (recruiter only)
                                </option>
                                <option value="active">
                                    Active (candidates can take)
                                </option>
                                <option value="private">
                                    Private (hidden from candidates)
                                </option>
                            </select>
                            <InputError message={form.errors.status} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <div className="rounded-2xl border border-border/60 bg-white/90 p-4 dark:bg-slate-950/70">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold">
                                        Topic-wise question matrix
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {form.data.assessment_type.startsWith(
                                            'coding_',
                                        )
                                            ? 'Select coding problems'
                                            : 'Choose any number of topics'}
                                    </p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border/60 text-muted-foreground">
                                                <th className="px-2 py-2 text-left font-medium">
                                                    Topic
                                                </th>
                                                <th className="px-2 py-2 text-left font-medium">
                                                    Easy
                                                </th>
                                                <th className="px-2 py-2 text-left font-medium">
                                                    Medium
                                                </th>
                                                <th className="px-2 py-2 text-left font-medium">
                                                    Hard
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeTopicEntries.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="px-2 py-4 text-sm text-muted-foreground"
                                                    >
                                                        No topics available.
                                                    </td>
                                                </tr>
                                            ) : (
                                                form.data.question_blueprint.map(
                                                    (row, index) => (
                                                        <tr
                                                            key={row.topic}
                                                            className="border-b border-border/50 last:border-b-0"
                                                        >
                                                            <td className="px-2 py-2 font-medium text-foreground/90">
                                                                {
                                                                    activeTopics[
                                                                        row
                                                                            .topic
                                                                    ]
                                                                }
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    max={100}
                                                                    value={
                                                                        row.easy_count
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateCount(
                                                                            index,
                                                                            'easy_count',
                                                                            Number(
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        )
                                                                    }
                                                                    className="bg-white dark:bg-slate-950/70"
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    max={100}
                                                                    value={
                                                                        row.medium_count
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateCount(
                                                                            index,
                                                                            'medium_count',
                                                                            Number(
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        )
                                                                    }
                                                                    className="bg-white dark:bg-slate-950/70"
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    max={100}
                                                                    value={
                                                                        row.hard_count
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateCount(
                                                                            index,
                                                                            'hard_count',
                                                                            Number(
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        )
                                                                    }
                                                                    className="bg-white dark:bg-slate-950/70"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <InputError
                                    message={form.errors.question_blueprint}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.data.randomize_questions}
                                    onChange={(event) =>
                                        form.setData(
                                            'randomize_questions',
                                            event.target.checked,
                                        )
                                    }
                                />
                                Randomize question order for candidates
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.data.show_results_immediately}
                                    onChange={(event) =>
                                        form.setData(
                                            'show_results_immediately',
                                            event.target.checked,
                                        )
                                    }
                                />
                                Show result immediately after submission
                            </label>
                        </div>

                        <div className="flex items-center gap-3 md:col-span-2">
                            <Button
                                type="submit"
                                disabled={form.processing || totalQuestions < 5}
                            >
                                {form.processing
                                    ? 'Creating...'
                                    : 'Create assessment'}
                            </Button>
                            {totalQuestions < 5 && (
                                <span className="text-xs text-muted-foreground">
                                    Add at least 5 questions to continue.
                                </span>
                            )}
                        </div>
                    </form>
                </div>
            </section>
        </RecruiterLayout>
    );
}
