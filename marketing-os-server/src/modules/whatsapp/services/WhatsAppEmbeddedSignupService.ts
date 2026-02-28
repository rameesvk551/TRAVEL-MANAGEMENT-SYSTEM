// WhatsApp Embedded Signup Service
// Handles OAuth flow for WhatsApp Business onboarding via QR code / Facebook Login

import { config } from '../../../config/env.js';
import { WhatsAppBusinessConfig, type WABACredentials, type PhoneNumberInfo } from '../models/whatsapp/index.js';

export const REQUIRED_REVIEW_SCOPES = [
    'business_management',
    'whatsapp_business_management',
    'whatsapp_business_messaging',
    'public_profile',
    'manage_app_solution',
];

export interface EmbeddedSignupConfig {
    appId: string;
    configId: string; // Meta configuration ID for embedded signup
    appSecret: string;
    redirectUri: string;
}

export interface TokenExchangeResult {
    accessToken: string;
    tokenType: string;
    expiresIn?: number;
}

export interface DebugTokenResult {
    isValid: boolean;
    appId: string;
    userId: string;
    scopes: string[];
    granularScopes: Array<{
        scope: string;
        targetIds?: string[];
    }>;
    expiresAt?: number;
}

export interface SharedWABAInfo {
    id: string;
    name: string;
    currency: string;
    timezoneId: string;
    messageTemplateNamespace: string;
}

export interface BusinessManagerInfo {
    id: string;
    name: string;
}

export interface BusinessManagerAsset {
    id: string;
    name: string;
    whatsappBusinessAccounts: Array<SharedWABAInfo & {
        phoneNumbers: PhoneNumberInfo[];
    }>;
}

export interface OnboardingSelection {
    businessId?: string;
    wabaId?: string;
    phoneNumberId?: string;
}

export interface PhoneNumbersResult {
    data: Array<{
        id: string;
        display_phone_number: string;
        verified_name: string;
        quality_rating: 'GREEN' | 'YELLOW' | 'RED';
        code_verification_status?: string;
    }>;
}

export interface OnboardingResult {
    success: boolean;
    config?: WhatsAppBusinessConfig;
    grantedScopes?: string[];
    missingScopes?: string[];
    error?: string;
    errorCode?: string;
}

export class WhatsAppEmbeddedSignupService {
    private readonly graphApiUrl = 'https://graph.facebook.com';
    private readonly apiVersion: string;

    constructor(
        private readonly embeddedConfig: EmbeddedSignupConfig
    ) {
        this.apiVersion = config.whatsapp.meta?.apiVersion || 'v18.0';
    }

    /**
     * Generate the Embedded Signup URL for frontend to initiate
     */
    getEmbeddedSignupConfig(): {
        appId: string;
        configId: string;
        redirectUri: string;
        scopes: string[];
    } {
        return {
            appId: this.embeddedConfig.appId,
            configId: this.embeddedConfig.configId,
            redirectUri: this.embeddedConfig.redirectUri,
            scopes: REQUIRED_REVIEW_SCOPES,
        };
    }

    getRequiredReviewScopes(): string[] {
        return [...REQUIRED_REVIEW_SCOPES];
    }

    /**
     * Exchange authorization code for access token
     * This is called after user completes Embedded Signup
     */
    async exchangeCodeForToken(code: string): Promise<TokenExchangeResult> {
        const url = new URL(`${this.graphApiUrl}/${this.apiVersion}/oauth/access_token`);
        url.searchParams.append('client_id', this.embeddedConfig.appId);
        url.searchParams.append('client_secret', this.embeddedConfig.appSecret);
        url.searchParams.append('redirect_uri', this.embeddedConfig.redirectUri);
        url.searchParams.append('code', code);

        const response = await fetch(url.toString());

        if (!response.ok) {
            const error: any = await response.json();
            throw new Error(`Token exchange failed: ${error.error?.message || 'Unknown error'}`);
        }

        const data: any = await response.json();

        return {
            accessToken: data.access_token,
            tokenType: data.token_type || 'bearer',
            expiresIn: data.expires_in,
        };
    }

