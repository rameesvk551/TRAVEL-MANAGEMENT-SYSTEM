import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Lead } from '../../modules/campaigns/models/entities/Lead.js';

export interface LeadAttributes {
    id: string;
    tenantId: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    name: string; // Virtual
    company: string | null;
    title: string | null;
    source: string;
    status: string;
    score: number;
    tags: string[];
    customFields: Record<string, any>;
    ownerId: string | null;
    lastActivityAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

interface LeadCreationAttributes extends Optional<LeadAttributes, 'id' | 'createdAt' | 'updatedAt' | 'score' | 'tags' | 'customFields' | 'name' | 'lastActivityAt'> { }

export class LeadModel extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
    public id!: string;
    public tenantId!: string;
    public email!: string | null;
    public phone!: string | null;
    public firstName!: string | null;
    public lastName!: string | null;
    public company!: string | null;
    public title!: string | null;
    public source!: string;
    public status!: string;
    public score!: number;
    public tags!: string[];
    public customFields!: Record<string, any>;
    public ownerId!: string | null;
    public lastActivityAt!: Date | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Virtual getter for name
    public get name(): string {
        if (this.firstName && this.lastName) return `${this.firstName} ${this.lastName}`;
        if (this.firstName) return this.firstName;
        if (this.email) return this.email;
        if (this.phone) return this.phone;
        return 'Unknown';
    }

    public toEntity(): Lead {
        return {
            id: this.id,
            tenantId: this.tenantId,
            name: this.name,
            email: this.email || undefined,
            phone: this.phone || undefined,
            status: this.status,
            source: this.source,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

LeadModel.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tenantId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'tenant_id'
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        firstName: {
            type: DataTypes.STRING,
            field: 'first_name',
            allowNull: true
        },
        lastName: {
            type: DataTypes.STRING,
            field: 'last_name',
            allowNull: true
        },
        name: {
            type: DataTypes.VIRTUAL,
            get() {
                const firstName = this.getDataValue('firstName');
                const lastName = this.getDataValue('lastName');
                const email = this.getDataValue('email');
                if (firstName && lastName) return `${firstName} ${lastName}`;
                if (firstName) return firstName;
                return email || 'Unknown';
            }
        },
        company: {
            type: DataTypes.STRING,
            allowNull: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        source: {
            type: DataTypes.STRING,
            defaultValue: 'manual'
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'new'
        },
        score: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        tags: {
            type: DataTypes.JSONB,
            defaultValue: []
        },
        customFields: {
            type: DataTypes.JSONB,
            defaultValue: {},
            field: 'custom_fields'
        },
        ownerId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'owner_id'
        },
        lastActivityAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_activity_at'
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at'
        }
    },
    {
        sequelize,
        tableName: 'crm_leads',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);
