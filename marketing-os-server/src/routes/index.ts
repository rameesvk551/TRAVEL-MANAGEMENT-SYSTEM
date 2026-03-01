import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { createRouter as createWhatsAppRouter } from '../modules/whatsapp/whatsapp.router.js';
import { createRouter as createSettingsRouter } from '../modules/settings/settings.router.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/whatsapp', createWhatsAppRouter());
router.use('/settings', createSettingsRouter());

export default router;