    /**
     * Debug/validate an access token
     */
    async debugToken(inputToken: string): Promise<DebugTokenResult> {
        const url = new URL(`${this.graphApiUrl}/debug_token`);
        url.searchParams.append('input_token', inputToken);
        url.searchParams.append('access_token', `${this.embeddedConfig.appId}|${this.embeddedConfig.appSecret}`);

        const response = await fetch(url.toString());
        const data: any = await response.json();

        if (data.error) {
            throw new Error(`Token debug failed: ${data.error.message}`);
        }

        const tokenData = data.data;

        return {
            isValid: tokenData.is_valid,
            appId: tokenData.app_id,
            userId: tokenData.user_id,
            scopes: tokenData.scopes || [],
            granularScopes: tokenData.granular_scopes || [],
            expiresAt: tokenData.expires_at,
        };
    }

    async getUserBusinesses(accessToken: string): Promise<BusinessManagerInfo[]> {
        const url = new URL(`${this.graphApiUrl}/${this.apiVersion}/me/businesses`);
        url.searchParams.append('access_token', accessToken);
        url.searchParams.append('fields', 'id,name');

        const response = await fetch(url.toString());
        const data: any = await response.json();

        if (data.error) {
            throw new Error(`Failed to fetch businesses: ${data.error.message}`);
        }

        return (data.data || []).map((business: any) => ({
            id: business.id,
            name: business.name,
        }));
    }

    async getOwnedWABAs(businessId: string, accessToken: string): Promise<SharedWABAInfo[]> {
        const url = new URL(`${this.graphApiUrl}/${this.apiVersion}/${businessId}/owned_whatsapp_business_accounts`);
        url.searchParams.append('access_token', accessToken);
        url.searchParams.append('fields', 'id,name,currency,timezone_id,message_template_namespace');

        const response = await fetch(url.toString());
        const data: any = await response.json();

        if (data.error) {
            throw new Error(`Failed to fetch owned WABAs: ${data.error.message}`);
        }

        return (data.data || []).map((waba: any) => ({
            id: waba.id,
            name: waba.name,
            currency: waba.currency,
            timezoneId: waba.timezone_id,
            messageTemplateNamespace: waba.message_template_namespace,
        }));
    }

    /**
     * Get shared WABA (WhatsApp Business Account) info after embedded signup
     */
    async getSharedWABAInfo(accessToken: string): Promise<SharedWABAInfo[]> {
        // First get the user's shared WABAs
        const url = new URL(`${this.graphApiUrl}/${this.apiVersion}/me/whatsapp_business_accounts`);
        url.searchParams.append('access_token', accessToken);
        url.searchParams.append('fields', 'id,name,currency,timezone_id,message_template_namespace');

        const response = await fetch(url.toString());
        const data: any = await response.json();

        if (data.error) {
            throw new Error(`Failed to get WABA info: ${data.error.message}`);
        }

        return (data.data || []).map((waba: any) => ({
            id: waba.id,
            name: waba.name,
            currency: waba.currency,
            timezoneId: waba.timezone_id,
            messageTemplateNamespace: waba.message_template_namespace,
        }));
    }

    async fetchBusinessAssetGraph(accessToken: string): Promise<BusinessManagerAsset[]> {
        const businesses = await this.getUserBusinesses(accessToken);

        if (businesses.length === 0) {
            const sharedWabas = await this.getSharedWABAInfo(accessToken);
            const accounts = await Promise.all(
                sharedWabas.map(async (waba) => ({
                    ...waba,
                    phoneNumbers: await this.getPhoneNumbers(waba.id, accessToken),
                })),
            );

            return [{
                id: 'direct-shared',
                name: 'Directly Shared WhatsApp Business Account',
                whatsappBusinessAccounts: accounts,
            }];
        }

        const graph: BusinessManagerAsset[] = [];
        for (const business of businesses) {
            const wabas = await this.getOwnedWABAs(business.id, accessToken);
            const accounts = await Promise.all(
                wabas.map(async (waba) => ({
                    ...waba,
                    phoneNumbers: await this.getPhoneNumbers(waba.id, accessToken),
                })),
            );

            graph.push({
                id: business.id,
                name: business.name,
                whatsappBusinessAccounts: accounts,
            });
        }

        return graph;
    }

