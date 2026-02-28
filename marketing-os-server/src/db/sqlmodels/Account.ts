import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class Account extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    Account.init(
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
        code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        account_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        normal_balance: DataTypes.STRING,
        parent_account_id: DataTypes.UUID,
        is_header: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        is_system_account: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'active',
        },
    },
    {
        sequelize,
        tableName: 'accounts',
        underscored: true,
        timestamps: false,
    }
);

    return Account;
};
