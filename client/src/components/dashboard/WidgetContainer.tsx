import { ReactNode } from 'react';
import { MoreVertical, Move } from 'lucide-react';
import { Button } from '@/components/ui';

interface WidgetContainerProps {
    title: string;
    children: ReactNode;
    isSelected?: boolean;
    onSelect?: () => void;
    onConfig?: () => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onResizeStart?: (e: React.MouseEvent) => void;
    isResizing?: boolean;
}

export function WidgetContainer({
    title,
    children,
    isSelected,
    onSelect,
    onConfig,
    onDragStart,
    onDragEnd,
    onResizeStart,
    isResizing
}: WidgetContainerProps) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
            className={`group relative flex h-full flex-col rounded-xl bg-white transition-all ring-1 ${isSelected || isResizing
                ? 'ring-dashboard-cyan-500 shadow-xl z-10'
                : 'ring-dashboard-slate-200 hover:ring-dashboard-indigo-200 hover:shadow-md'
                } ${isResizing ? 'opacity-80' : ''}`}
        >
            {/* Widget Header */}
            <div className="flex items-center justify-between border-b border-dashboard-slate-100 px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <Move className="h-3.5 w-3.5 cursor-grab text-dashboard-slate-300 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing" />
                    <h3 className="text-sm font-semibold text-dashboard-slate-700">{title}</h3>
                </div>
                <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-dashboard-slate-400" onClick={onConfig}>
                        <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Widget Content */}
            <div className="flex-1 overflow-hidden p-4">{children}</div>

            {/* Resize handle */}
            {isSelected && (
                <div
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onResizeStart?.(e);
                    }}
                    className="absolute -bottom-1 -right-1 h-6 w-6 cursor-nwse-resize items-center justify-center flex z-20"
                >
                    <div className={`h-2.5 w-2.5 rounded-sm border-2 border-white bg-dashboard-cyan-500 shadow-sm transition-transform ${isResizing ? 'scale-125' : 'hover:scale-110'}`} />
                </div>
            )}

            {/* Selection indicators */}
            {(isSelected || isResizing) && (
                <>
                    <div className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-dashboard-cyan-500 shadow-sm" />
                    <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-dashboard-cyan-500 shadow-sm" />
                    <div className="absolute -bottom-1 -left-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-dashboard-cyan-500 shadow-sm" />
                    <div className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-dashboard-cyan-500 shadow-sm" />
                </>
            )}
        </div>
    );
}
