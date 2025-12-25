import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface AccountAttributes {
    id: string;
    tenant_id: string;
    code: string;
    name: string;
    account_type: string;
    normal_balance?: string;
    parent_account_id?: string;
    is_header: boolean;
    is_system_account: boolean;
    status: string;
}

export interface AccountCreationAttributes extends Optional<AccountAttributes, 'id' | 'is_header' | 'is_system_account' | 'status'> {}

export class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
    public id!: string;
    public tenant_id!: string;
    public code!: string;
    public name!: string;
    public account_type!: string;
    public normal_balance?: string;
    public parent_account_id?: string;
    public is_header!: boolean;
    public is_system_account!: boolean;
    public status!: string;
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
