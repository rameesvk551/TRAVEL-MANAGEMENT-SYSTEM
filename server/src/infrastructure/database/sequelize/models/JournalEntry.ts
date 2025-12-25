import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface JournalEntryAttributes {
    id: string;
    tenant_id: string;
    branch_id?: string;
    entry_number: string;
    entry_date: Date;
    entry_type?: string;
    status: string;
    description?: string;
    source_module?: string;
    source_record_id?: string;
    total_debit?: number;
    total_credit?: number;
    created_by?: string;
}

export interface JournalEntryCreationAttributes extends Optional<JournalEntryAttributes, 'id' | 'status'> {}

export class JournalEntry extends Model<JournalEntryAttributes, JournalEntryCreationAttributes> implements JournalEntryAttributes {
    public id!: string;
    public tenant_id!: string;
    public branch_id?: string;
    public entry_number!: string;
    public entry_date!: Date;
    public entry_type?: string;
    public status!: string;
    public description?: string;
    public source_module?: string;
    public source_record_id?: string;
    public total_debit?: number;
    public total_credit?: number;
    public created_by?: string;
}

JournalEntry.init(
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
        entry_number: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        entry_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        entry_type: DataTypes.STRING,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'draft',
        },
        description: DataTypes.TEXT,
        source_module: DataTypes.STRING,
        source_record_id: DataTypes.UUID,
        total_debit: DataTypes.DECIMAL,
        total_credit: DataTypes.DECIMAL,
        created_by: DataTypes.UUID,
    },
    {
        sequelize,
        tableName: 'journal_entries',
        underscored: true,
        timestamps: false,
    }
);
