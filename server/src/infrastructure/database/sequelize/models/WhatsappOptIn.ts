import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface WhatsappOptInAttributes {
    id: string;
    tenant_id: string;
    phone_number: string;
    status: string;
    opt_in_date?: Date;
}

export interface WhatsappOptInCreationAttributes extends Optional<WhatsappOptInAttributes, 'id' | 'status'> {}

export class WhatsappOptIn extends Model<WhatsappOptInAttributes, WhatsappOptInCreationAttributes> implements WhatsappOptInAttributes {
    public id!: string;
    public tenant_id!: string;
    public phone_number!: string;
    public status!: string;
    public opt_in_date?: Date;
}

WhatsappOptIn.init(
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
        phone_number: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
        },
        opt_in_date: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'whatsapp_opt_ins',
        underscored: true,
        timestamps: false,
    }
);
