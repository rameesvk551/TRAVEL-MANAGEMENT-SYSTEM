import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface JournalLineAttributes {
    id: string;
    journal_entry_id: string;
    account_id: string;
    debit_amount?: number;
    credit_amount?: number;
    branch_id?: string;
    trip_id?: string;
    booking_id?: string;
    vendor_id?: string;
}

export interface JournalLineCreationAttributes extends Optional<JournalLineAttributes, 'id'> {}

export class JournalLine extends Model<JournalLineAttributes, JournalLineCreationAttributes> implements JournalLineAttributes {
    public id!: string;
    public journal_entry_id!: string;
    public account_id!: string;
    public debit_amount?: number;
    public credit_amount?: number;
    public branch_id?: string;
    public trip_id?: string;
    public booking_id?: string;
    public vendor_id?: string;
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
