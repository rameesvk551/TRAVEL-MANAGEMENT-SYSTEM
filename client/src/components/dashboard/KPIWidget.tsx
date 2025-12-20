import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPIWidgetProps {
    value: string | number;
    label: string;
    trend?: {
        value: number;
        isUp: boolean;
    };
    prefix?: string;
    suffix?: string;
}

export function KPIWidget({ value, label, trend, prefix, suffix }: KPIWidgetProps) {
    return (
        <div className="flex flex-col h-full justify-between">
            <div>
                <span className="text-[10px] font-bold text-dashboard-slate-400 uppercase tracking-wider">{label}</span>
                <div className="mt-1 flex items-baseline gap-1">
                    {prefix && <span className="text-xl font-medium text-dashboard-slate-400">{prefix}</span>}
                    <span className="text-3xl font-bold text-dashboard-slate-900 tracking-tight">{value}</span>
                    {suffix && <span className="text-sm font-medium text-dashboard-slate-500">{suffix}</span>}
                </div>
            </div>

            {trend && (
                <div className={`flex items-center gap-1.5 mt-2 ${trend.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <div className={`p-1 rounded-md ${trend.isUp ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                        {trend.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    </div>
                    <span className="text-xs font-bold">{trend.value}%</span>
                    <span className="text-[10px] text-dashboard-slate-400 font-medium">vs last month</span>
                </div>
            )}
        </div>
    );
}
