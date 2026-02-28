import { Model, Sequelize, DataTypes } from 'sequelize';

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
    class EmployeeSkill extends Model {
        static associate(models: any) {
            // Associations are handled in associations.ts or dynamically
        }
    }

    EmployeeSkill.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        skill_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        proficiency_level: DataTypes.INTEGER,
        certified_at: DataTypes.DATEONLY,
        expires_at: DataTypes.DATEONLY,
    },
    {
        sequelize,
        tableName: 'employee_skills',
        underscored: true,
        timestamps: false,
    }
);

    return EmployeeSkill;
};
