import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class WhatsappMessage extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
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
        direction: DataTypes.STRING,
        message_type: DataTypes.STRING,
        status: DataTypes.STRING,
        linked_lead_id: DataTypes.UUID,
        linked_booking_id: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'whatsapp_messages',
        underscored: true,
        timestamps: false,
    }
);

    return WhatsappMessage;
};
