import { Link, usePage } from '@inertiajs/react';
import { BarChart3, LayoutDashboard, Search, Users, FolderKanban } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { FlashToast } from '@/components/flash-toast';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { logout } from '@/routes';
import { dashboard as recruiterDashboard } from '@/routes/recruiter';
import { index as candidatesIndex } from '@/routes/recruiter/candidates';
import { index as collectionsIndex } from '@/routes/recruiter/collections';

type SharedProps = {
    auth: {
        user: {
            name: string;
            email: string;
        };
    };
};

type Props = PropsWithChildren<{
    title: string;
    search?: string;
    onSearchChange?: (value: string) => void;
    onSearchSubmit?: () => void;
}>;

const sidebarItems = [
    { title: 'Dashboard', href: recruiterDashboard().url, icon: LayoutDashboard },
    { title: 'Candidates', href: candidatesIndex().url, icon: Users },
    { title: 'Collections', href: collectionsIndex().url, icon: FolderKanban },
    { title: 'Analytics', href: '#', icon: BarChart3, disabled: true },
];

export default function RecruiterLayout({ title, children, search, onSearchChange, onSearchSubmit }: Props) {
    const { auth } = usePage<SharedProps>().props;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
            <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 lg:px-8">
                <aside className="hidden w-64 shrink-0 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm md:block">
                    <div className="mb-6 px-2">
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                            Recruiter Hub
                        </div>
                        <div className="mt-1 text-lg font-semibold">Talent Console</div>
                    </div>
                    <nav className="space-y-1.5">
                        {sidebarItems.map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                                    item.disabled
                                        ? 'pointer-events-none opacity-45'
                                        : 'hover:bg-slate-100'
                                }`}
                            >
                                <item.icon className="size-4" />
                                <span>{item.title}</span>
                            </Link>
                        ))}
                    </nav>
                </aside>

                <div className="min-w-0 flex-1">
                    <header className="mb-6 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-xl font-semibold">{title}</h1>
                            </div>
                            <div className="flex items-center gap-3">
                                {onSearchChange && (
                                    <form
                                        className="relative w-full sm:w-72"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            onSearchSubmit?.();
                                        }}
                                    >
                                        <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                                        <Input
                                            value={search}
                                            onChange={(event) =>
                                                onSearchChange(event.target.value)
                                            }
                                            placeholder="Search candidates"
                                            className="pl-9 pr-16"
                                        />
                                        <button
                                            type="submit"
                                            className="absolute top-1.5 right-1.5 rounded-md border border-border/70 bg-background px-2 py-1 text-xs hover:bg-muted/30"
                                        >
                                            Go
                                        </button>
                                    </form>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-9 rounded-xl">
                                            {auth.user.name}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                                            {auth.user.email}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={logout()} as="button" method="post">
                                                Sign out
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </header>

                    <main>{children}</main>
                </div>
            </div>

            <FlashToast />
        </div>
    );
}
