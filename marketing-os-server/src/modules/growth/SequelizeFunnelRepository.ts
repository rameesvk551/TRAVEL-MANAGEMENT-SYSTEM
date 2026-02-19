import { Funnel, FunnelStep } from '../modules/growth/models/Funnel';
import { FunnelModel } from '../models/FunnelModel.js';
import { sequelize } from '../../config/database.js';
import { QueryTypes } from 'sequelize';

export interface FunnelStepResult {
    stepIndex: number;
    stepName: string;
    visitors: number;
    dropOff: number;
    dropOffRate: number;
    conversionRate: number;
}

export interface IFunnelRepository {
    save(funnel: Funnel): Promise<Funnel>;
    findById(id: string): Promise<Funnel | null>;
    findAll(tenantId: string): Promise<Funnel[]>;
    update(id: string, data: Partial<{ name: string; description: string; steps: FunnelStep[]; isActive: boolean }>): Promise<Funnel | null>;
    delete(id: string): Promise<boolean>;
}

export class SequelizeFunnelRepository implements IFunnelRepository {
    async save(funnel: Funnel): Promise<Funnel> {
        const instance = await FunnelModel.create({
            id: funnel.id,
            tenantId: funnel.tenantId,
            name: funnel.name,
            description: funnel.description,
            steps: funnel.steps,
            isActive: funnel.isActive,
        });
        return instance.toEntity();
    }

    async findById(id: string): Promise<Funnel | null> {
        const instance = await FunnelModel.findByPk(id);
        return instance ? instance.toEntity() : null;
    }

    async findAll(tenantId: string): Promise<Funnel[]> {
        const instances = await FunnelModel.findAll({
            where: { tenantId },
            order: [['createdAt', 'DESC']],
        });
        return instances.map(i => i.toEntity());
    }

    async update(id: string, data: Partial<{ name: string; description: string; steps: FunnelStep[]; isActive: boolean }>): Promise<Funnel | null> {
        const instance = await FunnelModel.findByPk(id);
        if (!instance) return null;
        await instance.update(data);
        return instance.toEntity();
    }

    async delete(id: string): Promise<boolean> {
        const deleted = await FunnelModel.destroy({ where: { id } });
        return deleted > 0;
    }

    /**
     * Analyze funnel drop-off by querying tracking_events against the funnel steps.
     * Returns the number of unique visitors who matched each step, with drop-off stats.
     */
    async analyzeFunnel(tenantId: string, funnelId: string, start: Date, end: Date): Promise<FunnelStepResult[]> {
        const funnel = await this.findById(funnelId);
        if (!funnel || funnel.steps.length === 0) return [];

        const results: FunnelStepResult[] = [];
        let previousCount = 0;

        for (let i = 0; i < funnel.steps.length; i++) {
            const step = funnel.steps[i];

            // Build the WHERE clause for this step
            const conditions: string[] = [
                `tenant_id = :tenantId`,
                `created_at BETWEEN :start AND :end`,
            ];
            const replacements: Record<string, any> = { tenantId, start, end };

            if (step.eventType) {
                conditions.push(`event_type = :eventType`);
                replacements.eventType = step.eventType;
            }
            if (step.eventName) {
                conditions.push(`event_name = :eventName`);
                replacements.eventName = step.eventName;
            }
            if (step.url) {
                conditions.push(`page_url LIKE :url`);
                replacements.url = `%${step.url}%`;
            }

            const [row] = await sequelize.query(
                `SELECT COUNT(DISTINCT visitor_id) as visitors 
                 FROM tracking_events 
                 WHERE ${conditions.join(' AND ')}`,
                { replacements, type: QueryTypes.SELECT }
            ) as any[];

            const visitors = parseInt(row?.visitors || '0', 10);
            const dropOff = i === 0 ? 0 : previousCount - visitors;
            const dropOffRate = i === 0 ? 0 : (previousCount > 0 ? (dropOff / previousCount) * 100 : 0);
            const conversionRate = previousCount > 0 ? (visitors / (results[0]?.visitors || visitors)) * 100 : 100;

            results.push({
                stepIndex: i,
                stepName: step.name,
                visitors,
                dropOff: Math.max(0, dropOff),
                dropOffRate: Math.round(dropOffRate * 100) / 100,
                conversionRate: Math.round(conversionRate * 100) / 100,
            });

            previousCount = visitors;
        }

        return results;
    }
}
