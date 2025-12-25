import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface AttendanceAttributes {
    id: string;
    tenant_id: string;
    employee_id: string;
    date: Date;
    work_hours?: number;
    overtime_hours?: number;
    type?: string;
    status?: string;
    trip_id?: string;
    created_at?: Date;
}

export interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, 'id'> {}

export class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
    public id!: string;
    public tenant_id!: string;
    public employee_id!: string;
    public date!: Date;
    public work_hours?: number;
    public overtime_hours?: number;
    public type?: string;
    public status?: string;
    public trip_id?: string;
    public readonly created_at!: Date;
}

Attendance.init(
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
        work_hours: DataTypes.DECIMAL,
        overtime_hours: DataTypes.DECIMAL,
        type: DataTypes.STRING,
        status: DataTypes.STRING,
        trip_id: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'attendance',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);
