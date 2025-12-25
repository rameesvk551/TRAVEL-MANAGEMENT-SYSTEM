import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

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
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface ResourceCreationAttributes extends Optional<ResourceAttributes, 'id' | 'is_active'> {}

export class Resource extends Model<ResourceAttributes, ResourceCreationAttributes> implements ResourceAttributes {
    public id!: string;
    public tenant_id!: string;
    public branch_id?: string;
    public type!: string;
    public name!: string;
    public description?: string;
    public capacity?: number;
    public base_price?: number;
    public currency?: string;
    public is_active!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
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
