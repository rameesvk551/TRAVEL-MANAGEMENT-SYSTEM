import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface DocumentAttributes {
    id: string;
    tenant_id: string;
    employee_id: string;
    type: string;
    name: string;
    file_url?: string;
    is_verified: boolean;
    expiry_date?: Date;
}

export interface DocumentCreationAttributes extends Optional<DocumentAttributes, 'id' | 'is_verified'> {}

export class Document extends Model<DocumentAttributes, DocumentCreationAttributes> implements DocumentAttributes {
    public id!: string;
    public tenant_id!: string;
    public employee_id!: string;
    public type!: string;
    public name!: string;
    public file_url?: string;
    public is_verified!: boolean;
    public expiry_date?: Date;
}

Document.init(
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
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        file_url: DataTypes.TEXT,
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        expiry_date: DataTypes.DATEONLY,
    },
    {
        sequelize,
        tableName: 'documents',
        underscored: true,
        timestamps: false,
    }
);
