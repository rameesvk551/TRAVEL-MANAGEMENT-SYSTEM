import { AppError } from '../../utils/apiError.js';
import * as settingsRepo from './settings.repository.js';

// ── General Settings (Tenant Level) ──

export const getGeneralSettings = async (tenantId: string) => {
    const tenant = await settingsRepo.findTenantById(tenantId);
    if (!tenant) throw new AppError('Tenant not found', 404);

    const settings = tenant.settings || {};
    const general = settings.general || {};

    return {
        businessName: tenant.name || '',
        businessEmail: general.businessEmail || '',
        timezone: general.timezone || 'UTC',
        language: general.language || 'en',
        dateFormat: general.dateFormat || 'MM/DD/YYYY',
        currency: general.currency || 'USD',
    };
};

export const updateGeneralSettings = async (tenantId: string, data: any) => {
    const tenant = await settingsRepo.findTenantById(tenantId);
    if (!tenant) throw new AppError('Tenant not found', 404);

    const settings = tenant.settings || {};
    const general = settings.general || {};

    const updatedGeneral = {
        ...general,
        businessEmail: data.businessEmail ?? general.businessEmail,
        timezone: data.timezone ?? general.timezone,
        language: data.language ?? general.language,
        dateFormat: data.dateFormat ?? general.dateFormat,
        currency: data.currency ?? general.currency,
    };

    const updated = await settingsRepo.updateTenant(tenantId, {
        name: data.businessName ?? tenant.name,
        settings: { ...settings, general: updatedGeneral },
    });

    return {
        businessName: updated!.name,
        ...updatedGeneral,
    };
};

// ── Profile Settings (User Level) ──

export const getProfileSettings = async (userId: string) => {
    const user = await settingsRepo.findUserById(userId);
    if (!user) throw new AppError('User not found', 404);

    const profile = user.profile || {};

    return {
        name: user.name || '',
        email: user.email || '',
        phone: profile.phone || '',
        avatarUrl: profile.avatarUrl || null,
        role: user.role || 'user',
    };
};

export const updateProfileSettings = async (userId: string, data: any) => {
    const user = await settingsRepo.findUserById(userId);
    if (!user) throw new AppError('User not found', 404);

    const profile = user.profile || {};

    const updatedProfile = {
        ...profile,
        phone: data.phone ?? profile.phone,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : profile.avatarUrl,
    };

    const updated = await settingsRepo.updateUser(userId, {
        name: data.name ?? user.name,
        profile: updatedProfile,
    });

    return {
        name: updated!.name,
        email: updated!.email,
        role: updated!.role,
        phone: updatedProfile.phone || '',
        avatarUrl: updatedProfile.avatarUrl || null,
    };
};

// ── Notification Settings (User Level) ──

export const getNotificationSettings = async (userId: string) => {
    const user = await settingsRepo.findUserById(userId);
    if (!user) throw new AppError('User not found', 404);

    const notifications = (user.profile || {}).notifications || {};

    return {
        emailNotifications: notifications.emailNotifications ?? true,
        pushNotifications: notifications.pushNotifications ?? true,
        whatsappAlerts: notifications.whatsappAlerts ?? false,
        dailyDigest: notifications.dailyDigest ?? false,
        weeklyReport: notifications.weeklyReport ?? true,
        alertOnNewLead: notifications.alertOnNewLead ?? true,
        alertOnConversation: notifications.alertOnConversation ?? true,
    };
};

export const updateNotificationSettings = async (userId: string, data: any) => {
    const user = await settingsRepo.findUserById(userId);
    if (!user) throw new AppError('User not found', 404);

    const profile = user.profile || {};
    const updatedNotifications = { ...(profile.notifications || {}), ...data };

    const updated = await settingsRepo.updateUser(userId, {
        profile: { ...profile, notifications: updatedNotifications },
    });

    const n = (updated!.profile || {}).notifications || {};
    return {
        emailNotifications: n.emailNotifications ?? true,
        pushNotifications: n.pushNotifications ?? true,
        whatsappAlerts: n.whatsappAlerts ?? false,
        dailyDigest: n.dailyDigest ?? false,
        weeklyReport: n.weeklyReport ?? true,
        alertOnNewLead: n.alertOnNewLead ?? true,
        alertOnConversation: n.alertOnConversation ?? true,
    };
};

// ── API Keys (placeholder) ──

export const getApiKeys = async (_tenantId: string) => {
    return [];
};
