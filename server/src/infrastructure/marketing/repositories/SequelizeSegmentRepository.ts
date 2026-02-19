import { Segment } from '../../../domain/marketing/entities/Segment.js';
import { ISegmentRepository } from '../../../domain/marketing/repositories/ISegmentRepository.js';
import { SegmentModel } from '../models/SegmentModel.js';

function toEntity(model: SegmentModel): Segment {
    return model.toEntity();
}

export class SequelizeSegmentRepository implements ISegmentRepository {
    async save(segment: Segment): Promise<Segment> {
        const [instance, created] = await SegmentModel.findOrCreate({
            where: { id: segment.id },
            defaults: {
                id: segment.id,
                tenantId: segment.tenantId,
                name: segment.name,
                description: segment.description,
                filters: segment.filters,
                isDynamic: segment.isDynamic,
                metadata: segment.metadata,
                createdAt: segment.createdAt,
                updatedAt: segment.updatedAt,
            }
        });

        if (!created) {
            await instance.update({
                name: segment.name,
                description: segment.description,
                filters: segment.filters,
                isDynamic: segment.isDynamic,
                metadata: segment.metadata,
                updatedAt: new Date(),
            });
        }

        return toEntity(instance);
    }

    async findById(id: string, tenantId: string): Promise<Segment | null> {
        const model = await SegmentModel.findOne({
            where: { id, tenantId }
        });
        return model ? toEntity(model) : null;
    }

    async findAll(tenantId: string): Promise<Segment[]> {
        const models = await SegmentModel.findAll({
            where: { tenantId },
            order: [['name', 'ASC']]
        });
        return models.map(toEntity);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await SegmentModel.destroy({
            where: { id, tenantId }
        });
    }
}
