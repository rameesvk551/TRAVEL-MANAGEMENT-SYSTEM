import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/database.js';
import { CampaignStep, CampaignStepProps } from './entities/CampaignStep.js';

interface CampaignStepCreationAttributes extends Optional<CampaignStepProps, 'id' | 'createdAt' | 'updatedAt'> { }

export class CampaignStepModel extends Model<CampaignStepProps, CampaignStepCreationAttributes> implements CampaignStepProps {
    public id!: string;
    public tenantId!: string;
    public campaignId!: string;
    public stepOrder!: number;
    public delay!: number;

    public templateId?: string;
    public templateParams!: Record<string, string>;
    public content?: string;

    public metadata!: Record<string, unknown>;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public toEntity(): CampaignStep {
        return new CampaignStep({
            id: this.id,
            tenantId: this.tenantId,
            campaignId: this.campaignId,
            stepOrder: this.stepOrder,
            delay: this.delay,
            templateId: this.templateId,
            templateParams: this.templateParams,
            content: this.content,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        });
    }
}

CampaignStepModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tenantId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        campaignId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'marketing_campaigns',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        stepOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        delay: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        templateId: {
            type: DataTypes.STRING, // Changed to STRING as it might be an external ID
            allowNull: true,
        },
        templateParams: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
    },
    {
        sequelize,
        tableName: 'marketing_campaign_steps',
        timestamps: true,
        indexes: [
            { fields: ['campaign_id'] },
        ],
    }
);
