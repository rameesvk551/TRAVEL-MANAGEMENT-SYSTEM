import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface LedgerEntryAttributes {
    id: string;
    tenant_id: string;
    branch_id?: string;
    account_id: string;
    journal_entry_id: string;
    entry_date: Date;
    debit_amount?: number;
    credit_amount?: number;
    running_balance?: number;
}

export interface LedgerEntryCreationAttributes extends Optional<LedgerEntryAttributes, 'id'> {}

export class LedgerEntry extends Model<LedgerEntryAttributes, LedgerEntryCreationAttributes> implements LedgerEntryAttributes {
    public id!: string;
    public tenant_id!: string;
    public branch_id?: string;
    public account_id!: string;
    public journal_entry_id!: string;
    public entry_date!: Date;
    public debit_amount?: number;
    public credit_amount?: number;
    public running_balance?: number;
}

LedgerEntry.init(
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
        account_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        journal_entry_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        entry_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        debit_amount: DataTypes.DECIMAL,
        credit_amount: DataTypes.DECIMAL,
        running_balance: DataTypes.DECIMAL,
    },
    {
        sequelize,
        tableName: 'ledger_entries',
        underscored: true,
        timestamps: false,
    }
);
