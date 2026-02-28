/**
 * Lead Pipeline Service — Customizable pipeline stages and Kanban management.
 */

import { LeadPipelineStage, Lead } from './lead.model.js';
import type {
    PipelineStage, CreatePipelineStageDTO, UpdatePipelineStageDTO, KanbanBoard,
} from './lead.types.js';

const DEFAULT_STAGES: Omit<CreatePipelineStageDTO, 'slug'>[] = [
    { name: 'New', color: '#3B82F6', position: 0, is_default: true },
    { name: 'Contacted', color: '#06B6D4', position: 1 },
    { name: 'Qualified', color: '#10B981', position: 2 },
    { name: 'Proposal', color: '#F59E0B', position: 3 },
    { name: 'Negotiation', color: '#F97316', position: 4 },
    { name: 'Won', color: '#22C55E', position: 5, is_won: true },
    { name: 'Lost', color: '#EF4444', position: 6, is_lost: true },
];

export class LeadPipelineService {

    async getStages(tenantId: string): Promise<PipelineStage[]> {
        const stages = await LeadPipelineStage.findAll({
            where: { tenant_id: tenantId },
            order: [['position', 'ASC']],
        });
        return stages.map(s => s.toJSON() as PipelineStage);
    }

    async getStage(tenantId: string, stageId: string): Promise<PipelineStage | null> {
        const stage = await LeadPipelineStage.findOne({ where: { id: stageId, tenant_id: tenantId } });
        return stage?.toJSON() as PipelineStage | null;
    }

    async createStage(tenantId: string, data: CreatePipelineStageDTO): Promise<PipelineStage> {
        const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        if (data.position === undefined) {
            const maxPos = await LeadPipelineStage.max('position', { where: { tenant_id: tenantId } }) as number | null;
            data.position = (maxPos ?? -1) + 1;
        }
        const stage = await LeadPipelineStage.create({
            tenant_id: tenantId, name: data.name, slug,
            description: data.description, color: data.color || '#4F46E5',
            position: data.position, is_default: data.is_default || false,
            is_won: data.is_won || false, is_lost: data.is_lost || false,
        });
        return stage.toJSON() as PipelineStage;
    }

    async updateStage(tenantId: string, stageId: string, data: UpdatePipelineStageDTO): Promise<PipelineStage | null> {
        const stage = await LeadPipelineStage.findOne({ where: { id: stageId, tenant_id: tenantId } });
        if (!stage) return null;
        await stage.update(data);
        return stage.toJSON() as PipelineStage;
    }

    async deleteStage(tenantId: string, stageId: string): Promise<boolean> {
        await Lead.update({ pipeline_stage_id: undefined as any }, { where: { tenant_id: tenantId, pipeline_stage_id: stageId } });
        const count = await LeadPipelineStage.destroy({ where: { id: stageId, tenant_id: tenantId } });
        return count > 0;
    }

    async getKanbanBoard(tenantId: string): Promise<KanbanBoard> {
        const stages = await LeadPipelineStage.findAll({
            where: { tenant_id: tenantId },
            order: [['position', 'ASC']],
            include: [{ model: Lead, as: 'leads', where: { tenant_id: tenantId }, required: false, limit: 50, order: [['updated_at', 'DESC']] }],
        });

        const board: KanbanBoard = {
            stages: stages.map(stage => {
                const json = stage.toJSON() as any;
                return { ...json, leads: json.leads || [], count: json.leads?.length || 0 };
            }),
        };

        // Unassigned leads (no pipeline stage)
        const unassigned = await Lead.findAll({
            where: { tenant_id: tenantId, pipeline_stage_id: null as any },
            limit: 50, order: [['updated_at', 'DESC']],
        });
        if (unassigned.length > 0) {
            board.stages.unshift({
                id: 'unassigned', tenant_id: tenantId, name: 'Unassigned', slug: 'unassigned',
                color: '#9CA3AF', position: -1, is_default: false, is_won: false, is_lost: false,
                created_at: new Date(), updated_at: new Date(),
                leads: unassigned.map(l => l.toJSON()) as any, count: unassigned.length,
            });
        }
        return board;
    }

    async moveToStage(tenantId: string, leadId: string, stageId: string): Promise<boolean> {
        const lead = await Lead.findOne({ where: { id: leadId, tenant_id: tenantId } });
        if (!lead) return false;
        const stage = await LeadPipelineStage.findOne({ where: { id: stageId, tenant_id: tenantId } });
        if (!stage) return false;
        await lead.update({ pipeline_stage_id: stageId, last_activity_at: new Date() });
        return true;
    }

    async getLeadAging(tenantId: string): Promise<Array<{ stage: string; avg_days: number; count: number }>> {
        const stages = await LeadPipelineStage.findAll({ where: { tenant_id: tenantId }, order: [['position', 'ASC']] });
        const result: Array<{ stage: string; avg_days: number; count: number }> = [];
        for (const stage of stages) {
            const leads = await Lead.findAll({ where: { tenant_id: tenantId, pipeline_stage_id: stage.id }, attributes: ['updated_at'] });
            const now = Date.now();
            const totalDays = leads.reduce((sum, l) => sum + (now - new Date(l.updated_at).getTime()) / 86400000, 0);
            result.push({ stage: stage.name, avg_days: leads.length > 0 ? Math.round(totalDays / leads.length) : 0, count: leads.length });
        }
        return result;
    }

    async seedDefaultStages(tenantId: string): Promise<PipelineStage[]> {
        const existing = await LeadPipelineStage.count({ where: { tenant_id: tenantId } });
        if (existing > 0) return this.getStages(tenantId);
        const created: PipelineStage[] = [];
        for (const def of DEFAULT_STAGES) {
            const slug = def.name.toLowerCase().replace(/\s+/g, '_');
            created.push(await this.createStage(tenantId, { ...def, slug }));
        }
        return created;
    }
}
