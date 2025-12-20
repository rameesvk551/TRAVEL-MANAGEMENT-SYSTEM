import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layout, MoreVertical, Clock, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';

export default function DashboardList() {
    const [dashboards, setDashboards] = useState<any[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('dashboards_list');
        if (saved) {
            setDashboards(JSON.parse(saved));
        }
    }, []);

    const handleDelete = (id: string) => {
        if (!confirm('Are you sure you want to delete this dashboard?')) return;

        const newList = dashboards.filter(d => d.id !== id);
        setDashboards(newList);
        localStorage.setItem('dashboards_list', JSON.stringify(newList));
        localStorage.removeItem(`dashboard_${id}`);
    };
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dashboard-slate-900">Custom Dashboards</h1>
                    <p className="text-sm text-dashboard-slate-500">Visual analytics for your travel operations</p>
                </div>
                <Link to="/dashboards/builder">
                    <Button className="bg-dashboard-indigo-600 hover:bg-dashboard-indigo-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Dashboard
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dashboards.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dashboard-slate-200">
                        <div className="h-12 w-12 rounded-full bg-dashboard-slate-100 flex items-center justify-center text-dashboard-slate-400 mb-4">
                            <Plus className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-medium text-dashboard-slate-900">No dashboards found</h3>
                        <p className="text-sm text-dashboard-slate-500 mt-1">Create your first dashboard to get started</p>
                    </div>
                ) : (
                    dashboards.map((dashboard) => (
                        <div
                            key={dashboard.id}
                            className="group relative flex flex-col rounded-xl border border-dashboard-slate-200 bg-white p-5 transition-all hover:border-dashboard-indigo-200 hover:shadow-lg"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dashboard-slate-50 text-dashboard-slate-600 group-hover:bg-dashboard-indigo-50 group-hover:text-dashboard-indigo-600">
                                    <Layout className="h-5 w-5" />
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                        onClick={() => handleDelete(dashboard.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-dashboard-slate-400">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="font-semibold text-dashboard-slate-900 group-hover:text-dashboard-indigo-600">
                                    {dashboard.name}
                                </h3>
                                <div className="mt-3 space-y-2">
                                    <div className="flex items-center text-xs text-dashboard-slate-500">
                                        <User className="mr-1.5 h-3 w-3" />
                                        Current User
                                    </div>
                                    <div className="flex items-center text-xs text-dashboard-slate-500">
                                        <Clock className="mr-1.5 h-3 w-3" />
                                        Edited {new Date(dashboard.lastEdited).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-dashboard-slate-50 pt-4">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700`}>
                                    Active
                                </span>
                                <Link
                                    to={`/dashboards/builder?id=${dashboard.id}`}
                                    className="text-xs font-medium text-dashboard-indigo-600 hover:underline"
                                >
                                    Edit Dashboard
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
