import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface UserAttributes {
    id: string;
    tenant_id: string;
    branch_id?: string;
    email: string;
    password_hash: string;
    name: string;
    role: string;
    is_active: boolean;
    department_id?: string;
    salary?: number;
    joining_date?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'is_active'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public tenant_id!: string;
    public branch_id?: string;
    public email!: string;
    public password_hash!: string;
    public name!: string;
    public role!: string;
    public is_active!: boolean;
    public department_id?: string;
    public salary?: number;
    public joining_date?: Date;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

User.init(
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
        branch_id: DataTypes.UUID,
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
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        department_id: DataTypes.UUID,
        salary: DataTypes.DECIMAL,
        joining_date: DataTypes.DATEONLY,
    },
    {
        sequelize,
        tableName: 'users',
        underscored: true,
        timestamps: true,
    }
);
