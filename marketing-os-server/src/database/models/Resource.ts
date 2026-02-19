import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

interface ResourceAttributes {
    id: string;
    tenant_id: string;
    branch_id?: string;
    type: string;
    name: string;
    description?: string;
    capacity?: number;
    base_price?: number;
    currency?: string;
    attributes?: Record<string, unknown>;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface ResourceCreationAttributes extends Optional<ResourceAttributes, 'id' | 'is_active'> {}

export class Resource extends Model<ResourceAttributes, ResourceCreationAttributes> implements ResourceAttributes {
    declare id: string;
    declare tenant_id: string;
    declare branch_id?: string;
    declare type: string;
    declare name: string;
    declare description?: string;
    declare capacity?: number;
    declare base_price?: number;
    declare currency?: string;
    declare attributes?: Record<string, unknown>;
    declare is_active: boolean;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

Resource.init(
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
        branch_id: DataTypes.UUID,
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: DataTypes.TEXT,
        capacity: DataTypes.INTEGER,
        base_price: DataTypes.DECIMAL,
        currency: DataTypes.STRING,
        attributes: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'resources',
        underscored: true,
        timestamps: true,
    }
);
