import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface AvailabilityAttributes {
    id: string;
    tenant_id: string;
    employee_id: string;
    date: Date;
    status: string;
    block_reason?: string;
    notes?: string;
    source_type?: string;
    source_id?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface AvailabilityCreationAttributes extends Optional<AvailabilityAttributes, 'id'> {}

export class Availability extends Model<AvailabilityAttributes, AvailabilityCreationAttributes> implements AvailabilityAttributes {
    public id!: string;
    public tenant_id!: string;
    public employee_id!: string;
    public date!: Date;
    public status!: string;
    public block_reason?: string;
    public notes?: string;
    public source_type?: string;
    public source_id?: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Availability.init(
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
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        block_reason: DataTypes.STRING,
        notes: DataTypes.TEXT,
        source_type: DataTypes.STRING,
        source_id: DataTypes.STRING,
    },
    {
        sequelize,
        tableName: 'availability',
        underscored: true,
        timestamps: true,
    }
);
