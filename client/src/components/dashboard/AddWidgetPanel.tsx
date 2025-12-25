import { 
    X, 
    BarChart3, 
    PieChart, 
    LineChart, 
    Hash, 
    Layout, 
    Type, 
    List,
    CircleDot,
    Filter,
    ScatterChart,
    Gauge,
    TrendingUp,
    ArrowUpDown,
    Target,
    Activity,
    Calendar,
    Clock,
    Columns,
    MapPin,
    Image,
    ExternalLink,
    Timer,
    Cloud,
    Users,
    DollarSign,
    Package,
    Plane,
    Hotel,
    Car,
    CreditCard,
    Globe,
    BarChart2,
    Percent,
    AlertCircle,
    Box,
    Layers
} from 'lucide-react';
import { Button } from '@/components/ui';

interface WidgetType {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    category: string;
}

const WIDGET_TYPES: WidgetType[] = [
    // Live Dashboard Widgets (Real Data)
    { id: 'live-total-resources', name: 'Total Resources', description: 'Live count of resources', icon: Box, category: 'Live Dashboard' },
    { id: 'live-active-bookings', name: 'Active Bookings', description: 'Live active booking count', icon: Calendar, category: 'Live Dashboard' },
    { id: 'live-open-leads', name: 'Open Leads', description: 'Live open leads count', icon: Users, category: 'Live Dashboard' },
    { id: 'live-revenue-mtd', name: 'Revenue (MTD)', description: 'Month-to-date revenue', icon: TrendingUp, category: 'Live Dashboard' },
    { id: 'live-revenue-trend', name: 'Revenue Trend', description: 'Revenue line chart (6 months)', icon: LineChart, category: 'Live Dashboard' },
    { id: 'live-leads-by-source', name: 'Leads by Source', description: 'Pie chart of lead sources', icon: PieChart, category: 'Live Dashboard' },
    { id: 'live-recent-bookings', name: 'Recent Bookings', description: 'List of recent bookings', icon: List, category: 'Live Dashboard' },
    { id: 'live-booking-distribution', name: 'Booking Distribution', description: 'Bookings by type bar chart', icon: BarChart3, category: 'Live Dashboard' },
    { id: 'live-lead-funnel', name: 'Lead Funnel', description: 'Lead pipeline stages', icon: Filter, category: 'Live Dashboard' },
    { id: 'live-stats-grid', name: 'Stats Overview', description: 'All 4 stat cards in grid', icon: Layers, category: 'Live Dashboard' },

    // Charts
    { id: 'bar', name: 'Bar Chart', description: 'Compare values across categories', icon: BarChart3, category: 'Charts' },
    { id: 'line', name: 'Line Chart', description: 'Show trends over time', icon: LineChart, category: 'Charts' },
    { id: 'area', name: 'Area Chart', description: 'Monitor volume and trends', icon: LineChart, category: 'Charts' },
    { id: 'pie', name: 'Pie Chart', description: 'Compare parts of a whole', icon: PieChart, category: 'Charts' },
    { id: 'donut', name: 'Donut Chart', description: 'Pie chart with center space', icon: CircleDot, category: 'Charts' },
    { id: 'radar', name: 'Radar Chart', description: 'Multiple variables comparison', icon: Layout, category: 'Charts' },
    { id: 'funnel', name: 'Funnel Chart', description: 'Visualize conversion stages', icon: Filter, category: 'Charts' },
    { id: 'scatter', name: 'Scatter Plot', description: 'Show data point distribution', icon: ScatterChart, category: 'Charts' },
    { id: 'gauge', name: 'Gauge Chart', description: 'Display progress toward goal', icon: Gauge, category: 'Charts' },
    { id: 'heatmap', name: 'Heat Map', description: 'Show intensity across matrix', icon: BarChart2, category: 'Charts' },
    
    // Metrics
    { id: 'kpi', name: 'KPI Card', description: 'Display a single key metric', icon: Hash, category: 'Metrics' },
    { id: 'progress', name: 'Progress Card', description: 'Show progress toward target', icon: Target, category: 'Metrics' },
    { id: 'stats', name: 'Stats Grid', description: 'Multiple metrics in one card', icon: Activity, category: 'Metrics' },
    { id: 'trend', name: 'Trend Card', description: 'Show metric with trend line', icon: TrendingUp, category: 'Metrics' },
    { id: 'comparison', name: 'Comparison Card', description: 'Compare two values', icon: ArrowUpDown, category: 'Metrics' },
    { id: 'percentage', name: 'Percentage Card', description: 'Display percentage metric', icon: Percent, category: 'Metrics' },
    
    // Travel-Specific Widgets
    { id: 'bookings-summary', name: 'Bookings Summary', description: 'Overview of booking stats', icon: Calendar, category: 'Travel' },
    { id: 'revenue-tracker', name: 'Revenue Tracker', description: 'Track revenue performance', icon: DollarSign, category: 'Travel' },
    { id: 'customer-stats', name: 'Customer Stats', description: 'Customer analytics overview', icon: Users, category: 'Travel' },
    { id: 'package-performance', name: 'Package Performance', description: 'Tour package statistics', icon: Package, category: 'Travel' },
    { id: 'flights-widget', name: 'Flights Overview', description: 'Flight booking summary', icon: Plane, category: 'Travel' },
    { id: 'hotels-widget', name: 'Hotels Overview', description: 'Hotel booking summary', icon: Hotel, category: 'Travel' },
    { id: 'transport-widget', name: 'Transport Overview', description: 'Transport booking summary', icon: Car, category: 'Travel' },
    { id: 'payments-widget', name: 'Payments Overview', description: 'Payment status summary', icon: CreditCard, category: 'Travel' },
    { id: 'destinations-map', name: 'Destinations Map', description: 'Popular destinations visual', icon: Globe, category: 'Travel' },
    
    // Data Widgets
    { id: 'table', name: 'Data Table', description: 'Structured tabular view', icon: List, category: 'Data' },
    { id: 'calendar-widget', name: 'Calendar View', description: 'Show events on calendar', icon: Calendar, category: 'Data' },
    { id: 'timeline', name: 'Timeline', description: 'Show chronological events', icon: Clock, category: 'Data' },
    { id: 'kanban', name: 'Kanban Board', description: 'Task/status board view', icon: Columns, category: 'Data' },
    { id: 'map', name: 'Map Widget', description: 'Geographic data display', icon: MapPin, category: 'Data' },
    { id: 'alerts', name: 'Alerts Widget', description: 'Show important notifications', icon: AlertCircle, category: 'Data' },
    
    // Utility
    { id: 'text', name: 'Text Block', description: 'Annotations and labels', icon: Type, category: 'Utility' },
    { id: 'divider', name: 'Divider', description: 'Visual separation', icon: Layout, category: 'Utility' },
    { id: 'image', name: 'Image', description: 'Display an image', icon: Image, category: 'Utility' },
    { id: 'iframe', name: 'Embed/iFrame', description: 'Embed external content', icon: ExternalLink, category: 'Utility' },
    { id: 'countdown', name: 'Countdown Timer', description: 'Count down to event', icon: Timer, category: 'Utility' },
    { id: 'weather', name: 'Weather Widget', description: 'Show weather info', icon: Cloud, category: 'Utility' },
];

