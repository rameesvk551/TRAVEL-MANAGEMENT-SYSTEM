import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface GearItemAttributes {
    id: string;
    tenant_id: string;
    category_id?: string;
    sku?: string;
    name: string;
    brand?: string;
    serial_number?: string;
    ownership_type?: string;
    vendor_id?: string;
    condition?: string;
    warehouse_id?: string;
    is_active: boolean;
}

export interface GearItemCreationAttributes extends Optional<GearItemAttributes, 'id' | 'is_active'> {}

export class GearItem extends Model<GearItemAttributes, GearItemCreationAttributes> implements GearItemAttributes {
    public id!: string;
    public tenant_id!: string;
    public category_id?: string;
    public sku?: string;
    public name!: string;
    public brand?: string;
    public serial_number?: string;
    public ownership_type?: string;
    public vendor_id?: string;
    public condition?: string;
    public warehouse_id?: string;
    public is_active!: boolean;
}

GearItem.init(
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
        category_id: DataTypes.UUID,
        sku: DataTypes.STRING,
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        brand: DataTypes.STRING,
        serial_number: DataTypes.STRING,
        ownership_type: DataTypes.STRING,
        vendor_id: DataTypes.UUID,
        condition: DataTypes.STRING,
        warehouse_id: DataTypes.UUID,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'gear_items',
        underscored: true,
        timestamps: false,
    }
);
