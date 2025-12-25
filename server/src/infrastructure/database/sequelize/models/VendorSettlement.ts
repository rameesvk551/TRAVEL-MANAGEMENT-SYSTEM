import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface VendorSettlementAttributes {
    id: string;
    tenant_id: string;
    vendor_id: string;
    settlement_number?: string;
    amount?: number;
    payment_method?: string;
    payment_reference?: string;
    payment_date?: Date;
    is_verified: boolean;
}

export interface VendorSettlementCreationAttributes extends Optional<VendorSettlementAttributes, 'id' | 'is_verified'> {}

export class VendorSettlement extends Model<VendorSettlementAttributes, VendorSettlementCreationAttributes> implements VendorSettlementAttributes {
    public id!: string;
    public tenant_id!: string;
    public vendor_id!: string;
    public settlement_number?: string;
    public amount?: number;
    public payment_method?: string;
    public payment_reference?: string;
    public payment_date?: Date;
    public is_verified!: boolean;
}

VendorSettlement.init(
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
        vendor_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        settlement_number: DataTypes.STRING,
        amount: DataTypes.DECIMAL,
        payment_method: DataTypes.STRING,
        payment_reference: DataTypes.STRING,
        payment_date: DataTypes.DATEONLY,
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'vendor_settlements',
        underscored: true,
        timestamps: false,
    }
);
