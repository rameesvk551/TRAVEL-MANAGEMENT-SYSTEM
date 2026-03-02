import { QueryInterface, DataTypes } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('store_orders', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            tenant_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'tenants',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            customer_phone: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            customer_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            customer_address: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            total_amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            currency: {
                type: DataTypes.STRING(3),
                defaultValue: 'USD',
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING,
                defaultValue: 'pending',
                allowNull: false,
            },
            payment_status: {
                type: DataTypes.STRING,
                defaultValue: 'pending',
                allowNull: false,
            },
            payment_reference: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            whatsapp_conversation_id: {
                type: DataTypes.UUID,
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

        await queryInterface.addIndex('store_orders', ['tenant_id']);
        await queryInterface.addIndex('store_orders', ['customer_phone']);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable('store_orders');
    },
};
