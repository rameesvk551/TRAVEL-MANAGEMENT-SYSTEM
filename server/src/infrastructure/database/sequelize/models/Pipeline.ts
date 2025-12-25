import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface PipelineAttributes {
    id: string;
    tenant_id: string;
    name: string;
    is_default: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface PipelineCreationAttributes extends Optional<PipelineAttributes, 'id' | 'is_default'> {}

export class Pipeline extends Model<PipelineAttributes, PipelineCreationAttributes> implements PipelineAttributes {
    public id!: string;
    public tenant_id!: string;
    public name!: string;
    public is_default!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Pipeline.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tenant_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'pipelines',
        underscored: true,
        timestamps: true,
    }
);
