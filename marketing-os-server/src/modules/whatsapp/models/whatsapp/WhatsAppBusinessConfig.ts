// WhatsApp Business Account Configuration
// Stores per-tenant WhatsApp credentials from Embedded Signup

export type WABAStatus = 'pending' | 'connected' | 'disconnected' | 'suspended' | 'error';

export type OnboardingMethod = 'embedded_signup' | 'manual' | 'qr_code';

export interface WABACredentials {
    accessToken: string;
    phoneNumberId: string;
    wabaId: string; // WhatsApp Business Account ID
    businessId?: string; // Meta Business ID
}

export interface PhoneNumberInfo {
    id: string;
    displayPhoneNumber: string;
    verifiedName: string;
    qualityRating?: 'GREEN' | 'YELLOW' | 'RED';
    messagingLimit?: string;
    codeVerificationStatus?: 'VERIFIED' | 'NOT_VERIFIED';
}

export interface WhatsAppBusinessConfigProps {
    id: string;
    tenantId: string;
    status: WABAStatus;
    onboardingMethod: OnboardingMethod;
    
    // Credentials (encrypted at rest)
    credentials?: WABACredentials;
    
    // Phone number details
    phoneNumber?: PhoneNumberInfo;
    
    // Webhook configuration
    webhookVerifyToken?: string;
    webhookSecret?: string;
    
    // Business profile
    businessName?: string;
    businessDescription?: string;
    businessCategory?: string;
    businessWebsite?: string;
    businessEmail?: string;
    businessProfilePicture?: string;
    
    // Feature flags
    features: {
        catalogEnabled: boolean;
        cartEnabled: boolean;
        paymentsEnabled: boolean;
        flowsEnabled: boolean;
    };
    
    // Rate limits info
    rateLimits?: {
        tier: 'TIER_1K' | 'TIER_10K' | 'TIER_100K' | 'UNLIMITED';
        dailyLimit: number;
        monthlyUsed: number;
    };
    
    // OAuth tokens (for refresh)
    oauthTokens?: {
        userAccessToken?: string;
        systemAccessToken?: string;
        tokenExpiresAt?: Date;
        refreshToken?: string;
    };
    
    // Metadata
    connectedAt?: Date;
    lastSyncAt?: Date;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

export class WhatsAppBusinessConfig {
    private constructor(private props: WhatsAppBusinessConfigProps) {}
    
    static create(props: Omit<WhatsAppBusinessConfigProps, 'id' | 'createdAt' | 'updatedAt' | 'features'> & {
        id?: string;
        features?: Partial<WhatsAppBusinessConfigProps['features']>;
    }): WhatsAppBusinessConfig {
        const now = new Date();
        return new WhatsAppBusinessConfig({
            ...props,
            id: props.id || crypto.randomUUID(),
            features: {
                catalogEnabled: props.features?.catalogEnabled ?? false,
                cartEnabled: props.features?.cartEnabled ?? false,
                paymentsEnabled: props.features?.paymentsEnabled ?? false,
                flowsEnabled: props.features?.flowsEnabled ?? false,
            },
            createdAt: now,
            updatedAt: now,
        });
    }
    
    static fromPersistence(props: WhatsAppBusinessConfigProps): WhatsAppBusinessConfig {
        return new WhatsAppBusinessConfig(props);
    }
    
    // Getters
    get id(): string { return this.props.id; }
    get tenantId(): string { return this.props.tenantId; }
    get status(): WABAStatus { return this.props.status; }
    get credentials(): WABACredentials | undefined { return this.props.credentials; }
    get phoneNumber(): PhoneNumberInfo | undefined { return this.props.phoneNumber; }
    get businessName(): string | undefined { return this.props.businessName; }
    get features(): WhatsAppBusinessConfigProps['features'] { return this.props.features; }
    get isConnected(): boolean { return this.props.status === 'connected'; }
    
    // Business methods
    connect(credentials: WABACredentials, phoneNumber: PhoneNumberInfo): void {
        this.props.credentials = credentials;
        this.props.phoneNumber = phoneNumber;
        this.props.status = 'connected';
        this.props.connectedAt = new Date();
        this.props.updatedAt = new Date();
        this.props.errorMessage = undefined;
    }
    
    disconnect(): void {
        this.props.status = 'disconnected';
        this.props.credentials = undefined;
        this.props.updatedAt = new Date();
    }
    
    markError(errorMessage: string): void {
        this.props.status = 'error';
        this.props.errorMessage = errorMessage;
        this.props.updatedAt = new Date();
    }
    
    updatePhoneInfo(phoneNumber: PhoneNumberInfo): void {
        this.props.phoneNumber = phoneNumber;
        this.props.lastSyncAt = new Date();
        this.props.updatedAt = new Date();
    }
    
    updateBusinessProfile(profile: {
        businessName?: string;
        businessDescription?: string;
        businessCategory?: string;
        businessWebsite?: string;
        businessEmail?: string;
        businessProfilePicture?: string;
    }): void {
        Object.assign(this.props, profile);
        this.props.updatedAt = new Date();
    }
    
    enableFeature(feature: keyof WhatsAppBusinessConfigProps['features']): void {
        this.props.features[feature] = true;
        this.props.updatedAt = new Date();
    }
    
    disableFeature(feature: keyof WhatsAppBusinessConfigProps['features']): void {
        this.props.features[feature] = false;
        this.props.updatedAt = new Date();
    }
    
    updateOAuthTokens(tokens: WhatsAppBusinessConfigProps['oauthTokens']): void {
        this.props.oauthTokens = tokens;
        this.props.updatedAt = new Date();
    }
    
    // Serialization
    toJSON(): WhatsAppBusinessConfigProps {
        return { ...this.props };
    }
    
    // For API responses (hide sensitive data)
    toPublicJSON(): Omit<WhatsAppBusinessConfigProps, 'credentials' | 'oauthTokens' | 'webhookSecret'> & {
        hasCredentials: boolean;
        phoneNumberDisplay?: string;
    } {
        const { credentials, oauthTokens, webhookSecret, ...publicProps } = this.props;
        return {
            ...publicProps,
            hasCredentials: !!credentials?.accessToken,
            phoneNumberDisplay: this.props.phoneNumber?.displayPhoneNumber,
        };
    }
}
