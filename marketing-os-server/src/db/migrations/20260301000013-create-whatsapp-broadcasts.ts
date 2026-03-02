import { QueryInterface, DataTypes } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('whatsapp_broadcasts', {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
            tenant_id: { type: DataTypes.STRING, allowNull: false },
            template_name: { type: DataTypes.STRING, allowNull: false },
            language: { type: DataTypes.STRING, allowNull: false, defaultValue: 'en' },
            status: { type: DataTypes.ENUM('PENDING', 'SENDING', 'COMPLETED', 'FAILED', 'SCHEDULED'), allowNull: false, defaultValue: 'PENDING' },
            total_recipients: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            sent_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            failed_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            blocked_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            recipients: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
            blocked_recipients: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
            scheduled_at: { type: DataTypes.DATE, allowNull: true },
            started_at: { type: DataTypes.DATE, allowNull: true },
            completed_at: { type: DataTypes.DATE, allowNull: true },
            created_by: { type: DataTypes.UUID, allowNull: false },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        });

        await queryInterface.addIndex('whatsapp_broadcasts', ['tenant_id']);
        await queryInterface.addIndex('whatsapp_broadcasts', ['status']);
        await queryInterface.addIndex('whatsapp_broadcasts', ['tenant_id', 'status']);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable('whatsapp_broadcasts');
    },
};