    /**
     * Get phone numbers associated with a WABA
     */
    async getPhoneNumbers(wabaId: string, accessToken: string): Promise<PhoneNumberInfo[]> {
        const url = new URL(`${this.graphApiUrl}/${this.apiVersion}/${wabaId}/phone_numbers`);
        url.searchParams.append('access_token', accessToken);
        url.searchParams.append('fields', 'id,display_phone_number,verified_name,quality_rating,code_verification_status');

        const response = await fetch(url.toString());
        const data: any = await response.json();

        if (data.error) {
            throw new Error(`Failed to get phone numbers: ${data.error.message}`);
        }

        return (data.data || []).map((phone: any) => ({
            id: phone.id,
            displayPhoneNumber: phone.display_phone_number,
            verifiedName: phone.verified_name,
            qualityRating: phone.quality_rating,
            codeVerificationStatus: phone.code_verification_status,
        }));
    }

    /**
     * Subscribe app to WABA webhooks
     */
    async subscribeToWebhooks(wabaId: string, accessToken: string): Promise<boolean> {
        const url = `${this.graphApiUrl}/${this.apiVersion}/${wabaId}/subscribed_apps`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const data: any = await response.json();

        if (data.error) {
            throw new Error(`Failed to subscribe to webhooks: ${data.error.message}`);
        }

        return data.success === true;
    }

    /**
     * Register a phone number for messages (required after onboarding)
     */
    async registerPhoneNumber(phoneNumberId: string, accessToken: string, pin?: string): Promise<boolean> {
        const url = `${this.graphApiUrl}/${this.apiVersion}/${phoneNumberId}/register`;

        const body: any = {
            messaging_product: 'whatsapp',
            pin: pin || '123456', // Default PIN, user should change
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data: any = await response.json();

        if (data.error) {
            // Phone might already be registered
            if (data.error.code === 100 && data.error.error_subcode === 2388093) {
                return true; // Already registered
            }
            throw new Error(`Failed to register phone number: ${data.error.message}`);
        }

        return data.success === true;
    }

    /**
     * Complete the onboarding process
     * This is the main method called after user completes Embedded Signup
     */
    async completeOnboarding(
        tenantId: string,
        authCode: string,
        selection?: OnboardingSelection,
    ): Promise<OnboardingResult> {
        try {
            // Step 1: Exchange code for access token
            const tokenResult = await this.exchangeCodeForToken(authCode);
            return this.completeOnboardingWithAccessToken(
                tenantId,
                tokenResult.accessToken,
                selection,
                tokenResult.expiresIn,
            );
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during onboarding',
                errorCode: 'ONBOARDING_ERROR',
            };
        }
    }

