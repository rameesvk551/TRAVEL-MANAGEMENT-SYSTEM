import { QueryInterface, DataTypes } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('whatsapp_audit_logs', {
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
            event_type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            actor_type: {
                type: DataTypes.STRING,
                defaultValue: 'SYSTEM',
            },
            actor_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            actor_phone: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            entity_type: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            entity_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            payload: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            ip_address: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            user_agent: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable('whatsapp_audit_logs');
    },
};
