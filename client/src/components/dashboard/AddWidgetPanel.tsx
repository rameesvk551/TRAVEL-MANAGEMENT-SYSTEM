import { X, BarChart3, PieChart, LineChart, Hash, Layout, Type, List } from 'lucide-react';
import { Button } from '@/components/ui';

interface WidgetType {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    category: string;
}

const WIDGET_TYPES: WidgetType[] = [
    { id: 'bar', name: 'Bar Chart', description: 'Compare values across categories', icon: BarChart3, category: 'Charts' },
    { id: 'line', name: 'Line Chart', description: 'Show trends over time', icon: LineChart, category: 'Charts' },
    { id: 'area', name: 'Area Chart', description: 'Monitor volume and trends', icon: LineChart, category: 'Charts' },
    { id: 'pie', name: 'Pie Chart', description: 'Compare parts of a whole', icon: PieChart, category: 'Charts' },
    { id: 'radar', name: 'Radar Chart', description: 'Multiple variables comparison', icon: Layout, category: 'Charts' },
    { id: 'kpi', name: 'KPI Card', description: 'Display a single key metric', icon: Hash, category: 'Metrics' },
    { id: 'table', name: 'Data Table', description: 'Structured tabular view', icon: List, category: 'Data' },
    { id: 'text', name: 'Text Block', description: 'Annotations and labels', icon: Type, category: 'Utility' },
    { id: 'divider', name: 'Divider', description: 'Visual separation', icon: Layout, category: 'Utility' },
];

interface AddWidgetPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (type: string) => void;
}

export function AddWidgetPanel({ isOpen, onClose, onAdd }: AddWidgetPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 z-[60] w-80 translate-x-0 border-l bg-white shadow-2xl transition-transform">
            <div className="flex h-16 items-center justify-between border-b px-6">
                <h2 className="font-semibold text-dashboard-slate-900">Add Widget</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-dashboard-slate-400">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="overflow-y-auto p-6">
                <div className="space-y-6">
                    {['Charts', 'Metrics', 'Data', 'Utility'].map((category) => (
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
