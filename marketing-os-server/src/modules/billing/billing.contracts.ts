export interface BillingOnboardingPort {
    createTrialForTenant(params: {
        tenantId: string;
        performedByUserId?: string;
    }): Promise<void>;
}
