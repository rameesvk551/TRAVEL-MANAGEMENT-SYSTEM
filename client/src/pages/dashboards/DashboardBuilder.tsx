import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronLeft,
    Play,
    Plus,
    Save,
    Share2,
    Settings,
    Undo2,
    Redo2,
    Grid3X3,
    Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui';
import { AddWidgetPanel } from '@/components/dashboard/AddWidgetPanel';
import { WidgetContainer } from '@/components/dashboard/WidgetContainer';
import { ChartConfigPanel } from '@/components/dashboard/ChartConfigPanel';
import { WidgetRenderer } from '@/components/dashboard/WidgetRenderer';

export default function DashboardBuilder() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dashboardId = searchParams.get('id');
    const [isEditMode, setIsEditMode] = useState(true);
    const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [dashboardName, setDashboardName] = useState('New Campaign Dashboard');
    const [widgets, setWidgets] = useState<any[]>([]);
    const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
    const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
    const [resizingWidgetId, setResizingWidgetId] = useState<string | null>(null);
    const resizeStartPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

    useEffect(() => {
        const saved = localStorage.getItem(`dashboard_${dashboardId || 'new'}`);
        if (saved) {
            const data = JSON.parse(saved);
            setWidgets(data.widgets || []);
            setDashboardName(data.name || 'New Campaign Dashboard');
        }
    }, [dashboardId]);

    const handleSave = () => {
        const id = dashboardId || Math.random().toString(36).substr(2, 9);
        const data = {
            id,
            name: dashboardName,
            widgets,
            lastEdited: new Date().toISOString()
        };
        localStorage.setItem(`dashboard_${id}`, JSON.stringify(data));

        // Also update the list of dashboards for the hub
        const listStr = localStorage.getItem('dashboards_list');
        let list = listStr ? JSON.parse(listStr) : [];
        const index = list.findIndex((d: any) => d.id === id);
        if (index > -1) {
            list[index] = { id, name: dashboardName, lastEdited: data.lastEdited };
        } else {
            list.push({ id, name: dashboardName, lastEdited: data.lastEdited });
        }
        localStorage.setItem('dashboards_list', JSON.stringify(list));

        if (!dashboardId) {
            navigate(`/dashboards/builder?id=${id}`, { replace: true });
        }

        alert('Dashboard saved successfully!');
    };

    const handleAddWidget = (type: string) => {
        const w = type === 'kpi' ? 3 : 6;
        const h = type === 'kpi' ? 4 : 8;

        const maxY = widgets.reduce((max, widget) => Math.max(max, widget.y + widget.h), 0);

        const newWidget = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            x: 1,
            y: maxY + 1,
            w,
            h
        };
        setWidgets([...widgets, newWidget]);
        setIsAddPanelOpen(false);
    };

    const handleUpdateWidget = (id: string, updates: any) => {
        setWidgets(widgets.map(w => w.id === id ? { ...w, ...updates } : w));
    };

    const handleDragStart = (id: string) => {
        setDraggingWidgetId(id);
    };

    const handleDragEnd = () => {
        setDraggingWidgetId(null);
    };

    const selectedWidget = widgets.find(w => w.id === selectedWidgetId);
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggingWidgetId || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const gap = 24; // 6 * 4px
        const colWidth = (rect.width - (11 * gap)) / 12;
        const rowHeight = 40;

        const x = Math.max(1, Math.min(12, Math.round(offsetX / (colWidth + gap)) + 1));
        const y = Math.max(1, Math.round(offsetY / (rowHeight + gap)) + 1);

        handleUpdateWidget(draggingWidgetId, { x, y });
        setDraggingWidgetId(null);
    };

    const handleResizeStart = (id: string, e: React.MouseEvent) => {
        const widget = widgets.find(w => w.id === id);
        if (!widget) return;
        setResizingWidgetId(id);
        resizeStartPos.current = { x: e.clientX, y: e.clientY, w: widget.w, h: widget.h };

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const gap = 24;
            const colWidth = (rect.width - (11 * gap)) / 12;
            const rowHeight = 40;

            const deltaX = moveEvent.clientX - resizeStartPos.current.x;
            const deltaY = moveEvent.clientY - resizeStartPos.current.y;

            const newW = Math.max(1, Math.min(12 - widget.x + 1, resizeStartPos.current.w + Math.round(deltaX / (colWidth + gap))));
            const newH = Math.max(2, resizeStartPos.current.h + Math.round(deltaY / (rowHeight + gap)));

            handleUpdateWidget(id, { w: newW, h: newH });
        };

        const onMouseUp = () => {
            setResizingWidgetId(null);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-dashboard-slate-50" onClick={() => setSelectedWidgetId(null)}>
            {/* Top Toolbar */}
            <header className="flex h-16 items-center justify-between border-b bg-white px-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            navigate('/dashboards');
                        }}
                        className="text-dashboard-slate-500"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="h-6 w-[1px] bg-dashboard-slate-200" />
                    <input
                        type="text"
                        value={dashboardName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDashboardName(e.target.value)}
                        className="bg-transparent text-lg font-semibold text-dashboard-slate-900 focus:outline-none"
                    />
                    <span className="flex items-center text-xs text-dashboard-slate-400">
                        <div className="mr-2 h-2 w-2 rounded-full border border-emerald-500 bg-emerald-500/10" />
                        Saved to cloud
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="mr-4 flex items-center bg-dashboard-slate-100 p-1 rounded-lg">
                        <Button
                            variant={isEditMode ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setIsEditMode(true);
                            }}
                            className="h-8 text-xs px-4"
                        >
                            Build
                        </Button>
                        <Button
                            variant={!isEditMode ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setIsEditMode(false);
                            }}
                            className="h-8 text-xs px-4"
                        >
                            <Play className="mr-2 h-3 w-3" />
                            Preview
                        </Button>
                    </div>

                    <div className="flex items-center gap-1 border-r pr-4 mr-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-dashboard-slate-400">
                            <Undo2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-dashboard-slate-400" disabled>
                            <Redo2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button variant="outline" size="sm" className="h-9 gap-2">
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="h-9 gap-2 bg-dashboard-indigo-600 hover:bg-dashboard-indigo-700"
                    >
                        <Save className="h-4 w-4" />
                        Save
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`ml-2 h-9 w-9 ${isEditMode ? 'text-dashboard-indigo-600' : 'text-dashboard-slate-500'}`}
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setIsEditMode(!isEditMode);
                        }}
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Canvas Area */}
                <main className="relative flex-1 overflow-auto bg-dashboard-slate-50 p-8">
                    {/* Canvas Content */}
                    <div
                        ref={canvasRef}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="relative mx-auto min-h-full w-full px-4"
                    >
                        {/* Grid Background */}
                        <div
                            className="absolute inset-0 opacity-[0.05]"
                            style={{
                                backgroundImage: `linear-gradient(to right, #0F172A 1px, transparent 1px), linear-gradient(to bottom, #0F172A 1px, transparent 1px)`,
                                backgroundSize: 'calc((100% - 264px) / 12 + 24px) 64px'
                            }}
                        />
                        {widgets.length === 0 ? (
                            <div className="flex min-h-[600px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dashboard-slate-200">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-dashboard-slate-100 text-dashboard-slate-400">
                                    <Plus className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-medium text-dashboard-slate-900">Your canvas is empty</h3>
                                <p className="mt-2 text-center text-dashboard-slate-500">
                                    Add your first widget to start visualizing your data.
                                </p>
                                <Button
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        setIsAddPanelOpen(true);
                                    }}
                                    className="mt-8 bg-dashboard-indigo-600 hover:bg-dashboard-indigo-700"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Widget
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-dashboard auto-rows-[40px] gap-6">
                                {widgets.map((widget: any) => (
                                    <div
                                        key={widget.id}
                                        style={{
                                            gridColumn: `${widget.x} / span ${widget.w}`,
                                            gridRow: `${widget.y} / span ${widget.h}`
                                        }}
                                    >
                                        <WidgetContainer
                                            title={widget.title}
                                            isSelected={selectedWidgetId === widget.id}
                                            onSelect={() => setSelectedWidgetId(widget.id)}
                                            onConfig={() => {
                                                setSelectedWidgetId(widget.id);
                                                setIsConfigOpen(true);
                                            }}
                                            onDragStart={() => handleDragStart(widget.id)}
                                            onDragEnd={handleDragEnd}
                                            onResizeStart={(e) => handleResizeStart(widget.id, e)}
                                            isResizing={resizingWidgetId === widget.id}
                                        >
                                            <WidgetRenderer type={widget.type} config={widget.config} />
                                        </WidgetContainer>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                <AddWidgetPanel
                    isOpen={isAddPanelOpen}
                    onClose={() => setIsAddPanelOpen(false)}
                    onAdd={handleAddWidget}
                />

                <ChartConfigPanel
                    isOpen={isConfigOpen}
                    onClose={() => setIsConfigOpen(false)}
                    widget={selectedWidget}
                    onUpdate={handleUpdateWidget}
                />

                {/* Footer Controls */}
                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-dashboard-slate-500">
                        <Grid3X3 className="h-5 w-5" />
                    </Button>
                    <div className="h-5 w-[1px] bg-dashboard-slate-200 mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setIsAddPanelOpen(true);
                        }}
                        className="h-10 w-10 text-dashboard-slate-500"
                    >
                        <Plus className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-dashboard-slate-500">
                        <Maximize2 className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
