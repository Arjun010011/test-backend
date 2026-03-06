import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    const workflowStages = [
        {
            title: 'Candidate Intake',
            description: 'Capture complete profile and resume data with a guided workflow.',
            color: 'bg-blue-700/12',
        },
        {
            title: 'Recruiter Review',
            description: 'Review profiles quickly, add comments, and curate focused collections.',
            color: 'bg-emerald-700/12',
        },
        {
            title: 'Status Tracking',
            description: 'Move candidates through stages with clear visibility for the whole team.',
            color: 'bg-orange-700/12',
        },
    ];

    return (
        <>
            <Head title="Welcome" />

            <div className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 sm:px-10 lg:px-12">
                <div className="mx-auto max-w-7xl space-y-8">
                    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white">
                                EB
                            </div>
                            <div>
                                <p className="text-xs font-semibold tracking-[0.2em] text-blue-700 uppercase">
                                    Edu Bricz
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                    Internal Hiring Portal
                                </p>
                            </div>
                        </div>

                        <nav className="flex items-center gap-2 sm:gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                                    >
                                        Sign in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="rounded-full bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                                        >
                                            Create account
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </header>

                    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
                        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.22em] text-blue-700 uppercase">
                                    Built for internal teams
                                </p>
                                <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
                                    Manage hiring workflows with clarity and speed
                                </h1>
                                <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                                    A single workspace for candidate intake, recruiter review, and status progression so every decision stays organized.
                                </p>
                                <div className="mt-8 flex flex-wrap items-center gap-3">
                                    {auth.user ? (
                                        <Link
                                            href={dashboard()}
                                            className="inline-flex rounded-full bg-blue-700 px-7 py-3.5 text-sm font-bold text-white hover:bg-blue-800"
                                        >
                                            Continue to dashboard
                                        </Link>
                                    ) : (
                                        <Link
                                            href={login()}
                                            className="inline-flex rounded-full bg-blue-700 px-7 py-3.5 text-sm font-bold text-white hover:bg-blue-800"
                                        >
                                            Sign in securely
                                        </Link>
                                    )}
                                    {!auth.user && canRegister && (
                                        <Link
                                            href={register()}
                                            className="inline-flex rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 hover:border-blue-300 hover:text-blue-700"
                                        >
                                            Create account
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                                <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                                    Portal highlights
                                </p>
                                <div className="mt-4 space-y-3 text-sm text-slate-700">
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">Profile + Resume intake</div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">Recruiter collaboration and notes</div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">Collection-based candidate organization</div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">Assessment and workflow tracking</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-5 lg:grid-cols-3">
                        {workflowStages.map((stage) => (
                            <article
                                key={stage.title}
                                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                            >
                                <div className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold text-slate-700 ${stage.color}`}>
                                    Workflow
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {stage.title}
                                </h2>
                                <p className="mt-2 text-sm text-slate-600">
                                    {stage.description}
                                </p>
                            </article>
                        ))}
                    </section>
                </div>
            </div>
        </>
    );
}
