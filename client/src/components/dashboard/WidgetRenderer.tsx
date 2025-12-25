import { KPIWidget } from './KPIWidget';
import { ChartWidget } from './ChartWidget';
import { TableWidget } from './TableWidget';
import { 
    TrendingUp, 
    TrendingDown, 
    Users, 
    DollarSign, 
    Package, 
    Plane, 
    Hotel, 
    Car, 
    CreditCard,
    Calendar,
    Clock,
    MapPin,
    AlertCircle,
    CheckCircle,
    XCircle,
    Cloud,
    Sun,
    CloudRain,
    Box
} from 'lucide-react';
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

interface WidgetRendererProps {
    type: string;
    config?: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const MOCK_CHART_DATA = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
];

const MOCK_PIE_DATA = [
    { name: 'Direct', value: 400 },
    { name: 'Social', value: 300 },
    { name: 'Search', value: 300 },
];

const MOCK_TABLE_DATA = [
    { id: 1, name: 'Dubai Safari', value: '$12,400', status: 'Confirmed' },
    { id: 2, name: 'Paris City Tour', value: '$8,200', status: 'Pending' },
    { id: 3, name: 'Swiss Alps Exp', value: '$15,900', status: 'Confirmed' },
    { id: 4, name: 'Bali Getaway', value: '$5,400', status: 'Cancelled' },
];

const MOCK_FUNNEL_DATA = [
    { name: 'Inquiries', value: 1000 },
    { name: 'Quotes', value: 750 },
    { name: 'Confirmed', value: 400 },
    { name: 'Completed', value: 350 },
];

const MOCK_SCATTER_DATA = [
    { x: 100, y: 200, z: 200 },
    { x: 120, y: 100, z: 260 },
    { x: 170, y: 300, z: 400 },
    { x: 140, y: 250, z: 280 },
    { x: 150, y: 400, z: 500 },
];

const MOCK_TIMELINE_DATA = [
    { time: '09:00', event: 'Dubai Desert Safari', status: 'completed' },
    { time: '11:30', event: 'Airport Pickup - MR. Johnson', status: 'in-progress' },
    { time: '14:00', event: 'Hotel Check-in - Grand Hyatt', status: 'pending' },
    { time: '16:00', event: 'City Tour Departure', status: 'pending' },
];

const MOCK_ALERTS = [
    { type: 'warning', message: '3 bookings pending confirmation', time: '5 min ago' },
    { type: 'success', message: 'Payment received for #BK-2045', time: '15 min ago' },
    { type: 'error', message: 'Flight cancelled - Need rebooking', time: '1 hour ago' },
];

// Mock data for live dashboard widgets
const MOCK_REVENUE_TREND = [
    { name: 'Jun', amount: 50000 },
    { name: 'Jul', amount: 650000 },
    { name: 'Aug', amount: 420000 },
    { name: 'Sep', amount: 505181 },
    { name: 'Oct', amount: 520000 },
    { name: 'Nov', amount: 780000 },
    { name: 'Dec', amount: 459791 },
];

const MOCK_LEADS_BY_SOURCE = [
    { name: 'Email', count: 8 },
    { name: 'Social', count: 5 },
    { name: 'Referral', count: 4 },
    { name: 'Phone', count: 2 },
];

const MOCK_RECENT_BOOKINGS = [
    { id: 1, guest_name: 'Bali Beach Escape', resource_name: 'Backwater Cruise', total_amount: '46341.55', created_at: '2025-12-18' },
    { id: 2, guest_name: 'Bali Beach Escape', resource_name: 'Toyota Innova Crysta', total_amount: '101978.26', created_at: '2025-12-15' },
    { id: 3, guest_name: 'Bali Beach Escape', resource_name: 'Himalayan Adventure', total_amount: '88500.12', created_at: '2025-12-14' },
    { id: 4, guest_name: 'Galapagos Diving', resource_name: 'Toyota Innova Crysta', total_amount: '32857.96', created_at: '2025-12-05' },
    { id: 5, guest_name: 'Dubai Luxury', resource_name: 'Golden Triangle Tour', total_amount: '103465.87', created_at: '2025-12-03' },
];

