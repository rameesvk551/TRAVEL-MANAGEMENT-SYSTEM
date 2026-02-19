import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Tenant } from './Tenant.js';

interface UserAttributes {
    id: string;
    tenant_id: string;
    branch_id?: string;
    email: string;
    password_hash: string;
    name: string;
    role: string;
    profile?: Record<string, unknown>;
    is_active: boolean;
    department_id?: string;
    salary?: number;
    joining_date?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'is_active'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public declare id: string;
    public declare tenant_id: string;
    public declare branch_id?: string;
    public declare email: string;
    public declare password_hash: string;
    public declare name: string;
    public declare role: string;
    public declare profile?: Record<string, unknown>;
    public declare is_active: boolean;
    public declare department_id?: string;
    public declare salary?: number;
    public declare joining_date?: Date;
    public declare readonly created_at: Date;
    public declare readonly updated_at: Date;

    // Associations
    public readonly tenant?: Tenant;
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
        profile: {
            type: DataTypes.JSONB,
            defaultValue: {},
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
