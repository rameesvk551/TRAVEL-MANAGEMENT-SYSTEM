import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface GearInventoryAttributes {
    id: string;
    tenant_id: string;
    gear_item_id: string;
    warehouse_id?: string;
    status?: string;
    trip_id?: string;
    rental_id?: string;
    assigned_to_user_id?: string;
}

export interface GearInventoryCreationAttributes extends Optional<GearInventoryAttributes, 'id'> {}

export class GearInventory extends Model<GearInventoryAttributes, GearInventoryCreationAttributes> implements GearInventoryAttributes {
    public id!: string;
    public tenant_id!: string;
    public gear_item_id!: string;
    public warehouse_id?: string;
    public status?: string;
    public trip_id?: string;
    public rental_id?: string;
    public assigned_to_user_id?: string;
}

GearInventory.init(
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
        gear_item_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        warehouse_id: DataTypes.UUID,
        status: DataTypes.STRING,
        trip_id: DataTypes.UUID,
        rental_id: DataTypes.UUID,
        assigned_to_user_id: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'gear_inventory',
        underscored: true,
        timestamps: false,
    }
);
