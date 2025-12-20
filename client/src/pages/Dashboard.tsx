import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Box, Calendar, Users, TrendingUp, Loader2 } from 'lucide-react';
import { useDashboardStats } from '@/hooks';

interface StatCardProps {
    title: string;
    value: string | number;
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
    const { data: stats, isLoading, error } = useDashboardStats();

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                Failed to load dashboard statistics.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Resources"
                    value={stats?.totalResources || 0}
                    icon={Box}
                />
                <StatCard
                    title="Active Bookings"
                    value={stats?.activeBookings || 0}
                    icon={Calendar}
                />
                <StatCard
                    title="Open Leads"
                    value={stats?.openLeads || 0}
                    icon={Users}
                />
                <StatCard
                    title="Revenue (MTD)"
                    value={`₹${stats?.revenueMTD.toLocaleString()}`}
                    icon={TrendingUp}
                />
            </div>

            {/* Data Visualization */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Bookings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats?.recentBookings && stats.recentBookings.length > 0 ? (
                            <div className="space-y-4">
                                {stats.recentBookings.map((booking: any) => (
                                    <div key={booking.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium">{booking.guest_name}</p>
                                            <p className="text-xs text-muted-foreground">{booking.resource_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm">₹{parseFloat(booking.total_amount).toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(booking.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No recent bookings found.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Lead Pipeline */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lead Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats?.pipelineStats && Object.keys(stats.pipelineStats).length > 0 ? (
                            <div className="space-y-4">
                                {Object.entries(stats.pipelineStats)
                                    .sort((a, b) => b[1] - a[1]) // Sort by count desc
                                    .map(([stage, count]) => (
                                        <div key={stage} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="capitalize">{stage.replace(/_/g, ' ')}</span>
                                                <span className="font-bold">{count}</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-secondary">
                                                <div
                                                    className="h-full rounded-full bg-primary"
                                                    style={{
                                                        width: `${(count / (stats.openLeads + (stats.pipelineStats['won'] || 0) + (stats.pipelineStats['lost'] || 0))) * 100}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No leads in pipeline.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
