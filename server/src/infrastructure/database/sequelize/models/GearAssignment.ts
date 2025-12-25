import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface GearAssignmentAttributes {
    id: string;
    tenant_id: string;
    trip_id?: string;
    booking_id?: string;
    gear_item_id: string;
    status?: string;
    assigned_to_user_id?: string;
    actual_issue_date?: Date;
    actual_return_date?: Date;
}

export interface GearAssignmentCreationAttributes extends Optional<GearAssignmentAttributes, 'id'> {}

export class GearAssignment extends Model<GearAssignmentAttributes, GearAssignmentCreationAttributes> implements GearAssignmentAttributes {
    public id!: string;
    public tenant_id!: string;
    public trip_id?: string;
    public booking_id?: string;
    public gear_item_id!: string;
    public status?: string;
    public assigned_to_user_id?: string;
    public actual_issue_date?: Date;
    public actual_return_date?: Date;
}

GearAssignment.init(
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
        trip_id: DataTypes.UUID,
        booking_id: DataTypes.UUID,
        gear_item_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        status: DataTypes.STRING,
        assigned_to_user_id: DataTypes.UUID,
        actual_issue_date: DataTypes.DATE,
        actual_return_date: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'gear_assignments',
        underscored: true,
        timestamps: false,
    }
);
