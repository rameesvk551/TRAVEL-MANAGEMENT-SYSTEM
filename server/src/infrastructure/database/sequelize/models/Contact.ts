import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface ContactAttributes {
    id: string;
    tenant_id: string;
    branch_id?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    first_name: string;
    last_name?: string;
    marketing_consent: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'marketing_consent'> {}

export class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
    public id!: string;
    public tenant_id!: string;
    public branch_id?: string;
    public email?: string;
    public phone?: string;
    public whatsapp?: string;
    public first_name!: string;
    public last_name?: string;
    public marketing_consent!: boolean;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Contact.init(
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
        email: DataTypes.STRING,
        phone: DataTypes.STRING,
        whatsapp: DataTypes.STRING,
        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        last_name: DataTypes.STRING,
        marketing_consent: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'contacts',
        underscored: true,
        timestamps: true,
    }
);
