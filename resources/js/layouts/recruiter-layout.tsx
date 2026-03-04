import { Link, usePage } from '@inertiajs/react';
import { BarChart3, Building2, ClipboardList, FolderKanban, LayoutDashboard, Search, Users } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import AppLogo from '@/components/app-logo';
import { FlashToast } from '@/components/flash-toast';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Input } from '@/components/ui/input';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { analytics as recruiterAnalytics, dashboard as recruiterDashboard } from '@/routes/recruiter';
import { index as assessmentsIndex } from '@/routes/recruiter/assessments';
import { index as candidatesIndex } from '@/routes/recruiter/candidates';
import { index as collectionsIndex } from '@/routes/recruiter/collections';
import { index as companiesIndex } from '@/routes/recruiter/companies';
import type { NavItem } from '@/types';

type SharedProps = {
    sidebarOpen: boolean;
};

type Props = PropsWithChildren<{
    title: string;
    search?: string;
    onSearchChange?: (value: string) => void;
    onSearchSubmit?: () => void;
}>;

const sidebarItems: NavItem[] = [
    { title: 'Dashboard', href: recruiterDashboard().url, icon: LayoutDashboard },
    { title: 'Candidates', href: candidatesIndex().url, icon: Users },
    { title: 'Collections', href: collectionsIndex().url, icon: FolderKanban },
    { title: 'Companies', href: companiesIndex().url, icon: Building2 },
    { title: 'Assessments', href: assessmentsIndex().url, icon: ClipboardList },
    { title: 'Analytics', href: recruiterAnalytics().url, icon: BarChart3 },
];

export default function RecruiterLayout({ title, children, search, onSearchChange, onSearchSubmit }: Props) {
    const { sidebarOpen } = usePage<SharedProps>().props;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SidebarProvider defaultOpen={sidebarOpen}>
                <Sidebar collapsible="icon" variant="inset">
                    <SidebarHeader>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton size="lg" asChild>
                                    <Link href={recruiterDashboard()} prefetch>
                                        <AppLogo />
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>

                    <SidebarContent>
                        <NavMain items={sidebarItems} />
                    </SidebarContent>

                    <SidebarFooter>
                        <NavUser />
                    </SidebarFooter>
                </Sidebar>

                <SidebarInset className="mx-auto my-3 w-[95vw] max-w-[95vw] overflow-x-hidden rounded-2xl border border-blue-300/30 bg-background shadow-[0_20px_48px_-30px_rgba(2,132,199,0.45)]">
                    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-sidebar-border/40 bg-background/80 px-4 backdrop-blur">
                        <div className="flex min-w-0 items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <h1 className="truncate text-xl font-semibold text-foreground">{title}</h1>
                        </div>
                        {onSearchChange && (
                            <form
                                className="relative hidden w-72 sm:block"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    onSearchSubmit?.();
                                }}
                            >
                                <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) => onSearchChange(event.target.value)}
                                    placeholder="Search candidates"
                                    className="bg-background/80 pl-9 pr-16"
                                />
                                <button
                                    type="submit"
                                    className="absolute top-1.5 right-1.5 rounded-md border border-border/70 bg-background px-2 py-1 text-xs hover:bg-accent/70"
                                >
                                    Go
                                </button>
                            </form>
                        )}
                    </header>

                    <main className="p-4">{children}</main>
                </SidebarInset>
            </SidebarProvider>

            <FlashToast />
        </div>
    );
}
