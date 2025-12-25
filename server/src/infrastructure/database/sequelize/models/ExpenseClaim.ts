import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface ExpenseClaimAttributes {
    id: string;
    tenant_id: string;
    employee_id: string;
    claim_number: string;
    title: string;
    description?: string;
    trip_id?: string;
    total_amount?: number;
    currency?: string;
    status: string;
    submitted_at?: Date;
    reviewed_by?: string;
    reviewed_at?: Date;
    approved_by?: string;
    approved_at?: Date;
    paid_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface ExpenseClaimCreationAttributes extends Optional<ExpenseClaimAttributes, 'id' | 'status'> {}

export class ExpenseClaim extends Model<ExpenseClaimAttributes, ExpenseClaimCreationAttributes> implements ExpenseClaimAttributes {
    public id!: string;
    public tenant_id!: string;
    public employee_id!: string;
    public claim_number!: string;
    public title!: string;
    public description?: string;
    public trip_id?: string;
    public total_amount?: number;
    public currency?: string;
    public status!: string;
    public submitted_at?: Date;
    public reviewed_by?: string;
    public reviewed_at?: Date;
    public approved_by?: string;
    public approved_at?: Date;
    public paid_at?: Date;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

ExpenseClaim.init(
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
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        claim_number: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: DataTypes.TEXT,
        trip_id: DataTypes.UUID,
        total_amount: DataTypes.DECIMAL,
        currency: DataTypes.STRING,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'draft',
        },
        submitted_at: DataTypes.DATE,
        reviewed_by: DataTypes.UUID,
        reviewed_at: DataTypes.DATE,
        approved_by: DataTypes.UUID,
        approved_at: DataTypes.DATE,
        paid_at: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'expense_claims',
        underscored: true,
        timestamps: true,
    }
);
