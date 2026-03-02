import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class WhatsappTimelineEntry extends Model {
        static associate(models: any) {
            WhatsappTimelineEntry.belongsTo(models.Tenant, {
                foreignKey: 'tenant_id',
                as: 'tenant',
            });
        }
    }

    WhatsappTimelineEntry.init(
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
            trip_assignment_id: DataTypes.UUID,
            source: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            entry_type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            visibility: {
                type: DataTypes.STRING,
                defaultValue: 'internal',
            },
            actor_id: DataTypes.STRING,
            actor_type: DataTypes.STRING,
            actor_name: DataTypes.STRING,
            title: DataTypes.STRING,
            description: DataTypes.TEXT,
            old_value: DataTypes.TEXT,
            new_value: DataTypes.TEXT,
            metadata: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            media_urls: {
                type: DataTypes.ARRAY(DataTypes.TEXT),
                defaultValue: [],
            },
            message_id: DataTypes.UUID,
            occurred_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'whatsapp_timeline_entries',
            underscored: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: false,
        }
    );

    return WhatsappTimelineEntry;
};
