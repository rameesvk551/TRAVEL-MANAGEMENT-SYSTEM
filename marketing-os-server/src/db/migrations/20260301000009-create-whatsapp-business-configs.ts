import { QueryInterface, DataTypes } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('whatsapp_business_configs', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            tenant_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: true,
            },
            credential_source: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'own',
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'pending',
            },
            onboarding_method: {
                type: DataTypes.STRING,
                defaultValue: 'manual',
            },
            access_token: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            phone_number_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            waba_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            business_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            phone_display: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            verified_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            quality_rating: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            business_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            webhook_verify_token: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            features: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            rate_limits: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            connected_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            last_sync_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            error_message: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable('whatsapp_business_configs');
    },
};
