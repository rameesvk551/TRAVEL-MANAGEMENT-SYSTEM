import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../config/database.js';
import { Campaign, CampaignProps, CampaignType, CampaignStatus, CampaignChannel } from './entities/Campaign.js';
import { CampaignStepModel } from './CampaignStepModel.js';

interface CampaignCreationAttributes extends Optional<CampaignProps, 'id' | 'createdAt' | 'updatedAt'> { }

export class CampaignModel extends Model<CampaignProps, CampaignCreationAttributes> implements CampaignProps {
    public id!: string;
    public tenantId!: string;
    public name!: string;
    public type!: CampaignType;
    public channel!: CampaignChannel;
    public status!: CampaignStatus;

    public segmentId?: string;
    public tagIds!: string[];
    public excludedTagIds!: string[];

    public templateId?: string;
    public templateParams!: Record<string, string>;
    public content?: string;

    public scheduledAt?: Date;

    public totalLeads!: number;
    public sentCount!: number;
    public deliveredCount!: number;
    public readCount!: number;
    public repliedCount!: number;
    public failedCount!: number;

    public metadata!: Record<string, unknown>;

    public steps?: CampaignStepModel[];

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public toEntity(): Campaign {
        return Campaign.fromPersistence({
            id: this.id,
            tenantId: this.tenantId,
            name: this.name,
            type: this.type,
            channel: this.channel,
            status: this.status,
            segmentId: this.segmentId,
            tagIds: this.tagIds,
            excludedTagIds: this.excludedTagIds,
            templateId: this.templateId,
            templateParams: this.templateParams,
            content: this.content,
            scheduledAt: this.scheduledAt,
            totalLeads: this.totalLeads,
            sentCount: this.sentCount,
            deliveredCount: this.deliveredCount,
            readCount: this.readCount,
            repliedCount: this.repliedCount,
            failedCount: this.failedCount,
            metadata: this.metadata,
            steps: this.steps?.map(step => step.toEntity()) || [],
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        });
    }
}

CampaignModel.init(
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('BROADCAST', 'DRIP', 'TRIGGERED'),
            allowNull: false,
        },
        channel: {
            type: DataTypes.ENUM('WHATSAPP', 'EMAIL'),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED'),
            defaultValue: 'DRAFT',
        },
        segmentId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        tagIds: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
        },
        excludedTagIds: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
        },
        templateId: {
            type: DataTypes.UUID,
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
        scheduledAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        totalLeads: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        sentCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        deliveredCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        readCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        repliedCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        failedCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
    },
    {
        sequelize,
        tableName: 'marketing_campaigns',
        timestamps: true,
        indexes: [
            { fields: ['tenant_id'] },
            { fields: ['status'] },
        ],
    }
);

CampaignModel.hasMany(CampaignStepModel, { foreignKey: 'campaignId', as: 'steps' });
CampaignStepModel.belongsTo(CampaignModel, { foreignKey: 'campaignId' });
