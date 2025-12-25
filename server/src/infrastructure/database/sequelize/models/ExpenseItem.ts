import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface ExpenseItemAttributes {
    id: string;
    claim_id: string;
    description: string;
    category?: string;
    amount: number;
    currency?: string;
    date?: Date;
    payment_method?: string;
    receipt_url?: string;
}

export interface ExpenseItemCreationAttributes extends Optional<ExpenseItemAttributes, 'id'> {}

export class ExpenseItem extends Model<ExpenseItemAttributes, ExpenseItemCreationAttributes> implements ExpenseItemAttributes {
    public id!: string;
    public claim_id!: string;
    public description!: string;
    public category?: string;
    public amount!: number;
    public currency?: string;
    public date?: Date;
    public payment_method?: string;
    public receipt_url?: string;
}

ExpenseItem.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        claim_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        category: DataTypes.STRING,
        amount: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        currency: DataTypes.STRING,
        date: DataTypes.DATEONLY,
        payment_method: DataTypes.STRING,
        receipt_url: DataTypes.TEXT,
    },
    {
        sequelize,
        tableName: 'expense_items',
        underscored: true,
        timestamps: false,
    }
);
