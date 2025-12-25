import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface WhatsappTemplateAttributes {
    id: string;
    tenant_id: string;
    template_name: string;
    category?: string;
    use_case?: string;
    body_content?: string;
    status: string;
}

export interface WhatsappTemplateCreationAttributes extends Optional<WhatsappTemplateAttributes, 'id' | 'status'> {}

export class WhatsappTemplate extends Model<WhatsappTemplateAttributes, WhatsappTemplateCreationAttributes> implements WhatsappTemplateAttributes {
    public id!: string;
    public tenant_id!: string;
    public template_name!: string;
    public category?: string;
    public use_case?: string;
    public body_content?: string;
    public status!: string;
}

WhatsappTemplate.init(
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
        template_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        category: DataTypes.STRING,
        use_case: DataTypes.STRING,
        body_content: DataTypes.TEXT,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'draft',
        },
    },
    {
        sequelize,
        tableName: 'whatsapp_templates',
        underscored: true,
        timestamps: false,
    }
);
