import { useState, useCallback } from 'react';
import type { LeadStatus } from '../data/leads';

interface DragState {
    draggingId: string | null;
    overColumn: LeadStatus | null;
}

export function useDragKanban(onDrop: (leadId: string, newStatus: LeadStatus) => void) {
    const [dragState, setDragState] = useState<DragState>({ draggingId: null, overColumn: null });

    const handleDragStart = useCallback((leadId: string) => {
        setDragState({ draggingId: leadId, overColumn: null });
    }, []);

    const handleDragOver = useCallback((status: LeadStatus) => {
        setDragState((s) => ({ ...s, overColumn: status }));
    }, []);

    const handleDrop = useCallback(
        (status: LeadStatus) => {
            if (dragState.draggingId) {
                onDrop(dragState.draggingId, status);
            }
            setDragState({ draggingId: null, overColumn: null });
        },
        [dragState.draggingId, onDrop],
    );

    const handleDragEnd = useCallback(() => {
        setDragState({ draggingId: null, overColumn: null });
    }, []);

    return {
        draggingId: dragState.draggingId,
        overColumn: dragState.overColumn,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
    };
}
