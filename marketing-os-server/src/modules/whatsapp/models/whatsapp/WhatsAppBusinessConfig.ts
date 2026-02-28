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

function _createWhatsAppBusinessConfig(props: WhatsAppBusinessConfigProps) {
    let _props = { ...props };

    return {
        // Getters
        get id(): string { return _props.id; },
        get tenantId(): string { return _props.tenantId; },
        get status(): WABAStatus { return _props.status; },
        get credentials(): WABACredentials | undefined { return _props.credentials; },
        get phoneNumber(): PhoneNumberInfo | undefined { return _props.phoneNumber; },
        get businessName(): string | undefined { return _props.businessName; },
        get features(): WhatsAppBusinessConfigProps['features'] { return _props.features; },
        get isConnected(): boolean { return _props.status === 'connected'; },

        // Business methods
        connect(credentials: WABACredentials, phoneNumber: PhoneNumberInfo): void {
            _props = { ..._props, credentials, phoneNumber, status: 'connected' as WABAStatus, connectedAt: new Date(), updatedAt: new Date(), errorMessage: undefined };
        },

        disconnect(): void {
            _props = { ..._props, status: 'disconnected' as WABAStatus, credentials: undefined, updatedAt: new Date() };
        },

        markError(errorMessage: string): void {
            _props = { ..._props, status: 'error' as WABAStatus, errorMessage, updatedAt: new Date() };
        },

        updatePhoneInfo(phoneNumber: PhoneNumberInfo): void {
            _props = { ..._props, phoneNumber, lastSyncAt: new Date(), updatedAt: new Date() };
        },

        updateBusinessProfile(profile: {
            businessName?: string;
            businessDescription?: string;
            businessCategory?: string;
            businessWebsite?: string;
            businessEmail?: string;
            businessProfilePicture?: string;
        }): void {
            _props = { ..._props, ...profile, updatedAt: new Date() };
        },

        enableFeature(feature: keyof WhatsAppBusinessConfigProps['features']): void {
            _props = { ..._props, features: { ..._props.features, [feature]: true }, updatedAt: new Date() };
        },

        disableFeature(feature: keyof WhatsAppBusinessConfigProps['features']): void {
            _props = { ..._props, features: { ..._props.features, [feature]: false }, updatedAt: new Date() };
        },

        updateOAuthTokens(tokens: WhatsAppBusinessConfigProps['oauthTokens']): void {
            _props = { ..._props, oauthTokens: tokens, updatedAt: new Date() };
        },

        // Serialization
        toJSON(): WhatsAppBusinessConfigProps {
            return { ..._props };
        },

        // For API responses (hide sensitive data)
        toPublicJSON(): Omit<WhatsAppBusinessConfigProps, 'credentials' | 'oauthTokens' | 'webhookSecret'> & {
            hasCredentials: boolean;
            phoneNumberDisplay?: string;
        } {
            const { credentials, oauthTokens, webhookSecret, ...publicProps } = _props;
            return {
                ...publicProps,
                hasCredentials: !!credentials?.accessToken,
                phoneNumberDisplay: _props.phoneNumber?.displayPhoneNumber,
            };
        },
    };
}

export const WhatsAppBusinessConfig = {
    create(props: Omit<WhatsAppBusinessConfigProps, 'id' | 'createdAt' | 'updatedAt' | 'features'> & {
        id?: string;
        features?: Partial<WhatsAppBusinessConfigProps['features']>;
    }): WhatsAppBusinessConfig {
        const now = new Date();
        return _createWhatsAppBusinessConfig({
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
    },

    fromPersistence(props: WhatsAppBusinessConfigProps): WhatsAppBusinessConfig {
        return _createWhatsAppBusinessConfig(props);
    },
};
export type WhatsAppBusinessConfig = ReturnType<typeof _createWhatsAppBusinessConfig>;
