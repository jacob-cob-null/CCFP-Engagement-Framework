import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid, CalendarDays, ClipboardCheck, Users, BarChart3,
    Settings, ShieldCheck, Building2, BookOpen, Sliders,
    Smartphone, Archive, Search, Menu,
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
    { title: 'Dashboard',        href: dashboard(),         icon: LayoutGrid  },
    { title: 'Events',           href: '/events/setup',     icon: CalendarDays },
    { title: 'Attendance',       href: '/attendance',        icon: ClipboardCheck },
    { title: 'Live Attendance',  href: '/attendance/live',   icon: Smartphone  },
    { title: 'Employee',         href: '/employee',          icon: Users        },
    { title: 'Statistics',       href: '/statistics',        icon: BarChart3    },
    { title: 'Settings',         href: '/settings/profile',  icon: Settings     },
];

const adminNavItems: NavItem[] = [
    { title: 'User Management',       href: '/users',                 icon: ShieldCheck },
    { title: 'Organizational Units',  href: '/organizational-units',  icon: Building2   },
    { title: 'Academic Terms',        href: '/academic-terms',        icon: BookOpen    },
    { title: 'Point Policies',        href: '/point-policies',        icon: Sliders     },
    { title: 'Semester Archive',      href: '/semester-archive',      icon: Archive     },
];

export function AppSidebar() {
    const { props } = usePage<{ auth: { user: { role: string } | null } }>();
    const isAdmin = props.auth?.user?.role === 'ccfp_admin';
    const { isMobile, setOpenMobile } = useSidebar();

    return (
        <Sidebar collapsible="icon" variant="inset" className="bg-[#0f112e] text-slate-300 border-none">
            <SidebarHeader className={isMobile ? "pb-2 pt-2 px-2" : ""}>
                {isMobile ? (
                    <div className="flex w-full items-center justify-between">
                        <button 
                            onClick={() => setOpenMobile(false)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800/40 text-slate-300 transition-colors hover:bg-slate-700/60 hover:text-white"
                        >
                            <Menu className="h-[22px] w-[22px]" />
                        </button>
                        <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-800/40 hover:text-white">
                            <Search className="h-5 w-5" />
                        </button>
                    </div>
                ) : (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild className="hover:bg-[#1a1c3d] text-white">
                                <Link href={dashboard()} prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
            </SidebarHeader>

            <SidebarContent className={isMobile ? "px-2" : ""}>
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
