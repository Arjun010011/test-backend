import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome" />
            <div className="relative min-h-screen overflow-hidden bg-background">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
                    <div className="absolute right-0 bottom-0 h-72 w-72 translate-x-1/3 rounded-full bg-indigo-500/10 blur-3xl" />
                </div>

                <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pt-10 pb-20">
                    <header className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm font-semibold">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background">
                                CP
                            </span>
                            Candidate Portal
                        </div>
                        <nav className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="text-sm font-medium text-foreground hover:text-primary"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="text-sm font-medium text-foreground hover:text-primary"
                                    >
                                        Sign in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="rounded-full border border-border bg-foreground px-4 py-2 text-xs font-semibold tracking-wide text-background uppercase transition hover:bg-foreground/90"
                                        >
                                            Create account
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </header>

                    <main className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                Candidate experience
                            </div>
                            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                                Edubricz candidate registration portal
                            </h1>
                            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                                Upload your resume, surface your strongest
                                skills, and stay ready for the roles that match
                                your experience.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="rounded-full border border-border bg-foreground px-6 py-3 text-xs font-semibold tracking-wide text-background uppercase transition hover:bg-foreground/90"
                                    >
                                        Go to dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="rounded-full border border-border bg-foreground px-6 py-3 text-xs font-semibold tracking-wide text-background uppercase transition hover:bg-foreground/90"
                                        >
                                            Sign in
                                        </Link>
                                        {canRegister && (
                                            <Link
                                                href={register()}
                                                className="rounded-full border border-border/70 bg-background px-6 py-3 text-xs font-semibold tracking-wide text-foreground uppercase transition hover:border-border"
                                            >
                                                Create account
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {[
                                {
                                    title: 'Resume intelligence',
                                    description:
                                        'Upload once and keep your skills auto-synced to your profile.',
                                },
                                {
                                    title: 'Instant visibility',
                                    description:
                                        'Share a single, polished view of your profile for fast matching.',
                                },
                                {
                                    title: 'Private by default',
                                    description:
                                        'Your documents stay linked to your account and never exposed publicly.',
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-[0_12px_40px_-30px_rgba(15,23,42,0.5)] backdrop-blur"
                                >
                                    <h3 className="text-sm font-semibold text-foreground">
                                        {item.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
