import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class JournalLine extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    JournalLine.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        journal_entry_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        account_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        debit_amount: DataTypes.DECIMAL,
        credit_amount: DataTypes.DECIMAL,
        branch_id: DataTypes.UUID,
        trip_id: DataTypes.UUID,
        booking_id: DataTypes.UUID,
        vendor_id: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'journal_lines',
        underscored: true,
        timestamps: false,
    }
);

    return JournalLine;
};
