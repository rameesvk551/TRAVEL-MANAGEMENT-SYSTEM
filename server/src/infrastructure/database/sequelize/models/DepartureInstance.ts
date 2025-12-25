import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface DepartureInstanceAttributes {
    id: string;
    tenant_id: string;
    branch_id?: string;
    resource_id: string;
    departure_date: Date;
    departure_time?: string;
    end_date?: Date;
    cutoff_datetime?: Date;
    total_capacity?: number;
    blocked_seats?: number;
    overbooking_limit?: number;
    min_participants?: number;
    status: string;
    is_guaranteed: boolean;
    price_override?: number;
    currency?: string;
    version?: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface DepartureInstanceCreationAttributes extends Optional<DepartureInstanceAttributes, 'id' | 'status' | 'is_guaranteed'> {}

export class DepartureInstance extends Model<DepartureInstanceAttributes, DepartureInstanceCreationAttributes> implements DepartureInstanceAttributes {
    public id!: string;
    public tenant_id!: string;
    public branch_id?: string;
    public resource_id!: string;
    public departure_date!: Date;
    public departure_time?: string;
    public end_date?: Date;
    public cutoff_datetime?: Date;
    public total_capacity?: number;
    public blocked_seats?: number;
    public overbooking_limit?: number;
    public min_participants?: number;
    public status!: string;
    public is_guaranteed!: boolean;
    public price_override?: number;
    public currency?: string;
    public version?: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

DepartureInstance.init(
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
        resource_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        departure_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        departure_time: DataTypes.TIME,
        end_date: DataTypes.DATEONLY,
        cutoff_datetime: DataTypes.DATE,
        total_capacity: DataTypes.INTEGER,
        blocked_seats: DataTypes.INTEGER,
        overbooking_limit: DataTypes.INTEGER,
        min_participants: DataTypes.INTEGER,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'scheduled',
        },
        is_guaranteed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        price_override: DataTypes.DECIMAL,
        currency: DataTypes.STRING,
        version: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
    },
    {
        sequelize,
        tableName: 'departure_instances',
        underscored: true,
        timestamps: true,
    }
);
