import type { Request, Response, NextFunction } from 'express';
import * as settingsService from './settings.service.js';

// ── General Settings ──

export const getGeneralSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const data = await settingsService.getGeneralSettings(tenantId);
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

export const updateGeneralSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const data = await settingsService.updateGeneralSettings(tenantId, req.body);
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

// ── Profile Settings ──

export const getProfileSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id || (req as any).context?.userId;
        const data = await settingsService.getProfileSettings(userId);
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

export const updateProfileSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id || (req as any).context?.userId;
        const data = await settingsService.updateProfileSettings(userId, req.body);
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

// ── Notification Settings ──

export const getNotificationSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id || (req as any).context?.userId;
        const data = await settingsService.getNotificationSettings(userId);
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

export const updateNotificationSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id || (req as any).context?.userId;
        const data = await settingsService.updateNotificationSettings(userId, req.body);
        res.json({ data });
    } catch (error) {
        next(error);
    }
};

// ── API Keys ──

export const getApiKeys = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).context?.tenantId;
        const data = await settingsService.getApiKeys(tenantId);
        res.json({ data });
    } catch (error) {
        next(error);
    }
};
