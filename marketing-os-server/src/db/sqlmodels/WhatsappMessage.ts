import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class WhatsappMessage extends Model {
        static associate(models: any) {
            WhatsappMessage.belongsTo(models.Tenant, {
                foreignKey: 'tenant_id',
                as: 'tenant',
            });
            WhatsappMessage.belongsTo(models.WhatsappConversation, {
                foreignKey: 'conversation_id',
                as: 'conversation',
            });
        }
    }

    WhatsappMessage.init(
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
            conversation_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            provider_message_id: DataTypes.STRING,
            provider_timestamp: DataTypes.DATE,
            direction: DataTypes.STRING,
            sender_phone: DataTypes.STRING,
            recipient_phone: DataTypes.STRING,
            message_type: DataTypes.STRING,
            text_content: DataTypes.JSONB,
            media_content: DataTypes.JSONB,
            location_content: DataTypes.JSONB,
            contact_content: DataTypes.JSONB,
            interactive_content: DataTypes.JSONB,
            template_content: DataTypes.JSONB,
            reply_to_message_id: DataTypes.STRING,
            selected_button_id: DataTypes.STRING,
            selected_list_item_id: DataTypes.STRING,
            status: DataTypes.STRING,
            status_timestamps: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            failure_reason: DataTypes.TEXT,
            linked_lead_id: DataTypes.UUID,
            linked_booking_id: DataTypes.UUID,
            linked_trip_id: DataTypes.UUID,
            handled_by_user_id: DataTypes.UUID,
            is_processed: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            processing_error: DataTypes.TEXT,
            requires_response: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            idempotency_key: {
                type: DataTypes.STRING,
                unique: true,
            },
        },
        {
            sequelize,
            tableName: 'whatsapp_messages',
            underscored: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return WhatsappMessage;
};
