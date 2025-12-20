import { apiClient } from './client';
import { Lead, Contact, Pipeline, Activity } from '../types/crm';

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
