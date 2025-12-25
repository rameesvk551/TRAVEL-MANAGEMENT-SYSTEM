import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface EmployeeSkillAttributes {
    id: string;
    employee_id: string;
    skill_id: string;
    proficiency_level?: number;
    certified_at?: Date;
    expires_at?: Date;
}

export interface EmployeeSkillCreationAttributes extends Optional<EmployeeSkillAttributes, 'id'> {}

export class EmployeeSkill extends Model<EmployeeSkillAttributes, EmployeeSkillCreationAttributes> implements EmployeeSkillAttributes {
    public id!: string;
    public employee_id!: string;
    public skill_id!: string;
    public proficiency_level?: number;
    public certified_at?: Date;
    public expires_at?: Date;
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
