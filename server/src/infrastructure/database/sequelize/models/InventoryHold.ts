import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface InventoryHoldAttributes {
    id: string;
    tenant_id: string;
    departure_id: string;
    booking_id?: string;
    seat_count: number;
    source?: string;
    source_platform?: string;
    hold_type: string;
    expires_at: Date;
    created_by_id?: string;
    session_id?: string;
    notes?: string;
    created_at?: Date;
    released_at?: Date;
    release_reason?: string;
}

export interface InventoryHoldCreationAttributes extends Optional<InventoryHoldAttributes, 'id'> {}

export class InventoryHold extends Model<InventoryHoldAttributes, InventoryHoldCreationAttributes> implements InventoryHoldAttributes {
    public id!: string;
    public tenant_id!: string;
    public departure_id!: string;
    public booking_id?: string;
    public seat_count!: number;
    public source?: string;
    public source_platform?: string;
    public hold_type!: string;
    public expires_at!: Date;
    public created_by_id?: string;
    public session_id?: string;
    public notes?: string;
    public readonly created_at!: Date;
    public released_at?: Date;
    public release_reason?: string;
}

InventoryHold.init(
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
        departure_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        booking_id: DataTypes.UUID,
        seat_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        source: DataTypes.STRING,
        source_platform: DataTypes.STRING,
        hold_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        created_by_id: DataTypes.UUID,
        session_id: DataTypes.STRING,
        notes: DataTypes.TEXT,
        released_at: DataTypes.DATE,
        release_reason: DataTypes.STRING,
    },
    {
        sequelize,
        tableName: 'inventory_holds',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);
