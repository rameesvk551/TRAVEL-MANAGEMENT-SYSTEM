import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface LeadAttributes {
    id: string;
    tenant_id: string;
    branch_id?: string;
    assigned_to_id?: string;
    contact_id?: string;
    pipeline_id?: string;
    stage_id?: string;
    name: string;
    email?: string;
    phone?: string;
    source?: string;
    source_platform?: string;
    status?: string;
    priority?: string;
    score?: number;
    travel_preferences?: Record<string, unknown>;
    tags?: string[];
    notes?: string;
    lost_reason?: string;
    metadata?: Record<string, unknown>;
    created_at?: Date;
    updated_at?: Date;
}

export interface LeadCreationAttributes extends Optional<LeadAttributes, 'id'> {}

export class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
    declare id: string;
    declare tenant_id: string;
    declare branch_id?: string;
    declare assigned_to_id?: string;
    declare contact_id?: string;
    declare pipeline_id?: string;
    declare stage_id?: string;
    declare name: string;
    declare email?: string;
    declare phone?: string;
    declare source?: string;
    declare source_platform?: string;
    declare status?: string;
    declare priority?: string;
    declare score?: number;
    declare travel_preferences?: Record<string, unknown>;
    declare tags?: string[];
    declare notes?: string;
    declare lost_reason?: string;
    declare metadata?: Record<string, unknown>;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

Lead.init(
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
        assigned_to_id: DataTypes.UUID,
        contact_id: DataTypes.UUID,
        pipeline_id: DataTypes.UUID,
        stage_id: DataTypes.STRING,
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: DataTypes.STRING,
        phone: DataTypes.STRING,
        source: DataTypes.STRING,
        source_platform: DataTypes.STRING,
        status: DataTypes.STRING,
        priority: DataTypes.STRING,
        score: DataTypes.INTEGER,
        travel_preferences: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        tags: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
        },
        notes: DataTypes.TEXT,
        lost_reason: DataTypes.TEXT,
        metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
    },
    {
        sequelize,
        tableName: 'leads',
        underscored: true,
        timestamps: true,
    }
);