const MOCK_BOOKINGS_BY_RESOURCE = [
    { name: 'activity', count: 10 },
    { name: 'hotel', count: 10 },
    { name: 'tour', count: 10 },
    { name: 'trek', count: 10 },
    { name: 'vehicle', count: 10 },
];

const MOCK_PIPELINE_STATS = {
    qualified: 5,
    contacted: 5,
    new: 5,
    proposal: 4,
};

export function WidgetRenderer({ type, config }: WidgetRendererProps) {
    switch (type) {
        // Live Dashboard Widgets
        case 'live-total-resources':
            return (
                <div className="h-full w-full flex flex-col justify-center p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between pb-2">
                        <span className="text-sm font-medium text-muted-foreground">Total Resources</span>
                        <Box className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">5</div>
                </div>
            );
        case 'live-active-bookings':
            return (
                <div className="h-full w-full flex flex-col justify-center p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between pb-2">
                        <span className="text-sm font-medium text-muted-foreground">Active Bookings</span>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">50</div>
                </div>
            );
        case 'live-open-leads':
            return (
                <div className="h-full w-full flex flex-col justify-center p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between pb-2">
                        <span className="text-sm font-medium text-muted-foreground">Open Leads</span>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">19</div>
                </div>
            );
        case 'live-revenue-mtd':
            return (
                <div className="h-full w-full flex flex-col justify-center p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between pb-2">
                        <span className="text-sm font-medium text-muted-foreground">Revenue (MTD)</span>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">₹459,791.57</div>
                </div>
            );
        case 'live-stats-grid':
            return (
                <div className="h-full w-full grid grid-cols-2 gap-3 p-3">
                    <div className="flex flex-col justify-center p-3 bg-white rounded-lg border">
                        <div className="flex items-center justify-between pb-1">
                            <span className="text-xs font-medium text-muted-foreground">Total Resources</span>
                            <Box className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="text-xl font-bold">5</div>
                    </div>
                    <div className="flex flex-col justify-center p-3 bg-white rounded-lg border">
                        <div className="flex items-center justify-between pb-1">
                            <span className="text-xs font-medium text-muted-foreground">Active Bookings</span>
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="text-xl font-bold">50</div>
                    </div>
                    <div className="flex flex-col justify-center p-3 bg-white rounded-lg border">
                        <div className="flex items-center justify-between pb-1">
                            <span className="text-xs font-medium text-muted-foreground">Open Leads</span>
                            <Users className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="text-xl font-bold">19</div>
                    </div>
                    <div className="flex flex-col justify-center p-3 bg-white rounded-lg border">
                        <div className="flex items-center justify-between pb-1">
                            <span className="text-xs font-medium text-muted-foreground">Revenue (MTD)</span>
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="text-lg font-bold">₹459K</div>
                    </div>
                </div>
            );
        case 'live-revenue-trend':
            return (
                <div className="h-full w-full flex flex-col p-4 bg-white rounded-lg border">
                    <h3 className="text-base font-semibold mb-3">Revenue Trend (Last 6 Months)</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={MOCK_REVENUE_TREND}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={(value) => `₹${value / 1000}k`} tick={{ fontSize: 11 }} />
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
                    </div>
                </div>
            );
        case 'live-leads-by-source':
            return (
                <div className="h-full w-full flex flex-col p-4 bg-white rounded-lg border">
                    <h3 className="text-base font-semibold mb-2">Leads by Source</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={MOCK_LEADS_BY_SOURCE}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {MOCK_LEADS_BY_SOURCE.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                        {MOCK_LEADS_BY_SOURCE.map((source, index) => (
                            <div key={source.name} className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="capitalize">{source.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'live-recent-bookings':
            return (
                <div className="h-full w-full flex flex-col p-4 bg-white rounded-lg border overflow-hidden">
                    <h3 className="text-base font-semibold mb-3">Recent Bookings</h3>
                    <div className="flex-1 overflow-auto space-y-3">
                        {MOCK_RECENT_BOOKINGS.map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium text-sm">{booking.guest_name}</p>
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
                </div>
            );
        case 'live-booking-distribution':
            return (
                <div className="h-full w-full flex flex-col p-4 bg-white rounded-lg border">
                    <h3 className="text-base font-semibold mb-3">Booking Distribution (By Type)</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={MOCK_BOOKINGS_BY_RESOURCE}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        case 'live-lead-funnel':
            return (
                <div className="h-full w-full flex flex-col p-4 bg-white rounded-lg border">
                    <h3 className="text-base font-semibold mb-3">Lead Funnel</h3>
                    <div className="flex-1 space-y-3 overflow-auto">
                        {Object.entries(MOCK_PIPELINE_STATS)
                            .sort((a, b) => b[1] - a[1])
                            .map(([stage, count]) => (
                                <div key={stage} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="capitalize text-muted-foreground">{stage.replace(/_/g, ' ')}</span>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-secondary">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{
                                                width: `${(count / 19) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            );
        case 'kpi':
            return (
                <KPIWidget
                    label="Total Revenue"
                    value="12,540"
                    prefix="$"
                    trend={{ value: 12.5, isUp: true }}
                />
            );
        case 'bar':
            return <ChartWidget type="bar" data={MOCK_CHART_DATA} config={config} />;
        case 'line':
            return <ChartWidget type="line" data={MOCK_CHART_DATA} config={config} />;
        case 'pie':
            return <ChartWidget type="pie" data={MOCK_PIE_DATA} config={config} />;
        case 'donut':
            return <ChartWidget type="pie" data={MOCK_PIE_DATA} config={{ ...config, innerRadius: '60%' }} />;
        case 'area':
            return <ChartWidget type="area" data={MOCK_CHART_DATA} config={config} />;
        case 'radar':
            return <ChartWidget type="radar" data={MOCK_CHART_DATA} config={config} />;
        case 'funnel':
            return (
                <div className="h-full w-full flex flex-col justify-center px-4">
                    {MOCK_FUNNEL_DATA.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-3 mb-2">
                            <div 
                                className="h-8 bg-gradient-to-r from-dashboard-indigo-500 to-dashboard-indigo-400 rounded-r-full flex items-center justify-end pr-3"
                                style={{ width: `${(item.value / 1000) * 100}%` }}
                            >
                                <span className="text-xs font-medium text-white">{item.value}</span>
                            </div>
                            <span className="text-xs text-dashboard-slate-600 whitespace-nowrap">{item.name}</span>
                        </div>
                    ))}
                </div>
            );
        case 'scatter':
            return <ChartWidget type="scatter" data={MOCK_SCATTER_DATA} config={config} />;
        case 'gauge':
            return (
                <div className="h-full w-full flex flex-col items-center justify-center">
                    <div className="relative w-32 h-16 overflow-hidden">
                        <div className="absolute inset-0 rounded-t-full border-8 border-dashboard-slate-100" />
                        <div 
                            className="absolute inset-0 rounded-t-full border-8 border-transparent border-t-dashboard-indigo-500 border-l-dashboard-indigo-500"
                            style={{ transform: 'rotate(-45deg)' }}
                        />
                    </div>
                    <div className="text-2xl font-bold text-dashboard-slate-900 mt-2">75%</div>
                    <div className="text-xs text-dashboard-slate-500">Target Progress</div>
                </div>
            );
        case 'heatmap':
            return (
                <div className="h-full w-full p-4">
                    <div className="grid grid-cols-7 gap-1">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="text-[10px] text-center text-dashboard-slate-400">{day}</div>
                        ))}
                        {Array.from({ length: 28 }).map((_, i) => (
                            <div 
                                key={i}
                                className="aspect-square rounded-sm"
                                style={{ 
                                    backgroundColor: `rgba(99, 102, 241, ${Math.random() * 0.8 + 0.1})` 
                                }}
                            />
                        ))}
                    </div>
                </div>
            );
        case 'progress':
            return (
                <div className="h-full w-full flex flex-col justify-center px-4">
                    <div className="text-xs text-dashboard-slate-500 mb-1">Monthly Target</div>
                    <div className="text-2xl font-bold text-dashboard-slate-900">$45,200 / $60,000</div>
                    <div className="mt-3 h-3 w-full rounded-full bg-dashboard-slate-100 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-dashboard-indigo-500 to-purple-500 rounded-full" style={{ width: '75%' }} />
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-xs text-dashboard-slate-500">75% achieved</span>
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> +12% vs last month
                        </span>
                    </div>
                </div>
            );
        case 'stats':
            return (
                <div className="h-full w-full grid grid-cols-2 gap-3 p-4">
                    <div className="bg-dashboard-slate-50 rounded-lg p-3">
                        <div className="text-xs text-dashboard-slate-500">Bookings</div>
                        <div className="text-xl font-bold text-dashboard-slate-900">248</div>
                    </div>
                    <div className="bg-dashboard-slate-50 rounded-lg p-3">
                        <div className="text-xs text-dashboard-slate-500">Revenue</div>
                        <div className="text-xl font-bold text-dashboard-slate-900">$52K</div>
                    </div>
                    <div className="bg-dashboard-slate-50 rounded-lg p-3">
                        <div className="text-xs text-dashboard-slate-500">Customers</div>
                        <div className="text-xl font-bold text-dashboard-slate-900">1,420</div>
                    </div>
                    <div className="bg-dashboard-slate-50 rounded-lg p-3">
                        <div className="text-xs text-dashboard-slate-500">Avg. Value</div>
                        <div className="text-xl font-bold text-dashboard-slate-900">$210</div>
                    </div>
                </div>
            );
        case 'trend':
            return (
                <div className="h-full w-full flex flex-col px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-dashboard-slate-500">Weekly Bookings</div>
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> +8.5%
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-dashboard-slate-900 mt-1">156</div>
                    <div className="flex-1 flex items-end gap-1 mt-2">
                        {[40, 55, 35, 70, 60, 85, 75].map((h, i) => (
                            <div key={i} className="flex-1 bg-dashboard-indigo-500/20 rounded-t" style={{ height: `${h}%` }}>
                                <div className="w-full bg-dashboard-indigo-500 rounded-t" style={{ height: `${h * 0.7}%` }} />
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'comparison':
            return (
                <div className="h-full w-full flex items-center justify-center gap-8 px-4">
                    <div className="text-center">
                        <div className="text-xs text-dashboard-slate-500">This Month</div>
                        <div className="text-2xl font-bold text-emerald-600">$48,500</div>
                        <div className="text-xs text-emerald-600 flex items-center justify-center gap-1 mt-1">
                            <TrendingUp className="h-3 w-3" /> +15%
                        </div>
                    </div>
                    <div className="h-12 w-px bg-dashboard-slate-200" />
                    <div className="text-center">
                        <div className="text-xs text-dashboard-slate-500">Last Month</div>
                        <div className="text-2xl font-bold text-dashboard-slate-400">$42,200</div>
                        <div className="text-xs text-dashboard-slate-400 mt-1">Previous</div>
                    </div>
                </div>
            );
        case 'percentage':
            return (
                <div className="h-full w-full flex flex-col items-center justify-center">
                    <div className="relative w-24 h-24">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="48" cy="48" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                            <circle 
                                cx="48" cy="48" r="40" fill="none" 
                                stroke="url(#gradient)" strokeWidth="8"
                                strokeDasharray={`${2 * Math.PI * 40 * 0.72} ${2 * Math.PI * 40}`}
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-dashboard-slate-900">72%</span>
                        </div>
                    </div>
                    <div className="text-xs text-dashboard-slate-500 mt-2">Occupancy Rate</div>
                </div>
            );
        
        // Travel-Specific Widgets
        case 'bookings-summary':
            return (
                <div className="h-full w-full p-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-emerald-50 rounded-lg p-3 text-center">
                            <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-emerald-600">124</div>
                            <div className="text-[10px] text-emerald-600">Confirmed</div>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3 text-center">
                            <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-amber-600">38</div>
                            <div className="text-[10px] text-amber-600">Pending</div>
                        </div>
                        <div className="bg-rose-50 rounded-lg p-3 text-center">
                            <XCircle className="h-5 w-5 text-rose-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-rose-600">12</div>
                            <div className="text-[10px] text-rose-600">Cancelled</div>
                        </div>
                    </div>
                </div>
            );
        case 'revenue-tracker':
            return (
                <div className="h-full w-full flex flex-col p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-xs text-dashboard-slate-500">Today's Revenue</div>
                            <div className="text-xl font-bold text-dashboard-slate-900">$8,450</div>
                        </div>
                    </div>
                    <div className="flex-1 flex items-end gap-1">
                        {[45, 60, 40, 80, 55, 70, 90].map((h, i) => (
                            <div key={i} className="flex-1 bg-emerald-100 rounded-t" style={{ height: `${h}%` }}>
                                <div className="w-full h-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t opacity-80" />
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'customer-stats':
            return (
                <div className="h-full w-full flex flex-col p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-xs text-dashboard-slate-500">Total Customers</div>
                            <div className="text-xl font-bold text-dashboard-slate-900">2,847</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                        <div className="bg-dashboard-slate-50 rounded-lg p-2 text-center">
                            <div className="text-sm font-semibold text-dashboard-slate-900">156</div>
                            <div className="text-[10px] text-dashboard-slate-500">New This Month</div>
                        </div>
                        <div className="bg-dashboard-slate-50 rounded-lg p-2 text-center">
                            <div className="text-sm font-semibold text-dashboard-slate-900">68%</div>
                            <div className="text-[10px] text-dashboard-slate-500">Repeat Rate</div>
                        </div>
                    </div>
                </div>
            );
        case 'package-performance':
            return (
                <div className="h-full w-full p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Package className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-dashboard-slate-900">Top Packages</span>
                    </div>
                    <div className="space-y-2">
                        {[
                            { name: 'Dubai Safari', sales: 45, color: 'bg-purple-500' },
                            { name: 'Paris Tour', sales: 32, color: 'bg-blue-500' },
                            { name: 'Maldives', sales: 28, color: 'bg-emerald-500' },
                        ].map((pkg) => (
                            <div key={pkg.name} className="flex items-center gap-2">
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-dashboard-slate-600">{pkg.name}</span>
                                        <span className="text-dashboard-slate-900 font-medium">{pkg.sales}</span>
                                    </div>
                                    <div className="h-2 w-full bg-dashboard-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${pkg.color} rounded-full`} style={{ width: `${(pkg.sales / 45) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'flights-widget':
            return (
                <div className="h-full w-full flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-sky-100 rounded-xl">
                            <Plane className="h-6 w-6 text-sky-600" />
                        </div>
                        <div>
                            <div className="text-xs text-dashboard-slate-500">Flight Bookings</div>
                            <div className="text-2xl font-bold text-dashboard-slate-900">89</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-emerald-600 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> +12%
                        </div>
                        <div className="text-xs text-dashboard-slate-400">vs last week</div>
                    </div>
                </div>
            );
        case 'hotels-widget':
            return (
                <div className="h-full w-full flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-100 rounded-xl">
                            <Hotel className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-xs text-dashboard-slate-500">Hotel Bookings</div>
                            <div className="text-2xl font-bold text-dashboard-slate-900">156</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-emerald-600 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> +8%
                        </div>
                        <div className="text-xs text-dashboard-slate-400">vs last week</div>
                    </div>
                </div>
            );
        case 'transport-widget':
            return (
                <div className="h-full w-full flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <Car className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-xs text-dashboard-slate-500">Transport</div>
                            <div className="text-2xl font-bold text-dashboard-slate-900">67</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-rose-600 flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" /> -3%
                        </div>
                        <div className="text-xs text-dashboard-slate-400">vs last week</div>
                    </div>
                </div>
            );
        case 'payments-widget':
            return (
                <div className="h-full w-full p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="h-5 w-5 text-indigo-600" />
                        <span className="text-sm font-medium text-dashboard-slate-900">Payments</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-dashboard-slate-500">Completed</span>
                            <span className="text-sm font-semibold text-emerald-600">$124,500</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-dashboard-slate-500">Pending</span>
                            <span className="text-sm font-semibold text-amber-600">$18,200</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-dashboard-slate-500">Failed</span>
                            <span className="text-sm font-semibold text-rose-600">$2,400</span>
                        </div>
                    </div>
                </div>
            );
        case 'destinations-map':
            return (
                <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                    <MapPin className="h-8 w-8 text-indigo-500 mb-2" />
                    <div className="text-sm font-medium text-dashboard-slate-900">Popular Destinations</div>
                    <div className="flex flex-wrap gap-1 mt-2 justify-center">
                        {['Dubai', 'Paris', 'Maldives', 'Tokyo', 'Bali'].map((dest) => (
                            <span key={dest} className="px-2 py-0.5 bg-white rounded-full text-[10px] text-dashboard-slate-600 shadow-sm">
                                {dest}
                            </span>
                        ))}
                    </div>
                </div>
            );
        
        // Data Widgets
        case 'table':
            return (
                <TableWidget
                    data={MOCK_TABLE_DATA}
                    columns={[
                        { key: 'name', label: 'Campaign' },
                        { key: 'value', label: 'Revenue' },
                        { key: 'status', label: 'Status' }
                    ]}
                />
            );
        case 'calendar-widget':
            return (
                <div className="h-full w-full p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-dashboard-slate-500" />
                        <span className="text-sm font-medium text-dashboard-slate-900">December 2025</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="text-[10px] text-dashboard-slate-400 py-1">{d}</div>
                        ))}
                        {Array.from({ length: 31 }).map((_, i) => (
                            <div 
                                key={i} 
                                className={`text-[10px] py-1 rounded ${
                                    i === 24 ? 'bg-dashboard-indigo-500 text-white' : 
                                    [5, 12, 18, 25].includes(i) ? 'bg-emerald-100 text-emerald-700' : 
                                    'text-dashboard-slate-600'
                                }`}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'timeline':
            return (
                <div className="h-full w-full p-4 overflow-auto">
                    <div className="space-y-3">
                        {MOCK_TIMELINE_DATA.map((item, index) => (
                            <div key={index} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className={`w-2 h-2 rounded-full ${
                                        item.status === 'completed' ? 'bg-emerald-500' :
                                        item.status === 'in-progress' ? 'bg-blue-500' : 'bg-dashboard-slate-300'
                                    }`} />
                                    {index < MOCK_TIMELINE_DATA.length - 1 && (
                                        <div className="w-px h-8 bg-dashboard-slate-200" />
                                    )}
                                </div>
                                <div className="flex-1 -mt-1">
                                    <div className="text-[10px] text-dashboard-slate-400">{item.time}</div>
                                    <div className="text-xs text-dashboard-slate-900">{item.event}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'kanban':
            return (
                <div className="h-full w-full flex gap-2 p-4 overflow-auto">
                    {['To Do', 'In Progress', 'Done'].map((col) => (
                        <div key={col} className="flex-1 min-w-[100px] bg-dashboard-slate-50 rounded-lg p-2">
                            <div className="text-[10px] font-semibold text-dashboard-slate-500 mb-2">{col}</div>
                            <div className="space-y-1">
                                {[1, 2].map((i) => (
                                    <div key={i} className="bg-white rounded p-2 shadow-sm border border-dashboard-slate-100">
                                        <div className="text-[10px] text-dashboard-slate-600">Task {i}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        case 'map':
            return (
                <div className="h-full w-full bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                        <MapPin className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-xs text-dashboard-slate-500">Interactive Map</div>
                        <div className="text-[10px] text-dashboard-slate-400">Connect to map API</div>
                    </div>
                </div>
            );
        case 'alerts':
            return (
                <div className="h-full w-full p-4 overflow-auto">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-4 w-4 text-dashboard-slate-500" />
                        <span className="text-sm font-medium text-dashboard-slate-900">Alerts</span>
                    </div>
                    <div className="space-y-2">
                        {MOCK_ALERTS.map((alert, index) => (
                            <div 
                                key={index} 
                                className={`p-2 rounded-lg border ${
                                    alert.type === 'warning' ? 'bg-amber-50 border-amber-100' :
                                    alert.type === 'success' ? 'bg-emerald-50 border-emerald-100' :
                                    'bg-rose-50 border-rose-100'
                                }`}
                            >
                                <div className="text-xs text-dashboard-slate-700">{alert.message}</div>
                                <div className="text-[10px] text-dashboard-slate-400 mt-1">{alert.time}</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        
        // Utility Widgets
        case 'text':
            return (
                <div className="p-2 prose prose-slate max-w-none">
                    <p className="text-sm text-dashboard-slate-600">
                        Use this space to add annotations, campaign goals, or summary notes for your dashboard.
                    </p>
                </div>
            );
        case 'divider':
            return (
                <div className="flex h-full items-center px-2">
                    <div className="w-full border-t border-dashboard-slate-100" />
                </div>
            );
        case 'image':
            return (
                <div className="h-full w-full bg-dashboard-slate-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-dashboard-slate-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <svg className="w-6 h-6 text-dashboard-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="text-xs text-dashboard-slate-500">Add Image URL</div>
                    </div>
                </div>
            );
        case 'iframe':
            return (
                <div className="h-full w-full bg-dashboard-slate-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-dashboard-slate-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <svg className="w-6 h-6 text-dashboard-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </div>
                        <div className="text-xs text-dashboard-slate-500">Embed External Content</div>
                    </div>
                </div>
            );
        case 'countdown':
            return (
                <div className="h-full w-full flex flex-col items-center justify-center">
                    <div className="text-xs text-dashboard-slate-500 mb-2">New Year Special Ends In</div>
                    <div className="flex gap-3">
                        {[
                            { value: '06', label: 'Days' },
                            { value: '14', label: 'Hours' },
                            { value: '32', label: 'Mins' },
                            { value: '08', label: 'Secs' },
                        ].map((item) => (
                            <div key={item.label} className="text-center">
                                <div className="bg-dashboard-slate-900 text-white px-3 py-2 rounded-lg text-xl font-bold">
                                    {item.value}
                                </div>
                                <div className="text-[10px] text-dashboard-slate-400 mt-1">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'weather':
            return (
                <div className="h-full w-full flex items-center justify-between p-4 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg text-white">
                    <div>
                        <div className="text-xs opacity-80">Dubai, UAE</div>
                        <div className="text-3xl font-bold">28°C</div>
                        <div className="text-xs opacity-80">Partly Cloudy</div>
                    </div>
                    <div className="text-right">
                        <Sun className="h-12 w-12 opacity-90" />
                    </div>
                </div>
            );
        default:
            return (
                <div className="flex h-full items-center justify-center rounded border border-dashed border-dashboard-slate-200 bg-dashboard-slate-50 text-[10px] font-bold text-dashboard-slate-400">
                    UNSUPPORTED TYPE: {type.toUpperCase()}
                </div>
            );
    }
}
