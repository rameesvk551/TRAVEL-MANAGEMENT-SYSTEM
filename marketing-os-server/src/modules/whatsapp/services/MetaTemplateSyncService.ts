// Meta Template Sync Service
// Syncs message templates between local DB and Meta's Graph API

import { TenantProviderFactory } from '../providers/TenantProviderFactory.js';

const GRAPH_API_BASE = 'https://graph.facebook.com';

export interface MetaTemplateComponent {
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    text?: string;
    example?: {
        header_text?: string[];
        body_text?: string[][];
        header_handle?: string[];
    };
    buttons?: Array<{
        type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
        text: string;
        url?: string;
        phone_number?: string;
        example?: string[];
    }>;
}

export interface MetaTemplateData {
    name: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    language: string;
    components: MetaTemplateComponent[];
    allow_category_change?: boolean;
}

export interface MetaTemplateResponse {
    id: string;
    name: string;
    status: string;
    category: string;
    language: string;
    components: MetaTemplateComponent[];
    rejected_reason?: string;
    quality_score?: { score: string };
}

export class MetaTemplateSyncService {
    private readonly apiVersion: string;

    constructor(
        private providerFactory: TenantProviderFactory,
        apiVersion?: string
    ) {
        this.apiVersion = apiVersion || 'v21.0';
    }

    /**
     * Create (submit) a template to Meta for review.
     * 
     * POST /{waba_id}/message_templates
     */
    async createTemplate(
        tenantId: string,
        template: MetaTemplateData
    ): Promise<{ id: string; status: string } | null> {
        const creds = await this.providerFactory.getCredentialsForTenant(tenantId);
        if (!creds) {
            console.warn(`[MetaTemplateSyncService] No credentials for tenant ${tenantId}`);
            return null;
        }

        const url = `${GRAPH_API_BASE}/${this.apiVersion}/${creds.wabaId}/message_templates`;

        const body: Record<string, any> = {
            name: template.name,
            category: template.category,
            language: template.language,
            components: template.components,
        };

        if (template.allow_category_change !== undefined) {
            body.allow_category_change = template.allow_category_change;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${creds.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json() as any;

            if (data.error) {
                console.error(`[MetaTemplateSyncService] Create template error:`, data.error);
                throw new Error(data.error.message || 'Failed to create template on Meta');
            }

            return {
                id: data.id,
                status: data.status || 'PENDING',
            };
        } catch (error) {
            console.error(`[MetaTemplateSyncService] Create template failed:`, error);
            throw error;
        }
    }

    /**
     * Get a specific template's status from Meta.
     * 
     * GET /{waba_id}/message_templates?name={name}
     */
    async getTemplateStatus(
        tenantId: string,
        templateName: string
    ): Promise<MetaTemplateResponse | null> {
        const creds = await this.providerFactory.getCredentialsForTenant(tenantId);
        if (!creds) return null;

        const url = `${GRAPH_API_BASE}/${this.apiVersion}/${creds.wabaId}/message_templates?name=${encodeURIComponent(templateName)}`;

        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${creds.accessToken}` },
            });

            const data = await response.json() as any;

            if (data.error) {
                console.error(`[MetaTemplateSyncService] Get template status error:`, data.error);
                return null;
            }

            if (data.data && data.data.length > 0) {
                return data.data[0] as MetaTemplateResponse;
            }

            return null;
        } catch (error) {
            console.error(`[MetaTemplateSyncService] Get template status failed:`, error);
            return null;
        }
    }

    /**
     * Sync all templates from Meta to get latest statuses.
     * 
     * GET /{waba_id}/message_templates
     * Returns all templates from Meta for this tenant's WABA.
     */
    async syncAllTemplates(tenantId: string): Promise<MetaTemplateResponse[]> {
        const creds = await this.providerFactory.getCredentialsForTenant(tenantId);
        if (!creds) return [];

        const templates: MetaTemplateResponse[] = [];
        let url: string | null = `${GRAPH_API_BASE}/${this.apiVersion}/${creds.wabaId}/message_templates?limit=100&fields=name,status,category,language,components,rejected_reason,quality_score`;

        try {
            // Paginate through all templates
            while (url) {
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${creds.accessToken}` },
                });

                const data = await response.json() as any;

                if (data.error) {
                    console.error(`[MetaTemplateSyncService] Sync templates error:`, data.error);
                    break;
                }

                if (data.data) {
                    templates.push(...data.data);
                }

                // Check for pagination
                url = data.paging?.next || null;
            }
        } catch (error) {
            console.error(`[MetaTemplateSyncService] Sync all templates failed:`, error);
        }

        return templates;
    }

    /**
     * Delete a template from Meta.
     * 
     * DELETE /{waba_id}/message_templates?name={name}
     */
    async deleteTemplate(
        tenantId: string,
        templateName: string
    ): Promise<boolean> {
        const creds = await this.providerFactory.getCredentialsForTenant(tenantId);
        if (!creds) return false;

        const url = `${GRAPH_API_BASE}/${this.apiVersion}/${creds.wabaId}/message_templates?name=${encodeURIComponent(templateName)}`;

        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${creds.accessToken}` },
            });

            const data = await response.json() as any;

            if (data.error) {
                console.error(`[MetaTemplateSyncService] Delete template error:`, data.error);
                return false;
            }

            return data.success === true;
        } catch (error) {
            console.error(`[MetaTemplateSyncService] Delete template failed:`, error);
            return false;
        }
    }

    /**
     * Update template components on Meta (for editable templates).
     * Note: Only APPROVED templates can be edited, and editing triggers re-review.
     * 
     * POST /{template_id}
     */
    async updateTemplate(
        tenantId: string,
        metaTemplateId: string,
        components: MetaTemplateComponent[]
    ): Promise<boolean> {
        const creds = await this.providerFactory.getCredentialsForTenant(tenantId);
        if (!creds) return false;

        const url = `${GRAPH_API_BASE}/${this.apiVersion}/${metaTemplateId}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${creds.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ components }),
            });

            const data = await response.json() as any;

            if (data.error) {
                console.error(`[MetaTemplateSyncService] Update template error:`, data.error);
                return false;
            }

            return data.success === true;
        } catch (error) {
            console.error(`[MetaTemplateSyncService] Update template failed:`, error);
            return false;
        }
    }
}