    async completeOnboardingWithAccessToken(
        tenantId: string,
        accessToken: string,
        selection?: OnboardingSelection,
        tokenExpiresIn?: number,
    ): Promise<OnboardingResult> {
        try {
            const debugResult = await this.debugToken(accessToken);
            if (!debugResult.isValid) {
                return {
                    success: false,
                    error: 'Invalid access token received',
                    errorCode: 'INVALID_TOKEN',
                };
            }

            const scopeSummary = this.evaluateScopes(debugResult);
            if (!scopeSummary.hasAllRequired) {
                return {
                    success: false,
                    error: `Missing required permissions: ${scopeSummary.missingScopes.join(', ')}`,
                    errorCode: 'INSUFFICIENT_PERMISSIONS',
                    grantedScopes: scopeSummary.grantedScopes,
                    missingScopes: scopeSummary.missingScopes,
                };
            }

            const selectedBusinessId = selection?.businessId;
            const selectedWabaId = selection?.wabaId;
            const selectedPhoneId = selection?.phoneNumberId;

            let waba: SharedWABAInfo | null = null;
            if (selectedBusinessId) {
                const businessWabas = await this.getOwnedWABAs(selectedBusinessId, accessToken);
                if (selectedWabaId) {
                    waba = businessWabas.find((item) => item.id === selectedWabaId) || null;
                } else {
                    waba = businessWabas[0] || null;
                }
            } else {
                const sharedWabas = await this.getSharedWABAInfo(accessToken);
                if (selectedWabaId) {
                    waba = sharedWabas.find((item) => item.id === selectedWabaId) || null;
                } else {
                    waba = sharedWabas[0] || null;
                }
            }

            if (!waba) {
                return {
                    success: false,
                    error: 'No WhatsApp Business Account found for the selected business.',
                    errorCode: 'NO_WABA',
                    grantedScopes: scopeSummary.grantedScopes,
                    missingScopes: scopeSummary.missingScopes,
                };
            }

            const phoneNumbers = await this.getPhoneNumbers(waba.id, accessToken);
            if (phoneNumbers.length === 0) {
                return {
                    success: false,
                    error: 'No phone number found on this WhatsApp Business Account.',
                    errorCode: 'NO_PHONE_NUMBER',
                    grantedScopes: scopeSummary.grantedScopes,
                    missingScopes: scopeSummary.missingScopes,
                };
            }

            const phoneNumber = selectedPhoneId
                ? (phoneNumbers.find((item) => item.id === selectedPhoneId) || null)
                : phoneNumbers[0];

            if (!phoneNumber) {
                return {
                    success: false,
                    error: 'Selected phone number does not belong to the selected WhatsApp Business Account.',
                    errorCode: 'INVALID_PHONE_SELECTION',
                    grantedScopes: scopeSummary.grantedScopes,
                    missingScopes: scopeSummary.missingScopes,
                };
            }

            await this.subscribeToWebhooks(waba.id, accessToken);
            await this.registerPhoneNumber(phoneNumber.id, accessToken);

            const credentials: WABACredentials = {
                accessToken,
                phoneNumberId: phoneNumber.id,
                wabaId: waba.id,
                businessId: selectedBusinessId,
            };

            const waConfig = WhatsAppBusinessConfig.create({
                tenantId,
                status: 'connected',
                onboardingMethod: 'embedded_signup',
                businessName: waba.name,
            });

            waConfig.connect(credentials, phoneNumber);

            if (tokenExpiresIn) {
                waConfig.updateOAuthTokens({
                    userAccessToken: accessToken,
                    tokenExpiresAt: new Date(Date.now() + tokenExpiresIn * 1000),
                });
            }

            return {
                success: true,
                config: waConfig,
                grantedScopes: scopeSummary.grantedScopes,
                missingScopes: scopeSummary.missingScopes,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during onboarding',
                errorCode: 'ONBOARDING_ERROR',
            };
        }
    }

    /**
     * Refresh connection status and phone number quality
     */
    async refreshStatus(waConfig: WhatsAppBusinessConfig): Promise<void> {
        const credentials = waConfig.credentials;
        if (!credentials) {
            waConfig.markError('No credentials available');
            return;
        }

        try {
            // Check token validity
            const debugResult = await this.debugToken(credentials.accessToken);

            if (!debugResult.isValid) {
                waConfig.markError('Access token expired or invalid');
                return;
            }

            // Refresh phone number info
            const phoneNumbers = await this.getPhoneNumbers(credentials.wabaId, credentials.accessToken);
            const phoneNumber = phoneNumbers.find(p => p.id === credentials.phoneNumberId);

            if (phoneNumber) {
                waConfig.updatePhoneInfo(phoneNumber);
            }

        } catch (error) {
            waConfig.markError(error instanceof Error ? error.message : 'Status refresh failed');
        }
    }

    private evaluateScopes(debugResult: DebugTokenResult): {
        grantedScopes: string[];
        missingScopes: string[];
        hasAllRequired: boolean;
    } {
        const grantedScopeSet = new Set<string>([
            ...(debugResult.scopes || []),
            ...(debugResult.granularScopes || []).map((scope) => scope.scope),
        ]);

        const grantedScopes = Array.from(grantedScopeSet.values());
        const missingScopes = REQUIRED_REVIEW_SCOPES.filter((scope) => !grantedScopeSet.has(scope));

        return {
            grantedScopes,
            missingScopes,
            hasAllRequired: missingScopes.length === 0,
        };
    }
}

// Factory function for creating the service
export function createEmbeddedSignupService(): WhatsAppEmbeddedSignupService | null {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const configId = process.env.META_EMBEDDED_SIGNUP_CONFIG_ID;
    const redirectUri = process.env.META_EMBEDDED_SIGNUP_REDIRECT_URI ||
        `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/whatsapp/onboard/callback`;

    if (!appId || !appSecret || !configId) {
        console.warn('WhatsApp Embedded Signup not configured. Set META_APP_ID, META_APP_SECRET, META_EMBEDDED_SIGNUP_CONFIG_ID');
        return null;
    }

    return new WhatsAppEmbeddedSignupService({
        appId,
        appSecret,
        configId,
        redirectUri,
    });
}
