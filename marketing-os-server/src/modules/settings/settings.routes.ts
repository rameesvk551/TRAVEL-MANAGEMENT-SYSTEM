import { Router } from 'express';
import * as settingsController from './settings.controller.js';

export function createSettingsRoutes(dependencies: {
    authMiddleware: any;
    tenantMiddleware: any;
}) {
    const router = Router();
    const { authMiddleware, tenantMiddleware } = dependencies;

    router.use(authMiddleware);
    router.use(tenantMiddleware);

    // ── General Settings ──
    router.get('/general', settingsController.getGeneralSettings);
    router.put('/general', settingsController.updateGeneralSettings);

    // ── Profile Settings ──
    router.get('/profile', settingsController.getProfileSettings);
    router.put('/profile', settingsController.updateProfileSettings);

    // ── Notification Settings ──
    router.get('/notifications', settingsController.getNotificationSettings);
    router.put('/notifications', settingsController.updateNotificationSettings);

    // ── API Keys ──
    router.get('/api-keys', settingsController.getApiKeys);

    return router;
}
