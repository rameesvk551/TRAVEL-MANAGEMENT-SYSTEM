import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface CostCenterAttributes {
    id: string;
    tenant_id: string;
    branch_id?: string;
    code: string;
    name: string;
    description?: string;
    parent_id?: string;
    budget_amount?: number;
    budget_period?: string;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface CostCenterCreationAttributes extends Optional<CostCenterAttributes, 'id' | 'is_active'> {}

export class CostCenter extends Model<CostCenterAttributes, CostCenterCreationAttributes> implements CostCenterAttributes {
    public id!: string;
    public tenant_id!: string;
    public branch_id?: string;
    public code!: string;
    public name!: string;
    public description?: string;
    public parent_id?: string;
    public budget_amount?: number;
    public budget_period?: string;
    public is_active!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

CostCenter.init(
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
        code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: DataTypes.TEXT,
        parent_id: DataTypes.UUID,
        budget_amount: DataTypes.DECIMAL,
        budget_period: DataTypes.STRING,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'cost_centers',
        underscored: true,
        timestamps: true,
    }
);
