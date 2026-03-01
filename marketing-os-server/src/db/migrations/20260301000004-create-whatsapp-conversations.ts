import { QueryInterface, DataTypes } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('whatsapp_conversations', {
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
            contact_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            whatsapp_thread_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            primary_actor_phone: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            primary_actor_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            state: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            last_activity_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable('whatsapp_conversations');
    },
};
