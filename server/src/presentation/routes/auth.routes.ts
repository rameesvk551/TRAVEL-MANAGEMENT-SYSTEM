import { Router, RequestHandler } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { validateBody } from '../middleware/index.js';
import { registerSchema, loginSchema } from '../validators/index.js';

interface AuthRoutesDeps {
    authController: AuthController;
    authMiddleware: RequestHandler;
}

export function createAuthRoutes(deps: AuthRoutesDeps): Router {
    const router = Router();

    // Public routes
    router.post('/register', validateBody(registerSchema), deps.authController.register);
    router.post('/login', validateBody(loginSchema), deps.authController.login);

    // Protected routes
    router.get('/me', deps.authMiddleware, deps.authController.me);

    return router;
}
