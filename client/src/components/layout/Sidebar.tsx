import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Box,
    Users,
    Calendar,
    Settings,
    ChevronLeft,
} from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/ui';

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/resources', label: 'Resources', icon: Box },
    { href: '/bookings', label: 'Bookings', icon: Calendar },
    { href: '/leads', label: 'Leads', icon: Users },
    { href: '/dashboards', label: 'Custom Dashboards', icon: LayoutDashboard },
    { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
    const location = useLocation();

    return (
        <aside
            className={cn(
                'flex flex-col border-r bg-card transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b px-4">
                {!collapsed && (
                    <span className="text-lg font-bold text-primary">TravelOps</span>
                )}
                <Button variant="ghost" size="icon" onClick={onToggle} className="ml-auto">
                    <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
