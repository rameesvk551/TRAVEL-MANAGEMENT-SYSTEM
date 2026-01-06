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
    attributes?: any;
    version?: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface DepartureInstanceCreationAttributes extends Optional<DepartureInstanceAttributes, 'id' | 'status' | 'is_guaranteed'> {}

export class DepartureInstance extends Model<DepartureInstanceAttributes, DepartureInstanceCreationAttributes> implements DepartureInstanceAttributes {
    declare id: string;
    declare tenant_id: string;
    declare branch_id?: string;
    declare resource_id: string;
    declare departure_date: Date;
    declare departure_time?: string;
    declare end_date?: Date;
    declare cutoff_datetime?: Date;
    declare total_capacity?: number;
    declare blocked_seats?: number;
    declare overbooking_limit?: number;
    declare min_participants?: number;
    declare status: string;
    declare is_guaranteed: boolean;
    declare price_override?: number;
    declare currency?: string;
    declare attributes?: any;
    declare version?: number;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
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
        attributes: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
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
