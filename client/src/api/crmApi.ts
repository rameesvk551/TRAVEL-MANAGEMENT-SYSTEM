import { apiClient } from './client';
import { Lead, Contact, Pipeline, Activity, LeadNote, FollowUp, TimelineEvent, LeadAssignee } from '../types/crm';

export const crmApi = {
    // Pipeline
    getPipelines: async () => {
        const { data } = await apiClient.get<Pipeline[]>('/crm/pipelines');
        return data;
    },

    // Leads
    getLeads: async (params?: any) => {
        const { data } = await apiClient.get<{ leads: Lead[], total: number }>('/crm/leads', { params });
        return data;
    },
    getLead: async (id: string) => {
        const { data } = await apiClient.get<Lead>(`/crm/leads/${id}`);
        return data;
    },
    getBoard: async (pipelineId: string) => {
        const { data } = await apiClient.get<Lead[]>(`/crm/leads/pipeline/${pipelineId}`);
        return data;
    },
    createLead: async (lead: Partial<Lead>) => {
        const { data } = await apiClient.post<Lead>('/crm/leads', lead);
        return data;
    },
    updateLead: async (id: string, updates: Partial<Lead>) => {
        const { data } = await apiClient.patch<Lead>(`/crm/leads/${id}`, updates);
        return data;
    },
    moveStage: async (id: string, stageId: string) => {
        const { data } = await apiClient.patch<Lead>(`/crm/leads/${id}/stage`, { stageId });
        return data;
    },
    assignLead: async (id: string, assignedToId: string) => {
        const { data } = await apiClient.patch<Lead>(`/crm/leads/${id}/assign`, { assignedToId });
        return data;
    },

    // Lead Notes
    getLeadNotes: async (leadId: string) => {
        const { data } = await apiClient.get<{ notes: LeadNote[] }>(`/crm/leads/${leadId}/notes`);
        return data;
    },
    addLeadNote: async (leadId: string, content: string) => {
        const { data } = await apiClient.post<LeadNote>(`/crm/leads/${leadId}/notes`, { content });
        return data;
    },

    // Follow-ups
    getFollowUps: async (leadId: string) => {
        const { data } = await apiClient.get<{ followUps: FollowUp[] }>(`/crm/leads/${leadId}/follow-ups`);
        return data;
    },
    scheduleFollowUp: async (leadId: string, followUp: Partial<FollowUp>) => {
        const { data } = await apiClient.post<FollowUp>(`/crm/leads/${leadId}/follow-ups`, followUp);
        return data;
    },
    updateFollowUp: async (leadId: string, followUpId: string, updates: Partial<FollowUp>) => {
        const { data } = await apiClient.patch<FollowUp>(`/crm/leads/${leadId}/follow-ups/${followUpId}`, updates);
        return data;
    },
    cancelFollowUp: async (leadId: string, followUpId: string) => {
        const { data } = await apiClient.delete(`/crm/leads/${leadId}/follow-ups/${followUpId}`);
        return data;
    },

    // Timeline
    getTimeline: async (leadId: string) => {
        const { data } = await apiClient.get<{ events: TimelineEvent[] }>(`/crm/leads/${leadId}/timeline`);
        return data;
    },

    // Assignees
    getAssignees: async () => {
        const { data } = await apiClient.get<{ users: LeadAssignee[] }>('/crm/assignees');
        return data;
    },

    // Lead Stats
    getLeadStats: async () => {
        const { data } = await apiClient.get<{ totalDeals: number; totalCompanies: number; wonDeals: number }>('/crm/leads/stats');
        return data;
    },

    // Contacts
    getContacts: async (params?: any) => {
        const { data } = await apiClient.get<{ contacts: Contact[], total: number }>('/crm/contacts', { params });
        return data;
    },
    createContact: async (contact: Partial<Contact>) => {
        const { data } = await apiClient.post<Contact>('/crm/contacts', contact);
        return data;
    },
    getContact: async (id: string) => {
        const { data } = await apiClient.get<Contact>(`/crm/contacts/${id}`);
        return data;
    },

    // Activities
    getActivities: async (params?: any) => {
        const { data } = await apiClient.get<{ activities: Activity[], total: number }>('/crm/activities', { params });
        return data;
    },
    logActivity: async (activity: Partial<Activity>) => {
        const { data } = await apiClient.post<Activity>('/crm/activities', activity);
        return data;
    },

    // Conversion
    convertLead: async (id: string, bookingDetails: any) => {
        const { data } = await apiClient.post<{ message: string }>(`/crm/leads/${id}/convert`, bookingDetails);
        return data;
    }
};
