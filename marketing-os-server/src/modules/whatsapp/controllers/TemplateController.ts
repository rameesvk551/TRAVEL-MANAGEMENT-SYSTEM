// presentation/controllers/whatsapp/TemplateController.ts

import { MessageTemplate } from '../models/whatsapp/index.js';

export function createTemplateController(templateRepo: any, metaSync?: any) {
    const list = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId; const { category, status, language } = req.query; if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; } const templates = await templateRepo.findByTenant(tenantId, { category, status, language }); res.json({ data: templates }); } catch (error) { next(error); }
    };

    const get = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId; const { id } = req.params; if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; } const template = await templateRepo.findById(id, tenantId); if (!template) { res.status(404).json({ error: 'Template not found' }); return; } res.json({ data: template }); } catch (error) { next(error); }
    };

    const create = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId; const userId = req.context?.userId;
            if (!tenantId || !userId) { res.status(401).json({ error: 'Authentication required' }); return; }
            const { name, category, language, components, variables, triggerEvents, requiredRole } = req.body;
            const template = MessageTemplate.create({ tenantId, templateName: name, category, language: language || 'en', variables: variables || [], createdBy: userId });
            if (components) template.components = components;
            const saved = await templateRepo.save(template);
            let metaResult = null;
            if (metaSync && components) {
                try {
                    metaResult = await metaSync.createTemplate(tenantId, { name, category: category || 'UTILITY', language: language || 'en', components });
                    if (metaResult) { saved.meta_template_id = metaResult.id; saved.status = metaResult.status || 'PENDING'; await templateRepo.save(saved); }
                } catch (metaError: any) { console.error('[TemplateController] Meta submission failed:', metaError.message); return res.status(201).json({ data: saved, warning: `Template saved locally but Meta submission failed: ${metaError.message}` }); }
            }
            res.status(201).json({ data: saved, meta: metaResult, message: metaResult ? 'Template created and submitted to Meta for review' : 'Template saved locally (Meta sync not configured)' });
        } catch (error) { next(error); }
    };

    const update = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId; const { id } = req.params;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            const template = await templateRepo.findById(id, tenantId);
            if (!template) { res.status(404).json({ error: 'Template not found' }); return; }
            const { components, variables, triggerEvents, requiredRole } = req.body;
            if (components) template.components = components;
            if (variables) template.variables = variables;
            if (triggerEvents) template.triggerEvents = triggerEvents;
            if (requiredRole !== undefined) template.requiredRole = requiredRole;
            if (template.status === 'APPROVED' && components) template.status = 'PENDING';
            template.tenantId = tenantId;
            const saved = await templateRepo.save(template);
            res.json({ data: saved });
        } catch (error) { next(error); }
    };

    const submit = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId; const { id } = req.params;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            const template = await templateRepo.findById(id, tenantId);
            if (!template) { res.status(404).json({ error: 'Template not found' }); return; }
            if (metaSync && template.components) {
                try {
                    const metaResult = await metaSync.createTemplate(tenantId, { name: template.name || template.template_name, category: template.category || 'UTILITY', language: template.language || 'en', components: template.components });
                    if (metaResult) { template.meta_template_id = metaResult.id; template.status = metaResult.status || 'PENDING'; } else { return res.status(400).json({ error: 'WhatsApp credentials not configured. Cannot submit to Meta.' }); }
                } catch (metaError: any) { return res.status(400).json({ error: `Failed to submit to Meta: ${metaError.message}` }); }
            } else { template.status = 'PENDING'; }
            template.submittedAt = new Date(); template.tenantId = tenantId;
            const saved = await templateRepo.save(template);
            res.json({ data: saved, message: 'Template submitted for approval' });
        } catch (error) { next(error); }
    };

    const syncFromMeta = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId; const userId = req.context?.userId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            if (!metaSync) { return res.status(503).json({ error: 'Meta template sync not configured' }); }
            const metaTemplates = await metaSync.syncAllTemplates(tenantId);
            if (metaTemplates.length === 0) { return res.json({ data: [], message: 'No templates found on Meta or sync not available' }); }
            const synced = [];
            for (const mt of metaTemplates) {
                const existing = await templateRepo.findByName(mt.name, tenantId);
                const templateData = { id: existing?.id || crypto.randomUUID(), tenantId, name: mt.name, template_name: mt.name, category: mt.category, language: mt.language, status: mt.status, components: mt.components, variables: [], meta_template_id: mt.id, rejection_reason: mt.rejected_reason || null, createdBy: existing?.created_by || userId || crypto.randomUUID(), createdAt: existing?.created_at || new Date(), updatedAt: new Date() };
                const saved = await templateRepo.save(templateData);
                synced.push(saved);
            }
            res.json({ data: synced, message: `Synced ${synced.length} templates from Meta`, total: metaTemplates.length });
        } catch (error) { next(error); }
    };

    const test = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId; const { id } = req.params; const { phone, variables } = req.body; if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; } const template = await templateRepo.findById(id, tenantId); if (!template) { res.status(404).json({ error: 'Template not found' }); return; } res.json({ success: true, message: `Test message would be sent to ${phone}`, preview: template.render ? template.render(variables || {}) : template }); } catch (error) { next(error); }
    };

    const deleteTemplate = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId; const { id } = req.params;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            const template = await templateRepo.findById(id, tenantId);
            if (!template) { res.status(404).json({ error: 'Template not found' }); return; }
            if (metaSync) { const templateName = template.name || template.template_name; try { await metaSync.deleteTemplate(tenantId, templateName); } catch (metaError: any) { console.warn(`[TemplateController] Meta delete failed for ${templateName}:`, metaError.message); } }
            if (template.status === 'APPROVED') { template.status = 'DRAFT'; template.isActive = false; template.tenantId = tenantId; await templateRepo.save(template); } else { await templateRepo.delete(id, tenantId); }
            res.json({ success: true, message: 'Template deleted' });
        } catch (error) { next(error); }
    };

    const getCategories = async (_req: any, res: any) => {
        res.json({ data: [ { value: 'MARKETING', label: 'Marketing', description: 'Promotional messages' }, { value: 'UTILITY', label: 'Utility', description: 'Transactional updates' }, { value: 'AUTHENTICATION', label: 'Authentication', description: 'OTP and login' }, { value: 'SERVICE', label: 'Service', description: 'Customer service' } ] });
    };

    const getTriggers = async (_req: any, res: any) => {
        res.json({ data: [
            { value: 'lead.created', label: 'Lead Created', entity: 'lead' }, { value: 'lead.stage_changed', label: 'Lead Stage Changed', entity: 'lead' }, { value: 'lead.quote_sent', label: 'Quote Sent', entity: 'lead' },
            { value: 'booking.created', label: 'Booking Created', entity: 'booking' }, { value: 'booking.confirmed', label: 'Booking Confirmed', entity: 'booking' }, { value: 'booking.payment_received', label: 'Payment Received', entity: 'booking' }, { value: 'booking.cancelled', label: 'Booking Cancelled', entity: 'booking' }, { value: 'booking.reminder', label: 'Trip Reminder', entity: 'booking' },
            { value: 'departure.opened', label: 'Departure Opened', entity: 'departure' }, { value: 'departure.few_left', label: 'Few Spots Left', entity: 'departure' }, { value: 'departure.full', label: 'Departure Full', entity: 'departure' }, { value: 'departure.tomorrow', label: 'Departure Tomorrow', entity: 'departure' }, { value: 'departure.started', label: 'Trip Started', entity: 'departure' }, { value: 'departure.ended', label: 'Trip Ended', entity: 'departure' },
            { value: 'payment.due', label: 'Payment Due', entity: 'payment' }, { value: 'payment.overdue', label: 'Payment Overdue', entity: 'payment' }, { value: 'payment.refunded', label: 'Payment Refunded', entity: 'payment' },
            { value: 'assignment.proposed', label: 'Assignment Proposed', entity: 'tripAssignment' }, { value: 'assignment.confirmed', label: 'Assignment Confirmed', entity: 'tripAssignment' },
            { value: 'issue.reported', label: 'Issue Reported', entity: 'issue' }, { value: 'issue.escalated', label: 'Issue Escalated', entity: 'issue' }, { value: 'issue.resolved', label: 'Issue Resolved', entity: 'issue' },
        ] });
    };

    return { list, get, create, update, submit, syncFromMeta, test, delete: deleteTemplate, getCategories, getTriggers };
}
