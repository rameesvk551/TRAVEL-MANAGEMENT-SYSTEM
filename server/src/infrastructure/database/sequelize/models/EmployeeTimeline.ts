import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface EmployeeTimelineAttributes {
    id: string;
    tenant_id: string;
    employee_id: string;
    event_type: string;
    event_category?: string;
    title: string;
    description?: string;
    triggered_by?: string;
    created_at?: Date;
}

export interface EmployeeTimelineCreationAttributes extends Optional<EmployeeTimelineAttributes, 'id'> {}

export class EmployeeTimeline extends Model<EmployeeTimelineAttributes, EmployeeTimelineCreationAttributes> implements EmployeeTimelineAttributes {
    public id!: string;
    public tenant_id!: string;
    public employee_id!: string;
    public event_type!: string;
    public event_category?: string;
    public title!: string;
    public description?: string;
    public triggered_by?: string;
    public readonly created_at!: Date;
}

EmployeeTimeline.init(
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
        event_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        event_category: DataTypes.STRING,
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: DataTypes.TEXT,
        triggered_by: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'employee_timeline',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);
