import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class JournalEntry extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
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

    return JournalEntry;
};
