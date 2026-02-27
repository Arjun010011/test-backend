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
            description: 'Collect candidate profile and resume details.',
            color: 'from-sky-500 to-blue-600',
        },
        {
            title: 'Recruiter Review',
            description: 'Review candidates, comment, and organize collections.',
            color: 'from-orange-400 to-amber-500',
        },
        {
            title: 'Status Tracking',
            description: 'Update and track each candidate stage clearly.',
            color: 'from-emerald-500 to-teal-600',
        },
    ];

    return (
        <>
            <Head title="Welcome" />

            <div className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 sm:px-8 lg:px-10">
                <div className="mx-auto max-w-6xl space-y-8">
                    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-white px-4 py-3 shadow-sm sm:px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-700 to-sky-500 text-sm font-bold text-white">
                                EB
                            </div>
                            <div>
                                <p className="text-xs font-semibold tracking-[0.2em] text-sky-600 uppercase">
                                    Edu Bricz
                                </p>
                                <p className="text-sm font-semibold">
                                    Internal Hiring Portal
                                </p>
                            </div>
                        </div>

                        <nav className="flex items-center gap-2 sm:gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                                    >
                                        Sign in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="rounded-full bg-linear-to-r from-blue-700 to-sky-500 px-5 py-2 text-sm font-semibold text-white"
                                        >
                                            Create account
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </header>

                    <section className="rounded-3xl bg-linear-to-r from-blue-700 via-sky-600 to-cyan-500 px-6 py-10 text-white sm:px-8">
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Manage candidate operations in one place
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm text-sky-50 sm:text-base">
                            Intake, review, and status tracking for Edu Bricz
                            teams.
                        </p>
                        <div className="mt-6">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-sky-700"
                                >
                                    Continue to dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={login()}
                                    className="inline-flex rounded-full bg-orange-400 px-6 py-3 text-sm font-bold text-slate-900"
                                >
                                    Sign in securely
                                </Link>
                            )}
                        </div>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-3">
                        {workflowStages.map((stage) => (
                            <article
                                key={stage.title}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                            >
                                <div
                                    className={`h-2 w-full bg-linear-to-r ${stage.color}`}
                                />
                                <div className="p-5">
                                    <h2 className="text-lg font-bold text-slate-900">
                                        {stage.title}
                                    </h2>
                                    <p className="mt-2 text-sm text-slate-600">
                                        {stage.description}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </section>
                </div>
            </div>
        </>
    );
}
