import { QueryInterface, DataTypes } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('subscriptions', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            tenant_id: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            customer_id: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            customer_email: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            plan_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            plan_tier: {
                type: DataTypes.STRING(50),
                defaultValue: 'basic',
            },
            status: {
                type: DataTypes.STRING(30),
                allowNull: false,
                defaultValue: 'active',
            },
            amount: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0,
            },
            currency: {
                type: DataTypes.STRING(3),
                defaultValue: 'USD',
            },
            billing_interval: {
                type: DataTypes.STRING(20),
                defaultValue: 'monthly',
            },
            trial_start: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            trial_end: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            current_period_start: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            current_period_end: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            cancelled_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            cancel_reason: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            metadata: {
                type: DataTypes.JSONB,
                defaultValue: {},
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
        await queryInterface.dropTable('subscriptions');
    },
};
