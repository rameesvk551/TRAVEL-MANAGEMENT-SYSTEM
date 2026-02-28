import { Funnel, FunnelStep, FunnelProps } from '../modules/growth/models/Funnel.js';
import { SequelizeFunnelRepository, FunnelStepResult } from '../modules/growth.js';

export interface CreateFunnelDTO {
    tenantId: string;
    name: string;
    description?: string;
    steps: FunnelStep[];
}

export class FunnelAnalyticsService {
    constructor(private funnelRepository: SequelizeFunnelRepository) { }

    async createFunnel(dto: CreateFunnelDTO): Promise<Funnel> {
        const funnel = Funnel.create({
            tenantId: dto.tenantId,
            name: dto.name,
            description: dto.description,
            steps: dto.steps,
        });
        return this.funnelRepository.save(funnel);
    }

    async listFunnels(tenantId: string): Promise<Funnel[]> {
        return this.funnelRepository.findAll(tenantId);
    }

    async getFunnel(id: string): Promise<Funnel | null> {
        return this.funnelRepository.findById(id);
    }

    async updateFunnel(id: string, data: Partial<{ name: string; description: string; steps: FunnelStep[]; isActive: boolean }>): Promise<Funnel | null> {
        return this.funnelRepository.update(id, data);
    }

    async deleteFunnel(id: string): Promise<boolean> {
        return this.funnelRepository.delete(id);
    }

    /**
     * Analyze a funnel: compute visitor counts & drop-off at each step.
     */
    async analyzeFunnel(tenantId: string, funnelId: string, start: Date, end: Date): Promise<{
        funnel: Funnel | null;
        steps: FunnelStepResult[];
        overallConversionRate: number;
    }> {
        const funnel = await this.funnelRepository.findById(funnelId);
        if (!funnel) return { funnel: null, steps: [], overallConversionRate: 0 };

        const steps = await this.funnelRepository.analyzeFunnel(tenantId, funnelId, start, end);

        const first = steps[0]?.visitors || 0;
        const last = steps[steps.length - 1]?.visitors || 0;
        const overallConversionRate = first > 0
            ? Math.round((last / first) * 10000) / 100
            : 0;

        return { funnel, steps, overallConversionRate };
    }
}
