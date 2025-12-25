import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface GearCategoryAttributes {
    id: string;
    tenant_id: string;
    parent_id?: string;
    name: string;
    type?: string;
    is_safety_critical: boolean;
}

export interface GearCategoryCreationAttributes extends Optional<GearCategoryAttributes, 'id' | 'is_safety_critical'> {}

export class GearCategory extends Model<GearCategoryAttributes, GearCategoryCreationAttributes> implements GearCategoryAttributes {
    public id!: string;
    public tenant_id!: string;
    public parent_id?: string;
    public name!: string;
    public type?: string;
    public is_safety_critical!: boolean;
}

GearCategory.init(
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
        parent_id: DataTypes.UUID,
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: DataTypes.STRING,
        is_safety_critical: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'gear_categories',
        underscored: true,
        timestamps: false,
    }
);
