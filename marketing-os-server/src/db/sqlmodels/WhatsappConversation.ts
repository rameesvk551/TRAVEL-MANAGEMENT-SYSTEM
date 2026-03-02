import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class WhatsappConversation extends Model {
        static associate(models: any) {
            WhatsappConversation.belongsTo(models.Tenant, {
                foreignKey: 'tenant_id',
                as: 'tenant',
            });
            WhatsappConversation.hasMany(models.WhatsappConversationEntity, {
                foreignKey: 'conversation_id',
                as: 'linkedEntities',
            });
            WhatsappConversation.hasMany(models.WhatsappMessage, {
                foreignKey: 'conversation_id',
                as: 'messages',
            });
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
            channel: {
                type: DataTypes.STRING,
                defaultValue: 'WHATSAPP',
            },
            external_id: DataTypes.STRING,
            whatsapp_thread_id: DataTypes.STRING,
            contact_id: DataTypes.UUID,
            primary_actor_type: DataTypes.STRING,
            primary_actor_user_id: DataTypes.STRING,
            primary_actor_employee_id: DataTypes.STRING,
            primary_actor_contact_id: DataTypes.STRING,
            primary_actor_phone: DataTypes.STRING,
            primary_actor_name: DataTypes.STRING,
            state: {
                type: DataTypes.STRING,
                defaultValue: 'ACTIVE',
            },
            workflow_progress: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            last_activity_at: DataTypes.DATE,
            session_started_at: DataTypes.DATE,
            session_expires_at: DataTypes.DATE,
            message_count: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            is_opted_in: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            is_escalated: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            requires_human_review: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            provider_metadata: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
        },
        {
            sequelize,
            tableName: 'whatsapp_conversations',
            underscored: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return WhatsappConversation;
};
