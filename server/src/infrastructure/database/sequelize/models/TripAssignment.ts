import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface TripAssignmentAttributes {
    id: string;
    tenant_id: string;
    trip_id: string;
    employee_id: string;
    role?: string;
    is_primary: boolean;
    start_date?: Date;
    end_date?: Date;
    status?: string;
    total_compensation?: number;
}

export interface TripAssignmentCreationAttributes extends Optional<TripAssignmentAttributes, 'id' | 'is_primary'> {}

export class TripAssignment extends Model<TripAssignmentAttributes, TripAssignmentCreationAttributes> implements TripAssignmentAttributes {
    public id!: string;
    public tenant_id!: string;
    public trip_id!: string;
    public employee_id!: string;
    public role?: string;
    public is_primary!: boolean;
    public start_date?: Date;
    public end_date?: Date;
    public status?: string;
    public total_compensation?: number;
}

TripAssignment.init(
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
        trip_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        role: DataTypes.STRING,
        is_primary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        start_date: DataTypes.DATEONLY,
        end_date: DataTypes.DATEONLY,
        status: DataTypes.STRING,
        total_compensation: DataTypes.DECIMAL,
    },
    {
        sequelize,
        tableName: 'trip_assignments',
        underscored: true,
        timestamps: false,
    }
);
