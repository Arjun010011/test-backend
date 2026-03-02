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
            color: 'from-blue-500 to-indigo-600',
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

            <div className="min-h-screen px-6 py-8 text-slate-900 sm:px-8 lg:px-10">
                <div className="mx-auto max-w-6xl space-y-8">
                    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200/60 bg-white/85 px-4 py-3 shadow-[0_12px_40px_-28px_rgba(14,165,233,0.45)] backdrop-blur sm:px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 via-indigo-500 to-cyan-500 text-sm font-bold text-white">
                                EB
                            </div>
                            <div>
                                <p className="text-xs font-semibold tracking-[0.2em] text-blue-600 uppercase">
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
                                    className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                                    >
                                        Sign in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
                                        >
                                            Create account
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </header>

                    <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-linear-to-r from-blue-500 via-indigo-500 to-cyan-500 px-6 py-10 text-white shadow-[0_24px_80px_-36px_rgba(59,130,246,0.6)] sm:px-8">
                        <div className="pointer-events-none absolute -top-16 right-0 h-52 w-52 rounded-full bg-white/20 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-20 left-0 h-48 w-48 rounded-full bg-cyan-200/30 blur-2xl" />
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Manage candidate operations in one place
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
                            Intake, review, and status tracking for Edu Bricz
                            teams.
                        </p>
                        <div className="mt-6">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-blue-700"
                                >
                                    Continue to dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={login()}
                                    className="inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white"
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
                                className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_14px_36px_-24px_rgba(30,41,59,0.55)] backdrop-blur transition duration-300 hover:-translate-y-1"
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
