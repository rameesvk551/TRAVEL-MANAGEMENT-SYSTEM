import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class WhatsappConversation extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    WhatsappConversation.init(
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
        contact_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        whatsapp_thread_id: DataTypes.STRING,
        primary_actor_phone: DataTypes.STRING,
        primary_actor_name: DataTypes.STRING,
        state: DataTypes.STRING,
        last_activity_at: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'whatsapp_conversations',
        underscored: true,
        timestamps: false,
    }
);

    return WhatsappConversation;
};
