import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid, CalendarDays, ClipboardCheck, Users, BarChart3,
    Settings, ShieldCheck, Building2, BookOpen, Sliders,
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
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    { title: 'Dashboard',   href: dashboard(),      icon: LayoutGrid     },
    { title: 'Events',      href: '/events/setup',  icon: CalendarDays   },
    { title: 'Attendance',  href: '/attendance',     icon: ClipboardCheck },
    { title: 'Employee',    href: '/employee',       icon: Users          },
    { title: 'Statistics',  href: '/statistics',     icon: BarChart3      },
    { title: 'Settings',    href: '/settings/profile', icon: Settings     },
];

const adminNavItems: NavItem[] = [
    { title: 'User Management',       href: '/users',                 icon: ShieldCheck },
    { title: 'Organizational Units',  href: '/organizational-units',  icon: Building2   },
    { title: 'Academic Terms',        href: '/academic-terms',        icon: BookOpen    },
    { title: 'Point Policies',        href: '/point-policies',        icon: Sliders     },
];

export function AppSidebar() {
    const { props } = usePage<{ auth: { user: { role: string } | null } }>();
    const isAdmin = props.auth?.user?.role === 'ccfp_admin';

    return (
        <Sidebar collapsible="icon" variant="inset" className="bg-[#0f112e] text-slate-300 border-none">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-[#1a1c3d] text-white">
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
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
