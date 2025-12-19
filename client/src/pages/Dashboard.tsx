import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Box, Calendar, Users, TrendingUp } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string;
    change?: string;
    icon: React.ElementType;
}

function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {change && (
                    <p className="text-xs text-muted-foreground">
                        <span className="text-green-500">{change}</span> from last month
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Resources"
                    value="24"
                    change="+2"
                    icon={Box}
                />
                <StatCard
                    title="Active Bookings"
                    value="12"
                    change="+5"
                    icon={Calendar}
                />
                <StatCard
                    title="Open Leads"
                    value="8"
                    change="+3"
                    icon={Users}
                />
                <StatCard
                    title="Revenue (MTD)"
                    value="₹4,52,000"
                    change="+12%"
                    icon={TrendingUp}
                />
            </div>

            {/* Placeholder for charts/tables */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Booking data will appear here once backend is connected.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Lead Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Lead funnel visualization will appear here.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