interface AddWidgetPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (type: string) => void;
}

export function AddWidgetPanel({ isOpen, onClose, onAdd }: AddWidgetPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 z-[60] w-80 translate-x-0 border-l bg-white shadow-2xl transition-transform flex flex-col">
            <div className="flex h-16 items-center justify-between border-b px-6 flex-shrink-0">
                <h2 className="font-semibold text-dashboard-slate-900">Add Widget</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-dashboard-slate-400">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                    {['Live Dashboard', 'Charts', 'Metrics', 'Travel', 'Data', 'Utility'].map((category) => (
                        <div key={category}>
                            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-dashboard-slate-400">
                                {category}
                            </h3>
                            <div className="space-y-2">
                                {WIDGET_TYPES.filter(w => w.category === category).map((widget) => (
                                    <button
                                        key={widget.id}
                                        onClick={() => onAdd(widget.id)}
                                        className="group flex w-full items-start gap-4 rounded-xl border border-transparent p-3 text-left transition-all hover:border-dashboard-indigo-100 hover:bg-dashboard-indigo-50/50"
                                    >
                                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-dashboard-slate-50 text-dashboard-slate-600 transition-colors group-hover:bg-white group-hover:text-dashboard-indigo-600">
                                            <widget.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-dashboard-slate-900 group-hover:text-dashboard-indigo-600">
                                                {widget.name}
                                            </div>
                                            <div className="text-xs text-dashboard-slate-500">
                                                {widget.description}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
