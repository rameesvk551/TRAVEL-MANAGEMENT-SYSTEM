import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.validation.js';

/**
 * Auth routes factory.
 */
export function createAuthRoutes(controller: AuthController): Router {
    const router = Router();

    router.post('/register', validate(registerSchema), controller.register);
    router.post('/login', validate(loginSchema), controller.login);
    router.post('/forgot-password', validate(forgotPasswordSchema), controller.forgotPassword);
    router.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword);
    router.get('/me', controller.me);

    return router;
}
