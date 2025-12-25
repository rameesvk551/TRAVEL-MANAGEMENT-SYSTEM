import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface SkillAttributes {
    id: string;
    tenant_id: string;
    code: string;
    name: string;
    category?: string;
    description?: string;
    is_active: boolean;
}

export interface SkillCreationAttributes extends Optional<SkillAttributes, 'id' | 'is_active'> {}

export class Skill extends Model<SkillAttributes, SkillCreationAttributes> implements SkillAttributes {
    public id!: string;
    public tenant_id!: string;
    public code!: string;
    public name!: string;
    public category?: string;
    public description?: string;
    public is_active!: boolean;
}

Skill.init(
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
        code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        category: DataTypes.STRING,
        description: DataTypes.TEXT,
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'skills',
        underscored: true,
        timestamps: false,
    }
);
