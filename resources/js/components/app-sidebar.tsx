import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Calendar, FileText, Folder, LayoutGrid, Fuel, BarChart2, ShieldCheck } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
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
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
        icon: LayoutGrid,
    },
    {
        title: 'Trip Ticket',
        href: '/trip-tickets',
        icon: FileText,
    },
    {
        title: 'Gas Slip',
        href: '/gas-slips',
        icon: Fuel,
    },
    {
        title: 'Monthly Report',
        href: '/monthly-report',
        icon: Calendar,
    },
    {
        title: 'Fuel Usage Summary',
        href: '/fuel-usage-summary',
        icon: BarChart2,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as unknown as { auth: { user: { is_admin: boolean } } };

    const adminNavItems: NavItem[] = auth?.user?.is_admin ? [
        {
            title: 'Admin Dashboard',
            href: '/admin/users',
            icon: ShieldCheck,
        }
    ] : [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard().url} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={auth?.user?.is_admin ? adminNavItems : mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
