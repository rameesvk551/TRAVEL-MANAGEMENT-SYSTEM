import { QueryInterface, DataTypes } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('whatsapp_messages', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            tenant_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            conversation_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'whatsapp_conversations',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            direction: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            message_type: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            linked_lead_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            linked_booking_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable('whatsapp_messages');
    },
};
