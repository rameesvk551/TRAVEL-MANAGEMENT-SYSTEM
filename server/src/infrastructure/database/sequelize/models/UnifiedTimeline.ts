import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface UnifiedTimelineAttributes {
    id: string;
    tenant_id: string;
    lead_id?: string;
    booking_id?: string;
    departure_id?: string;
    source?: string;
    entry_type?: string;
    title: string;
    occurred_at?: Date;
}

export interface UnifiedTimelineCreationAttributes extends Optional<UnifiedTimelineAttributes, 'id'> {}

export class UnifiedTimeline extends Model<UnifiedTimelineAttributes, UnifiedTimelineCreationAttributes> implements UnifiedTimelineAttributes {
    public id!: string;
    public tenant_id!: string;
    public lead_id?: string;
    public booking_id?: string;
    public departure_id?: string;
    public source?: string;
    public entry_type?: string;
    public title!: string;
    public occurred_at?: Date;
}

UnifiedTimeline.init(
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
        booking_id: DataTypes.UUID,
        departure_id: DataTypes.UUID,
        source: DataTypes.STRING,
        entry_type: DataTypes.STRING,
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        occurred_at: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'unified_timeline',
        underscored: true,
        timestamps: false,
    }
);
