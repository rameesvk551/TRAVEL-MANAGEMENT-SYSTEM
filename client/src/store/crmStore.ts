import { create } from 'zustand';
import { crmApi } from '../api';
import { Pipeline, Lead } from '../types/crm';

interface CrmState {
    pipelines: Pipeline[];
    currentPipelineId: string | null;
    boardLeads: Lead[]; // Grouped by stage usually, but flat list for now or Record<string, Lead[]>
    loading: boolean;
    error: string | null;

    // Actions
    fetchPipelines: () => Promise<void>;
    fetchBoard: (pipelineId: string) => Promise<void>;
    moveCard: (leadId: string, newStageId: string) => Promise<void>;
    addLead: (lead: Partial<Lead>) => Promise<void>;
}

export const useCrmStore = create<CrmState>((set, get) => ({
    pipelines: [],
    currentPipelineId: null,
    boardLeads: [],
    loading: false,
    error: null,

    fetchPipelines: async () => {
        set({ loading: true });
        try {
            const pipelines = await crmApi.getPipelines();
            set({
                pipelines,
                currentPipelineId: pipelines[0]?.id || null,
                loading: false
            });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    fetchBoard: async (pipelineId: string) => {
        set({ loading: true, currentPipelineId: pipelineId });
        try {
            const leads = await crmApi.getBoard(pipelineId);
            set({ boardLeads: leads, loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    moveCard: async (leadId: string, newStageId: string) => {
        // Optimistic update
        const previousLeads = get().boardLeads;
        set(state => ({
            boardLeads: state.boardLeads.map(l =>
                l.id === leadId ? { ...l, stageId: newStageId } : l
            )
        }));

        try {
            await crmApi.moveStage(leadId, newStageId);
        } catch (err: any) {
            // Revert
            set({ boardLeads: previousLeads, error: 'Failed to move card' });
        }
    },

    addLead: async (leadData) => {
        set({ loading: true });
        try {
            await crmApi.createLead(leadData);
            // Refresh board if active
            const { currentPipelineId } = get();
            if (currentPipelineId) {
                const leads = await crmApi.getBoard(currentPipelineId);
                set({ boardLeads: leads });
            }
            set({ loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
            throw err;
        }
    }
}));
