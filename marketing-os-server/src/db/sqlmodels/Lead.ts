import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class Lead extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
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

    return Lead;
};
