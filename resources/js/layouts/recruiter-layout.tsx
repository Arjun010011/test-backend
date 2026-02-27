import { Link, usePage } from '@inertiajs/react';
import { BarChart3, LayoutDashboard, Search, Users, FolderKanban, Monitor, Moon, Sun } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { FlashToast } from '@/components/flash-toast';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAppearance } from '@/hooks/use-appearance';
import { logout } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
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
    const { appearance, updateAppearance } = useAppearance();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 lg:px-8">
                <aside className="hidden w-64 shrink-0 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur md:block">
                    <div className="mb-6 px-2">
                        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                            Recruiter Hub
                        </div>
                        <div className="mt-1 text-lg font-semibold text-foreground">Talent Console</div>
                    </div>
                    <nav className="space-y-1.5">
                        {sidebarItems.map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                                    item.disabled
                                        ? 'pointer-events-none opacity-45'
                                        : 'hover:bg-accent hover:text-accent-foreground'
                                }`}
                            >
                                <item.icon className="size-4" />
                                <span>{item.title}</span>
                            </Link>
                        ))}
                    </nav>
                </aside>

                <div className="min-w-0 flex-1">
                    <header className="mb-6 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
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
                                        <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                        <Input
                                            value={search}
                                            onChange={(event) =>
                                                onSearchChange(event.target.value)
                                            }
                                            placeholder="Search candidates"
                                            className="pl-9 pr-16 bg-background/80"
                                        />
                                        <button
                                            type="submit"
                                            className="absolute top-1.5 right-1.5 rounded-md border border-border/70 bg-background px-2 py-1 text-xs hover:bg-accent/70"
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
                                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                                            {auth.user.email}
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href={editProfile()} prefetch>
                                                Profile settings
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={editAppearance()} prefetch>
                                                Appearance settings
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => updateAppearance('light')}>
                                            <Sun className="mr-2 size-4" />
                                            Light
                                            {appearance === 'light' ? ' ✓' : ''}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateAppearance('dark')}>
                                            <Moon className="mr-2 size-4" />
                                            Dark
                                            {appearance === 'dark' ? ' ✓' : ''}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateAppearance('system')}>
                                            <Monitor className="mr-2 size-4" />
                                            System
                                            {appearance === 'system' ? ' ✓' : ''}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
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
