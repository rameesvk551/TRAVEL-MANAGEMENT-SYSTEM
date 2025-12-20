import { X, Database, Palette, Layout as LayoutIcon } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useState } from 'react';

interface ChartConfigPanelProps {
    isOpen: boolean;
    onClose: () => void;
    widget: any;
    onUpdate: (id: string, updates: any) => void;
}

export function ChartConfigPanel({ isOpen, onClose, widget, onUpdate }: ChartConfigPanelProps) {
    const [activeTab, setActiveTab] = useState<'data' | 'viz' | 'layout'>('data');

    if (!isOpen || !widget) return null;

    return (
        <div className="fixed inset-y-16 right-0 z-[60] w-80 translate-x-0 border-l bg-white shadow-2xl transition-transform">
            <div className="flex h-14 items-center justify-between border-b px-6 bg-dashboard-slate-50">
                <h2 className="text-sm font-bold text-dashboard-slate-900 uppercase tracking-tighter">Configure Widget</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-dashboard-slate-400">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
                <button
                    onClick={() => setActiveTab('data')}
                    className={`flex-1 flex items-center justify-center py-3 border-b-2 transition-colors ${activeTab === 'data' ? 'border-dashboard-indigo-600 text-dashboard-indigo-600 bg-dashboard-indigo-50/10' : 'border-transparent text-dashboard-slate-400 hover:text-dashboard-slate-600'}`}
                >
                    <Database className="h-4 w-4 mr-2" />
                    <span className="text-xs font-semibold">Data</span>
                </button>
                <button
                    onClick={() => setActiveTab('viz')}
                    className={`flex-1 flex items-center justify-center py-3 border-b-2 transition-colors ${activeTab === 'viz' ? 'border-dashboard-indigo-600 text-dashboard-indigo-600 bg-dashboard-indigo-50/10' : 'border-transparent text-dashboard-slate-400 hover:text-dashboard-slate-600'}`}
                >
                    <Palette className="h-4 w-4 mr-2" />
                    <span className="text-xs font-semibold">Viz</span>
                </button>
                <button
                    onClick={() => setActiveTab('layout')}
                    className={`flex-1 flex items-center justify-center py-3 border-b-2 transition-colors ${activeTab === 'layout' ? 'border-dashboard-indigo-600 text-dashboard-indigo-600 bg-dashboard-indigo-50/10' : 'border-transparent text-dashboard-slate-400 hover:text-dashboard-slate-600'}`}
                >
                    <LayoutIcon className="h-4 w-4 mr-2" />
                    <span className="text-xs font-semibold">Layout</span>
                </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6 max-h-[calc(100vh-12rem)]">
                {activeTab === 'data' && (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-dashboard-slate-400 uppercase">Widget Title</label>
                            <Input
                                value={widget.title}
                                onChange={(e) => onUpdate(widget.id, { title: e.target.value })}
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-dashboard-slate-400 uppercase">Dataset</label>
                            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                                <option>Travel Bookings 2024</option>
                                <option>CRM Lead Source</option>
                                <option>Revenue by Region</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-dashboard-slate-400 uppercase">X-Axis Metric</label>
                            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                                <option>Month</option>
                                <option>Lead Status</option>
                                <option>Travel Type</option>
                            </select>
                        </div>
                    </div>
                )}

                {activeTab === 'viz' && (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-dashboard-slate-400 uppercase">Color Palette</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'].map(color => (
                                    <button
                                        key={color}
                                        className="h-8 rounded-lg border-2 border-white shadow-sm ring-1 ring-dashboard-slate-200"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-dashboard-slate-700">Show Legend</label>
                            <div className="h-5 w-9 bg-dashboard-indigo-600 rounded-full flex items-center px-1">
                                <div className="h-3 w-3 bg-white rounded-full ml-auto" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-dashboard-slate-700">Grid Lines</label>
                            <div className="h-5 w-9 bg-dashboard-slate-200 rounded-full flex items-center px-1">
                                <div className="h-3 w-3 bg-white rounded-full" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'layout' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-dashboard-slate-400 uppercase">Grid Width</label>
                                <Input type="number" value={widget.w} onChange={(e) => onUpdate(widget.id, { w: parseInt(e.target.value) })} className="h-9" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-dashboard-slate-400 uppercase">Grid Height</label>
                                <Input type="number" value={widget.h} onChange={(e) => onUpdate(widget.id, { h: parseInt(e.target.value) })} className="h-9" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-dashboard-slate-400 uppercase">Alignment</label>
                            <div className="flex rounded-lg border p-1 bg-dashboard-slate-50">
                                <button className="flex-1 py-1 px-2 text-[10px] font-bold rounded bg-white shadow-sm border text-dashboard-slate-700">SNAP</button>
                                <button className="flex-1 py-1 px-2 text-[10px] font-bold text-dashboard-slate-400 hover:text-dashboard-slate-600">FREE</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-dashboard-slate-50 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>Discard</Button>
                <Button className="flex-1 bg-dashboard-indigo-600 hover:bg-dashboard-indigo-700">Apply</Button>
            </div>
        </div>
    );
}
