import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface ActivityAttributes {
    id: string;
    tenant_id: string;
    lead_id?: string;
    contact_id?: string;
    booking_id?: string;
    assigned_to_id?: string;
    created_by_id?: string;
    type: string;
    status: string;
    outcome?: string;
    subject?: string;
    description?: string;
    scheduled_at?: Date;
    completed_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface ActivityCreationAttributes extends Optional<ActivityAttributes, 'id' | 'status'> {}

export class Activity extends Model<ActivityAttributes, ActivityCreationAttributes> implements ActivityAttributes {
    public id!: string;
    public tenant_id!: string;
    public lead_id?: string;
    public contact_id?: string;
    public booking_id?: string;
    public assigned_to_id?: string;
    public created_by_id?: string;
    public type!: string;
    public status!: string;
    public outcome?: string;
    public subject?: string;
    public description?: string;
    public scheduled_at?: Date;
    public completed_at?: Date;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Activity.init(
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
        lead_id: DataTypes.UUID,
        contact_id: DataTypes.UUID,
        booking_id: DataTypes.UUID,
        assigned_to_id: DataTypes.UUID,
        created_by_id: DataTypes.UUID,
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
        },
        outcome: DataTypes.STRING,
        subject: DataTypes.STRING,
        description: DataTypes.TEXT,
        scheduled_at: DataTypes.DATE,
        completed_at: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'activities',
        underscored: true,
        timestamps: true,
    }
);
