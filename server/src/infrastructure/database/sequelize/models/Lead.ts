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
    notes?: string;
    lost_reason?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface LeadCreationAttributes extends Optional<LeadAttributes, 'id'> {}

export class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
    public id!: string;
    public tenant_id!: string;
    public branch_id?: string;
    public assigned_to_id?: string;
    public contact_id?: string;
    public pipeline_id?: string;
    public stage_id?: string;
    public name!: string;
    public email?: string;
    public phone?: string;
    public source?: string;
    public source_platform?: string;
    public status?: string;
    public priority?: string;
    public score?: number;
    public notes?: string;
    public lost_reason?: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
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
        notes: DataTypes.TEXT,
        lost_reason: DataTypes.TEXT,
    },
    {
        sequelize,
        tableName: 'leads',
        underscored: true,
        timestamps: true,
    }
);
