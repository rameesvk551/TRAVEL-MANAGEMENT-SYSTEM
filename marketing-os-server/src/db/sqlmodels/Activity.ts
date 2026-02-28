import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class Activity extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
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
        metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
    },
    {
        sequelize,
        tableName: 'activities',
        underscored: true,
        timestamps: true,
    }
);

    return Activity;
};
