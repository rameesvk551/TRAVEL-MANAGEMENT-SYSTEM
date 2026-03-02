import { QueryInterface, DataTypes } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('whatsapp_timeline_entries', {
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
            lead_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            booking_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            departure_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            trip_assignment_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
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
            actor_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            actor_type: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            actor_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            old_value: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            new_value: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            metadata: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            media_urls: {
                type: DataTypes.ARRAY(DataTypes.TEXT),
                defaultValue: [],
            },
            message_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            occurred_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable('whatsapp_timeline_entries');
    },
};
