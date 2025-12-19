import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/resources': 'Resources',
    '/bookings': 'Bookings',
    '/leads': 'Leads & CRM',
    '/settings': 'Settings',
};

export function MainLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const location = useLocation();
    const title = pageTitles[location.pathname] || 'Travel Ops';

    return (
        <div className="flex h-screen bg-background">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header title={title} />

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
