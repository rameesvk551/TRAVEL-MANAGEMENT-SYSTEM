import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Box, Calendar, Users, TrendingUp, Loader2 } from 'lucide-react';
import { useDashboardStats } from '@/hooks';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ElementType;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Revenue Trend */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.revenueOverTime}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                                <Tooltip formatter={(value) => `₹${(value as number).toLocaleString()}`} />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Leads by Source */}
                <Card>
                    <CardHeader>
                        <CardTitle>Leads by Source</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.leadsBySource}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {stats?.leadsBySource.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                            {stats?.leadsBySource.map((source, index) => (
                                <div key={source.name} className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="capitalize">{source.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                                            <p className="text-sm font-semibold text-primary">₹{parseFloat(booking.total_amount).toLocaleString()}</p>
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

                {/* Lead Pipeline Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Booking Distribution (By Type)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.bookingsByResource}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                    <CardHeader className="pt-0">
                        <CardTitle className="text-base">Lead Funnel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats?.pipelineStats && Object.keys(stats.pipelineStats).length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(stats.pipelineStats)
                                    .filter(([stage]) => !['won', 'lost'].includes(stage))
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([stage, count]) => (
                                        <div key={stage} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="capitalize text-muted-foreground">{stage.replace(/_/g, ' ')}</span>
                                                <span className="font-medium">{count}</span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-secondary">
                                                <div
                                                    className="h-full rounded-full bg-primary"
                                                    style={{
                                                        width: `${(count / stats.openLeads) * 100}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
