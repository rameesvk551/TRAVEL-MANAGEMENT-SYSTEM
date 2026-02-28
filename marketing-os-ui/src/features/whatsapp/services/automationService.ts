// services/automationService.ts
// API calls for WhatsApp automation rules & flows.

import client from '../../../api/client';
import { automationApi as sharedAutomationApi } from '../../../api/modules';

/* ── Rules (WhatsApp-specific) ── */
export const automationRuleService = {
    getRules: async () => {
        const { data } = await client.get('/whatsapp/automation/rules');
        return data;
    },

    createRule: async (rule: any) => {
        const { data } = await client.post('/whatsapp/automation/rules', rule);
        return data;
    },

    updateRule: async (id: string, rule: any) => {
        const { data } = await client.put(`/whatsapp/automation/rules/${id}`, rule);
        return data;
    },

    deleteRule: async (id: string) => {
        const { data } = await client.delete(`/whatsapp/automation/rules/${id}`);
        return data;
    },
};

/* ── Flows (shared automation module) ── */
export const automationFlowService = {
    getFlows: sharedAutomationApi.getFlows,
    deleteFlow: sharedAutomationApi.deleteFlow,
};
