import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class UnifiedTimeline extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
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

    return UnifiedTimeline;
};
