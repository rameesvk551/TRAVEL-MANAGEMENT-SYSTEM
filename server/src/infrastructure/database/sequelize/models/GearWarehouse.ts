import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface GearWarehouseAttributes {
    id: string;
    tenant_id: string;
    name: string;
    code?: string;
    type?: string;
    city?: string;
    is_active: boolean;
}

export interface GearWarehouseCreationAttributes extends Optional<GearWarehouseAttributes, 'id' | 'is_active'> {}

export class GearWarehouse extends Model<GearWarehouseAttributes, GearWarehouseCreationAttributes> implements GearWarehouseAttributes {
    public id!: string;
    public tenant_id!: string;
    public name!: string;
    public code?: string;
    public type?: string;
    public city?: string;
    public is_active!: boolean;
}

GearWarehouse.init(
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
        code: DataTypes.STRING,
        type: DataTypes.STRING,
        city: DataTypes.STRING,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'gear_warehouses',
        underscored: true,
        timestamps: false,
    }
);
