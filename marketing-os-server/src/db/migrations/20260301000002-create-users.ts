import { QueryInterface, DataTypes } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('users', {
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
                onDelete: 'CASCADE',
            },
            branch_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password_hash: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            role: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'staff',
            },
            profile: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            department_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            salary: {
                type: DataTypes.DECIMAL,
                allowNull: true,
            },
            joining_date: {
                type: DataTypes.DATEONLY,
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
        await queryInterface.dropTable('users');
    },
};
