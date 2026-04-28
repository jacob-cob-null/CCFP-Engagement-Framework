import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    CalendarDays,
    Users,
    BarChart3,
    ShieldCheck,
    Building2,
    BookOpen,
    Sliders,
    Archive,
    Search,
    Menu,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
    { title: 'Events', href: '/events/setup', icon: CalendarDays },
    { title: 'Employees', href: '/employee', icon: Users },
];

const adminNavItems: NavItem[] = [
    { title: 'User Management', href: '/users', icon: ShieldCheck },
    {
        title: 'Organizational Units',
        href: '/organizational-units',
        icon: Building2,
    },
    { title: 'Academic Terms', href: '/academic-terms', icon: BookOpen },
    { title: 'Point Policies', href: '/point-policies', icon: Sliders },
    { title: 'Semester Archive', href: '/semester-archive', icon: Archive },
    { title: 'Audit Logs', href: '/audit-logs', icon: Search },
];

export function AppSidebar() {
    const { props } = usePage<{ auth: { user: { role: string } | null } }>();
    const isAdmin = props.auth?.user?.role === 'ccfp_admin';
    const { isMobile, setOpenMobile } = useSidebar();

    return (
        <Sidebar
            collapsible="icon"
            variant="sidebar"
            className="border-none bg-sidebar text-sidebar-foreground"
        >
            <SidebarHeader className={isMobile ? 'px-2 pt-2 pb-2' : ''}>
                {isMobile ? (
                    <div className="flex w-full items-center justify-between">
                        <button
                            onClick={() => setOpenMobile(false)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800/40 text-slate-300 transition-colors hover:bg-slate-700/60 hover:text-white"
                        >
                            <Menu className="h-[22px] w-[22px]" />
                        </button>
                    </div>
                ) : (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size="lg"
                                asChild
                                className="text-white hover:bg-[#1a1c3d]"
                            >
                                <Link href={dashboard()}>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
            </SidebarHeader>

            <SidebarContent className={isMobile ? 'px-2' : ''}>
                <NavMain items={mainNavItems} />
                {isAdmin && (
                    <div className="mt-2 border-t border-white/10 pt-2">
                        <NavMain items={adminNavItems} />
                    </div>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
