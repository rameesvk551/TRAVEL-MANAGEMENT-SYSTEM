import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class LedgerEntry extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
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

    return LedgerEntry;
};
