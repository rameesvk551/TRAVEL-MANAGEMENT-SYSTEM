import { KPIWidget } from './KPIWidget';
import { ChartWidget } from './ChartWidget';
import { TableWidget } from './TableWidget';

interface WidgetRendererProps {
    type: string;
    config?: any;
}

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

export function WidgetRenderer({ type, config }: WidgetRendererProps) {
    switch (type) {
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
        case 'area':
            return <ChartWidget type="area" data={MOCK_CHART_DATA} config={config} />;
        case 'radar':
            return <ChartWidget type="radar" data={MOCK_CHART_DATA} config={config} />;
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
        default:
            return (
                <div className="flex h-full items-center justify-center rounded border border-dashed border-dashboard-slate-200 bg-dashboard-slate-50 text-[10px] font-bold text-dashboard-slate-400">
                    UNSUPPORTED TYPE: {type.toUpperCase()}
                </div>
            );
    }
}
