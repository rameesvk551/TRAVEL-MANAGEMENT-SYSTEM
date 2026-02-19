import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../database/sequelize.js';
import { Segment, SegmentProps, SegmentFilter } from '../../../domain/marketing/entities/Segment.js';

interface SegmentCreationAttributes extends Optional<SegmentProps, 'id' | 'createdAt' | 'updatedAt'> { }

export class SegmentModel extends Model<SegmentProps, SegmentCreationAttributes> implements SegmentProps {
    public id!: string;
    public tenantId!: string;
    public name!: string;
    public description?: string;
    public filters!: SegmentFilter[];
    public isDynamic!: boolean;

    public metadata!: Record<string, unknown>;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public toEntity(): Segment {
        return Segment.fromPersistence({
            id: this.id,
            tenantId: this.tenantId,
            name: this.name,
            description: this.description,
            filters: this.filters,
            isDynamic: this.isDynamic,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        });
    }
}

SegmentModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tenantId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: DataTypes.TEXT,
        filters: {
            type: DataTypes.JSONB,
            defaultValue: [],
        },
        isDynamic: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
    },
    {
        sequelize,
        tableName: 'marketing_segments',
        underscored: true,
        timestamps: true,
        indexes: [
            { fields: ['tenant_id'] },
        ],
    }
);
